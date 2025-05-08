import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
  AppState,
} from 'react-native';
import axios from 'axios';
import messaging from '@react-native-firebase/messaging';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';

const ChatScreen = ({ navigation, route }) => {
  const { request_id, senderType, profileImage, profileName } = route.params;
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const scrollViewRef = useRef(null);

  // Log initial parameters for debugging
  useEffect(() => {
    console.log('ChatScreen parameters:', {
      request_id,
      senderType,
      profileImage,
      profileName,
    });
  }, [request_id, senderType, profileImage, profileName]);

  // Memoized function to fetch messages
  const fetchMessages = useCallback(async () => {
    try {
      console.log(`Fetching messages for request_id: ${request_id}`);
      const response = await axios.get(
        'https://backend.clicksolver.com/api/worker/getMessages',
        {
          params: { request_id },
        }
      );
      console.log('Fetched Messages:', response.data.messages);
      setMessages(response.data.messages);
      // Scroll to bottom after a short delay
      setTimeout(() => scrollToBottom(), 100);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, [request_id]);

  // Function to scroll to the bottom of the chat content
  const scrollToBottom = useCallback(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, []);

  // useFocusEffect to fetch messages when the screen is focused
  useFocusEffect(
    useCallback(() => {
      console.log('ChatScreen focused. Fetching messages...');
      fetchMessages();
    }, [fetchMessages])
  );

  // Listen for incoming FCM messages in the foreground
  useEffect(() => {
    const unsubscribeForeground = messaging().onMessage(
      async (remoteMessage) => {
        console.log(
          'FCM notification received in ChatScreen (foreground):',
          remoteMessage
        );
        if (remoteMessage.data?.request_id === String(request_id)) {
          console.log('Request id matches. Fetching new messages...');
          fetchMessages();
        }
      }
    );
    return () => unsubscribeForeground();
  }, [fetchMessages, request_id]);

  // Listen for app state changes to fetch messages when coming from background
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'active') {
        console.log('App moved to foreground. Fetching messages...');
        fetchMessages();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [fetchMessages]);

  // Handle background messages (for when the app is not in the foreground)
  useEffect(() => {
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('FCM notification received in background:', remoteMessage);
      if (remoteMessage.data?.request_id === String(request_id)) {
        fetchMessages();
      }
    });
  }, [fetchMessages, request_id]);

  const sendMessage = async () => {
    if (!message.trim()) return;
    try {
      console.log('Sending message:', message);
      await axios.post('https://backend.clicksolver.com/api/send/message/user', {
        request_id,
        senderType,
        message,
      });
      console.log('Message sent successfully.');
      // Append the new message locally with key: senderType
      setMessages((prevMessages) => [
        ...prevMessages,
        { message, key: senderType, timestamp: Date.now() },
      ]);
      setMessage('');
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Image source={{ uri: profileImage }} style={styles.profileImage} />
        <Text style={styles.headerTitle}>{profileName}</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.chatContent}
          onContentSizeChange={scrollToBottom}
        >
          {messages.map((item, index) => {
            // If the message is from the worker, it will be aligned to the right.
            const isWorker = item.key?.toLowerCase() === 'worker';
            return (
              <View
                key={index.toString()}
                style={[
                  styles.messageContainer,
                  isWorker ? styles.workerMessage : styles.userMessage,
                ]}
              >
                <Text style={styles.messageText}>{item.message}</Text>
                <Text style={styles.timestamp}>
                  {new Date(item.timestamp).toLocaleTimeString()}
                </Text>
              </View>
            );
          })}
        </ScrollView>

        {/* Input Field & Send Button */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={message}
            onChangeText={setMessage}
            placeholder="Type a message ....."
            placeholderTextColor="#888"
          />
          <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
            <Icon name="send" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#128C7E',
  },
  header: {
    height: 60,
    backgroundColor: '#128C7E',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    // No marginTop here, so the header remains 60px tall
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: 10,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  container: {
    flex: 1,
    backgroundColor: '#e5ddd5',
  },
  chatContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    padding: 10,
  },
  messageContainer: {
    maxWidth: '80%',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  workerMessage: {
    backgroundColor: '#fff',
    alignSelf: 'flex-end',
  },
  userMessage: {
    backgroundColor: '#dcf8c6',
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: 16,
    color: '#000',
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    textAlign: 'right',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderTopWidth: 1,
    borderColor: '#ddd',
  },
  input: {
    flex: 1,
    fontSize: 16,
    padding: 10,
    backgroundColor: '#f2f2f2',
    borderRadius: 25,
    color: '#000',
  },
  sendButton: {
    backgroundColor: '#128C7E',
    borderRadius: 25,
    padding: 10,
    marginLeft: 10,
  },
});

import axios from 'axios';
import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import EncryptedStorage from 'react-native-encrypted-storage';
import uuid from 'react-native-uuid';
import {useNavigation} from '@react-navigation/native';

const Notifications = () => {
  const [notificationsArray, setNotificationsArray] = useState([]);
  const navigation = useNavigation();

  // Fetch notifications from local storage
  const fetchNotifications = async () => {
    const existingNotifications = await EncryptedStorage.getItem(
      'Requestnotifications',
    );
    if (existingNotifications) {
      setNotificationsArray(JSON.parse(existingNotifications));
    } else {
      console.log('No notifications found.');
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Handle the notification click
  const handleNotificationClick = data => {
    const {screen, targetUrl} = data; // Extract the screen or target URL from the notification data
    console.log('Navigating to:', screen);

    // Navigate based on the notification's data
    if (screen) {
      navigation.navigate(screen, {
        userNotificationId: data.user_notification_id,
      });
    } else if (targetUrl) {
      navigation.navigate('WebViewScreen', {url: targetUrl}); // Example of opening a WebView
    } else {
      console.log('No screen or targetUrl found.');
    }
  };

  // Render each notification
  // const renderItem = ({ item }) => (
  //   <View style={styles.messageBox}>
  //     <View style={styles.serviceCostContainer}>
  //       <View>
  //         <Text style={styles.secondaryColor}>Service</Text>
  //         <Text style={styles.primaryColor}>{item.title}</Text>
  //       </View>
  //       <View>
  //         <Text style={styles.secondaryColor}>Cost</Text>
  //         <Text style={styles.primaryColor}>{item.data?.cost || 'N/A'}</Text>
  //       </View>
  //     </View>
  //     <View>
  //       <Text style={styles.secondaryColor}>Location</Text>
  //       <Text style={styles.primaryColor}>{item.body}</Text>
  //       <Text style={[styles.secondaryColor,{paddingTop:5}]}>{item.data.time}</Text>
  //     </View>
  //     <View style={styles.buttonsContainer}>
  //       <View>
  //         <Text style={styles.secondaryColor}>Reject</Text>
  //         </View>
  //         <View>
  //           <TouchableOpacity
  //             style={styles.secondaryButton}
  //             onPress={() => acceptRequest(notification.data.user_notification_id)} // Pass item.data to acceptRequest
  //             >
  //           <Text style={styles.secondaryButtonText}>Accept</Text>
  //           </TouchableOpacity>
  //         </View>
  //       </View>
  //   </View>
  // );

  const renderItem = ({item}) => {
    let parsedTitle;
    let totalCost = 0;
    try {
      parsedTitle = JSON.parse(item.title);
      console.log(parsedTitle);
      totalCost = parsedTitle.reduce((accumulator, service) => {
        return accumulator + (service.cost || 0); // Default to 0 if cost is undefined
      }, 0);
    } catch (error) {
      console.error('Error parsing title:', error);
      parsedTitle = []; // Default to an empty array if parsing fails
    }
    return (
      <View style={styles.messageBox}>
        <View style={styles.serviceCostContainer}>
          <View>
            <Text style={styles.secondaryColor}>Service</Text>
            <View style={styles.serviceNamesContainer}>
              {/* Map over the parsed title if it's an array */}
              {Array.isArray(parsedTitle) ? (
                parsedTitle.map((service, serviceIndex) => (
                  <View key={serviceIndex}>
                    <Text key={serviceIndex} style={styles.primaryColor}>
                      {service.serviceName}
                      {serviceIndex < parsedTitle.length - 1 ? ', ' : ''}{' '}
                      {/* Add comma except for the last item */}
                    </Text>
                  </View>
                ))
              ) : (
                <Text>No services available</Text> // Fallback if parsedTitle is not an array
              )}
            </View>
          </View>
          <View>
            <Text style={styles.secondaryColor}>Cost</Text>
            <Text style={styles.primaryColor}>{totalCost}</Text>
          </View>
        </View>
        <View>
          <Text style={styles.secondaryColor}>Location</Text>
          <Text style={styles.primaryColor}>{item.body}</Text>
          <Text
            style={[
              styles.secondaryColor,
              {paddingTop: 5, textAlign: 'right'},
            ]}>
            {item.data.time}
          </Text>
        </View>
        <View style={styles.buttonsContainer}>
          <View>
            <Text style={styles.secondaryColor}>Reject</Text>
          </View>
          <View>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() =>
                acceptRequest(notification.data.user_notification_id)
              } // Pass item.data to acceptRequest
            >
              <Text style={styles.secondaryButtonText}>Accept</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.screenContainer}>
      <View style={styles.container}>
        <View style={styles.headContainer}>
          <View style={styles.header}>
            <Text style={styles.screenName}>Notifications</Text>
          </View>
        </View>
        <View style={styles.notificationsList}>
          <FlatList
            data={notificationsArray}
            renderItem={renderItem}
            keyExtractor={item => uuid.v4()} // Unique key for each notification
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const screenWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
  messageBox: {
    height: 220,
    backgroundColor: '#fff',
    marginTop: 20,
    borderRadius: 10,

    padding: 20,
    flexDirection: 'column',
    gap: 15,
  },
  serviceCostContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  secondaryColor: {
    color: '#9e9e9e',
    fontSize: 16,
  },
  primaryColor: {
    color: '#212121',
    fontSize: 15,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  serviceNamesContainer: {
    flexDirection: 'row',
  },
  secondaryButton: {
    backgroundColor: '#FF5722',
    width: 120,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  notificationsList: {
    padding: 20,
  },
  screenContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingBottom: 120,
  },
  container: {
    backgroundColor: '#F5F5F5',
  },
  screenName: {
    color: '#1D2951',
    fontSize: 19,
    fontWeight: 'bold',
  },
  headContainer: {
    backgroundColor: '#F6F6F6',
    padding: 20,
  },
  header: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Notifications;

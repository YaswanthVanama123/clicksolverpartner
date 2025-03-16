import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  useWindowDimensions,
  Linking,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';

const supportSections = [
  {
    id: 'service',
    title: 'Service Issues',
    description: 'Having trouble with a job request or service details?',
  },
  {
    id: 'payment',
    title: 'Payment Problems',
    description: 'Issues with payments, invoices, or payouts?',
  },
  {
    id: 'usage',
    title: 'How to Use the App',
    description: 'Need guidance on using the app features?',
  },
  {
    id: 'account',
    title: 'Account & Verification',
    description: 'Problems with your profile, ID verification, or account settings?',
  },
  {
    id: 'other',
    title: 'Other Queries',
    description: 'Any other questions or technical issues?',
  },
];

const WorkerHelpScreen = () => {
  const { width } = useWindowDimensions();
  const { isDarkMode } = useTheme();
  const styles = dynamicStyles(width, isDarkMode);

  // Function to handle when a section is pressed
  const handleSectionPress = (sectionTitle) => {
    Alert.alert(
      'Support',
      `You selected the "${sectionTitle}" section.\nA support agent will contact you shortly.`,
      [{ text: 'OK' }]
    );
  };

  // Function to handle phone call press from floating button
  const handlePhoneCallPress = () => {
    // Update with your support phone number
    Linking.openURL('tel:+919392365494');
  };

  // Function to handle help press (if you want to show a help modal, for example)
  const handleHelpPress = () => {
    Alert.alert(
      'Need Help?',
      'Please contact our support team via phone or email.',
      [
        { text: 'Call', onPress: handlePhoneCallPress },
        { text: 'Email', onPress: () => Linking.openURL('mailto:customer.support@gmail.com') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity>
          <Ionicons name="arrow-back" size={24} color={isDarkMode ? '#fff' : '#212121'} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <TouchableOpacity>
          <Ionicons name="chatbubble-ellipses-outline" size={24} color="#ff4500" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.mainTitle}>How can we help you?</Text>
        <Text style={styles.subTitle}>
          Select the category that best describes your issue.
        </Text>

        {supportSections.map((section) => (
          <TouchableOpacity
            key={section.id}
            style={styles.card}
            onPress={() => handleSectionPress(section.title)}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{section.title}</Text>
              <Ionicons name="chevron-forward" size={20} color="#888" />
            </View>
            <Text style={styles.cardDescription}>{section.description}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Floating Call Icon */}
      <TouchableOpacity style={styles.floatingCallButton} onPress={handlePhoneCallPress}>
        <Ionicons name="call" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Optional: If you want the Help text to show the help modal */}
      <TouchableOpacity style={styles.helpButton} onPress={handleHelpPress}>
        <Text style={styles.helpButtonText}>Help</Text>
      </TouchableOpacity>
    </View>
  );
};

function dynamicStyles(width, isDarkMode) {
  const isTablet = width >= 600;
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#121212' : '#f5f5f5',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: isTablet ? 24 : 20,
      paddingVertical: isTablet ? 16 : 12,
      backgroundColor: isDarkMode ? '#121212' : '#ffffff',
      elevation: 3,
    },
    headerTitle: {
      fontSize: isTablet ? 22 : 20,
      fontWeight: '600',
      color: isDarkMode ? '#fff' : '#212121',
      textAlign: 'center',
      flex: 1,
    },
    scrollContainer: {
      flexGrow: 1,
      paddingVertical: isTablet ? 30 : 25,
      paddingHorizontal: isTablet ? 24 : 20,
    },
    mainTitle: {
      fontSize: isTablet ? 26 : 22,
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: isTablet ? 12 : 10,
      color: isDarkMode ? '#fff' : '#212121',
    },
    subTitle: {
      fontSize: isTablet ? 18 : 16,
      textAlign: 'center',
      marginBottom: isTablet ? 24 : 20,
      color: isDarkMode ? '#ccc' : '#555',
    },
    card: {
      backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff',
      borderRadius: 12,
      padding: isTablet ? 20 : 16,
      marginBottom: isTablet ? 20 : 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 5,
      elevation: 2,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: isTablet ? 10 : 8,
    },
    cardTitle: {
      fontSize: isTablet ? 20 : 18,
      fontWeight: '600',
      color: isDarkMode ? '#fff' : '#212121',
    },
    cardDescription: {
      fontSize: isTablet ? 16 : 14,
      color: isDarkMode ? '#ccc' : '#666',
    },
    floatingCallButton: {
      position: 'absolute',
      bottom: 30,
      right: 20,
      backgroundColor: '#FF5C00',
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 5,
    },
    // Optional help button style (if you want a help text button at the bottom)
    helpButton: {
      position: 'absolute',
      bottom: 30,
      left: 20,
      backgroundColor: '#FF5722',
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 20,
      elevation: 5,
    },
    helpButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
  });
}

export default WorkerHelpScreen;

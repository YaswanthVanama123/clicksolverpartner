import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LottieView from 'lottie-react-native';
// Import theme hook from your context
import { useTheme } from '../context/ThemeContext';

const TaskCompletionScreen = () => {
  // Get the current theme flag from context
  const { isDarkMode } = useTheme();
  // Generate dynamic styles based on theme
  const styles = dynamicStyles();

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#000' : '#fff' }]}>
      {/* Back Arrow */}
      <TouchableOpacity style={styles.backArrow}>
        <Icon name="arrow-back" size={24} color={isDarkMode ? '#fff' : "#000"} />
      </TouchableOpacity>

      {/* Checkmark Animation */}
      <LottieView
        source={require('../assets/success.json')}
        autoPlay
        loop
        style={styles.loadingAnimation}
      />
 
      {/* Title and Subtitle */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      <Text style={[styles.title, { color: isDarkMode ? '#fff' : '#333' }]}>
        Work Completion request !
      </Text>
      <Text style={[styles.subtitle, { color: isDarkMode ? '#ccc' : '#666' }]}>
        Please confirm the completion of the service. Click confirm
      </Text>

      {/* Payment Summary */}
      <View style={[styles.summaryContainer, { backgroundColor: isDarkMode ? '#222' : '#f9f9f9' }]}>
        <Text style={[styles.summaryTitle, { color: isDarkMode ? '#fff' : '#212121' }]}>
          Payment Summary
        </Text>
     
          <View style={styles.summaryItem}>
            <Text style={{ color: isDarkMode ? '#fff' : '#000' }}>AC Servicing</Text>
            <Text style={{ color: isDarkMode ? '#fff' : '#000' }}>₹ 500.00</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={{ color: isDarkMode ? '#fff' : '#000' }}>GST (5%)</Text>
            <Text style={{ color: isDarkMode ? '#fff' : '#000' }}>₹ 25.00</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={{ color: isDarkMode ? '#fff' : '#000' }}>CGST (5%)</Text>
            <Text style={{ color: isDarkMode ? '#fff' : '#000' }}>₹ 25.00</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={{ color: isDarkMode ? '#fff' : '#000' }}>Cashback</Text>
            <Text style={styles.negativeText}>- ₹ 25.00</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryItem}>
            <Text style={styles.totalText}>Grand Total</Text>
            <Text style={styles.totalText}>₹ 525.00</Text>
          </View>
 
      </View>  

      {/* Confirm Button */}
      <TouchableOpacity style={styles.confirmButton}>
        <Text style={styles.buttonText}>Work completed</Text>
      </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const dynamicStyles = () =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: 16,
      paddingTop: 20,
    },
    backArrow: {
      position: 'absolute',
      top: 10,
      left: 10,
      zIndex: 1,
    },
    loadingAnimation: {
      width: '100%',
      height: 200,
      marginTop: 50,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      textAlign: 'center',
      marginTop: 20,
    },
    subtitle: {
      fontSize: 14,
      textAlign: 'center',
      marginBottom: 20,
    },
    summaryContainer: {
      borderRadius: 10,
      padding: 16,
      marginBottom: 20,
      elevation: 2,
    },
    summaryTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 10,
    },
    scrollView: {
      maxHeight: 150,
    },
    summaryItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 4,
    },
    negativeText: {
      color: 'red',
    },
    divider: {
      borderBottomWidth: 1,
      borderBottomColor: '#ddd',
      marginVertical: 8,
    },
    totalText: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    confirmButton: {
      backgroundColor: '#ff4500',
      paddingVertical: 12,
      borderRadius: 25,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    buttonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
    },
  });

export default TaskCompletionScreen;

import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  BackHandler,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import axios from 'axios';
import { useNavigation, CommonActions, useFocusEffect } from '@react-navigation/native';
import Entypo from 'react-native-vector-icons/Entypo';

// Image URLs
const BG_IMAGE_URL = 'https://i.postimg.cc/rFFQLGRh/Picsart-24-10-01-15-38-43-205.jpg';
const LOGO_URL = 'https://i.postimg.cc/hjjpy2SW/Button-1.png';
const FLAG_ICON_URL = 'https://i.postimg.cc/C1hkm5sR/india-flag-icon-29.png';

// Import theme hook
import { useTheme } from '../context/ThemeContext';

const WorkerLoginScreen = () => {
  const { width } = useWindowDimensions();
  const { isDarkMode } = useTheme();
  const styles = dynamicStyles(width, isDarkMode);

  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigation = useNavigation();

  // Override hardware back to go to Home screen
  // useFocusEffect(
  //   useCallback(() => {
  //     const onBackPress = () => {
  //       navigation.dispatch(
  //         CommonActions.reset({
  //           index: 0,
  //           routes: [{ name: 'Tabs', state: { routes: [{ name: 'Home' }] } }],
  //         })
  //       );
  //       return true;
  //     };
  //     BackHandler.addEventListener('hardwareBackPress', onBackPress);
  //     return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
  //   }, [navigation])
  // );

  // Auto-hide error message after 5 seconds
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  // Send OTP to worker's phone
  const sendOtp = async () => {
    if (!phoneNumber) return;
    setLoading(true);
    try {
      const response = await axios.post(
        'https://backend.clicksolver.com/api/partner/sendOtp',
        { mobileNumber: phoneNumber }
      );
      if (response.status === 200) {
        const { verificationId } = response.data;
        navigation.navigate('WorkerOtpVerificationScreen', { phoneNumber, verificationId });
      } else {
        setErrorMessage('Failed to send OTP. Please try again.');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      setErrorMessage('Error sending OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Background Image */}
      <ImageBackground
        source={{ uri: BG_IMAGE_URL }}
        style={StyleSheet.absoluteFillObject}
        resizeMode="stretch"
      />

      {/* Error Message */}
      {errorMessage !== '' && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <TouchableOpacity onPress={() => setErrorMessage('')}>
            <Entypo name="cross" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* KeyboardAvoidingView with behavior "none" */}
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior="none"
      >
        <View style={styles.contentOverlay}>
          {/* Logo + Headings */}
          <View style={styles.description}>
            <View style={styles.logoContainer}>
              <Image source={{ uri: LOGO_URL }} style={styles.logo} />
              <Text style={styles.heading}>
                Click <Text style={styles.solverText}>Solver</Text>
              </Text>
            </View>
            <Text style={styles.subheading}>ALL HOME Service Expert</Text>
            <Text style={styles.tagline}>Instant Affordable Trusted</Text>
          </View>

          {/* Input Container */}
          <View style={styles.inputContainer}>
            <View style={styles.countryCodeContainer}>
              <Image source={{ uri: FLAG_ICON_URL }} style={styles.flagIcon} />
              <Text style={styles.picker}>+91</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Enter Mobile Number"
              placeholderTextColor={isDarkMode ? '#cccccc' : '#9e9e9e'}
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
            />
          </View>

          {/* Button */}
          <TouchableOpacity style={styles.button} onPress={sendOtp} disabled={loading}>
            <Text style={styles.buttonText}>Send OTP</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#FF5720" />
        </View>
      )}
    </SafeAreaView>
  );
}

/**
 * DYNAMIC STYLES
 */
function dynamicStyles(width, isDarkMode) {
  const isTablet = width >= 600;
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#121212' : '#ffffff',
    },
    keyboardAvoidingView: {
      flex: 1,
    },
    solverText: {
      color: isDarkMode ? '#212121' : '#212121',
      fontWeight: 'bold',
    },
    description: {
      flexDirection: 'column',
      marginLeft: isTablet ? 12 : 10,
      alignItems: 'center',
    },
    contentOverlay: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: isTablet ? 24 : 20,
    },
    logoContainer: {
      flexDirection: 'row',
      gap: 10,
      alignItems: 'center',
      marginBottom: 10,
    },
    logo: {
      width: isTablet ? 70 : 60,
      height: isTablet ? 70 : 60,
    },
    heading: {
      fontSize: isTablet ? 30 : 26,
      lineHeight: isTablet ? 30 : 26,
      fontWeight: 'bold',
      color: isDarkMode ? '#212121' : '#212121',
      width: isTablet ? 120 : 100,
    },
    subheading: {
      fontSize: isTablet ? 18 : 16,
      fontWeight: 'bold',
      color: isDarkMode ? '#333' : '#333',
    },
    tagline: {
      fontSize: isTablet ? 16 : 14,
      color: isDarkMode ? '#cccccc' : '#666',
      textAlign: 'center',
      paddingBottom: isTablet ? 80 : 70,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode ? '#222222' : '#fff',
      borderRadius: 10,
      paddingHorizontal: isTablet ? 12 : 10,
      marginBottom: 20,
      width: '100%',
      height: isTablet ? 60 : 56,
      elevation: 5,
    },
    countryCodeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRightWidth: 1,
      borderColor: '#ccc',
      paddingRight: isTablet ? 12 : 10,
      width: isTablet ? 90 : 80,
    },
    flagIcon: {
      width: isTablet ? 28 : 24,
      height: isTablet ? 28 : 24,
    },
    picker: {
      fontSize: isTablet ? 19 : 17,
      color: isDarkMode ? '#ffffff' : '#212121',
      padding: 10,
      fontWeight: 'bold',
    },
    input: {
      flex: 1,
      height: isTablet ? 60 : 56,
      paddingLeft: 10,
      color: isDarkMode ? '#ffffff' : '#212121',
      fontSize: isTablet ? 18 : 16,
      fontWeight: 'bold',
    },
    button: {
      backgroundColor: '#FF5722',
      paddingVertical: isTablet ? 18 : 15,
      paddingHorizontal: isTablet ? 55 : 50,
      borderRadius: 10,
      alignItems: 'center',
      width: '100%',
      elevation: 5,
      marginTop: 25,
    },
    buttonText: {
      color: '#ffffff',
      fontSize: isTablet ? 18 : 16,
      fontWeight: 'bold',
    },
    errorContainer: {
      position: 'absolute',
      top: isTablet ? 50 : 40,
      left: isTablet ? 30 : 20,
      right: isTablet ? 30 : 20,
      backgroundColor: 'red',
      padding: 10,
      borderRadius: 5,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      zIndex: 1000,
    },
    errorText: {
      color: '#fff',
      fontSize: isTablet ? 16 : 14,
      flex: 1,
      marginRight: 10,
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2000,
    },
  });
}

export default WorkerLoginScreen; 

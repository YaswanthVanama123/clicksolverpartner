import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  ActivityIndicator,
  useWindowDimensions,
  BackHandler,
} from 'react-native';
import axios from 'axios';
import EncryptedStorage from 'react-native-encrypted-storage';
import { useNavigation, CommonActions, useRoute } from '@react-navigation/native';
import Entypo from 'react-native-vector-icons/Entypo';
// Import theme hook from your context
import { useTheme } from '../context/ThemeContext';

const BG_IMAGE_URL =
  'https://i.postimg.cc/zB1C8frj/Picsart-24-10-01-15-26-57-512-1.jpg';

const WorkerOtpVerificationScreen = () => {
  const { width } = useWindowDimensions();
  // Get dark mode flag
  const { isDarkMode } = useTheme();
  const styles = dynamicStyles(width, isDarkMode);

  const [timer, setTimer] = useState(120);
  const [code, setCode] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigation = useNavigation();
  const route = useRoute();
  const { phoneNumber, verificationId } = route.params;

  // Refs for each OTP digit
  const inputRefs = useRef([]);

  // Start the countdown
  useEffect(() => {
    const countdown = setInterval(() => {
      setTimer(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(countdown);
  }, []);

  // Hide error after 5 seconds
  useEffect(() => {
    if (errorMessage) {
      const timerId = setTimeout(() => setErrorMessage(''), 5000);
      return () => clearTimeout(timerId);
    }
  }, [errorMessage]);

  // Update code array
  const handleCodeChange = useCallback(
    (index, value) => {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);
    },
    [code]
  );

  // Format timer (mm:ss)
  const formattedTime = () => {
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    return `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
  };

  // Verify OTP => if valid, then login
  const verifyOtp = async () => {
    const otpCode = code.join('');
    if (otpCode.length < 4) {
      setErrorMessage('Please enter the complete 4-digit OTP');
      return;
    }
    setLoading(true);
    try {
      // Validate OTP
      const validateResponse = await axios.get(
        'https://backend.clicksolver.com/api/partner/validateOtp',
        {
          params: {
            mobileNumber: phoneNumber, 
            verificationId,
            otpCode,
          },
        }
      );
      if (validateResponse.data.message === 'OTP Verified') {
        // If valid, attempt Worker login
        const loginResponse = await axios.post(
          'https://backend.clicksolver.com/api/worker/login',
          { phone_number: phoneNumber }
        );
        const { status, data } = loginResponse;
        if (status === 200) {
          const { token, workerId } = data;
          if (token && workerId) {
            await EncryptedStorage.setItem('pcs_token', token);
            await EncryptedStorage.setItem('partnerSteps', 'completed');
            await EncryptedStorage.setItem('unique', String(workerId));
            await EncryptedStorage.setItem('verification', 'true');
            const onboardingContent = await EncryptedStorage.getItem("WorkerOnboardingScreen")
            if(onboardingContent){
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'Tabs', state: { routes: [{ name: 'Home' }] } }],
                })
              );
            }else {
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'WorkerOnboardingScreen' }],
                })
              );
            }

          }
        } else if (status === 201) {
          const { token, workerId, stepsCompleted } = data;
          if (workerId && token) {
            await EncryptedStorage.setItem('pcs_token', token);
            await EncryptedStorage.setItem('unique', String(workerId));
            if (stepsCompleted) {
              await EncryptedStorage.setItem('partnerSteps', 'completed');
              navigation.replace('ApprovalScreen');
            } else {
              navigation.replace('PartnerSteps');
            }
          }
        } else if (status === 202) {
          // Possibly an admin scenario
          navigation.replace('AdministratorDashboard');
        } else {
          const { phone_number } = data;
          if (phone_number) {
            navigation.push('SignupDetails', { phone_number });
          }
        }
      } else {
        setErrorMessage('Invalid OTP. Please try again.');
      }
    } catch (error) {
      console.error('Error verifying OTP or during login:', error);
      setErrorMessage('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ flex: 1 }}>
        {/* Background Image */}
        <Image
          source={{ uri: BG_IMAGE_URL }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="stretch"
        />

        {/* Error Banner */}
        {errorMessage !== '' && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <TouchableOpacity onPress={() => setErrorMessage('')}>
              <Entypo name="cross" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.container}>
          <Text style={styles.title}>Verification Code</Text>
          <Text style={styles.instruction}>Please enter the 4-digit code sent to</Text>
          <Text style={styles.number}>{phoneNumber}</Text>

          {/* OTP Inputs */}
          <View style={styles.codeContainer}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={ref => (inputRefs.current[index] = ref)}
                style={styles.codeInput}
                keyboardType="numeric"
                maxLength={1}
                value={digit}
                onChangeText={value => {
                  handleCodeChange(index, value);
                  if (value && index < code.length - 1) {
                    inputRefs.current[index + 1].focus();
                  }
                }}
                onKeyPress={({ nativeEvent }) => {
                  if (
                    nativeEvent.key === 'Backspace' &&
                    code[index] === '' &&
                    index > 0
                  ) {
                    inputRefs.current[index - 1].focus();
                  }
                }}
              />
            ))}
          </View>

          <Text style={styles.timer}>{formattedTime()}</Text>

          {/* Verify Button or Loader */}
          {loading ? (
            <ActivityIndicator size="large" color="#FF5720" style={{ marginVertical: 20 }} />
          ) : (
            <TouchableOpacity style={styles.submitButton} onPress={verifyOtp}>
              <Text style={styles.submitButtonText}>Verify OTP</Text>
            </TouchableOpacity>
          )}

          {/* Contact Info */}
          <View style={styles.contactContainer}>
            <Text style={styles.contactText}>Contact us:</Text>
            <View style={styles.socialIcons}>
              <Entypo name="mail" size={15} color="#9e9e9e" />
              <Entypo name="facebook" size={15} color="#9e9e9e" />
              <Entypo name="instagram" size={15} color="#9e9e9e" />
            </View>
            <Text style={styles.email}>customer.support@clicksolver.com</Text>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
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
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: isTablet ? 40 : 20,
    },
    title: {
      fontSize: isTablet ? 26 : 22,
      fontWeight: 'bold',
      marginBottom: isTablet ? 25 : 20,
      color: isDarkMode ? '#212121' : '#212121',
    },
    instruction: {
      fontSize: isTablet ? 18 : 16,
      textAlign: 'center',
      color: isDarkMode ? '#cccccc' : '#9e9e9e',
    },
    number: {
      fontSize: isTablet ? 18 : 16,
      textAlign: 'center',
      marginBottom: isTablet ? 35 : 30,
      color: isDarkMode ? '#212121' : '#212121',
      fontWeight: 'bold',
    },
    codeContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      width: '80%',
      marginBottom: isTablet ? 25 : 20,
      gap: isTablet ? 15 : 10,
    },
    codeInput: {
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 10,
      width: isTablet ? 50 : 45,
      height: isTablet ? 50 : 45,
      textAlign: 'center',
      fontSize: isTablet ? 20 : 18,
      color: isDarkMode ? '#ffffff' : '#212121',
      backgroundColor: isDarkMode ? '#333333' : '#f9f9f9',
    },
    timer: {
      fontSize: isTablet ? 20 : 18,
      fontWeight: '800',
      marginBottom: isTablet ? 25 : 20,
      color: isDarkMode ? '#ffffff' : '#212121',
    },
    submitButton: {
      backgroundColor: '#FF5722',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: isTablet ? 18 : 15,
      paddingHorizontal: isTablet ? 50 : 40,
      borderRadius: 10,
      marginBottom: isTablet ? 50 : 40,
      width: '100%',
    },
    submitButtonText: {
      color: '#fff',
      fontSize: isTablet ? 18 : 16,
      fontWeight: 'bold',
    },
    contactContainer: {
      alignItems: 'center',
      marginTop: isTablet ? 20 : 10,
    },
    contactText: {
      fontSize: isTablet ? 18 : 16,
      marginBottom: 10,
      color: isDarkMode ? '#ffffff' : '#000',
    },
    socialIcons: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 5,
      marginBottom: 10,
    },
    email: {
      fontSize: isTablet ? 14 : 12,
      color: isDarkMode ? '#ffffff' : '#9e9e9e',
      paddingBottom: isTablet ? 40 : 30,
    },
    errorContainer: {
      position: 'absolute',
      top: isTablet ? 50 : 40,
      left: isTablet ? 40 : 20,
      right: isTablet ? 40 : 20,
      backgroundColor: 'red',
      padding: isTablet ? 12 : 10,
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
  });
}

export default WorkerOtpVerificationScreen;

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import axios from 'axios';
import EncryptedStorage from 'react-native-encrypted-storage';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import { useTheme } from '../context/ThemeContext';
// Import translation hook
import { useTranslation } from 'react-i18next';

const OTPVerification = ({ route }) => {
  const [otp, setOtp] = useState(Array(4).fill(''));
  const inputRefs = useRef([]);
  const { encodedId } = route.params;
  const navigation = useNavigation();
  const [decodedId, setDecodedId] = useState(null);
  const [error, setError] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const { isDarkMode } = useTheme();
  const styles = dynamicStyles(isDarkMode);
  const { t } = useTranslation();

  useEffect(() => {
    if (encodedId) {
      try {
        setDecodedId(atob(encodedId));
      } catch (error) {
        console.error('Error decoding Base64:', error);
      }
    }
  }, [encodedId]);

  const handleChange = (text, index) => {
    if (/^\d?$/.test(text)) {
      const newOtp = [...otp];
      newOtp[index] = text;
      setOtp(newOtp);
      if (text && index < otp.length - 1) {
        inputRefs.current[index + 1].focus();
      }
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const checkCancellationStatus = async () => {
    try {
      const response = await axios.get(
        `https://backend.clicksolver.com/api/worker/cancelled/status`,
        {
          params: { notification_id: decodedId },
        }
      );
  
      // If the record is not present (HTTP 205), perform the cancellation action and navigate home.
      if (response.status === 205) {
        // const pcs_token = await EncryptedStorage.getItem('pcs_token');
        // await axios.post(
        //   `https://backend.clicksolver.com/api/worker/action`,
        //   { encodedId: '', screen: '' },
        //   { headers: { Authorization: `Bearer ${pcs_token}` } }
        // );
  
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Tabs', state: { routes: [{ name: 'Home' }] } }],
          })
        );
      }
      // If response.status is 200 (record present), simply wait (do nothing).
    } catch (error) {
      console.error('Error checking cancellation status:', error);
    }
  };
  

  useEffect(() => {
    if (decodedId) {
      checkCancellationStatus();
    }
  }, [decodedId]);

  useEffect(() => {
    // Focus on the first input once the screen loads
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleSubmit = async () => {
    const enteredOtp = otp.join('');

    try {
      const jwtToken = await EncryptedStorage.getItem('pcs_token');
      const { data, status } = await axios.post(
        `https://backend.clicksolver.com/api/pin/verification`,
        { notification_id: decodedId, otp: enteredOtp },
        { headers: { Authorization: `Bearer ${jwtToken}` } }
      );

      if (status === 200) {
        const pcs_token = await EncryptedStorage.getItem('pcs_token');
        await EncryptedStorage.setItem('start_time', data.timeResult);

        await axios.post(
          `https://backend.clicksolver.com/api/worker/action`,
          { encodedId, screen: 'worktimescreen' },
          { headers: { Authorization: `Bearer ${pcs_token}` } }
        );

        await EncryptedStorage.removeItem('workerInAction');
        navigation.navigate('worktimescreen', { encodedId });
      } else if (status === 205) {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Tabs', state: { routes: [{ name: 'Home' }] } }],
          })
        );
      } else {
        setError(t('otp_incorrect', 'OTP is incorrect'));
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      setError(t('otp_incorrect', 'OTP is incorrect'));
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <FontAwesome6 name="arrow-left-long" size={20} color={isDarkMode ? '#ffffff' : '#1D2951'} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('pin_verification', 'Pin Verification')}</Text>
      </View>

      {/* Centered content */}
      <View style={styles.content}>
        <Text style={styles.sentText}>
          {t('pin_sent', 'Your pin is displayed on user navigation screen.')}
        </Text>

        {/* OTP inputs */}
        <View style={styles.otpContainer}>
          {otp.map((value, index) => (
            <TextInput
              key={index}
              style={[
                styles.otpInput,
                focusedIndex === index && { borderColor: '#ff4500' },
              ]}
              value={value}
              onChangeText={(text) => handleChange(text, index)}
              onKeyPress={(e) => handleKeyDown(e, index)}
              maxLength={1}
              keyboardType="numeric"
              ref={(el) => (inputRefs.current[index] = el)}
              onFocus={() => setFocusedIndex(index)}
              onBlur={() => setFocusedIndex(-1)}
            />
          ))}
        </View>

        {/* Error message */}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {/* Resend timer text */}
        <Text style={styles.resendText}>{t('resend_code', 'Resend code in 53 s')}</Text>

        {/* Verify button */}
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>{t('verify', 'Verify')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default OTPVerification;

const dynamicStyles = (isDarkMode) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#000000' : '#ffffff',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 20,
      width: '100%',
    },
    headerTitle: {
      flex: 1,
      fontSize: 18,
      color: isDarkMode ? '#ffffff' : '#1D2951',
      textAlign: 'center',
      fontWeight: 'bold',
      marginRight: 20,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 16,
    },
    sentText: {
      fontSize: 16,
      color: isDarkMode ? '#dddddd' : '#333333',
      textAlign: 'center',
      marginBottom: 20,
    },
    otpContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: 10,
    },
    otpInput: {
      width: 50,
      height: 50,
      borderRadius: 8,
      borderWidth: 1.5,
      borderColor: isDarkMode ? '#ffffff' : '#1D2951',
      textAlign: 'center',
      fontSize: 20,
      color: isDarkMode ? '#ffffff' : '#000000',
      marginHorizontal: 5,
    },
    error: {
      marginTop: 10,
      color: 'red',
      textAlign: 'center',
    },
    resendText: {
      fontSize: 14,
      color: isDarkMode ? '#bbbbbb' : '#999999',
      textAlign: 'center',
      marginVertical: 20,
    },
    submitButton: {
      backgroundColor: '#ff4500',
      borderRadius: 8,
      paddingVertical: 14,
      width: '60%',
      alignItems: 'center',
      marginTop: 10,
    },
    submitButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
  });
 
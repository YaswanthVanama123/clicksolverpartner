import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import axios from 'axios';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import { useNavigation } from '@react-navigation/native';
// Import the theme hook from your context
import { useTheme } from '../context/ThemeContext';

const TrackingConfirmation = ({ route }) => {
  const [otp, setOtp] = useState(Array(4).fill(''));
  const inputRefs = useRef([]);
  const { trackingId } = route.params;
  const navigation = useNavigation();
  const [decodedId, setDecodedId] = useState(null);
  const [error, setError] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);

  // Get current theme flag from context
  const { isDarkMode } = useTheme();
  const styles = dynamicStyles(isDarkMode);

  useEffect(() => {
    if (trackingId) {
      // Decoding trackingId (assuming it's Base64 encoded)
      try {
        setDecodedId(atob(trackingId));
      } catch (error) {
        console.error('Error decoding trackingId:', error);
      }
    }
  }, [trackingId]);

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

  const handleSubmit = async () => {
    const enteredOtp = otp.join('');
    try {
      const response = await axios.post(
        `https://backend.clicksolver.com/api/service/tracking/delivery/verification`,
        { trackingId, enteredOtp }
      );
      const { encodedId } = response.data;
      if (response.status === 200) {
        navigation.replace('Paymentscreen', { encodedId });
      }
    } catch (error) {
      console.error('Error during verification:', error);
      setError('Verification failed. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <FontAwesome6 name="arrow-left-long" size={18} color={isDarkMode ? '#ffffff' : '#1D2951'} />
        </TouchableOpacity>
        <Text style={styles.title}>Pin Verification</Text>
      </View>

      {/* OTP Inputs */}
      <View style={styles.otpContainer}>
        {otp.map((value, index) => (
          <TextInput
            key={index}
            style={[
              styles.otpInput,
              focusedIndex === index && styles.otpInputFocused,
            ]}
            value={value}
            onChangeText={text => handleChange(text, index)}
            onKeyPress={e => handleKeyDown(e, index)}
            maxLength={1}
            keyboardType="numeric"
            ref={el => (inputRefs.current[index] = el)}
            onFocus={() => setFocusedIndex(index)}
            onBlur={() => setFocusedIndex(-1)}
          />
        ))}
      </View>

      {/* Error Message */}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {/* Submit Button */}
      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>Submit</Text>
      </TouchableOpacity>
    </View>
  );
};

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isDarkMode ? '#000000' : '#ffffff',
      padding: 16,
    },
    header: {
      position: 'absolute',
      top: 10,
      left: 16,
      right: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: 20,
      color: isDarkMode ? '#ffffff' : '#1D2951',
      fontWeight: 'bold',
      textAlign: 'center',
      flex: 1,
    },
    otpContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: 32,
    },
    otpInput: {
      width: 50,
      height: 50,
      marginHorizontal: 8,
      textAlign: 'center',
      fontSize: 20,
      borderWidth: 1.5,
      borderColor: isDarkMode ? '#ffffff' : '#1D2951',
      borderRadius: 10,
      backgroundColor: isDarkMode ? '#222222' : '#f9f9f9',
      color: isDarkMode ? '#ffffff' : '#212121',
    },
    otpInputFocused: {
      borderColor: '#ff4500',
    },
    error: {
      color: 'red',
      marginBottom: 16,
    },
    submitButton: {
      backgroundColor: '#ff4500',
      flexDirection: 'row',
      width: 120,
      height: 43,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 10,
    },
    submitButtonText: {
      color: '#ffffff',
      fontSize: 16,
    },
  });

export default TrackingConfirmation;
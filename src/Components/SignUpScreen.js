import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import axios from 'axios';
import EncryptedStorage from 'react-native-encrypted-storage';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';

// Move InputField outside the SignUpScreen component to avoid redefinition on every render
const InputField = React.memo(
  ({ placeholder, value, onChangeText, icon, keyboardType, styles, editable = true }) => (
    <View style={[styles.inputContainer, icon && styles.emailContainer]}>
      {icon}
      <TextInput
        style={icon ? styles.inputWithIcon : styles.input}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={styles.isDarkMode ? '#cccccc' : '#9e9e9e'}
        keyboardType={keyboardType}
        editable={editable}
      />
    </View>
  )
);

const SignUpScreen = () => {
  const { width } = useWindowDimensions();
  const { isDarkMode } = useTheme();
  const initialWidth = useRef(width);
  // Memoize styles using the initial width so that they remain stable even when the keyboard opens
  const styles = useMemo(() => dynamicStyles(initialWidth.current, isDarkMode), [isDarkMode]);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [referralCode, setReferralCode] = useState('');
  // New state for Privacy Policy checkbox
  const [isPrivacyAccepted, setIsPrivacyAccepted] = useState(false);

  const route = useRoute();
  const navigation = useNavigation();

  useEffect(() => {
    const { phone_number } = route.params || {};
    if (phone_number) {
      setPhoneNumber(phone_number);
    }
  }, [route.params]);

  // Memoize the email icon to avoid unnecessary re-creation on each render.
  const emailIcon = useMemo(
    () => (
      <Icon
        name="envelope"
        size={20}
        color={isDarkMode ? '#ffffff' : '#000080'}
      />
    ),
    [isDarkMode]
  );

  const handleSignUp = async () => {
    if (!isPrivacyAccepted) {
      Alert.alert("Privacy Policy", "Please accept the Privacy Policy to complete signup.");
      return;
    }
    try {
      const response = await axios.post(
        'https://backend.clicksolver.com/api/worker/signup',
        {
          fullName,
          email,
          phoneNumber,
          referralCode,
        }
      );

      const { token, message } = response.data;
      console.log(response.data);

      if (token) {
        await EncryptedStorage.setItem('sign_up', 'true');
        await EncryptedStorage.setItem('pcs_token', token);
        navigation.replace('PartnerSteps');
      }
    } catch (error) {
      console.error('Sign up error:', error);
      const errorMessage =
        error.response?.data?.message ||
        'An error occurred during sign up. Please try again.';
      Alert.alert('Sign Up Failed', errorMessage);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <FontAwesome6
            name="arrow-left-long"
            size={24}
            color={isDarkMode ? '#ffffff' : '#000080'}
          />
        </TouchableOpacity>

        <Text style={styles.title}>Sign Up</Text>

        <InputField
          placeholder="Full Name"
          value={fullName}
          onChangeText={setFullName}
          styles={styles}
        />

        <InputField
          placeholder="Email Address"
          value={email}
          onChangeText={setEmail}
          icon={emailIcon}
          keyboardType="email-address"
          styles={styles}
        />

        <InputField
          placeholder="Phone Number"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
          styles={styles}
          editable={false} // Non-editable field
        />

        <TextInput
          placeholder="Enter referral code (optional)"
          value={referralCode}
          onChangeText={setReferralCode}
          style={styles.input}
          placeholderTextColor={isDarkMode ? '#cccccc' : '#9e9e9e'}
        />

        {/* Privacy Policy Checkbox */}
        <View style={styles.privacyContainer}>
          <TouchableOpacity
            onPress={() => setIsPrivacyAccepted(!isPrivacyAccepted)}
            style={styles.checkbox}
          >
            {isPrivacyAccepted ? (
              <Icon name="check-square-o" size={20} color="#FF4500" />
            ) : (
              <Icon name="square-o" size={20} color="#FF4500" />
            )}
          </TouchableOpacity>
          <Text style={styles.privacyText}>
            I agree to the{' '}
            <Text
              style={styles.linkText}
              onPress={() => Linking.openURL('https://clicksolver.com/privacy-policy/')}
            >
              Privacy Policy
            </Text> 
          </Text>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSignUp}>
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

function dynamicStyles(width, isDarkMode) {
  const isTablet = width >= 600;
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#121212' : '#ffffff',
    },
    scrollContainer: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: 20,
    },
    backButton: {
      position: 'absolute',
      top: 20,
      left: 10,
    },
    title: {
      fontSize: isTablet ? 28 : 24,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 30,
      color: '#000080',
    },
    inputContainer: {
      backgroundColor: isDarkMode ? '#333333' : '#F5F5F5',
      borderRadius: 10,
      borderColor: isDarkMode ? '#444444' : '#ccc',
      borderWidth: 1,
      marginBottom: 20,
      height: 50,
      justifyContent: 'center',
      paddingHorizontal: 10,
    },
    emailContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    input: {
      fontSize: isTablet ? 18 : 16,
      color: isDarkMode ? '#ffffff' : '#333333',
    },
    inputWithIcon: {
      flex: 1,
      fontSize: isTablet ? 18 : 16,
      marginLeft: 10,
      color: isDarkMode ? '#ffffff' : '#333333',
    },
    button: {
      backgroundColor: '#FF4500',
      borderRadius: 10,
      height: 50,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 20,
    },
    buttonText: {
      color: '#ffffff',
      fontSize: isTablet ? 20 : 18,
      fontWeight: 'bold',
    },
    privacyContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    checkbox: {
      marginRight: 10,
    },
    privacyText: {
      fontSize: isTablet ? 16 : 14,
      color: isDarkMode ? '#cccccc' : '#333333',
    },
    linkText: {
      color: '#FF4500',
      textDecorationLine: 'underline',
    },
  });
}

export default SignUpScreen;

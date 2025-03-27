import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  Dimensions,
  BackHandler,
} from 'react-native';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import Ionicons from 'react-native-vector-icons/Ionicons';
import EncryptedStorage from 'react-native-encrypted-storage';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
// Import translation hook
import { useTranslation } from 'react-i18next';

const BankAccountScreen = () => {
  const [bank, setBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [errors, setErrors] = useState({});
  const navigation = useNavigation();
  const { isDarkMode } = useTheme();
  const styles = dynamicStyles(isDarkMode);
  const { t } = useTranslation();

  const validateFields = () => {
    const newErrors = {};
    if (!bank) newErrors.bank = t('bank_required', 'Bank Name is required.');
    if (!accountNumber)
      newErrors.accountNumber = t('account_required', 'Account Number is required.');
    if (!confirmAccountNumber)
      newErrors.confirmAccountNumber = t('confirm_account_required', 'Confirm Account Number is required.');
    if (!ifscCode)
      newErrors.ifscCode = t('ifsc_required', 'IFSC CODE is required.');
    if (!accountHolderName)
      newErrors.accountHolderName = t('account_holder_required', "Account Holder's Name is required.");
    if (accountNumber && confirmAccountNumber && accountNumber !== confirmAccountNumber) {
      newErrors.confirmAccountNumber = t('account_mismatch', 'Account numbers do not match.');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle the hardware back button on Android
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      navigation.goBack();
      return true; // Prevent default behavior (app exit)
    });
    return () => {
      backHandler.remove();
    };
  }, [navigation]);

  const onBankPress = () => {
    navigation.goBack();
  };

  const handleAddBankAccount = async () => {
    if (!validateFields()) return;
    try {
      const pcsToken = await EncryptedStorage.getItem('pcs_token');
      if (!pcsToken) {
        console.error("No pcs_token found.");
        navigation.replace("Login");
        return;
      }
      const fundAccountDetails = {
        name: accountHolderName,
        ifsc: ifscCode,
        account_number: accountNumber,
        bank_name: bank,
      };
      const response = await axios.post(
        "https://backend.clicksolver.com/api/account/fund_account",
        fundAccountDetails,
        { headers: { Authorization: `Bearer ${pcsToken}` } }
      );
      if (response.data.success) {
        Alert.alert(t('success', 'Success'), t('bank_added', 'Bank account verified and added successfully!'));
        navigation.replace("PartnerSteps");
      } else {
        Alert.alert(t('error', 'Error'), response.data.message || t('verification_failed', "Verification failed."));
      }
    } catch (error) {
      console.error("Error creating fund account:", error.response?.data || error.message);
      Alert.alert(t('error', 'Error'), t('failed_create_account', 'Failed to create fund account. Please check your details.'));
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View>
            <FontAwesome6
              name="arrow-left-long"
              size={20}
              color={isDarkMode ? '#ccc' : '#9e9e9e'}
              style={styles.leftIcon}
              onPress={onBankPress}
            />
          </View>
          <View>
            <Ionicons
              name="help-circle-outline"
              size={25}
              color={isDarkMode ? '#ccc' : '#9e9e9e'}
            />
          </View>
        </View>
        <Text style={styles.bankAccountDetailsText}>{t('bank_account_details', 'Bank account details')}</Text>
        <Text style={styles.disclaimerText}>
          {t('disclaimer', 'Note: We do not store your bank details. They are securely sent to Razorpay for payout processing.')}
        </Text>
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, errors.bank && { borderBottomColor: '#ff4500' }]}
              placeholder={t('bank_name_placeholder', 'Bank Name')}
              placeholderTextColor={isDarkMode ? '#aaa' : "#9e9e9e"}
              value={bank}
              onChangeText={text => {
                setBank(text);
                if (errors.bank) setErrors(prev => ({ ...prev, bank: null }));
              }}
            />
            {errors.bank && <Text style={styles.errorText}>{errors.bank}</Text>}
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, errors.accountNumber && { borderBottomColor: '#ff4500' }]}
              placeholder={t('account_number_placeholder', 'Account number')}
              placeholderTextColor={isDarkMode ? '#aaa' : "#9e9e9e"}
              keyboardType="numeric"
              value={accountNumber}
              onChangeText={text => {
                setAccountNumber(text);
                if (errors.accountNumber)
                  setErrors(prev => ({ ...prev, accountNumber: null }));
              }}
            />
            {errors.accountNumber && (
              <Text style={styles.errorText}>{errors.accountNumber}</Text>
            )}
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, errors.confirmAccountNumber && { borderBottomColor: '#ff4500' }]}
              placeholder={t('confirm_account_placeholder', 'Confirm Account number')}
              placeholderTextColor={isDarkMode ? '#aaa' : "#9e9e9e"}
              keyboardType="numeric"
              value={confirmAccountNumber}
              onChangeText={text => {
                setConfirmAccountNumber(text);
                if (accountNumber && text !== accountNumber) {
                  setErrors(prev => ({ ...prev, confirmAccountNumber: t('account_mismatch', 'Account numbers do not match.') }));
                } else {
                  setErrors(prev => ({ ...prev, confirmAccountNumber: null }));
                }
              }}
            />
            {errors.confirmAccountNumber && (
              <Text style={styles.errorText}>{errors.confirmAccountNumber}</Text>
            )}
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, errors.ifscCode && { borderBottomColor: '#ff4500' }]}
              placeholder={t('ifsc_placeholder', 'IFSC CODE')}
              placeholderTextColor={isDarkMode ? '#aaa' : "#9e9e9e"}
              value={ifscCode}
              onChangeText={text => {
                setIfscCode(text);
                if (errors.ifscCode)
                  setErrors(prev => ({ ...prev, ifscCode: null }));
              }}
            />
            {errors.ifscCode && (
              <Text style={styles.errorText}>{errors.ifscCode}</Text>
            )}
          </View>
          <View style={styles.lastInputContainer}>
            <TextInput
              style={[styles.input, errors.accountHolderName && { borderBottomColor: '#ff4500' }]}
              placeholder={t('account_holder_placeholder', "Account holder's name")}
              placeholderTextColor={isDarkMode ? '#aaa' : "#9e9e9e"}
              value={accountHolderName}
              onChangeText={text => {
                setAccountHolderName(text);
                if (errors.accountHolderName)
                  setErrors(prev => ({ ...prev, accountHolderName: null }));
              }}
            />
            {errors.accountHolderName && (
              <Text style={styles.errorText}>{errors.accountHolderName}</Text>
            )}
          </View>
          <Text style={styles.helpText}>
            {t('need_help_numbers', 'Need help finding these numbers?')}{' '}
            <Text style={styles.learnMoreText}>{t('learn_more', 'Learn more')}</Text>
          </Text>
          <Text style={styles.acceptTerms}>
            {t('accept_terms', "By adding this bank account, I agree to PayMe T&Cs regarding topping up from bank account.")}
          </Text>
          <TouchableOpacity style={styles.button} onPress={handleAddBankAccount}>
            <Text style={styles.buttonText}>{t('add_bank_account', 'Add bank account')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const screenHeight = Dimensions.get('window').height;

function dynamicStyles(isDarkMode) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: isDarkMode ? '#121212' : '#fafafa',
    },
    container: {
      justifyContent: 'space-between',
      padding: 20,
      backgroundColor: isDarkMode ? '#121212' : '#fafafa',
    },
    bankAccountDetailsText: {
      paddingTop: 15,
      paddingBottom: 40,
      fontWeight: 'bold',
      color: isDarkMode ? '#ffffff' : '#212121',
      fontSize: 23,
      textAlign: 'center',
    },
    disclaimerText: {
      fontSize: 14,
      color: 'gray',
      textAlign: 'center',
      marginBottom: 20,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    helpText: {
      color: isDarkMode ? '#ccc' : '#9e9e9e',
      marginBottom: 40,
    },
    leftIcon: {},
    form: {},
    inputContainer: {
      marginBottom: 40,
    },
    lastInputContainer: {
      marginBottom: 20,
    },
    input: {
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#444' : '#E0E0E0',
      paddingVertical: 3,
      fontSize: 15,
      color: isDarkMode ? '#ffffff' : '#747676',
    },
    errorText: {
      color: '#ff4500',
      fontSize: 14,
      marginBottom: 10,
    },
    learnMoreText: {
      color: isDarkMode ? '#ffffff' : '#212121',
      fontWeight: 'bold',
      paddingLeft: 5,
    },
    acceptTerms: {
      color: isDarkMode ? '#ffffff' : '#212121',
      paddingBottom: 20,
      fontWeight: '600',
    },
    button: {
      backgroundColor: '#FF5722',
      paddingVertical: 12,
      borderRadius: 22,
      alignItems: 'center',
    },
    buttonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
    },
  });
}

export default BankAccountScreen;

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Modal,
  Linking,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import EncryptedStorage from 'react-native-encrypted-storage';
import { useTheme } from '../context/ThemeContext';
// Import translation hook
import { useTranslation } from 'react-i18next';

const PartnerSteps = () => {
  const { isDarkMode } = useTheme();
  const styles = dynamicStyles(isDarkMode);
  const navigation = useNavigation();
  const { t } = useTranslation();

  // Step statuses
  const [step1Status, setStep1Status] = useState(false);
  const [step2Status, setStep2Status] = useState(false);

  // Track banking details
  const [bankAccountAdded, setBankAccountAdded] = useState(false);
  const [upiIdAdded, setUpiIdAdded] = useState(false);

  // UI selections
  const [selectedStep, setSelectedStep] = useState(null);
  const [showLogout, setShowLogout] = useState(false);
  const [selectedBankOption, setSelectedBankOption] = useState(null);

  // For Help Modal
  const [showHelpModal, setShowHelpModal] = useState(false);

  // For Activity Indicator
  const [isLoading, setIsLoading] = useState(false);

  // Fetch step statuses from API
  const fetchStepStatuses = useCallback(async () => {
    try {
      setIsLoading(true);
      const pcs_token = await EncryptedStorage.getItem('pcs_token');
      if (!pcs_token) throw new Error('pcs_token not found');

      const response = await axios.post(
        'https://backend.clicksolver.com/api/onboarding/step-status',
        {},
        { headers: { Authorization: `Bearer ${pcs_token}` } },
      );

      setStep1Status(response.data.steps.step1);
      setStep2Status(response.data.steps.step2);
      setBankAccountAdded(response.data.steps.bankAccount);
      setUpiIdAdded(response.data.steps.upiId);
    } catch (error) {
      console.error('Error fetching step statuses:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStepStatuses();
  }, [fetchStepStatuses]);

  // Toggle logout pop-up
  const toggleLogout = () => setShowLogout((prev) => !prev);
  const handleLogout = async () => {
    await EncryptedStorage.removeItem('pcs_token');
    navigation.replace('Login');
  };

  const handleLanguageChange = async () => {
    navigation.push('LanguageSelector');
  }

  // Step 3 is complete if a bank account or UPI ID is added
  const isStep3Complete = bankAccountAdded || upiIdAdded;

  // Only navigate when all steps are complete
  const navigateToHome = async () => {
    if (step1Status && step2Status && isStep3Complete) {
      await EncryptedStorage.setItem('partnerSteps', 'completed');
      navigation.replace('ApprovalScreen');
    }
  };

  // Help functions
  const handleMailPress = () => {
    Linking.openURL('mailto:customer.support@gmail.com');
  };
  const handlePhoneCallPress = () => {
    Linking.openURL('tel:+91 9392365494');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
        {/* Top bar with Help & Logout */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => setShowHelpModal(true)}>
            <Text style={styles.helpText}>{t('help', 'Help')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleLogout} style={styles.moreIcon}>
            <Icon name="more-vert" size={24} color={isDarkMode ? '#fff' : '#333'} />
          </TouchableOpacity>
          {showLogout && (
            <View style={styles.logoutButton}>
            <TouchableOpacity style={styles.logoutButto} onPress={handleLogout}>
              <Text style={styles.logoutText}>{t('logout', 'Logout')}</Text>
            </TouchableOpacity>
                        <TouchableOpacity style={styles.logoutButto} onPress={handleLanguageChange}>
                        <Text style={styles.logoutText}>{t('languagechange', 'Language Change')}</Text>
                      </TouchableOpacity>
                      </View> 
          )}
        </View>

        {/* Help Modal */}
        <Modal
          visible={showHelpModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowHelpModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{t('need_help', 'Need Help?')}</Text>
              <TouchableOpacity style={styles.modalButton} onPress={handleMailPress}>
                <Icon name="mail" size={20} color="#fff" />
                <Text style={styles.modalButtonText}>{t('email_us', 'Email Us')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButton} onPress={handlePhoneCallPress}>
                <Icon name="call" size={20} color="#fff" />
                <Text style={styles.modalButtonText}>{t('call_us', 'Call Us')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowHelpModal(false)}>
                <Text style={styles.modalClose}>{t('close', 'Close')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Header Section */}
        <View style={styles.header}>
          <Image
            source={{ uri: 'https://i.postimg.cc/jSJS7rDH/1727646707169dp7gkvhw.png' }}
            style={styles.workerImage}
          />
          <Text style={styles.headerText}>
            {t('partner_steps_header', 'Become a Click Solver partner in 3 easy steps!')}
          </Text>
        </View>

        {/* STEP 1 */}
        <TouchableOpacity
          style={[styles.stepBox, selectedStep === 1 && styles.selectedStepBox]}
          onPress={() => setSelectedStep(1)}
        >
          <View style={styles.stepRow}>
            <Icon
              name={step1Status ? 'check-circle' : 'radio-button-unchecked'}
              size={24}
              color={step1Status ? '#1DA472' : '#9e9e9e'}
            />
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>{t('step_1', 'STEP 1')}</Text>
              <Text style={styles.stepName}>{t('signup', 'Signup')}</Text>
              <Text style={[styles.stepStatus, !step1Status && { color: '#ff4500' }]}>
                {step1Status ? t('completed', 'Completed') : t('incomplete', 'Incomplete')}
              </Text>
            </View>
            {step1Status && <Icon name="check" size={24} color="#1DA472" />}
          </View>
        </TouchableOpacity>

        {/* STEP 2 */}
        <TouchableOpacity
          style={[styles.stepBox, selectedStep === 2 && styles.selectedStepBox]}
          onPress={() => setSelectedStep(2)}
        >
          <View style={styles.stepRow}>
            <Icon
              name={step2Status ? 'check-circle' : 'radio-button-unchecked'}
              size={24}
              color={step2Status ? '#1DA472' : '#9e9e9e'}
            />
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>{t('step_2', 'STEP 2')}</Text>
              <Text style={styles.stepName}>{t('profile', 'Profile')}</Text>
              <Text style={[styles.stepStatus, !step2Status && { color: '#ff4500' }]}>
                {step2Status ? t('completed', 'Completed') : t('incomplete', 'Incomplete')}
              </Text>
            </View>
            {step2Status && <Icon name="check" size={24} color="#1DA472" />}
          </View>
          {selectedStep === 2 && !step2Status && (
            <TouchableOpacity
              style={styles.proceedButton}
              onPress={() => navigation.push('ServiceRegistration')}
            >
              <Text style={styles.proceedButtonText}>{t('proceed', 'Proceed')}</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {/* STEP 3 */}
        <TouchableOpacity
          style={[styles.stepBox, selectedStep === 3 && styles.selectedStepBox]}
          onPress={() => setSelectedStep(3)}
        >
          <View style={styles.stepRow}>
            <Icon
              name={isStep3Complete ? 'check-circle' : 'radio-button-unchecked'}
              size={24}
              color={isStep3Complete ? '#1DA472' : '#9e9e9e'}
            />
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>{t('step_3', 'STEP 3')}</Text>
              <Text style={styles.stepName}>{t('adding_banking_details', 'Adding Banking Details')}</Text>
              <Text style={[styles.stepStatus, !isStep3Complete && { color: '#ff4500' }]}>
                {isStep3Complete ? t('completed', 'Completed') : t('incomplete', 'Incomplete')}
              </Text>
            </View>
            {isStep3Complete && <Icon name="check" size={24} color="#1DA472" />}
          </View>
          {selectedStep === 3 && (
            <View style={styles.bankDetailsContainer}>
              <View style={styles.optionContainer}>
                <TouchableOpacity
                  style={styles.optionRow}
                  onPress={() => setSelectedBankOption('bankAccount')}
                >
                  <Icon
                    name={
                      selectedBankOption === 'bankAccount'
                        ? 'radio-button-checked'
                        : 'radio-button-unchecked'
                    }
                    size={20}
                    color={isDarkMode ? '#fff' : '#000'}
                  />
                  <Text style={styles.optionText}>{t('add_bank_account', 'Add bank account')}</Text>
                  {bankAccountAdded && (
                    <Icon
                      name="check"
                      size={20}
                      color="#1DA472"
                      style={{ marginLeft: 8 }}
                    />
                  )}
                </TouchableOpacity>
                {selectedBankOption === 'bankAccount' && !bankAccountAdded && (
                  <TouchableOpacity
                    style={styles.proceedButton}
                    onPress={() => navigation.push('BankAccountScreen')}
                  >
                    <Text style={styles.proceedButtonText}>{t('proceed', 'Proceed')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </TouchableOpacity>

        {/* "Start now" button when all steps are complete */}
        {step1Status && step2Status && isStep3Complete && (
          <TouchableOpacity style={styles.startButton} onPress={navigateToHome}>
            <Text style={styles.startButtonText}>{t('start_now', 'Start now')}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Floating Call Button */}
      <TouchableOpacity style={styles.floatingCallButton} onPress={handlePhoneCallPress}>
        <Icon name="call" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Loading Overlay */}
      {isLoading && (
        <ActivityIndicator size="large" color="#FF5722" style={styles.loadingOverlay} />
      )}
    </SafeAreaView>
  );
};

export default PartnerSteps;

function dynamicStyles(isDarkMode) {
  return StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      backgroundColor: isDarkMode ? '#121212' : '#f7f7f7',
    },
    topBar: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      marginBottom: 8,
    },
    helpText: {
      fontSize: 14,
      color: isDarkMode ? '#ffffff' : '#212121',
      marginRight: 8,
      fontWeight: 'bold',
    },
    moreIcon: {
      marginRight: 8,
    },
    logoutButton: {
      backgroundColor: isDarkMode ? '#333333' : '#fff',
      padding: 10,

      borderRadius: 5,
      position: 'absolute',
      top: 40,
      right: 10,
    },
    logoutText: {
      color: '#ff4500',
      fontWeight: 'bold',
    },
    header: {
      alignItems: 'center',
      marginBottom: 24,
    },
    workerImage: {
      width: 120,
      height: 120,
      resizeMode: 'contain',
    },
    headerText: {
      fontSize: 14,
      textAlign: 'center',
      fontWeight: '500',
      marginTop: 8,
      color: isDarkMode ? '#ffffff' : '#212121',
    },
    stepBox: {
      backgroundColor: isDarkMode ? '#1e1e1e' : '#fff',
      padding: 12,
      marginVertical: 8,
      borderRadius: 10,
      elevation: 1,
    },
    selectedStepBox: {
      borderWidth: 2,
      borderColor: '#FF5C00',
    },
    stepRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    stepContent: {
      marginLeft: 12,
      flex: 1,
    },
    stepTitle: {
      fontSize: 12,
      color: isDarkMode ? '#ffffff' : '#212121',
      paddingBottom: 5,
    },
    stepName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: isDarkMode ? '#ffffff' : '#212121',
      paddingBottom: 5,
    },
    stepStatus: {
      fontSize: 14,
      color: '#1DA472',
    },
    bankDetailsContainer: {
      marginTop: 8,
    },
    optionContainer: {
      marginBottom: 16,
    },
    optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    optionText: {
      marginLeft: 8,
      fontSize: 14,
      color: isDarkMode ? '#ffffff' : '#212121',
    },
    proceedButton: {
      backgroundColor: '#FF5C00',
      paddingVertical: 10,
      alignItems: 'center',
      borderRadius: 5,
      marginTop: 8,
    },
    proceedButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
    },
    startButton: {
      backgroundColor: '#FF5722',
      paddingVertical: 12,
      alignItems: 'center',
      borderRadius: 5,
      marginTop: 20,
    },
    startButtonText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: 'bold',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      width: '80%',
      backgroundColor: isDarkMode ? '#333333' : '#fff',
      borderRadius: 10,
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 30,
      alignItems: 'center',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 16,
      color: isDarkMode ? '#fff' : '#000',
    },
    modalButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FF5C00',
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 5,
      marginBottom: 12,
      width: '100%',
      justifyContent: 'center',
    },
    modalButtonText: {
      color: '#fff',
      marginLeft: 8,
      fontSize: 16,
    },
    modalClose: {
      color: '#FF5C00',
      marginTop: 8,
      fontSize: 16,
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
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.3)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 999,
    },
  });
}



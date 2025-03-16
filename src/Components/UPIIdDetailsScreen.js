import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  BackHandler
} from 'react-native';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import Ionicons from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import EncryptedStorage from 'react-native-encrypted-storage';
import { useNavigation } from '@react-navigation/native';
import { useWindowDimensions } from 'react-native';
// Import the theme hook from your context
import { useTheme } from '../context/ThemeContext';

const UPIIdDetailsScreen = () => {
  const { width } = useWindowDimensions();
  const { isDarkMode } = useTheme();
  const styles = dynamicStyles(width, isDarkMode);

  const [upiId, setUpiId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const handleAddUPIId = async () => {
    if (!upiId || !upiId.includes('@')) {
      return setError('UPI ID cannot be empty and must include "@"');
    }
    setError('');
    setLoading(true);

    try {
      const pcsToken = await EncryptedStorage.getItem('pcs_token');
      if (!pcsToken) {
        console.error('No pcs_token found.');
        return navigation.replace('Login');
      }

      const response = await axios.post(
        'https://backend.clicksolver.com/api/upi/submit',
        { upi_id: upiId },
        { headers: { Authorization: `Bearer ${pcsToken}` } },
      );

      // Assuming the backend returns 201 on success
      if (response.status === 201) {
        navigation.replace('PartnerSteps');
      } else {
        setError('Failed to add UPI ID. Please try again.');
      }
    } catch (err) {
      console.error(
        'Error submitting UPI ID:',
        err.response ? err.response.data : err.message,
      );
      setError('Error submitting UPI ID. Please try again.');
    }
    setLoading(false);
  };

    useEffect(() => {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        navigation.goBack();
        return true; // Return true to prevent default behavior (app exit)
      });
  
      return () => {
        backHandler.remove();
      };
    }, [navigation]);

      // The function called when pressing the custom back arrow
  const onBankPress = () => {
    console.log("hi back")
    navigation.goBack(); // Navigate back on custom back button press
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBankPress}>
          <FontAwesome6
            name="arrow-left-long"
            size={20}
            color={isDarkMode ? '#cccccc' : '#9e9e9e'} 
            style={styles.leftIcon}
          />
        </TouchableOpacity>
        <Text style={styles.title}>UPI Id details</Text>
        <Ionicons
          name="help-circle-outline"
          size={25}
          color={isDarkMode ? '#cccccc' : '#9e9e9e'}
        />
      </View>

      <View style={styles.tabsContainer}>
        <Text style={[styles.tab, styles.activeTab]}>Payment Details</Text>
      </View>

      <View style={styles.inputContainer}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>UPI</Text>
          <Text style={styles.linkText}>What is UPI</Text>
        </View>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            placeholder="Enter your UPI ID"
            placeholderTextColor={isDarkMode ? '#888888' : '#9e9e9e'}
            value={upiId}
            onChangeText={setUpiId}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TouchableOpacity style={styles.verifyButton} onPress={handleAddUPIId}>
            <Text style={styles.verifyButtonText}>
              {loading ? 'Verifying...' : 'Verify UPI ID'}
            </Text>
          </TouchableOpacity>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <Text style={styles.linkText}>How to find UPI ID?</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.addButton} onPress={handleAddUPIId}>
          <Text style={styles.addButtonText}>Add UPI ID</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.helpText}>How to add UPI?</Text>
    </SafeAreaView>
  );
};

function dynamicStyles(width, isDarkMode) {
  const isTablet = width >= 600;
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#000000' : '#FFFFFF',
      paddingHorizontal: 20,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 10,
      marginBottom: 15,
    },
    leftIcon: {
      // Additional styling if needed
    },
    title: {
      fontSize: isTablet ? 22 : 20,
      fontWeight: '600',
      color: isDarkMode ? '#ffffff' : '#212121',
      textAlign: 'center',
    },
    tabsContainer: {
      flexDirection: 'row',
      marginTop: 20,
    },
    tab: {
      fontSize: isTablet ? 18 : 16,
      color: isDarkMode ? '#aaaaaa' : '#A9A9A9',
      marginRight: 20,
    },
    activeTab: {
      color: isDarkMode ? '#ffffff' : '#212121',
      fontWeight: '400',
    },
    inputContainer: {
      marginTop: 30,
    },
    labelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    label: {
      fontSize: isTablet ? 16 : 14,
      color: isDarkMode ? '#ffffff' : '#212121',
    },
    linkText: {
      fontSize: isTablet ? 16 : 14,
      color: isDarkMode ? '#bbbbbb' : '#9e9e9e',
      fontWeight: '600',
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 10,
      marginBottom: 10,
    },
    textInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: isDarkMode ? '#666666' : '#D3D3D3',
      backgroundColor: isDarkMode ? '#333333' : '#F9F9F9',
      color: isDarkMode ? '#ffffff' : '#212121',
      fontWeight: 'bold',
      fontSize: isTablet ? 20 : 18,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 4,
    },
    verifyButton: {
      borderWidth: 1,
      borderColor: isDarkMode ? '#888888' : '#9e9e9e',
      padding: 10,
      marginLeft: 5,
      borderRadius: 5,
    },
    verifyButtonText: {
      color: isDarkMode ? '#cccccc' : '#9E9E9E',
      fontSize: isTablet ? 16 : 14,
    },
    errorText: {
      color: '#ff4500',
      fontSize: isTablet ? 16 : 14,
      marginTop: 5,
    },
    buttonContainer: {
      marginTop: 20,
    },
    addButton: {
      backgroundColor: '#FF5722',
      paddingVertical: 12,
      borderRadius: 25,
      alignItems: 'center',
      marginTop: 30,
    },
    addButtonText: {
      color: '#FFFFFF',
      fontSize: isTablet ? 17 : 15,
      fontWeight: '600',
    },
    helpText: {
      fontSize: isTablet ? 18 : 16,
      color: isDarkMode ? '#bbbbbb' : '#9e9e9e',
      marginTop: 30,
    },
  });
}

export default UPIIdDetailsScreen;

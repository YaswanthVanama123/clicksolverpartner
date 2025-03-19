import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  BackHandler,
  useWindowDimensions,
} from 'react-native';
import { RadioButton } from 'react-native-paper';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import {
  useNavigation,
  useRoute,
  CommonActions,
  useFocusEffect,
} from '@react-navigation/native';
import EncryptedStorage from 'react-native-encrypted-storage';
import axios from 'axios';
import SwipeButton from 'rn-swipe-button';
import Entypo from 'react-native-vector-icons/Entypo';
// Import theme hook from your context
import { useTheme } from '../context/ThemeContext';

const PaymentScanner = ({ route }) => {
  // Grab window dimensions for responsive styling
  const { width } = useWindowDimensions();
  // Get the current theme flag
  const { isDarkMode } = useTheme();
  // Generate dynamic styles with width and theme flag
  const styles = dynamicStyles(width, isDarkMode);

  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentDetails, setPaymentDetails] = useState({});
  const [decodedId, setDecodedId] = useState(null);
  const [encodedId, setEncodedId] = useState(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [titleColor, setTitleColor] = useState('#FF5722');
  const [swiped, setSwiped] = useState(false);

  const navigation = useNavigation();

  useEffect(() => {
    const { encodedId } = route.params;
    if (encodedId) {
      setEncodedId(encodedId);
      const decoded = atob(encodedId);
      setDecodedId(decoded);
    }
  }, [route.params]);

  

  useEffect(() => {
    const fetchPaymentDetails = async () => {
      if (decodedId) {
        try {
          const response = await axios.post(
            'https://backend.clicksolver.com/api/worker/payment/scanner/details',
            { notification_id: decodedId }
          );
          const { totalAmount: amount, name, service } = response.data;
          setPaymentDetails({ name, service });
          setTotalAmount(Number(amount) || 0);
        } catch (error) {
          console.error('Error fetching payment details:', error);
        }
      }
    };
    fetchPaymentDetails();
  }, [decodedId]);

  // Handle back press
  const onBackPress = React.useCallback(() => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Tabs', state: { routes: [{ name: 'Home' }] } }],
      })
    );
    return true;
  }, [navigation]);
  
  const handleSwipeSuccess = React.useCallback(() => {
    handlePayment();
    setTitleColor('#FF5722');
    setSwiped(true);
  }, [handlePayment]);
  

  useFocusEffect(
    React.useCallback(() => {
      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [navigation])
  );

  // Payment submission
  const handlePayment = async () => {
    try {
      const pcs_token = await EncryptedStorage.getItem('pcs_token');
      const numberAmount = Number(totalAmount);
      await axios.post('https://backend.clicksolver.com/api/user/payed', {
        totalAmount: numberAmount,
        paymentMethod,
        decodedId,
      });

      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'ServiceCompleted', params: { encodedId } }],
        })
      );
    } catch (error) {
      console.error('Error processing payment:', error);
      Alert.alert('Error', 'Failed to process payment.');
    }
  };

  // Custom thumb icon for the swipe button
  const ThumbIcon = React.memo(() => (
    <View style={styles.thumbContainer}>
      <Text>
        {swiped ? (
          <Entypo name="check" size={20} color="#ffffff" style={{ marginLeft: 2 }} />
        ) : (
          <FontAwesome6 name="arrow-right-long" size={18} color="#ffffff" />
        )}
      </Text>
    </View>
  ));
  

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.leftIcon} onPress={onBackPress}>
          <FontAwesome6 name="arrow-left-long" size={20} color={isDarkMode ? '#ffffff' : '#9e9e9e'} />
        </TouchableOpacity>
        <Text style={styles.screenName}>Payment Scanner</Text>
      </View>

      {/* Payment Info */}
      <View style={styles.profileContainer}>
        <Image
          source={{ uri: 'https://i.postimg.cc/L5drkdQq/Image-2-removebg-preview.png' }}
          style={styles.profileImage}
        />
        <Text style={styles.name}>{paymentDetails.name}</Text>
        <Text style={styles.amountText}>Amount</Text>
        <Text style={styles.amount}>₹{totalAmount}</Text>
        <Text style={styles.service}>{paymentDetails.service}</Text>

        <View style={styles.qrContainer}>
          <Image
            // source={{ uri: 'https://i.postimg.cc/3RDzkGDh/Image-3.png' }}
            source={{ uri: 'https://i.postimg.cc/vB0sXKjj/DALL-E-2025-03-17-18-08-17-A-fully-blurred-QR-code-making-it-completely-unreadable-with-a-strong.png' }}
            
            style={styles.ScannerImage}
          />
          <Text style={styles.qrText}>Scan QR code to pay</Text>
        </View>
      </View>

      {/* Payment Method */}
      <View style={styles.radioContainer}>
        <RadioButton
          value="cash"
          status={paymentMethod === 'cash' ? 'checked' : 'unchecked'}
          onPress={() => setPaymentMethod('cash')}
          color="#FF5722"
        />
        <Text style={styles.radioText}>Paid by Cash</Text>
      </View>

      {/* Swipe Button */}
      <View style={styles.swipeButtonContainer}>
        <SwipeButton
          title="Collected Amount"
          titleStyles={{ color: titleColor, fontSize: 16 }}
          railBackgroundColor={isDarkMode ? '#333333' : '#ffffff'}
          railBorderColor="#FF5722"
          railStyles={{
            borderRadius: 25,
            height: 50,
            backgroundColor: '#FF450000',
            borderColor: '#FF450000',
          }}
          thumbIconComponent={ThumbIcon}
          thumbIconBackgroundColor="#FF5722"
          thumbIconBorderColor="#FFFFFF"
          thumbIconWidth={50}
          thumbIconHeight={50}
          onSwipeStart={() => setTitleColor('#802300')}
          onSwipeSuccess={() => {
            handlePayment();
            setTitleColor('#FF5722');
            setSwiped(true);
          }}
          onSwipeFail={() => setTitleColor('#FF5722')}
        />
      </View>
    </View>
  );
};

/* -------------------- Dynamic Styles -------------------- */
function dynamicStyles(width, isDarkMode) {
  const isTablet = width >= 600;

  return StyleSheet.create({
    container: {
      flex: 1,
      padding: isTablet ? 30 : 20,
      backgroundColor: isDarkMode ? '#000000' : '#ffffff',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      marginBottom: isTablet ? 30 : 20,
    },
    leftIcon: {
      position: 'absolute',
      left: 10,
    },
    screenName: {
      color: isDarkMode ? '#ffffff' : '#747476',
      fontSize: isTablet ? 20 : 17,
      fontWeight: 'bold',
    },
    profileContainer: {
      alignItems: 'center',
      marginBottom: isTablet ? 30 : 20,
      padding: isTablet ? 30 : 20,
      backgroundColor: isDarkMode ? '#222222' : '#F3F6F8',
      borderRadius: 10,
    },
    profileImage: {
      width: isTablet ? 100 : 80,
      height: isTablet ? 100 : 80,
      borderRadius: isTablet ? 50 : 40,
      marginBottom: 10,
    },
    name: {
      fontSize: isTablet ? 24 : 20,
      fontWeight: 'bold',
      color: isDarkMode ? '#ffffff' : '#212121',
    },
    amountText: {
      fontSize: isTablet ? 16 : 14,
      color: isDarkMode ? '#cccccc' : '#9E9E9E',
      marginTop: 10,
    },
    amount: {
      color: isDarkMode ? '#ffffff' : '#212121',
      fontWeight: 'bold',
      fontSize: isTablet ? 28 : 24,
      marginBottom: 10,
    },
    service: {
      fontSize: isTablet ? 18 : 16,
      color: isDarkMode ? '#ffffff' : '#212121',
      fontWeight: 'bold',
    },
    qrContainer: {
      alignItems: 'center',
      marginBottom: isTablet ? 20 : 10,
    },
    ScannerImage: {
      width: isTablet ? 200 : 180,
      height: isTablet ? 200 : 180,
      marginTop: isTablet ? 10 : 5,
    },
    qrText: {
      marginTop: 10,
      fontSize: isTablet ? 16 : 14,
      color: isDarkMode ? '#ffffff' : '#212121',
    },
    radioContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: isTablet ? 30 : 20,
    },
    radioText: {
      fontSize: isTablet ? 18 : 16,
      marginLeft: 10,
      color: isDarkMode ? '#ffffff' : '#212121',
      fontWeight: 'bold',
    },
    thumbContainer: {
      width: isTablet ? 60 : 50,
      height: isTablet ? 60 : 50,
      justifyContent: 'center',
      alignItems: 'center',
    },
    swipeButtonContainer: {
      marginTop: isTablet ? 30 : 20,
    },
  });
}

export default PaymentScanner;

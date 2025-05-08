import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import LottieView from 'lottie-react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useRoute, useNavigation } from '@react-navigation/native';

const BalancePaymentConfirmationScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();

  // Destructure route params for dynamic data
  const {
    status = 'success',            // 'success' or 'failure'
    transactionNumber = '123456789',
    amount = 0,
    paymentMethod = 'Online',
    message = 'Balance Payment Successful', // custom message
  } = route.params || {};

  // If you also want a failure icon, add logic here:
  // e.g., status === 'failure' ? require('payment_failure.json') : require('payment_success.json')
  const successIcon = require('../assets/payment_success.json');

  const handleBackPress = () => {
    // Navigate back or to another screen
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header with teal background */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Balance Payment Confirmation</Text>
      </View>

      {/* Main Content */}
      <View style={styles.contentContainer}>
        {/* Lottie Success Icon */}
        <View style={styles.iconContainer}>
          <LottieView
            source={successIcon}
            autoPlay
            loop={false}
            style={styles.lottieIcon}
          />
        </View>

        {/* Payment Status / Message */}
        <Text style={styles.statusMessage}>{message}</Text>
        {console.log("dummy data version checjing for codepush updqate")}
        {/* Transaction Number */}
        <Text style={styles.transactionText}>
          Transaction Number : {transactionNumber}
        </Text>

        {/* Separator */}
        <View style={styles.separator} />

        {/* Payment Details */}
        <Text style={styles.amountText}>
          Amount Paid <Text style={styles.highlight}>₹{amount.toFixed(2)}</Text>
        </Text>
        <Text style={styles.paidByText}>Paid by {paymentMethod}</Text>
      </View>
    </SafeAreaView>
  );
};

export default BalancePaymentConfirmationScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  /* Header */
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00BCD4', // Teal color
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  backButton: {
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '600',
  },

  /* Main Content */
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  iconContainer: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  lottieIcon: {
    width: '100%',
    height: '100%',
  },
  statusMessage: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 6,
  },
  transactionText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 20,
  },
  separator: {
    width: '60%',
    height: 1,
    backgroundColor: '#eeeeee',
    marginVertical: 12,
  },
  amountText: {
    fontSize: 16,
    color: '#444444',
    marginBottom: 6,
  },
  highlight: {
    fontWeight: 'bold',
    color: '#00BCD4',
  },
  paidByText: {
    fontSize: 14,
    color: '#666666',
  },
});

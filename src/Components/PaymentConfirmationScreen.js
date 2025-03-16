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

const PaymentConfirmationScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();

  // Pull out dynamic params passed from BalanceScreen
  const {
    status = 'success',            // 'success' or 'failure'
    total = 0,
    message = 'Balance Payment Successful',
    transactionNumber = '',
    paymentMethod = 'Online',
  } = route.params || {};

  // Decide which Lottie animation to use
  const animationSource =
    status === 'success'
      ? require('../assets/success.json')
      : require('../assets/loading.json');

  const handleBackPress = () => {
    // Go back to wherever you want
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header with teal background */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Confirmation</Text>
      </View>

      {/* Main Content */}
      <View style={styles.contentContainer}>
        {/* Centered Lottie Icon */}
        <View style={styles.iconContainer}>
          <LottieView
            source={animationSource}
            autoPlay
            loop={false}
            style={styles.lottieIcon}
          />
        </View>

        {/* Status / Message */}
        <Text style={styles.statusText}>
          {status === 'success' ? 'Payment Successful' : 'Payment Failed'}
        </Text>
        {transactionNumber ? (
          <Text style={styles.transactionText}>
            Transaction Number: {transactionNumber}
          </Text>
        ) : null}
        {/* <Text style={styles.messageText}>{message}</Text> */}

        {/* Separator */}
        <View style={styles.separator} />

        {/* Payment Details */}
        <Text style={styles.amountText}>
          Amount Paid: <Text style={styles.highlight}>₹{Number(total).toFixed(2)}</Text>
        </Text>
        <Text style={styles.paymentMethodText}>
          Payment Method: {paymentMethod}
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default PaymentConfirmationScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  /* Header */
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff4500', // Teal
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
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 6,
  },
  transactionText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
  },
  messageText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 10,
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
    color: '#ff4500',
  },
  paymentMethodText: {
    fontSize: 14,
    color: '#666666',
  },
});

import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import EncryptedStorage from 'react-native-encrypted-storage';
import SwipeButton from 'rn-swipe-button';
import Feather from 'react-native-vector-icons/Feather';
import Entypo from 'react-native-vector-icons/Entypo';
import LottieView from 'lottie-react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../context/ThemeContext';
// Import translation hook
import { useTranslation } from 'react-i18next';

const TaskConfirmation = () => {
  const route = useRoute();
  const { encodedId } = route.params;
  const [decodedId, setDecodedId] = useState(null);
  const [details, setDetails] = useState({
    city: null,
    area: null,
    alternateName: null,
    alternatePhoneNumber: null,
    pincode: null,
    service: null,
  });
  const [paymentDetails, setPaymentDetails] = useState({});
  const [titleColor, setTitleColor] = useState('#FFFFFF');
  const [swiped, setSwiped] = useState(false);
  const [serviceArray, setServiceArray] = useState([]);
  const navigation = useNavigation();

  const { isDarkMode } = useTheme();
  const styles = dynamicStyles(isDarkMode);
  const { t } = useTranslation();

  useEffect(() => {
    if (encodedId) {
      const decoded = atob(encodedId);
      setDecodedId(decoded);
    }
  }, [encodedId]);

  const ThumbIcon = useMemo(
    () => () => (
      <View style={styles.thumbContainer}>
        <Text>
          {swiped ? (
            <Entypo name="check" size={20} color="#ff4500" style={styles.checkIcon} />
          ) : (
            <FontAwesome6 name="arrow-right-long" size={15} color="#ff4500" />
          )}
        </Text>
      </View>
    ),
    [swiped, styles]
  );

  useEffect(() => {
    if (decodedId) {
      const fetchPaymentDetails = async () => {
        try {
          const response = await axios.post(
            `https://backend.clicksolver.com/api/worker/details`,
            { notification_id: decodedId }
          );
          console.log("decod",decodedId)
          console.log(response.data);
          const { workDetails } = response.data;
          setDetails({
            city: workDetails.city,
            area: workDetails.area,
            pincode: workDetails.pincode,
            alternateName: workDetails.alternate_name,
            alternatePhoneNumber: workDetails.alternate_phone_number,
            service: workDetails.service_booked,
            discount: workDetails.discount,
            totalCost: workDetails.total_cost,
          });
          setServiceArray(workDetails.service_booked);
        } catch (error) {
          console.error(t('error_fetching_details', 'Error fetching payment details:'), error);
        }
      };
      fetchPaymentDetails();
    }
  }, [decodedId, t]);

  const handleComplete = async () => {
    const encoded = btoa(decodedId);
    try {
      const response = await axios.post(
        `https://backend.clicksolver.com/api/worker/confirm/completed`,
        { notification_id: decodedId, encodedId: encoded }
      );
      if (response.status === 200) {
        const pcs_token = await EncryptedStorage.getItem('pcs_token');
        await axios.post(
          `https://backend.clicksolver.com/api/worker/action`,
          { encodedId: encoded, screen: 'Paymentscreen' },
          { headers: { Authorization: `Bearer ${pcs_token}` } }
        );
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Paymentscreen', params: { encodedId: encoded } }],
          })
        );
      } else {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Tabs', state: { routes: [{ name: 'Home' }] } }],
          })
        );
      }
    } catch (error) {
      console.error(t('error_completing_task', 'Error completing task:'), error);
    }
  };

  const handlePress = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Tabs', state: { routes: [{ name: 'Home' }] } }],
      })
    );
  };

  return (
    <View style={styles.container}>
      {/* Back Arrow */}
      <TouchableOpacity style={styles.backArrow} onPress={handlePress}>
        <Icon name="arrow-back" size={24} color={isDarkMode ? '#ffffff' : '#000000'} />
      </TouchableOpacity>
      <ScrollView>
        {/* Checkmark Animation */}
        <LottieView
          source={require('../assets/success.json')}
          autoPlay
          loop
          style={styles.loadingAnimation}
        />

        {/* Title and Subtitle */}
        <Text style={[styles.title, { color: isDarkMode ? '#ffffff' : '#333333' }]}>
          {t('work_completion_request', 'Work Completion request !')}
        </Text>
        <Text style={[styles.subtitle, { color: isDarkMode ? '#cccccc' : '#666666' }]}>
          {t('please_confirm_completion', 'Please confirm the completion of the service. Click confirm')}
        </Text>

        {/* Payment Summary */}
        <View style={styles.paymentDetails}>
          <Text style={styles.detailsText}>{t('payment_details', 'Payment Details')}</Text>
          <View style={styles.sectionContainer}>
            <View style={styles.PaymentItemContainer}>
              {serviceArray.map((service, index) => (
                <View key={index} style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}> { t(`singleService_${service.main_service_id}`) || service.serviceName }</Text>
                  <Text style={styles.paymentValue}>{service.quantity}</Text>
                </View> 
              ))}
              {/* <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>SGST (5%)</Text>
                <Text style={styles.paymentValue}>₹0.00</Text>
              </View>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>CGST (5%)</Text>
                <Text style={styles.paymentValue}>₹0.00</Text>
              </View> */}
              {details.discount > 0 && (
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Cashback (5%)</Text>
                  <Text style={styles.paymentValue}>- ₹{details.discount}.00</Text>
                </View>
              )}
              <View style={[styles.horizantalLine, { marginTop: 10 }]} />
              <View style={styles.paymentGrandRow}>
                <Text style={styles.paymentTotalValue}>
                  {t('grand_total', 'Grand Total')} ₹{details.totalCost}.00
                </Text>
              </View>
              <View style={[styles.horizantalLine]} />
            </View>
          </View>
        </View>

        {/* Swipe Button */}
        <View style={styles.swipeButton}>
          <SwipeButton
            title={t('completed', 'Completed')}
            titleStyles={{ color: titleColor, fontSize: 16, fontWeight: '500' }}
            railBackgroundColor="#FF5722"
            railBorderColor="#FF5722"
            height={40}
            railStyles={{
              borderRadius: 20,
              backgroundColor: '#FF572200',
              borderColor: '#FF572200',
            }}
            thumbIconComponent={ThumbIcon}
            thumbIconBackgroundColor="#FFFFFF"
            thumbIconBorderColor="#FFFFFF"
            thumbIconWidth={40}
            thumbIconStyles={{ height: 30, width: 30, borderRadius: 20 }}
            onSwipeStart={() => setTitleColor('#B0B0B0')}
            onSwipeSuccess={() => {
              handleComplete();
              setTitleColor('#FFFFFF');
              setSwiped(true);
            }}
            onSwipeFail={() => setTitleColor('#FFFFFF')}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: 16,
      paddingTop: 20,
      backgroundColor: isDarkMode ? '#000000' : '#ffffff',
    },
    backArrow: {
      position: 'absolute',
      top: 10,
      left: 10,
      zIndex: 1,
    },
    loadingAnimation: {
      width: '100%',
      height: 200,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      textAlign: 'center',
      marginTop: 20,
    },
    subtitle: {
      fontSize: 14,
      textAlign: 'center',
      marginBottom: 20,
    },
    paymentDetails: {
      backgroundColor: isDarkMode ? '#222222' : '#f9f9f9',
      borderRadius: 10,
      padding: 16,
      marginBottom: 20,
      elevation: 2,
    },
    detailsText: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 10,
      color: isDarkMode ? '#ffffff' : '#212121',
    },
    sectionContainer: {
      width: '95%',
    },
    paymentRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 4,
    },
    paymentLabel: {
      fontSize: 14,
      color: isDarkMode ? '#ffffff' : '#212121',
    },
    paymentValue: {
      fontSize: 14,
      color: isDarkMode ? '#ffffff' : '#212121',
      fontWeight: 'bold',
    },
    paymentGrandRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginBottom: 4,
    },
    paymentTotalValue: {
      fontSize: 16,
      color: isDarkMode ? '#ffffff' : '#212121',
      fontWeight: 'bold',
      paddingVertical: 10,
    },
    horizantalLine: {
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#555555' : '#ddd',
      marginVertical: 8,
    },
    swipeButton: {
      marginHorizontal: 20,
      marginBottom: 10,
    },
    thumbContainer: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkIcon: {
      marginVertical: 2,
    },
  });

export default TaskConfirmation;
 
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
  useWindowDimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome6';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, CommonActions, useRoute } from '@react-navigation/native';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
// Import translation hook
import { useTranslation } from 'react-i18next';

const ServiceBookingItem = () => {
  const { width } = useWindowDimensions();  // get screen width
  const { isDarkMode } = useTheme();
  const styles = dynamicStyles(width, isDarkMode);
  const { t } = useTranslation();
  
  const [details, setDetails] = useState({});
  const [serviceArray, setServiceArray] = useState([]);
  const [status, setStatus] = useState({
    accept: '2024-11-02 22:16:22',
    arrived: '2024-11-02 22:16:32',
    workCompleted: '2024-11-02 22:16:48',
    paymentCompleted: '2024-11-02 22:16:56',
  });

  // Map status keys to translation keys
  const statusDisplayNames = {
    accept: t('commander_accepted', 'Commander Accepted'),
    arrived: t('commander_arrived', 'Commander Arrived'),
    workCompleted: t('work_completed', 'Work Completed'),
    paymentCompleted: t('payment_completed', 'Payment Completed'),
  };

  const { tracking_id } = useRoute().params;
  const navigation = useNavigation();

  const getTimelineData = useMemo(() => {
    const statusKeys = Object.keys(status);
    const currentStatusIndex = statusKeys.findIndex((key) => status[key] === null);
    return statusKeys.map((statusKey, index) => ({
      title: statusDisplayNames[statusKey],
      time: status[statusKey],
      iconColor:
        index <= currentStatusIndex || currentStatusIndex === -1
          ? '#ff4500'
          : '#a1a1a1',
      lineColor:
        index <= currentStatusIndex || currentStatusIndex === -1
          ? '#ff4500'
          : '#a1a1a1',
    }));
  }, [status, statusDisplayNames]);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await axios.post(
          'https://backend.clicksolver.com/api/service/booking/user/item/details',
          { tracking_id }
        );
        const { data } = response.data;
        setStatus(data.time || {});
        setDetails(data);
        setServiceArray(data.service_booked || []);
      } catch (error) {
        console.error('Error fetching bookings data:', error);
      }
    };
    fetchBookings();
  }, [tracking_id]);

  const openPhonePeScanner = useCallback(() => {
    const url = 'phonepe://scan';
    Linking.openURL(url).catch((err) => {
      console.error('Failed to open PhonePe scanner:', err);
      Linking.openURL(
        'https://play.google.com/store/apps/details?id=com.phonepe.app'
      );
    });
  }, []);

  // Helper: format the date
  const formatDate = (created_at) => {
    const date = new Date(created_at);
    const monthNames = [
      'January','February','March','April','May','June',
      'July','August','September','October','November','December',
    ];
    return `${monthNames[date.getMonth()]} ${String(date.getDate()).padStart(2, '0')}, ${date.getFullYear()}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon
          name="arrow-left-long"
          size={styles.headerIconSize}
          color={isDarkMode ? "#ffffff" : "#212121"}
          style={styles.backIcon}
          onPress={() => navigation.goBack()}
        />
        <Text style={styles.headerText}>
          {t('service_tracking', 'Service Tracking')}
        </Text>
      </View>

      <ScrollView>
        {/* User Profile */}
        <View style={styles.profileContainer}>
          <View style={styles.profileImage}>
            <Text style={styles.profileInitial}>
              {details.name ? details.name.charAt(0).toUpperCase() : ''}
            </Text>
          </View>
          <View style={styles.profileTextContainer}>
            <Text style={styles.userName}>{details.name}</Text>
            {/* <Text style={styles.userDesignation}>{details.service}</Text> */}
          </View>
        </View>

        <View style={styles.horizantalLine} />

        {/* Service Details */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionBookedTitle}>
            {t('service_details', 'Service Details')}
          </Text>
          <View style={styles.innerContainer}>
            {serviceArray.map((service, index) => (
              <Text key={index} style={styles.serviceDetail}>
                { t(`singleService_${service.main_service_id}`) || service.serviceName }
       
              </Text>
            ))}
          </View>
        </View>

        <View style={styles.horizantalLine} />

        {/* Service Timeline */}
        <View style={styles.sectionContainer}>
          <View style={styles.serviceTimeLineContainer}>
            <Text style={styles.sectionTitle}>
              {t('service_timeline', 'Service Timeline')}
            </Text>
          </View>
          <View style={styles.innerContainerLine}>
            {getTimelineData.map((item, index) => (
              <View key={index} style={styles.timelineItem}>
                <View style={{ alignItems: 'center' }}>
                  <MaterialCommunityIcons
                    name="circle"
                    size={14}
                    color={item.iconColor}
                    style={styles.timelineIcon}
                  />
                  {index !== getTimelineData.length - 1 && (
                    <View
                      style={[
                        styles.lineSegment,
                        { backgroundColor: getTimelineData[index + 1].iconColor },
                      ]}
                    />
                  )}
                </View>
                <View style={styles.timelineTextContainer}>
                  <Text style={styles.timelineText}>{item.title}</Text>
                  <Text style={styles.timelineTime}>{item.time}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.horizantalLine} />

        {/* Address */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>
            {t('address', 'Address')}
          </Text>
          <View style={styles.addressContainer}>
            <Image
              source={{
                uri: 'https://i.postimg.cc/qvJw8Kzy/Screenshot-2024-11-13-170828-removebg-preview.png',
              }}
              style={styles.locationPinImage}
            />
            <View style={styles.addressTextContainer}>
              <Text style={styles.address}>{details.area}</Text>
            </View>
          </View>
        </View>

        {/* Payment Details */}
        <View style={styles.paymentInnerContainer}>
          <Text style={styles.sectionPaymentTitle}>
            {t('payment_details', 'Payment Details')}
          </Text>
        </View>
        <View style={styles.sectionContainer}>
          <View style={styles.PaymentItemContainer}>
            {details.discount > 0 && (
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>
                  {t('cashback', 'Cashback (5%)')}
                </Text>
                <Text style={styles.paymentValue}>₹{details.discount}</Text>
              </View>
            )}
            <View style={styles.paymentRow}>
              <Text style={styles.paymentValue}>
                {t('grand_total', 'Grand Total')}
              </Text>
              <Text style={styles.paymentValue}>₹ {details.total_cost}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.payButton} onPress={openPhonePeScanner}>
          <Text style={styles.payButtonText}>
            {t('payed', 'PAYED')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default ServiceBookingItem;

/**
 * Dynamic styles for responsiveness and dark/light theming.
 */
function dynamicStyles(width, isDarkMode) {
  const isTablet = width >= 600;
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#121212' : '#ffffff',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: isTablet ? 20 : 16,
      paddingBottom: isTablet ? 16 : 12,
      elevation: 2,
      shadowColor: '#1D2951',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      backgroundColor: isDarkMode ? '#1f1f1f' : '#ffffff',
    },
    headerIconSize: isTablet ? 24 : 20,
    backIcon: {
      marginRight: 10,
    },
    headerText: {
      fontSize: isTablet ? 20 : 16,
      fontWeight: 'bold',
      color: isDarkMode ? '#ffffff' : '#1D2951',
      paddingLeft: isTablet ? 40 : 30,
    },
    profileContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: isTablet ? 20 : 15,
      paddingLeft: isTablet ? 20 : 16,
    },
    profileImage: {
      width: isTablet ? 70 : 60,
      height: isTablet ? 70 : 60,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#FF7A22',
      borderRadius: isTablet ? 35 : 30,
      marginRight: 5,
    },
    profileInitial: {
      color: '#FFFFFF',
      fontSize: isTablet ? 24 : 22,
      fontWeight: '800',
    },
    profileTextContainer: {
      flex: 1,
      flexDirection: 'column',
      justifyContent: 'space-between',
      paddingRight: isTablet ? 20 : 16,
    },
    userName: {
      fontSize: isTablet ? 22 : 20,
      fontWeight: 'bold',
      color: isDarkMode ? '#ffffff' : '#1D2951',
    },
    userDesignation: {
      fontSize: isTablet ? 16 : 14,
      color: isDarkMode ? '#cccccc' : '#4a4a4a',
    },
    horizantalLine: {
      height: 2,
      backgroundColor: isDarkMode ? '#333333' : '#F5F5F5',
      marginBottom: isTablet ? 16 : 12,
    },
    sectionContainer: {
      marginBottom: 16,
      paddingLeft: isTablet ? 20 : 16,
      paddingRight: isTablet ? 20 : 16,
      width: '95%',
      alignSelf: 'center',
    },
    sectionBookedTitle: {
      fontSize: isTablet ? 18 : 16,
      fontWeight: 'bold',
      color: isDarkMode ? '#ffffff' : '#212121',
      marginBottom: 8,
    },
    innerContainer: {
      paddingLeft: isTablet ? 20 : 16,
    },
    serviceTimeLineContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    sectionTitle: {
      fontSize: isTablet ? 18 : 16,
      fontWeight: '700',
      color: isDarkMode ? '#ffffff' : '#212121',
      marginBottom: 8,
      paddingBottom: 15,
    },
    innerContainerLine: {
      paddingLeft: isTablet ? 20 : 16,
    },
    serviceDetail: {
      fontSize: isTablet ? 15 : 14,
      color: isDarkMode ? '#ffffff' : '#212121',
      fontWeight: '500',
      marginBottom: 4,
    },
    timelineItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    timelineIcon: {
      marginBottom: 2,
    },
    lineSegment: {
      width: 2,
      height: isTablet ? 50 : 40,
    },
    timelineTextContainer: {
      flex: 1,
      marginLeft: 10,
    },
    timelineText: {
      fontSize: isTablet ? 15 : 14,
      color: isDarkMode ? '#ffffff' : '#212121',
      fontWeight: 'bold',
    },
    timelineTime: {
      fontSize: isTablet ? 12 : 10,
      color: isDarkMode ? '#cccccc' : '#4a4a4a',
    },
    addressContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingLeft: isTablet ? 20 : 10,
    },
    locationPinImage: {
      width: isTablet ? 25 : 20,
      height: isTablet ? 25 : 20,
      marginRight: 10,
    },
    addressTextContainer: {
      marginLeft: 10,
    },
    address: {
      fontSize: isTablet ? 14 : 13,
      color: isDarkMode ? '#ffffff' : '#212121',
    },
    paymentInnerContainer: {
      padding: isTablet ? 12 : 10,
      backgroundColor: isDarkMode ? '#333333' : '#f5f5f5',
      marginTop: 10,
      marginBottom: 10,
    },
    sectionPaymentTitle: {
      fontSize: isTablet ? 18 : 16,
      fontWeight: 'bold',
      color: isDarkMode ? '#ffffff' : '#212121',
      marginBottom: 8,
      paddingLeft: isTablet ? 14 : 10,
    },
    PaymentItemContainer: {
      paddingLeft: isTablet ? 20 : 16,
      flexDirection: 'column',
      gap: 5,
    },
    paymentRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    paymentLabel: {
      fontSize: isTablet ? 15 : 14,
      color: isDarkMode ? '#ffffff' : '#212121',
    },
    paymentValue: {
      fontSize: isTablet ? 15 : 14,
      color: isDarkMode ? '#ffffff' : '#212121',
      fontWeight: 'bold',
    },
    payButton: {
      backgroundColor: '#ff4500',
      paddingVertical: isTablet ? 14 : 12,
      borderRadius: 8,
      alignItems: 'center',
      marginVertical: 20,
      marginHorizontal: isTablet ? 24 : 20,
    },
    payButtonText: {
      fontSize: isTablet ? 18 : 16,
      fontWeight: 'bold',
      color: '#fff',
    },
  });
}

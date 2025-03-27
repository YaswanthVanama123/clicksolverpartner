import React, { useEffect, useState, useMemo } from 'react';
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
import Feather from 'react-native-vector-icons/Feather';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import SwipeButton from 'rn-swipe-button';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Entypo from 'react-native-vector-icons/Entypo';
import { useRoute, useNavigation } from '@react-navigation/native';
import { RadioButton } from 'react-native-paper';
import axios from 'axios';
import Geolocation from '@react-native-community/geolocation';
import { useTheme } from '../context/ThemeContext';
// Import translation hook
import { useTranslation } from 'react-i18next';

const ServiceTrackingItemScreen = () => {
  const { width } = useWindowDimensions();
  const { isDarkMode } = useTheme();
  const styles = dynamicStyles(width, isDarkMode);

  // Translator
  const { t } = useTranslation();

  const [titleColor, setTitleColor] = useState('#FFFFFF');
  const [swiped, setSwiped] = useState(false);
  const [details, setDetails] = useState({});
  const [serviceArray, setServiceArray] = useState([]);
  const [isEditVisible, setEditVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const { tracking_id } = useRoute().params;
  const navigation = useNavigation();

  // Raw statuses used in logic. We only translate them for display.
  const statuses = [
    'Collected Item',
    'Work started',
    'Work Completed',
    'Delivered',
  ];

  // Custom thumb icon for the swipe button
  const ThumbIcon = useMemo(
    () => () => (
      <View style={styles.thumbContainer}>
        {swiped ? (
          <Entypo name="check" size={20} color="#ff4500" style={styles.checkIcon} />
        ) : (
          <FontAwesome6 name="arrow-right-long" size={15} color="#ff4500" />
        )}
      </View>
    ),
    [swiped, styles]
  );

  // Toggle edit mode
  const handleEditPress = () => {
    setEditVisible((prev) => !prev);
  };

  // Confirm and change status using raw status
  const handleStatusChange = (rawStatus) => {
    setSelectedStatus(rawStatus);
    Alert.alert(
      t('confirm_change', 'Confirm Change'),
      t('confirm_change_message', 'Are you sure you want to change the status to "{{status}}"?', { status: rawStatus }),
      [
        { text: t('cancel', 'Cancel'), style: 'cancel' },
        { text: t('yes', 'Yes'), onPress: () => applyStatusChange(rawStatus) },
      ]
    );
  };

  const applyStatusChange = async (newStatus) => {
    try {
      await axios.post(
        'https://backend.clicksolver.com/api/service/tracking/update/status',
        { tracking_id, newStatus }
      );
      setDetails({ ...details, service_status: newStatus });
      setSelectedStatus('');
      setEditVisible(false);
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handlesubmit = () => {
    navigation.push('TrackingConfirmation', { trackingId: tracking_id });
  };

  // Launch Google Maps with directions
  const openGoogleMaps = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const url = `https://www.google.com/maps/dir/?api=1&origin=${latitude},${longitude}&destination=${details.latitude},${details.longitude}&travelmode=driving`;
        Linking.openURL(url).catch((err) =>
          console.error('Error opening Google Maps:', err)
        );
      },
      (error) => {
        console.error('Error getting current location:', error);
      }
    );
  };

  // Make phone call
  const phoneCall = async () => {
    try {
      const response = await axios.post('https://backend.clicksolver.com/api/user/tracking/call', {
        tracking_id,
      });
      if (response.status === 200 && response.data.mobile) {
        const phoneNumber = response.data.mobile;
        const dialURL = `tel:${phoneNumber}`;
        Linking.openURL(dialURL).catch((err) =>
          console.error('Error opening dialer:', err)
        );
      } else {
        console.log('Failed to initiate call:', response.data);
      }
    } catch (error) {
      console.error('Error initiating call:', error.response ? error.response.data : error.message);
    }
  };

  // Generate timeline data using raw statuses for logic and translating for display
  const getTimelineData = useMemo(() => {
    const currentStatusIndex = statuses.indexOf(details.service_status);
    return statuses.map((rawStatus, index) => {
      // Translate for display only.
      let displayLabel = '';
      switch (rawStatus) {
        case 'Collected Item':
          displayLabel = t('collected_item', 'Collected Item');
          break;
        case 'Work started':
          displayLabel = t('work_started', 'Work started');
          break;
        case 'Work Completed':
          displayLabel = t('work_completed', 'Work Completed');
          break;
        case 'Delivered':
          displayLabel = t('delivered', 'Delivered');
          break;
        default:
          displayLabel = t('on_the_way', 'On the Way');
          break;
      }
      return {
        rawStatus,
        title: displayLabel,
        time: '',
        iconColor: index <= currentStatusIndex ? '#ff4500' : '#a1a1a1',
        lineColor: index <= currentStatusIndex ? '#ff4500' : '#a1a1a1',
        isSelectable: index > currentStatusIndex && rawStatus !== 'Delivered',
      };
    });
  }, [details.service_status, t]);

  // Fetch booking details on mount
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const {
          data: { data },
        } = await axios.post(
          'https://backend.clicksolver.com/api/service/tracking/worker/item/details',
          { tracking_id }
        );
        setDetails(data);
        setServiceArray(data.service_booked);
      } catch (error) {
        console.error('Error fetching bookings data:', error);
      }
    };
    fetchBookings();
  }, [tracking_id]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Icon
          name="arrow-left-long"
          size={styles.headerIconSize}
          color={isDarkMode ? '#ffffff' : '#212121'}
          style={styles.backIcon}
          onPress={() => navigation.goBack()}
        />
        <Text style={styles.headerText}>
          {t('service_trackings', 'Service Trackings')}
        </Text>
      </View>

      <ScrollView>
        {/* Profile Section */}
        <View style={styles.profileContainer}>
          <View style={styles.profileImage}>
            <Text style={styles.profileInitial}>
              {details.name ? details.name.charAt(0).toUpperCase() : ''}
            </Text>
          </View>
          <View style={styles.profileTextContainer}>
            <Text style={styles.userName}>{details.name}</Text>
            <TouchableOpacity style={styles.callIconContainer} onPress={phoneCall}>
              <MaterialIcons name="call" size={styles.callIconSize} color="#FF5722" />
            </TouchableOpacity>
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
                {t(`singleService_${service.main_service_id}`) || service.serviceName}
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
            <TouchableOpacity onPress={handleEditPress}>
              <Text style={styles.editText}>
                {isEditVisible ? t('cancel', 'Cancel') : t('edit', 'Edit')}
              </Text>
            </TouchableOpacity>
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
                  <Text style={styles.timelineTime}>
                    {item.time ? item.time : t('pending', 'Pending')}
                  </Text>
                </View>
                {isEditVisible && item.isSelectable && (
                  <RadioButton
                    value={item.rawStatus}
                    status={selectedStatus === item.rawStatus ? 'checked' : 'unchecked'}
                    onPress={() => handleStatusChange(item.rawStatus)}
                    color="#ff4500"
                  />
                )}
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
          <View style={styles.googleMapsButtonContainer}>
            <TouchableOpacity
              style={styles.googleMapsButton}
              onPress={openGoogleMaps}
            >
              <Text style={styles.googleMapsText}>
                {t('google_maps', 'Google Maps')}
              </Text>
              <MaterialCommunityIcons name="navigation-variant" size={20} color="#C1C1C1" />
            </TouchableOpacity>
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
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>
                {t('pay_via_scan', 'Pay Via Scan')}
              </Text>
              <Text style={styles.paymentValue}>
                {t('grand_total', 'Grand Total')} ₹{details.total_cost}.00
              </Text>
            </View>
          </View>
        </View>

        {/* Swipe Button */}
        <View style={styles.swipeButton}>
          <SwipeButton
            title={t('delivered', 'Delivered')}
            titleStyles={{
              color: titleColor,
              fontSize: 16,
              fontWeight: '500',
            }}
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
              handlesubmit();
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

export default ServiceTrackingItemScreen;

/* --------------------- Dynamic Styles Generator --------------------- */
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
      shadowColor: '#000',
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
      fontSize: isTablet ? 20 : 18,
      fontWeight: 'bold',
      color: isDarkMode ? '#ffffff' : '#1D2951',
      paddingLeft: isTablet ? 40 : 30,
    },
    profileContainer: {
      flexDirection: 'row',
      gap: 5,
      alignItems: 'center',
      marginBottom: isTablet ? 24 : 20,
      marginTop: isTablet ? 14 : 10,
      paddingLeft: isTablet ? 20 : 16,
    },
    profileImage: {
      width: isTablet ? 70 : 60,
      height: isTablet ? 70 : 60,
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#FF7A22',
      borderRadius: isTablet ? 35 : 30,
    },
    profileInitial: {
      color: '#FFFFFF',
      fontSize: isTablet ? 24 : 22,
      fontWeight: '800',
    },
    profileTextContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingRight: isTablet ? 20 : 16,
    },
    userName: {
      fontSize: isTablet ? 22 : 20,
      fontWeight: 'bold',
      color: isDarkMode ? '#ffffff' : '#1D2951',
    },
    callIconContainer: {
      backgroundColor: '#fff',
      borderRadius: 50,
      padding: isTablet ? 10 : 8,
      elevation: 4,
    },
    callIconSize: isTablet ? 24 : 22,
    horizantalLine: {
      height: 2,
      backgroundColor: isDarkMode ? '#333333' : '#F5F5F5',
      marginBottom: isTablet ? 16 : 12,
    },
    sectionContainer: {
      marginBottom: isTablet ? 20 : 16,
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
      marginBottom: isTablet ? 10 : 8,
    },
    sectionTitle: {
      fontSize: isTablet ? 18 : 16,
      fontWeight: '700',
      color: isDarkMode ? '#ffffff' : '#212121',
      marginBottom: 8,
      paddingBottom: 8,
    },
    editText: {
      color: '#ff5700',
      fontSize: isTablet ? 16 : 15,
      fontWeight: '500',
    },
    innerContainerLine: {
      paddingLeft: isTablet ? 20 : 16,
    },
    serviceDetail: {
      fontSize: isTablet ? 15 : 14,
      color: isDarkMode ? '#ffffff' : '#212121',
      marginBottom: 4,
    },
    timelineItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    timelineIcon: {},
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
    googleMapsButtonContainer: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
      marginTop: isTablet ? 14 : 10,
    },
    googleMapsButton: {
      backgroundColor: '#FFFFFF',
      borderRadius: 20,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 2,
      width: isTablet ? 160 : 140,
      height: isTablet ? 45 : 40,
    },
    googleMapsText: {
      fontSize: isTablet ? 16 : 14,
      color: '#212121',
      fontWeight: 'bold',
      marginRight: 6,
    },
    paymentInnerContainer: {
      padding: isTablet ? 12 : 10,
      backgroundColor: isDarkMode ? '#212121' : '#f5f5f5',
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
    },
    paymentRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: isTablet ? 6 : 4,
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
    swipeButton: {
      marginHorizontal: isTablet ? 24 : 20,
      marginBottom: isTablet ? 14 : 10,
    },
    thumbContainer: {
      width: isTablet ? 42 : 40,
      height: isTablet ? 42 : 40,
      borderRadius: isTablet ? 21 : 20,
      backgroundColor: '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#ddd',
    },
    checkIcon: {
      alignSelf: 'center',
    },
  });
}
 
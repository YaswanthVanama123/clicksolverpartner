import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TouchableWithoutFeedback,
  BackHandler, 
  SafeAreaView,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import { Calendar } from 'react-native-calendars';
import EncryptedStorage from 'react-native-encrypted-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import axios from 'axios';
import DestinationCircles from '../Components/DestinationCircles';
import { useTheme } from '../context/ThemeContext';
// Import translation hook
import { useTranslation } from 'react-i18next';

const EarningsScreen = () => {
  const { width } = useWindowDimensions();
  const { isDarkMode } = useTheme();
  const styles = dynamicStyles(width, isDarkMode);
  const navigation = useNavigation();
  const { t } = useTranslation();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedPeriod, setSelectedPeriod] = useState('Today');
  const [showCalendar, setShowCalendar] = useState(false);
  const [isMessageVisible, setIsMessageVisible] = useState(false);
  const [earnings, setEarnings] = useState({
    total_payment: 0,
    cash_payment: 0,
    payment_count: 0,
    life_earnings: 0,
    avgrating: 0,
    rejectedcount: 0,
    pendingcount: 0,
    minutes: 0,
    service_counts: 0,
    cashback_approved_times: 0,
    cashback_gain: 0,
    cashback: 0,
    cashback_pending: 0,
  });
  const [loading, setLoading] = useState(false);

  // Date range states
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  useEffect(() => {
    partnerEarnings(new Date());
  }, []);

  const partnerEarnings = async (date, endDate = null) => {
    try {
      setLoading(true);
      const pcs_token = await EncryptedStorage.getItem('pcs_token');
      if (!pcs_token) throw new Error('pcs_token not found');

      const payload = endDate ? { startDate: date, endDate: endDate } : { date };
      const response = await axios.post(
        `https://backend.clicksolver.com/api/worker/earnings`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${pcs_token}`,
          },
        }
      );

      const {
        total_payment = 0,
        cash_payment = 0,
        payment_count = 0,
        life_earnings = 0,
        avg_rating = 0,
        rejected_count = 0,
        pendingcount = 0,
        total_time_worked_hours = 0,
        service_counts = 0,
        cashback_gain = 0,
        cashback_approved_times = 0,
        average_rating = 0,
      } = response.data;

      const serviceCountNum = Number(service_counts);
      const gain = Math.trunc(serviceCountNum / 6) * 100;

      setEarnings({
        total_payment: Number(total_payment),
        cash_payment: Number(cash_payment),
        payment_count: Number(payment_count),
        life_earnings: Number(life_earnings),
        avgrating: Number(avg_rating),
        rejectedcount: Number(rejected_count),
        pendingcount: Number(pendingcount),
        minutes: Number(total_time_worked_hours) * 60,
        service_counts: serviceCountNum,
        cashback_pending: Number(cashback_approved_times) - (gain % 6),
        cashback_gain: gain,
        cashback_approved_times: Number(cashback_approved_times),
        cashback: serviceCountNum % 6,
        average_rating: Number(average_rating),
      });
    } catch (error) {
      console.error('Error fetching payment details:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.navigate('Home');
        return true;
      };
      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [navigation])
  );

  const handleTabClick = (period) => {
    {console.log("click")}
    setSelectedPeriod(period);
    if (period === t('today', 'Today')) {
      const today = new Date();
      setSelectedDate(today);
      setStartDate(null);
      setEndDate(null);
      partnerEarnings(today);
    } else if (period === t('this_week', 'This Week')) {
      const startOfWeek = new Date();
      const day = startOfWeek.getDay();
      startOfWeek.setDate(startOfWeek.getDate() - day);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);

      setSelectedDate(startOfWeek);
      setStartDate(startOfWeek);
      setEndDate(endOfWeek);
      partnerEarnings(startOfWeek, endOfWeek);
    } else if (period === t('select_date', 'Select Date')) {
      setStartDate(null);
      setEndDate(null);
      setShowCalendar(true);
    }
  };

  const selectDate = (day) => {
    const selected = new Date(day.dateString);
    if (!startDate || (startDate && endDate)) {
      setStartDate(selected);
      setEndDate(null);
    } else if (startDate && !endDate) {
      if (selected >= startDate) {
        setEndDate(selected);
        setShowCalendar(false);
        partnerEarnings(startDate, selected);
      } else {
        setStartDate(selected);
      }
    }
  };

  const getMarkedDates = () => {
    if (startDate && endDate) {
      let range = {};
      let start = new Date(startDate);
      let end = new Date(endDate);
      let current = new Date(start);

      while (current <= end) {
        const dateString = current.toISOString().split('T')[0];
        if (dateString === startDate.toISOString().split('T')[0]) {
          range[dateString] = {
            startingDay: true,
            color: '#4CAF50',
            textColor: 'white',
          };
        } else if (dateString === endDate.toISOString().split('T')[0]) {
          range[dateString] = {
            endingDay: true,
            color: '#4CAF50',
            textColor: 'white',
          };
        } else {
          range[dateString] = { color: '#4CAF50', textColor: 'white' };
        }
        current.setDate(current.getDate() + 1);
      }
      return range;
    } else if (startDate) {
      return {
        [startDate.toISOString().split('T')[0]]: {
          selected: true,
          selectedColor: '#4CAF50',
        },
      };
    }
    return {};
  };

  const backToHome = () => {
    navigation.navigate('Home');
  };

  return (
    <SafeAreaView style={styles.container}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FF5722" />
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={backToHome} style={styles.leftIcon}>
          <FontAwesome6
            name="arrow-left-long"
            size={24}
            color={isDarkMode ? "#ffffff" : "#4a4a4a"}
          />
        </TouchableOpacity>
        <View style={styles.earningsIconContainer}>
          <FontAwesome6
            name="coins"
            size={24}
            color="#FF5722"
            style={styles.EarningIcon}
          />
          <Text style={styles.screenName}>
            {t('earnings', 'Earnings')}
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {[t('today', 'Today'), t('this_week', 'This Week'), t('select_date', 'Select Date')].map((period) => (
          <TouchableOpacity
            key={period}
            style={[
              styles.tab,
              selectedPeriod === period && styles.tabActive,
            ]}
            onPress={() => handleTabClick(period)}
          >
            <Text
              style={[
                styles.tabText,
                selectedPeriod === period && styles.tabTextActive,
              ]}
            >
              {period}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Earnings Summary */}
      <View style={styles.earningsContainer}>
        <View style={styles.messageContainer}>
          <Text style={styles.totalEarningsText}>
            <Text style={styles.mainRupeeIcon}>₹ </Text>
            {earnings.total_payment}
          </Text>
          <TouchableOpacity
            onPress={() => setIsMessageVisible(!isMessageVisible)}
            style={styles.eyeIconContainer}
          >
            <Feather
              name={isMessageVisible ? 'eye-off' : 'eye'}
              size={20}
              color={isDarkMode ? "#ffffff" : "#4a4a4a"}
            />
          </TouchableOpacity>
        </View>
        {isMessageVisible && (
          <View style={styles.messageBox}>
            <Text style={styles.messageText}>
              {t('viewing_earnings', 'You are viewing the earnings for')}{' '}
              {selectedPeriod}
              {selectedPeriod === t('select_date', 'Select Date') && startDate && endDate
                ? ` ${t('from', 'from')} ${startDate.toLocaleDateString()} ${t('to', 'to')} ${endDate.toLocaleDateString()}`
                : ''}
            </Text>
          </View>
        )}

        <View style={styles.horizontalLine} />
        <View style={styles.cashContainer}>
          <Text style={styles.cashCollectedText}>
            {t('cash_collected', 'Cash collected')}
          </Text>
          <Text style={styles.cashCollectedAmount}>
            <Text style={styles.rupeeIcon}>₹ </Text>
            {earnings.cash_payment}
          </Text>
        </View>
      </View>

      <Text style={styles.cashBackAmount}>
        {t('cash_back', 'Cash back')} ₹50
      </Text>
      <View style={styles.completedCircle}>
        <DestinationCircles complete={earnings.service_counts} />
      </View>

      {/* Statistics */}
      <ScrollView
        contentContainerStyle={styles.statsContainer}
        showsVerticalScrollIndicator={false}
      >
        {[
          { value: earnings.payment_count, title: t('services', 'Services'), color: '#4CAF50' },
          { value: earnings.life_earnings, title: t('total_earnings', 'Total Earnings'), color: '#4CAF50' },
          { value: earnings.cashback_gain, title: t('cashback_earned', 'Cashback Earned'), color: '#4CAF50' },
          { value: earnings.avgrating, title: t('avg_rating', 'Avg Rating'), color: '#4CAF50' },
          { value: earnings.rejectedcount, title: t('cancelled', 'Cancelled'), color: '#ff4436' },
          { value: earnings.cashback_pending, title: t('cashback_pending', 'Cashback pending'), color: '#ffa500' },
        ].map((stat, index) => (
          <View key={index} style={[styles.statBox, { borderLeftColor: stat.color }]}>
            <Text style={[styles.statValue, { color: stat.color }]}>
              {stat.value}
            </Text>
            <Text style={styles.statTitle}>{stat.title}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Calendar Modal */}
      <Modal visible={showCalendar} transparent={true} animationType="slide">
        <TouchableWithoutFeedback onPress={() => setShowCalendar(false)}>
          <View style={styles.modalContainer}>
            <TouchableWithoutFeedback>
              <View style={styles.calendarContainer}>
                <Calendar
                  onDayPress={selectDate}
                  markedDates={getMarkedDates()}
                  markingType={'period'}
                  theme={{
                    selectedDayBackgroundColor: '#4CAF50',
                    todayTextColor: '#4CAF50',
                    arrowColor: '#4CAF50',
                    dotColor: '#4CAF50',
                    selectedDotColor: '#ffffff',
                    monthTextColor: '#4CAF50',
                  }}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

/**
 * A helper function that returns a StyleSheet based on screen width and the current theme.
 * If `width >= 600`, we treat it as a tablet.
 */
function dynamicStyles(width, isDarkMode) {
  const isTablet = width >= 600;
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#121212' : '#ffffff',
      padding: isTablet ? 24 : 16,
    },
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.3)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 999,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      marginBottom: isTablet ? 20 : 10,
    },
    leftIcon: {
      position: 'absolute',
      left: isTablet ? 20 : 10,
    },
    earningsIconContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: isTablet ? 16 : 12,
    },
    EarningIcon: {
      marginRight: 5,
    },
    screenName: {
      color: isDarkMode ? '#ffffff' : '#212121',
      fontSize: isTablet ? 24 : 20,
      fontWeight: 'bold',
    },
    tabs: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      backgroundColor: isDarkMode ? '#333333' : '#f0f0f0',
      height: isTablet ? 60 : 52,
      borderRadius: 10,
      marginTop: isTablet ? 15 : 10,
      paddingHorizontal: 8,
      paddingVertical: 8,
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: isTablet ? 10 : 8,
      marginHorizontal: isTablet ? 5 : 2,
      borderRadius: 8,
    },
    tabActive: {
      backgroundColor: '#FF5722',
    },
    tabText: {
      color: isDarkMode ? '#ffffff' : '#4a4a4a',
      fontSize: isTablet ? 18 : 16,
      fontWeight: '500',
    },
    tabTextActive: {
      color: '#ffffff',
    },
    earningsContainer: {
      backgroundColor: isDarkMode ? '#222222' : '#fff',
      marginTop: isTablet ? 20 : 15,
      marginVertical: 10,
      borderRadius: 10,
      padding: isTablet ? 20 : 16,
      elevation: 4,
    },
    messageContainer: {
      flexDirection: 'row',
      gap: 5,
      justifyContent: 'center',
      alignItems: 'center',
    },
    totalEarningsText: {
      fontSize: isTablet ? 26 : 22,
      fontWeight: 'bold',
      color: isDarkMode ? '#ffffff' : '#212121',
      textAlign: 'center',
    },
    mainRupeeIcon: {
      fontSize: isTablet ? 22 : 18,
      fontWeight: 'bold',
      color: isDarkMode ? '#ffffff' : '#212121',
      textAlign: 'center',
    },
    eyeIconContainer: {
      alignSelf: 'flex-end',
      padding: 10,
    },
    messageBox: {
      marginTop: 10,
      padding: 10,
      marginBottom: 5,
      backgroundColor: isDarkMode ? '#333333' : '#f3f3f3',
      borderRadius: 5,
      alignItems: 'center',
    },
    messageText: {
      fontSize: isTablet ? 16 : 14,
      color: isDarkMode ? '#dddddd' : '#4a4a4a',
      textAlign: 'center',
    },
    horizontalLine: {
      width: '100%',
      height: isTablet ? 3 : 2,
      backgroundColor: isDarkMode ? '#555555' : '#f0f0f0',
      marginVertical: isTablet ? 14 : 10,
    },
    cashContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    cashCollectedText: {
      fontSize: isTablet ? 17 : 15,
      color: isDarkMode ? '#cccccc' : '#4a4a4a',
      fontWeight: 'bold',
      marginTop: 5,
    },
    cashCollectedAmount: {
      color: isDarkMode ? '#ffffff' : '#4a4a4a',
      fontWeight: '900',
      paddingHorizontal: 20,
      fontSize: isTablet ? 17 : 15,
    },
    rupeeIcon: {
      color: isDarkMode ? '#ffffff' : '#4a4a4a',
      fontWeight: '900',
      fontSize: isTablet ? 15 : 13,
    },
    cashBackAmount: {
      color: '#FF5722',
      textAlign: 'right',
      paddingRight: isTablet ? 24 : 16,
      paddingTop: 10,
      fontWeight: '600',
      fontSize: isTablet ? 16 : 14,
    },
    completedCircle: {
      alignItems: 'center',
      marginTop: 10,
    },
    statsContainer: {
      marginTop: isTablet ? 30 : 20,
      paddingBottom: isTablet ? 30 : 20,
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    statBox: {
      backgroundColor: isDarkMode ? '#222222' : '#ffffff',
      padding: isTablet ? 24 : 20,
      marginHorizontal: 5,
      marginVertical: 8,
      alignItems: 'center',
      borderLeftWidth: 4,
      elevation: 4,
      width: isTablet ? '31%' : '46%',
      height: isTablet ? 120 : 100,
    },
    statValue: {
      fontSize: isTablet ? 22 : 20,
      fontWeight: 'bold',
    },
    statTitle: {
      color: isDarkMode ? '#ffffff' : '#4a4a4a',
      fontWeight: '600',
      marginTop: 5,
      fontSize: isTablet ? 16 : 15,
      textAlign: 'center',
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    calendarContainer: {
      backgroundColor: isDarkMode ? '#333333' : '#fff',
      borderRadius: 10,
      marginHorizontal: isTablet ? 60 : 20,
      padding: isTablet ? 24 : 16,
    },
  });
}

export default EarningsScreen;

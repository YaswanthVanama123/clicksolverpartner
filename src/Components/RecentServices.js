import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  useWindowDimensions,
  TextInput,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Icon from 'react-native-vector-icons/Ionicons';
import EncryptedStorage from 'react-native-encrypted-storage';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
// Import translation hook
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';

/** 
 * Example item structure:
 * item = {
 *   notification_id: "...",
 *   created_at: "2023-08-20T10:00:00Z",
 *   total_cost: 100,
 *   complete_status: "ongoing" | "cancel" | ...,
 *   service_booked: [
 *     {
 *       serviceName: "Parking in Downtown",
 *       imageUrl: "https://example.com/image.jpg"
 *     }
 *   ]
 * }
 */

// Helper: format the date
// const formatDate = (created_at) => {
//   const date = new Date(created_at);
//   const monthNames = [
//     'January','February','March','April','May','June',
//     'July','August','September','October','November','December',
//   ];
//   return `${monthNames[date.getMonth()]} ${String(date.getDate()).padStart(2, '0')}, ${date.getFullYear()}`;
// };.

const formatDate = (dateString) => {
  if (!dateString) return 'Pending';

  const date = new Date(dateString);

  return new Intl.DateTimeFormat(i18next.language, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  }).format(date);
};

// Card component for a single service item
const ServiceItemCard = ({ item, styles, tab }) => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const isCancelled =
    item.complete_status === "cancel" ||
    item.complete_status === "usercanceled" ||
    item.complete_status === "workercanceled";

  let buttonLabel = t('view_details', 'View Details');
  let disabled = false;
  if (isCancelled) {
    buttonLabel = t('cancelled', 'Cancelled');
    disabled = true;
  }
  const serviceName =
    item.service_booked && item.service_booked.length > 0
      ?   t(`singleService_${item.service_booked[0]?.main_service_id}`) || item.service_booked[0]?.serviceName  
      : t('unknown_service', 'Unknown Service');
  const imageUrl =
    item.service_booked && item.service_booked.length > 0
      ? item.service_booked[0].imageUrl
      : null;
  return (
    <View style={styles.cardContainer}>
      <Image
        style={styles.cardImage}
        source={imageUrl ? { uri: imageUrl } : null}
      />
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {serviceName}
        </Text>
        <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
        <Text style={styles.cardPrice}>
          {`₹${item.total_cost}`}
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.cardButton, disabled && styles.cardButtonDisabled]}
        onPress={() => {
          if (!disabled) {
            if (tab === 'ongoing') {
              navigation.push('ServiceBookingOngoingItem', {
                tracking_id: item.notification_id,
              });
            } else {
              navigation.push('serviceBookingItem', {
                tracking_id: item.notification_id,
              });
            }
          }
        }}
        disabled={disabled}
      >
        <Text
          style={[styles.cardButtonText, disabled && styles.cardButtonTextDisabled]}
        >
          {buttonLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// Reusable error view for consistent retry UI
const ErrorRetryView = ({ onRetry, styles }) => {
  const { t } = useTranslation();
  return (
    <View style={styles.errorContainer}>
      <MaterialIcons name="error-outline" size={48} color="#FF0000" />
      <Text style={styles.errorText}>
        {t('error_message', 'Something went wrong. Please try again.')}
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
        <Text style={styles.retryButtonText}>
          {t('retry', 'Retry')}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const RecentServices = () => {
  const { width, height } = useWindowDimensions();
  const { isDarkMode } = useTheme();
  const styles = dynamicStyles(width, height, isDarkMode);
  const navigation = useNavigation();
  const { t } = useTranslation();

  // Define fixed tab keys and translated labels
  const TAB_KEYS = {
    ongoing: 'ongoing',
    completed: 'completed',
    cancelled: 'cancelled',
  };

  const tabs = [
    { key: TAB_KEYS.ongoing, label: t('ongoing', 'Ongoing') },
    { key: TAB_KEYS.completed, label: t('completed', 'Completed') },
    { key: TAB_KEYS.cancelled, label: t('cancelled', 'Cancelled') },
  ];

  const [selectedTab, setSelectedTab] = useState(TAB_KEYS.ongoing);
  const [bookingsData, setBookingsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const [searchText, setSearchText] = useState('');

  // Fetch data based on the selected tab
  const fetchBookings = async () => {
    setLoading(true);
    setError(false);
    try {
      const token = await EncryptedStorage.getItem('pcs_token');
      if (!token) throw new Error('Token not found');

      let response;
      if (selectedTab === TAB_KEYS.ongoing) {
        response = await axios.get(
          `https://backend.clicksolver.com/api/worker/ongoingBookings`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        response = await axios.get(
          `https://backend.clicksolver.com/api/worker/bookings`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      setBookingsData(response.data);
    } catch (err) {
      console.error('Error fetching bookings data:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch data when selectedTab changes
  useEffect(() => {
    fetchBookings();
  }, [selectedTab]);

  const getFilteredData = () => {
    // Filter based on the selected tab.
    let data = [];
    if (selectedTab === TAB_KEYS.completed) {
      data = bookingsData.filter(
        (item) =>
          item.complete_status !== "cancel" &&
          item.complete_status !== "usercanceled" &&
          item.complete_status !== "workercanceled"
      );
    } else if (selectedTab === TAB_KEYS.cancelled) {
      data = bookingsData.filter(
        (item) =>
          item.complete_status === "cancel" ||
          item.complete_status === "usercanceled" ||
          item.complete_status === "workercanceled"
      );
    } else {
      data = bookingsData;
    }

    // Filter based on search
    if (searchActive && searchText.trim()) {
      const lowerSearch = searchText.toLowerCase();
      data = data.filter((item) => {
        if (
          item.service_booked &&
          item.service_booked.length > 0 &&
          item.service_booked[0].serviceName
        ) {
          return item.service_booked[0].serviceName
            .toLowerCase()
            .includes(lowerSearch);
        }
        return false;
      });
    }

    // Sort data in descending order by creation date
    data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return data;
  };

  const filteredData = getFilteredData();

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* TOP BAR */}
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>{t('my_services', 'My Services')}</Text>
        <TouchableOpacity
          onPress={() => {
            setSearchActive(!searchActive);
            setSearchText('');
          }}
        >
          <Icon name="search" size={24} color={isDarkMode ? '#fff' : '#000'} />
        </TouchableOpacity>
      </View>

      {/* SEARCH BOX or TAB BAR */}
      {searchActive ? (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder={t('search_services', 'Search services...')}
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
      ) : (
        <View style={styles.tabContainer}>
          {tabs.map((tab) => {
            const active = tab.key === selectedTab;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabButton, active && styles.tabButtonActive]}
                onPress={() => setSelectedTab(tab.key)}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    active && styles.tabButtonTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* CONTENT */}
      <View style={styles.contentContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ff5722" />
          </View>
        ) : error ? (
          <ErrorRetryView onRetry={fetchBookings} styles={styles} />
        ) : filteredData.length === 0 ? (
          <View style={styles.noDataContainer}>
            <MaterialIcons name="search-off" size={48} color="#888" />
            <Text style={styles.noDataText}>
              {t('no_results_found', 'No results found')}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredData}
            keyExtractor={(item, index) =>
              `${item.notification_id}_${index}`
            }
            renderItem={({ item }) => (
              <ServiceItemCard item={item} styles={styles} tab={selectedTab} />
            )}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const dynamicStyles = (width, height, isDarkMode) => {
  const isTablet = width >= 600;
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: isDarkMode ? '#121212' : '#fff',
    },
    /* TOP BAR */
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: isDarkMode ? '#222' : '#fff',
      paddingVertical: isTablet ? 16 : 12,
      paddingHorizontal: isTablet ? 24 : 16,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    topBarTitle: {
      fontSize: isTablet ? 22 : 18,
      fontFamily: 'RobotoSlab-Bold',
      color: isDarkMode ? '#fff' : '#212121',
    },
    /* SEARCH BOX */
    searchContainer: {
      backgroundColor: isDarkMode ? '#333' : '#F8F8F8',
      paddingVertical: isTablet ? 12 : 8,
      paddingHorizontal: isTablet ? 24 : 16,
    },
    searchInput: {
      backgroundColor: isDarkMode ? '#444' : '#fff',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isDarkMode ? '#666' : '#ccc',
      paddingVertical: isTablet ? 10 : 8,
      paddingHorizontal: isTablet ? 14 : 10,
      fontSize: isTablet ? 16 : 14,
      color: isDarkMode ? '#fff' : '#333',
      fontFamily: 'RobotoSlab-Regular',
    },
    /* TABS */
    tabContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isDarkMode ? '#333' : '#F8F8F8',
      paddingVertical: isTablet ? 14 : 10,
    },
    tabButton: {
      paddingVertical: isTablet ? 10 : 8,
      paddingHorizontal: isTablet ? 20 : 14,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: isDarkMode ? '#666' : '#ccc',
      marginHorizontal: 5,
    },
    tabButtonActive: {
      backgroundColor: '#ff5722',
      borderColor: '#ff5722',
    },
    tabButtonText: {
      fontSize: isTablet ? 16 : 14,
      color: isDarkMode ? '#fff' : '#333',
      fontFamily: 'RobotoSlab-Medium',
    },
    tabButtonTextActive: {
      color: '#fff',
    },
    /* CONTENT */
    contentContainer: {
      flex: 1,
      paddingHorizontal: isTablet ? 24 : 16,
      paddingTop: isTablet ? 16 : 12,
    },
    listContent: {
      paddingBottom: isTablet ? 30 : 20,
    },
    /* Loading / Error / No Data */
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 16,
    },
    errorText: {
      fontSize: isTablet ? 18 : 16,
      color: '#FF0000',
      marginVertical: 10,
      fontFamily: 'RobotoSlab-Medium',
      textAlign: 'center',
    },
    retryButton: {
      backgroundColor: isDarkMode ? '#444' : '#FFF',
      borderWidth: 1,
      borderColor: '#ff5722',
      borderRadius: 8,
      paddingVertical: 8,
      paddingHorizontal: 16,
      marginTop: 10,
    },
    retryButtonText: {
      color: '#ff5722',
      fontFamily: 'RobotoSlab-Medium',
      fontSize: isTablet ? 16 : 14,
    },
    noDataContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    noDataText: {
      marginTop: 8,
      fontSize: isTablet ? 18 : 16,
      color: '#888',
      fontFamily: 'RobotoSlab-Regular',
    },
    /* CARD LAYOUT */
    cardContainer: {
      flexDirection: 'row',
      backgroundColor: isDarkMode ? '#333' : '#fff',
      borderRadius: 12,
      marginBottom: isTablet ? 16 : 12,
      padding: isTablet ? 16 : 12,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    cardImage: {
      width: isTablet ? 80 : 60,
      height: isTablet ? 80 : 60,
      borderRadius: 8,
      marginRight: isTablet ? 14 : 10,
      backgroundColor: '#eee',
    },
    cardInfo: {
      flex: 1,
      justifyContent: 'center',
    },
    cardTitle: {
      fontSize: isTablet ? 16 : 14,
      fontFamily: 'RobotoSlab-SemiBold',
      color: isDarkMode ? '#fff' : '#212121',
      marginBottom: 4,
    },
    cardDate: {
      fontSize: isTablet ? 14 : 12,
      fontFamily: 'RobotoSlab-Regular',
      color: isDarkMode ? '#bbb' : '#777',
      marginBottom: 4,
    },
    cardPrice: {
      fontSize: isTablet ? 16 : 14,
      fontFamily: 'RobotoSlab-Medium',
      color: isDarkMode ? '#fff' : '#333',
    },
    cardButton: {
      paddingVertical: isTablet ? 10 : 8,
      paddingHorizontal: isTablet ? 12 : 10,
      backgroundColor: '#ff5722',
      borderRadius: 8,
      marginLeft: isTablet ? 12 : 8,
    },
    cardButtonText: {
      fontSize: isTablet ? 14 : 12,
      fontFamily: 'RobotoSlab-Medium',
      color: '#fff',
    },
    cardButtonDisabled: {
      backgroundColor: '#ccc',
    },
    cardButtonTextDisabled: {
      color: '#888',
    },
  });
};

export default RecentServices;

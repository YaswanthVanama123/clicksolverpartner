import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TouchableWithoutFeedback,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import EncryptedStorage from 'react-native-encrypted-storage';
import axios from 'axios';
import uuid from 'react-native-uuid';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';

// 1) Map raw server statuses to i18n keys.
const statusMap = {
  'Work Completed': 'work_completed',
  'Work started': 'work_started',
  'Collected Item': 'collected_item',
  // If your server might send other statuses, add them here.
};

const ServiceTrackingListScreen = () => {
  const { width, height } = useWindowDimensions();
  const { isDarkMode } = useTheme();
  const styles = dynamicStyles(width, height, isDarkMode);
  const { t } = useTranslation();
  const navigation = useNavigation();

  // 2) We’ll store the server data and the filtered list separately.
  const [serviceData, setServiceData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedFilters, setSelectedFilters] = useState([]); // translation keys
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // 3) Define filter options as translation keys, not raw text.
  //    We'll provide fallback text if translations aren't set up yet.
  const filterOptions = [
    'collected_item',
    'work_started',
    'work_completed',
  ];

  // Fetch data from API
  const fetchBookings = async () => {
    setLoading(true);
    setError(false);
    try {
      const token = await EncryptedStorage.getItem('pcs_token');
      if (!token) throw new Error('Token not found');

      const response = await axios.get(
        'https://backend.clicksolver.com/api/worker/tracking/services',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      console.log('data', response.data);
      setServiceData(response.data);
      setFilteredData(response.data);
    } catch (err) {
      console.error('Error fetching bookings data:', err.response || err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Utility to format date
  // const formatDate = (created_at) => {
  //   const date = new Date(created_at);
  //   const monthNames = [
  //     'January','February','March','April','May','June',
  //     'July','August','September','October','November','December',
  //   ];
  //   return `${monthNames[date.getMonth()]} ${String(date.getDate()).padStart(2, '0')}, ${date.getFullYear()}`;
  // };

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

  // Navigate to detail screen
  const handleCardPress = (trackingId) => {
    navigation.push('ServiceTrackingItem', { tracking_id: trackingId });
  };

  // Toggle filter selection and re-filter data
  const toggleFilter = (statusKey) => {
    const updatedFilters = selectedFilters.includes(statusKey)
      ? selectedFilters.filter((s) => s !== statusKey)
      : [...selectedFilters, statusKey];

    setSelectedFilters(updatedFilters);

    if (updatedFilters.length === 0) {
      // No filters selected, show all
      setFilteredData(serviceData);
    } else {
      // Show only items whose mapped key is in updatedFilters
      const newFilteredData = serviceData.filter((item) => {
        const key = statusMap[item.service_status]; // e.g. "work_started"
        return updatedFilters.includes(key);
      });
      setFilteredData(newFilteredData);
    }
  };

  // Close the filter dropdown if user taps outside
  const handleOutsidePress = () => {
    if (isFilterVisible) {
      setIsFilterVisible(false);
    }
  };

  // Component to render each service item
  const ServiceItem = ({ item }) => {
    // Convert raw status to i18n key
    const key = statusMap[item.service_status] || 'unknown_status';
    // Get the localized status text
    const statusText = t(key, item.service_status);

    // Decide the background color of the label
    let labelStyle = styles.onTheWay;
    if (key === 'work_started') labelStyle = styles.inProgress;
    if (key === 'work_completed') labelStyle = styles.completed;
    if (key === 'collected_item') labelStyle = styles.onTheWay;

    return (
      <TouchableOpacity
        style={styles.itemContainer}
        onPress={() => handleCardPress(item.tracking_id)}
      >
        <View style={styles.itemMainContainer}>
          <View style={styles.serviceIconContainer}>
            <MaterialCommunityIcons
              name={
                key === 'work_completed'
                  ? 'check-circle'
                  : key === 'work_started'
                  ? 'hammer'
                  : 'truck'
              }
              size={24}
              color="#ffffff"
            />
          </View>
          <View style={styles.itemTextContainer}>
            {/* Show the translated status text */}
            <Text style={styles.itemTitle}>{statusText}</Text>
            <Text style={styles.itemDate}>
              {t('scheduled_for', 'Scheduled for:')}
            </Text>
            <Text style={styles.itemDate}>{formatDate(item.created_at)}</Text>
          </View>
          <View style={[styles.statusLabel, labelStyle]}>
            {/* <Text style={styles.statusText}>{statusText}</Text> */}
            <Text style={styles.statusText}>View</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <TouchableWithoutFeedback onPress={handleOutsidePress}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <Icon name="arrow-back" size={24} color={isDarkMode ? '#ffffff' : '#000'} />
          <Text style={styles.headerTitle}>
            {t('service_tracking', 'Service Tracking')}
          </Text>
          <TouchableOpacity onPress={() => setIsFilterVisible(!isFilterVisible)}>
            <Icon name="filter-list" size={24} color={isDarkMode ? '#ffffff' : '#000'} />
          </TouchableOpacity>
        </View>

        {/* Filter Dropdown */}
        {isFilterVisible && (
          <View style={styles.dropdownContainer}>
            <Text style={styles.dropdownTitle}>
              {t('project_type', 'PROJECT TYPE')}
            </Text>
            {filterOptions.map((optionKey) => {
              // Provide fallback if translation not found
              let fallback = 'Unknown Status';
              if (optionKey === 'work_started') fallback = 'Work started';
              if (optionKey === 'work_completed') fallback = 'Work Completed';
              if (optionKey === 'collected_item') fallback = 'Collected Item';

              return (
                <TouchableOpacity
                  key={optionKey}
                  style={styles.dropdownOption}
                  onPress={() => toggleFilter(optionKey)}
                >
                  <Icon
                    name={
                      selectedFilters.includes(optionKey)
                        ? 'check-box'
                        : 'check-box-outline-blank'
                    }
                    size={20}
                    color={isDarkMode ? '#ffffff' : '#4a4a4a'}
                  />
                  <Text style={styles.dropdownText}>{t(optionKey, fallback)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Service List */}
        <View style={styles.trackingItems}>
          {loading ? (
            <ActivityIndicator
              size="large"
              color="#FF5722"
              style={styles.loadingIndicator}
            />
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>
                {t('error_message', 'Something went wrong. Please try again.')}
              </Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchBookings}>
                <Text style={styles.retryButtonText}>{t('retry', 'Retry')}</Text>
              </TouchableOpacity>
            </View>
          ) : filteredData.length === 0 ? (
            <View style={styles.noDataContainer}>
              <Icon name="search-off" size={48} color="#888" />
              <Text style={styles.noDataText}>
                {t('no_tracking_data', 'No tracking data available')}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredData}
              renderItem={({ item }) => <ServiceItem item={item} />}
              keyExtractor={() => uuid.v4()}
              contentContainerStyle={styles.listContainer}
            />
          )}
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

// Dynamic styles
function dynamicStyles(width, height, isDarkMode) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#121212' : '#f3f3f3',
    },
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 16,
      // elevation: 2,
      // shadowColor: '#000',
      // shadowOffset: { width: 0, height: 2 },
      // shadowOpacity: 0.2,
      // shadowRadius: 4,
      backgroundColor: isDarkMode ? '#1f1f1f' : '#ffffff',
      zIndex: 1,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: isDarkMode ? '#ffffff' : '#000',
    },
    dropdownContainer: {
      position: 'absolute',
      top: 70,
      right: 16,
      width: 200,
      backgroundColor: isDarkMode ? '#1f1f1f' : '#ffffff',
      borderRadius: 8,
      padding: 10,
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      zIndex: 10,
    },
    dropdownTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      color: isDarkMode ? '#ffffff' : '#212121',
      marginBottom: 8,
    },
    dropdownOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
    },
    dropdownText: {
      marginLeft: 8,
      fontSize: 14,
      color: isDarkMode ? '#ffffff' : '#4a4a4a',
    },
    trackingItems: {
      flex: 1,
      paddingTop: 10,
    },
    listContainer: {
      paddingHorizontal: 16,
    },
    itemContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: isDarkMode ? '#222222' : '#fff',
      borderRadius: 10,
      padding: 20,
      marginBottom: 16,
    },
    itemMainContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      flex: 1,
    },
    serviceIconContainer: {
      width: 50,
      height: 50,
      backgroundColor: '#ff5722',
      borderRadius: 50,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    itemTextContainer: {
      flex: 1,
      marginRight: 16,
    },
    itemTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: isDarkMode ? '#ffffff' : '#212121',
      marginBottom: 4,
    },
    itemDate: {
      fontSize: 12,
      color: isDarkMode ? '#cccccc' : '#4a4a4a',
    },
    statusLabel: {
      borderRadius: 10,
      paddingVertical: 8,
      paddingHorizontal: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    inProgress: {
      backgroundColor: '#ffecb3', // Example color
    },
    completed: {
      backgroundColor: '#c8e6c9', // Example color
    },
    onTheWay: {
      backgroundColor: '#bbdefb', // Example color
    },
    statusText: {
      fontSize: 12,
      fontWeight: 'bold',
      color: isDarkMode ? '#ffffff' : '#212121',
    },
    loadingIndicator: {
      marginTop: 20,
      alignSelf: 'center',
    },
    noDataContainer: {
      marginTop: 20,
      alignItems: 'center',
    },
    noDataText: {
      fontSize: 16,
      color: isDarkMode ? '#ffffff' : '#212121',
      marginTop: 10,
    },
    errorContainer: {
      marginTop: 20,
      alignItems: 'center',
    },
    errorText: {
      fontSize: 16,
      color: isDarkMode ? '#ffffff' : '#212121',
      marginBottom: 10,
    },
    retryButton: {
      backgroundColor: '#FF5722',
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 5,
    },
    retryButtonText: {
      color: '#fff',
      fontSize: 16,
    },
  });
}

export default ServiceTrackingListScreen;
 
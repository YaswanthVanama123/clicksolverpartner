import React, { useState, useEffect, useCallback } from 'react';
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
// Import our theme hook
import { useTheme } from '../context/ThemeContext';

const ServiceTrackingListScreen = () => {
  const { width, height } = useWindowDimensions();
  const { isDarkMode } = useTheme();
  const styles = dynamicStyles(width, height, isDarkMode);

  const [serviceData, setServiceData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const navigation = useNavigation();

  const filterOptions = ['Collected Item', 'Work started', 'Work Completed'];

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
      console.log("data",response.data);
      setServiceData(response.data);
      setFilteredData(response.data);
    } catch (error) {
      console.log("work")
      console.error('Error fetching bookings data:', error.response || error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const formatDate = (created_at) => {
    const date = new Date(created_at);
    const monthNames = [
      'January','February','March','April','May','June',
      'July','August','September','October','November','December',
    ];
    return `${monthNames[date.getMonth()]} ${String(date.getDate()).padStart(2, '0')}, ${date.getFullYear()}`;
  };

  const handleCardPress = (trackingId) => {
    navigation.push('ServiceTrackingItem', { tracking_id: trackingId });
  };

  const toggleFilter = (status) => {
    const updatedFilters = selectedFilters.includes(status)
      ? selectedFilters.filter((s) => s !== status)
      : [...selectedFilters, status];

    setSelectedFilters(updatedFilters);

    const filtered =
      updatedFilters.length > 0
        ? serviceData.filter((item) => updatedFilters.includes(item.service_status))
        : serviceData;

    setFilteredData(filtered);
  };

  const handleOutsidePress = () => {
    if (isFilterVisible) {
      setIsFilterVisible(false);
    }
  };

  // Sub-component for each service item
  const ServiceItem = ({ item }) => {
    return (
      <TouchableOpacity
        style={styles.itemContainer}
        onPress={() => handleCardPress(item.tracking_id)}
      >
        <View style={styles.itemMainContainer}>
          <View style={styles.serviceIconContainer}>
            <MaterialCommunityIcons
              name={
                item.service_status === 'Work Completed'
                  ? 'check-circle'
                  : item.service_status === 'Work started'
                  ? 'hammer'
                  : 'truck'
              }
              size={24}
              color="#ffffff"
            />
          </View>
          <View style={styles.itemTextContainer}>
            <Text style={styles.itemTitle}>{item.service_status}</Text>
            <Text style={styles.itemDate}>Scheduled for:</Text>
            <Text style={styles.itemDate}>{formatDate(item.created_at)}</Text>
          </View>
          <View
            style={[
              styles.statusLabel,
              item.service_status === 'Collected Item'
                ? styles.inProgress
                : item.service_status === 'Work Completed'
                ? styles.completed
                : styles.onTheWay,
            ]}
          >
            <Text style={styles.statusText}>
              {item.service_status === 'Work Completed'
                ? 'Completed'
                : item.service_status === 'Work started'
                ? 'In Progress'
                : item.service_status === 'Collected Item'
                ? 'Item Collected'
                : 'On the Way'}
            </Text>
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
          <Icon name="arrow-back" size={24} color={isDarkMode ? "#ffffff" : "#000"} />
          <Text style={styles.headerTitle}>Service Tracking</Text>
          <TouchableOpacity onPress={() => setIsFilterVisible(!isFilterVisible)}>
            <Icon name="filter-list" size={24} color={isDarkMode ? "#ffffff" : "#000"} />
          </TouchableOpacity>
        </View>

        {/* Filter Dropdown */}
        {isFilterVisible && (
          <View style={styles.dropdownContainer}>
            <Text style={styles.dropdownTitle}>PROJECT TYPE</Text>
            {filterOptions.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={styles.dropdownOption}
                onPress={() => toggleFilter(option)}
              >
                <Icon
                  name={
                    selectedFilters.includes(option)
                      ? 'check-box'
                      : 'check-box-outline-blank'
                  }
                  size={20}
                  color={isDarkMode ? "#ffffff" : "#4a4a4a"}
                />
                <Text style={styles.dropdownText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Service List */}
        <View style={styles.trackingItems}>
        {loading ? (
  <ActivityIndicator size="large" color="#FF5722" style={styles.loadingIndicator} />
) : error ? (
  <View style={styles.errorContainer}>
    <Text style={styles.errorText}>Something went wrong. Please try again.</Text>
    <TouchableOpacity style={styles.retryButton} onPress={fetchBookings}>
      <Text style={styles.retryButtonText}>Retry</Text>
    </TouchableOpacity>
  </View>
) : filteredData.length === 0 ? (
  <View style={styles.noDataContainer}>
    <Icon name="search-off" size={48} color="#888" />
    <Text style={styles.noDataText}>No tracking data available</Text>
    {/* <TouchableOpacity style={styles.retryButton} onPress={fetchBookings}>
      <Text style={styles.retryButtonText}>Retry</Text>
    </TouchableOpacity> */}
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

/**
 * Dynamic styles generator that accepts screen width, height, and isDarkMode flag.
 */
function dynamicStyles(width, height, isDarkMode) {
  const isTablet = width >= 600;

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
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
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
      backgroundColor: '#ffecb3',
    },
    completed: {
      backgroundColor: '#c8e6c9',
    },
    onTheWay: {
      backgroundColor: '#bbdefb',
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

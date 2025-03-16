import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import EncryptedStorage from 'react-native-encrypted-storage';
import axios from 'axios';
import uuid from 'react-native-uuid';
import {useNavigation} from '@react-navigation/native';

const AdministratorAllTrackings = () => {
  const [serviceData, setServiceData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState([]);
  const navigation = useNavigation();

  const filterOptions = ['Collected Item', 'Work started', 'Work Completed'];

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const token = await EncryptedStorage.getItem('pcs_token');
        if (!token) throw new Error('Token not found');

        const response = await axios.get(
          `https://backend.clicksolver.com/api/all/tracking/services`,
          {},
        );
        setServiceData(response.data);
        setFilteredData(response.data); // Initially display all data
      } catch (error) {
        console.error('Error fetching bookings data:', error);
      }
    };

    fetchBookings();
  }, []);

  const formatDate = created_at => {
    const date = new Date(created_at);
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return `${monthNames[date.getMonth()]} ${String(date.getDate()).padStart(
      2,
      '0',
    )}, ${date.getFullYear()}`;
  };

  const handleCardPress = trackingId => {
    navigation.push('ServiceTrackingItem', {tracking_id: trackingId});
  };

  const toggleFilter = status => {
    const updatedFilters = selectedFilters.includes(status)
      ? selectedFilters.filter(s => s !== status)
      : [...selectedFilters, status];

    setSelectedFilters(updatedFilters);

    // Apply filter immediately
    const filtered =
      updatedFilters.length > 0
        ? serviceData.filter(item =>
            updatedFilters.includes(item.service_status),
          )
        : serviceData;

    setFilteredData(filtered);
  };

  const handleOutsidePress = () => {
    if (isFilterVisible) {
      setIsFilterVisible(false);
    }
  };

  const renderItem = ({item}) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => handleCardPress(item.tracking_id)}>
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
        <Text style={styles.itemDate}>
          Scheduled for: {formatDate(item.created_at)}
        </Text>
      </View>
      <View
        style={[
          styles.statusLabel,
          item.service_status === 'Collected Item'
            ? styles.inProgress
            : item.service_status === 'Work Completed'
            ? styles.completed
            : styles.onTheWay,
        ]}>
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
    </TouchableOpacity>
  );

  return (
    <TouchableWithoutFeedback onPress={handleOutsidePress}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <Icon name="arrow-back" size={24} color="#000" />
          <Text style={styles.headerTitle}>Service Tracking</Text>
          <TouchableOpacity
            onPress={() => setIsFilterVisible(!isFilterVisible)}>
            <Icon name="filter-list" size={24} color="#000" />
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
                onPress={() => toggleFilter(option)}>
                <Icon
                  name={
                    selectedFilters.includes(option)
                      ? 'check-box'
                      : 'check-box-outline-blank'
                  }
                  size={20}
                  color="#4a4a4a"
                />
                <Text style={styles.dropdownText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Service List */}
        <View style={styles.trackingItems}>
          <FlatList
            data={filteredData}
            renderItem={renderItem}
            keyExtractor={() => uuid.v4()}
            contentContainerStyle={styles.listContainer}
          />
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    backgroundColor: '#ffffff',
    zIndex: 1, // Ensure header is above other components
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  dropdownContainer: {
    position: 'absolute',
    top: 70, // Adjust based on header height
    right: 16,
    width: 200,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 10, // Ensure dropdown is above other items
  },
  dropdownTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#212121',
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
    color: '#4a4a4a',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  trackingItems: {
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
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#212121',
  },
  itemDate: {
    fontSize: 12,
    color: '#4a4a4a',
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
    color: '#212121',
  },
});

export default AdministratorAllTrackings;

import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import EncryptedStorage from 'react-native-encrypted-storage';
import axios from 'axios';
import uuid from 'react-native-uuid';
import {useNavigation} from '@react-navigation/native';

const PendingCashbackWorkers = () => {
  const [serviceData, setServiceData] = useState([
    {
      id: 1,
      name: 'Yaswanth',
      profession: 'Electrician',
      pending: 200,
      created_at: 'Oct 31 2024',
    },
    {
      id: 2,
      name: 'Gandhi',
      profession: 'Plumber',
      pending: 200,
      created_at: 'Oct 31 2024',
    },
    {
      id: 3,
      name: 'Yaswanth',
      profession: 'Electrician',
      pending: 200,
      created_at: 'Oct 31 2024',
    },
  ]);
  const [filteredData, setFilteredData] = useState([]);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState([]);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await axios.get(
          `https://backend.clicksolver.com/api/workers/pending/cashback`,
          {},
        );
        console.log(response.data);
        setServiceData(response.data);
      } catch (error) {
        console.error('Error fetching bookings data:', error);
      }
    };

    fetchBookings();
  }, []);

  const formatDate = created_at => {
    const date = new Date(created_at);
    return `${String(date.getDate()).padStart(2, '0')} ${date.toLocaleString(
      'default',
      {month: 'short'},
    )} ${date.getFullYear()}`;
  };

  const handleCardPress = worker_id => {
    console.log(worker_id);
    navigation.push('WorkerPendingCashback', {worker_id: worker_id});
  };

  const renderItem = ({item}) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => handleCardPress(item.worker_id)}>
      <Image source={{uri: item.profile}} style={styles.profile} />
      <View style={styles.itemTextContainer}>
        <Text style={styles.itemTitle}>{item.name}</Text>
        <Text style={styles.itemSubtitle}>{item.service}</Text>
      </View>
      <View style={styles.amountContainer}>
        <Text style={styles.amountText}>{item.pending_cashback * 100}</Text>
        <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <TouchableWithoutFeedback onPress={() => setIsFilterVisible(false)}>
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Icon name="arrow-back" size={24} color="#000" />
          <Text style={styles.headerTitle}>Pending Cashback</Text>
          <TouchableOpacity
            onPress={() => setIsFilterVisible(!isFilterVisible)}>
            <Icon name="filter-list" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {isFilterVisible && (
          <View style={styles.dropdownContainer}>
            {/* Filter options go here */}
          </View>
        )}
        <View style={styles.contentContainer}>
          <FlatList
            data={serviceData}
            renderItem={renderItem}
            keyExtractor={item => item.id}
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
    backgroundColor: '#ffffff',
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
    textAlign: 'center',
    marginRight: 24, // Adjusts for center alignment with back icon
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  profile: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  itemTextContainer: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    paddingTop: 20,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#4a4a4a',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff5722',
  },
  dateText: {
    fontSize: 12,
    color: '#4a4a4a',
  },
});

export default PendingCashbackWorkers;

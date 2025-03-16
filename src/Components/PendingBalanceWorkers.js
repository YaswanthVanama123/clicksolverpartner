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
import axios from 'axios';
import {useNavigation} from '@react-navigation/native';

const PendingBalanceWorkers = () => {
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
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const navigation = useNavigation();
  const filterOptions = ['Negative', 'Positive'];
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await axios.get(
          `https://backend.clicksolver.com/api/pending/balance/workers`,
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

  const toggleFilter = status => {
    const updatedFilters = selectedFilters.includes(status)
      ? selectedFilters.filter(s => s !== status)
      : [...selectedFilters, status];

    console.log('fil', updatedFilters);

    setSelectedFilters(updatedFilters);

    // Apply filter immediately
    const filtered =
      updatedFilters.length > 0 ? (
        serviceData.filter(item => {
          {
            console.log('it', item);
          }
          // Determine if item should be included based on balance_amount and status
          const balanceAmount = parseInt(item.balance_amount);
          const meetsStatusCondition =
            (status === 'positive' && balanceAmount > 0) ||
            (status === 'negative' && balanceAmount < 0);

          return meetsStatusCondition;
        })
      ) : (
        <></>
      );

    setFilteredData(filtered);
  };

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
        <Text style={styles.amountText}>{item.balance_amount}</Text>
        <Text style={styles.dateText}>Oct 31 2024</Text>
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
            <Text style={styles.dropdownTitle}>SORT BY STATUS</Text>
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

export default PendingBalanceWorkers;

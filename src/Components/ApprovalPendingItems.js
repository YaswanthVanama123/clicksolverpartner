import axios from 'axios';
import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useNavigation} from '@react-navigation/native';

const ApprovalPendingItems = () => {
  const navigation = useNavigation();
  const [statuses, setStatuses] = useState([
    {
      title: 'Mobile Number Verified',
      date: 'October 25, 2024',
      issues: {
        'Mobile Number Verified': 'Incorrect mobile number format',
      },
    },
    {
      title: 'Details Verified',
      date: 'October 25, 2024',
      issues: {},
    },
    {
      title: 'Profile and Proof Verified',
      date: 'October 25, 2024',
      issues: {
        'Profile and Proof Verified': 'Proof document is missing',
      },
    },
    {
      title: 'Bank Account Verified',
      date: 'October 25, 2024',
      issues: {},
    },
  ]);

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
    const day = date.getDate();
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${month} ${String(day).padStart(2, '0')}, ${year}`;
  };

  useEffect(() => {
    const fetchPendingItems = async () => {
      console.log(process.env.BackendAPI17);
      try {
        const response = await axios.get(
          `https://backend.clicksolver.com/api/workers/pending/verification`,
        );
        const data = response.data.data; // Assuming the response structure is { data: [...] }
        console.log(JSON.stringify(data, null, 2));

        const pendingWorkers = data.map(worker => {
          const {verification_status, created_at, issues, worker_id} = worker;
          return {
            title: verification_status,
            date: formatDate(created_at), // Assuming formatDate is a function you have defined
            issues: issues || {}, // Default to an empty object if no issues are present
            workerId: worker_id,
          };
        });

        // Set the formatted array to the statuses state
        setStatuses(pendingWorkers);
      } catch (error) {
        console.error('Error fetching bookings data:', error);
      }
    };
    fetchPendingItems();
  }, []);

  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState([]);

  const filterOptions = [
    'Mobile Number Verified',
    'Details Verified',
    'Profile and Proof Verified',
    'Bank Account Verified',
  ];

  const getStatusDetails = (title, issues) => {
    if (issues && Object.keys(issues).length > 0) {
      return {
        icon: 'error-outline',
        statusColor: '#FFA500',
        statusText: 'Issues Found',
      };
    }

    switch (title) {
      case 'Mobile Number Verified':
        return {
          icon: 'phone-iphone',
          statusColor: '#ff4500',
          statusText: 'Verified',
        };
      case 'Details Verified':
        return {
          icon: 'account-box',
          statusColor: '#ff4500',
          statusText: 'Verified',
        };
      case 'Profile and Proof Verified':
        return {
          icon: 'assignment',
          statusColor: '#ff4500',
          statusText: 'Verified',
        };
      case 'Bank Account Verified':
        return {
          icon: 'account-balance',
          statusColor: '#ff4500',
          statusText: 'Verified',
        };
      default:
        return {
          icon: 'help-outline',
          statusColor: '#808080',
          statusText: 'Unknown',
        };
    }
  };

  const toggleFilter = status => {
    const updatedFilters = selectedFilters.includes(status)
      ? selectedFilters.filter(s => s !== status)
      : [...selectedFilters, status];

    setSelectedFilters(updatedFilters);
  };

  const filteredStatuses = statuses.filter(status => {
    if (selectedFilters.length > 0 && !selectedFilters.includes(status.title)) {
      return false;
    }
    return true;
  });

  const handleItemPress = workerId => {
    navigation.push('IndividualWorkerPending', {workerId});
  };

  return (
    <View style={{flex: 1}}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Approval Pending Items</Text>
        <TouchableOpacity onPress={() => setIsFilterVisible(!isFilterVisible)}>
          <MaterialIcons name="filter-list" size={24} color="#333" />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        {filteredStatuses.map((item, index) => {
          const {icon, statusColor, statusText} = getStatusDetails(
            item.title,
            item.issues,
          );
          return (
            <TouchableOpacity
              key={index}
              style={styles.cardContainer}
              onPress={() => handleItemPress(item.workerId)}>
              <View style={styles.iconContainer}>
                <MaterialIcons name={icon} size={28} color={statusColor} />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemDate}>Scheduled for: {item.date}</Text>
              </View>
              <View
                style={[styles.statusButton, {backgroundColor: statusColor}]}>
                <Text style={styles.statusText}>{statusText}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {isFilterVisible && (
        <View style={styles.dropdownContainer}>
          <Text style={styles.dropdownTitle}>PROJECT TYPE</Text>
          {filterOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={styles.dropdownOption}
              onPress={() => toggleFilter(option)}>
              <MaterialIcons
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F8F9FB',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 10,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1D2951',
  },
  dropdownContainer: {
    position: 'absolute',
    top: 60, // Adjusted to position below the header
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
    zIndex: 10,
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
  cardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    backgroundColor: '#FFF1E6',
    padding: 10,
    borderRadius: 50,
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  itemDate: {
    fontSize: 14,
    color: '#666666',
  },
  statusButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default ApprovalPendingItems;

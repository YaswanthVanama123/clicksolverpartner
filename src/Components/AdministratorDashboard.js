import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ScrollView,
  Modal,
  SafeAreaView,
  TouchableWithoutFeedback,
} from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import {useNavigation} from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Feather from 'react-native-vector-icons/Feather';
import {Calendar} from 'react-native-calendars';
import Icon from 'react-native-vector-icons/Ionicons';
import axios from 'axios';

const DashboardScreen = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('Today');
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [greeting, setGreeting] = useState('');
  const [greetingIcon, setGreetingIcon] = useState(null);
  const navigation = useNavigation();

  const dashboardItems = [
    {
      id: 1,
      label: 'Service Tracking',
      icon: 'chart-bar',
      color: '#ff4500',
      screen: 'AdministratorAllTrackings',
    },
    {
      id: 2,
      label: 'Worker Approval Pendings',
      icon: 'user-check',
      color: '#ff4500',
      screen: 'ApprovalPendingItems',
    },
    {
      id: 3,
      label: 'Pending Cashback',
      icon: 'tag',
      color: '#ff4500',
      screen: 'PendingCashbackWorkers',
    },
    {
      id: 4,
      label: 'Pending Balance',
      icon: 'wallet',
      color: '#ff4500',
      screen: 'PendingBalanceWorkers',
    },
  ];

  const statsItems = [
    {id: 1, label: 'No of Workers', value: 50},
    {id: 2, label: 'No of Users', value: 50},
    {id: 3, label: 'No of Services', value: 50},
    {id: 4, label: 'No of cancels', value: 50},
    {id: 5, label: 'No of user cancels', value: 50},
    {id: 6, label: 'No of worker cancels', value: 50},
    {id: 7, label: 'Total Earnings', value: 50},
    {id: 8, label: 'Total Profit', value: 50},
    {id: 9, label: 'Cashback given', value: 50},
    {id: 10, label: 'Cashback Money', value: 50},
    {id: 11, label: 'Pending Balance', value: 50},
    {id: 12, label: 'Pending Balance workers', value: 50},
  ];

  const handleAdministratorScreen = screen => {
    navigation.push(screen);
  };

  useEffect(() => {
    setGreetingBasedOnTime();
  }, []);

  const handleSortSelection = period => {
    setSelectedPeriod(period);
    setShowSortOptions(false);

    if (period === 'Today') {
      const today = new Date().toISOString().split('T')[0];
      sendDataToBackend({date: today});
    } else if (period === 'This Week') {
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      sendDataToBackend({
        startDate: startOfWeek.toISOString().split('T')[0],
        endDate: endOfWeek.toISOString().split('T')[0],
      });
    } else if (period === 'Specific Date') {
      setShowCalendar(true);
    }
  };

  const sendDataToBackend = async payload => {
    console.log('date', payload);
    console.log(process.env.BackendAPI17);
    try {
      const response = await axios.post(
        `https://backend.clicksolver.com/api/administrator/service/date/details`,
        payload,
      );
      console.log(response.data);
    } catch (error) {
      console.error('Error sending data:', error);
    }
  };

  const selectDate = day => {
    const selected = new Date(day.dateString);

    if (!startDate || (startDate && endDate)) {
      setStartDate(selected);
      setEndDate(null);
    } else if (startDate && !endDate) {
      if (selected >= startDate) {
        setEndDate(selected);
        setShowCalendar(false);
        sendDataToBackend({
          startDate: startDate.toISOString().split('T')[0],
          endDate: selected.toISOString().split('T')[0],
        });
      } else {
        setStartDate(selected);
      }
    }
  };

  const setGreetingBasedOnTime = () => {
    const currentHour = new Date().getHours();
    let greetingMessage = 'Good Day';
    let icon = <Icon name="sunny-sharp" size={14} color="#F24E1E" />;

    if (currentHour < 12) {
      greetingMessage = 'Good Morning';
      icon = <Icon name="sunny-sharp" size={16} color="#F24E1E" />;
    } else if (currentHour < 17) {
      greetingMessage = 'Good Afternoon';
      icon = <Feather name="sunset" size={16} color="#F24E1E" />;
    } else {
      greetingMessage = 'Good Evening';
      icon = <MaterialIcons name="nights-stay" size={16} color="#000" />;
    }

    setGreeting(greetingMessage);
    setGreetingIcon(icon);
  };

  const getMarkedDates = () => {
    if (startDate && endDate) {
      let range = {};
      let current = new Date(startDate);
      while (current <= endDate) {
        const dateString = current.toISOString().split('T')[0];
        range[dateString] = {
          color: '#4CAF50',
          textColor: 'white',
          startingDay: dateString === startDate.toISOString().split('T')[0],
          endingDay: dateString === endDate.toISOString().split('T')[0],
        };
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <View style={styles.greeting}>
            <Text style={styles.greetingText}>
              {greeting} <Text style={styles.greetingIcon}>{greetingIcon}</Text>
            </Text>
            <Text style={styles.userName}>Yaswanth</Text>
          </View>
        </View>
        <View style={styles.dashboardContainer}>
          {dashboardItems.map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.iconButton}
              onPress={() => handleAdministratorScreen(item.screen)}>
              <FontAwesome5 name={item.icon} size={25} color={item.color} />
              <Text style={styles.buttonText}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.viewAllButton}>
          <Text style={styles.viewAllText}>View all</Text>
        </TouchableOpacity>

        <View style={styles.statsContainer}>
          <View style={styles.sortContainer}>
            <TouchableOpacity
              onPress={() => setShowSortOptions(true)}
              style={styles.sortButton}>
              <Text style={styles.sortText}>Sort by</Text>
              <MaterialIcons name="sort" size={20} color="#4a4a4a" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={statsItems}
            numColumns={2}
            keyExtractor={item => item.id.toString()}
            renderItem={({item}) => (
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>{item.label}</Text>
                <Text style={styles.statValue}>{item.value}</Text>
              </View>
            )}
          />
        </View>
      </ScrollView>

      {/* Sort Options Modal */}
      <Modal visible={showSortOptions} transparent={true} animationType="slide">
        <TouchableWithoutFeedback onPress={() => setShowSortOptions(false)}>
          <View style={styles.modalContainer}>
            <TouchableWithoutFeedback>
              <View style={styles.optionsContainer}>
                {['Today', 'This Week', 'Specific Date'].map(period => (
                  <TouchableOpacity
                    key={period}
                    style={styles.radioOption}
                    onPress={() => handleSortSelection(period)}>
                    <Icon
                      name={
                        selectedPeriod === period
                          ? 'radio-button-on'
                          : 'radio-button-off'
                      }
                      size={20}
                      color={selectedPeriod === period ? '#FF5722' : '#4a4a4a'}
                    />
                    <Text style={styles.radioText}>{period}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f4',
  },
  header: {
    alignItems: 'center',
    marginVertical: 20,
  },
  greeting: {
    flexDirection: 'column',
    color: '#333',
  },
  greetingText: {
    fontSize: 14,
    fontFamily: 'Roboto',
    lineHeight: 18.75,
    fontStyle: 'italic',
    color: '#808080',
    fontWeight: 'bold',
  },
  greetingIcon: {
    fontSize: 17,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4A4A4A',
    lineHeight: 21.09,
  },
  dashboardContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 10,
  },
  iconButton: {
    width: '45%',
    backgroundColor: '#f9f9f9',
    paddingVertical: 25,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '500',
    color: '#4a4a4a',
    textAlign: 'center',
  },
  viewAllButton: {
    backgroundColor: '#ff4500',
    paddingVertical: 12,
    borderRadius: 15,
    width: '50%',
    alignSelf: 'center',
    alignItems: 'center',
  },
  viewAllText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  statsContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 15,
    marginTop: 10,
    marginHorizontal: 20,
  },
  sortContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 10,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortText: {
    fontSize: 14,
    color: '#4a4a4a',
    marginRight: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  optionsContainer: {
    backgroundColor: '#fff',
    padding: 20,
    marginHorizontal: 30,
    borderRadius: 10,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  radioText: {
    fontSize: 16,
    color: '#4a4a4a',
    marginLeft: 10,
  },
  calendarContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginHorizontal: 20,
    padding: 16,
  },
  statItem: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#212121',
    textAlign: 'center',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
    textAlign: 'center',
  },
});

export default DashboardScreen;

import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import Entypo from 'react-native-vector-icons/Entypo';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import SwipeButton from 'rn-swipe-button';
import {useRoute, useNavigation} from '@react-navigation/native';
import axios from 'axios';

const CashbackScreen1 = () => {
  const [showServiceChargeHistory, setShowServiceChargeHistory] =
    useState(false);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [showCashbackHistory, setShowCashbackHistory] = useState(false);
  const [showServiceChargeHistoryArray, setShowServiceChargeHistoryArray] =
    useState([
      {
        method: 'Paid by Cash',
        user: 'Yaswanth',
        amount: '- 20',
        date: '30 Oct 2024',
      },
      {
        method: 'Paid to Click Solver',
        user: 'Yaswanth',
        amount: '+ 20',
        date: '30 Oct 2024',
      },
    ]);
  const [showPaymentHistoryArray, setShowPaymentHistoryArray] = useState([
    {type: 'Paid to', amount: '20', date: '30 Oct 2024', debited: true},
    {type: 'Received from', amount: '100', date: '30 Oct 2024', debited: false},
  ]);
  const [showCashbackHistoryArray, setShowCashbackHistoryArray] = useState([
    {type: 'Paid to', amount: '20', date: '30 Oct 2024'},
  ]);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [titleColor, setTitleColor] = useState('#FFFFFF');
  const [swiped, setSwiped] = useState(false);
  const navigation = useNavigation();
  const {worker_id} = useRoute().params;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.post(
          `https://backend.clicksolver.com/api/worker/pending/cashback`,
          {
            worker_id: worker_id,
          },
        );

        let totalBalance = 0;
        const serviceBalanceHistory = response.data.map(
          (transaction, index) => {
            let amount;
            const paymentType = transaction.payment_type.toLowerCase();
            const paymentValue = Number(transaction.payment);
            const deduction =
              paymentType === 'cash'
                ? paymentValue * 0.12
                : paymentValue * 0.88;
            amount = `${
              paymentType === 'cash' ? '-' : '+'
            } ₹${deduction.toFixed(2)}`;
            totalBalance += paymentType === 'cash' ? -deduction : deduction;

            const date = new Date(transaction.end_time);
            const formattedTime = `${date.toLocaleDateString([], {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}`;

            return {
              id: index.toString(),
              amount,
              time: formattedTime,
              payment:
                paymentType === 'cash'
                  ? 'Paid by Cash'
                  : `Paid to Click Solver`,
              name: transaction.name,
            };
          },
        );
        const data = response.data[0];
        const {cashback_history} = data;
        setShowCashbackHistoryArray(cashback_history);
        setShowServiceChargeHistoryArray(serviceBalanceHistory);
        const {cashback_approved_times, cashback_gain} = response.data[0];

        setPendingAmount((cashback_approved_times - cashback_gain) * 100);
      } catch (error) {
        console.error('Error fetching bookings data:', error);
        Alert.alert(
          'Error',
          'Failed to fetch cashback data. Please try again later.',
        );
      }
    };
    fetchData();
  }, [worker_id]);

  const handlesubmit = async () => {
    const cashbackCount = pendingAmount / 100;
    try {
      await axios.post(
        `https://backend.clicksolver.com/api/worker/cashback/payed`,
        {
          worker_id,
          cashbackPayed: pendingAmount,
          cashbackCount,
        },
      );
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const ThumbIcon = () => (
    <View style={styles.thumbContainer}>
      {swiped ? (
        <Entypo
          name="check"
          size={20}
          color="#ff4500"
          style={styles.checkIcon}
        />
      ) : (
        <FontAwesome6 name="arrow-right-long" size={18} color="#ff4500" />
      )}
    </View>
  );

  const renderServiceChargeHistoryItem = ({item}) => (
    <View style={styles.historyItem}>
      <View style={styles.iconContainer}>
        {item.payment.toLowerCase() === 'paid by cash' ? (
          <Entypo name="wallet" size={20} color="white" />
        ) : (
          <MaterialCommunityIcons name="bank" size={20} color="white" />
        )}
      </View>
      <View style={styles.historyDetails}>
        <Text style={styles.historyTitle}>{item.payment}</Text>
        <Text style={styles.historyUser}>{item.name}</Text>
      </View>
      <View>
        <Text style={styles.amount}>{item.amount}</Text>
        <Text style={styles.date}>{item.time}</Text>
      </View>
    </View>
  );

  const renderPaymentHistoryItem = ({item}) => (
    <View style={styles.historyItem}>
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons
          name={item.debited ? 'arrow-top-right' : 'arrow-bottom-left'}
          size={20}
          color="#ffffff"
        />
      </View>
      <View style={styles.historyDetails}>
        <Text style={styles.historyTitle}>{item.type}</Text>
        <Text style={styles.historyTitle}>Click Solver</Text>
      </View>
      <View>
        <Text style={styles.amount}>{item.amount}</Text>
        <Text style={styles.date}>{item.date}</Text>
      </View>
    </View>
  );

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

  const renderCashbackHistoryItem = ({item}) => (
    <View style={styles.historyItem}>
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons
          name="arrow-top-right"
          size={20}
          color="#ffffff"
        />
      </View>
      <View style={styles.historyDetails}>
        <Text style={styles.historyTitle}>Paid by</Text>
        <Text style={styles.historyTitle}>Click Solver</Text>
      </View>
      <View>
        <Text style={styles.amount}>{item.amount}</Text>
        <Text style={styles.date}>{formatDate(item.time)}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <FontAwesome6 name="arrow-left-long" size={20} color="#4a4a4a" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerText}>Pending Cash back</Text>
          <Text style={styles.amountText}>₹{pendingAmount}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{paddingBottom: 20}}>
        {/* Service Charge History Section */}
        <View style={styles.sectionContainer}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() =>
              setShowServiceChargeHistory(!showServiceChargeHistory)
            }>
            <Text style={styles.sectionHeaderText}>Service charge history</Text>
            <FontAwesome5
              name={showServiceChargeHistory ? 'chevron-up' : 'chevron-down'}
              size={16}
              color="#4a4a4a"
            />
          </TouchableOpacity>

          {showServiceChargeHistory && (
            <View style={styles.FlatListContainer}>
              <FlatList
                data={showServiceChargeHistoryArray}
                renderItem={renderServiceChargeHistoryItem}
                keyExtractor={item => item.id}
                scrollEnabled={false} // Disable FlatList scrolling
              />
            </View>
          )}
        </View>

        {/* Payment History Section */}
        <View style={styles.sectionContainer}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setShowPaymentHistory(!showPaymentHistory)}>
            <Text style={styles.sectionHeaderText}>Payment History</Text>
            <FontAwesome5
              name={showPaymentHistory ? 'chevron-up' : 'chevron-down'}
              size={16}
              color="#4a4a4a"
            />
          </TouchableOpacity>

          {showPaymentHistory && (
            <View style={styles.FlatListContainer}>
              <FlatList
                data={showPaymentHistoryArray}
                renderItem={renderPaymentHistoryItem}
                keyExtractor={(item, index) => index.toString()}
                scrollEnabled={false} // Disable FlatList scrolling
              />
            </View>
          )}
        </View>

        {/* Cashback History Section */}
        <View style={styles.sectionContainer}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setShowCashbackHistory(!showCashbackHistory)}>
            <Text style={styles.sectionHeaderText}>Cashback History</Text>
            <FontAwesome5
              name={showCashbackHistory ? 'chevron-up' : 'chevron-down'}
              size={16}
              color="#4a4a4a"
            />
          </TouchableOpacity>

          {showCashbackHistory && (
            <View style={styles.FlatListContainer}>
              <FlatList
                data={showCashbackHistoryArray}
                renderItem={renderCashbackHistoryItem}
                keyExtractor={(item, index) => index.toString()}
                scrollEnabled={false} // Disable FlatList scrolling
              />
            </View>
          )}
        </View>

        {/* Swipe Button Section */}
        <View style={styles.swipeButtonContainer}>
          <SwipeButton
            title="Payed"
            titleStyles={{color: titleColor, fontSize: 16, fontWeight: '500'}}
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
            thumbIconStyles={{height: 30, width: 30, borderRadius: 20}}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 10,
  },
  header: {
    flexDirection: 'column',
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
  },
  amountText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff4500',
    textAlign: 'center',
    paddingBottom: 10,
  },
  scrollView: {
    flex: 1,
  },
  sectionContainer: {
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerContent: {
    alignSelf: 'center',
  },
  FlatListContainer: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  historyDetails: {
    flex: 1,
    marginLeft: 10,
  },
  historyTitle: {
    fontSize: 16,
    color: '#4a4a4a',
  },
  historyUser: {
    fontSize: 15,
    color: '#212121',
    fontWeight: 'bold',
  },
  amount: {
    fontSize: 16,
    color: '#ff4500',
    textAlign: 'right',
  },
  iconContainer: {
    width: 45,
    height: 45,
    backgroundColor: '#ff5722',
    borderRadius: 22.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  date: {
    fontSize: 14,
    color: '#a9a9a9',
    marginLeft: 10,
    textAlign: 'right',
  },
  button: {
    backgroundColor: '#ff4500',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: 'bold',
  },
});

export default CashbackScreen1;

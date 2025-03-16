import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';

const transactionData = [
  {
    id: '1',
    service: 'SERVICE',
    details: 'Sc386cfd476c93b334 Jan 11 13:46 PM',
    amount: '-19',
    type: 'DEBT',
    status: 'SUCCESS',
    statusColor: 'green',
  },
  {
    id: '2',
    service: 'SERVICE',
    details: 'Sc386cfd476c93b334 Jan 11 13:46 PM',
    amount: '-19',
    type: 'DEBT',
    status: 'SUCCESS',
    statusColor: 'green',
  },
  {
    id: '3',
    service: 'SERVICE',
    details: 'Sc386cfd476c93b334 Jan 11 13:46 PM',
    amount: '-19',
    type: 'DEBT',
    status: 'FAILURE',
    statusColor: 'red',
  },
  {
    id: '4',
    service: 'SERVICE',
    details: 'Sc386cfd476c93b334 Jan 11 13:46 PM',
    amount: '14.58',
    type: 'CREDITS',
    status: 'SUCCESS',
    statusColor: 'green',
  },
];

const WalletScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.balanceContainer}>
        <FontAwesome6
          name="arrow-left-long"
          size={20}
          color="#9e9e9e"
          style={styles.leftIcon}
        />
        <Text style={styles.balanceTitle}>Your balance</Text>
        <Text style={styles.balanceAmount}>₹126</Text>
      </View>

      <View style={styles.historyContainer}>
        <Text style={styles.historyTitle}>HISTORY</Text>
        <View style={styles.transactionContainer}>
          <FlatList
            data={transactionData}
            keyExtractor={item => item.id}
            renderItem={({item}) => (
              <View style={styles.transactionItem}>
                <View style={styles.transactionDetails}>
                  <View>
                    <Text style={styles.service}>{item.service}</Text>
                  </View>
                  <View>
                    <Text style={styles.transactionText}>{item.details}</Text>
                  </View>
                </View>
                <View style={styles.transactionAmountContainer}>
                  <Text style={styles.amount}>{item.amount}</Text>
                  <View style={styles.statusContainer}>
                    <View>
                      <Text style={[styles.transactionType]}>{item.type}</Text>
                    </View>
                    <View>
                      <Text style={[styles.status, {color: item.statusColor}]}>
                        {item.status}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            )}
          />
        </View>
        <View style={styles.footer}>
          <View>
            <Text style={styles.serviceText}>Services</Text>
          </View>
          <View>
            <Text style={styles.totalAmount}>₹283</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.payNowButton}>
          <Text style={styles.payNowText}>PAY NOW</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center', // Center vertically
    justifyContent: 'center', // Center all content horizontally
    paddingVertical: 5,
    position: 'relative',
    backgroundColor: 'f6f6f6',
  },
  leftIcon: {
    position: 'absolute', // Ensure the icon stays on the left
    left: 10, // Adjust the position to your needs
    top: 10,
  },
  statusContainer: {
    display: 'flex',
    flexDirection: 'row',
    gap: 10,
  },
  screenName: {
    color: '#747476',
    fontSize: 17,
    fontWeight: 'bold',
  },
  transactionContainer: {
    padding: 10,
  },
  balanceContainer: {
    backgroundColor: '#F6F6F6',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  balanceTitle: {
    fontSize: 16,
    color: '#747676',
    paddingTop: 10,
  },
  balanceAmount: {
    fontSize: 54,
    fontWeight: 'bold',
    color: '#212121',
  },
  historyContainer: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    marginBottom: 20,
    flex: 1,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#747676',
    marginBottom: 10,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingVertical: 10,
  },
  transactionDetails: {
    flex: 2,
  },
  service: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
    color: '#212121',
    paddingBottom: 6,
    paddingTop: 2,
  },
  transactionText: {
    color: '#777',
    fontSize: 12,
  },
  transactionAmountContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    flex: 2,
  },
  amount: {
    fontSize: 21,
    fontWeight: 'bold',
    marginBottom: 2,
    color: '#212121',
    paddingBottom: 10,
  },
  transactionType: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#9E9E9E',
  },
  status: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  serviceText: {
    fontSize: 19,
    color: '#797979',
    fontWeight: 'bold',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
  },
  payNowButton: {
    backgroundColor: '#FF5722',
    padding: 10,
    borderRadius: 22,
    alignItems: 'center',
    marginTop: 35,
    marginHorizontal: 60,
  },
  payNowText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});

export default WalletScreen;

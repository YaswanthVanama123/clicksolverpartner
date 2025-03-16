// NotificationComponent.js

import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import EncryptedStorage from 'react-native-encrypted-storage';
import axios from 'axios';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {Buffer} from 'buffer';
import Entypo from 'react-native-vector-icons/Entypo';
import haversine from 'haversine';

const NotificationComponent = ({workerLocation}) => {
  const [notificationsArray, setNotificationsArray] = useState([]);
  const navigation = useNavigation();

  const fetchNotifications = useCallback(async () => {
    const existingNotifications = await EncryptedStorage.getItem(
      'Requestnotifications',
    );

    let notifications = existingNotifications
      ? JSON.parse(existingNotifications)
      : [];

    const currentDate = new Date();

    // Filter notifications received within the past 10 minutes
    const filteredNotifications = notifications.filter(noti => {
      const [notiDatePart, notiTimePart] = noti.receivedAt.split(', ');
      const [notiDay, notiMonth, notiYear] = notiDatePart.split('/');
      const parsedNotiReceivedAt = `${notiYear}-${notiMonth}-${notiDay}T${notiTimePart}`;
      const notiReceivedAt = new Date(parsedNotiReceivedAt);

      const timeDifferenceInMinutes =
        (currentDate - notiReceivedAt) / (1000 * 60); // milliseconds to minutes

      return timeDifferenceInMinutes <= 10;
    });

    // Update the notifications array with the filtered notifications
    notifications = filteredNotifications;

    // Update the notifications array and store locally
    setNotificationsArray(notifications);

    // Store updated notifications in local storage
    await EncryptedStorage.setItem(
      'Requestnotifications',
      JSON.stringify(notifications),
    );
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Fetch notifications when the screen gains focus
      fetchNotifications();
    }, [fetchNotifications]),
  );

  const acceptRequest = async data => {
    const decodedId = Buffer.from(data, 'base64').toString('ascii');
    try {
      const jwtToken = await EncryptedStorage.getItem('pcs_token');
      const response = await axios.post(
        `https://backend.clicksolver.com/api/accept/request`,
        {user_notification_id: decodedId},
        {headers: {Authorization: `Bearer ${jwtToken}`}},
      );

      if (response.status === 200) {
        const {notificationId} = response.data;
        const encodedNotificationId = Buffer.from(
          notificationId.toString(),
        ).toString('base64');
        const pcs_token = await EncryptedStorage.getItem('pcs_token');

        await axios.post(
          `https://backend.clicksolver.com/api/worker/action`,
          {
            encodedId: encodedNotificationId,
            screen: 'UserNavigation',
          },
          {
            headers: {
              Authorization: `Bearer ${pcs_token}`,
            },
          },
        );

        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [
              {
                name: 'UserNavigation',
                params: {encodedId: encodedNotificationId},
              },
            ],
          }),
        );
      } else {
        const pcs_token = await EncryptedStorage.getItem('pcs_token');

        await axios.post(
          `https://backend.clicksolver.com/api/worker/action`,
          {
            encodedId: '',
            screen: '',
          },
          {
            headers: {
              Authorization: `Bearer ${pcs_token}`,
            },
          },
        );

        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{name: 'Tabs', state: {routes: [{name: 'Home'}]}}],
          }),
        );
      }
    } catch (error) {
      console.error('Error while sending acceptance:', error);
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{name: 'Tabs', state: {routes: [{name: 'Home'}]}}],
        }),
      );
    }
  };

  const rejectNotification = async userNotificationId => {
    try {
      console.log(userNotificationId);
      // Retrieve the existing notifications
      const storedNotifications = await EncryptedStorage.getItem(
        'Requestnotifications',
      );
      const notifications = storedNotifications
        ? JSON.parse(storedNotifications)
        : [];

      // Filter out the notification with the matching userNotificationId
      const updatedNotifications = notifications.filter(
        notification =>
          notification.data.user_notification_id !== userNotificationId,
      );

      console.log('upda', updatedNotifications);
      // Store the updated notifications back in EncryptedStorage
      await EncryptedStorage.setItem(
        'Requestnotifications',
        JSON.stringify(updatedNotifications),
      );
      console.log('Notification removed successfully');

      // Update state with the new notifications array
      setNotificationsArray(updatedNotifications);
    } catch (error) {
      console.error('Failed to remove notification:', error);
    }
  };

  const calculateDistanceBetweenCoordinates = async (
    startCoordinates,
    endCoordinates,
  ) => {
    try {
      console.log(startCoordinates, endCoordinates);
      const apiKey = 'iN1RT7PQ41Z0DVxin6jlf7xZbmbIZPtb9CyNwtlT'; // Replace with your API key

      // Format the coordinates as required by the Distance Matrix API
      const origins = `${startCoordinates[0]},${startCoordinates[1]}`;
      const destinations = `${endCoordinates[0]},${endCoordinates[1]}`;

      // Construct the API URL
      const url = `https://api.olamaps.io/routing/v1/distanceMatrix?origins=${origins}&destinations=${destinations}&api_key=${apiKey}`;

      // Make the API request
      const response = await axios.get(url, {
        headers: {
          'X-Request-Id': 'your-request-id', // Optional, but useful for tracking requests
        },
      });

      console.log('distanceResponse', response.data);

      // Check if the response contains valid data
      if (response && response.data && response.data.rows.length > 0) {
        const elements = response.data.rows[0].elements;

        if (elements && elements.length > 0) {
          const distanceInMeters = elements[0].distance;

          if (distanceInMeters) {
            const distanceInKilometers = (distanceInMeters / 1000).toFixed(2);
            const distanceString = `${distanceInKilometers} km`;
            console.log(`Distance: ${distanceInKilometers} km`);
            return distanceInKilometers;
          } else {
            console.log('Distance data is not available.');
            return null;
          }
        } else {
          console.log('No elements found in the distance response.');
          return null;
        }
      } else {
        console.log('No distance found between the specified locations.');
        return null;
      }
    } catch (error) {
      if (error.response) {
        // Log details of the error response
        console.error('Error calculating distance:', error.response.data);
      } else {
        console.error('Error calculating distance:', error.message);
      }
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const screenWidth = Dimensions.get('window').width;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      pagingEnabled={false}
      contentContainerStyle={styles.scrollContainer}
      style={styles.messageScrollView}>
      {notificationsArray.map((notification, index) => {
        // Parse the title string if it's valid JSON
        let parsedTitle;
        let totalCost = 0;
        const coordinates = notification.data.coordinates
          .split(',')
          .map(Number);
        const distance = calculateDistanceBetweenCoordinates(
          coordinates,
          workerLocation,
        );
        console.log(distance);
        try {
          parsedTitle = JSON.parse(notification.data.service);

          totalCost = parsedTitle.reduce((accumulator, service) => {
            return accumulator + (service.cost || 0); // Default to 0 if cost is undefined
          }, 0);
        } catch (error) {
          console.error('Error parsing title:', error);
          parsedTitle = []; // Default to an empty array if parsing fails
        }

        return (
          <View key={index} style={styles.messageBox}>
            <View style={styles.serviceCostContainer}>
              <View>
                <Text style={styles.secondaryColor}>Service</Text>
                {/* Display the original title or an error message */}

                <View style={styles.serviceNamesContainer}>
                  {/* Map over the parsed title if it's an array */}
                  {Array.isArray(parsedTitle) ? (
                    parsedTitle.map((service, serviceIndex) => (
                      <View key={serviceIndex}>
                        <Text key={serviceIndex} style={styles.primaryColor}>
                          {service.serviceName}
                          {serviceIndex < parsedTitle.length - 1
                            ? ', '
                            : ''}{' '}
                          {/* Add comma except for the last item */}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text>No services available</Text> // Fallback if parsedTitle is not an array
                  )}
                </View>
              </View>
              <View>
                <Text style={styles.secondaryColor}>Cost</Text>
                <Text style={styles.primaryColor}>₹{totalCost}</Text>
              </View>
            </View>
            <View style={styles.addressContainer}>
              <View>
                <Text style={styles.secondaryColor}>Location</Text>
                <Text style={styles.address}>{notification.data.location}</Text>
              </View>
              <View>
                <Text style={styles.secondaryColor}>Distance</Text>
                {distance > 0 && (
                  <Text style={styles.primaryColor}>{distance}</Text>
                )}
              </View>
            </View>
            <View style={styles.buttonsContainer}>
              <View>
                {/* <Text style={styles.secondaryColor}>Reject</Text> */}
                <TouchableOpacity
                  onPress={() =>
                    rejectNotification(notification.data.user_notification_id)
                  }>
                  <Entypo name="cross" size={25} color="#9e9e9e" />
                </TouchableOpacity>
              </View>
              <View>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() =>
                    acceptRequest(notification.data.user_notification_id)
                  } // Pass item.data to acceptRequest
                >
                  <Text style={styles.secondaryButtonText}>Accept</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );
      })}

      {/* Add more message boxes as needed */}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screenWidth: Dimensions.get('window').width,
  messageScrollView: {
    position: 'absolute',
    bottom: '-5%', // 30px from the bottom of the screen
    left: 0,
    right: 0,
    height: 300, // Set the height of the scroll view
  },
  scrollContainer: {
    paddingHorizontal: Dimensions.get('window').width * 0.05, // Padding to create space on both sides
  },
  messageBox: {
    width: Dimensions.get('window').width * 0.85, // 90% width of the screen
    height: 220, // Set the height
    backgroundColor: '#fff',
    marginRight: Dimensions.get('window').width * 0.05, // 5% margin to show the next box
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 10,
    elevation: 5, // For Android shadow
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 15,
  },
  messageText: {
    fontSize: 16,
    color: '#333',
  },
  serviceCostContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  serviceNamesContainer: {
    flexDirection: 'row',
  },
  secondaryColor: {
    color: '#9e9e9e',
    fontSize: 16,
  },
  primaryColor: {
    color: '#212121',
    fontSize: 15,
  },
  addressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  address: {
    color: '#212121',
    fontSize: 12,
    width: 210,
  },
  buttonsContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  secondaryButton: {
    backgroundColor: '#FF5722',
    width: 120,
    height: 36,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 16,
    fontWeight: '600',
  },
});

export default NotificationComponent;

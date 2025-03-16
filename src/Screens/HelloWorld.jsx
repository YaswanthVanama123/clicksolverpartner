import React, {useState, useEffect, useCallback} from 'react';
import {
  Dimensions,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import Mapbox from '@rnmapbox/maps';
Mapbox.setAccessToken(
  'pk.eyJ1IjoieWFzd2FudGh2YW5hbWEiLCJhIjoiY20ybTMxdGh3MGZ6YTJxc2Zyd2twaWp2ZCJ9.uG0mVTipkeGVwKR49iJTbw',
);
import BackgroundGeolocation from 'react-native-background-geolocation';
import EncryptedStorage from 'react-native-encrypted-storage';
import haversine from 'haversine';
import firestore from '@react-native-firebase/firestore';
import moment from 'moment-timezone';
import Entypo from 'react-native-vector-icons/Entypo';
import Octicons from 'react-native-vector-icons/Octicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Foundation from 'react-native-vector-icons/Foundation';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  useNavigation,
  CommonActions,
  useFocusEffect,
} from '@react-navigation/native';
import axios from 'axios';
import messaging from '@react-native-firebase/messaging';
import PushNotification from 'react-native-push-notification';
import Feather from 'react-native-vector-icons/Feather';
import {Buffer} from 'buffer';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

const HelloWorld = () => {
  const [center, setCenter] = useState([0, 0]);
  const [workerLocation, setWorkerLocation] = useState([]);
  const screenHeight = Dimensions.get('window').height;
  const screenWidth = Dimensions.get('window').width;
  const navigation = useNavigation();
  const [notificationsArray, setNotificationsArray] = useState([]);
  const [screenName, setScreenName] = useState(null);
  const [params, setParams] = useState(null);
  const [messageBoxDisplay, setMessageBoxDisplay] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [greetingIcon, setGreetingIcon] = useState(null);
  const [cumulativeDistance, setCumulativeDistance] = useState(0);

  // Function to fetch notifications and update state
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

  const fetchTrackDetails = async () => {
    try {
      const pcs_token = await EncryptedStorage.getItem('pcs_token');

      if (pcs_token) {
        const response = await axios.get(
          `https://backend.clicksolver.com/api/worker/track/details`,
          {
            headers: {Authorization: `Bearer ${pcs_token}`},
          },
        );

        const {route, parameter} = response.data;
        const params = JSON.parse(parameter);

        if (route) {
          setMessageBoxDisplay(true);
        } else {
          setMessageBoxDisplay(false);
        }

        setScreenName(route);
        setParams(params);
      } else {
        navigation.replace('Login');
      }
    } catch (error) {
      console.error('Error fetching track details:', error);
    }
  };

  const toggleSwitch = async () => {
    setIsEnabled(prevState => {
      const newEnabledState = !prevState;

      if (newEnabledState) {
        BackgroundGeolocation.start();
      } else {
        BackgroundGeolocation.stop();
        updateFirestoreLocation(0, 0); // Send (0, 0) when tracking is turned off
        setCumulativeDistance(0); // Reset cumulative distance
      }

      EncryptedStorage.setItem(
        'trackingEnabled',
        JSON.stringify(newEnabledState),
      ).catch(error => {
        console.error('Error saving enabled state:', error);
      });

      return newEnabledState;
    });
  };

  const fetchTrackingState = async () => {
    try {
      const storedState = await EncryptedStorage.getItem('trackingEnabled');
      if (storedState !== null) {
        setIsEnabled(JSON.parse(storedState));
      }
    } catch (error) {
      console.error('Error fetching tracking state:', error);
    }
  };

  const earningsScreen = () => {
    navigation.push('Earnings');
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

  const updateFirestoreLocation = async (latitude, longitude) => {
    try {
      const Item = await EncryptedStorage.getItem('unique');
      if (Item) {
        const locationsCollection = firestore().collection('locations');
        const locationData = {
          location: new firestore.GeoPoint(latitude, longitude),
          timestamp: moment().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss'),
          worker_id: parseInt(Item, 10),
        };
        const snapshot = await locationsCollection
          .where('worker_id', '==', locationData.worker_id)
          .limit(1)
          .get();
        if (!snapshot.empty) {
          const docId = snapshot.docs[0].id;
          await locationsCollection.doc(docId).update({
            location: locationData.location,
            timestamp: locationData.timestamp,
          });
        } else {
          await locationsCollection.add(locationData);
        }
      }
    } catch (error) {
      console.error('Error sending location data to Firestore:', error);
    }
  };

  const initializeGeolocation = () => {
    let onLocationSubscription;
    let onGeofenceSubscription;

    const setupGeolocation = async () => {
      const pcsToken = await EncryptedStorage.getItem('pcs_token');

      if (pcsToken) {
        const geofences = [
          {
            identifier: 'Gampalagudem',
            radius: 10000, // in meters
            latitude: 16.998121,
            longitude: 80.5230137,
            notifyOnEntry: true,
            notifyOnExit: true,
            notifyOnDwell: false,
            loiteringDelay: 30000,
          },
          // Add more geofences if needed
        ];

        onLocationSubscription = BackgroundGeolocation.onLocation(
          async location => {
            const {latitude, longitude} = location.coords;
            setCenter([longitude, latitude]);
            setWorkerLocation([latitude, longitude]);

            const previousLocation = await EncryptedStorage.getItem(
              'workerPreviousLocation',
            );

            let locationData = previousLocation
              ? JSON.parse(previousLocation)
              : null;

            if (locationData) {
              const previousCoords = {
                latitude: locationData.latitude,
                longitude: locationData.longitude,
              };
              const currentCoords = {latitude, longitude};

              // Calculate distance using Haversine formula
              const distance = haversine(previousCoords, currentCoords, {
                unit: 'km',
              });

              // Update cumulative distance
              const newCumulativeDistance = cumulativeDistance + distance;
              setCumulativeDistance(newCumulativeDistance);

              // Check if cumulative distance is equal or exceeds 1 km
              if (newCumulativeDistance >= 1) {
                await updateFirestoreLocation(latitude, longitude);
                setCumulativeDistance(0); // Reset cumulative distance
                await EncryptedStorage.setItem(
                  'workerPreviousLocation',
                  JSON.stringify({latitude, longitude}),
                );
              } else {
                // Update previous location without resetting cumulative distance
                await EncryptedStorage.setItem(
                  'workerPreviousLocation',
                  JSON.stringify({latitude, longitude}),
                );
              }
            } else {
              // First time setting previous location
              await EncryptedStorage.setItem(
                'workerPreviousLocation',
                JSON.stringify({latitude, longitude}),
              );
              setCumulativeDistance(0); // Initialize cumulative distance
            }
          },
        );

        onGeofenceSubscription = BackgroundGeolocation.onGeofence(
          async geofence => {
            if (geofence.action === 'ENTER') {
              console.log(
                `Worker has entered the geofence: ${geofence.identifier}`,
              );
              // Get current location and send to Firebase
              BackgroundGeolocation.getCurrentPosition()
                .then(async location => {
                  const {latitude, longitude} = location.coords;
                  await updateFirestoreLocation(latitude, longitude);
                  setCumulativeDistance(0); // Reset cumulative distance
                  await EncryptedStorage.setItem(
                    'workerPreviousLocation',
                    JSON.stringify({latitude, longitude}),
                  );
                })
                .catch(error => {
                  console.error('Error getting current position:', error);
                });
              BackgroundGeolocation.start();
            } else if (geofence.action === 'EXIT') {
              console.log(
                `Worker has exited the geofence: ${geofence.identifier}`,
              );
              await updateFirestoreLocation(0, 0); // Send (0, 0) coordinates
              BackgroundGeolocation.stop();
              setCumulativeDistance(0); // Reset cumulative distance
              await EncryptedStorage.setItem(
                'workerPreviousLocation',
                JSON.stringify(null),
              );
            }
          },
        );

        // Listen for location provider changes
        BackgroundGeolocation.onProviderChange(async event => {
          if (!event.enabled) {
            // Location services are disabled
            await updateFirestoreLocation(0, 0); // Send (0, 0) coordinates
            BackgroundGeolocation.stop();
          }
        });

        BackgroundGeolocation.ready({
          desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
          distanceFilter: 1,
          stopTimeout: 5,
          debug: false,
          logLevel: BackgroundGeolocation.LOG_LEVEL_OFF,
          stopOnTerminate: false,
          startOnBoot: true,
          batchSync: false,
          autoSync: true,
        }).then(() => {
          geofences.forEach(geofence => {
            BackgroundGeolocation.addGeofence(geofence).catch(error => {
              console.error(
                `Failed to add geofence for ${geofence.identifier}: `,
                error,
              );
            });
          });
        });
      } else {
        console.log('pcs_token is not available, skipping location tracking.');
      }
    };

    setupGeolocation();

    return () => {
      if (onLocationSubscription) {
        onLocationSubscription.remove();
      }
      if (onGeofenceSubscription) {
        onGeofenceSubscription.remove();
      }
    };
  };

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

  const filterNotificationsWithinTimeframe = (notifications, minutes) => {
    const currentDate = new Date();
    return notifications.filter(noti => {
      const notiReceivedAt = new Date(noti.receivedAt);
      const timeDifferenceInMinutes =
        (currentDate - notiReceivedAt) / (1000 * 60);
      return timeDifferenceInMinutes <= minutes;
    });
  };

  async function requestUserPermission() {
    const authStatus = await messaging().requestPermission();
    if (
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL
    ) {
      console.log('Authorization status:', authStatus);
    }
  }

  const getTokens = async () => {
    try {
      const token = await messaging().getToken();

      console.log("tok",token)

      await EncryptedStorage.setItem('fcm_token', token);

      const pcs_token = await EncryptedStorage.getItem('pcs_token');

      await axios.post(
        `https://backend.clicksolver.com/api/worker/store-fcm-token`,
        {fcmToken: token},
        {headers: {Authorization: `Bearer ${pcs_token}`}},
      );
    } catch (error) {
      console.error('Error storing FCM token in the backend:', error);
    }
  };

  useEffect(() => {
    fetchTrackDetails();
    fetchTrackingState();
    const geolocationCleanup = initializeGeolocation();
    fetchNotifications();
    requestUserPermission();
    getTokens();

    return () => {
      geolocationCleanup();
    };
  }, []);

  useEffect(() => {
    if (isEnabled) {
      BackgroundGeolocation.start();
    } else {
      BackgroundGeolocation.stop();
    }
  }, [isEnabled]);

  useEffect(() => {
    PushNotification.createChannel(
      {
        channelId: 'default-channel-id',
        channelName: 'Default Channel',
        channelDescription: 'A default channel',
        soundName: 'default',
        importance: 4,
        vibrate: true,
      },
      created => console.log(`createChannel returned ''`),
    );

    const storeNotificationInBackend = async notification => {
      try {
        const pcs_token = await EncryptedStorage.getItem('pcs_token');
        const fcmToken = await EncryptedStorage.getItem('fcm_token');
        await axios.post(
          `https://backend.clicksolver.com/api/worker/store-notification`,
          {notification, fcmToken},
          {headers: {Authorization: `Bearer ${pcs_token}`}},
        );
      } catch (error) {
        console.error('Failed to store notification in backend:', error);
      }
    };

    const storeNotificationLocally = async notification => {
      console.log('called atleast');
      // Check if notification has notification.data.notification_id
      if (notification.data.screen === 'Acceptance') {
        try {
          const existingNotifications = await EncryptedStorage.getItem(
            'Requestnotifications',
          );
          let notifications = existingNotifications
            ? JSON.parse(existingNotifications)
            : [];

          // Add the new notification to the array
          notifications.push(notification);

          // Get the receivedAt time from the notification
          const receivedAt = notification.receivedAt; // e.g., "06/10/2024, 11:26:16"

          // Manually parse receivedAt (from DD/MM/YYYY, HH:mm:ss to MM/DD/YYYY HH:mm:ss)
          const [datePart, timePart] = receivedAt.split(', ');
          const [day, month, year] = datePart.split('/');
          const parsedReceivedAt = `${year}-${month}-${day}T${timePart}`;
          const notificationDate = new Date(parsedReceivedAt);

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
          console.log('setNotificationsArray');
          // Store updated notifications in local storage
          await EncryptedStorage.setItem(
            'Requestnotifications',
            JSON.stringify(notifications),
          );

          // Also store in backend
          storeNotificationInBackend(notification);
        } catch (error) {
          console.error('Failed to store notification locally:', error);
        }
      } else {
        console.log('Notification does not match criteria. Not storing.');
      }
    };

    const unsubscribeOnMessage = messaging().onMessage(async remoteMessage => {
      console.log('Foreground Fcm', remoteMessage);
      const notificationId = remoteMessage.data.notification_id;
      const pcs_token = await EncryptedStorage.getItem('pcs_token');

      if (remoteMessage.data && remoteMessage.data.screen === 'Home') {
        await axios.post(
          `${process.env.BackendAPI}/api/worker/action`,
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
      } else if (
        remoteMessage.data &&
        remoteMessage.data.screen === 'TaskConfirmation'
      ) {
        navigation.push('TaskConfirmation', {encodedId: notificationId});
      }

      const notification = {
        title: remoteMessage.notification.title,
        body: remoteMessage.notification.body,
        data: remoteMessage.data,
        service: remoteMessage.data.service,
        location: remoteMessage.data.location,
        userNotificationId: remoteMessage.data.user_notification_id, // Include the user_notification_id
        receivedAt: new Intl.DateTimeFormat('en-IN', {
          timeZone: 'Asia/Kolkata',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }).format(new Date()),
      };
      storeNotificationLocally(notification);

      PushNotification.localNotification({
        autoCancel: false,
        ongoing: true,
        channelId: 'default-channel-id',
        title: remoteMessage.notification.title,
        message: remoteMessage.notification.body,
        playSound: true,
        soundName: 'default',
        data: remoteMessage.data,
        userInfo: remoteMessage.data,
        actions: ['Dismiss'],
      });
    });

    PushNotification.configure({
      onNotification: function (Dismissnotification) {
        const userNotificationId = notification.data.user_notification_id;
        const route = notification.data.route;
        if (notification.action === 'Dismiss') {
          PushNotification.cancelLocalNotifications({id: notification.id});
        } else if (notification.userInteraction) {
          if (userNotificationId && route) {
            navigation.push(route, {encodedId: userNotificationId});
          }
        }
      },
      actions: ['Dismiss'],
    });

    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('setBackgroundMessageHandler Fcm', remoteMessage);
      const notificationId = remoteMessage.data.notification_id;

      if (remoteMessage.data && remoteMessage.data.screen === 'Home') {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{name: 'Tabs', state: {routes: [{name: 'Home'}]}}],
          }),
        );
      } else if (
        remoteMessage.data &&
        remoteMessage.data.screen === 'TaskConfirmation'
      ) {
        navigation.push('TaskConfirmation', {encodedId: notificationId});
      }
      const notification = {
        title: remoteMessage.notification.title,
        body: remoteMessage.notification.body,
        data: remoteMessage.data,
        service: remoteMessage.data.service,
        location: remoteMessage.data.location,
        userNotificationId: remoteMessage.data.user_notification_id, // Include the user_notification_id
        receivedAt: new Intl.DateTimeFormat('en-IN', {
          timeZone: 'Asia/Kolkata',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }).format(new Date()),
      };
      storeNotificationLocally(notification);
    });

    const unsubscribeOnNotificationOpenedApp =
      messaging().onNotificationOpenedApp(async remoteMessage => {
        const notificationId = remoteMessage.data.notification_id;
        const pcs_token = await EncryptedStorage.getItem('pcs_token');

        if (remoteMessage.data && remoteMessage.data.screen === 'Home') {
          await axios.post(
            `${process.env.BackendAPI}/api/worker/action`,
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
        } else if (
          remoteMessage.data &&
          remoteMessage.data.screen === 'TaskConfirmation'
        ) {
          navigation.push('TaskConfirmation', {encodedId: notificationId});
        }
      });

    messaging()
      .getInitialNotification()
      .then(async remoteMessage => {
        if (remoteMessage) {
          const notificationId = remoteMessage.data.notification_id;
          const pcs_token = await EncryptedStorage.getItem('pcs_token');

          if (remoteMessage.data && remoteMessage.data.screen === 'Home') {
            await axios.post(
              `${process.env.BackendAPI}/api/worker/action`,
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
          } else if (
            remoteMessage.data &&
            remoteMessage.data.screen === 'TaskConfirmation'
          ) {
            navigation.push('TaskConfirmation', {encodedId: notificationId});
          }

          const notification = {
            title: remoteMessage.notification.title,
            body: remoteMessage.notification.body,
            data: remoteMessage.data,
            service: remoteMessage.data.service,
            location: remoteMessage.data.location,
            userNotificationId: remoteMessage.data.user_notification_id, // Include the user_notification_id
            receivedAt: new Intl.DateTimeFormat('en-IN', {
              timeZone: 'Asia/Kolkata',
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false,
            }).format(new Date()),
          };
          storeNotificationLocally(notification);
        }
      });

    return () => {
      unsubscribeOnMessage();
      unsubscribeOnNotificationOpenedApp();
    };
  }, []);

  const setGreetingBasedOnTime = () => {
    const currentHour = new Date().getHours();
    let greetingMessage = 'Good Day';
    let icon = <Icon name="sunny-sharp" size={14} color="#ff5722" />;

    if (currentHour < 12) {
      greetingMessage = 'Good Morning';
      icon = <Icon name="sunny-sharp" size={16} color="#ff5722" />;
    } else if (currentHour < 17) {
      greetingMessage = 'Good Afternoon';
      icon = <Feather name="sunset" size={16} color="#ff5722" />;
    } else {
      greetingMessage = 'Good Evening';
      icon = <MaterialIcons name="nights-stay" size={16} color="#F24E1E" />;
    }

    setGreeting(greetingMessage);
    setGreetingIcon(icon);
  };

  useEffect(() => {
    setGreetingBasedOnTime();
  }, []);

  const balanceScreen = () => {
    navigation.push('BalanceScreen');
  };

  return (
    <SafeAreaView style={styles.screenContainer}>
      <View style={styles.header}>
        <View style={styles.switchContainer}>
          <View>
            <MaterialCommunityIcons
              name="sort-variant"
              size={22}
              color="#656565"
            />
          </View>
          <View style={styles.innerSwitch}>
            <View style={styles.workStatusContainer}>
              <Text style={styles.workStatus}>Active</Text>
            </View>
            <View style={styles.container}>
              <TouchableOpacity
                onPress={toggleSwitch}
                style={[
                  styles.track,
                  isEnabled ? styles.trackEnabled : styles.trackDisabled,
                ]}>
                <View
                  style={[
                    styles.thumb,
                    isEnabled ? styles.thumbEnabled : styles.thumbDisabled,
                  ]}
                />
              </TouchableOpacity>
              <Text>{isEnabled ? 'On' : 'Off'}</Text>
            </View>
          </View>
          <View>
            <TouchableOpacity
              style={styles.notificationContainer}
              onPress={() => navigation.push('RatingsScreen')}>
              <AntDesign name="staro" size={22} color="#656565" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.greeting}>
          <Text style={styles.greetingText}>
            {greeting} <Text style={styles.greetingIcon}>{greetingIcon}</Text>
          </Text>
          <Text style={styles.userName}>Yaswanth</Text>
        </View>
        <View style={styles.moneyContainer}>
          <TouchableOpacity onPress={balanceScreen}>
            <View style={styles.balanceContainer}>
              <MaterialCommunityIcons
                name="bank-outline"
                size={20}
                color="#4a4a4a"
              />
              <Text style={styles.balanceText}>Balance</Text>
              <Entypo
                name="chevron-small-down"
                size={20}
                color="#2E8B57"
                style={styles.downArrow}
              />
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={earningsScreen}>
            <View style={styles.balanceContainer}>
              <FontAwesome name="money" size={20} color="#4a4a4a" />
              <Text style={styles.balanceText}>Earnings</Text>
              <Entypo
                name="chevron-small-down"
                size={20}
                color="#2E8B57"
                style={styles.downArrow}
              />
            </View>
          </TouchableOpacity>
        </View>
      </View>
      {isEnabled ? (
        <>
          <Mapbox.MapView
            style={{minHeight: screenHeight, minWidth: screenWidth}}>
            <Mapbox.Camera zoomLevel={17} centerCoordinate={center} />
            <Mapbox.PointAnnotation id="current-location" coordinate={center}>
              <View style={styles.markerContainer}>
                <Octicons name="dot-fill" size={25} color="#0E52FB" />
              </View>
            </Mapbox.PointAnnotation>
          </Mapbox.MapView>
        </>
      ) : (
        <Text style={styles.message}>Please click the switch on</Text>
      )}
      {isEnabled && (
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
                            <Text
                              key={serviceIndex}
                              style={styles.primaryColor}>
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
                    <Text style={styles.address}>
                      {notification.data.location}
                    </Text>
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
                        rejectNotification(
                          notification.data.user_notification_id,
                        )
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
      )}
      {messageBoxDisplay && (
        <TouchableOpacity
          style={styles.messageBoxContainer}
          onPress={() => navigation.replace(screenName, params)}>
          {console.log('screen params', params)}
          <View style={styles.messageBox1}>
            <View style={styles.timeContainer}>
              {screenName === 'Paymentscreen' ? (
                <Foundation name="paypal" size={24} color="#ffffff" />
              ) : screenName === 'UserNavigation' ? (
                <MaterialCommunityIcons
                  name="truck"
                  size={24}
                  color="#ffffff"
                />
              ) : screenName === 'OtpVerification' ? (
                <Feather name="shield" size={24} color="#ffffff" />
              ) : screenName === 'worktimescreen' ? (
                <MaterialCommunityIcons
                  name="hammer"
                  size={24}
                  color="#ffffff"
                />
              ) : (
                <Feather name="alert-circle" size={24} color="#000" />
              )}
            </View>
            <View>
              <Text style={styles.textContainerText}>
                Switch board & Socket repairing
              </Text>
              {screenName === 'Paymentscreen' ? (
                <Text style={styles.textContainerTextCommander}>
                  Payment in progress
                </Text>
              ) : screenName === 'UserNavigation' ? (
                <Text style={styles.textContainerTextCommander}>
                  User is waiting for your help
                </Text>
              ) : screenName === 'OtpVerification' ? (
                <Text style={styles.textContainerTextCommander}>
                  User is waiting for your help
                </Text>
              ) : screenName === 'worktimescreen' ? (
                <Text style={styles.textContainerTextCommander}>
                  Work in progress
                </Text>
              ) : (
                <Text style={styles.textContainerText}>Nothing</Text>
              )}
            </View>
            <View style={styles.rightIcon}>
              <Feather name="chevrons-right" size={18} color="#9e9e9e" />
            </View>
          </View>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const screenWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
  messageBoxContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    flexDirection: 'row',
    padding: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 3, // For shadow
    position: 'absolute', // Positioning at the bottom
    bottom: 8, // Distance from the bottom of the screen
    left: 10, // Margin from the left side of the screen
    right: 10, // Margin from the right side of the screen,
    marginHorizontal: '2%',
  },
  workerImage: {
    height: 40,
    width: 30,
  },
  messageBox1: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  timeContainer: {
    width: 50,
    height: 50,
    backgroundColor: '#ff5722',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  timeContainerText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  textContainerText: {
    fontSize: 13,

    paddingBottom: 5,
    fontWeight: 'bold',
    color: '#212121',
    marginLeft: 10,
  },
  serviceNamesContainer: {
    flexDirection: 'row',
  },
  textContainerTextCommander: {
    fontSize: 12,
    color: '#9e9e9e',
    marginLeft: 10,
  },
  iconContainer: {
    width: 40,
    height: 40,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightIcon: {
    marginLeft: 8,
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
  screenContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingBottom: 70,
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 16,
    fontWeight: '600',
  },
  secondaryColor: {
    color: '#9e9e9e',
    fontSize: 16,
  },
  buttonsContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  serviceCostContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  addressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  markerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageScrollView: {
    position: 'absolute',
    bottom: '-5%', // 30px from the bottom of the screen
    left: 0,
    right: 0,
    height: 300, // Set the height of the scroll view
  },
  scrollContainer: {
    paddingHorizontal: screenWidth * 0.05, // Padding to create space on both sides
  },
  messageBox: {
    width: screenWidth * 0.85, // 90% width of the screen
    height: 220, // Set the height
    backgroundColor: '#fff',
    marginRight: screenWidth * 0.05, // 5% margin to show the next box
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
  greeting: {
    flexDirection: 'column',
    alignItems: 'center',
    color: '#333',
    marginVertical: 10,
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
  moneyContainer: {
    padding: 10,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  balanceContainer: {
    padding: 10,
    width: 162,
    height: 45,
    borderRadius: 25,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: {width: 0, height: 1},
    shadowRadius: 2,
    elevation: 1,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between', // Space between text and icon
    alignItems: 'center',
  },
  balanceText: {
    flex: 1, // Make the text take the available space
    textAlign: 'center', // Center the text
    color: '#212121', // Assuming primary color
    fontFamily: 'Poppins-Bold',
  },
  downArrow: {
    marginLeft: 10, // Add space between text and icon if needed
  },

  primaryColor: {
    color: '#212121',
    fontSize: 15,
  },
  address: {
    color: '#212121',
    fontSize: 12,
    width: 210,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  track: {
    width: 47, // Track width
    height: 27, // Track height
    borderRadius: 15,
    justifyContent: 'center',
    padding: 2,
  },
  trackEnabled: {
    backgroundColor: '#4CAF50',
  },
  trackDisabled: {
    backgroundColor: '#E1DAD2',
  },
  thumb: {
    width: 24, // Thumb width
    height: 24, // Thumb height
    borderRadius: 13, // Half of the width and height for a circular thumb
  },
  thumbEnabled: {
    backgroundColor: '#ffffff',
    alignSelf: 'flex-end', // Moves the thumb to the right when enabled
  },
  thumbDisabled: {
    backgroundColor: '#f4f3f4',
    alignSelf: 'flex-start', // Moves the thumb to the left when disabled
  },
  text: {
    color: '#000',
  },
  workStatus: {
    color: '#4CAF50',
    fontSize: 15,
  },
  workStatusCOntainer: {
    display: 'flex',
    alignSelf: 'center',
  },
  innerSwitch: {
    display: 'flex',
    flexDirection: 'row',
    gap: 10,
  },
  textCS: {
    paddingTop: 3,
    paddingRight: 5,
    fontSize: 13,
    color: '#7B6B6E',
  },
  notificationContainer: {
    display: 'flex',
    alignSelf: 'center',
  },
  earningsText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 15,
  },
  earnings: {
    padding: 10,
    backgroundColor: '#7B6B6E',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  markerContainer: {
    backgroundColor: '#ffffff', // Circle background color
    borderRadius: 12.5, // Half of width/height for a perfect circle (35 / 2)
    justifyContent: 'center', // Center the icon vertically
    alignItems: 'center', // Center the icon horizontally
    width: 25, // Increased width to fit the icon with padding
    height: 25,
    paddingBottom: 2,
  },

  switchContainer: {
    padding: 10,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  header: {
    backgroundColor: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
  },
  switch: {
    width: 47,
    height: 27,
  },
  userInitialCircle: {
    width: 40,
    height: 40,
    borderRadius: 20, // To make it a circle
    backgroundColor: '#f0f0f0', // Background color of the circle
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10, // Adjust the space between the circle and the greeting
  },
  map: {
    flex: 1,
  },

  userInitialText: {
    fontSize: 18,
    color: '#333', // Text color
    fontWeight: 'bold',
  },
});

export default HelloWorld;

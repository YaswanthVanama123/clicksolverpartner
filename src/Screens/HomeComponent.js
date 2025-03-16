// HelloWorld.js

import React, {useState, useEffect, useCallback} from 'react';
import {
  Dimensions,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import LocationComponent from './LocationTracker';
import NotificationComponent from './NotificationComponent';
import {useNavigation, CommonActions} from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import EncryptedStorage from 'react-native-encrypted-storage';
import Feather from 'react-native-vector-icons/Feather';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import messaging from '@react-native-firebase/messaging';
import PushNotification from 'react-native-push-notification';
import Foundation from 'react-native-vector-icons/Foundation';
import {Buffer} from 'buffer';

const HelloWorld = () => {
  const [workerLocation, setWorkerLocation] = useState([]);
  const [isEnabled, setIsEnabled] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [greetingIcon, setGreetingIcon] = useState(null);
  const navigation = useNavigation();

  const [messageBoxDisplay, setMessageBoxDisplay] = useState(false);
  const [screenName, setScreenName] = useState(null);
  const [params, setParams] = useState(null);

  const toggleSwitch = async () => {
    setIsEnabled(prevState => {
      const newEnabledState = !prevState;

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

  const handleWorkerLocationChange = newLocation => {
    setWorkerLocation(newLocation);
  };

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

  // Function to store notification locally
  // const storeNotificationLocally = async notification => {
  //   console.log('Storing notification locally');
  //   // Check if notification has notification.data.notification_id
  //   if (notification.data.screen === 'Acceptance') {
  //     try {
  //       const existingNotifications = await EncryptedStorage.getItem(
  //         'Requestnotifications',
  //       );
  //       let notifications = existingNotifications
  //         ? JSON.parse(existingNotifications)
  //         : [];

  //       // Add the new notification to the array
  //       notifications.push(notification);

  //       const currentDate = new Date();

  //       // Filter notifications received within the past 10 minutes
  //       const filteredNotifications = notifications.filter(noti => {
  //         const [notiDatePart, notiTimePart] = noti.receivedAt.split(', ');
  //         const [notiDay, notiMonth, notiYear] = notiDatePart.split('/');
  //         const parsedNotiReceivedAt = `${notiYear}-${notiMonth}-${notiDay}T${notiTimePart}`;
  //         const notiReceivedAt = new Date(parsedNotiReceivedAt);

  //         const timeDifferenceInMinutes =
  //           (currentDate - notiReceivedAt) / (1000 * 60); // milliseconds to minutes

  //         return timeDifferenceInMinutes <= 10;
  //       });

  //       // Update the notifications array with the filtered notifications
  //       notifications = filteredNotifications;

  //       // Store updated notifications in local storage
  //       await EncryptedStorage.setItem(
  //         'Requestnotifications',
  //         JSON.stringify(notifications),
  //       );

  //       console.log('Notification stored locally');
  //     } catch (error) {
  //       console.error('Failed to store notification locally:', error);
  //     }
  //   } else {
  //     console.log('Notification does not match criteria. Not storing.');
  //   }
  // };

  useEffect(() => {
    setGreetingBasedOnTime();
    fetchTrackingState();
    fetchTrackDetails();
    requestUserPermission();
    getTokens();
  }, []);

  // useEffect(() => {
  //   PushNotification.createChannel(
  //     {
  //       channelId: 'default-channel-id',
  //       channelName: 'Default Channel',
  //       channelDescription: 'A default channel',
  //       soundName: 'default',
  //       importance: 4,
  //       vibrate: true,
  //     },
  //     created => console.log(`createChannel returned '${created}'`),
  //   );

  //   const unsubscribeOnMessage = messaging().onMessage(async remoteMessage => {
  //     console.log('Foreground Fcm', remoteMessage);
  //     const notificationId = remoteMessage.data.notification_id;
  //     const pcs_token = await EncryptedStorage.getItem('pcs_token');

  //     if (remoteMessage.data && remoteMessage.data.screen === 'Home') {
  //       await axios.post(
  //         `${process.env.BackendAPI}/api/worker/action`,
  //         {
  //           encodedId: '',
  //           screen: '',
  //         },
  //         {
  //           headers: {
  //             Authorization: `Bearer ${pcs_token}`,
  //           },
  //         },
  //       );

  //       navigation.dispatch(
  //         CommonActions.reset({
  //           index: 0,
  //           routes: [{name: 'Tabs', state: {routes: [{name: 'Home'}]}}],
  //         }),
  //       );
  //     } else if (
  //       remoteMessage.data &&
  //       remoteMessage.data.screen === 'TaskConfirmation'
  //     ) {
  //       navigation.push('TaskConfirmation', {encodedId: notificationId});
  //     }

  //     const notification = {
  //       title: remoteMessage.notification.title,
  //       body: remoteMessage.notification.body,
  //       data: remoteMessage.data,
  //       service: remoteMessage.data.service,
  //       location: remoteMessage.data.location,
  //       userNotificationId: remoteMessage.data.user_notification_id, // Include the user_notification_id
  //       receivedAt: new Intl.DateTimeFormat('en-IN', {
  //         timeZone: 'Asia/Kolkata',
  //         year: 'numeric',
  //         month: '2-digit',
  //         day: '2-digit',
  //         hour: '2-digit',
  //         minute: '2-digit',
  //         second: '2-digit',
  //         hour12: false,
  //       }).format(new Date()),
  //     };
  //     storeNotificationLocally(notification); // Call the function to store notification

  //     PushNotification.localNotification({
  //       autoCancel: false,
  //       ongoing: true,
  //       channelId: 'default-channel-id',
  //       title: remoteMessage.notification.title,
  //       message: remoteMessage.notification.body,
  //       playSound: true,
  //       soundName: 'default',
  //       data: remoteMessage.data,
  //       userInfo: remoteMessage.data,
  //       actions: ['Dismiss'],
  //     });
  //   });

  //   return () => {
  //     unsubscribeOnMessage();
  //   };
  // }, []);

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

  const balanceScreen = () => {
    navigation.push('BalanceScreen');
  };

  const earningsScreen = () => {
    navigation.push('Earnings');
  };

  return (
    <SafeAreaView style={styles.screenContainer}>
      {/* Header */}
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
              <AntDesign
                name="caretdown"
                size={12}
                color="#2E8B57"
                style={styles.downArrow}
              />
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={earningsScreen}>
            <View style={styles.balanceContainer}>
              <MaterialCommunityIcons
                name="currency-inr"
                size={20}
                color="#4a4a4a"
              />
              <Text style={styles.balanceText}>Earnings</Text>
              <AntDesign
                name="caretdown"
                size={12}
                color="#2E8B57"
                style={styles.downArrow}
              />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* LocationComponent */}
      <LocationComponent
        isEnabled={isEnabled}
        onWorkerLocationChange={handleWorkerLocationChange}
      />

      {/* NotificationComponent */}
      {isEnabled && <NotificationComponent workerLocation={workerLocation} />}

      {/* MessageBoxDisplay */}
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

const styles = StyleSheet.create({
  // All the styles from your original HelloWorld component
  screenContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingBottom: 70,
  },
  header: {
    backgroundColor: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
  },
  switchContainer: {
    padding: 10,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  innerSwitch: {
    display: 'flex',
    flexDirection: 'row',
    gap: 10,
  },
  workStatusContainer: {
    alignSelf: 'center',
  },
  workStatus: {
    color: '#4CAF50',
    fontSize: 15,
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
  notificationContainer: {
    alignSelf: 'center',
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
  textContainerText: {
    fontSize: 13,
    paddingBottom: 5,
    fontWeight: 'bold',
    color: '#212121',
    marginLeft: 10,
  },
  textContainerTextCommander: {
    fontSize: 12,
    color: '#9e9e9e',
    marginLeft: 10,
  },
  rightIcon: {
    marginLeft: 8,
  },
});

export default HelloWorld;

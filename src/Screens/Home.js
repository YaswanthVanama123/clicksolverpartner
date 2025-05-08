import React, { useState, useEffect, useCallback } from 'react';
import {
  Dimensions,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  Animated,
} from 'react-native';
import Mapbox from '@rnmapbox/maps';
// Set your mapbox token
Mapbox.setAccessToken(
  'pk.eyJ1IjoieWFzd2FudGh2YW5hbWEiLCJhIjoiY20ybTMxdGh3MGZ6YTJxc2Zyd2twaWp2ZCJ9.uG0mVTipkeGVwKR49iJTbw',
);
import EncryptedStorage from 'react-native-encrypted-storage';
import Geolocation from '@react-native-community/geolocation';
import {
  check,
  checkMultiple,
  request,
  requestMultiple,
  requestNotifications,
  PERMISSIONS,
  RESULTS
} from 'react-native-permissions';
import { useTranslation } from 'react-i18next';
import Entypo from 'react-native-vector-icons/Entypo';
import Octicons from 'react-native-vector-icons/Octicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Foundation from 'react-native-vector-icons/Foundation';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useNavigation,
  CommonActions,
  useFocusEffect,
} from '@react-navigation/native';
import axios from 'axios';
import messaging from '@react-native-firebase/messaging';
import PushNotification from 'react-native-push-notification';
import Feather from 'react-native-vector-icons/Feather';
import { Buffer } from 'buffer';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import ThemeToggleIcon from '../Components/ThemeToggleIcon'; // Adjust the path if needed
import { useTheme } from '../context/ThemeContext';
import LocationTracker from './LocationTracker';
import { useWindowDimensions } from 'react-native';

// 1) **Import the global notification event emitter**
import notificationEventEmitter from '../utils/NotificationEmitter'; // Adjust path as needed

const HomeScreen = () => {
  // 2) Grab screen width & height
  const { width, height } = useWindowDimensions();
  // 3) Create dynamic styles
  const { isDarkMode } = useTheme();
  const styles = dynamicStyles(width, height, isDarkMode);

  const [center, setCenter] = useState([0, 0]);
  const [workerLocation, setWorkerLocation] = useState([]);
  const [activeModalVisible, setActiveModalVisible] = useState(false);
  const navigation = useNavigation();
  const [notificationsArray, setNotificationsArray] = useState([]);
  const [screenName, setScreenName] = useState(null);
  const [params, setParams] = useState(null);
  const [name,setName] = useState('')
  const [messageBoxDisplay, setMessageBoxDisplay] = useState(false);
  const [isEnabled, setIsEnabled] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [greeting, setGreeting] = useState('');
  const [greetingIcon, setGreetingIcon] = useState(null);
  const [showUpArrow, setShowUpArrow] = useState(false);
  const [noDue, setNoDue] = useState(true);

  const [showDownArrow, setShowDownArrow] = useState(false);
  const { t } = useTranslation();

  // NEW: For the inspection confirmation modal
  const [inspectionModalVisible, setInspectionModalVisible] = useState(false);
  const [pendingNotificationId, setPendingNotificationId] = useState(null);
  const AnimatedMarker = Animated.createAnimatedComponent(View);

  // -----------------------------------------------
  // Fetch Notifications from EncryptedStorage
  // -----------------------------------------------
  const fetchNotifications = useCallback(async () => {
    const existingNotifications = await EncryptedStorage.getItem('Requestnotifications');
    let notifications = existingNotifications ? JSON.parse(existingNotifications) : [];

    const currentDate = new Date();

    const filteredNotifications = notifications.filter((noti) => {
      // If `receivedAt` is missing or not in the "DD/MM/YYYY, HH:MM:SS" format, skip it.
      if (
        !noti.receivedAt ||
        typeof noti.receivedAt !== 'string' ||
        !noti.receivedAt.includes(',')
      ) {
        return false;
      }
    
      const [notiDatePart, notiTimePart] = noti.receivedAt.split(', ');
      const [notiDay, notiMonth, notiYear] = notiDatePart.split('/');
      const parsedNotiReceivedAt = `${notiYear}-${notiMonth}-${notiDay}T${notiTimePart}`;
      const notiReceivedAt = new Date(parsedNotiReceivedAt);
    
      const currentDate = new Date();
      const timeDifferenceInMinutes = (currentDate - notiReceivedAt) / (1000 * 60);
    
      return timeDifferenceInMinutes <= 10;
    });
    

    notifications = filteredNotifications;
    setNotificationsArray(notifications);

    await EncryptedStorage.setItem('Requestnotifications', JSON.stringify(notifications));
  }, []);

  // -----------------------------------------------
  // 4) Subscribe to "newNotification" event
  //    => Calls fetchNotifications() so UI updates
  // -----------------------------------------------
  useEffect(() => {
    const handleNewNotification = () => {
      // Re-fetch from EncryptedStorage so we see the new items
      fetchNotifications();
    };

    notificationEventEmitter.addListener('newNotification', handleNewNotification);

    // Cleanup on unmount
    return () => {
      notificationEventEmitter.removeListener('newNotification', handleNewNotification);
    };
  }, [fetchNotifications]);

  // Keep or remove useFocusEffect for extra refresh
  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [fetchNotifications]),
  );

  // -----------------------------------------------
  // Check if worker is in another active service
  // -----------------------------------------------
  const checkWorkerStatus = async () => {
    try {
      const pcs_token = await EncryptedStorage.getItem('pcs_token');
      const response = await axios.get(
        `https://backend.clicksolver.com/api/worker/track/details`,
        {
          headers: { Authorization: `Bearer ${pcs_token}` },
        }
      );
      // If route is not null => worker is on an active service
      const { route } = response.data;
      return route || null;
    } catch (error) {
      console.error('Error checking worker status:', error);
      return null;
    }
  };

  const handleScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const containerHeight = event.nativeEvent.layoutMeasurement.height;
    const contentHeight = event.nativeEvent.contentSize.height;

    // Show up arrow if not at the top
    setShowUpArrow(offsetY > 0);
    // Show down arrow if not at the bottom
    setShowDownArrow(offsetY + containerHeight < contentHeight);
  };

  const fetchTrackDetails = async () => {
    try {
      const pcs_token = await EncryptedStorage.getItem('pcs_token');
      if (pcs_token) {
        const response = await axios.get(
          `https://backend.clicksolver.com/api/worker/track/details`,
          {
            headers: { Authorization: `Bearer ${pcs_token}` },
          } 
        );
        const { route, parameter,name,no_due } = response.data;
        console.log("res",response.data)
        const parsedParams = parameter ? JSON.parse(parameter) : null;

        // If no route or if route is "Paymentscreen"/"worktimescreen" => remove "workerInAction"
        if (!route || route === 'Paymentscreen' || route === 'worktimescreen') {
          await EncryptedStorage.removeItem('workerInAction');  
        }

        setScreenName(route || '');
        setParams(parsedParams || {});
        setName(name || '')
        setMessageBoxDisplay(!!route);
        setNoDue(no_due); 
      } else {
        await EncryptedStorage.removeItem('workerInAction');
        navigation.replace('Login');
      }
    } catch (error) {
      console.error('Error fetching track details:', error);
      await EncryptedStorage.removeItem('workerInAction');
    }
  };

  // -----------------------------------------------
  // Toggle tracking switch
  // -----------------------------------------------
  // const toggleSwitch = async () => {
  //   setIsEnabled((prevState) => {
  //     const newEnabledState = !prevState;
  //     EncryptedStorage.setItem('trackingEnabled', JSON.stringify(newEnabledState)).catch((error) => {
  //       console.error('Error saving enabled state:', error);
  //     });
  //     return newEnabledState;
  //   });
  // };

  const toggleSwitch = async () => {
    // When turning on, verify the location permission is set to "Always"
    if (!isEnabled) {
      let permissionType;
      if (Platform.OS === 'ios') {
        permissionType = PERMISSIONS.IOS.LOCATION_ALWAYS;
      } else {
        // Android: background location permission is required for "all time" tracking
        permissionType = PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION;
      }
    
      const currentStatus = await check(permissionType);
      if (currentStatus !== RESULTS.GRANTED) {
        const requestedStatus = await request(permissionType);
        if (requestedStatus !== RESULTS.GRANTED) {
          Alert.alert(
            'Location Permission Required',
            'Location permission must be set to "Always" for tracking to work. Please enable it in settings.',
            [
              { text: 'Retry', onPress: () => toggleSwitch() },
              { text: 'Cancel', style: 'cancel' },
            ]
          );
          return; // Do not toggle on if permission isn’t granted
        }
      }
    }
  
    // Permission is granted or turning off, so toggle the switch and update storage
    setIsEnabled((prevState) => {
      const newEnabledState = !prevState;
      EncryptedStorage.setItem('trackingEnabled', JSON.stringify(newEnabledState)).catch((error) => {
        console.error('Error saving enabled state:', error);
      });
      return newEnabledState;
    });
  };
    
  

  const fetchTrackingState = async () => {
    try {
      const storedState = await EncryptedStorage.getItem('trackingEnabled');
      setIsEnabled(storedState !== null ? JSON.parse(storedState) : false);
    } catch (error) {
      console.error('Error fetching tracking state:', error);
      setIsEnabled(false);
    }
  };

  // -----------------------------------------------
  // Earnings Screen
  // -----------------------------------------------
  const earningsScreen = () => {
    navigation.push('Earnings');
  };

  // -----------------------------------------------
  // Accept / Reject service request
  // -----------------------------------------------
  const acceptRequest = async (userNotificationId) => {
    // Check if the worker is already in another service
    const activeScreen = await checkWorkerStatus();
    if (activeScreen !== null) {
      setActiveModalVisible(true);
      return;
    }

    // Check for inspection
    const notif = notificationsArray.find(
      (n) => n.data.user_notification_id === userNotificationId
    );
    let requiresInspectionConfirmation = false;

    if (notif && notif.data.service) {
      try {
        const serviceData = JSON.parse(notif.data.service);
        requiresInspectionConfirmation = serviceData.some((s) =>
          s.serviceName.toLowerCase().includes('inspection')
        );
      } catch (error) {
        console.error('Error parsing service data:', error);
      }
    }

    if (requiresInspectionConfirmation) {
      setPendingNotificationId(userNotificationId);
      setInspectionModalVisible(true);
      return;
    }

    await finalizeAcceptRequest(userNotificationId);
  };

  const finalizeAcceptRequest = async (userNotificationId) => {
    const decodedId = Buffer.from(userNotificationId, 'base64').toString('ascii');
    try {
      const jwtToken = await EncryptedStorage.getItem('pcs_token');
      const response = await axios.post(
        `https://backend.clicksolver.com/api/accept/request`,
        { user_notification_id: decodedId },
        { headers: { Authorization: `Bearer ${jwtToken}` } }
      ); 

      if (response.status === 200) {
        // Remove the accepted notification
        setNotificationsArray((prev) => {
          const updated = prev.filter((n) => n.data.user_notification_id !== userNotificationId);
          EncryptedStorage.setItem('Requestnotifications', JSON.stringify(updated));
          return updated;
        });

        const { notificationId } = response.data;
        const encodedNotificationId = Buffer.from(notificationId.toString()).toString('base64');
        const pcs_token = await EncryptedStorage.getItem('pcs_token');

        await axios.post(
          `https://backend.clicksolver.com/api/worker/action`,
          { encodedId: encodedNotificationId, screen: 'UserNavigation' },
          { headers: { Authorization: `Bearer ${pcs_token}` } }
        );

        await EncryptedStorage.setItem('workerInAction', 'true');

        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [
              { name: 'UserNavigation', params: { encodedId: encodedNotificationId } },
            ],
          })
        );
      } else {
        // Revert to Home
        const pcs_token = await EncryptedStorage.getItem('pcs_token');
        await axios.post(
          `https://backend.clicksolver.com/api/worker/action`,
          { encodedId: '', screen: '' },
          { headers: { Authorization: `Bearer ${pcs_token}` } }
        );
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [
              { name: 'Tabs', state: { routes: [{ name: 'Home' }] } },
            ],
          })
        );
      }
    } catch (error) {
      console.error('Error while sending acceptance:', error);
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            { name: 'Tabs', state: { routes: [{ name: 'Home' }] } },
          ],
        })
      );
    }
  };

  const rejectNotification = async (userNotificationId) => {
    try {
      const storedNotifications = await EncryptedStorage.getItem('Requestnotifications');
      const notifications = storedNotifications ? JSON.parse(storedNotifications) : [];
      const updated = notifications.filter(
        (n) => n.data.user_notification_id !== userNotificationId
      );
      await EncryptedStorage.setItem('Requestnotifications', JSON.stringify(updated));
      setNotificationsArray(updated);
    } catch (error) {
      console.error('Failed to remove notification:', error);
    }
  };

  // -----------------------------------------------
  // Greeting
  // -----------------------------------------------
  const setGreetingBasedOnTime = () => {
    const currentHour = new Date().getHours();
    let greetingMessage = t('good_day', 'Good Day');
    let icon = <Icon name="sunny-sharp" size={14} color="#ff5722" />;

    if (currentHour < 12) {
      greetingMessage = t('good_morning', 'Good Morning');
      icon = <Icon name="sunny-sharp" size={16} color="#ff5722" />;
    } else if (currentHour < 17) {
      greetingMessage = t('good_afternoon', 'Good Afternoon');
      icon = <Feather name="sunset" size={16} color="#ff5722" />;
    } else {
      greetingMessage = t('good_evening', 'Good Evening');
      icon = <MaterialIcons name="nights-stay" size={16} color="#F24E1E" />;
    }
    setGreeting(greetingMessage);
    setGreetingIcon(icon); 
  };

  // -----------------------------------------------
  // Balance Screen
  // -----------------------------------------------
  const balanceScreen = () => {
    navigation.push('BalanceScreen');
  };

  // Request user permission for push notifications
  async function requestUserPermission() {
    const authStatus = await messaging().requestPermission();
    if (
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL
    ) {
      console.log('Notification Authorization status:', authStatus);
    }
  }

  // Get FCM tokens
  const getTokens = async () => {
    try {
      const storedToken = await EncryptedStorage.getItem('partner_fcm_token');
      if (storedToken) {
        console.log('FCM token already exists, skipping backend update.');
        return;
      }
      const newToken = await messaging().getToken();
      if (!newToken) {
        console.error('Failed to retrieve FCM token.');
        return;
      }

      const pcs_token = await EncryptedStorage.getItem('pcs_token');
      if (!pcs_token) {
        console.error('No PCS token found, skipping FCM update.');
        return;
      }

      const response = await axios.post(
        `https://backend.clicksolver.com/api/worker/store-fcm-token`,
        { fcmToken: newToken },
        { headers: { Authorization: `Bearer ${pcs_token}` } },
      );
      if (response.status === 200) {
        await EncryptedStorage.setItem('partner_fcm_token', newToken);
      }
      console.log('New FCM token stored and sent to backend:', newToken);
    } catch (error) {
      console.error('Error handling FCM token:', error);
    }
  };

  // -----------------------------------------------
  // Initial mount
  // -----------------------------------------------
  useEffect(() => {
    fetchTrackingState();
    fetchNotifications();
    setGreetingBasedOnTime();
    requestUserPermission();
    getTokens();
  }, []);

  // Another focus effect for track details
  useFocusEffect(
    useCallback(() => {
      fetchTrackDetails();
    }, [])
  );

  useEffect(() => {
    // Create channel
    PushNotification.createChannel(
      {
        channelId: 'default-channel-id',
        channelName: 'Default Channel',
        channelDescription: 'A default channel',
        soundName: 'default',
        importance: 4,
        vibrate: true,
      },
      (created) => console.log(`createChannel returned ''`),
    );

    const storeNotificationLocally = async (notification) => {
      if (notification.data.screen === 'Acceptance') {
        try {
          const existing = await EncryptedStorage.getItem('Requestnotifications');
          let notifications = existing ? JSON.parse(existing) : [];
          notifications.push(notification);

          const currentDate = new Date();
          const filtered = notifications.filter((noti) => {
            const [datePart, timePart] = noti.receivedAt.split(', ');
            const [d, m, y] = datePart.split('/');
            const parsed = `${y}-${m}-${d}T${timePart}`;
            const notiReceivedAt = new Date(parsed);
            const diff = (currentDate - notiReceivedAt) / (1000 * 60);
            return diff <= 10;
          });

          notifications = filtered;
          setNotificationsArray(notifications);
          await EncryptedStorage.setItem(
            'Requestnotifications',
            JSON.stringify(notifications),
          );
          console.log("stored")
        } catch (error) {
          console.error('Failed to store notification locally:', error);
        }
      } else {
        console.log('Notification does not match criteria. Not storing.');
      }
    };

    const unsubscribeOnMessage = messaging().onMessage(async (remoteMessage) => {
      console.log('Foreground FCM', remoteMessage);
      const notificationId = remoteMessage.data.notification_id;
      const pcs_token = await EncryptedStorage.getItem('pcs_token');

      if (remoteMessage.data && remoteMessage.data.screen === 'Home') {
        await axios.post(
          `${process.env.BackendAPI}/api/worker/action`,
          { encodedId: '', screen: '' },
          { headers: { Authorization: `Bearer ${pcs_token}` } },
        );
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Tabs', state: { routes: [{ name: 'Home' }] } }],
          }),
        );
      } else if (remoteMessage.data && remoteMessage.data.screen === 'TaskConfirmation') {
        navigation.push('TaskConfirmation', { encodedId: notificationId });
      }

      const notification = {
        title: remoteMessage.notification.title,
        body: remoteMessage.notification.body,
        data: remoteMessage.data,
        service: remoteMessage.data.service,
        location: remoteMessage.data.location,
        user_notification_id: remoteMessage.data.user_notification_id,
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
        if (Dismissnotification.action === 'Dismiss') {
          PushNotification.cancelLocalNotifications({ id: Dismissnotification.id });
        } else if (Dismissnotification.userInteraction) {
          // handle user interaction
        }
      },
      actions: ['Dismiss'],
    });

    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('setBackgroundMessageHandler FCM in home', remoteMessage);
      const notificationId = remoteMessage.data.notification_id;
      if (remoteMessage.data && remoteMessage.data.screen === 'Home') {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Tabs', state: { routes: [{ name: 'Home' }] } }],
          }),
        );
      } else if (remoteMessage.data && remoteMessage.data.screen === 'TaskConfirmation') {
        navigation.push('TaskConfirmation', { encodedId: notificationId });
      }

      const notification = {
        title: remoteMessage.notification.title,
        body: remoteMessage.notification.body,
        data: remoteMessage.data,
        service: remoteMessage.data.service,
        location: remoteMessage.data.location,
        user_notification_id: remoteMessage.data.user_notification_id,
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

    const unsubscribeOnNotificationOpenedApp = messaging().onNotificationOpenedApp(
      async (remoteMessage) => {
        const notificationId = remoteMessage.data.notification_id;
        const pcs_token = await EncryptedStorage.getItem('pcs_token');

        if (remoteMessage.data && remoteMessage.data.screen === 'Home') {
          await axios.post(
            `${process.env.BackendAPI}/api/worker/action`,
            { encodedId: '', screen: '' },
            { headers: { Authorization: `Bearer ${pcs_token}` } },
          );
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'Tabs', state: { routes: [{ name: 'Home' }] } }],
            }),
          );
        } else if (
          remoteMessage.data &&
          remoteMessage.data.screen === 'TaskConfirmation'
        ) {
          navigation.push('TaskConfirmation', { encodedId: notificationId });
        }
        const notification = {
          title: remoteMessage.notification.title,
          body: remoteMessage.notification.body,
          data: remoteMessage.data,
          service: remoteMessage.data.service,
          location: remoteMessage.data.location,
          user_notification_id: remoteMessage.data.user_notification_id,
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
      },
    );

    messaging()
      .getInitialNotification()
      .then(async (remoteMessage) => {
        if (remoteMessage) {
          const notificationId = remoteMessage.data.notification_id;
          const pcs_token = await EncryptedStorage.getItem('pcs_token');

          if (remoteMessage.data && remoteMessage.data.screen === 'Home') {
            await axios.post(
              `${process.env.BackendAPI}/api/worker/action`,
              { encodedId: '', screen: '' },
              { headers: { Authorization: `Bearer ${pcs_token}` } },
            );
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'Tabs', state: { routes: [{ name: 'Home' }] } }],
              }),
            );
          } else if (
            remoteMessage.data &&
            remoteMessage.data.screen === 'TaskConfirmation'
          ) {
            navigation.push('TaskConfirmation', { encodedId: notificationId });
          }

          const notification = {
            title: remoteMessage.notification.title,
            body: remoteMessage.notification.body,
            data: remoteMessage.data,
            service: remoteMessage.data.service,
            location: remoteMessage.data.location,
            user_notification_id: remoteMessage.data.user_notification_id,
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

  return (
    <SafeAreaView style={styles.screenContainer}>
      <View style={styles.header}>
        <View style={styles.switchContainer}>

          {/* <View>
            <MaterialCommunityIcons
              name="sort-variant"
              size={22}
              color="#656565"
            />
            
          </View> */}
          <View>
    <ThemeToggleIcon />
  </View>
          <View style={styles.innerSwitch}>
            <View style={styles.workStatusContainer}>
              <Text style={styles.workStatus}>{t('active', 'Active')}</Text>
            </View>
            <View style={styles.container}>
              <TouchableOpacity
                onPress={toggleSwitch}
                style={[
                  styles.track,
                  isEnabled ? styles.trackEnabled : styles.trackDisabled,
                ]}
              >
                <View
                  style={[
                    styles.thumb,
                    isEnabled ? styles.thumbEnabled : styles.thumbDisabled,
                  ]}
                />
              </TouchableOpacity>
              <Text style={styles.status}>{isEnabled ? t('on_label', 'On') : t('off_label', 'Off')}</Text>

            </View>
          </View>
          <View>
            <TouchableOpacity
              style={styles.notificationContainer}
              onPress={() => navigation.push('RatingsScreen')}
            >
              <AntDesign name="staro" size={22} color="#656565" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.greeting}>
          <Text style={styles.greetingText}>
            {greeting} <Text style={styles.greetingIcon}>{greetingIcon}</Text>
          </Text>
          <Text style={styles.userName}>{name}</Text>
        </View>
        <View style={styles.moneyContainer}>
          <TouchableOpacity onPress={balanceScreen}>
            <View style={styles.balanceContainer}>
              <MaterialCommunityIcons
                name="bank-outline"
                size={20}
                color="#4a4a4a"
              />
              <Text style={styles.balanceText}>{t('balance', 'Balance')}</Text>
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
              <Text style={styles.balanceText}>{t('earnings', 'Earnings')}</Text>
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

      {!noDue && (
        <View style={styles.noDueWarning}>
          <Text style={styles.noDueWarningText}>
            ⚠️ Your due is pending. You will not receive new services until you pay. 
          </Text>
          <Text style={styles.noDueInfoText}>
            Don't worry! After you pay, your full amount will be returned to your account the next day.
          </Text>
        </View>
      )}


      {/* {isEnabled ? (
        <>
          <Mapbox.MapView style={{ minHeight: height, minWidth: width }}>
            <Mapbox.Camera
              zoomLevel={17}
              centerCoordinate={center}
              animationDuration={1000}  // smooth camera transition
            />
            <Mapbox.PointAnnotation id="current-location" coordinate={center}>
              <View style={styles.markerContainer}>
                <Octicons name="dot-fill" size={25} color="#0E52FB" />
              </View>
            </Mapbox.PointAnnotation>
          </Mapbox.MapView>

          
          {console.log('[HOME] Current tracking state:', isEnabled)}
        
          <LocationTracker
            isEnabled={isEnabled}
            onLocationUpdate={(latitude, longitude) => {
              // Update center state so that the camera smoothly pans to the new location.
              setCenter([longitude, latitude]);
              setWorkerLocation([latitude, longitude]);
            }}
          />
        </>
      ) : (
        <Text style={styles.message}>Please click the switch on</Text>
      )} */}

      {isEnabled !== null && (
        <LocationTracker
          isEnabled={isEnabled}
          onLocationUpdate={(latitude, longitude) => {
            setCenter([longitude, latitude]);
            setWorkerLocation([latitude, longitude]);
          }}
        />
      )}

    {isEnabled ? (
      <>
        <Mapbox.MapView style={{ minHeight: height, minWidth: width }}>
          <Mapbox.Camera zoomLevel={17} centerCoordinate={center} animationDuration={1000} />
          <Mapbox.PointAnnotation id="current-location" coordinate={center}>
            <View style={styles.markerContainer}>
              <Octicons name="dot-fill" size={25} color="#0E52FB" />
            </View>
          </Mapbox.PointAnnotation>
        </Mapbox.MapView>
      </>
    ) : (
      <Text style={styles.message}>{t('switch_on_message', 'Please click the switch on')}</Text>
    )}


      {isEnabled && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled={false}
          contentContainerStyle={styles.scrollContainer}
          style={styles.messageScrollView}
        >
          {notificationsArray.map((notification, index) => {
            let parsedTitle = [];
            let cost = notification.data.cost;

            try {
              parsedTitle = JSON.parse(notification.data.service);
            } catch (error) {
              console.error('Error parsing title:', error);
            }

            return (
              <View key={index} style={styles.messageBox}>
                <View style={styles.serviceCostContainer}>
                  <View style={styles.serviceContainer}>
                    <Text style={styles.secondaryColor}>{t('service', 'Service')}</Text>
                    <View style={{ position: 'relative' }}>
                      {showUpArrow && (
                        <View style={styles.arrowUpContainer}>
                          <Entypo
                            name="chevron-small-up"
                            size={20}
                            color="#9e9e9e"
                          />
                        </View>
                      )}

                      <ScrollView
                        style={styles.serviceNamesContainer}
                        contentContainerStyle={styles.serviceNamesContent}
                        onScroll={handleScroll}
                        scrollEventThrottle={16}
                      >
                        {Array.isArray(parsedTitle) ? (
                          parsedTitle.map((service, serviceIndex) => (
                            <Text key={serviceIndex} style={styles.primaryColor}>
                              { t(`singleService_${service.main_service_id}`) || service.serviceName }
                            
                              {serviceIndex < parsedTitle.length - 1
                                ? ', '
                                : ''}
                            </Text>
                          ))
                        ) : (
                          <Text>{t('no_services', 'No services available')}</Text>
                        )}
                      </ScrollView>

                      {showDownArrow && (
                        <View style={styles.arrowDownContainer}>
                          <Entypo
                            name="chevron-small-down"
                            size={20}
                            color="#9e9e9e"
                          />
                        </View>
                      )}
                    </View>
                  </View>
                  <View>
                    <Text style={styles.secondaryColor}>{t('cost', 'Cost')}</Text>
                    <Text style={styles.primaryColor}>₹{cost}</Text>
                  </View>
                </View>
                <View style={styles.addressContainer}>
                  <View>
                    <Text style={styles.secondaryColor}>{t('location', 'Location')}</Text>
                    <Text style={styles.address}>
                      {notification.data.location}
                    </Text>
                  </View>
                </View>
                <View style={styles.buttonsContainer}>
                  <TouchableOpacity
                    onPress={() =>
                      rejectNotification(notification.data.user_notification_id)
                    }
                  >
                    <Entypo name="cross" size={25} color="#9e9e9e" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() =>
                      acceptRequest(notification.data.user_notification_id)
                    }
                  >
                    <Text style={styles.secondaryButtonText}>{t('accept', 'Accept')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {messageBoxDisplay && (
        <TouchableOpacity
          style={styles.messageBoxContainer}
          onPress={() => navigation.replace(screenName, params)}
        >
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
                <MaterialCommunityIcons name="hammer" size={24} color="#ffffff" />
              ) : (
                <Feather name="alert-circle" size={24} color="#000" />
              )}
            </View>
            <View>
              {screenName === 'Paymentscreen' ? (
                <Text style={styles.textContainerText}>
                  {t('payment_in_progress', 'Payment in progress')}
                </Text>
              ) : screenName === 'UserNavigation' ? (
                <Text style={styles.textContainerText}>
                  {t('waiting_for_help', 'User is waiting for your help')}
                </Text>
              ) : screenName === 'OtpVerification' ? (
                <Text style={styles.textContainerText}>
                  {t('waiting_for_help', 'User is waiting for your help')}
                </Text>
              ) : screenName === 'worktimescreen' ? (
                <Text style={styles.textContainerText}>{t('work_in_progress', 'Work in progress')}</Text>
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

       {/* Custom Modal for active service */}
       <Modal
        visible={activeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{t('active_service_title', 'Active Service')}</Text>
            <Text style={styles.modalMessage}>
              {t('active_service_message', 'You are already engaged with another service.')}
          
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setActiveModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/** INSPECTION CONFIRMATION MODAL */}
      <Modal
        animationType="slide"
        transparent
        visible={inspectionModalVisible}
        onRequestClose={() => setInspectionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('inspection_confirmation', 'Inspection Confirmation')}</Text>
            <Text style={styles.modalMessage}>
            {t(
                'inspection_message',
                'This request includes an inspection. Fee is ₹49. If you are comfortable just inspecting, click "Sure". Otherwise, click "Cancel".'
              )}
            </Text>
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalSureButton]}
                onPress={() => {
                  finalizeAcceptRequest(pendingNotificationId);
                  setInspectionModalVisible(false);
                }}
              >
                <Text style={styles.modalButtonText}>{t('sure', 'Sure')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setInspectionModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>{t('cancel', 'Cancel')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

/**
 * 4) A helper function that returns a StyleSheet based on screen width & height.
 *    If width >= 600, we treat it as a tablet and scale up certain styles.
 */
function dynamicStyles(width, height, isDarkMode) {
  const isTablet = width >= 600;
  return StyleSheet.create({
    screenContainer: {
      flex: 1,
      backgroundColor: isDarkMode ? '#000000' : '#ffffff',
      paddingBottom: 70,
    },
    header: {
      backgroundColor: isDarkMode ? '#121212' : '#ffffff',
      flexDirection: 'column',
    },
    switchContainer: {
      padding: 10,
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    innerSwitch: {
      flexDirection: 'row',
      gap: 10,
    },
    workStatusContainer: {
      alignSelf: 'center',
    },
    workStatus: {
      color: '#4CAF50',
      fontSize: isTablet ? 16 : 15,
    },
    container: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    track: {
      width: isTablet ? 52 : 47,
      height: isTablet ? 32 : 27,
      borderRadius: isTablet ? 18 : 15,
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
      width: isTablet ? 28 : 24,
      height: isTablet ? 28 : 24,
      borderRadius: isTablet ? 14 : 13,
    },
    thumbEnabled: {
      backgroundColor: '#ffffff',
      alignSelf: 'flex-end',
    },
    thumbDisabled: {
      backgroundColor: '#f4f3f4',
      alignSelf: 'flex-start',
    },
    status: {
      paddingLeft: 10,
      fontSize: isTablet ? 16 : 14,
      color: isDarkMode ? '#ffffff' : '#212121',
    },
    notificationContainer: {
      alignSelf: 'center',
    },
    greeting: {
      flexDirection: 'column',
      alignItems: 'center',
      marginVertical: isTablet ? 12 : 10,
    },
    greetingText: {
      fontSize: isTablet ? 16 : 14,
      fontStyle: 'italic',
      color: isDarkMode ? '#bbbbbb' : '#808080',
      fontWeight: 'bold',
    },
    greetingIcon: {
      fontSize: isTablet ? 18 : 16,
    },
    userName: {
      fontSize: isTablet ? 18 : 16,
      fontWeight: '500',
      color: isDarkMode ? '#ffffff' : '#4A4A4A',
      marginTop: 4,
    },
    moneyContainer: {
      padding: 10,
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: isTablet ? 12 : 10,
    },
    balanceContainer: {
      padding: isTablet ? 12 : 10,
      width: isTablet ? 180 : 162,
      height: isTablet ? 50 : 45,
      borderRadius: isTablet ? 28 : 25,
      backgroundColor: isDarkMode ? '#333333' : '#ffffff',
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: 1 },
      shadowRadius: 2,
      elevation: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginHorizontal: isTablet ? 5 : 2,
    },
    balanceText: {
      flex: 1,
      textAlign: 'center',
      color: isDarkMode ? '#ffffff' : '#212121',
      fontWeight: 'bold',
      fontSize: isTablet ? 16 : 14,
    },
    downArrow: {
      marginLeft: 10,
    },
    markerContainer: {
      backgroundColor: isDarkMode ? '#222222' : '#ffffff',
      borderRadius: 12.5,
      justifyContent: 'center',
      alignItems: 'center',
      width: isTablet ? 30 : 25,
      height: isTablet ? 30 : 25,
      paddingBottom: 2,
    },
    message: {
      fontSize: isTablet ? 16 : 14,
      textAlign: 'center',
      marginTop: 20,
      color: isDarkMode ? '#888888' : '#777777',
    },
    messageScrollView: {
      position: 'absolute',
      bottom: '-5%',
      left: 0,
      right: 0,
      height: 300,
    },
    scrollContainer: {
      paddingHorizontal: width * 0.05,
    },
    messageBox: {
      width: width * 0.85,
      height: isTablet ? 260 : 240,
      backgroundColor: isDarkMode ? '#222222' : '#fff',
      marginRight: width * 0.05,
      borderRadius: 10,
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 10,
      elevation: 5,
      padding: isTablet ? 24 : 20,
      flexDirection: 'column',
      justifyContent: 'space-between',
    },
    serviceCostContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    serviceContainer: {
      flex: 1,
      marginRight: 10,
    },
    secondaryColor: {
      color: isDarkMode ? '#cccccc' : '#9e9e9e',
      fontSize: isTablet ? 17 : 15,
    },
    serviceNamesContainer: {
      maxHeight: 60,
    },
    serviceNamesContent: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    arrowUpContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      zIndex: 1,
    },
    arrowDownContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      zIndex: 1,
    },
    primaryColor: {
      color: isDarkMode ? '#ffffff' : '#212121',
      fontSize: isTablet ? 16 : 14,
    },
    addressContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginTop: 10,
    },
    address: {
      color: isDarkMode ? '#ffffff' : '#212121',
      fontSize: isTablet ? 13 : 12,
      width: isTablet ? 240 : 210,
    },
    buttonsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 10,
    },
    secondaryButton: {
      backgroundColor: '#FF5722',
      width: isTablet ? 130 : 120,
      height: isTablet ? 40 : 36,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 10,
    },
    secondaryButtonText: {
      color: '#ffffff',
      fontSize: isTablet ? 15 : 14,
      fontWeight: '600',
    },
    messageBoxContainer: {
      backgroundColor: isDarkMode ? '#333333' : '#ffffff',
      borderRadius: 10,
      flexDirection: 'row',
      padding: isTablet ? 12 : 10,
      justifyContent: 'space-between',
      alignItems: 'center',
      elevation: 3,
      position: 'absolute',
      bottom: isTablet ? 12 : 8,
      left: 10,
      right: 10,
    },
    messageBox1: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
    },
    timeContainer: {
      width: isTablet ? 55 : 50,
      height: isTablet ? 55 : 50,
      backgroundColor: '#ff5722',
      borderRadius: isTablet ? 27.5 : 25,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: isTablet ? 20 : 16,
    },
    textContainerText: {
      fontSize: isTablet ? 16 : 15,
      paddingBottom: 5,
      fontWeight: 'bold',
      color: isDarkMode ? '#ffffff' : '#212121',
      marginLeft: 10,
    },
    rightIcon: {
      marginLeft: 8,
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: isDarkMode ? '#333333' : '#fff',
      padding: isTablet ? 24 : 20,
      borderRadius: 10,
      width: isTablet ? '60%' : '80%',
      alignItems: 'center',
    },
    modalTitle: {
      fontSize: isTablet ? 20 : 18,
      fontWeight: 'bold',
      marginBottom: 10,
      textAlign: 'center',
      color: isDarkMode ? '#ffffff' : '#000000',
    },
    modalMessage: {
      fontSize: isTablet ? 16 : 14,
      textAlign: 'center',
      marginBottom: 20,
      color: isDarkMode ? '#dddddd' : '#333333',
    },
    modalButtonsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
    },
    modalButton: {
      flex: 1,
      paddingVertical: isTablet ? 12 : 10,
      borderRadius: 8,
      alignItems: 'center',
      marginHorizontal: 5,
    },
    modalSureButton: {
      backgroundColor: '#FF5722',
    },
    modalCancelButton: {
      backgroundColor: '#BDBDBD',
    },
    modalButtonText: {
      color: '#fff',
      fontSize: isTablet ? 16 : 14,
      fontWeight: '600',
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)', // semi-transparent background
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      width: '80%',
      backgroundColor: isDarkMode ? '#000000' : '#000000',
      borderRadius: 10,
      paddingVertical: 20,
      paddingHorizontal: 25,
      alignItems: 'center',
      elevation: 5,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '600',
      marginBottom: 10,
    },
    modalMessage: {
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 20,
    },
    modalButton: {
      backgroundColor: '#ff5722',
      borderRadius: 5,
      paddingVertical: 10,
      paddingHorizontal: 20,
    },
    modalButtonText: {
      color: '#fff',
      fontSize: 16,
    },
    noDueWarning: {
      backgroundColor: isDarkMode ? '#2c2c2c' : '#fff3e0', // dark grey in dark mode, light orange otherwise
      borderColor: isDarkMode ? '#ff9800' : '#ff9800',      // keep border same
      borderWidth: 1,
      padding: 14,
      margin: 12,
      borderRadius: 8,
    },
    noDueWarningText: {
      color: isDarkMode ? '#ffcc80' : '#e65100',             // light orange text for dark, dark orange for light
      fontWeight: 'bold',
      fontSize: 15,
      marginBottom: 6,
    },
    noDueInfoText: {
      color: isDarkMode ? '#d7ccc8' : '#6d4c41',             // light brown for dark theme
      fontSize: 13,
    },
    
    
  }); 
}

export default HomeScreen;
   
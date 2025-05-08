// app.tsx
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, SafeAreaView, ActivityIndicator, View, Appearance, Platform } from 'react-native';
import { NavigationContainer, CommonActions, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import messaging from '@react-native-firebase/messaging';
import './i18n/i18n';
import axios from 'axios';
import EncryptedStorage from 'react-native-encrypted-storage';
import SplashScreen from 'react-native-splash-screen';
import Feather from 'react-native-vector-icons/Feather';
import Entypo from 'react-native-vector-icons/Entypo';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { request, PERMISSIONS, requestNotifications } from 'react-native-permissions';

// Import your components/screens
import LanguageSelector from './Components/LanguageSelector';
import RecentServices from './Components/RecentServices';
import Profile from './Components/Profile';
import PartnerSteps from './Components/PartnerSteps';
import LoginScreen from './Components/LoginScreen';
import RegistrationScreen from './Components/RegistrationScreen';
import UPIIdDetailsScreen from './Components/UPIIdDetailsScreen';
import BankAccountScreen from './Components/BankAccountScreen';
import BalanceScreen from './Screens/BalanceScreen';
import RatingsScreen from './Components/ratingsScreen';
import EarningsScreen from './Screens/EarningsScreen';
import TaskConfirmation from './Components/TaskConfirmation';
import ServiceCompletionScreen from './Components/ServiceCompletionScreen';
import PaymentScanner from './Components/PaymentScanner';
import OTPVerification from './Components/OtpVerification';
import WorkerNavigationScreen from './Components/WorkerNavigationScreen';
import WorkerAcceptance from './Components/Acceptance';
import SignUpScreen from './Components/SignUpScreen';
import skills from './Components/Skills';
import ServiceTrackingListScreen from './Components/ServiceTrackingListScreen';
import ServiceTrackingItemScreen from './Components/ServiceTrackingItemScreen';
import TrackingConfirmation from './Components/TrackingConfirmation';
import ServiceBookingItem from './Components/ServiceBookingItem';


import ServiceInProgress from './Components/ServiceInProgress';
import ServiceRegistration from './Components/ServiceRegistration';
import HomeScreen from './Screens/Home';
import WorkerOtpVerificationScreen from './Components/WorkerOtpVerificationScreen';
import ProfileChange from './Components/ProfileChange';
import PaymentConfirmationScreen from './Components/PaymentConfirmationScreen';
import { useTranslation } from 'react-i18next';

// Import the ThemeProvider and hook
import { ThemeProvider, useTheme } from './context/ThemeContext';
import ServiceBookingOngoingItem from './Components/ServiceBookingOngoingItem';
import ChatScreen from './Components/ChatScreen';
import ProfileScreen from './Components/ProfileScreen';
import WorkerHelpScreen from './Components/HelpScreen';

// NEW: Import the global notification event emitter
import notificationEventEmitter from './utils/NotificationEmitter'; // Adjust the path based on your structure
// NEW: Import CodePush from react-native-code-push
import CodePush from 'react-native-code-push';
import WorkerOnboardingScreen from './Components/WorkerOnboardingScreen';


// Define your deployment key and options for CodePush.
// Replace 'YOUR_PRODUCTION_KEY' with your actual key. Optionally, include serverUrl if using a self-hosted CodePush server.
const codePushOptions = {
  checkFrequency: CodePush.CheckFrequency.ON_APP_START,
  deploymentKey: '1b26419b-2817-11f0-ba9f-1a459c0f37ba', // Worker app production key
  serverUrl: 'http://206.189.137.144:3000',
};

// Define your Stack and Tab navigators
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  const { isDarkMode } = useTheme();
  const { t } = useTranslation();
  const tabBarBackground = isDarkMode ? '#333' : '#fff';

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            size = focused ? 28 : 24; // Slight size change when active

            if (route.name === 'Home') {
              iconName = 'home';
              return <Feather name={iconName} size={size} color={color} />;
            } else if (route.name === 'Bookings') {
              iconName = 'clipboard';
              return <Feather name={iconName} size={size} color={color} />;
            } else if (route.name === 'Tracking') {
              iconName = 'wallet';
              return <Entypo name={iconName} size={size} color={color} />;
            } else if (route.name === 'Account') {
              iconName = 'account-outline';
              return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
            }
          },
          tabBarActiveTintColor: '#ff4500',
          tabBarInactiveTintColor: 'gray',
          tabBarLabelStyle: { fontSize: 12 },
          tabBarStyle: {
            height: 60,
            paddingBottom: 5,
            paddingTop: 5,
            backgroundColor: tabBarBackground,
          },
        })}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{ 
            headerShown: false,
            tabBarLabel: t('tab_home', 'Home'),
          }}
        />
        <Tab.Screen
          name="Bookings"
          component={RecentServices}
          options={{ 
            headerShown: false,
            tabBarLabel: t('tab_bookings', 'Bookings'),
          }}
        />
        <Tab.Screen
          name="Tracking"
          component={ServiceTrackingListScreen}
          options={{ 
            headerShown: false,
            tabBarLabel: t('tab_tracking', 'Tracking'),
          }}
        />
        <Tab.Screen
          name="Account"
          component={ProfileScreen}
          options={{ 
            headerShown: false,
            tabBarLabel: t('tab_account', 'Account'),
          }}
        />
      </Tab.Navigator>
    </SafeAreaView>
  );
}

function AppContent() {
  const navigationRef = useRef<NavigationContainerRef>(null);
  const [initialRoute, setInitialRoute] = useState<string | null>(null);
  const { isDarkMode } = useTheme();


  useEffect(() => {
    // Check for CodePush updates when the app starts
    CodePush.sync({
      installMode: CodePush.InstallMode.IMMEDIATE, // Apply updates immediately
      updateDialog: true, // Show a dialog before updating
    });
  }, []);

  // Handler for force logout
  const handleForceLogout = async () => {
    try {
      const workerOnboarding = await EncryptedStorage.getItem('worker_onboarded');
      if(workerOnboarding){
      
      console.log("Logging out due to session expiration...");
      const partner_fcm_token = await EncryptedStorage.getItem('partner_fcm_token');
      console.log("fcm token", partner_fcm_token);
      if (partner_fcm_token) {
        await axios.post('https://backend.clicksolver.com/api/workerLogout', { partner_fcm_token });
      }
      await EncryptedStorage.removeItem("pcs_token");
      await EncryptedStorage.removeItem("partner_fcm_token");
      await EncryptedStorage.removeItem("unique");
      await EncryptedStorage.removeItem("firebaseDocId");
      await EncryptedStorage.removeItem("nullCoordinates");
      await EncryptedStorage.removeItem("previousEnabled");
      await EncryptedStorage.removeItem("workerSessionToken");

      navigationRef.current?.dispatch(
        CommonActions.reset({ 
          index: 0,
          routes: [{ name: "Login" }],
        })
      );}
      else{

        navigationRef.current?.navigate('WorkerOnboardingScreen');
      }
    } catch (error) {
      console.error("Error handling force logout:", error);
    }
  };


  const getTokens = async () => {
    try {
      // First, check for PCS token.
      const pcs_token = await EncryptedStorage.getItem('pcs_token');
      const workerOnboarding = await EncryptedStorage.getItem('worker_onboarded');

      if (!pcs_token) {
        if(workerOnboarding){
          console.error('No PCS token found. Navigating to Login.');
          await EncryptedStorage.removeItem("pcs_token");
          await EncryptedStorage.removeItem("partner_fcm_token");
          await EncryptedStorage.removeItem("unique");
          await EncryptedStorage.removeItem("firebaseDocId");
          await EncryptedStorage.removeItem("nullCoordinates");
          await EncryptedStorage.removeItem("previousEnabled");
          await EncryptedStorage.removeItem("workerSessionToken");
          navigationRef.current?.dispatch(
            CommonActions.reset({
              index: 0, 
              routes: [{ name: "Login" }],
            })
          );
          // Navigate to Login if PCS token is missing.
     
          // navigation.replace('Login');
          return;
        }
        else{
        console.error('No PCS token found. Navigating to Login.');
        await EncryptedStorage.removeItem("pcs_token");
        await EncryptedStorage.removeItem("partner_fcm_token");
        await EncryptedStorage.removeItem("unique");
        await EncryptedStorage.removeItem("firebaseDocId");
        await EncryptedStorage.removeItem("nullCoordinates");
        await EncryptedStorage.removeItem("previousEnabled");
        await EncryptedStorage.removeItem("workerSessionToken");

        navigationRef.current?.navigate('WorkerOnboardingScreen');
        // Navigate to Login if PCS token is missing.
   
        // navigation.replace('Login');
        return;
      }
      }
  
      // Next, check if FCM token already exists.
      const storedToken = await EncryptedStorage.getItem('partner_fcm_token');
      console.log(storedToken)
      if (storedToken) {
        console.log('FCM token already exists, skipping backend update.');
        return;
      }
  
      // Generate a new FCM token.
      const newToken = await messaging().getToken();
      if (!newToken) {
        console.error('Failed to retrieve FCM token.');
        return;
      }
  
      // Send new token to backend with PCS token authorization.
      const response = await axios.post(
        `https://backend.clicksolver.com/api/worker/store-fcm-token`,
        { fcmToken: newToken },
        { headers: { Authorization: `Bearer ${pcs_token}` } }
      );
  
      // If successful, store the new token in EncryptedStorage.
      if (response.status === 200) {
        await EncryptedStorage.setItem('partner_fcm_token', newToken);
        console.log('New FCM token stored and sent to backend:', newToken);
      } else {
        console.error('Backend did not accept FCM token. Response status:', response.status);
      }
    } catch (error) {
      console.error('Error handling FCM token:', error);
    }
  };

  // Check session on app start
  useEffect(() => {
    const checkSessionOnAppStart = async () => {
      try {
        const pcsToken = await EncryptedStorage.getItem("pcs_token");
        if (!pcsToken) {
          console.warn("No PCS token found, logging out...");
          handleForceLogout();

          return;
        }
        const response = await axios.post(
          "https://backend.clicksolver.com/api/worker/token/verification",
          { pcsToken },
          { headers: { Authorization: `Bearer ${pcsToken}` } }
        );
        if (response.status === 205) {
          console.warn("Session expired, logging out...");
          handleForceLogout();
        } else {
          console.log("Session valid, continuing...");
        }
      } catch (error) {
        console.error("Error checking session validity:", error);
      }
    };
    checkSessionOnAppStart();
    getTokens();
  }, []);

  // Set up permission and notification handlers
  useEffect(() => {
    const requestPermissions = async () => {
      try {
        // Request notifications permission using react-native-permissions
        const { status: notifStatus } = await requestNotifications(['alert', 'sound', 'badge']);
        console.log('Notifications permission status:', notifStatus);

        let locationStatus;

        if (Platform.OS === 'ios') {
          // First request LOCATION_WHEN_IN_USE
          const whenInUseStatus = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
          console.log('Location When In Use permission status:', whenInUseStatus);
          if (whenInUseStatus === 'granted') {
            // Now request LOCATION_ALWAYS
            locationStatus = await request(PERMISSIONS.IOS.LOCATION_ALWAYS);
            console.log('Location Always permission status:', locationStatus);
          } else {
            console.warn('Location When In Use permission was not granted');
          }
        } else {
          // For Android, first request ACCESS_FINE_LOCATION
          const fineLocationStatus = await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
          console.log('Fine Location permission status:', fineLocationStatus);
          if (fineLocationStatus === 'granted') {
            // Then request ACCESS_BACKGROUND_LOCATION
            locationStatus = await request(PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION);
            console.log('Background Location permission status:', locationStatus);
          } else {
            console.warn('Fine Location permission was not granted');
          }
        }
      } catch (err) {
        console.warn('Error requesting permissions:', err);
      }
    };

    // NEW: Helper to store a notification and emit event
    const storeNotificationLocally = async (notification) => {
      try {
        // Only store if the notification meets your criteria (e.g., screen is 'Acceptance')
        if (notification.data?.screen === 'Acceptance') {
          // Add the receivedAt property if it's not already there
          const newNotification = {
            ...notification,
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
    
          // Retrieve existing notifications from storage
          const existing = await EncryptedStorage.getItem('Requestnotifications');
          let notifications = existing ? JSON.parse(existing) : [];
    
          // Add the new notification
          notifications.push(newNotification);
    
          // Store them back
          await EncryptedStorage.setItem('Requestnotifications', JSON.stringify(notifications));
        } else {
          console.log('Notification does not match criteria. Not storing.');
        }
        // Emit an event so your Home screen knows a new notification is stored
        notificationEventEmitter.emit('newNotification', notification);
      } catch (error) {
        console.error('Failed to store notification locally:', error);
      }
    };
    

    const handleForegroundNotification = () => {
      messaging().onMessage(async remoteMessage => {
        const notificationId = remoteMessage.data?.notification_id;
        const screen = remoteMessage.data?.screen;

        if (!navigationRef.current) {
          console.warn('Navigation reference is not set yet.');
          return;
        }

        if (screen === 'Home') {
          navigationRef.current.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'Tabs', state: { routes: [{ name: 'Home' }] } }],
            })
          );
        } else if (screen === 'TaskConfirmation') {
          navigationRef.current.navigate('TaskConfirmation', {
            encodedId: notificationId,
          });
        } else if (remoteMessage.data?.action === "FORCE_LOGOUT") {
          handleForceLogout();
        }

        // Store and emit the notification
        await storeNotificationLocally(remoteMessage);
      });
    };

    const handleBackgroundNotification = () => {
      messaging().setBackgroundMessageHandler(async remoteMessage => {
        const notificationId = remoteMessage.data?.notification_id;
        const screen = remoteMessage.data?.screen;

        if (!navigationRef.current) {
          console.warn('Navigation reference is not set yet.');
          return;
        }

        if (screen === 'Home') {
          navigationRef.current.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'Home' }],
            })
          );
        } else if (screen === 'TaskConfirmation') {
          navigationRef.current.navigate('TaskConfirmation', {
            encodedId: notificationId,
          });
        } else if (remoteMessage.data?.action === "FORCE_LOGOUT") {
          handleForceLogout();
        }

        // Store and emit the notification
        await storeNotificationLocally(remoteMessage);
      });
    };

    const handleInitialNotification = async () => {
      const remoteMessage = await messaging().getInitialNotification();
      const screen = remoteMessage?.data?.screen;

      if (!navigationRef.current) {
        console.warn('Navigation reference is not set yet.');
        return;
      }

      if (screen === 'Home') {
        navigationRef.current.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Tabs', state: { routes: [{ name: 'Home' }] } }],
          })
        );
      } else if (screen === 'TaskConfirmation') {
        navigationRef.current.navigate('TaskConfirmation', {
          encodedId: remoteMessage?.data?.notification_id,
        });
      } else if (remoteMessage?.data?.action === "FORCE_LOGOUT") {
        handleForceLogout();
      }

      // Store and emit the initial notification if present
      if (remoteMessage) {
        await storeNotificationLocally(remoteMessage);
      }
    };

    const setupHandlers = async () => {
      // await requestPermissions();
      handleForegroundNotification();
      handleBackgroundNotification();
      handleInitialNotification();
    };

    setupHandlers();
    SplashScreen.hide();
  }, []);

  // Check partner steps status
  useEffect(() => {
    const checkPartnerStepsStatus = async () => {
      try {
        const pcsToken = await EncryptedStorage.getItem('pcs_token');
        if (pcsToken) {
          const partnerStepsToken = await EncryptedStorage.getItem('partnerSteps');
          const verification = await EncryptedStorage.getItem('verification');
          console.log("partner steps",partnerStepsToken)
          if (partnerStepsToken === 'completed') {
            console.log("complete")
            if (verification === 'true') {
              const workerOnboarding = await EncryptedStorage.getItem('worker_onboarded');
              console.log("worker complete",workerOnboarding)
              if(workerOnboarding){
                setInitialRoute('Tabs');
                navigationRef.current?.navigate('Tabs');
              }else{
                setInitialRoute('WorkerOnboardingScreen');
                navigationRef.current?.navigate('WorkerOnboardingScreen');
              }
            } else {
              console.log("navigate to approval")
              setInitialRoute('ApprovalScreen');
              navigationRef.current?.navigate('ApprovalScreen');
            }
          } else {
            console.log("navigate to PartnerSteps")
            setInitialRoute('PartnerSteps');
            navigationRef.current?.navigate('PartnerSteps');
          }
        } else {
          const workerOnboarding = await EncryptedStorage.getItem('worker_onboarded');
          if(workerOnboarding){
            setInitialRoute('Login');
            navigationRef.current?.navigate('Login');
          }else{
            setInitialRoute('WorkerOnboardingScreen');
            navigationRef.current?.navigate('WorkerOnboardingScreen');
          }  
 
        }
      } catch (error) {
        console.error('Error retrieving tokens:', error);
        setInitialRoute('Login');
        navigationRef.current?.navigate('Login');
      }
    };

    checkPartnerStepsStatus();
  }, []);

  // Show a loading screen until initialRoute is determined
  if (!initialRoute) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }else{
    console.log("initialRoute",initialRoute)
  }

  const appBackground = isDarkMode ? '#000' : '#fff';

  return (
    <NavigationContainer ref={navigationRef}>

      <Stack.Navigator initialRouteName={initialRoute}>
        <Stack.Screen name="Tabs" component={TabNavigator} options={{ headerShown: false }} />
        <Stack.Screen name="PartnerSteps" component={PartnerSteps} options={{ title: 'PartnerSteps', headerShown: false }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Login', headerShown: false, keyboardHandlingEnabled: false }} />
        <Stack.Screen name="SkillRegistration" component={RegistrationScreen} options={{ title: 'SkillRegistration', headerShown: false }} />
        <Stack.Screen name="Acceptance" component={WorkerAcceptance} options={{ title: 'Acceptance' }} />
        <Stack.Screen name="ServiceRegistration" component={ServiceRegistration} options={{ title: 'ServiceRegistration', headerShown: false }} />
        <Stack.Screen name="UserNavigation" component={WorkerNavigationScreen} options={{ title: 'UserNavigation', headerShown: false }} />
        <Stack.Screen name="worktimescreen" component={ServiceInProgress} options={{ title: 'worktimescreen', headerShown: false }} />
        <Stack.Screen name="OtpVerification" component={OTPVerification} options={{ title: 'OtpVerification', headerShown: false }} />
        <Stack.Screen name="PaymentConfirmationScreen" component={PaymentConfirmationScreen} options={{ title: 'PaymentConfirmationScreen', headerShown: false }} />
        <Stack.Screen name="Paymentscreen" component={PaymentScanner} options={{ title: 'Paymentscreen', headerShown: false }} />
        <Stack.Screen name="ServiceCompleted" component={ServiceCompletionScreen} options={{ title: 'PaymentCompleted', headerShown: false }} />
        <Stack.Screen name="TaskConfirmation" component={TaskConfirmation} options={{ title: 'TaskConfirmation', headerShown: false }} />
        <Stack.Screen name="Profile" component={Profile} options={{ title: 'Profile', headerShown: false }} />
        <Stack.Screen name="Services" component={RecentServices} options={{ title: 'RecentServices', headerShown: false }} />
        <Stack.Screen name="Help" component={WorkerHelpScreen} options={{ title: 'Help', headerShown: false }} />
        <Stack.Screen name="ProfileScreen" component={skills} options={{ title: 'Profile', headerShown: false }} />
        <Stack.Screen name="Earnings" component={EarningsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="RatingsScreen" component={RatingsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="BalanceScreen" component={BalanceScreen} options={{ headerShown: false }} />
        <Stack.Screen name="BankAccountScreen" component={BankAccountScreen} options={{ title: 'BankAccountScreen', headerShown: false }} />
        <Stack.Screen name="WorkerOtpVerificationScreen" component={WorkerOtpVerificationScreen} options={{ title: 'WorkerOtpVerificationScreen', headerShown: false }} />
        <Stack.Screen name="SignupDetails" component={SignUpScreen} options={{ title: 'SignupDetails', headerShown: false }} />
        <Stack.Screen name="UpiIDScreen" component={UPIIdDetailsScreen} options={{ title: 'UpiIDScreen', headerShown: false }} />
        <Stack.Screen name="ServiceTrackingItem" component={ServiceTrackingItemScreen} options={{ title: 'ServiceTrackingItem', headerShown: false }} />
        <Stack.Screen name="TrackingConfirmation" component={TrackingConfirmation} options={{ title: 'TrackingConfirmation', headerShown: false }} />
        <Stack.Screen name="WorkerProfile" component={ProfileChange} options={{ title: 'WorkerProfile', headerShown: false }} />
        <Stack.Screen name="serviceBookingItem" component={ServiceBookingItem} options={{ title: 'serviceBookingItem', headerShown: false }} />
        <Stack.Screen name="ProfileChange" component={ProfileChange} options={{ title: 'ProfileChange', headerShown: false }} />
        <Stack.Screen name="ServiceInProgress" component={ServiceInProgress} options={{ title: 'ServiceInProgress', headerShown: false }} />
        <Stack.Screen name="ServiceBookingOngoingItem" component={ServiceBookingOngoingItem} options={{ title: 'ServiceBookingOngoingItem', headerShown: false }} />
        <Stack.Screen name="ChatScreen" component={ChatScreen} options={{ title: 'ServiceBookingOngoingItem', headerShown: false }} />
        <Stack.Screen name="LanguageSelector" component={LanguageSelector} options={{ title: 'LanguageSelector', headerShown: false }} />
        <Stack.Screen name="WorkerOnboardingScreen" component={WorkerOnboardingScreen} options={{ title: 'WorkerOnboardingScreen', headerShown: false }} />
        

        
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function App() {
  const { isDarkMode } = useTheme();
  const appBackground = isDarkMode ? '#000' : '#fff';

  return (
    <View style={[styles.appContainer, { backgroundColor: appBackground }]}>
      <AppContent />
    </View>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// Wrap your App with CodePush
const CodePushApp = CodePush(codePushOptions)(App);

export default function Root() {
  return (
    <ThemeProvider>
      <CodePushApp />
    </ThemeProvider>
  );
}

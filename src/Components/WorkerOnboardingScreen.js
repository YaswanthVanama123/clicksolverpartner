import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  ScrollView,
  Alert,
} from 'react-native';
import Swiper from 'react-native-swiper';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import EncryptedStorage from 'react-native-encrypted-storage';
import { useNavigation, CommonActions } from '@react-navigation/native';
import {
  requestNotifications, 
  checkNotifications,
} from 'react-native-permissions';
import { request, PERMISSIONS } from 'react-native-permissions';

const WorkerOnboardingScreen = () => {
  const swiperRef = useRef(null);
  const navigation = useNavigation();
  const { width, height } = useWindowDimensions();
  const styles = dynamicStyles(width, height);

  // Track which flows are done
  const [notifsGranted, setNotifsGranted] = useState(false);
  const [locationGranted, setLocationGranted] = useState(false);

  const slides = [
    {
      key: '1',
      title: 'Earn More by Staying Available',
      text: 'Keep your app active so you can receive nearby job requests in real time—even when the app is in the background.',
      image: 'https://i.postimg.cc/t4rgSfwZ/envio-26-1.jpg',
      bg1: '#1E90FF',
      bg2: '#00BFFF',
    },
    {
      key: '2',
      title: 'Real-Time Job Notifications',
      text: 'Your live location enables us to match you with jobs as soon as they arise. Never miss an opportunity!',
      image: 'https://i.postimg.cc/zXhWxsJN/Project-186-15-generated-1.jpg',
      bg1: '#1E90FF',
      bg2: '#00BFFF',
    },
    {
      key: '3',
      title: 'Seamless Navigation & Tracking',
      text: 'We update your location in the background to provide accurate navigation and timely job assignments.',
      image: 'https://i.postimg.cc/8zBvSLJn/vecteezy-isometric-illustration-concept-location-finder-map-5638544-1-1.jpg',
      bg1: '#1E90FF', 
      bg2: '#00BFFF',
    },
  ];

  const handleNextPress = async index => {
    // Slide 1 → just advance
    if (index === 0) {
      swiperRef.current.scrollBy(1);
      return;
    }

    // Slide 2 → request notifications
    if (index === 1 && !notifsGranted) {
      await requestNotifPermissions();
      return;
    }

    // Slide 2 but already granted → advance
    if (index === 1 && notifsGranted) {
      swiperRef.current.scrollBy(1);
      return;
    }

    // Slide 3 → request location
    if (index === 2 && !locationGranted) {
      await requestLocationPermissions();
      return;
    }

    // Slide 3 and all granted → finish
    if (index === 2 && locationGranted) {
      await finishOnboarding();
      return;
    }
  };

  const handleSkipPress = async () => {
    // If on slide 2, skip to notifications
    // If on slide 3, skip to location
    const idx = swiperRef.current.state.index;
    if (idx === 1 && !notifsGranted) {
      await requestNotifPermissions();
    } else if (idx === 2 && !locationGranted) {
      await requestLocationPermissions();
    } else {
      await finishOnboarding();
    }
  };

  const requestNotifPermissions = async () => {
    try {
      const { status } = await requestNotifications(['alert', 'sound', 'badge']);
      if (status === 'granted') {
        setNotifsGranted(true);
        swiperRef.current.scrollBy(1);
      } else {
        Alert.alert(
          'Notification Permission',
          'We need notification permission to send you job alerts.'
        );
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const requestLocationPermissions = async () => {
    try {
      // Foreground
      const fine = await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
      if (fine !== 'granted') {
        Alert.alert('Location Permission', 'Fine location permission is required.');
        return;
      }
      // Background
      const back = await request(PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION);
      if (back !== 'granted') {
        Alert.alert(
          'Background Location',
          'Background location permission is required to receive nearby jobs.'
        );
        return;
      }
      setLocationGranted(true);
      await finishOnboarding();
    } catch (e) {
      console.warn(e);
    }
  };

  const finishOnboarding = async () => {
    try {
      await EncryptedStorage.setItem('worker_onboarded', 'true');
      const pcs_token = await EncryptedStorage.getItem("pcs_token");
      if(pcs_token){
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Tabs', state: { routes: [{ name: 'Home' }] } }],
          })
        )
      }else{
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                })
              );
      }

    } catch (error) {
      console.error(error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView>
        <Swiper
          ref={swiperRef}
          loop={false}
          dotStyle={styles.dotStyle}
          activeDotStyle={styles.activeDotStyle}
          paginationStyle={styles.paginationStyle}
          showsButtons={false}
        >
          {slides.map((slide, index) => (
            <View key={slide.key} style={styles.slide}>
              <LinearGradient
                colors={[slide.bg1, slide.bg2]}
                style={styles.innerCard}
              >
                <Image
                  source={{ uri: slide.image }}
                  style={styles.image}
                  resizeMode="contain"
                />
              </LinearGradient>

              <View style={styles.onboardingContent}>
                <Text style={styles.title}>{slide.title}</Text>
                <Text style={styles.text}>{slide.text}</Text>
              </View>

              <View style={styles.buttonContainer}>
                {index < slides.length - 1 && (
                  <TouchableOpacity
                    style={[styles.button, styles.skipButton]}
                    onPress={handleSkipPress}
                  >
                    <Text style={styles.skipButtonText}>Skip</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.button, styles.nextButton]}
                  onPress={() => handleNextPress(index)}
                >
                  <Text style={styles.buttonText}>
                    {index === slides.length - 1 ? 'Get Started' : 'Next'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </Swiper>
      </ScrollView>
    </SafeAreaView>
  );
};

const dynamicStyles = (width, height) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#fff' },
    slide: { flex: 1 },
    innerCard: {
      height: '40%',
      borderBottomRightRadius: 25,
      borderBottomLeftRadius: 25,
      justifyContent: 'center',
      alignItems: 'center',
    },
    image: { width: '80%', height: '80%' },
    onboardingContent: {
      flex: 1,
      justifyContent: 'center',
      padding: width > 600 ? 40 : 25,
    },
    title: {
      fontSize: width > 600 ? 26 : 22,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 15,
      color: '#1B1D21',
    },
    text: {
      fontSize: width > 600 ? 16 : 14,
      lineHeight: width > 600 ? 28 : 22,
      textAlign: 'center',
      color: 'rgba(0, 0, 0, 0.5)',
    },
    paginationStyle: { bottom: 100 },
    dotStyle: {
      backgroundColor: '#C0C0C0',
      width: 8,
      height: 8,
      borderRadius: 4,
      marginHorizontal: 3,
    },
    activeDotStyle: {
      backgroundColor: '#000',
      width: 16,
      height: 8,
      borderRadius: 4,
      marginHorizontal: 3,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginHorizontal: 25,
      marginBottom: 20,
    },
    button: {
      borderRadius: 45,
      paddingVertical: width > 600 ? 16 : 13,
      paddingHorizontal: 25,
      alignItems: 'center',
      justifyContent: 'center',
    },
    nextButton: {
      backgroundColor: '#333',
      flex: 1,
      marginLeft: 10,
    },
    skipButton: {
      backgroundColor: '#e6e6e6',
      flex: 1,
      marginRight: 10,
    },
    buttonText: {
      color: '#fff',
      fontSize: width > 600 ? 16 : 14,
      fontWeight: 'bold',
    },
    skipButtonText: {
      color: '#333',
      fontSize: width > 600 ? 16 : 14,
      fontWeight: 'bold',
    },
  });

export default WorkerOnboardingScreen;

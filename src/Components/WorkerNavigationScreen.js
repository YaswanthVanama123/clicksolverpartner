import React, {useEffect, useState, useCallback, useRef} from 'react';
import {
  View,
  StyleSheet,
  Text,
  Alert,
  Image,
  BackHandler,
  Linking,
  Platform,
  Animated,
  PermissionsAndroid,
  TouchableOpacity,
  Easing,
  Dimensions,
  Modal,
  ScrollView,
} from 'react-native';
import Mapbox from '@rnmapbox/maps';
import EncryptedStorage from 'react-native-encrypted-storage';
import axios from 'axios';
import {
  useRoute,
  useNavigation,
  CommonActions,
  useFocusEffect,
} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import Geolocation from '@react-native-community/geolocation';

// ICONS
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import Entypo from 'react-native-vector-icons/Entypo';

// SWIPE
import SwipeButton from 'rn-swipe-button';

// For decoding the Ola Maps `overview_polyline`
import polyline from '@mapbox/polyline';

// Import the theme hook from your context
import { useTheme } from '../context/ThemeContext';

/** 
 * 1) Ola Maps API key 
 *    (replace "iN1RT7PQ41Z0DVxin6jlf7xZbmbIZPtb9CyNwtlT" with your actual API key)
 */
const OLA_MAPS_API_KEY = 'iN1RT7PQ41Z0DVxin6jlf7xZbmbIZPtb9CyNwtlT';

/**
 * 2) OPTIONAL: Mapbox access token (used ONLY to render the map background).
 *    You won't call Mapbox directions endpoints since you're using Ola Maps for routing.
 */
Mapbox.setAccessToken(
  'pk.eyJ1IjoiZnJlZWNvZGV4IiwiYSI6ImNra3FmMDkwcjBjeWYycHAxYnN6eDFneDcifQ.2T_8bDb2FzY1E7GiC0WrBg',
);

const WorkerNavigationScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();

  // Get dark mode flag
  const { isDarkMode } = useTheme();
  // Generate dynamic styles
  const styles = dynamicStyles(isDarkMode);
  const {t} = useTranslation();

  // ------------------ (A) LOADING & ROTATION STATES FOR REFRESH ICON ------------------
  const [isLoading, setIsLoading] = useState(false);
  const rotationValue = useRef(new Animated.Value(0)).current;

  const spin = rotationValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  useEffect(() => {
    let animation;
    if (isLoading) {
      rotationValue.setValue(0);
      animation = Animated.loop(
        Animated.timing(rotationValue, {
          toValue: 1,
          duration: 800,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );
      animation.start();
    } else if (animation) {
      animation.stop();
    }
    return () => {
      if (animation) animation.stop();
    };
  }, [isLoading, rotationValue]);

  // ------------------ (B) OTHER STATES ------------------
  const [cameraBounds, setCameraBounds] = useState(null);
  const [routeData, setRouteData] = useState(null); // Will hold the decoded route as GeoJSON
  const [locationDetails, setLocationDetails] = useState({
    startPoint: [80.519353, 16.987142], // [lng, lat]
    endPoint: [80.6093701, 17.1098751], // [lng, lat]
  });
  const [decodedId, setDecodedId] = useState(null);
  const [addressDetails, setAddressDetails] = useState(null);
  const [titleColor, setTitleColor] = useState('#FFFFFF');
  const [swiped, setSwiped] = useState(false);

  const [reasonModalVisible, setReasonModalVisible] = useState(false);
  const [confirmationModalVisible, setConfirmationModalVisible] = useState(false);
  const [showUpArrowService, setShowUpArrowService] = useState(false);
  const [showDownArrowService, setShowDownArrowService] = useState(false);
  const [serviceArray, setServiceArray] = useState([]);

  // ---------------------------------------------------------------------
  // 1) DECODE THE ID FROM route.params
  // ---------------------------------------------------------------------
  useEffect(() => {
    const { encodedId } = route.params;
    if (encodedId) {
      try {
        setDecodedId(atob(encodedId));
      } catch (error) {
        console.error('Error decoding Base64:', error);
      }
    }
  }, [route.params]);

  // ---------------------------------------------------------------------
  // 2) REQUEST LOCATION PERMISSION
  // ---------------------------------------------------------------------
  useEffect(() => {
    const requestLocationPermission = async () => {
      if (Platform.OS === 'android') {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
              title: 'Location Permission',
              message: 'This app needs access to your location',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            },
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            console.log('Location permission denied');
          }
        } catch (err) {
          console.warn(err);
        }
      }
    };
    requestLocationPermission();
  }, []);

  // ---------------------------------------------------------------------
  // 3) ONCE WE HAVE decodedId, DO INITIAL FETCHES
  // ---------------------------------------------------------------------
  useEffect(() => {
    if (decodedId) {
      checkCancellationStatus();
      fetchAddressDetails();
      fetchLocationDetails();
    }
  }, [decodedId]);

  // ---------------------------------------------------------------------
  // 4) ANDROID BACK BUTTON OVERRIDE
  // ---------------------------------------------------------------------
  useFocusEffect(
    useCallback(() => {
      const onBackPress = async () => {
        await EncryptedStorage.removeItem('workerInAction');
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [
              {
                name: 'Tabs',
                state: {
                  index: 0, 
                  routes: [{ name: 'Home' }],
                },
              },
            ],
          })
        );
        return true;
      };
      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => {
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
      };
    }, [navigation]),
  );

  // ---------------------------------------------------------------------
  // 5) REFRESH HANDLER (TRIGGERS RE-FETCH)
  // ---------------------------------------------------------------------
  const handleRefresh = async () => {
    if (isLoading) return;
    try {
      setIsLoading(true);
      await checkCancellationStatus();
      await fetchAddressDetails();
      await fetchLocationDetails();
    } catch (err) {
      console.error('Refresh Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------------------------------------------------------------
  // A) CHECK CANCELLATION STATUS
  // ---------------------------------------------------------------------
  const checkCancellationStatus = async () => {
    try {
      const response = await axios.get(
        `https://backend.clicksolver.com/api/worker/cancelled/status`,
        { params: { notification_id: decodedId } },
      );
      if (response.data.notificationStatus === 'usercanceled') {
        const pcs_token = await EncryptedStorage.getItem('pcs_token');
        await axios.post(
          `https://backend.clicksolver.com/api/worker/action`,
          { encodedId: '', screen: '' },
          { headers: { Authorization: `Bearer ${pcs_token}` } },
        );
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [
              {
                name: 'Tabs',
                state: {
                  index: 0, 
                  routes: [{ name: 'Home' }],
                },
              },
            ],
          })
        );
      }
    } catch (error) {
      console.error('Error checking cancellation status:', error);
    }
  };

  // ---------------------------------------------------------------------
  // PHONE CALL
  // ---------------------------------------------------------------------
  const phoneCall = async () => {
    try {
      const response = await axios.post('https://backend.clicksolver.com/api/user/call', { decodedId });
      if (response.status === 200 && response.data.mobile) {
        const phoneNumber = response.data.mobile;
        console.log('Call initiated successfully:', phoneNumber);
        const dialURL = `tel:${phoneNumber}`;
        Linking.openURL(dialURL).catch(err =>
          console.error('Error opening dialer:', err),
        );
      } else {
        console.log('Failed to initiate call:', response.data);
      }
    } catch (error) {
      console.error('Error initiating call:', error.response ? error.response.data : error.message);
    }
  };

  // ---------------------------------------------------------------------
  // B) FETCH ADDRESS DETAILS
  // ---------------------------------------------------------------------
  const fetchAddressDetails = useCallback(async () => {
    try {
      const response = await axios.get(
        `https://backend.clicksolver.com/api/user/address/details`,
        { params: { notification_id: decodedId } },
      );
      setAddressDetails(response.data);
      setServiceArray(response.data.service_booked);
    } catch (error) {
      console.error('Error fetching address details:', error);
    }
  }, [decodedId]);

  // ---------------------------------------------------------------------
  // C) FETCH LOCATION DETAILS
  // ---------------------------------------------------------------------
  const fetchLocationDetails = async () => {
    try {
      const response = await axios.post(
        `https://backend.clicksolver.com/api/service/location/navigation`,
        { notification_id: decodedId },
      );
      const { startPoint, endPoint } = response.data;
      setLocationDetails({
        startPoint: startPoint.map(coord => parseFloat(coord)), // [lng, lat]
        endPoint: endPoint.map(coord => parseFloat(coord)),     // [lng, lat]
      });
    } catch (error) {
      console.error('Error fetching location details:', error);
    }
  };

  // ---------------------------------------------------------------------
  // D) CANCEL BOOKING
  // ---------------------------------------------------------------------
  const handleCancelBooking = async () => {
    setConfirmationModalVisible(false);
    setReasonModalVisible(false);
    try {
      setIsLoading(true);
      const response = await axios.post(
        `https://backend.clicksolver.com/api/worker/work/cancel`,
        { notification_id: decodedId },
      );
      if (response.status === 200) {
        const pcs_token = await EncryptedStorage.getItem('pcs_token');
        if (!pcs_token) {
          Alert.alert('Error', 'User token not found.');
          return;
        }
        await axios.post(
          `https://backend.clicksolver.com/api/worker/action`,
          { encodedId: '', screen: '' },
          { headers: { Authorization: `Bearer ${pcs_token}` } },
        );
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [
              {
                name: 'Tabs',
                state: {
                  index: 0, 
                  routes: [{ name: 'Home' }],
                },
              },
            ],
          })
        );
      } else {
        Alert.alert('Cancellation failed', 'Your cancellation time of 2 minutes is over.');
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      Alert.alert('Error', 'There was an error processing your cancellation.');
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------------------------------------------------------------
  // E) FETCH ROUTE DATA FROM OLA MAPS (using GET)
  // ---------------------------------------------------------------------
  useEffect(() => {
    if (locationDetails.startPoint && locationDetails.endPoint) {
      const fetchOlaRoute = async () => {
        try {
          // Ola expects origin=lat,lng, but we store [lng, lat]
          const [lng1, lat1] = locationDetails.startPoint;
          const [lng2, lat2] = locationDetails.endPoint;

          console.log("startpoint ",locationDetails.startPoint)
          console.log("endpoint ",locationDetails.endPoint)

          // Use GET instead of POST:
          let url = `https://api.olamaps.io/routing/v1/directions?origin=${lat1},${lng1}&destination=${lat2},${lng2}&api_key=${OLA_MAPS_API_KEY}`;

          // Make the GET request
          const response = await axios.post(url, {}, {});

          console.log("location data",response)

          // Decode the overview_polyline
          const olaEncoded = response.data?.routes?.[0]?.overview_polyline;
          if (!olaEncoded) {
            console.error('No overview_polyline found in Ola Maps response');
            return;
          }

          // Decode polyline => array of [lat, lng], then swap to [lng, lat]
          const decodedCoords = polyline
            .decode(olaEncoded)
            .map(([lati, lngi]) => [lngi, lati]);

          // Convert to GeoJSON
          const geoJSON = {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: decodedCoords,
            },
          };
          setRouteData(geoJSON);
        } catch (error) {
          console.error('Error fetching route from Ola Maps:', error);
        }
      };
      fetchOlaRoute();
    }
  }, [locationDetails]);

  // ---------------------------------------------------------------------
  // F) WHENEVER routeData CHANGES, FIT THE MAP BOUNDS
  // ---------------------------------------------------------------------
  useEffect(() => {
    if (locationDetails && routeData && routeData.geometry?.coordinates) {
      const allCoordinates = [
        locationDetails.startPoint,
        locationDetails.endPoint,
        ...routeData.geometry.coordinates,
      ];
      const bounds = computeBoundingBox(allCoordinates);
      setCameraBounds(bounds);
    }
  }, [locationDetails, routeData]);

  const computeBoundingBox = coords => {
    let minX, minY, maxX, maxY;
    for (let [lng, lat] of coords) {
      if (minX === undefined || lng < minX) minX = lng;
      if (maxX === undefined || lng > maxX) maxX = lng;
      if (minY === undefined || lat < minY) minY = lat;
      if (maxY === undefined || lat > maxY) maxY = lat;
    }
    return { ne: [maxX, maxY], sw: [minX, minY] };
  };

  // ---------------------------------------------------------------------
  // G) SWIPE BUTTON ACTION
  // ---------------------------------------------------------------------
  const handleLocationReached = () => {
    const encodedNotificationId = btoa(decodedId);
    navigation.push('OtpVerification', { encodedId: encodedNotificationId });
  };

  // ---------------------------------------------------------------------
  // H) CANCEL / CONFIRM MODAL
  // ---------------------------------------------------------------------
  const handleCancelModal = () => setReasonModalVisible(true);
  const closeReasonModal = () => setReasonModalVisible(false);
  const openConfirmationModal = () => setConfirmationModalVisible(true);
  const closeConfirmationModal = () => setConfirmationModalVisible(false);

  // ---------------------------------------------------------------------
  // I) OPEN GOOGLE MAPS
  // ---------------------------------------------------------------------
  const openGoogleMaps = () => {
    Geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        const url = `https://www.google.com/maps/dir/?api=1&origin=${latitude},${longitude}&destination=${locationDetails.endPoint[1]},${locationDetails.endPoint[0]}&travelmode=driving`;
        Linking.openURL(url).catch(err =>
          console.error('Error opening Google Maps:', err),
        );
      },
      error => {
        console.error('Error getting current location:', error);
      },
    );
  };

  // ---------------------------------------------------------------------
  // J) RENDER MARKERS
  // ---------------------------------------------------------------------
  let markers = null;
  if (locationDetails) {
    markers = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {
            icon: 'start-point-icon',
            iconSize: 0.2,
          },
          geometry: {
            type: 'Point',
            coordinates: locationDetails.startPoint,
          },
        },
        {
          type: 'Feature',
          properties: {
            icon: 'end-point-icon',
            iconSize: 0.13,
          },
          geometry: {
            type: 'Point',
            coordinates: locationDetails.endPoint,
          },
        },
      ],
    };
  }

  // ---------------------------------------------------------------------
  // K) SCROLL ARROWS FOR SERVICES
  // ---------------------------------------------------------------------
  const handleServiceScroll = event => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const containerHeight = event.nativeEvent.layoutMeasurement.height;
    const contentHeight = event.nativeEvent.contentSize.height;
    setShowUpArrowService(offsetY > 0);
    setShowDownArrowService(offsetY + containerHeight < contentHeight);
  };

  // ---------------------------------------------------------------------
  // L) SWIPE BUTTON THUMB ICON
  // ---------------------------------------------------------------------
  const ThumbIcon = () => (
    <View style={styles.thumbContainer}>
      {swiped ? (
        <Entypo name="check" size={20} color="#ff4500" />
      ) : (
        <FontAwesome6 name="arrow-right-long" size={18} color="#ff4500" />
      )}
    </View>
  );

  const messageChatting = async () => {
    navigation.push('ChatScreen', {
      request_id: decodedId,
      senderType: 'worker',
      profileImage: addressDetails.profile,
      profileName: addressDetails.name,
    });
    
  }

  return (
    <View style={styles.container}>
      {/* MAP BOX VIEW */}
      <View style={styles.mapContainer}>
        <Mapbox.MapView style={styles.map}>
          <Mapbox.Camera
            bounds={
              cameraBounds
                ? {
                    ne: cameraBounds.ne,
                    sw: cameraBounds.sw,
                    paddingLeft: 50,
                    paddingRight: 50,
                    paddingTop: 50,
                    paddingBottom: 50,
                  }
                : null
            }
          />
          <Mapbox.Images
            images={{
              'start-point-icon': require('../../assets/start-marker.png'),
              'end-point-icon': require('../../assets/end-marker.png'),
            }}
          />
          {markers && (
            <Mapbox.ShapeSource id="markerSource" shape={markers}>
              <Mapbox.SymbolLayer
                id="markerLayer"
                style={{
                  iconImage: ['get', 'icon'],
                  iconSize: ['get', 'iconSize'],
                  iconAllowOverlap: true,
                  iconAnchor: 'bottom',
                  iconOffset: [0, -10],
                }}
              />
            </Mapbox.ShapeSource>
          )}
          {routeData && (
            <Mapbox.ShapeSource id="routeSource" shape={routeData}>
              <Mapbox.LineLayer id="routeLine" style={styles.routeLine} />
            </Mapbox.ShapeSource>
          )}
        </Mapbox.MapView>
        <TouchableOpacity
          style={styles.refreshContainer}
          onPress={handleRefresh}
          disabled={isLoading}
        >
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <MaterialIcons name="refresh" size={25} color={isDarkMode ? '#fff' : '#000'} />
          </Animated.View>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={styles.backIconContainer}
        onPress={() => {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [
                {
                  name: 'Tabs',
                  state: {
                    index: 0,
                    routes: [{ name: 'Home' }],
                  },
                },
              ],
            })
          );
        }}
      >
        <AntDesign name="arrowleft" size={24} color="#000" />
      </TouchableOpacity>
      {/* CANCEL BUTTON */}
      <TouchableOpacity style={styles.cancelButton} onPress={handleCancelModal}>
        <Text style={styles.cancelText}>{t('cancel', 'Cancel')}</Text>
      </TouchableOpacity>
      {/* GOOGLE MAPS BUTTON */}
      <TouchableOpacity style={styles.googleMapsButton} onPress={openGoogleMaps}>
        <Text style={styles.googleMapsText}>{t('google_maps', 'Google Maps')}</Text>
        <MaterialCommunityIcons name="navigation-variant" size={20} color="#C1C1C1" style={{ marginLeft: 5 }} />
      </TouchableOpacity>
      {/* REASON MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={reasonModalVisible}
        onRequestClose={closeReasonModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity onPress={closeReasonModal} style={styles.backButtonContainer}>
            <AntDesign name="arrowleft" size={20} color={isDarkMode ? '#fff' : 'black'} />
          </TouchableOpacity>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {t('cancel_reason_title', 'What is the reason for your cancellation?')}
            </Text>
            <Text style={styles.modalSubtitle}>
              {t('cancel_reason_subtitle', "Could you let us know why you're canceling?")}
            </Text>
            <TouchableOpacity style={styles.reasonButton} onPress={openConfirmationModal}>
              <Text style={styles.reasonText}>{t('reason_accidentally_clicked', 'Accidentally clicked')}</Text>
              <AntDesign name="right" size={16} color={isDarkMode ? '#fff' : '#4a4a4a'} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.reasonButton} onPress={openConfirmationModal}>
              <Text style={styles.reasonText}>{t('reason_health_issue', 'Health Issue')}</Text>
              <AntDesign name="right" size={16} color={isDarkMode ? '#fff' : '#4a4a4a'} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.reasonButton} onPress={openConfirmationModal}>
              <Text style={styles.reasonText}>{t('reason_another_work', 'Another Work get')}</Text>
              <AntDesign name="right" size={16} color={isDarkMode ? '#fff' : '#4a4a4a'} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.reasonButton} onPress={openConfirmationModal}>
              <Text style={styles.reasonText}>{t('reason_vehicle_problem', 'Problem to my vehicle')}</Text>
              <AntDesign name="right" size={16} color={isDarkMode ? '#fff' : '#4a4a4a'} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.reasonButton} onPress={openConfirmationModal}>
              <Text style={styles.reasonText}>{t('reason_others', 'Others')}</Text>
              <AntDesign name="right" size={16} color={isDarkMode ? '#fff' : '#4a4a4a'} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* CONFIRMATION MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={confirmationModalVisible}
        onRequestClose={closeConfirmationModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.crossContainer}>
            <TouchableOpacity onPress={closeConfirmationModal} style={styles.backButtonContainer}>
              <Entypo name="cross" size={20} color={isDarkMode ? '#fff' : 'black'} />
            </TouchableOpacity>
          </View>
          <View style={styles.confirmationModalContainer}>
            <Text style={styles.confirmationTitle}>
              {t('confirmation_title', 'Are you sure you want to cancel this Service?')}
            </Text>
            <Text style={styles.confirmationSubtitle}>
              {t('confirmation_subtitle', 'The user is waiting for your help to solve their issue. Please avoid clicking cancel and assist them as soon as possible')}
            </Text>
            <TouchableOpacity style={styles.confirmButton} onPress={handleCancelBooking}>
              <Text style={styles.confirmButtonText}>{t('cancel_my_service', 'Cancel my service')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* BOTTOM DETAILS CARD */}
      {addressDetails && (
        <View style={styles.detailsContainer}>
          <View style={styles.minimumChargesContainer}>
            <Text style={styles.serviceFare}>
              {t('safety', 'Safety:')}{' '}
              <Text style={styles.amount}>{t('be_quick_stay_safe', 'Be quick, stay safe!')}</Text>
            </Text>
          </View>
          <View style={styles.locationContainer}>
            <Image
              source={{ uri: 'https://i.postimg.cc/qvJw8Kzy/Screenshot-2024-11-13-170828-removebg-preview.png' }}
              style={styles.locationPinImage}
            />
            <View style={styles.locationDetails}>
              <Text style={styles.locationAddress} numberOfLines={3}>
                {addressDetails.area}
              </Text>
            </View>
          </View>
          <View style={styles.serviceDetails}>
            <View>
              <Text style={styles.serviceType}>{t('service', 'Service')}</Text>
            </View>
            <View style={styles.iconsContainer}>
              <TouchableOpacity style={styles.actionButton} onPress={phoneCall}>
                <MaterialIcons name="call" size={18} color="#FF5722" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={messageChatting}>
                <AntDesign name="message1" size={18} color="#FF5722" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={{ position: 'relative' }}>
            {showUpArrowService && (
              <View style={styles.arrowUpContainer}>
                <Entypo name="chevron-small-up" size={20} color={isDarkMode ? '#fff' : '#9e9e9e'} />
              </View>
            )}
            <ScrollView
              style={styles.servicesNamesContainer}
              contentContainerStyle={styles.servicesNamesContent}
              onScroll={handleServiceScroll}
              scrollEventThrottle={16}
            >
              {serviceArray.map((serviceItem, index) => (
                <View key={index} style={styles.serviceItem}>
                  <Text style={styles.serviceText}> { t(`singleService_${serviceItem.main_service_id}`) || serviceItem.service_tag } </Text>
                </View>
              ))}
            </ScrollView>
            {showDownArrowService && (
              <View style={styles.arrowDownContainer}>
                <Entypo name="chevron-small-down" size={20} color={isDarkMode ? '#fff' : '#9e9e9e'} />
              </View>
            )}
          </View>
          <Text style={styles.pickupText}>{t('pickup_location', 'You are at pickup location')}</Text>
          <View style={{ paddingTop: 10 }}>
            <SwipeButton
              title={t('i_have_arrived', "I've Arrived")}
              titleStyles={{ color: titleColor }}
              railBackgroundColor="#FF5722"
              railBorderColor="#FF5722"
              railStyles={{
                borderRadius: 25,
                backgroundColor: '#FF572200',
                borderColor: '#FF572200',
              }}
              thumbIconComponent={ThumbIcon}
              thumbIconBackgroundColor="#FFFFFF"
              thumbIconBorderColor="#FFFFFF"
              thumbIconWidth={50}
              thumbIconHeight={50}
              onSwipeStart={() => setTitleColor('#B0B0B0')}
              onSwipeSuccess={() => {
                handleLocationReached();
                setTitleColor('#FFFFFF');
                setSwiped(true);
              }}
              onSwipeFail={() => setTitleColor('#FFFFFF')}
            />
          </View>
        </View>
      )}
    </View>
  );

};

const bottomCardHeight = 350;
const screenHeight = Dimensions.get('window').height;

/**
 * DYNAMIC STYLES
 */
function dynamicStyles(isDarkMode) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#000' : '#fff',
    },
    mapContainer: {
      flex: 1,
    },
    map: {
      flex: 1,
    },
    routeLine: {
      lineColor: isDarkMode ? '#212121' : '#212121',
      lineWidth: 3,
    },
    refreshContainer: {
      position: 'absolute',
      top: 30,
      right: 20,
      backgroundColor: isDarkMode ? '#333' : '#ffffff',
      borderRadius: 50,
      padding: 7,
      elevation: 3,
      zIndex: 999,
    },
    backIconContainer: {
      position: 'absolute',
      top: 40,   // adjust as needed
      left: 15,  // adjust as needed
      zIndex: 999,
      padding: 8,
      backgroundColor: '#ffffff',
      borderRadius: 25,
      elevation: 3,
    },
    cancelButton: {
      position: 'absolute',
      bottom: bottomCardHeight + 5,
      left: 5,
      backgroundColor: isDarkMode ? '#333' : '#FFFFFF',
      borderRadius: 20,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 5,
      width: 80,
      height: 35,
    },
    cancelText: {
      fontSize: 13,
      color: isDarkMode ? '#fff' : '#4a4a4a',
      fontWeight: 'bold',
    },
    googleMapsButton: {
      position: 'absolute',
      bottom: bottomCardHeight + 5,
      right: 10,
      backgroundColor: isDarkMode ? '#333' : '#FFFFFF',
      borderRadius: 20,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 5,
      width: 140,
      height: 40,
      paddingHorizontal: 5,
    },
    googleMapsText: {
      fontSize: 14,
      color: isDarkMode ? '#fff' : '#212121',
      fontWeight: 'bold',
    },
    detailsContainer: {
      height: bottomCardHeight,
      backgroundColor: isDarkMode ? '#222' : '#ffffff',
      padding: 15,
      paddingHorizontal: 20,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -5 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 10,
    },
    minimumChargesContainer: {
      height: 46,
      backgroundColor: isDarkMode ? '#333' : '#f6f6f6',
      borderRadius: 32,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: 5,
    },
    serviceFare: {
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 10,
      fontSize: 16,
      color: isDarkMode ? '#ccc' : '#9e9e9e',
    },
    amount: {
      color: isDarkMode ? '#fff' : '#212121',
      fontSize: 16,
      fontWeight: 'bold',
    },
    locationContainer: {
      flexDirection: 'row',
      width: '90%',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginVertical: 10,
    },
    locationPinImage: {
      width: 20,
      height: 20,
      marginRight: 10,
    },
    locationDetails: {
      marginLeft: 10,
    },
    locationAddress: {
      fontSize: 12,
      color: isDarkMode ? '#fff' : '#212121',
      fontWeight: '500',
    },
    serviceDetails: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    serviceType: {
      fontSize: 16,
      marginTop: 10,
      color: isDarkMode ? '#ccc' : '#9e9e9e',
    },
    iconsContainer: {
      flexDirection: 'row',
      gap: 10,
    },
    servicesNamesContainer: {
      width: '70%',
      maxHeight: 65,
    },
    servicesNamesContent: {
      flexDirection: 'column',
    },
    serviceItem: {
      marginBottom: 5,
    },
    serviceText: {
      color: isDarkMode ? '#fff' : '#212121',
      fontWeight: 'bold',
      fontSize: 13,
    },
    arrowUpContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      alignItems: 'center',
      backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)',
      zIndex: 1,
    },
    arrowDownContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      alignItems: 'center',
      backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)',
      zIndex: 1,
    },
    pickupText: {
      fontSize: 16,
      color: isDarkMode ? '#fff' : '#212121',
      marginTop: 10,
    },
    actionButton: {
      backgroundColor: '#EFDCCB',
      height: 35,
      width: 35,
      borderRadius: 50,
      justifyContent: 'center',
      alignItems: 'center',
    },
    thumbContainer: {
      width: 50,
      height: 50,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'transparent',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    backButtonContainer: {
      width: 40,
      height: 40,
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDarkMode ? '#333' : 'white',
      borderRadius: 50,
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      zIndex: 1,
      marginHorizontal: 10,
      marginBottom: 5,
    },
    modalContainer: {
      backgroundColor: isDarkMode ? '#222' : 'white',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      paddingBottom: 30,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 5,
      color: isDarkMode ? '#fff' : '#000',
    },
    modalSubtitle: {
      fontSize: 14,
      color: isDarkMode ? '#ccc' : '#666',
      textAlign: 'center',
      marginBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#444' : '#eee',
      paddingBottom: 10,
    },
    reasonButton: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#444' : '#eee',
    },
    reasonText: {
      fontSize: 16,
      color: isDarkMode ? '#fff' : '#333',
    },
    crossContainer: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
    confirmationModalContainer: {
      backgroundColor: isDarkMode ? '#222' : 'white',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingTop: 40,
      paddingBottom: 30,
      paddingHorizontal: 20,
      alignItems: 'center',
    },
    confirmationTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      textAlign: 'center',
      paddingBottom: 10,
      marginBottom: 5,
      color: isDarkMode ? '#fff' : '#000',
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#444' : '#eee',
    },
    confirmationSubtitle: {
      fontSize: 14,
      color: isDarkMode ? '#ccc' : '#666',
      textAlign: 'center',
      marginBottom: 20,
      paddingBottom: 10,
      paddingTop: 10,
    },
    confirmButton: {
      backgroundColor: '#FF4500',
      borderRadius: 40,
      paddingVertical: 15,
      paddingHorizontal: 40,
      alignItems: 'center',
    },
    confirmButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: 'bold',
    },
  });
}

export default WorkerNavigationScreen;

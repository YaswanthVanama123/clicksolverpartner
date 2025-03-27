import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  BackHandler,
  ImageBackground,
  Animated,
  TouchableOpacity,
  Modal,
  Image,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  CommonActions,
  useFocusEffect,
} from '@react-navigation/native';
import EncryptedStorage from 'react-native-encrypted-storage';
import {Dropdown} from 'react-native-element-dropdown';
import axios from 'axios';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {launchCamera} from 'react-native-image-picker';

const WorkerTimer = () => {
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [prevSeconds, setPrevSeconds] = useState(0);
  const [isActive] = useState(true);
  const route = useRoute();
  const {encodedId} = route.params;
  const navigation = useNavigation();
  const [decodedId, setDecodedId] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [reasonModalVisible, setReasonModalVisible] = useState(false);
  const [confirmationModalVisible, setConfirmationModalVisible] =
    useState(false);
  const [estimatedDuration, setEstimatedDuration] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [accept, setAccept] = useState(false);
  const [imageUri, setImageUri] = useState(null);
  const [selectedReason, setSelectedReason] = useState(null);
  const [errorText, setErrorText] = useState(''); // To display error if terms are not accepted

  // Create animated values for current and previous seconds
  const animatedValue = useRef(new Animated.Value(0)).current;
  const prevAnimatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (encodedId) {
      const decoded = atob(encodedId);
      setDecodedId(decoded);
    }
  }, [encodedId]);

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{name: 'Tabs', state: {routes: [{name: 'Home'}]}}],
          }),
        );
        return true;
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [navigation]),
  );

  const confirmWorkPlace = async () => {
    if (accept) {
      // Construct the details object
      const details = {
        reason: selectedReason,
        estimatedDuration,
        image: imageUri,
        termsAccepted: accept,
      };
      console.log('Details:', details); // Log the filled details to console
      setErrorText(''); // Clear error text
      setConfirmationModalVisible(false); // Close the modal
      setReasonModalVisible(false);

      try {
        // Send the details and notification_id in the request body
        const response = await axios.post(
          `https://backend.clicksolver.com/api/add/tracking`,
          {
            notification_id: decodedId,
            details: details, // Add details here
          },
        );

        console.log('Response:', response);
        if (response.status === 200) {
          console.log('Finished');
        }
      } catch (error) {
        console.error('Error posting work shift: ', error);
      }
    } else {
      setErrorText('You need to accept the terms and conditions.'); // Set error message
    }
  };

  const uploadImage = async uri => {
    const apiKey = '287b4ba48139a6a59e75b5a8266bbea2'; // Replace with your ImgBB API key
    const apiUrl = 'https://api.imgbb.com/1/upload';

    const formData = new FormData();
    formData.append('key', apiKey);
    formData.append('image', {
      uri,
      type: 'image/jpeg',
      name: 'photo.jpg',
    });

    try {
      const response = await axios.post(apiUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 200) {
        return response.data.data.url;
      } else {
        throw new Error(`Upload failed with status ${response.status}`);
      }
    } catch (error) {
      console.error('Image upload failed:', error.message);
      throw error;
    }
  };

  const handleUploadImage = () => {
    const options = {
      mediaType: 'photo',
      saveToPhotos: true,
      cameraType: 'back',
    };

    launchCamera(options, async response => {
      if (response.didCancel) {
        console.log('User cancelled camera picker');
      } else if (response.errorCode) {
        console.error('Camera error: ', response.errorCode);
      } else if (response.assets && response.assets.length > 0) {
        const uri = response.assets[0].uri;

        try {
          const uploadedUrl = await uploadImage(uri);
          console.log('Image', uploadedUrl);
          setImageUri(uploadedUrl);
        } catch (error) {
          console.error('Image upload failed:', error);
        }
      }
    });
  };

  const workPlaceShift = () => {
    setReasonModalVisible(true); // Open reason modal when "Work in my place" is clicked
  };

  const closeReasonModal = () => {
    setReasonModalVisible(false);
  };

  const openConfirmationModal = reason => {
    setSelectedReason(reason); // Update selected reason
    setConfirmationModalVisible(true);
    console.log('Selected Reason:', reason); // Log selected reason to console
  };

  const closeConfirmationModal = () => {
    setConfirmationModalVisible(false);
  };

  const durationOptions = [
    {label: '1 day', value: '1'},
    {label: '2 days', value: '2'},
    {label: '3 days', value: '3'},
    {label: '4 days', value: '4'},
  ];

  const differenceTime = startTimeString => {
    const startTime = new Date(startTimeString);
    const currentTime = new Date();
    const diffInMs = currentTime - startTime;
    const totalSeconds = Math.floor(diffInMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return {hours, minutes, seconds};
  };

  const handleAcceptCheck = () => {
    setAccept(!accept);
    setErrorText('');
  };

  const handleAddressSelection = address => {
    setSelectedAddress(address);
  };

  useEffect(() => {
    const startTiming = async () => {
      if (decodedId) {
        try {
          const storedStartTime = await EncryptedStorage.getItem(
            'start_work_time',
          );
          let startTimeData = storedStartTime
            ? JSON.parse(storedStartTime)
            : [];
          const matchingIndex = startTimeData.findIndex(
            entry => entry.encoded_id === encodedId,
          );

          let workedTime;

          if (matchingIndex !== -1) {
            workedTime = startTimeData[matchingIndex].worked_time;
          } else {
            const response = await axios.post(
              `https://backend.clicksolver.com/api/work/time/started`,
              {
                notification_id: decodedId,
              },
            );
            workedTime = response.data.worked_time;
            startTimeData.push({
              encoded_id: encodedId,
              worked_time: workedTime,
            });
            await EncryptedStorage.setItem(
              'start_work_time',
              JSON.stringify(startTimeData),
            );
          }

          const {hours, minutes, seconds} = differenceTime(workedTime);
          setHours(hours);
          setMinutes(minutes);
          setSeconds(seconds);
          setPrevSeconds(seconds);
          setStartTime(workedTime);
        } catch (error) {
          console.error('Error starting timing:', error);
        }
      }
    };

    startTiming();
  }, [decodedId, encodedId]);

  useEffect(() => {
    let interval = null;
    if (isActive) {
      interval = setInterval(() => {
        setSeconds(prevSeconds => {
          setPrevSeconds(prevSeconds);
          const newSeconds = prevSeconds + 1 === 60 ? 0 : prevSeconds + 1;
          if (newSeconds === 0) {
            setMinutes(prevMinutes => prevMinutes + 1);
          }
          return newSeconds;
        });

        Animated.parallel([
          Animated.timing(prevAnimatedValue, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          prevAnimatedValue.setValue(0);
          animatedValue.setValue(0);
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, prevAnimatedValue, animatedValue]);

  useEffect(() => {
    if (minutes === 60) {
      setHours(prevHours => prevHours + 1);
      setMinutes(0);
    }
  }, [minutes]);

  // Animate the current and previous seconds
  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-30, 0],
  });

  const prevTranslateY = prevAnimatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 30],
  });

  return (
    <ImageBackground
      source={{
        uri: 'https://i.postimg.cc/rFFQLGRh/Picsart-24-10-01-15-38-43-205.jpg',
      }}
      style={styles.container}
      resizeMode="stretch">
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Time Tracking</Text>
      </View>
      <View style={styles.timeContainer}>
        <View style={styles.timeBoxes}>
          <TimeBox label="Hours" value={hours} />
          <TimeBox label="Minutes" value={minutes} />
          <View style={styles.timeBox}>
            <Text style={styles.timeLabel}>Seconds</Text>
            <Animated.Text
              style={[styles.timeValue, {transform: [{translateY}]}]}>
              {seconds.toString().padStart(2, '0')}
            </Animated.Text>
            <Animated.Text
              style={[
                styles.timeValue,
                {
                  position: 'absolute',
                  top: 40,
                  transform: [{translateY: prevTranslateY}],
                },
              ]}>
              {prevSeconds.toString().padStart(2, '0')}
            </Animated.Text>
          </View>
        </View>
      </View>
      <View style={styles.chargeInfo}>
        <Text style={styles.mainText}>The minimum charge is 149₹</Text>
        <Text style={styles.subText}>The minimum charge is 30 minutes</Text>
        <Text style={styles.subText}>
          Next Every half hour, you will be charged for 49₹
        </Text>
      </View>
      <View>
        <TouchableOpacity
          style={styles.workPlaceButton}
          onPress={workPlaceShift}>
          <Text style={styles.workPlaceButtonText}>Work in my place</Text>
        </TouchableOpacity>
      </View>

      {/* Reason Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={reasonModalVisible}
        onRequestClose={closeReasonModal}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            onPress={closeReasonModal}
            style={styles.backButtonContainer}>
            <AntDesign name="arrowleft" size={24} color="black" />
          </TouchableOpacity>

          <View style={styles.modalContainer}>
            <View style={styles.heading}>
              <Text style={styles.modalTitle}>
                What is the reason for taking this repair off-site?
              </Text>
              {/* <Text style={styles.modalSubtitle}>
              Could you let us know why you need to take this repair to your
              place?
            </Text> */}
            </View>

            <TouchableOpacity
              style={styles.reasonButton}
              onPress={() =>
                openConfirmationModal('Specialized Equipment Needed')
              }>
              <Text style={styles.reasonText}>
                Specialized Equipment Needed
              </Text>
              <AntDesign name="right" size={16} color="#4a4a4a" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.reasonButton}
              onPress={() => openConfirmationModal('Complex Repair')}>
              <Text style={styles.reasonText}>Complex Repair</Text>
              <AntDesign name="right" size={16} color="#4a4a4a" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.reasonButton}
              onPress={() => openConfirmationModal('Part Replacement')}>
              <Text style={styles.reasonText}>Part Replacement</Text>
              <AntDesign name="right" size={16} color="#4a4a4a" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.reasonButton}
              onPress={() =>
                openConfirmationModal('More time or detailed analysis')
              }>
              <Text style={styles.reasonText}>
                More time or detailed analysis
              </Text>
              <AntDesign name="right" size={16} color="#4a4a4a" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.reasonButton}
              onPress={() => openConfirmationModal('Others')}>
              <Text style={styles.reasonText}>Others</Text>
              <AntDesign name="right" size={16} color="#4a4a4a" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={confirmationModalVisible}
        onRequestClose={closeConfirmationModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.crossContainer}>
            <TouchableOpacity
              onPress={closeConfirmationModal}
              style={styles.backButtonContainer}>
              <AntDesign name="close" size={24} color="black" />
            </TouchableOpacity>
          </View>
          <View style={styles.confirmationModalContainer}>
            <Text style={styles.confirmationTitle}>
              Are you sure you want to take this repair to your place?
            </Text>
            <View style={styles.horizantalLine} />
            {/* Estimated Duration Dropdown */}
            <Text style={styles.fieldLabel}>Estimated Duration</Text>
            <Dropdown
              style={styles.dropdown}
              data={durationOptions}
              placeholderStyle={styles.placeholderStyle}
              selectedTextStyle={styles.selectedTextStyle}
              itemTextStyle={styles.itemTextStyle}
              labelField="label"
              valueField="value"
              placeholder="Select days"
              value={estimatedDuration}
              onChange={item => setEstimatedDuration(item.value)}
            />

            {/* Image Upload */}
            <Text style={styles.fieldLabel}>
              Upload the pic you are repairing in your place
            </Text>

            <View style={styles.uploadContainer}>
              <View style={styles.imageContainer}>
                <Image
                  key={imageUri}
                  source={{uri: imageUri}}
                  style={{width: 70, height: 70, borderRadius: 2}}
                />
              </View>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={handleUploadImage}>
                <Text style={styles.uploadButtonText}>Upload</Text>
              </TouchableOpacity>
            </View>
            {/* Address Selection with Icons */}
            <Text style={styles.fieldLabel}>Service location</Text>
            <View style={styles.addressContainer}>
              <View style={styles.locationContainer}>
                <Image
                  style={styles.locationIcon}
                  source={{
                    uri: 'https://i.postimg.cc/rpb2czKR/1000051859-removebg-preview.png',
                  }} // Pin icon
                />
                <Text style={styles.locationText}>
                  9-141, Valturu Koppaka Rd, Sri Ram Nagar
                </Text>
              </View>
            </View>

            {/* Confirm Button */}
            <Text style={styles.errorText}>{errorText}</Text>
            <TouchableOpacity
              style={styles.acceptTerm}
              onPress={handleAcceptCheck}>
              <MaterialIcons
                name={accept ? 'check-box' : 'check-box-outline-blank'}
                size={20}
                color={accept ? '#ff4500' : '#212121'}
              />
              <Text style={styles.addressText}>Accept the terms & policy</Text>
            </TouchableOpacity>

            <View style={styles.confirmButtonContainer}>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={confirmWorkPlace}>
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
};

const TimeBox = ({label, value}) => (
  <View style={styles.timeBox}>
    <Text style={styles.timeLabel}>{label}</Text>
    <Text style={styles.timeValue}>{value.toString().padStart(2, '0')}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeContainer: {
    backgroundColor: '#f6f6f6',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    width: 250,
    height: 110,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#000',
  },
  timeBoxes: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  timeBox: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 10,
  },
  timeValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#212121',
    lineHeight: 41,
  },
  timeLabel: {
    fontSize: 16,
    color: '#212121',
    fontWeight: '600',
  },
  chargeInfo: {
    marginTop: '40%',
    backgroundColor: '#f6f6f6',
    height: 170,
    padding: 20,
  },
  mainText: {
    fontSize: 21,
    paddingBottom: 20,
    fontWeight: 'bold',
    color: '#212121',
  },
  subText: {
    fontSize: 16,
    color: '#9e9e9e',
  },
  workPlaceButton: {
    backgroundColor: '#ff4500',
    padding: 10,
    borderRadius: 10,
    marginTop: 20,
  },
  errorText: {
    color: '#FF4500',
  },
  crossContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  workPlaceButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  locationContainer: {
    flexDirection: 'row',
    width: '90%',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 5,
    marginBottom: 20,
  },
  locationIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  locationText: {
    fontSize: 14,
    color: '#212121',
  },
  itemTextStyle: {
    fontSize: 16,
    color: '#212121',
    fontWeight: '500',
  },
  placeholderStyle: {
    color: '#212121',
  },
  selectedTextStyle: {
    color: '#212121',
  },
  uploadContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  imageContainer: {
    width: 70,
    height: 70,
    borderWidth: 1,
    borderColor: '#D3D3D3',
    marginVertical: 10,
    borderRadius: 5,
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
    justifyContent: 'center', // Distance from the left side of the screen
    backgroundColor: 'white', // Background color for the circular container
    borderRadius: 50, // Rounds the container to make it circular
    // Padding to make the icon container larger
    elevation: 5, // Elevation for shadow effect (Android)
    shadowColor: '#000', // Shadow color (iOS)
    shadowOffset: {width: 0, height: 2}, // Shadow offset (iOS)
    shadowOpacity: 0.2, // Shadow opacity (iOS)
    shadowRadius: 4, // Shadow radius (iOS)
    zIndex: 1,
    marginHorizontal: 10, // Ensures the icon is above other elements,
    marginBottom: 5,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
    color: '#000',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  reasonButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  heading: {},
  reasonText: {
    fontSize: 16,
    color: '#333',
  },
  closeButtonContainer: {
    position: 'absolute',
    top: 20,
    right: 15,
    backgroundColor: 'white',
    borderRadius: 50,
    padding: 10,
    elevation: 5,
    zIndex: 1,
  },

  confirmationModalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  confirmationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#000',
  },
  horizantalLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  fieldLabel: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  dropdown: {
    width: '80%',
    padding: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginTop: 5,
    backgroundColor: '#FFFFFF',
  },
  uploadButton: {
    borderColor: '#FF4500',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    flexDirection: 'row',
    borderRadius: 5,
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 30,
  },
  uploadButtonText: {
    color: '#212121',
    fontSize: 13,
  },
  addressContainer: {
    width: '100%',
  },
  addressOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  addressText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  acceptTerm: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  confirmButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  confirmButton: {
    backgroundColor: '#FF4500',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    width: 120,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
  },
});

export default WorkerTimer;

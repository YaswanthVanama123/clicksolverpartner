import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
  BackHandler,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { RadioButton } from 'react-native-paper';
import axios from 'axios';
import {
  useNavigation,
  useRoute,
  CommonActions,
  useFocusEffect,
} from '@react-navigation/native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { launchCamera } from 'react-native-image-picker';
import { Dropdown } from 'react-native-element-dropdown';
import SwipeButton from 'rn-swipe-button';
import Entypo from 'react-native-vector-icons/Entypo';

// Import theme hook
import { useTheme } from '../context/ThemeContext';

const ServiceInProgressScreen = () => {
  // State variables
  const [decodedId, setDecodedId] = useState(null);
  const [services, setServices] = useState([]);
  const [area, setArea] = useState('');
  const [createdAt, setCreatedAt] = useState('');
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [editingSelectedStatus, setEditingSelectedStatus] = useState('');
  const [reasonModalVisible, setReasonModalVisible] = useState(false);
  const [confirmationModalVisible, setConfirmationModalVisible] = useState(false);
  const [estimatedDuration, setEstimatedDuration] = useState(null);
  const [selectedReason, setSelectedReason] = useState(null);
  const [imageUri, setImageUri] = useState(null);
  const [accept, setAccept] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [titleColor, setTitleColor] = useState('#FFFFFF');
  const [swiped, setSwiped] = useState(false);

  // Status mappings
  const statuses = ['In Progress', 'Work started', 'Work Completed'];
  const statusKeys = ['accept', 'arrived', 'workCompleted'];
  const statusDisplayNames = {
    accept: 'In Progress',
    arrived: 'Work started',
    workCompleted: 'Work Completed',
  };

  // Navigation and route
  const route = useRoute();
  const navigation = useNavigation();
  const { encodedId } = route.params;

  // Get current theme mode from our Theme Context
  const { isDarkMode } = useTheme();
  // Generate dynamic styles
  const styles = dynamicStyles(isDarkMode);

  useEffect(() => {
    if (encodedId) {
      try {
        setDecodedId(atob(encodedId));
      } catch (error) {
        console.error('Error decoding Base64:', error);
      }
    }
  }, [encodedId]);

  // Fetch bookings details
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await axios.post(
          `https://backend.clicksolver.com/api/worker/work/progress/details`,
          { decodedId }
        );
        const data = response.data[0];
        console.log('Fetched Data:', data);

        // Map service_booked and service_status to services
        const mappedServices = data.service_booked.map(serviceBookedItem => {
          const serviceStatusItem = data.service_status.find(
            statusItem =>
              statusItem.serviceName.trim().toLowerCase() ===
              serviceBookedItem.serviceName.trim().toLowerCase()
          );
          if (!serviceStatusItem) {
            console.warn(
              `No status found for service: ${serviceBookedItem.serviceName}`
            );
          }
          return {
            id: serviceBookedItem.main_service_id,
            name: serviceBookedItem.serviceName,
            quantity: serviceBookedItem.quantity,
            image:
              serviceBookedItem.url ||
              'https://i.postimg.cc/6Tsbn3S6/Image-8.png',
            status: {
              accept: serviceStatusItem ? serviceStatusItem.accept || null : null,
              arrived: serviceStatusItem ? serviceStatusItem.arrived || null : null,
              workCompleted: serviceStatusItem ? serviceStatusItem.workCompleted || null : null,
            },
          };
        });
        setServices(mappedServices);
        setArea(data.area);
        setCreatedAt(data.created_at);
      } catch (error) {
        console.error('Error fetching bookings data:', error);
      }
    };

    if (decodedId) {
      fetchBookings();
    }
  }, [decodedId]);

  // Generate timeline data for a service
  const generateTimelineData = status => {
    return statusKeys.map(statusKey => ({
      key: statusKey,
      title: statusDisplayNames[statusKey],
      statusValue: status[statusKey] || null,
      iconColor: status[statusKey] ? '#ff4500' : '#a1a1a1',
      lineColor: status[statusKey] ? '#ff4500' : '#a1a1a1',
      isSelectable: !status[statusKey],
    }));
  };

  // Get current status from service status object
  const getCurrentStatus = status => {
    for (let i = statusKeys.length - 1; i >= 0; i--) {
      if (status[statusKeys[i]] && status[statusKeys[i]] !== null) {
        return statusKeys[i];
      }
    }
    return 'pending';
  };

  // Handle service completion
  const handleServiceCompletion = async () => {
    try {
      await axios.post(`https://backend.clicksolver.com/api/worker/update/status`, {
        decodedId,
        statusKey: 'workCompleted',
        newStatusValue: statusDisplayNames['workCompleted'],
      });
      setServices(prevServices =>
        prevServices.map(service => {
          if (service.id === editingServiceId) {
            const updatedStatus = { ...service.status };
            updatedStatus.workCompleted = statusDisplayNames['workCompleted'];
            return { ...service, status: updatedStatus };
          }
          return service;
        })
      );
      Alert.alert('Service Completed', 'You have marked the service as completed.');
    } catch (error) {
      console.error('Error updating service completion:', error);
      Alert.alert('Error', 'Failed to update service completion.');
    }
  };

  // Edit button press handler
  const handleEditPress = serviceId => {
    if (editingServiceId === serviceId) {
      setEditingServiceId(null);
    } else {
      setEditingServiceId(serviceId);
    }
  };

  // Handle status change confirmation
  const handleStatusChange = (serviceId, statusKey) => {
    const statusName = statusDisplayNames[statusKey];
    Alert.alert(
      'Confirm Status Change',
      `Are you sure you want to change the status to "${statusName}"?`,
      [
        { text: 'No', onPress: () => {}, style: 'cancel' },
        { text: 'Yes', onPress: () => applyStatusChange(serviceId, statusKey) },
      ]
    );
  };

  // Apply status change
  const applyStatusChange = async (serviceId, statusKey) => {
    const selectedStatusIndex = statusKeys.indexOf(statusKey);
    const currentTime = new Date().toISOString();
    const service = services.find(service => service.id === serviceId);
    const serviceName = service.name;
    console.log(serviceName, statusKey, currentTime, decodedId);
    try {
      const response = await axios.post(
        `https://backend.clicksolver.com/api/worker/working/status/updated`,
        { serviceName, statusKey, currentTime, decodedId }
      );
      if (response.status === 200) {
        setEditingServiceId(null);
        setServices(prevServices =>
          prevServices.map(service => {
            if (service.id === serviceId) {
              const updatedStatus = { ...service.status };
              for (let i = 0; i <= selectedStatusIndex; i++) {
                const key = statusKeys[i];
                if (!updatedStatus[key]) {
                  updatedStatus[key] = currentTime;
                }
              }
              return { ...service, status: updatedStatus };
            }
            return service;
          })
        );
      }
      console.log('Response:', response.data);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  // Modal functions
  const workPlaceShift = () => {
    setReasonModalVisible(true);
  };

  const closeReasonModal = () => {
    setReasonModalVisible(false);
  };

  const openConfirmationModal = reason => {
    setSelectedReason(reason);
    setConfirmationModalVisible(true);
    console.log('Selected Reason:', reason);
  };

  const closeConfirmationModal = () => {
    setConfirmationModalVisible(false);
  };

  // Image upload functions
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

  const uploadImage = async uri => {
    const apiKey = '287b4ba48139a6a59e75b5a8266bbea2';
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
        headers: { 'Content-Type': 'multipart/form-data' },
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

  const handleAcceptCheck = () => {
    setAccept(!accept);
    setErrorText('');
  };

  const formatTime = isoTimestamp => {
    const date = new Date(isoTimestamp);
    const options = { month: 'short', day: '2-digit', year: 'numeric' };
    const formattedDate = date.toLocaleDateString('en-US', options);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${formattedDate} at ${hours}:${minutes}`;
  };

  const confirmWorkPlace = async () => {
    if (accept) {
      const details = {
        reason: selectedReason,
        estimatedDuration,
        image: imageUri,
        termsAccepted: accept,
      };
      console.log('Details:', details);
      setErrorText('');
      setConfirmationModalVisible(false);
      setReasonModalVisible(false);
      try {
        const response = await axios.post(
          `https://backend.clicksolver.com/api/add/tracking`,
          { notification_id: decodedId, details }
        );
        console.log('Response:', response);
        if (response.status === 201) {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'Tabs', state: { routes: [{ name: 'Home' }] } }],
            })
          );
        }
      } catch (error) {
        console.error('Error posting work shift: ', error);
      }
    } else {
      setErrorText('You need to accept the terms and conditions.');
    }
  };

  const durationOptions = [
    { label: '1 day', value: '1' },
    { label: '2 days', value: '2' },
    { label: '3 days', value: '3' },
    { label: '4 days', value: '4' },
  ];

  // Memoized thumb icon for swipe button
  const ThumbIcon = useMemo(
    () => () => (
      <View style={styles.thumbContainer}>
        <Text>
          {swiped ? (
            <Entypo name="check" size={20} color="#ff4500" style={styles.checkIcon} />
          ) : (
            <FontAwesome6 name="arrow-right-long" size={15} color="#ff4500" />
          )}
        </Text>
      </View>
    ),
    [swiped]
  );

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Tabs', state: { routes: [{ name: 'Home' }] } }],
          })
        );
        return true;
      };
      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [navigation])
  );

  return (
    <View style={styles.mainContainer}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <FontAwesome6
          name="arrow-left-long"
          size={20}
          color={isDarkMode ? '#ffffff' : '#212121'}
          style={styles.leftIcon}
          onPress={() => {
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'Tabs', state: { routes: [{ name: 'Home' }] } }],
              })
            );
          }}
        />
        <Text style={styles.headerText}>Service In Progress</Text>
      </View>

      <ScrollView style={styles.container}>
        {/* Service Details */}
        <View style={styles.serviceDetailsContainer}>
          <View style={styles.serviceDetailsHeaderContainer}>
            <Text style={styles.serviceDetailsTitle}>Service Details</Text>
            <TouchableOpacity>
              <Icon name="keyboard-arrow-right" size={24} color="#ff4500" />
            </TouchableOpacity>
          </View>
          <View style={styles.iconDetailsContainer}>
            <View style={styles.detailsRow}>
              <Icon name="calendar-today" size={20} color="#ff4500" />
              <Text style={styles.detailText}>
                Work started{' '}
                <Text style={styles.highLightText}>
                  {new Date(createdAt).toLocaleString()}
                </Text>
              </Text>
            </View>
            <View style={styles.detailsRow}>
              <Icon name="location-on" size={20} color="#ff4500" />
              <Text style={styles.detailText}>
                Location: <Text style={styles.highLightText}>{area}</Text>
              </Text>
            </View>
          </View>
          <View style={{ marginTop: 20 }}>
            {services.map(service => {
              const timelineData = generateTimelineData(service.status);
              const currentStatus = getCurrentStatus(service.status);
              return (
                <View style={styles.ServiceCardsContainer} key={service.id}>
                  <View style={styles.technicianContainer}>
                    <Image source={{ uri: service.image }} style={styles.technicianImage} />
                    <View style={styles.technicianDetails}>
                      <Text style={styles.technicianName}>{service.name}</Text>
                      <Text style={styles.technicianTitle}>Quantity: {service.quantity}</Text>
                    </View>
                  </View>
                  <Text style={styles.statusText}>
                    Service Status:{' '}
                    <Text style={styles.highLightText}>
                      {statusDisplayNames[currentStatus] || 'Pending'}
                    </Text>
                  </Text>
                  <Text style={styles.statusText}>
                    Estimated Completion:{' '}
                    <Text style={styles.highLightText}>2 hours</Text>
                  </Text>
                  {/* Timeline Section */}
                  <View style={styles.sectionContainer}>
                    <View style={styles.serviceTimeLineContainer}>
                      <Text style={styles.sectionTitle}>Service Timeline</Text>
                      {currentStatus !== 'workCompleted' && (
                        <TouchableOpacity onPress={() => handleEditPress(service.id)}>
                          <Text style={styles.editText}>
                            {editingServiceId === service.id ? 'Cancel' : 'Edit'}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <View style={styles.innerContainerLine}>
                      {timelineData.map((item, index) => (
                        <View key={item.key} style={styles.timelineItem}>
                          <View style={styles.iconAndLineContainer}>
                            <MaterialCommunityIcons
                              name="circle"
                              size={14}
                              color={item.iconColor}
                            />
                            {index !== timelineData.length - 1 && (
                              <View
                                style={[
                                  styles.lineSegment,
                                  { backgroundColor: timelineData[index + 1].iconColor },
                                ]}
                              />
                            )}
                          </View>
                          <View style={styles.timelineContent}>
                            <View style={styles.timelineTextContainer}>
                              <Text style={styles.timelineText}>{item.title}</Text>
                              <Text style={styles.timelineTime}>
                                {item.statusValue || 'Pending'}
                              </Text>
                            </View>
                            {editingServiceId === service.id && !item.statusValue && (
                              <RadioButton
                                value={item.key}
                                status={
                                  editingSelectedStatus === item.key ? 'checked' : 'unchecked'
                                }
                                onPress={() => {
                                  setEditingSelectedStatus(item.key);
                                  handleStatusChange(service.id, item.key);
                                }}
                                color="#ff4500"
                              />
                            )}
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Work in my place Button */}
        <View style={styles.swipeButton}>
          <SwipeButton
            title="Work in my place"
            titleStyles={{ color: titleColor, fontSize: 16, fontWeight: '500' }}
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
            thumbIconStyles={{ height: 30, width: 30, borderRadius: 20 }}
            onSwipeStart={() => setTitleColor('#B0B0B0')}
            onSwipeSuccess={() => {
              workPlaceShift();
              setTitleColor('#FFFFFF');
              setSwiped(true);
            }}
            onSwipeFail={() => setTitleColor('#FFFFFF')}
          />
        </View>
      </ScrollView>

      {/* Reason Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={reasonModalVisible}
        onRequestClose={closeReasonModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity onPress={closeReasonModal} style={styles.backButtonContainer}>
            <AntDesign name="arrowleft" size={24} color={isDarkMode ? '#ffffff' : 'black'} />
          </TouchableOpacity>
          <View style={styles.modalContainer}>
            <View style={styles.heading}>
              <Text style={styles.modalTitle}>
                What is the reason for taking this repair off-site?
              </Text>
            </View>
            <TouchableOpacity
              style={styles.reasonButton}
              onPress={() => openConfirmationModal('Specialized Equipment Needed')}
            >
              <Text style={styles.reasonText}>Specialized Equipment Needed</Text>
              <AntDesign name="right" size={16} color="#4a4a4a" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.reasonButton}
              onPress={() => openConfirmationModal('Complex Repair')}
            >
              <Text style={styles.reasonText}>Complex Repair</Text>
              <AntDesign name="right" size={16} color="#4a4a4a" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.reasonButton}
              onPress={() => openConfirmationModal('Part Replacement')}
            >
              <Text style={styles.reasonText}>Part Replacement</Text>
              <AntDesign name="right" size={16} color="#4a4a4a" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.reasonButton}
              onPress={() => openConfirmationModal('More time or detailed analysis')}
            >
              <Text style={styles.reasonText}>More time or detailed analysis</Text>
              <AntDesign name="right" size={16} color="#4a4a4a" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.reasonButton}
              onPress={() => openConfirmationModal('Others')}
            >
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
        onRequestClose={closeConfirmationModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.crossContainer}>
            <TouchableOpacity onPress={closeConfirmationModal} style={styles.backButtonContainer}>
              <AntDesign name="close" size={24} color={isDarkMode ? '#ffffff' : 'black'} />
            </TouchableOpacity>
          </View>
          <View style={styles.confirmationModalContainer}>
            <Text style={styles.confirmationTitle}>
              Are you sure you want to take this repair to your place?
            </Text>
            <View style={styles.horizantalLine} />
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
            <Text style={styles.fieldLabel}>
              Upload the pic you are repairing in your place
            </Text>
            <View style={styles.uploadContainer}>
              <View style={styles.imageContainer}>
                {imageUri && (
                  <Image
                    key={imageUri}
                    source={{ uri: imageUri }}
                    style={{ width: 70, height: 70, borderRadius: 2 }}
                  />
                )}
              </View>
              <TouchableOpacity style={styles.uploadButton} onPress={handleUploadImage}>
                <Text style={styles.uploadButtonText}>Upload</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.fieldLabel}>Service location</Text>
            <View style={styles.addressContainer}>
              <View style={styles.locationContainer}>
                <Image
                  style={styles.locationIcon}
                  source={{
                    uri: 'https://i.postimg.cc/qvJw8Kzy/Screenshot-2024-11-13-170828-removebg-preview.png',
                  }}
                />
                <Text style={styles.locationText}>{area}</Text>
              </View>
            </View>
            <Text style={styles.errorText}>{errorText}</Text>
            <TouchableOpacity style={styles.acceptTerm} onPress={handleAcceptCheck}>
              <MaterialIcons
                name={accept ? 'check-box' : 'check-box-outline-blank'}
                size={20}
                color={accept ? '#ff4500' : '#212121'}
              />
              <Text style={styles.addressText}>Accept the terms & policy</Text>
            </TouchableOpacity>
            <View style={styles.confirmButtonContainer}>
              <TouchableOpacity style={styles.confirmButton} onPress={confirmWorkPlace}>
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    mainContainer: {
      flex: 1,
      backgroundColor: isDarkMode ? '#000000' : '#ffffff',
    },
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#000000' : '#ffffff',
    },
    serviceDetailsHeaderContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    serviceDetailsTitle: {
      color: isDarkMode ? '#ffffff' : '#212121',
      fontWeight: 'bold',
      fontSize: 17,
    },
    headerContainer: {
      backgroundColor: isDarkMode ? '#121212' : '#ffffff',
      paddingVertical: 15,
      paddingHorizontal: 20,
      alignItems: 'center',
      elevation: 1,
      shadowRadius: 4,
      zIndex: 1,
    },
    leftIcon: {
      position: 'absolute',
      top: 15,
      left: 10,
    },
    headerText: {
      color: isDarkMode ? '#ffffff' : '#212121',
      fontSize: 18,
      fontWeight: 'bold',
    },
    sectionContainer: {
      marginBottom: 16,
      paddingLeft: 16,
      paddingRight: 16,
      width: '95%',
      marginTop: 10,
    },
    serviceTimeLineContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: isDarkMode ? '#ffffff' : '#212121',
    },
    editText: {
      color: '#ff5700',
      fontSize: 15,
      fontWeight: '500',
    },
    innerContainerLine: {
      marginTop: 5,
    },
    timelineItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    iconAndLineContainer: {
      alignItems: 'center',
      width: 20,
    },
    lineSegment: {
      width: 2,
      height: 35,
      marginTop: 2,
    },
    timelineContent: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      justifyContent: 'space-between',
      marginLeft: 10,
    },
    timelineTextContainer: {
      flex: 1,
    },
    timelineText: {
      fontSize: 14,
      color: isDarkMode ? '#ffffff' : '#212121',
      fontWeight: 'bold',
    },
    timelineTime: {
      fontSize: 12,
      color: isDarkMode ? '#bbbbbb' : '#4a4a4a',
    },
    button: {
      backgroundColor: '#ff4500',
      paddingVertical: 12,
      marginHorizontal: 20,
      borderRadius: 25,
      alignItems: 'center',
      marginTop: 10,
      marginBottom: 30,
    },
    buttonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
    },
    serviceDetailsContainer: {
      backgroundColor: isDarkMode ? '#222222' : '#f9f9f9',
      flex: 1,
      padding: 20,
      marginTop: 20,
      marginBottom: 20,
      marginHorizontal: 20,
      borderRadius: 10,
    },
    detailsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 5,
    },
    detailText: {
      marginLeft: 10,
      color: isDarkMode ? '#cccccc' : '#4a4a4a',
      fontSize: 14,
    },
    highLightText: {
      fontWeight: 'bold',
      color: isDarkMode ? '#ffffff' : '#212121',
    },
    ServiceCardsContainer: {
      flexDirection: 'column',
      marginVertical: 10,
      backgroundColor: isDarkMode ? '#333333' : '#f9f9f9',
      padding: 15,
      borderRadius: 10,
    },
    technicianContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    technicianImage: {
      width: 50,
      height: 50,
      borderRadius: 25,
    },
    technicianDetails: {
      marginLeft: 15,
      flex: 1,
    },
    technicianName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: isDarkMode ? '#ffffff' : '#212121',
    },
    technicianTitle: {
      color: isDarkMode ? '#bbbbbb' : '#4a4a4a',
      fontSize: 14,
    },
    statusText: {
      fontSize: 14,
      color: isDarkMode ? '#ffffff' : '#212121',
      marginBottom: 5,
    },
    workPlaceButton: {
      backgroundColor: '#ff4500',
      paddingVertical: 12,
      marginHorizontal: 20,
      borderRadius: 25,
      alignItems: 'center',
      marginTop: 10,
    },
    workPlaceButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
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
      backgroundColor: isDarkMode ? '#333333' : '#FFFFFF',
      borderRadius: 50,
      elevation: 5,
      zIndex: 1,
      marginHorizontal: 10,
      marginBottom: 5,
    },
    modalContainer: {
      backgroundColor: isDarkMode ? '#333333' : '#ffffff',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      paddingBottom: 30,
    },
    heading: {},
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 5,
      color: isDarkMode ? '#ffffff' : '#000000',
    },
    reasonButton: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#555555' : '#eeeeee',
    },
    reasonText: {
      fontSize: 16,
      color: isDarkMode ? '#ffffff' : '#333333',
    },
    crossContainer: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
    confirmationModalContainer: {
      backgroundColor: isDarkMode ? '#333333' : '#ffffff',
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
      color: isDarkMode ? '#ffffff' : '#000000',
    },
    horizantalLine: {
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#555555' : '#eeeeee',
    },
    fieldLabel: {
      fontSize: 16,
      color: isDarkMode ? '#cccccc' : '#666666',
      marginTop: 10,
      alignSelf: 'flex-start',
    },
    dropdown: {
      width: '80%',
      padding: 8,
      borderWidth: 1,
      borderColor: isDarkMode ? '#666666' : '#ddd',
      borderRadius: 5,
      marginTop: 5,
      backgroundColor: isDarkMode ? '#444444' : '#FFFFFF',
    },
    placeholderStyle: {
      color: isDarkMode ? '#ffffff' : '#212121',
    },
    selectedTextStyle: {
      color: isDarkMode ? '#ffffff' : '#212121',
    },
    itemTextStyle: {
      fontSize: 16,
      color: isDarkMode ? '#ffffff' : '#212121',
      fontWeight: '500',
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
      borderColor: isDarkMode ? '#555555' : '#D3D3D3',
      marginVertical: 10,
      borderRadius: 5,
    },
    uploadButton: {
      borderColor: '#FF4500',
      backgroundColor: isDarkMode ? '#444444' : '#FFFFFF',
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
      color: isDarkMode ? '#ffffff' : '#212121',
      fontSize: 13,
    },
    addressContainer: {
      width: '100%',
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
      color: isDarkMode ? '#ffffff' : '#212121',
    },
    acceptTerm: {
      flexDirection: 'row',
      marginBottom: 5,
    },
    addressText: {
      marginLeft: 10,
      fontSize: 16,
      color: isDarkMode ? '#ffffff' : '#333333',
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
      color: '#ffffff',
      fontSize: 15,
      fontWeight: 'bold',
    },
    errorText: {
      color: '#FF4500',
    },
    // Additional styles for timeline and swipe
    technicianContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    technicianImage: {
      width: 50,
      height: 50,
      borderRadius: 25,
    },
    technicianDetails: {
      marginLeft: 15,
      flex: 1,
    },
    technicianName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: isDarkMode ? '#ffffff' : '#212121',
    },
    technicianTitle: {
      color: isDarkMode ? '#bbbbbb' : '#4a4a4a',
      fontSize: 14,
    },
    statusText: {
      fontSize: 14,
      color: isDarkMode ? '#ffffff' : '#212121',
      marginBottom: 5,
    },
    ServiceCardsContainer: {
      flexDirection: 'column',
      marginVertical: 10,
      backgroundColor: isDarkMode ? '#333333' : '#f9f9f9',
      padding: 15,
      borderRadius: 10,
    },
    detailsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 5,
    },
    detailText: {
      marginLeft: 10,
      color: isDarkMode ? '#cccccc' : '#4a4a4a',
      fontSize: 14,
    },
    highLightText: {
      fontWeight: 'bold',
      color: isDarkMode ? '#ffffff' : '#212121',
    },
    serviceDetailsHeaderContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    iconDetailsContainer: {
      marginTop: 10,
    },
    sectionContainer: {
      paddingHorizontal: 16,
      marginTop: 10,
    },
    serviceTimeLineContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: isDarkMode ? '#ffffff' : '#212121',
    },
    editText: {
      color: '#ff5700',
      fontSize: 15,
      fontWeight: '500',
    },
    innerContainerLine: {
      marginTop: 5,
    },
    timelineItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    iconAndLineContainer: {
      alignItems: 'center',
      width: 20,
    },
    lineSegment: {
      width: 2,
      height: 35,
      marginTop: 2,
    },
    timelineContent: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      justifyContent: 'space-between',
      marginLeft: 10,
    },
    timelineTextContainer: {
      flex: 1,
    },
    timelineText: {
      fontSize: 14,
      color: isDarkMode ? '#ffffff' : '#212121',
      fontWeight: 'bold',
    },
    timelineTime: {
      fontSize: 12,
      color: isDarkMode ? '#bbbbbb' : '#4a4a4a',
    },
    swipeButton:{
      marginHorizontal:'10%'
    }
  });

export default ServiceInProgressScreen;

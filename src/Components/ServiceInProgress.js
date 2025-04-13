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
  Platform
} from 'react-native';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
// Keep RadioButton import for the timeline feature
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
import { useTheme } from '../context/ThemeContext';
import polyline from '@mapbox/polyline';

// Import translation hook
import { useTranslation } from 'react-i18next';

const ServiceInProgressScreen = () => {
  // --------------------------------------------------------------------------
  // 1) NEW: State for your two icon-based selections
  //    'serviceCompleted' or 'workNotPossible'
  // --------------------------------------------------------------------------
  const [selectedOption, setSelectedOption] = useState('serviceCompleted');

  // Keep your existing states
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

  // Status/timeline logic
  const statuses = ['In Progress', 'Work started', 'Work Completed'];
  const statusKeys = ['accept', 'arrived', 'workCompleted'];
  const { t } = useTranslation();
  const statusDisplayNames = {
    accept: t('in_progress', 'In Progress'),
    arrived: t('work_started', 'Work started'),
    workCompleted: t('work_completed', 'Work Completed'),
  };

  const route = useRoute();
  const navigation = useNavigation();
  const { encodedId } = route.params;

  const { isDarkMode } = useTheme();
  const styles = dynamicStyles(isDarkMode);

  // Decode the ID if present
  useEffect(() => {
    if (encodedId) {
      try {
        setDecodedId(atob(encodedId));
      } catch (error) {
        console.error('Error decoding Base64:', error);
      }
    }
  }, [encodedId]);

  // Fetch booking/service details from your API
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await axios.post(
          `https://backend.clicksolver.com/api/worker/work/progress/details`,
          { decodedId }
        );
        const data = response.data[0];
        console.log('Fetched Data:', data);

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
              workCompleted: serviceStatusItem
                ? serviceStatusItem.workCompleted || null
                : null,
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

  // Generate timeline data
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

  // Determine the current status for a service
  const getCurrentStatus = status => {
    for (let i = statusKeys.length - 1; i >= 0; i--) {
      if (status[statusKeys[i]] && status[statusKeys[i]] !== null) {
        return statusKeys[i];
      }
    }
    return 'pending';
  };

  // Click "Edit" on a service timeline
  const handleEditPress = serviceId => {
    if (editingServiceId === serviceId) {
      setEditingServiceId(null);
    } else {
      setEditingServiceId(serviceId);
    }
  };

  // Confirm user wants to update timeline status
  const handleStatusChange = (serviceId, statusKey) => {
    const statusName = statusDisplayNames[statusKey];
    Alert.alert(
      t('confirm_status_change', 'Confirm Status Change'),
      t(
        'confirm_status_message',
        `Are you sure you want to change the status to "${statusName}"?`
      ),
      [
        { text: t('no', 'No'), onPress: () => {}, style: 'cancel' },
        {
          text: t('yes', 'Yes'),
          onPress: () => applyStatusChange(serviceId, statusKey),
        },
      ]
    );
  };

  // Actually update the timeline status
  const applyStatusChange = async (serviceId, statusKey) => {
    const selectedStatusIndex = statusKeys.indexOf(statusKey);
    const currentTime = new Date().toISOString();
    const service = services.find(service => service.id === serviceId);
    const serviceName = service.name;

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

  // --------------------------------------------------------------------------
  // 2) "Work not possible" logic -> open reason modal
  // --------------------------------------------------------------------------
  const workPlaceShift = () => {
    setReasonModalVisible(true);
  };
  const closeReasonModal = () => {
    setReasonModalVisible(false);
  };

  // Confirmation modal for reasons
  const openConfirmationModal = (reasonText) => {
    setSelectedReason(reasonText);
    setConfirmationModalVisible(true);
  };
  const closeConfirmationModal = () => {
    setConfirmationModalVisible(false);
  };

  // --------------------------------------------------------------------------
  // 3) Camera / Image Upload
  // --------------------------------------------------------------------------
  const handleUploadImage =async () => {

    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const permission = await request(PERMISSIONS.ANDROID.READ_MEDIA_IMAGES);
      if (permission !== RESULTS.GRANTED) {
        Alert.alert("Permission required", "We need access to your media to upload a photo.");
        return;
      }
    }

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

  // Accepting T&C
  const handleAcceptCheck = () => {
    setAccept(!accept);
    setErrorText('');
  };

  // If user confirms "take to my place"
  const confirmWorkPlace = async () => {
    if (accept) {
      const detailsObj = {
        reason: selectedReason,
        estimatedDuration,
        image: imageUri,
        termsAccepted: accept,
      };
      console.log('Details:', detailsObj);

      setErrorText('');
      setConfirmationModalVisible(false);
      setReasonModalVisible(false);

      try {
        const response = await axios.post(
          `https://backend.clicksolver.com/api/add/tracking`,
          { notification_id: decodedId, details: detailsObj }
        );
        console.log('Response:', response);
        if (response.status === 201) {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [
                {
                  name: 'Tabs',
                  state: { index: 0, routes: [{ name: 'Home' }] },
                },
              ],
            })
          );
        }
      } catch (error) {
        console.error('Error posting work shift: ', error);
      }
    } else {
      setErrorText(
        t('accept_terms_error', 'You need to accept the terms and conditions.')
      );
    }
  };

  const durationOptions = [
    { label: t('one_day', '1 day'), value: '1' },
    { label: t('two_days', '2 days'), value: '2' },
    { label: t('three_days', '3 days'), value: '3' },
    { label: t('four_days', '4 days'), value: '4' },
  ];

  // --------------------------------------------------------------------------
  // 4) SWIPE BUTTON THUMB ICON
  // --------------------------------------------------------------------------
  const ThumbIcon = useMemo(
    () => () => (
      <View style={styles.thumbContainer}>
        <Text>
          {swiped ? (
            <Entypo
              name="check"
              size={20}
              color="#ff4500"
              style={styles.checkIcon}
            />
          ) : (
            <FontAwesome6 name="arrow-right-long" size={15} color="#ff4500" />
          )}
        </Text>
      </View>
    ),
    [swiped]
  );

  // Handle hardware back press
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [
              {
                name: 'Tabs',
                state: { index: 0, routes: [{ name: 'Home' }] },
              },
            ],
          })
        );
        return true;
      };
      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [navigation])
  );

  // --------------------------------------------------------------------------
  // 5) Decide the swipe button text: "Service Completed" vs. "Work in my place"
  // --------------------------------------------------------------------------
  const swipeTitle =
    selectedOption === 'workNotPossible'
      ? t('work_in_my_place', 'Work in my place')
      : t('service_completed_swipe', 'Service Completed');

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
                routes: [
                  {
                    name: 'Tabs',
                    state: { index: 0, routes: [{ name: 'Home' }] },
                  },
                ],
              })
            );
          }}
        />
        <Text style={styles.headerText}>
          {t('service_in_progress', 'Service In Progress')}
        </Text>
      </View>

      <ScrollView style={styles.container}>

        {/* -------------------------------------------------------------------
            6) ICON-BASED TOGGLE for "Service Completed" vs. "Work Not Possible"
            ------------------------------------------------------------------- */}
        <View style={{ marginHorizontal: 20, marginTop: 20 }}>
          <Text
            style={{
              color: isDarkMode ? '#fff' : '#000',
              marginBottom: 8,
              fontWeight: 'bold',
            }}
          >
            {t('choose_option', 'Choose an option')}:
          </Text>

          {/* First Option: Service Completed */}
          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => setSelectedOption('serviceCompleted')}
          >
            <MaterialCommunityIcons
              name={
                selectedOption === 'serviceCompleted'
                  ? 'checkbox-marked-circle'
                  : 'checkbox-blank-circle-outline'
              }
              size={24}
              color="#ff4500"
            />
            <Text style={styles.optionText}>
              {t('radio_service_completed', 'Service completed (all good)')}
            </Text>
          </TouchableOpacity>

          {/* Second Option: Work Not Possible */}
          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => setSelectedOption('workNotPossible')}
          >
            <MaterialCommunityIcons
              name={
                selectedOption === 'workNotPossible'
                  ? 'checkbox-marked-circle'
                  : 'checkbox-blank-circle-outline'
              }
              size={24}
              color="#ff4500"
            />
            <Text style={styles.optionText}>
              {t('radio_work_not_possible', 'Work not possible here, take to my place')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Service Details Container */}
        <View style={styles.serviceDetailsContainer}>
          <View style={styles.serviceDetailsHeaderContainer}>
            <Text style={styles.serviceDetailsTitle}>
              {t('service_details', 'Service Details')}
            </Text>
            <TouchableOpacity>
              <Icon name="keyboard-arrow-right" size={24} color="#ff4500" />
            </TouchableOpacity>
          </View>

          <View style={styles.iconDetailsContainer}>
            <View style={styles.detailsRow}>
              <Icon name="calendar-today" size={20} color="#ff4500" />
              <Text style={styles.detailText}>
                {t('work_started', 'Work started')}{' '}
                <Text style={styles.highLightText}>
                  {new Date(createdAt).toLocaleString()}
                </Text>
              </Text>
            </View>
            <View style={styles.detailsRow}>
              <Icon name="location-on" size={20} color="#ff4500" />
              <Text style={styles.detailText}>
                {t('location', 'Location:')}{' '}
                <Text style={styles.highLightText}>{area}</Text>
              </Text>
            </View>
          </View>

          <View style={{ marginTop: 20 }}>
            {/* Map through your services */}
            {services.map(service => {
              const timelineData = generateTimelineData(service.status);
              const currentStatus = getCurrentStatus(service.status);

              return (
                <View style={styles.ServiceCardsContainer} key={service.id}>
                  <View style={styles.technicianContainer}>
                    <Image
                      source={{ uri: service.image }}
                      style={styles.technicianImage}
                    />
                    <View style={styles.technicianDetails}>
                      <Text style={styles.technicianName}>
                        {service.name}
                      </Text>
                      <Text style={styles.technicianTitle}>
                        {t('quantity', 'Quantity')}: {service.quantity}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.statusText}>
                    {t('service_status', 'Service Status')}:{' '}
                    <Text style={styles.highLightText}>
                      {statusDisplayNames[currentStatus] || t('pending', 'Pending')}
                    </Text>
                  </Text>
                  <Text style={styles.statusText}>
                    {t('estimated_completion', 'Estimated Completion')}:{' '}
                    <Text style={styles.highLightText}>2 {t('hours', 'hours')}</Text>
                  </Text>

                  {/* Timeline Section */}
                  <View style={styles.sectionContainer}>
                    <View style={styles.serviceTimeLineContainer}>
                      <Text style={styles.sectionTitle}>
                        {t('service_timeline', 'Service Timeline')}
                      </Text>
                      {currentStatus !== 'workCompleted' && (
                        <TouchableOpacity onPress={() => handleEditPress(service.id)}>
                          <Text style={styles.editText}>
                            {editingServiceId === service.id
                              ? t('cancel', 'Cancel')
                              : t('edit', 'Edit')}
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
                                  {
                                    backgroundColor: timelineData[index + 1].iconColor,
                                  },
                                ]}
                              />
                            )}
                          </View>
                          <View style={styles.timelineContent}>
                            <View style={styles.timelineTextContainer}>
                              <Text style={styles.timelineText}>{item.title}</Text>
                              <Text style={styles.timelineTime}>
                                {item.statusValue || t('pending', 'Pending')}
                              </Text>
                            </View>

                            {/* This small RadioButton is for timeline editing only */}
                            {editingServiceId === service.id && !item.statusValue && (
                              <RadioButton
                                value={item.key}
                                status={
                                  editingSelectedStatus === item.key
                                    ? 'checked'
                                    : 'unchecked'
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

        {/* -------------------------------------------------------------------
            7) SWIPE BUTTON - text depends on selectedOption
            ------------------------------------------------------------------- */}
        <View style={styles.swipeButton}>
          <SwipeButton
            title={swipeTitle}
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
              setTitleColor('#FFFFFF');
              setSwiped(true);

              if (selectedOption === 'workNotPossible') {
                // "Work not possible" => run your existing "take to my place" logic
                workPlaceShift();
              } else {
                // "Service completed" => navigate to your TaskConfirmation (change route if needed)
                navigation.navigate('TaskConfirmation', {
                  // pass any needed params
                  encodedId: encodedId,
                });
              } 
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
          <TouchableOpacity
            onPress={closeReasonModal}
            style={styles.backButtonContainer}
          >
            <AntDesign
              name="arrowleft"
              size={24}
              color={isDarkMode ? '#ffffff' : 'black'}
            />
          </TouchableOpacity>
          <View style={styles.modalContainer}>
            <View style={styles.heading}>
              <Text style={styles.modalTitle}>
                {t(
                  'cancel_reason_title',
                  'What is the reason for taking this repair off-site?'
                )}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.reasonButton}
              onPress={() =>
                openConfirmationModal(
                  t('reason_specialized_equipment', 'Specialized Equipment Needed')
                )
              }
            >
              <Text style={styles.reasonText}>
                {t('reason_specialized_equipment', 'Specialized Equipment Needed')}
              </Text>
              <AntDesign name="right" size={16} color="#4a4a4a" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.reasonButton}
              onPress={() =>
                openConfirmationModal(t('reason_complex_repair', 'Complex Repair'))
              }
            >
              <Text style={styles.reasonText}>
                {t('reason_complex_repair', 'Complex Repair')}
              </Text>
              <AntDesign name="right" size={16} color="#4a4a4a" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.reasonButton}
              onPress={() =>
                openConfirmationModal(t('reason_part_replacement', 'Part Replacement'))
              }
            >
              <Text style={styles.reasonText}>
                {t('reason_part_replacement', 'Part Replacement')}
              </Text>
              <AntDesign name="right" size={16} color="#4a4a4a" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.reasonButton}
              onPress={() =>
                openConfirmationModal(
                  t('reason_more_time', 'More time or detailed analysis')
                )
              }
            >
              <Text style={styles.reasonText}>
                {t('reason_more_time', 'More time or detailed analysis')}
              </Text>
              <AntDesign name="right" size={16} color="#4a4a4a" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.reasonButton}
              onPress={() => openConfirmationModal(t('reason_others', 'Others'))}
            >
              <Text style={styles.reasonText}>
                {t('reason_others', 'Others')}
              </Text>
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
            <TouchableOpacity
              onPress={closeConfirmationModal}
              style={styles.backButtonContainer}
            >
              <AntDesign
                name="close"
                size={24}
                color={isDarkMode ? '#ffffff' : 'black'}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.confirmationModalContainer}>
            <Text style={styles.confirmationTitle}>
              {t(
                'confirmation_title',
                'Are you sure you want to take this repair to your place?'
              )}
            </Text>
            <View style={styles.horizantalLine} />

            <Text style={styles.fieldLabel}>
              {t('estimated_duration', 'Estimated Duration')}
            </Text>
            <Dropdown
              style={styles.dropdown}
              data={durationOptions}
              placeholderStyle={styles.placeholderStyle}
              selectedTextStyle={styles.selectedTextStyle}
              itemTextStyle={styles.itemTextStyle}
              labelField="label"
              valueField="value"
              placeholder={t('select_days', 'Select days')}
              value={estimatedDuration}
              onChange={item => setEstimatedDuration(item.value)}
            />

            <Text style={styles.fieldLabel}>
              {t('upload_pic', 'Upload the pic you are repairing in your place')}
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
                <Text style={styles.uploadButtonText}>{t('upload', 'Upload')}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>
              {t('service_location', 'Service location')}
            </Text>
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
              <Text style={styles.addressText}>
                {t('accept_terms', 'Accept the terms & policy')}
              </Text>
            </TouchableOpacity>

            <View style={styles.confirmButtonContainer}>
              <TouchableOpacity style={styles.confirmButton} onPress={confirmWorkPlace}>
                <Text style={styles.confirmButtonText}>{t('confirm', 'Confirm')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ServiceInProgressScreen;

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
    serviceDetailsContainer: {
      backgroundColor: isDarkMode ? '#333333' : '#f9f9f9',
      flex: 1,
      padding: 20,
      marginTop: 20,
      marginBottom: 20,
      marginHorizontal: 20,
      borderRadius: 10,
    },
    iconDetailsContainer: {
      marginTop: 10,
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
    swipeButton: {
      marginHorizontal: '10%',
      marginBottom: 40,
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
      marginBottom: 16,
      color: isDarkMode ? '#fff' : '#000',
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
      color: isDarkMode ? '#fff' : '#333333',
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
      color: isDarkMode ? '#fff' : '#000',
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#555555' : '#eeeeee',
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
      color: isDarkMode ? '#212121' : '#212121',
    },
    selectedTextStyle: {
      color: isDarkMode ? '#ffffff' : '#212121',
    },
    itemTextStyle: {
      fontSize: 16,
      color: isDarkMode ? '#212121' : '#212121',
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
      paddingHorizontal: 20,
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

    // NEW: for the two icon-based toggles
    optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 15,
    },
    optionText: {
      marginLeft: 8,
      fontSize: 14,
      color: isDarkMode ? '#fff' : '#333',
    },
  });

import React, {useEffect, useState, useMemo, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Entypo from 'react-native-vector-icons/Entypo';
import SwipeButton from 'rn-swipe-button';
import {Dropdown} from 'react-native-element-dropdown';
import {RadioButton, Checkbox} from 'react-native-paper';
import {useRoute, useNavigation} from '@react-navigation/native';
import axios from 'axios';

const IndividualWorkerPending = () => {
  const [titleColor, setTitleColor] = useState('#FFFFFF');
  const [swiped, setSwiped] = useState(false);
  const [details, setDetails] = useState(null);
  const [personalDetails, setPersonalDetails] = useState(null);
  const [address, setAddress] = useState({});
  const [isEditVisible, setEditVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const {workerId} = useRoute().params;
  console.log(workerId);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [issues, setIssues] = useState([]); // Array to store multiple issues
  const [currentIssueCategory, setCurrentIssueCategory] = useState(null);
  const [currentIssueDescription, setCurrentIssueDescription] = useState('');
  const statuses = [
    'Mobile Number Verified',
    'Details Verified',
    'Profile and Proof Verified',
    'Bank Account Verified',
  ];
  const navigation = useNavigation();
  const [text, setText] = useState('');
  
  // New state variables for loading and modal
  const [isSubmittingIssues, setIsSubmittingIssues] = useState(false);
  const [isIssuesModalVisible, setIsIssuesModalVisible] = useState(false);

  // Define ThumbIcon as a separate component
  const ThumbIcon = useCallback(
    () => (
      <View style={styles.thumbContainer}>
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
      </View>
    ),
    [swiped],
  );

  const handleEditPress = () => {
    setEditVisible(prev => !prev);
    setSelectedStatus('');
  };

  const addIssue = () => {
    if (!currentIssueCategory || !currentIssueDescription.trim()) {
      Alert.alert(
        'Validation Error',
        'Please select a category and describe the issue.',
      );
      return;
    }

    const newIssue = {
      category: currentIssueCategory,
      description: currentIssueDescription.trim(),
      id: Date.now(), // Unique identifier for each issue
    };

    setIssues(prevIssues => [...prevIssues, newIssue]);
    // Reset current issue inputs
    setCurrentIssueCategory(null);
    setCurrentIssueDescription('');
  };

  const removeIssue = id => {
    setIssues(prevIssues => prevIssues.filter(issue => issue.id !== id));
  };

  const handleStatusChange = status => {
    setSelectedStatus(status);
    Alert.alert(
      'Confirm Change',
      `Are you sure you want to change the status to "${status}"?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Yes', onPress: () => applyStatusChange(status)},
      ],
    );
  };

  const handleApproved = async () => {
    const response = await axios.post(
      `https://backend.clicksolver.com/api/worker/approved`,
      {
        workerId,
      },
    );
    if (response.status === 200) {
      Alert.alert('Worker approved');
    }
  };

  // Modified submitAllIssues to show ActivityIndicator and then a modal
  const submitAllIssues = async () => {
    setIsSubmittingIssues(true);
    try {
      await axios.post(`https://backend.clicksolver.com/api/update/worker/issues`, {
        workerId,
        issues,
      });
      // Show success modal if issues submitted successfully
      setIsIssuesModalVisible(true);
    } catch (error) {
      console.error('Failed to update status:', error);
      Alert.alert('Error', 'Failed to update issues.');
    } finally {
      setIsSubmittingIssues(false);
    }
    console.log(issues);
  };

  const applyStatusChange = async newStatus => {
    try {
      await axios.post(
        `https://backend.clicksolver.com/api/aprove/tracking/update/status`,
        {
          workerId,
          newStatus,
        },
      );
      setDetails(prevDetails => ({
        ...prevDetails,
        verification_status: newStatus,
      }));
      setSelectedStatus('');
      setEditVisible(false);
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const getTimelineData = useMemo(() => {
    if (!details) return [];
    const currentStatusIndex = statuses.indexOf(details.verification_status);
    return statuses.map((status, index) => ({
      title: status,
      time: '',
      iconColor: index <= currentStatusIndex ? '#ff4500' : '#a1a1a1',
      lineColor: index <= currentStatusIndex ? '#ff4500' : '#a1a1a1',
      isSelectable: index > currentStatusIndex && status !== 'Delivered',
    }));
  }, [details, statuses]);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await axios.post(
          `https://backend.clicksolver.com/api/individual/worker/pending/verification`,
          {workerId},
        );
        const {data} = response.data;
        if (data && data.length > 0) {
          const workerDetails = data[0];
          const workerIssues = workerDetails.issues;
          setIssues(workerIssues);
          if (
            !personalDetails ||
            JSON.stringify(personalDetails) !==
              JSON.stringify(workerDetails.personaldetails)
          ) {
            setPersonalDetails(workerDetails.personaldetails);
            setAddress(workerDetails.address);
            setDetails(workerDetails);
          }
        }
      } catch (error) {
        console.error('Error fetching bookings data:', error);
      }
    };
    fetchBookings();
  }, [workerId, personalDetails]);

  if (!details || !personalDetails) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <FontAwesome6
          name="arrow-left-long"
          size={20}
          color="#212121"
          style={styles.backIcon}
          onPress={() => navigation.goBack()}
        />
        <Text style={styles.headerText}>Service Trackings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Profile Section */}
        <View style={styles.profileContainer}>
          <View style={styles.profileImage}>
            <Text style={styles.profileInitial}>
              {details.name ? details.name.charAt(0).toUpperCase() : ''}
            </Text>
          </View>
          <View style={styles.profileTextContainer}>
            <Text style={styles.userName}>{details.name}</Text>
            <Text style={styles.serviceName}>{details.service}</Text>
          </View>
        </View>

        <View style={styles.horizontalLine} />

        {/* Approval Status Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Approval Status</Text>
            <TouchableOpacity onPress={handleEditPress}>
              <Text style={styles.editText}>
                {isEditVisible ? 'Cancel' : 'Edit'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.timelineContainer}>
            {getTimelineData.map((item, index) => (
              <View key={index} style={styles.timelineItem}>
                <View style={styles.timelineIconContainer}>
                  <MaterialCommunityIcons
                    name="circle"
                    size={14}
                    color={item.iconColor}
                  />
                  {index !== getTimelineData.length - 1 && (
                    <View
                      style={[
                        styles.lineSegment,
                        {backgroundColor: getTimelineData[index + 1].iconColor},
                      ]}
                    />
                  )}
                </View>
                <View style={styles.timelineTextContainer}>
                  <Text style={styles.timelineText}>{item.title}</Text>
                  <Text style={styles.timelineTime}>{item.time}</Text>
                </View>
                <View style={styles.statusEditContainer}>
                  {isEditVisible && item.isSelectable && (
                    <RadioButton
                      value={item.title}
                      status={
                        selectedStatus === item.title ? 'checked' : 'unchecked'
                      }
                      color="#ff4500"
                      onPress={() => handleStatusChange(item.title)}
                    />
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.horizontalLine} />

        {/* Personal Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Details</Text>

          <Text style={styles.label}>First Name</Text>
          <TextInput
            style={styles.input}
            value={personalDetails.firstName}
            editable={false}
          />

          <Text style={styles.label}>Last Name</Text>
          <TextInput
            style={styles.input}
            value={personalDetails.lastName}
            editable={false}
          />

          <Text style={styles.label}>Gender</Text>
          <View>
            <View style={styles.row}>
              <View
                style={[
                  styles.genderRow,
                  personalDetails.gender === 'male' && styles.checked,
                ]}>
                <RadioButton
                  value="male"
                  status={
                    personalDetails.gender === 'male' ? 'checked' : 'unchecked'
                  }
                  color="#FF5722"
                />
                <Text style={styles.radioText}>Male</Text>
              </View>

              <View
                style={[
                  styles.genderRow,
                  personalDetails.gender === 'female' && styles.checked,
                ]}>
                <RadioButton
                  value="female"
                  status={
                    personalDetails.gender === 'female'
                      ? 'checked'
                      : 'unchecked'
                  }
                  color="#FF5722"
                />
                <Text style={styles.radioText}>Female</Text>
              </View>
            </View>
          </View>

          <Text style={styles.label}>Work Experience (Years)</Text>
          <TextInput
            style={styles.input}
            value={personalDetails.workExperience}
            editable={false}
          />

          <Text style={styles.label}>Age</Text>
          <TextInput
            style={styles.input}
            value={personalDetails.dob}
            editable={false}
          />

          <Text style={styles.label}>Education</Text>
          <TextInput
            style={styles.input}
            value={personalDetails.education}
            editable={false}
          />

          <Text style={styles.label}>Mobile Number</Text>
          <View style={styles.phoneContainer}>
            <View style={styles.countryCode}>
              <Image
                source={{
                  uri: 'https://cdn-icons-png.flaticon.com/512/206/206606.png',
                }}
                style={styles.flagIcon}
              />
              <Text style={styles.countryCodeText}>+91</Text>
            </View>
            {details.phone_number && (
              <TextInput
                style={styles.inputPhone}
                value={details.phone_number}
                editable={false}
                keyboardType="phone-pad"
              />
            )}
          </View>
        </View>

        {/* Address Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Address / Residential Details
          </Text>

          <Text style={styles.label}>Door-No/Street</Text>
          <TextInput
            style={styles.input}
            value={address.doorNo}
            editable={false}
          />

          <Text style={styles.label}>Landmark</Text>
          <TextInput
            style={styles.input}
            value={address.landmark}
            editable={false}
          />

          <Text style={styles.label}>City</Text>
          <TextInput
            style={styles.input}
            value={address.city}
            editable={false}
          />

          <Text style={styles.label}>Pin Code</Text>
          <TextInput
            style={styles.input}
            value={address.pincode}
            editable={false}
          />

          <Text style={styles.label}>District</Text>
          <TextInput
            style={styles.input}
            value={address.district}
            editable={false}
          />

          <Text style={styles.label}>State</Text>
          <TextInput
            style={styles.input}
            value={address.state}
            editable={false}
          />
        </View>

        {/* Skill Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skill Details</Text>

          <Text style={styles.label}>Select Service Category</Text>
          <TextInput
            style={styles.input}
            value={details.service}
            editable={false}
          />

          <View
            style={[
              styles.checkboxGrid,
              details.subservices.length > 0 && styles.checked,
            ]}>
            {details.subservices.map(item => (
              <View key={item.id} style={styles.checkboxContainer}>
                <Checkbox
                  status={details.subservices ? 'checked' : 'unchecked'}
                  color="#FF5722"
                />
                <Text style={styles.label}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Proof Image Section */}
        <View style={styles.proofImageContainer}>
          <View style={styles.proofImageWrapper}>
            <Image source={{uri: details.proof}} style={styles.imagePreview} />
            <Text style={styles.proofText}>Proof</Text>
          </View>
        </View>

        {/* Issues Raised Section */}
        <View style={styles.issueContainer}>
          <Text style={styles.issueHeader}>Issues Raised</Text>
          {/* Dropdown for selecting issue category */}
          <Dropdown
            style={styles.dropdown}
            containerStyle={styles.dropdownContainer}
            data={statuses.map(status => ({label: status, value: status}))}
            placeholderStyle={styles.placeholderStyle}
            selectedTextStyle={styles.selectedTextStyle}
            iconStyle={styles.iconStyle}
            labelField="label"
            valueField="value"
            placeholder="Select Issue Category"
            value={currentIssueCategory}
            onChange={item => setCurrentIssueCategory(item.value)}
            renderRightIcon={() => (
              <FontAwesome name="chevron-down" size={14} color="#9e9e9e" />
            )}
            renderItem={item => (
              <View style={styles.dropdownItem}>
                <Text style={styles.dropdownItemText}>{item.label}</Text>
              </View>
            )}
          />

          {/* TextInput for issue description */}
          <TextInput
            style={styles.textArea}
            value={currentIssueDescription}
            onChangeText={setCurrentIssueDescription}
            multiline
            numberOfLines={5}
            placeholder="Describe the issue..."
            placeholderTextColor="#999"
          />

          {/* Add Issue Button */}
          <View style={styles.addButtonContainer}>
            <TouchableOpacity style={styles.addButton} onPress={addIssue}>
              <Text style={styles.addButtonText}>Add +</Text>
            </TouchableOpacity>
          </View>

          {/* Display List of Added Issues */}
          {issues.length > 0 && (
            <View style={styles.addedIssuesContainer}>
              {issues.map(issue => (
                <View key={issue.id} style={styles.addedIssueItem}>
                  <View style={styles.issueDetails}>
                    <Text style={styles.issueCategory}>{issue.category}</Text>
                    <Text style={styles.issueDescription}>
                      {issue.description}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => removeIssue(issue.id)}>
                    <FontAwesome name="trash" size={20} color="#ff4500" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Submit All Issues Button */}
          <View style={styles.submitButtonContainer}>
            {isSubmittingIssues ? (
              <ActivityIndicator size="small" color="#FF5722" />
            ) : (
              <TouchableOpacity
                style={styles.submitButton}
                onPress={submitAllIssues}>
                <Text style={styles.submitText}>Submit Issues</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.horizontalLine} />

        {/* Swipe Button */}
        <View style={styles.swipeButton}>
          <SwipeButton
            title="Approve"
            titleStyles={{color: titleColor, fontSize: 16, fontWeight: '500'}}
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
            thumbIconStyles={{height: 30, width: 30, borderRadius: 20}}
            onSwipeStart={() => setTitleColor('#B0B0B0')}
            onSwipeSuccess={() => {
              console.log('Approved');
              setTitleColor('#FFFFFF');
              setSwiped(true);
              handleApproved();
            }}
            onSwipeFail={() => setTitleColor('#FFFFFF')}
          />
        </View>
      </ScrollView>

      {/* Success Modal for Submitted Issues */}
      <Modal
        transparent
        animationType="fade"
        visible={isIssuesModalVisible}
        onRequestClose={() => setIsIssuesModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Success</Text>
            <Text style={styles.modalMessage}>
              Issues have been successfully submitted!
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setIsIssuesModalVisible(false)}>
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContainer: {
    paddingBottom: 15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    backgroundColor: '#ffffff',
  },
  backIcon: {
    marginRight: 10,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1D2951',
    paddingLeft: 30,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
    paddingHorizontal: 16,
    gap: 5,
  },
  profileImage: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FF7A22',
    borderRadius: 30,
  },
  profileInitial: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  profileTextContainer: {
    marginLeft: 10,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  serviceName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4a4a4a',
  },
  horizontalLine: {
    height: 2,
    backgroundColor: '#F5F5F5',
    marginBottom: 12,
    marginHorizontal: 16,
  },
  sectionContainer: {
    marginBottom: 16,
    paddingHorizontal: 16,
    width: '95%',
  },
  section: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1D2951',
    marginBottom: 10,
  },
  editText: {
    color: '#ff5700',
    fontSize: 15,
    fontWeight: '500',
  },
  timelineContainer: {
    paddingLeft: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineIconContainer: {
    alignItems: 'center',
    width: 20,
  },
  lineSegment: {
    width: 2,
    height: 40,
  },
  timelineTextContainer: {
    flex: 1,
    marginLeft: 10,
  },
  timelineText: {
    fontSize: 14,
    color: '#212121',
    fontWeight: 'bold',
  },
  timelineTime: {
    fontSize: 10,
    color: '#4a4a4a',
  },
  statusEditContainer: {
    // Add any extra styling if needed
  },
  genderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  genderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkedOption: {
    backgroundColor: '#ff4500',
    borderRadius: 5,
  },
  radioText: {
    fontSize: 16,
    marginLeft: 2,
    color: '#212121',
    fontWeight: 'bold',
  },
  label: {
    marginBottom: 5,
    color: '#666',
  },
  input: {
    height: 40,
    borderColor: '#E0E0E0',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 15,
    color: '#212121',
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#E0E0E0',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginRight: 10,
  },
  flagIcon: {
    width: 20,
    height: 20,
    marginRight: 5,
  },
  countryCodeText: {
    color: '#212121',
  },
  inputPhone: {
    flex: 1,
    height: 40,
    borderColor: '#E0E0E0',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    color: '#212121',
  },
  checkboxGrid: {
    flexDirection: 'column',
    gap: 5,
    marginTop: 10,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxLabel: {
    marginLeft: 8,
    color: '#212121',
  },
  proofImageContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 5,
    marginBottom: 5,
  },
  proofImageWrapper: {
    alignItems: 'center',
  },
  imagePreview: {
    width: 110,
    height: 170,
    borderRadius: 5,
  },
  proofText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#212121',
    textAlign: 'center',
    marginTop: 5,
  },
  addedIssuesContainer: {
    marginTop: 10,
    marginBottom: 15,
  },
  addedIssueItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f1f1f1',
    borderRadius: 5,
    marginBottom: 5,
  },
  issueDetails: {
    flex: 1,
    marginRight: 10,
  },
  issueCategory: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1D2951',
  },
  issueDescription: {
    fontSize: 14,
    color: '#333',
  },
  addButtonContainer: {
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  addButton: {
    backgroundColor: '#FF5722',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  issueContainer: {
    padding: 15,
    marginHorizontal: 5,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  issueHeader: {
    color: '#1D2951',
    fontSize: 18,
    fontWeight: 'bold',
    paddingBottom: 5,
    marginBottom: 10,
  },
  dropdown: {
    height: 40,
    borderColor: '#E0E0E0',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  dropdownContainer: {
    backgroundColor: '#fff',
    borderRadius: 5,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  placeholderStyle: {
    color: '#9e9e9e',
  },
  selectedTextStyle: {
    color: '#4a4a4a',
    fontSize: 14,
  },
  dropdownItem: {
    padding: 10,
    backgroundColor: '#fff',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 150,
    justifyContent: 'flex-start',
    textAlignVertical: 'top',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#FFFFFF',
    color: '#212121',
    marginBottom: 15,
  },
  submitButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  submitButton: {
    color: '#212121',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#4a4a4a',
    width: 150,
    height: 40,
  },
  submitText: {
    color: '#212121',
    fontWeight: 'bold',
  },
  swipeButton: {
    marginHorizontal: 20,
    marginBottom: 10,
  },
  thumbContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkIcon: {
    // Additional styles if needed
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  // Modal styles for success message
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButton: {
    backgroundColor: '#FF5722',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default IndividualWorkerPending;

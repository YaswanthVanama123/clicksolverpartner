import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator, // <--- 1) Import ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Feather from 'react-native-vector-icons/Feather';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {Dropdown} from 'react-native-element-dropdown';
import {RadioButton, Checkbox} from 'react-native-paper';
import {launchImageLibrary} from 'react-native-image-picker';
import AntDesign from 'react-native-vector-icons/AntDesign';
import SwipeButton from 'rn-swipe-button';
import Entypo from 'react-native-vector-icons/Entypo';

import axios from 'axios';
import EncryptedStorage from 'react-native-encrypted-storage';
import {useNavigation,useRoute} from '@react-navigation/native';
import uuid from 'react-native-uuid';

const ProfileChange = () => {
  const [subServices, setSubServices] = useState([]);
  const [titleColor, setTitleColor] = useState('#FF5722');
  const [errorFields, setErrorFields] = useState({});
  const [educationItems] = useState([
    {label: 'High School', value: 'highschool'},
    {label: "Bachelor's", value: 'bachelor'},
    {label: "Master's", value: 'master'},
  ]);
  const [swiped, setSwiped] = useState(false);
  const [experienceItems] = useState([
    {label: '0-1 Year', value: '0-1'},
    {label: '1-3 years', value: '1-3'},
    {label: 'more than 3 years', value: '3+'},
  ]);
  const navigation = useNavigation();
  const selectedStatus = useRoute().params

  const [skillCategoryItems, setSkillCategoryItems] = useState([
    {label: 'Electrician', value: 'electrician'},
    {label: 'Plumber', value: 'plumber'},
    {label: 'Carpenter', value: 'carpenter'},
  ]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [formData, setFormData] = useState({
    lastName: '',
    firstName: '',
    gender: '',
    workExperience: '',
    dob: '',
    education: null,
    doorNo: '',
    landmark: '',
    city: '',
    district: '',
    state: '',
    pincode: '',
    skillCategory: '',
    profileImageUri: '',
    proofImageUri: '',
    subSkills: [],
  });
  const [isEditing, setIsEditing] = useState(true);

  // 2) Introduce `loading` state
  const [loading, setLoading] = useState(false);

  const handleCheckboxChange = serviceName => {
    const isChecked = formData.subSkills.includes(serviceName);
    const updatedSubSkills = isChecked
      ? formData.subSkills.filter(skill => skill !== serviceName)
      : [...formData.subSkills, serviceName];

    setFormData({...formData, subSkills: updatedSubSkills});
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

    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload image.');
    }

    const data = await response.json();
    return data.data.url;
  };

  const ThumbIcon = () => {
    if (swiped) {
      return (
        <View style={styles.thumbContainer}>
          <Text>
            <Entypo
              name="check"
              size={20}
              color="#FF5722"
              style={styles.checkIcon}
            />
          </Text>
        </View>
      );
    } else {
      return (
        <View style={styles.thumbContainer}>
          <Text>
            <FontAwesome6 name="arrow-right-long" size={18} color="#FF5722" />
          </Text>
        </View>
      );
    }
  };

  const handleSubmit = async () => {
    // 3) Show loader when submit starts
    setLoading(true);

    const errors = {};
    for (const key in formData) {
      if (
        !formData[key] ||
        (Array.isArray(formData[key]) && formData[key].length === 0)
      ) {
        errors[key] = true;
      }
    }

    if (Object.keys(errors).length > 0) {
      setErrorFields(errors);
      Alert.alert('Error', 'Please fill all the required fields.');
      setLoading(false); // Stop loader if validation fails
      return;
    }
    try {
      const pcsToken = await EncryptedStorage.getItem('pcs_token');
      if (!pcsToken) {
        console.error('No pcs_token found.');
        navigation.replace('Login');
      }
      const response = await axios.post(
        `https://backend.clicksolver.com/api/profile/changes/submit`,
        {formData,selectedStatus},
        {
          headers: {
            Authorization: `Bearer ${pcsToken}`,
          },
        },
      );
      if (response.status === 200) {
        // setIsEditing(false);
        navigation.goBack();

      }
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      // 4) Hide loader in the finally block
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const pcsToken = await EncryptedStorage.getItem('pcs_token');
      if (!pcsToken) {
        console.error('No pcs_token found.');
        navigation.replace('Login');
      }
      const response = await axios.get(
        `https://backend.clicksolver.com/api/service/categories`,
        {
          headers: {
            Authorization: `Bearer ${pcsToken}`,
          },
        },
      );
      
      if (response.data[0].phone_numbers) {
        setPhoneNumber(response.data[0].phone_numbers);
      }
      const data = response.data;
      const mappedData = data.map(item => ({
        label: item.service_name,
        value: item.service_name,
      }));
      setSkillCategoryItems(mappedData);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const handleLogout = async () => {
    try {
      const keys = [
        'pcs_token',
        'partnerSteps',
        'start_time',
        'notifications',
        'workerPreviousLocation',
        'Requestnotifications',
        'verification',
        'sign_up',
        'partner_fcm_token',
        'start_work_time',
        'nullCoordinates'
      ];
  
      for (const key of keys) {
        const value = await EncryptedStorage.getItem(key);
        if (value !== null) {
          await EncryptedStorage.removeItem(key);
        }
      }
  
      console.log('Logout successful, all necessary storage items removed.');
      navigation.replace('Login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleImagePick = async fieldName => {
    const options = {
      mediaType: 'photo',
      quality: 1,
      selectionLimit: 1,
    };

    launchImageLibrary(options, async response => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.error('ImagePicker Error: ', response.error);
        Alert.alert('Error', 'Failed to pick image.');
      } else if (response.assets) {
        const {uri} = response.assets[0];
        try {
          const imageUrl = await uploadImage(uri);
          console.log('Uploaded Image URL:', imageUrl);
          handleInputChange(fieldName, imageUrl);
        } catch (error) {
          Alert.alert('Error', 'Failed to upload image.');
          console.error(error);
        }
      }
    });
  };

  const handleInputChange = async (field, value) => {
    setFormData({...formData, [field]: value});
    setErrorFields(prev => ({...prev, [field]: false}));
    if (field === 'skillCategory') {
      try {
        const response = await axios.post(
          `https://backend.clicksolver.com/api/subservice/checkboxes`,
          {selectedService: value},
        );
        const data = response.data;
        console.log('selected service', data);

        const mappedData = data.map(item => ({
          id: item.service_id,
          label: item.service_tag,
          category: item.service_category,
        }));

        setSubServices(mappedData);
      } catch (error) {
        console.error('Error calling the backend:', error);
        Alert.alert('Error', 'Failed to fetch service category data.');
      }
    }
  };

  const fetchDetails = async () => {
    try {
      const pcsToken = await EncryptedStorage.getItem('pcs_token');
      if (!pcsToken) {
        console.error('No pcs_token found.');
        navigation.replace('Login');
        return;
      }

      // 1) GET the profile details:
      const response = await axios.get(
        `https://backend.clicksolver.com/api/profile/detsils`,
        {
          headers: {
            Authorization: `Bearer ${pcsToken}`,
          },
        },
      );

      const data = response.data;
      console.log("data phone",data.phone_number)
      setFormData(prev => ({
        ...prev,
        lastName: data.personaldetails.lastName,
        firstName: data.personaldetails.firstName,
        gender: data.personaldetails.gender,
        workExperience: data.personaldetails.workExperience,
        dob: data.personaldetails.dob,
        education: data.personaldetails.education,
        doorNo: data.address.doorNo,
        landmark: data.address.landmark,
        city: data.address.city,
        district: data.address.district,
        state: data.address.state,
        pincode: data.address.pincode,
        skillCategory: data.service,
        profileImageUri: data.profile,
        proofImageUri: data.proof,
        phone_number: data.phone_number,
        subSkills: data.subservices || [],
      }));

      setPhoneNumber(data.phone_number);

      // 2) POST to /api/subservice/checkboxes with the service
      const subserviceResponse = await axios.post(
        `https://backend.clicksolver.com/api/subservice/checkboxes`,
        {selectedService: data.service},
        {
          headers: {
            Authorization: `Bearer ${pcsToken}`,
          },
        },
      );

      const subserviceData = subserviceResponse.data;
      const mappedData = subserviceData.map(item => ({
        id: item.service_id,
        label: item.service_tag,
        category: item.service_category,
      }));

      setSubServices(mappedData);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const handleEdit = () => {
    setIsEditing(prev => !prev);
  };

  useEffect(() => {
    fetchServices();
    fetchDetails();
  }, []);

  // Group subServices by category
  const groupedSubServices = subServices.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleEdit} style={styles.editContainer}>
          <Feather name="edit" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView style={styles.scrollContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Details</Text>
          <Text style={styles.label}>First Name</Text>
          <TextInput
            style={[styles.input, errorFields.firstName && styles.errorInput]}
            value={formData.firstName}
            editable={isEditing}
            onChangeText={value => handleInputChange('firstName', value)}
          />
          {errorFields.firstName && (
            <Text style={styles.errorText}>This field is required.</Text>
          )}

          <Text style={styles.label}>Last Name</Text>
          <TextInput
            style={[styles.input, errorFields.lastName && styles.errorInput]}
            value={formData.lastName}
            editable={isEditing}
            onChangeText={value => handleInputChange('lastName', value)}
          />
          {errorFields.lastName && (
            <Text style={styles.errorText}>This field is required.</Text>
          )}

          <Text style={styles.label}>Gender</Text>
          <View style={styles.row}>
            <View>
              <View
                style={[
                  styles.genderRow,
                  formData.gender === 'male' && styles.checked,
                ]}>
                <RadioButton
                  value="male"
                  status={formData.gender === 'male' ? 'checked' : 'unchecked'}
                  onPress={() => {
                    if (isEditing) handleInputChange('gender', 'male');
                  }}
                  color="#FF5722"
                />
                <Text style={styles.radioText}>Male</Text>
              </View>

              <View
                style={[
                  styles.genderRow,
                  formData.gender === 'female' && styles.checked,
                ]}>
                <RadioButton
                  value="female"
                  status={
                    formData.gender === 'female' ? 'checked' : 'unchecked'
                  }
                  onPress={() => {
                    if (isEditing) handleInputChange('gender', 'female');
                  }}
                  color="#FF5722"
                />
                <Text style={styles.radioText}>Female</Text>
              </View>
            </View>
          </View>

          <Text style={styles.label}>Work Experience (Years)</Text>
          <Dropdown
            style={[
              styles.dropdown,
              errorFields.workExperience && styles.errorInput,
            ]}
            containerStyle={styles.dropdownContainer}
            disable={!isEditing}
            data={experienceItems}
            placeholderStyle={styles.placeholderStyle}
            labelField="label"
            selectedTextStyle={styles.selectedTextStyle}
            iconStyle={styles.iconStyle}
            inputSearchStyle={styles.inputSearchStyle}
            valueField="value"
            placeholder="Select your experience"
            value={formData.workExperience}
            onChange={item => handleInputChange('workExperience', item.value)}
            renderRightIcon={() => (
              <FontAwesome name="chevron-down" size={14} color="#9e9e9e" />
            )}
            renderItem={item => (
              <View style={styles.dropdownItem}>
                <Text style={styles.dropdownItemText}>{item.label}</Text>
              </View>
            )}
          />
          {errorFields.workExperience && (
            <Text style={styles.errorText}>This field is required.</Text>
          )}

          <Text style={styles.label}>Age</Text>
          <TextInput
            style={[styles.input, errorFields.dob && styles.errorInput]}
            value={formData.dob}
            editable={isEditing}
            onChangeText={value => handleInputChange('dob', value)}
          />
          {errorFields.dob && (
            <Text style={styles.errorText}>This field is required.</Text>
          )}

          <Text style={styles.label}>Education</Text>
          <Dropdown
            style={[
              styles.dropdown,
              errorFields.education && styles.errorInput,
            ]}
            containerStyle={styles.dropdownContainer}
            disable={!isEditing}
            data={educationItems}
            placeholderStyle={styles.placeholderStyle}
            labelField="label"
            selectedTextStyle={styles.selectedTextStyle}
            iconStyle={styles.iconStyle}
            inputSearchStyle={styles.inputSearchStyle}
            valueField="value"
            placeholder="Select Education"
            value={formData.education}
            onChange={item => handleInputChange('education', item.value)}
            renderRightIcon={() => (
              <FontAwesome name="chevron-down" size={14} color="#9e9e9e" />
            )}
            renderItem={item => (
              <View style={styles.dropdownItem}>
                <Text style={styles.dropdownItemText}>{item.label}</Text>
              </View>
            )}
          />
          {errorFields.education && (
            <Text style={styles.errorText}>This field is required.</Text>
          )}

          <Text style={styles.label}>Mobile Number</Text>
          <View style={styles.phoneContainer}>
            <View style={styles.countryCode}>
              <Image
                source={{
                  uri: 'https://cdn-icons-png.flaticon.com/512/206/206606.png',
                }}
                style={styles.flagIcon}
              />
              <Text style={styles.label}>+91</Text>
            </View>
            {formData.phone_number && (
              <TextInput
                style={styles.inputPhone}
                value={formData.phone_number}
                editable={false}
                keyboardType="phone-pad"
              />
            )}
          </View>
        </View>

        <View style={styles.horizantalLine} />
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Address / Residential Details</Text>

          <Text style={styles.label}>Door-No/Street</Text>
          <TextInput
            style={[styles.input, errorFields.doorNo && styles.errorInput]}
            value={formData.doorNo}
            editable={isEditing}
            onChangeText={value => handleInputChange('doorNo', value)}
          />
          {errorFields.doorNo && (
            <Text style={styles.errorText}>This field is required.</Text>
          )}

          <Text style={styles.label}>Landmark</Text>
          <TextInput
            style={[styles.input, errorFields.landmark && styles.errorInput]}
            value={formData.landmark}
            editable={isEditing}
            onChangeText={value => handleInputChange('landmark', value)}
          />
          {errorFields.landmark && (
            <Text style={styles.errorText}>This field is required.</Text>
          )}

          <Text style={styles.label}>City</Text>
          <TextInput
            style={[styles.input, errorFields.city && styles.errorInput]}
            value={formData.city}
            editable={isEditing}
            onChangeText={value => handleInputChange('city', value)}
          />
          {errorFields.city && (
            <Text style={styles.errorText}>This field is required.</Text>
          )}

          <Text style={styles.label}>Pin Code</Text>
          <TextInput
            style={[styles.input, errorFields.pincode && styles.errorInput]}
            value={formData.pincode}
            editable={isEditing}
            onChangeText={value => handleInputChange('pincode', value)}
          />
          {errorFields.pincode && (
            <Text style={styles.errorText}>This field is required.</Text>
          )}

          <Text style={styles.label}>District</Text>
          <TextInput
            style={[styles.input, errorFields.district && styles.errorInput]}
            value={formData.district}
            editable={isEditing}
            onChangeText={value => handleInputChange('district', value)}
          />
          {errorFields.district && (
            <Text style={styles.errorText}>This field is required.</Text>
          )}

          <Text style={styles.label}>State</Text>
          <TextInput
            style={[styles.input, errorFields.state && styles.errorInput]}
            value={formData.state}
            editable={isEditing}
            onChangeText={value => handleInputChange('state', value)}
          />
          {errorFields.state && (
            <Text style={styles.errorText}>This field is required.</Text>
          )}
        </View>

        <View style={styles.horizantalLine} />
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skill Details</Text>

          <Text style={styles.label}>Select Service Category</Text>
          <Dropdown
            style={[
              styles.dropdown,
              errorFields.skillCategory && styles.Service,
            ]}
            containerStyle={styles.dropdownContainer}
            data={skillCategoryItems}
            disable={!isEditing}
            placeholderStyle={styles.placeholderStyle}
            labelField="label"
            selectedTextStyle={styles.selectedTextStyle}
            iconStyle={styles.iconStyle}
            inputSearchStyle={styles.inputSearchStyle}
            valueField="value"
            placeholder="Select Service Category"
            value={formData.skillCategory}
            onChange={item => handleInputChange('skillCategory', item.value)}
            renderRightIcon={() => (
              <FontAwesome name="chevron-down" size={14} color="#9e9e9e" />
            )}
            renderItem={item => (
              <View style={styles.dropdownItem}>
                <Text style={styles.dropdownItemText}>{item.label}</Text>
              </View>
            )}
          />
          {errorFields.skillCategory && (
            <Text style={styles.errorText}>This field is required.</Text>
          )}

          <View
            style={[
              styles.checkboxGrid,
              formData.subSkills.length > 0 && styles.checked,
            ]}>
            {Object.keys(groupedSubServices).map(categoryName => (
              <View key={categoryName} style={{marginBottom: 16}}>
                <Text
                  style={{
                    fontWeight: 'bold',
                    fontSize: 16,
                    marginVertical: 8,
                    color: '#000',
                  }}>
                  {categoryName}
                </Text>
                {groupedSubServices[categoryName].map(item => (
                  <View key={item.id} style={styles.checkboxContainer}>
                    <Checkbox
                      status={
                        formData.subSkills.includes(item.label)
                          ? 'checked'
                          : 'unchecked'
                      }
                      onPress={() => {
                        if (isEditing) {
                          handleCheckboxChange(item.label);
                        }
                      }}
                      color="#FF5722"
                    />
                    <Text style={styles.label}>{item.label}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upload Details</Text>

          <View style={styles.uploadContainer}>
            <View style={styles.imageUpload}>
              <View style={styles.text1}>
                <Text style={styles.label}>Upload Profile</Text>
              </View>
              <View style={styles.text2}>
                <Text style={styles.label}>Upload Proof</Text>
              </View>
            </View>
            <View style={styles.imageUpload}>
              <View style={styles.image1}>
                {formData.profileImageUri && (
                  <Image
                    source={{uri: formData.profileImageUri}}
                    style={styles.imagePreview}
                  />
                )}
              </View>
              <View style={styles.image2}>
                {formData.proofImageUri && (
                  <Image
                    source={{uri: formData.proofImageUri}}
                    style={styles.imagePreview}
                  />
                )}
              </View>
            </View>

            <View style={styles.imageUpload}>
              <View>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={() => handleImagePick('profileImageUri')}>
                  <Icon name="image" size={24} color="#9e9e9e" />
                  <Text style={styles.fileText}>Choose File</Text>
                </TouchableOpacity>
                {errorFields.profileImageUri && (
                  <Text style={styles.errorText}>This field is required.</Text>
                )}
              </View>
              <View>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={() => handleImagePick('proofImageUri')}>
                  <Icon name="file-upload" size={24} color="#9e9e9e" />
                  <Text style={styles.fileText}>Choose File</Text>
                </TouchableOpacity>
                {errorFields.proofImageUri && (
                  <Text style={styles.errorText}>This field is required.</Text>
                )}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.horizantalLine} />

        {/* If not editing, show logout. If editing, show the SwipeButton or loader */}
        <View style={{marginBottom: 30}}>
          {loading ? (
            // 5) Show loader if `loading` is true
            <ActivityIndicator
              size="large"
              color="#FF5722"
              style={{marginVertical: 20}}
            />
          ) : isEditing ? (
            <SwipeButton
              forceReset={reset => {
                // Optional: capture this reset if you want to reset swipe on error
              }}
              title="Submit to Commander"
              titleStyles={{color: titleColor, fontSize: 16}}
              railBackgroundColor="#ffffff"
              railBorderColor="#EFDCCB"
              railStyles={{
                borderRadius: 25,
                height: 50,
                backgroundColor: '#FF450000',
                borderColor: '#FF450000',
              }}
              thumbIconComponent={ThumbIcon}
              thumbIconBackgroundColor="#EFDCCB"
              thumbIconBorderColor="#FFFFFF"
              thumbIconWidth={50}
              thumbIconHeight={50}
              onSwipeStart={() => setTitleColor('#802300')}
              onSwipeSuccess={() => {
                // When the user successfully swipes:
                handleSubmit();
                setTitleColor('#FF5722');
                setSwiped(true);
              }}
              onSwipeFail={() => setTitleColor('#FF5722')}
            />
          ) : (
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.doneButton} onPress={handleLogout}>
                <Text style={styles.doneText}>Logout</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 0,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flex: 1,
    paddingBottom: 0,
    backgroundColor: '#FFFFFF',
  },
  placeholderStyle: {
    color: '#212121',
  },
  uploadContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: 50,
  },
  editContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  imageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    alignItems: 'center',
  },
  imageUpload: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
  },
  errorInput: {
    borderColor: '#FF4500',
  },
  buttonContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  doneButton: {
    borderWidth: 1,
    borderColor: '#FF5722',
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    width: '60%',
  },
  doneText: {
    color: '#FF5722',
    fontSize: 15,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#FF4500',
    fontSize: 12,
  },
  image1: {
    margin: 10,
    marginLeft: 20,
  },
  text1: {
    marginLeft: 20,
  },
  text2: {
    marginRight: 30,
  },
  image2: {
    margin: 10,
    marginRight: 30,
  },
  checkboxGrid: {
    flexDirection: 'column',
  },
  radioText: {
    fontSize: 16,
    marginLeft: 2,
    color: '#212121',
    fontWeight: 'bold',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  genderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.5,
    shadowRadius: 5,
    backgroundColor: '#FFFFFF',
    zIndex: 1,
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  headerTitle: {
    position: 'absolute',
    left: '38%',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#1D2951',
    textAlign: 'center',
  },
  dropdownItem: {
    padding: 10,
    backgroundColor: '#FFFFFF',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
  },
  horizantalLine: {
    height: 2,
    width: '100%',
    backgroundColor: '#F5F5F5',
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1D2951',
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
  selectedTextStyle: {
    color: '#212121',
  },
  dropdown: {
    height: 40,
    borderColor: '#E0E0E0',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  dropdownContainer: {
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  row: {
    flexDirection: 'row',
    gap: 30,
    marginBottom: 15,
  },
  genderButton: {
    flex: 1,
    padding: 10,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    borderRadius: 5,
    marginHorizontal: 5,
  },
  activeButton: {
    backgroundColor: '#007BFF',
    color: '#fff',
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
  inputPhone: {
    flex: 1,
    height: 40,
    borderColor: '#E0E0E0',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    color: '#212121',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    width: 130,
  },
  fileText: {
    color: '#212121',
    fontWeight: 'bold',
  },
});

export default ProfileChange;

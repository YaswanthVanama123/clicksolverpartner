import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { Dropdown } from 'react-native-element-dropdown';
import { RadioButton, Checkbox } from 'react-native-paper';
import { launchImageLibrary } from 'react-native-image-picker';
import AntDesign from 'react-native-vector-icons/AntDesign';
import SwipeButton from 'rn-swipe-button';
import Entypo from 'react-native-vector-icons/Entypo';
import axios from 'axios';
import EncryptedStorage from 'react-native-encrypted-storage';
import { useNavigation } from '@react-navigation/native';
import uuid from 'react-native-uuid';
import { useTheme } from '../context/ThemeContext';
// Import translation hook
import { useTranslation } from 'react-i18next';

const RegistrationScreen = () => {
  const { width } = useWindowDimensions();
  const { isDarkMode } = useTheme();
  const styles = dynamicStyles(width, isDarkMode);
  const { t } = useTranslation();

  // State declarations
  const [subServices, setSubServices] = useState([]);
  const [titleColor, setTitleColor] = useState('#FF5722');
  const [errorFields, setErrorFields] = useState({});
  const [educationItems] = useState([
    { label: t('high_school', 'High School'), value: 'highschool' },
    { label: t('bachelors', "Bachelor's"), value: 'bachelor' },
    { label: t('masters', "Master's"), value: 'master' },
  ]);
  const [swiped, setSwiped] = useState(false);
  const [experienceItems] = useState([
    { label: t('0_1_year', '0-1 Year'), value: '0-1' },
    { label: t('1_3_years', '1-3 years'), value: '1-3' },
    { label: t('more_than_3_years', 'more than 3 years'), value: '3+' },
  ]);
  const constNavigation = useNavigation();
  const [skillCategoryItems, setSkillCategoryItems] = useState([
    { label: t('electrician', 'Electrician'), value: 'electrician' },
    { label: t('plumber', 'Plumber'), value: 'plumber' },
    { label: t('carpenter', 'Carpenter'), value: 'carpenter' },
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
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Helper: update formData and clear errors
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrorFields((prev) => ({ ...prev, [field]: false }));
  };

  // Handle checkbox for subskills
  const handleCheckboxChange = (serviceName) => {
    const isChecked = formData.subSkills.includes(serviceName);
    const updatedSubSkills = isChecked
      ? formData.subSkills.filter((skill) => skill !== serviceName)
      : [...formData.subSkills, serviceName];
    setFormData({ ...formData, subSkills: updatedSubSkills });
  };

  // Upload image helper using imgbb API
  const uploadImage = async (uri) => {
    const apiKey = '287b4ba48139a6a59e75b5a8266bbea2';
    const apiUrl = 'https://api.imgbb.com/1/upload';
    const data = new FormData();
    data.append('key', apiKey);
    data.append('image', {
      uri,
      type: 'image/jpeg',
      name: 'photo.jpg',
    });
    const response = await fetch(apiUrl, {
      method: 'POST',
      body: data,
    });
    if (!response.ok) {
      throw new Error('Failed to upload image.');
    }
    const resData = await response.json();
    return resData.data.url;
  };

  // Component for swipe button thumb
  const ThumbIcon = () => {
    if (swiped) {
      return (
        <View style={styles.thumbContainer}>
          <Entypo name="check" size={20} color="#FF5722" style={styles.checkIcon} />
        </View>
      );
    } else {
      return (
        <View style={styles.thumbContainer}>
          <FontAwesome6 name="arrow-right-long" size={18} color="#FF5722" />
        </View>
      );
    }
  };

  // Submit form data
  const handleSubmit = async () => {
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
      Alert.alert(t('error', 'Error'), t('fill_required', 'Please fill all the required fields.'));
      setLoading(false);
      return;
    }
    try {
      const pcsToken = await EncryptedStorage.getItem('pcs_token');
      if (!pcsToken) {
        console.error('No pcs_token found.');
        constNavigation.replace('Login');
      }
      const response = await axios.post(
        'https://backend.clicksolver.com/api/registration/submit',
        formData,
        {
          headers: {
            Authorization: `Bearer ${pcsToken}`,
          },
        }
      );
      if (response.status === 200) {
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch available services for skill categories
  const fetchServices = async () => {
    try {
      const pcsToken = await EncryptedStorage.getItem('pcs_token');
      if (!pcsToken) {
        console.error('No pcs_token found.');
        constNavigation.replace('Login');
      }
      const response = await axios.get(
        'https://backend.clicksolver.com/api/service/categories',
        {
          headers: {
            Authorization: `Bearer ${pcsToken}`,
          },
        }
      );
      if (response.data[0].phone_numbers) {
        setPhoneNumber(response.data[0].phone_numbers);
      }
      const data = response.data;
      const mappedData = data.map((item) => ({
        label: t(`service_${item.service_id}`, item.service_name), // display translated name
        value: item.service_name, // original English name to send
        id: item.service_id,
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
        'nullCoordinates',
      ];
      for (const key of keys) {
        const value = await EncryptedStorage.getItem(key);
        if (value !== null) {
          await EncryptedStorage.removeItem(key);
        }
      }
      console.log('Logout successful, all necessary storage items removed.');
      constNavigation.replace('Login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleImagePick = async (fieldName) => {
    const options = {
      mediaType: 'photo',
      quality: 1,
      selectionLimit: 1,
    };
    launchImageLibrary(options, async (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker'); 
      } else if (response.error) {
        console.error('ImagePicker Error: ', response.error);
        Alert.alert(t('error', 'Error'), t('image_pick_error', 'Failed to pick image.'));
      } else if (response.assets) {
        const { uri } = response.assets[0];
        try {
          const imageUrl = await uploadImage(uri);
          console.log('Uploaded Image URL:', imageUrl);
          handleInputChange(fieldName, imageUrl);
        } catch (error) {
          Alert.alert(t('error', 'Error'), t('image_upload_error', 'Failed to upload image.'));
          console.error(error);
        }
      }
    });
  };

  const fetchDetails = async () => {
    try {
      const pcsToken = await EncryptedStorage.getItem('pcs_token');
      if (!pcsToken) {
        console.error('No pcs_token found.');
        constNavigation.replace('Login');
        return;
      }
      const response = await axios.get(
        'https://backend.clicksolver.com/api/profile/detsils',
        {
          headers: {
            Authorization: `Bearer ${pcsToken}`,
          },
        }
      );
      const data = response.data;
      setFormData((prev) => ({
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
        subSkills: data.subservices || [],
      }));
      setPhoneNumber(data.phone_number);
      const subserviceResponse = await axios.post(
        'https://backend.clicksolver.com/api/subservice/checkboxes',
        { selectedService: data.service },
        {
          headers: {
            Authorization: `Bearer ${pcsToken}`,
          },
        }
      );
      const subserviceData = subserviceResponse.data;
      const mappedData = subserviceData.map((item) => ({
        id: item.service_id,
        label: item.service_tag,
        tag: t(`singleService_${item.main_service_id}`, ),
        category: item.service_category, 
        value: t(`IndivService_${item.service_id}`, item.service_tag)
      }));
      setSubServices(mappedData);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const handleEdit = () => {
    setIsEditing((prev) => !prev);
  };

  // Compute grouped sub-services by category
  const groupedSubServices = useMemo(() => {
    return subServices.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {});
  }, [subServices]);

  useEffect(() => {
    fetchServices();
    fetchDetails();
  }, []);

  return (
    <View style={styles.container}>
      {loading && (
        <ActivityIndicator size="large" color="#FF5722" style={{ marginVertical: 20 }} />
      )}

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <AntDesign name="arrowleft" size={24} color={isDarkMode ? "#ffffff" : "#333"} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('profile', 'Profile')}</Text>
        <TouchableOpacity onPress={handleEdit} style={styles.editButton}>
          <Feather name="edit" size={24} color={isDarkMode ? "#ffffff" : "#333"} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer}>
        {/* Personal Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('personal_details', 'Personal Details')}</Text>
          <Text style={styles.label}>{t('first_name', 'First Name')}</Text>
          <TextInput
            style={[styles.input, errorFields.firstName && styles.errorInput]}
            value={formData.firstName}
            editable={isEditing}
            onChangeText={(value) => handleInputChange('firstName', value)}
          />
          {errorFields.firstName && (
            <Text style={styles.errorText}>{t('required_field', 'This field is required.')}</Text>
          )}

          <Text style={styles.label}>{t('last_name', 'Last Name')}</Text>
          <TextInput
            style={[styles.input, errorFields.lastName && styles.errorInput]}
            value={formData.lastName}
            editable={isEditing}
            onChangeText={(value) => handleInputChange('lastName', value)}
          />
          {errorFields.lastName && (
            <Text style={styles.errorText}>{t('required_field', 'This field is required.')}</Text>
          )}

          <Text style={styles.label}>{t('gender', 'Gender')}</Text>
          <View style={styles.row}>
            <View style={[styles.genderRow, formData.gender === 'male' && styles.checked]}>
              <RadioButton
                value="male"
                status={formData.gender === 'male' ? 'checked' : 'unchecked'}
                onPress={() => { if (isEditing) handleInputChange('gender', 'male'); }}
                color="#FF5722"
              />
              <Text style={styles.radioText}>{t('male', 'Male')}</Text>
            </View>
            <View style={[styles.genderRow, formData.gender === 'female' && styles.checked]}>
              <RadioButton
                value="female"
                status={formData.gender === 'female' ? 'checked' : 'unchecked'}
                onPress={() => { if (isEditing) handleInputChange('gender', 'female'); }}
                color="#FF5722"
              />
              <Text style={styles.radioText}>{t('female', 'Female')}</Text>
            </View>
          </View>

          <Text style={styles.label}>{t('work_experience', 'Work Experience (Years)')}</Text>
          <Dropdown
            style={[styles.dropdown, errorFields.workExperience && styles.errorInput]}
            containerStyle={styles.dropdownContainer}
            disable={!isEditing}
            data={experienceItems}
            placeholderStyle={styles.placeholderStyle}
            labelField="label"
            selectedTextStyle={styles.selectedTextStyle}
            iconStyle={styles.iconStyle}
            inputSearchStyle={styles.inputSearchStyle}
            valueField="value"
            placeholder={t('select_experience', 'Select your experience')}
            value={formData.workExperience}
            onChange={(item) => handleInputChange('workExperience', item.value)}
            renderRightIcon={() => (
              <FontAwesome name="chevron-down" size={14} color="#9e9e9e" />
            )}
            renderItem={(item) => (
              <View style={styles.dropdownItem}>
                <Text style={styles.dropdownItemText}>{item.label}</Text>
              </View>
            )}
          />
          {errorFields.workExperience && (
            <Text style={styles.errorText}>{t('required_field', 'This field is required.')}</Text>
          )}

          <Text style={styles.label}>{t('age', 'Age')}</Text>
          <TextInput
            style={[styles.input, errorFields.dob && styles.errorInput]}
            value={formData.dob}
            editable={isEditing}
            onChangeText={(value) => handleInputChange('dob', value)}
          />
          {errorFields.dob && (
            <Text style={styles.errorText}>{t('required_field', 'This field is required.')}</Text>
          )}

          <Text style={styles.label}>{t('education', 'Education')}</Text>
          <Dropdown
            style={[styles.dropdown, errorFields.education && styles.errorInput]}
            containerStyle={styles.dropdownContainer}
            disable={!isEditing}
            data={educationItems}
            placeholderStyle={styles.placeholderStyle}
            labelField="label"
            selectedTextStyle={styles.selectedTextStyle}
            iconStyle={styles.iconStyle}
            inputSearchStyle={styles.inputSearchStyle}
            valueField="value"
            placeholder={t('select_education', 'Select Education')}
            value={formData.education}
            onChange={(item) => handleInputChange('education', item.value)}
            renderRightIcon={() => (
              <FontAwesome name="chevron-down" size={14} color="#9e9e9e" />
            )}
            renderItem={(item) => (
              <View style={styles.dropdownItem}>
                <Text style={styles.dropdownItemText}>{item.label}</Text>
              </View>
            )}
          />
          {errorFields.education && (
            <Text style={styles.errorText}>{t('required_field', 'This field is required.')}</Text>
          )}

          <Text style={styles.label}>{t('mobile_number', 'Mobile Number')}</Text>
          <View style={styles.phoneContainer}>
            <View style={styles.countryCode}>
              <Image
                source={{ uri: 'https://cdn-icons-png.flaticon.com/512/206/206606.png' }}
                style={styles.flagIcon}
              />
              <Text style={styles.label}>+91</Text>
            </View>
            {phoneNumber && (
              <TextInput
                style={styles.inputPhone}
                value={phoneNumber}
                editable={false}
                keyboardType="phone-pad"
              />
            )}
          </View>
        </View>

        <View style={styles.horizantalLine} />
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('address_details', 'Address / Residential Details')}</Text>

          <Text style={styles.label}>{t('door_no', 'Door-No/Street')}</Text>
          <TextInput
            style={[styles.input, errorFields.doorNo && styles.errorInput]}
            value={formData.doorNo}
            editable={isEditing}
            onChangeText={(value) => handleInputChange('doorNo', value)}
          />
          {errorFields.doorNo && (
            <Text style={styles.errorText}>{t('required_field', 'This field is required.')}</Text>
          )}

          <Text style={styles.label}>{t('landmark', 'Landmark')}</Text>
          <TextInput
            style={[styles.input, errorFields.landmark && styles.errorInput]}
            value={formData.landmark}
            editable={isEditing}
            onChangeText={(value) => handleInputChange('landmark', value)}
          />
          {errorFields.landmark && (
            <Text style={styles.errorText}>{t('required_field', 'This field is required.')}</Text>
          )}

          <Text style={styles.label}>{t('city', 'City')}</Text>
          <TextInput
            style={[styles.input, errorFields.city && styles.errorInput]}
            value={formData.city}
            editable={isEditing}
            onChangeText={(value) => handleInputChange('city', value)}
          />
          {errorFields.city && (
            <Text style={styles.errorText}>{t('required_field', 'This field is required.')}</Text>
          )}

          <Text style={styles.label}>{t('pin_code', 'Pin Code')}</Text>
          <TextInput
            style={[styles.input, errorFields.pincode && styles.errorInput]}
            value={formData.pincode}
            editable={isEditing}
            onChangeText={(value) => handleInputChange('pincode', value)}
          />
          {errorFields.pincode && (
            <Text style={styles.errorText}>{t('required_field', 'This field is required.')}</Text>
          )}

          <Text style={styles.label}>{t('district', 'District')}</Text>
          <TextInput
            style={[styles.input, errorFields.district && styles.errorInput]}
            value={formData.district}
            editable={isEditing}
            onChangeText={(value) => handleInputChange('district', value)}
          />
          {errorFields.district && (
            <Text style={styles.errorText}>{t('required_field', 'This field is required.')}</Text>
          )}

          <Text style={styles.label}>{t('state', 'State')}</Text>
          <TextInput
            style={[styles.input, errorFields.state && styles.errorInput]}
            value={formData.state}
            editable={isEditing}
            onChangeText={(value) => handleInputChange('state', value)}
          />
          {errorFields.state && (
            <Text style={styles.errorText}>{t('required_field', 'This field is required.')}</Text>
          )}
        </View>

        <View style={styles.horizantalLine} />
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('skill_details', 'Skill Details')}</Text>

          <Text style={styles.label}>{t('select_service_category', 'Select Service Category')}</Text>
          <Dropdown
            style={[styles.dropdown, errorFields.skillCategory && styles.errorInput]}
            containerStyle={styles.dropdownContainer}
            data={skillCategoryItems}
            disable={true}
            placeholderStyle={styles.placeholderStyle}
            labelField="label" 
            selectedTextStyle={styles.selectedTextStyle}
            iconStyle={styles.iconStyle}
            inputSearchStyle={styles.inputSearchStyle}
            valueField="value"
            placeholder={t('select_service_category', 'Select Service Category')}
            value={formData.skillCategory}
            onChange={(item) => handleInputChange('skillCategory', item.value)}
            renderRightIcon={() => (
              <FontAwesome name="chevron-down" size={14} color="#9e9e9e" />
            )}
            renderItem={(item) => (
              <View style={styles.dropdownItem}>
                <Text style={styles.dropdownItemText}>
                  {t(`service_${item.id}`, item.label)}
                </Text>
              </View>
            )}
          />
          {errorFields.skillCategory && (
            <Text style={styles.errorText}>{t('required_field', 'This field is required.')}</Text>
          )}

          <View style={[styles.checkboxGrid, formData.subSkills.length > 0 && styles.checked]}>
            {Object.keys(groupedSubServices).map((categoryName) => (
              <View key={categoryName} style={{ marginBottom: 16 }}>
                <Text style={styles.checkboxCategoryTitle}>{groupedSubServices[categoryName][0].value}</Text>
                {groupedSubServices[categoryName].map((item) => (
                  <View key={item.tag} style={styles.checkboxContainer}>
                    <Checkbox
                      status={formData.subSkills.includes(item.label) ? 'checked' : 'unchecked'}
                      onPress={() => { if (isEditing) handleCheckboxChange(item.label); }}
                      color="#FF5722"
                    />
                    <Text style={styles.label}>{item.tag}</Text> 
                  </View>
                ))}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.horizantalLine} />

        <View style={{ marginBottom: 30 }}>
          {loading ? (
            <ActivityIndicator size="large" color="#FF5722" style={{ marginVertical: 20 }} />
          ) : isEditing ? (
            <SwipeButton
              forceReset={(reset) => {}}
              title={t('submit_to_commander', 'Submit to Commander')}
              titleStyles={{ color: titleColor, fontSize: 16 }}
              railBackgroundColor="#ffffff"
              railBorderColor="#EFDCCB"
              height={50}
              railStyles={{
                borderRadius: 25,
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
                handleSubmit();
                setTitleColor('#FF5722');
                setSwiped(true);
              }}
              onSwipeFail={() => setTitleColor('#FF5722')}
            />
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
};

// Compute grouped sub-services by category
const groupedSubServices = (subServices) =>
  subServices.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

/**
 * Dynamic styles generator that accepts screen width and isDarkMode flag.
 */
function dynamicStyles(width, isDarkMode) {
  const isTablet = width >= 600;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#121212' : '#FFFFFF',
      paddingBottom: 0,
    },
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: isDarkMode ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 999,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: isTablet ? 20 : 16,
      paddingBottom: isTablet ? 14 : 12,
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.5,
      shadowRadius: 5,
      backgroundColor: isDarkMode ? '#1f1f1f' : '#FFFFFF',
      position: 'relative',
      zIndex: 1,
    },
    backButton: {
      // position: 'absolute',
      left: isTablet ? 20 : 16,
    },
    headerTitle: {
      flex: 1,
      textAlign: 'center',
      fontSize: isTablet ? 22 : 20,
      fontWeight: 'bold',
      color: isDarkMode ? '#ffffff' : '#1D2951',
    },
    editButton: {
      position: 'absolute',
      right: isTablet ? 20 : 16,
    },
    scrollContainer: {
      flex: 1,
      paddingBottom: 0,
      backgroundColor: isDarkMode ? '#121212' : '#FFFFFF',
    },
    section: {
      backgroundColor: isDarkMode ? '#1f1f1f' : '#FFFFFF',
      padding: isTablet ? 24 : 20,
      borderRadius: 10,
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: isTablet ? 20 : 18,
      fontWeight: 'bold',
      marginBottom: 10,
      color: isDarkMode ? '#ffffff' : '#1D2951',
    },
    label: {
      marginBottom: 5,
      color: isDarkMode ? '#cccccc' : '#666',
      fontSize: isTablet ? 16 : 14,
    },
    input: {
      height: isTablet ? 45 : 40,
      borderColor: '#E0E0E0',
      borderWidth: 1,
      borderRadius: 5,
      paddingHorizontal: 10,
      marginBottom: 15,
      color: isDarkMode ? '#ffffff' : '#212121',
      fontSize: isTablet ? 16 : 14,
    },
    errorInput: {
      borderColor: '#FF4500',
    },
    errorText: {
      color: '#FF4500',
      fontSize: isTablet ? 14 : 12,
      marginBottom: 10,
    },
    placeholderStyle: {
      color: isDarkMode ? '#cccccc' : '#212121',
    },
    dropdown: {
      height: isTablet ? 45 : 40,
      borderColor: '#E0E0E0',
      borderWidth: 1,
      borderRadius: 5,
      paddingHorizontal: 10,
      marginBottom: 15,
      backgroundColor: isDarkMode ? '#333333' : '#FFFFFF',
    },
    dropdownContainer: {
      marginBottom: 20,
      backgroundColor: isDarkMode ? '#1f1f1f' : '#FFFFFF',
      borderRadius: 5,
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
    },
    selectedTextStyle: {
      color: isDarkMode ? '#ffffff' : '#212121',
      fontSize: isTablet ? 16 : 14,
    },
    iconStyle: {
      width: isTablet ? 24 : 20,
      height: isTablet ? 24 : 20,
    },
    inputSearchStyle: {
      fontSize: isTablet ? 16 : 14,
    },
    dropdownItem: {
      padding: 10,
      backgroundColor: isDarkMode ? '#1f1f1f' : '#FFFFFF',
    },
    dropdownItemText: {
      fontSize: 16,
      color: isDarkMode ? '#ffffff' : '#333',
    },
    row: {
      flexDirection: 'row',
      gap: isTablet ? 40 : 30,
      marginBottom: 15,
    },
    genderRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    radioText: {
      fontSize: isTablet ? 16 : 14,
      marginLeft: 2,
      color: isDarkMode ? '#ffffff' : '#212121',
      fontWeight: 'bold',
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
      padding: isTablet ? 12 : 10,
      marginRight: 10,
      backgroundColor: isDarkMode ? '#333333' : '#FFFFFF',
    },
    flagIcon: {
      width: isTablet ? 24 : 20,
      height: isTablet ? 24 : 20,
      marginRight: 5,
    },
    inputPhone: {
      flex: 1,
      height: isTablet ? 45 : 40,
      borderColor: '#E0E0E0',
      borderWidth: 1,
      borderRadius: 5,
      paddingHorizontal: 10,
      color: isDarkMode ? '#ffffff' : '#212121',
      fontSize: isTablet ? 16 : 14,
      backgroundColor: isDarkMode ? '#333333' : '#FFFFFF',
    },
    horizantalLine: {
      height: 2,
      width: '100%',
      backgroundColor: isDarkMode ? '#555555' : '#F5F5F5',
      marginVertical: isTablet ? 16 : 12,
    },
    checkboxGrid: {
      flexDirection: 'column',
    },
    checkboxCategoryTitle: {
      fontWeight: 'bold',
      fontSize: isTablet ? 18 : 16,
      marginVertical: 8,
      color: isDarkMode ? '#ffffff' : '#000',
    },
    checkboxContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    uploadContainer: {
      flexDirection: 'column',
    },
    imagePreview: {
      width: isTablet ? 90 : 80,
      height: isTablet ? 90 : 80,
      borderRadius: 50,
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
    serviceTimeLineContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    sectionPaymentTitle: {
      fontSize: isTablet ? 20 : 16,
      fontWeight: 'bold',
      color: isDarkMode ? '#ffffff' : '#212121',
      marginBottom: 8,
      paddingLeft: isTablet ? 14 : 10,
    },
    paymentInnerContainer: {
      padding: isTablet ? 12 : 10,
      backgroundColor: isDarkMode ? '#333333' : '#f5f5f5',
      marginTop: 10,
      marginBottom: 10,
    },
    PaymentItemContainer: {
      paddingLeft: isTablet ? 20 : 16,
      flexDirection: 'column',
      gap: 5,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: 20,
    },
    doneButton: {
      borderWidth: 1,
      borderColor: '#FF5722',
      backgroundColor: isDarkMode ? '#333333' : '#ffffff',
      paddingVertical: isTablet ? 12 : 10,
      borderRadius: 10,
      alignItems: 'center',
      marginTop: 10,
      width: isTablet ? '40%' : '60%',
    },
    doneText: {
      color: '#FF5722',
      fontSize: isTablet ? 16 : 15,
      fontWeight: 'bold',
    },
    swipeButton: {
      marginHorizontal: isTablet ? 24 : 20,
      marginBottom: isTablet ? 20 : 10,
    },
    thumbContainer: {
      width: isTablet ? 55 : 50,
      height: isTablet ? 55 : 50,
      borderRadius: isTablet ? 27.5 : 25,
      backgroundColor: '#EFDCCB',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#ddd',
    },
    checkIcon: {
      alignSelf: 'center',
    },
  });
}

export default RegistrationScreen;

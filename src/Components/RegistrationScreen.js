import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { Dropdown } from 'react-native-element-dropdown';
import { RadioButton, Checkbox } from 'react-native-paper';
import { launchImageLibrary } from 'react-native-image-picker';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import SwipeButton from 'rn-swipe-button';
import Entypo from 'react-native-vector-icons/Entypo';
import axios from 'axios';
import EncryptedStorage from 'react-native-encrypted-storage';
import { useNavigation } from '@react-navigation/native';
import { useWindowDimensions } from 'react-native';
// Import the theme hook from your context
import { useTheme } from '../context/ThemeContext';

const RegistrationScreen = () => {
  const { width } = useWindowDimensions();
  const { isDarkMode } = useTheme();
  const styles = dynamicStyles(width, isDarkMode);

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
  const [swiped, setSwiped] = useState(false);
  const [subServices, setSubServices] = useState([]);
  const [titleColor, setTitleColor] = useState('#FF5722');
  const [errorFields, setErrorFields] = useState({});
  const [skillCategoryItems, setSkillCategoryItems] = useState([
    { label: 'Electrician', value: 'electrician' },
    { label: 'Plumber', value: 'plumber' },
    { label: 'Carpenter', value: 'carpenter' },
  ]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const navigation = useNavigation();

  const educationItems = [
    { label: 'High School', value: 'highschool' },
    { label: "Bachelor's", value: 'bachelor' },
    { label: "Master's", value: 'master' },
  ];

  const experienceItems = [
    { label: '0-1 Year', value: '0-1' },
    { label: '1-3 years', value: '1-3' },
    { label: 'more than 3 years', value: '3+' },
  ];

  const ThumbIcon = () => (
    <View style={styles.thumbContainer}>
      <Text>
        {swiped ? (
          <Entypo name="check" size={20} color="#FF5722" style={styles.checkIcon} />
        ) : (
          <FontAwesome6 name="arrow-right-long" size={18} color="#FF5722" />
        )}
      </Text>
    </View>
  );

  const handleCheckboxChange = serviceName => {
    const isChecked = formData.subSkills.includes(serviceName);
    const updatedSubSkills = isChecked
      ? formData.subSkills.filter(skill => skill !== serviceName)
      : [...formData.subSkills, serviceName];
    setFormData({ ...formData, subSkills: updatedSubSkills });
  };

  const uploadImage = async uri => {
    const apiKey = '287b4ba48139a6a59e75b5a8266bbea2';
    const apiUrl = 'https://api.imgbb.com/1/upload';

    const imageData = new FormData();
    imageData.append('key', apiKey);
    imageData.append('image', {
      uri,
      type: 'image/jpeg',
      name: 'photo.jpg',
    });

    const response = await fetch(apiUrl, {
      method: 'POST',
      body: imageData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload image.');
    }
    const data = await response.json();
    return data.data.url;
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleSubmit = async () => {
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
      return;
    }
    try {
      const pcsToken = await EncryptedStorage.getItem('pcs_token');
      if (!pcsToken) {
        console.error('No pcs_token found.');
        navigation.replace('Login');
        return;
      }
      const response = await axios.post(
        'https://backend.clicksolver.com/api/registration/submit',
        formData,
        {
          headers: {
            Authorization: `Bearer ${pcsToken}`,
          },
        },
      );
      if (response.status === 200) {
        navigation.replace('PartnerSteps');
      }
    } catch (error) {
      console.error('Error submitting registration:', error);
    }
  };

  const fetchServices = async () => {
    try {
      const pcsToken = await EncryptedStorage.getItem('pcs_token');
      if (!pcsToken) {
        console.error('No pcs_token found.');
        navigation.replace('Login');
        return;
      }
      const response = await axios.get(
        'https://backend.clicksolver.com/api/service/categories',
        {
          headers: {
            Authorization: `Bearer ${pcsToken}`,
          },
        },
      );
      console.log('pcsToken', pcsToken);
      console.log('phone', response.data[0].phone_numbers[0]);
      setPhoneNumber(response.data[0].phone_numbers[0]);
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
        const { uri } = response.assets[0];
        try {
          const imageUrl = await uploadImage(uri);
          handleInputChange(fieldName, imageUrl);
        } catch (error) {
          Alert.alert('Error', 'Failed to upload image.');
          console.error(error);
        }
      }
    });
  };

  const handleInputChange = async (field, value) => {
    setFormData({ ...formData, [field]: value });
    setErrorFields(prev => ({ ...prev, [field]: false }));

    if (field === 'skillCategory') {
      try {
        const response = await axios.post(
          'https://backend.clicksolver.com/api/subservice/checkboxes',
          {
            selectedService: value,
          },
        );
        const data = response.data;
        const mappedData = data.map(item => ({
          id: item.service_id,
          label: item.service_tag,
        }));
        setSubServices(mappedData);
      } catch (error) {
        console.error('Error fetching subservices:', error);
        Alert.alert('Error', 'Failed to fetch service category data.');
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity>
          <FontAwesome6
            name="arrow-left-long"
            size={20}
            color={isDarkMode ? '#ffffff' : '#333'}
            style={styles.leftIcon}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Registration</Text>
      </View>
      <ScrollView>
        {/* Personal Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Details</Text>

          <Text style={styles.label}>First Name</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, errorFields.firstName && styles.errorInput]}
              value={formData.firstName}
              onChangeText={value => handleInputChange('firstName', value)}
            />
            {errorFields.firstName && (
              <Text style={styles.errorText}>This field is required.</Text>
            )}
          </View>

          <Text style={styles.label}>Last Name</Text>
          <View>
            <TextInput
              style={[styles.input, errorFields.lastName && styles.errorInput]}
              value={formData.lastName}
              onChangeText={value => handleInputChange('lastName', value)}
            />
            {errorFields.lastName && (
              <Text style={styles.errorText}>This field is required.</Text>
            )}
          </View>

          <Text style={styles.label}>Gender</Text>
          <View style={styles.row}>
            <View style={styles.genderRow}>
              <RadioButton
                value="male"
                status={formData.gender === 'male' ? 'checked' : 'unchecked'}
                onPress={() => handleInputChange('gender', 'male')}
                color="#FF5722"
              />
              <Text style={styles.radioText}>Male</Text>
            </View>
            <View style={styles.genderRow}>
              <RadioButton
                value="female"
                status={formData.gender === 'female' ? 'checked' : 'unchecked'}
                onPress={() => handleInputChange('gender', 'female')}
                color="#FF5722"
              />
              <Text style={styles.radioText}>Female</Text>
            </View>
          </View>

          <Text style={styles.label}>Work Experience (Years)</Text>
          <View style={styles.inputContainer}>
            <Dropdown
              style={[styles.dropdown, errorFields.workExperience && styles.errorInput]}
              containerStyle={styles.dropdownContainer}
              data={experienceItems}
              placeholderStyle={styles.placeholderStyle}
              labelField="label"
              selectedTextStyle={styles.selectedTextStyle}
              iconStyle={styles.iconStyle}
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
          </View>

          <Text style={styles.label}>Age</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, errorFields.dob && styles.errorInput]}
              value={formData.dob}
              onChangeText={value => handleInputChange('dob', value)}
            />
            {errorFields.dob && (
              <Text style={styles.errorText}>This field is required.</Text>
            )}
          </View>

          <Text style={styles.label}>Education</Text>
          <View style={styles.inputContainer}>
            <Dropdown
              style={[styles.dropdown, errorFields.education && styles.errorInput]}
              containerStyle={styles.dropdownContainer}
              data={educationItems}
              placeholderStyle={styles.placeholderStyle}
              labelField="label"
              selectedTextStyle={styles.selectedTextStyle}
              iconStyle={styles.iconStyle}
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
          </View>

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

        {/* Address / Residential Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Address / Residential Details</Text>
          <Text style={styles.label}>Door-No/Street</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, errorFields.doorNo && styles.errorInput]}
              value={formData.doorNo}
              onChangeText={value => handleInputChange('doorNo', value)}
            />
            {errorFields.doorNo && (
              <Text style={styles.errorText}>This field is required.</Text>
            )}
          </View>
          <Text style={styles.label}>Landmark</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, errorFields.landmark && styles.errorInput]}
              value={formData.landmark}
              onChangeText={value => handleInputChange('landmark', value)}
            />
            {errorFields.landmark && (
              <Text style={styles.errorText}>This field is required.</Text>
            )}
          </View>
          <Text style={styles.label}>City</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, errorFields.city && styles.errorInput]}
              value={formData.city}
              onChangeText={value => handleInputChange('city', value)}
            />
            {errorFields.city && (
              <Text style={styles.errorText}>This field is required.</Text>
            )}
          </View>
          <Text style={styles.label}>Pin Code</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, errorFields.pincode && styles.errorInput]}
              value={formData.pincode}
              onChangeText={value => handleInputChange('pincode', value)}
            />
            {errorFields.pincode && (
              <Text style={styles.errorText}>This field is required.</Text>
            )}
          </View>
          <Text style={styles.label}>District</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, errorFields.district && styles.errorInput]}
              value={formData.district}
              onChangeText={value => handleInputChange('district', value)}
            />
            {errorFields.district && (
              <Text style={styles.errorText}>This field is required.</Text>
            )}
          </View>
          <Text style={styles.label}>State</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, errorFields.state && styles.errorInput]}
              value={formData.state}
              onChangeText={value => handleInputChange('state', value)}
            />
            {errorFields.state && (
              <Text style={styles.errorText}>This field is required.</Text>
            )}
          </View>
        </View>

        {/* Skill Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skill Details</Text>
          <Text style={styles.label}>Select Service Category</Text>
          <View>
            <Dropdown
              style={[styles.dropdown, errorFields.skillCategory && styles.errorInput]}
              containerStyle={styles.dropdownContainer}
              data={skillCategoryItems}
              placeholderStyle={styles.placeholderStyle}
              labelField="label"
              selectedTextStyle={styles.selectedTextStyle}
              iconStyle={styles.iconStyle}
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
          </View>
          <View style={styles.checkboxGrid}>
            {subServices.map(item => (
              <View key={item.id} style={styles.checkboxContainer}>
                <Checkbox
                  status={
                    formData.subSkills.includes(item.label)
                      ? 'checked'
                      : 'unchecked'
                  }
                  onPress={() => handleCheckboxChange(item.label)}
                  color="#FF5722"
                />
                <Text style={styles.label}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Upload Details */}
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
                    source={{ uri: formData.profileImageUri }}
                    style={styles.imagePreview}
                  />
                )}
              </View>
              <View style={styles.image2}>
                {formData.proofImageUri && (
                  <Image
                    source={{ uri: formData.proofImageUri }}
                    style={styles.imagePreview}
                  />
                )}
              </View>
            </View>
            <View style={styles.imageUpload}>
              <View>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={() => handleImagePick('profileImageUri')}
                >
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
                  onPress={() => handleImagePick('proofImageUri')}
                >
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

        <View style={styles.swiperButton}>
          <SwipeButton
            forceReset={reset => {
              forceResetButton = reset;
            }}
            title="Submit to Commander"
            titleStyles={{ color: titleColor, fontSize: 16 }}
            railBackgroundColor="#FF5722"
            railBorderColor="#FF5722"
            railStyles={{
              borderRadius: 25,
              height: 50,
              backgroundColor: '#FFFFFF',
              borderColor: '#FF572200',
            }}
            thumbIconComponent={ThumbIcon}
            thumbIconBackgroundColor="#FFFFFF"
            thumbIconBorderColor="#FFFFFF"
            thumbIconWidth={50}
            thumbIconHeight={50}
            onSwipeStart={() => setTitleColor('black')}
            onSwipeSuccess={() => {
              handleSubmit();
              setTitleColor('#FFFFFF');
              setSwiped(true);
            }}
            onSwipeFail={() => setTitleColor('#FFFFFF')}
          />
        </View>
      </ScrollView>
    </View>
  );
};

function dynamicStyles(width, isDarkMode) {
  const isTablet = width >= 600;
  return StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      backgroundColor: isDarkMode ? '#121212' : '#F5F5F5',
    },
    placeholderStyle: {
      color: isDarkMode ? '#cccccc' : '#9e9e9e',
    },
    inputContainer: {
      marginBottom: 15,
      backgroundColor: isDarkMode ? '#333333' : '#F5F5F5',
      borderRadius: 10,
      borderColor: isDarkMode ? '#444444' : '#ccc',
      borderWidth: 1,
      paddingHorizontal: 10,
      height: 50,
      justifyContent: 'center',
    },
    uploadContainer: {
      flexDirection: 'column',
    },
    imagePreview: {
      width: 80,
      height: 80,
      borderRadius: 50,
    },
    leftIcon: {
      position: 'absolute',
      left: 10,
    },
    imageUpload: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%',
    },
    errorInput: {
      borderColor: '#FF4500',
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
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    radioText: {
      fontSize: 16,
      marginLeft: 2,
      color: isDarkMode ? '#ffffff' : '#212121',
      fontWeight: 'bold',
    },
    checkboxContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 12,
    },
    genderRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    header: {
      marginBottom: 20,
    },
    iconStyle: {
      width: 20,
      height: 20,
    },
    headerTitle: {
      fontSize: isTablet ? 24 : 20,
      fontWeight: 'bold',
      marginLeft: 10,
      color: isDarkMode ? '#ffffff' : '#1D2951',
      textAlign: 'center',
    },
    dropdownItem: {
      padding: 10,
      backgroundColor: isDarkMode ? '#333333' : '#ffffff',
    },
    dropdownItemText: {
      fontSize: 16,
      color: isDarkMode ? '#ffffff' : '#333333',
    },
    section: {
      marginBottom: 20,
      backgroundColor: isDarkMode ? '#333333' : '#ffffff',
      padding: 15,
      borderRadius: 10,
    },
    sectionTitle: {
      fontSize: isTablet ? 20 : 18,
      fontWeight: 'bold',
      marginBottom: 10,
      color: isDarkMode ? '#ffffff' : '#1D2951',
    },
    label: {
      marginBottom: 5,
      color: isDarkMode ? '#cccccc' : '#666666',
    },
    input: {
      height: 40,
      borderColor: isDarkMode ? '#444444' : '#E0E0E0',
      borderWidth: 1,
      borderRadius: 5,
      paddingHorizontal: 10,
      color: isDarkMode ? '#ffffff' : '#212121',
    },
    selectedTextStyle: {
      color: isDarkMode ? '#cccccc' : '#9e9e9e',
    },
    dropdown: {
      height: 40,
      borderColor: isDarkMode ? '#444444' : '#E0E0E0',
      borderWidth: 1,
      borderRadius: 5,
      paddingHorizontal: 10,
      backgroundColor: isDarkMode ? '#333333' : '#ffffff',
    },
    dropdownContainer: {
      marginBottom: 20,
      backgroundColor: isDarkMode ? '#333333' : '#ffffff',
      borderRadius: 5,
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
    },
    row: {
      flexDirection: 'row',
      gap: 30,
      marginBottom: 15,
    },
    phoneContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 15,
    },
    countryCode: {
      flexDirection: 'row',
      alignItems: 'center',
      borderColor: isDarkMode ? '#444444' : '#E0E0E0',
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
    swiperButton: {
      marginBottom: 10,
    },
    inputPhone: {
      flex: 1,
      height: 40,
      borderColor: isDarkMode ? '#444444' : '#E0E0E0',
      borderWidth: 1,
      borderRadius: 5,
      paddingHorizontal: 10,
      color: isDarkMode ? '#ffffff' : '#212121',
    },
    uploadButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 10,
      borderWidth: 1,
      borderColor: isDarkMode ? '#444444' : '#9e9e9e',
      borderRadius: 5,
      marginBottom: 10,
      width: 130,
    },
    fileText: {
      color: isDarkMode ? '#ffffff' : '#212121',
      fontWeight: 'bold',
    },
  });
}

export default RegistrationScreen;

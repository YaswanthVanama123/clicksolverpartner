import {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Button,
  TouchableOpacity,
} from 'react-native';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import EncryptedStorage from 'react-native-encrypted-storage';
import axios from 'axios';
import {useNavigation} from '@react-navigation/native'; // Import navigation hook

const Profile = () => {
  const [profileDetails, SetProfileDetails] = useState([]);
  const [tokenExists, setTokenExists] = useState(true); // State to track if token exists
  const navigation = useNavigation(); // Access navigation

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = await EncryptedStorage.getItem('pcs_token');
        if (!token) {
          setTokenExists(false); // If no token, update the state
          return; // Exit early
        }

        const response = await axios.get(
          `https://backend.clicksolver.com/api/worker/profile/details`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        SetProfileDetails(response.data[0]);
        console.log(response.data);
      } catch (error) {
        console.error('Error fetching profile data:', error);
      }
    };

    fetchProfile();
  }, []);

  const formatDate = created_at => {
    const date = new Date(created_at);
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    const day = date.getDate();
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${month} ${String(day).padStart(2, '0')}, ${year}`;
  };

  const handleLogout = async () => {
    try {
      await EncryptedStorage.removeItem('pcs_token');
      await EncryptedStorage.removeItem('partnerSteps');
      await EncryptedStorage.removeItem('start_time');
      await EncryptedStorage.removeItem('notifications');
      navigation.replace('Login');
      // Update state to reflect the logout
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Navigate to login screen when the login button is pressed
  const handleLoginPress = () => {
    navigation.navigate('Login'); // Replace 'Login' with the correct route name
  };

  // Conditionally render login button if no token exists
  if (!tokenExists) {
    return (
      <View style={styles.container}>
        <View style={styles.loginContainer}>
          <View style={styles.imageContainer}>
            <Image
              source={{
                uri: 'https://i.postimg.cc/jSJS7rDH/1727646707169dp7gkvhw.png',
              }} // Replace with your worker image URL or local asset
              style={styles.workerImage}
            />
          </View>
          <Text style={styles.loginMessage}>
            Please Login, you are currently not logined
          </Text>
          <TouchableOpacity
            style={styles.arrivalButton}
            onPress={handleLoginPress}>
            <Text style={styles.arrivalButtonText}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <FontAwesome6
          name="arrow-left-long"
          size={20}
          color="#9e9e9e"
          style={styles.leftIcon}
        />
        <Text style={styles.screenName}>Profile</Text>
      </View>
      <View style={styles.profileSection}>
        <View style={styles.profileImageContainer}>
          <Image
            source={{uri: profileDetails.profile}}
            style={styles.profileImage}
          />
        </View>
        <Text style={styles.profileName}>{profileDetails.name}</Text>
      </View>
      <Text style={styles.sectionTitle}>Personal Details</Text>
      <View style={styles.section}>
        <View style={styles.detailRow}>
          <View>
            <Text style={styles.detailLabel}>Contact No.</Text>
            <Text style={styles.detailValue}>
              {profileDetails.phone_number}
            </Text>
          </View>
          <View>
            <Text style={styles.detailLabel}>Gender</Text>
            <Text style={styles.detailValue}>Male</Text>
          </View>
        </View>
      </View>
      <Text style={styles.sectionTitle}>Professional Details</Text>
      <View style={styles.section}>
        <Text style={styles.subSectionTitle}>Service Providing</Text>
        <Text style={styles.detailValueBold}>{profileDetails.service}</Text>
        <Text style={styles.subSectionTitle}>Sub Service Providing</Text>
        <View style={styles.listItem}>
          {profileDetails.subservices?.map((subservice, index) => (
            <Text key={index} style={styles.detailValue}>
              {subservice}
            </Text>
          ))}
        </View>
      </View>
      <Text style={styles.sectionTitle}>Account Created</Text>
      <View style={styles.section}>
        <View style={styles.detailColumn}>
          <Text style={styles.detailLabel}>Created At</Text>
          <Text style={styles.detailValue}>
            {formatDate(profileDetails.created_at)}
          </Text>
        </View>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.doneButton} onPress={handleLogout}>
          <Text style={styles.doneText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,

    backgroundColor: '#fafafa',
    // justifyContent: 'center',
    // alignItems: 'center',
  },
  buttonContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 30,
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
  imageContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  workerImage: {
    height: 200,
    width: 150,
  },
  arrivalButton: {
    borderColor: '#FF5722',
    backgroundColor: '#FF5722',
    borderWidth: 1,
    borderRadius: 5,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
    marginHorizontal: 45,
  },
  arrivalButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  ProfileHead: {
    fontSize: 20,
    color: '#212121',
    fontWeight: 'bold',
    paddingBottom: 20,
  },
  loginContainer: {
    padding: 20,
  },
  loginMessage: {
    fontSize: 18,
    color: '#212121',
    marginBottom: 20,
    textAlign: 'center',
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    position: 'relative',
  },
  headerText: {
    marginLeft: 8,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#747676',
  },
  profileSection: {
    alignItems: 'center',
    padding: 16,
  },
  leftIcon: {
    position: 'absolute',
    left: 10,
  },
  screenName: {
    color: '#747476',
    fontSize: 17,
    fontWeight: 'bold',
  },
  profileImageContainer: {
    height: 80,
    width: 80,
    borderRadius: 40,
    backgroundColor: '#d3d3d3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImage: {
    height: 80,
    width: 80,
    borderRadius: 40,
    backgroundColor: '#c0c0c0',
  },
  profileName: {
    marginTop: 8,
    fontSize: 17,
    fontWeight: 'bold',
    color: '#212121',
  },
  section: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 10,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 8,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  subSectionTitle: {
    fontSize: 17,
    fontWeight: '400',
    color: '#9e9e9e',
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 10,
    elevation: 5,
  },
  detailColumn: {
    flexDirection: 'column',
  },
  detailLabel: {
    fontSize: 17,
    color: '#9e9e9e',
  },
  detailValue: {
    fontSize: 17,
    color: '#212121',
    marginVertical: 2,
  },
  detailValueBold: {
    fontSize: 17,
    color: '#212121',
    marginVertical: 2,
    fontWeight: 'bold',
  },
  listItem: {
    marginLeft: 16,
    marginTop: 4,
  },
});

export default Profile;

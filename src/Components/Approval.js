import axios from 'axios';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  Easing,
  Modal,
  Linking,
  Image,
  ScrollView,
} from 'react-native';
import EncryptedStorage from 'react-native-encrypted-storage';
import { RadioButton } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, CommonActions, useFocusEffect } from '@react-navigation/native';
import { useWindowDimensions } from 'react-native';
import messaging from '@react-native-firebase/messaging'; // Firebase messaging for react-native-cli
import { useTheme } from '../context/ThemeContext';

const ApprovalStatusScreen = () => {
  const { width } = useWindowDimensions();
  const { isDarkMode } = useTheme();
  const styles = dynamicStyles(width, isDarkMode);
  
  const [profile, setProfile] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showLogout, setShowLogout] = useState(false);
  const [userName, setUserName] = useState('');
  const [userService, setUserService] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('');
  const [issues, setIssues] = useState([]);
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const rotation = useState(new Animated.Value(0))[0];
  const navigation = useNavigation();

  const statuses = [
    'Mobile Number Verified',
    'Details Verified',
    'Profile and Proof Verified',
    'Bank account Verified',
  ];

  // Function to fetch approval details from backend
  const fetchApprovalDetails = async () => {
    try {
      const pcs_token = await EncryptedStorage.getItem('pcs_token');
      if (!pcs_token) {
        throw new Error('PCS token is missing.');
      }
      const response = await axios.post(
        'http://192.168.55.106:5000/api/check/approval/verification/status',
        {},
        {
          headers: {
            Authorization: `Bearer ${pcs_token}`,
          },
        },
      );
      console.log("status",response.status)
      if (response.status === 201) {
        await EncryptedStorage.setItem('verification', 'true');
        navigation.dispatch(
          CommonActions.reset({ 
            index: 0,
            routes: [{ name: 'Tabs', state: { routes: [{ name: 'Home' }] } }],
          }),
        );
      } else if (response.status === 200) {
        const { data } = response;
        console.log(data);
        setProfile(data.profile);
        setUserName(data.name || '');
        setUserService(data.service || '');
        setVerificationStatus(data.verification_status || '');
        setIssues(Array.isArray(data.issues) ? data.issues : []);
      }
    } catch (error) {
      console.error('Error fetching approval status data:', error);
      setIssues([]); // Reset issues on error
    }
  };

  // Fetch approval details every time the screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchApprovalDetails();
    }, [])
  );

  // Listen for incoming Firebase notifications while on this screen.
  useEffect(() => {
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('FCM notification received in ApprovalStatusScreen:', remoteMessage);
      if (remoteMessage.data && remoteMessage.data.screen === "ApprovalScreen") {
        console.log('Notification data.screen equals "ApprovalScreen". Refreshing data...');
        fetchApprovalDetails();
      }
    });
    return unsubscribe;
  }, []);

  // Build timeline data. A radio button is shown only when:
  // - The status index is higher than the current verification status index.
  // - There is a pending issue for that status.
  const getTimelineData = useMemo(() => {
    const currentStatusIndex = statuses.indexOf(verificationStatus);
    return statuses.map((status, index) => {
      // Check if there's a pending issue for the specific status category
      const pendingIssue = Array.isArray(issues) && issues.find(
        issue => issue.category === status && issue.status === "pending"
      );
      return {
        title: status,
        iconColor: index <= currentStatusIndex ? '#ff4500' : '#a1a1a1',
        lineColor: index < currentStatusIndex ? '#ff4500' : '#a1a1a1',
        isSelectable: index > currentStatusIndex && !!pendingIssue,
      };
    });
  }, [verificationStatus, issues]);

  // Separate issues into pending and changed (non-pending)
  const pendingIssues = issues.filter(issue => issue.status === "pending");
  const changedIssues = issues.filter(issue => issue.status !== "pending");

  const toggleLogout = () => setShowLogout(prev => !prev);

  const handleLogout = async () => {
    try {
      await EncryptedStorage.removeItem('partnerSteps');
      await EncryptedStorage.removeItem('start_time');
      await EncryptedStorage.removeItem('notifications');
      await EncryptedStorage.removeItem('workerPreviousLocation');
      await EncryptedStorage.removeItem('Requestnotifications');
      await EncryptedStorage.removeItem('verification');
      await EncryptedStorage.removeItem('sign_up');
      await EncryptedStorage.removeItem('start_work_time');
      await EncryptedStorage.removeItem('fcm_token');
      navigation.replace('Login');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const handleSetupChange = () => {
    if (selectedStatus) {
      if (
        selectedStatus === 'Details Verified' ||
        selectedStatus === 'Profile and Proof Verified'
      ) {
        navigation.push('WorkerProfile', { selectedStatus });
      } else if (selectedStatus === 'Bank account Verified') {
        navigation.push('BankAccountScreen', { selectedStatus });
      }
    }
  };

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const openHelpModal = () => setHelpModalVisible(true);
  const closeHelpModal = () => setHelpModalVisible(false);

  const handleCall = () => {
    Linking.openURL('tel:7981793632');
    closeHelpModal();
  };

  const handleEmail = () => {
    Linking.openURL('mailto:support@example.com');
    closeHelpModal();
  };

  const handleRefreshStatus = async () => {
    setRefreshing(true);
    const animation = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    animation.start();
    await fetchApprovalDetails();
    animation.stop();
    rotation.setValue(0);
    setRefreshing(false);
  };

  // Button enabled only if there are pending issues and a radio option is selected
  const isSetupChangeEnabled = pendingIssues.length > 0 && selectedStatus;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Approval Status</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={openHelpModal}>
            <Text style={styles.helpText}>Help</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleLogout}>
            <Icon name="more-vert" size={24} color={isDarkMode ? '#dddddd' : '#1D2951'} />
          </TouchableOpacity>
        </View>
        {showLogout && (
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.profileContainer}>
          {profile ? 
            <View style={styles.profileImage}>
              <Image source={{ uri: profile }} style={styles.image} />
            </View> :          
            <View style={styles.profileCircle}>
              <Text style={styles.profileInitials}>
                {userName.charAt(0).toUpperCase()}
              </Text>
            </View>
          }
          <View style={styles.profileTextContainer}>
            <Text style={styles.userName}>{userName}</Text>
            <Text style={styles.userTitle}>{userService}</Text>
          </View>
        </View>
        <Text style={styles.statusText}>
          Your profile is under review by the administrator.
        </Text>
        {/* Refresh Icon */}
        <TouchableOpacity style={styles.refreshContainer} onPress={handleRefreshStatus}>
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Icon name="refresh" size={24} color={isDarkMode ? '#1D2951' : '#1D2951'} />
          </Animated.View>
          <Text style={styles.refreshText}>Refresh Status</Text>
        </TouchableOpacity>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}>
          <View style={styles.innerContainerLine}>
            {getTimelineData.map((item, index) => (
              <View key={index} style={styles.timelineItem}>
                <View style={{ alignItems: 'center' }}>
                  <MaterialCommunityIcons
                    name="circle"
                    size={14}
                    color={item.iconColor}
                    style={styles.timelineIcon}
                  />
                  {index !== getTimelineData.length - 1 && (
                    <View
                      style={[
                        styles.lineSegment,
                        { backgroundColor: item.lineColor },
                      ]}
                    />
                  )}
                </View>
                <View style={styles.timelineTextContainer}>
                  <Text style={styles.timelineText}>{item.title}</Text>
                </View>
                {item.isSelectable && (
                  <RadioButton
                    value={item.title}
                    status={selectedStatus === item.title ? 'checked' : 'unchecked'}
                    onPress={() => setSelectedStatus(item.title)}
                    color="#ff4500"
                    style={styles.radioButton}
                  />
                )}
              </View>
            ))}  
          </View>

          {/* Display Issues */}
          {pendingIssues.length > 0 && (
            <View style={styles.issuesContainer}>
              <Text style={styles.issuesTitle}>Pending Issues:</Text>
              {pendingIssues.map((issue, index) => (
                <Text key={index} style={styles.issueText}>
                  • {issue.description}
                </Text>
              ))}
            </View>
          )}

          {changedIssues.length > 0 && (
            <View style={styles.issuesContainer}>
              <Text style={styles.issuesTitle}>Resolved Issues:</Text>
              {changedIssues.map((issue, index) => (
                <Text key={index} style={styles.issueText}>
                  • {issue.description}
                </Text>
              ))}
            </View>
          )}

          <Text style={styles.noteText}>
            Please check back later or modify your profile if any issues are reported.
          </Text>
          <TouchableOpacity
            style={[
              styles.setupChangeButton,
              { opacity: isSetupChangeEnabled ? 1 : 0.5 }
            ]}
            onPress={handleSetupChange}
            disabled={!isSetupChangeEnabled}
          >
            <Text style={styles.setupChangeText}>Setup Change</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Floating Call Icon */}
      <TouchableOpacity style={styles.floatingButton} onPress={handleCall}>
        <Icon name="call" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Help Modal */}
      <Modal
        transparent={true}
        animationType="fade"
        visible={helpModalVisible}
        onRequestClose={closeHelpModal}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={closeHelpModal}>
          <View style={styles.modalContainer}>
            <TouchableOpacity style={styles.helpOptionButton} onPress={handleCall}>
              <Icon name="call" size={20} color="#fff" />
              <Text style={styles.helpOptionText}>Call Us</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.helpOptionButton} onPress={handleEmail}>
              <Icon name="mail" size={20} color="#fff" />
              <Text style={styles.helpOptionText}>Email Us</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={closeHelpModal}>
              <Text style={styles.helpOptionText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

function dynamicStyles(width, isDarkMode) {
  const isTablet = width >= 600;
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#121212' : '#ffffff',
    },
    headerContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 10,
      backgroundColor: isDarkMode ? '#333333' : '#f5f5f5',
    },
    headerText: {
      fontSize: isTablet ? 20 : 18,
      fontWeight: 'bold',
      color: isDarkMode ? '#ffffff' : '#1D2951',
      textAlign: 'center',
      flex: 1,
    },
    headerIcons: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    helpText: {
      fontSize: isTablet ? 15 : 14,
      color: '#FF5722',
      fontWeight: '500',
      marginRight: 10,
    },
    logoutButton: {
      backgroundColor: isDarkMode ? '#444444' : '#ffffff',
      padding: 10,
      width: 70,
      borderRadius: 5,
      elevation: 2,
      position: 'absolute',
      top: 50,
      right: 10,
    },
    logoutText: {
      color: isDarkMode ? '#ffffff' : '#4a4a4a',
      fontWeight: 'bold',
    },
    contentContainer: {
      flex: 1,
      padding: 16,
    },
    profileContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
      marginTop: 10,
    },
    image: {
      width: 60,
      height: 60,
      borderRadius: 30,
    },
    profileImage: {
      width: 60,
      height: 60,
      borderRadius: 30,
    },
    profileCircle: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: '#FF7A22',
      alignItems: 'center',
      justifyContent: 'center',
    },
    profileInitials: {
      fontSize: isTablet ? 20 : 18,
      fontWeight: 'bold',
      color: '#ffffff',
    },
    profileTextContainer: {
      marginLeft: 10,
    },
    userName: {
      fontSize: isTablet ? 20 : 18,
      fontWeight: 'bold',
      color: isDarkMode ? '#ffffff' : '#000000',
    },
    userTitle: {
      fontSize: isTablet ? 16 : 14,
      color: isDarkMode ? '#cccccc' : '#4a4a4a',
    },
    statusText: {
      fontSize: isTablet ? 16 : 14,
      color: isDarkMode ? '#eeeeee' : '#212121',
      marginBottom: 20,
      textAlign: 'center',
    },
    refreshContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: 10,
    },
    refreshText: {
      fontSize: isTablet ? 16 : 14,
      color: isDarkMode ? '#1D2951' : '#1D2951',
      marginLeft: 8,
      fontWeight: '500',
    },
    innerContainerLine: {
      paddingLeft: 16,
      marginBottom: 20,
      marginTop: 15,
    },
    timelineItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    timelineIcon: {
      marginBottom: 4,
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
      fontSize: isTablet ? 15 : 14,
      color: isDarkMode ? '#ffffff' : '#212121',
      fontWeight: 'bold',
    },
    radioButton: {
      marginRight: 16,
    },
    issuesContainer: {
      marginBottom: 20,
      padding: 15,
      backgroundColor: isDarkMode ? '#5a3c39' : '#FFE4E1',
      borderRadius: 10,
    },
    issuesTitle: {
      fontSize: isTablet ? 18 : 16,
      fontWeight: 'bold',
      color: '#ff4500',
      marginBottom: 5,
    },
    issueText: {
      fontSize: isTablet ? 15 : 14,
      color: isDarkMode ? '#ffffff' : '#212121',
    },
    noteText: {
      fontSize: isTablet ? 15 : 14,
      color: isDarkMode ? '#eeeeee' : '#212121',
      textAlign: 'center',
      marginVertical: 20,
    },
    setupChangeButton: {
      backgroundColor: '#FF5722',
      borderRadius: 20,
      paddingVertical: 12,
      paddingHorizontal: 32,
      alignSelf: 'center',
    },
    setupChangeText: {
      fontSize: isTablet ? 17 : 16,
      color: '#ffffff',
      fontWeight: 'bold',
    },
    floatingButton: {
      position: 'absolute',
      bottom: 20,
      right: 20,
      backgroundColor: '#FF5722',
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 5,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      backgroundColor: isDarkMode ? '#333333' : '#ffffff',
      borderRadius: 10,
      padding: 20,
      width: '80%',
      alignItems: 'center',
    },
    helpOptionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FF5722',
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 5,
      marginVertical: 5,
      width: '70%',
      justifyContent: 'center',
    },
    cancelButton: {
      paddingTop: 20,
    },
    helpOptionText: {
      color: '#fff',
      fontSize: isTablet ? 16 : 14,
      marginLeft: 10,
      fontWeight: 'bold',
    },
  });
}

export default ApprovalStatusScreen;

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TextInput,
  TouchableOpacity,
  Image,
} from 'react-native';

const VerificationScreen = () => {
  return (
    <ImageBackground
      source={require('./assets/background.jpg')} // <-- your single BG image
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        {/* Title */}
        <Text style={styles.title}>Verification Code</Text>

        {/* Instruction */}
        <Text style={styles.instruction}>
          Please enter the 4-digit code sent on +91 9392365494
        </Text>

        {/* 4 text inputs for the code */}
        <View style={styles.codeInputs}>
          <TextInput style={styles.codeInput} maxLength={1} keyboardType="numeric" />
          <TextInput style={styles.codeInput} maxLength={1} keyboardType="numeric" />
          <TextInput style={styles.codeInput} maxLength={1} keyboardType="numeric" />
          <TextInput style={styles.codeInput} maxLength={1} keyboardType="numeric" />
        </View>

        {/* Timer */}
        <Text style={styles.timer}>0:00</Text>

        {/* Submit button */}
        <TouchableOpacity style={styles.submitBtn}>
          <Text style={styles.submitBtnText}>Submit</Text>
        </TouchableOpacity>

        {/* Email / contact info */}
        <Text style={styles.contactInfo}>Clicksolver@yahoo.com</Text>

        {/* Social icons */}
        <View style={styles.socialIcons}>
          <Image
            source={require('./assets/facebook.png')}
            style={styles.socialIcon}
          />
          <Image
            source={require('./assets/instagram.png')}
            style={styles.socialIcon}
          />
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
    // Center everything
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#000', // Adjust as needed
  },
  instruction: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    color: '#000', // Adjust as needed
  },
  codeInputs: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  codeInput: {
    width: 40,
    height: 40,
    borderWidth: 2,
    borderColor: '#ccc',
    borderRadius: 5,
    textAlign: 'center',
    fontSize: 18,
    marginHorizontal: 5,
    backgroundColor: '#fff', // helps text stand out
  },
  timer: {
    fontSize: 16,
    marginBottom: 20,
    color: '#000',
  },
  submitBtn: {
    backgroundColor: '#f26522', // Adjust to your desired color
    borderRadius: 5,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
  },
  contactInfo: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  socialIcons: {
    flexDirection: 'row',
    marginTop: 10,
  },
  socialIcon: {
    width: 24,
    height: 24,
    marginHorizontal: 10,
    resizeMode: 'contain',
  },
});

export default VerificationScreen;

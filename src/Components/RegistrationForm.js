import React from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Button,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {Picker} from '@react-native-picker/picker';

const RegistrationForm = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Icon name="arrow-left" size={25} color="#333" />
        <Text style={styles.headerTitle}>Registration</Text>
      </View>

      {/* Personal Details Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>
          <Icon name="account" size={18} /> Personal Details
        </Text>
        <View style={styles.inputRow}>
          <TextInput placeholder="Last Name" style={styles.input} />
          <TextInput placeholder="First Name" style={styles.input} />
        </View>
        <View style={styles.inputRow}>
          <Text style={styles.label}>Gender:</Text>
          <TextInput placeholder="Male / Female" style={styles.input} />
        </View>
        <View style={styles.inputRow}>
          <TextInput
            placeholder="Years of Work Experience"
            style={styles.input}
          />
          <TextInput placeholder="Date of Birth" style={styles.input} />
        </View>
        <View style={styles.inputRow}>
          <TextInput placeholder="Email" style={styles.input} />
          <TextInput placeholder="Mobile Number" style={styles.input} />
        </View>
      </View>

      {/* Address/Residential Details Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>
          <Icon name="home" size={18} /> Address / Residential Details
        </Text>
        <TextInput placeholder="Door-No/Street" style={styles.input} />
        <TextInput placeholder="Landmark" style={styles.input} />
        <View style={styles.inputRow}>
          <TextInput placeholder="City" style={styles.input} />
          <TextInput placeholder="District" style={styles.input} />
        </View>
        <View style={styles.inputRow}>
          <TextInput placeholder="State" style={styles.input} />
          <TextInput placeholder="Country" style={styles.input} />
        </View>
      </View>

      {/* Skill Details Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>
          <Icon name="hammer-wrench" size={18} /> Skill Details
        </Text>
        <Picker style={styles.picker}>
          <Picker.Item label="Select Service Category" value="" />
          <Picker.Item label="Electrician" value="electrician" />
          <Picker.Item label="Plumber" value="plumber" />
        </Picker>
        <View style={styles.checkboxContainer}>
          <Text>Sink fitting & Repairing</Text>
          <Text>Tap fitting & Repairing</Text>
          <Text>Pipe fitting & Repairing</Text>
        </View>
        <Button title="+ Add New Skill" />
      </View>

      {/* Upload Details Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>
          <Icon name="upload" size={18} /> Upload Details
        </Text>
        <View style={styles.uploadContainer}>
          <TouchableOpacity style={styles.uploadButton}>
            <Icon name="camera" size={24} />
            <Text>Choose Image</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.uploadButton}>
            <Icon name="file" size={24} />
            <Text>Choose Address Proof</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Submit Button */}
      <TouchableOpacity style={styles.submitButton}>
        <Text style={styles.submitButtonText}>Submit</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#e6e6e6',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  sectionContainer: {
    backgroundColor: '#fff',
    padding: 15,
    margin: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    flex: 0.5,
    fontWeight: 'bold',
  },
  picker: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 10,
  },
  checkboxContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  uploadContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 10,
  },
  submitButton: {
    backgroundColor: '#ff5733',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    margin: 15,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default RegistrationForm;

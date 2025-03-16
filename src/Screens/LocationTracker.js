import React, { useEffect, useRef } from 'react';
import BackgroundGeolocation from 'react-native-background-geolocation';
import EncryptedStorage from 'react-native-encrypted-storage';
import firestore from '@react-native-firebase/firestore';
import moment from 'moment-timezone';

const LocationTracker = ({ isEnabled, onLocationUpdate }) => {
  const isConfigured = useRef(false);
  // Store the odometer reading when the worker entered the polygon.
  const polygonEntryOdometer = useRef(null);

  // Firebase document management with worker_id check
  const manageFirebaseDoc = async (latitude, longitude, timestamp) => {
    try {
      const workerIdStr = await EncryptedStorage.getItem('unique');
      if (!workerIdStr) {
        console.log('Worker ID not found in storage');
        return;
      }

      const workerId = parseInt(workerIdStr, 10);
      const firebaseDocId = await EncryptedStorage.getItem('firebaseDocId');
      const locationsCollection = firestore().collection('locations');

      const locationData = {
        location: new firestore.GeoPoint(latitude, longitude),
        timestamp,
        worker_id: workerId,
      };

      if (firebaseDocId) {
        await locationsCollection.doc(firebaseDocId).update(locationData);
        console.log(`Updated existing doc ${firebaseDocId}`);
      } else {
        const querySnapshot = await locationsCollection
          .where('worker_id', '==', workerId)
          .limit(1)
          .get();

        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          await EncryptedStorage.setItem('firebaseDocId', doc.id);
          await doc.ref.update(locationData);
          console.log(`Found existing worker doc ${doc.id}`);
        } else {
          const docRef = await locationsCollection.add(locationData);
          await EncryptedStorage.setItem('firebaseDocId', docRef.id);
          console.log(`Created new doc ${docRef.id}`);
        }
      }

      await EncryptedStorage.setItem(
        'nullCoordinates',
        (latitude === 0 && longitude === 0) ? 'true' : 'false'
      );
    } catch (error) {
      console.error('Firebase operation failed:', error);
    }
  };

  // Core location handling logic
  const handleLocationUpdate = async (latitude, longitude) => {
    try {
      console.log('Handling location update for:', { latitude, longitude });
      const timestamp = moment().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');
      const nullCoordinates = await EncryptedStorage.getItem('nullCoordinates');
      const previousEnabled = await EncryptedStorage.getItem('previousEnabled');

      // Prevent sending 0,0 if already sent or if tracking is active.
      if (latitude === 0 && longitude === 0) {
        if (nullCoordinates === 'true' || isEnabled) {
          console.log('⚠️ 0,0 already sent or tracking active - skipping');
          return;
        }
      }

      if (latitude !== 0 || longitude !== 0) {
        if (previousEnabled === 'true') {
          console.log('⚠️ Valid coordinates already sent - skipping');
          return;
        }
        console.log('✅ Sending valid coordinates to Firebase');
        await manageFirebaseDoc(latitude, longitude, timestamp);
        await EncryptedStorage.setItem('nullCoordinates', 'false');
      } else {
        console.log('🛑 Sending 0,0 coordinates to Firebase');
        await manageFirebaseDoc(0, 0, timestamp);
        await EncryptedStorage.setItem('nullCoordinates', 'true');
      }

      await EncryptedStorage.setItem(
        'previousEnabled',
        (latitude !== 0 || longitude !== 0) ? 'true' : 'false'
      );
    } catch (error) {
      console.error('Location handling failed:', error);
    }
  };

  // Configure geofences and background tracking.
  // Use a lower distanceFilter (e.g. 50m) to receive more frequent updates.
  useEffect(() => {
    if (!isConfigured.current) {
      BackgroundGeolocation.ready({
        desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
        distanceFilter: 50,
        stopOnTerminate: false,
        startOnBoot: true,
        foregroundService: true,
        enableHeadless: true,
        debug: false,
      }).then(() => {
        console.log('BackgroundGeolocation configured');

        const geofences = [
          {
            identifier: 'PolygonA',
            notifyOnEntry: true,
            notifyOnExit: true,
            vertices: [
              [17.006761409194525, 80.53093335197622],
              [17.005373260064985, 80.53291176992008],
              [16.998813039026402, 80.52664649280518],
              [16.993702747389463, 80.52215964720267],
              [16.98846563857974, 80.5205112174242],
              [16.985436512096513, 80.52097340481015],
              [16.982407772736835, 80.51886205401541],
              [16.987520443064497, 80.51325397397363],
              [16.99023324951544, 80.51463921162184],
              [16.995343035509578, 80.51463907310551],
              [16.997739960285273, 80.5172774280341],
              [16.998812144956858, 80.5151667160207],
              [17.001713715885202, 80.51609017256038],
              [17.002827038610846, 80.51776432647671],
              [17.003291715895045, 80.52011454583169],
              [17.00505854929827, 80.52875703518436],
              [17.00682448638898, 80.5309333429243],
              [17.006761409194525, 80.53093335197622],
            ],
          },
          {
            identifier: 'PolygonB',
            notifyOnEntry: true,
            notifyOnExit: true,
            vertices: [
              [16.743659016732067, 81.08236641250511],
              [16.74034916284056, 81.1094786505995],
              [16.75332517520627, 81.11236934565574],
              [16.75189061713202, 81.12344773457119],
              [16.74132482137297, 81.13930188707656],
              [16.738499354073056, 81.14316076908437],
              [16.727924964128718, 81.14435289187736],
              [16.72342039833586, 81.14527321552549],
              [16.714353330434236, 81.14475480852309],
              [16.703383261743355, 81.13502168775335],
              [16.696706590762375, 81.11606570973981],
              [16.690277614635917, 81.11161284859327],
              [16.690514707521203, 81.10419147444412],
              [16.682222407654322, 81.09411194809388],
              [16.680443872924542, 81.08526753004003],
              [16.681096564850336, 81.08063131598783],
              [16.68719744307066, 81.07017793961404],
              [16.70130255228827, 81.06808977263063],
              [16.696116367178703, 81.04868074812543],
              [16.712614628885774, 81.05789409014807],
              [16.730789178638346, 81.06475183815792],
              [16.74056558441238, 81.0761195443987],
              [16.743659016732067, 81.08236641250511],
            ],
          },
          {
            identifier: 'Chandrugonda',
            notifyOnEntry: true,
            notifyOnExit: true,
            vertices: [
              [80.63369145143679, 17.390042404120663],
              [80.63464400354599, 17.393299672168467],
              [80.63975074124545, 17.39213817238675],
              [80.64162938568472, 17.395471151975457],
              [80.6424231791093, 17.395647899197584],
              [80.64168230524632, 17.391759420863266],
              [80.66549013578845, 17.38398742015015],
              [80.66695273406538, 17.371101579573804],
              [80.64701080411146, 17.37945102139436],
              [80.63979862457018, 17.385593101328965],
              [80.63369949884378, 17.390250991288397],
              [80.63369145143679, 17.390042404120663],
            ],
          },
        ];

        BackgroundGeolocation.addGeofences(geofences)
          .then(() => console.log('Geofences added successfully'))
          .catch((geofenceError) => console.error('Geofence error:', geofenceError));
      });

      isConfigured.current = true;
    }
  }, []);

  // Geofence event handling.
  useEffect(() => {
    const onGeofence = async (event) => {
      const { action, location } = event;
      const { latitude, longitude } = location.coords;

      if (action === 'ENTER') {
        console.log('Entered polygon, starting displacement tracking.');
        // Record the current odometer when entering the polygon.
        polygonEntryOdometer.current = location.odometer || 0;
      } else if (action === 'EXIT') {
        console.log('Exited polygon, clearing displacement tracking.');
        polygonEntryOdometer.current = null;
        await handleLocationUpdate(0, 0);
      }
    };

    const geofenceSubscription = BackgroundGeolocation.onGeofence(onGeofence);
    return () => geofenceSubscription.remove();
  }, []);

  // Monitor location updates and check if the worker has physically moved 400m.
  useEffect(() => {
    const locationSubscription = BackgroundGeolocation.onLocation((location) => {
      if (polygonEntryOdometer.current !== null && location.odometer !== undefined) {
        const traveled = location.odometer - polygonEntryOdometer.current;
        console.log(`Odometer displacement from polygon entry: ${traveled.toFixed(2)} meters`);
        if (traveled >= 400) {
          console.log('Worker physically moved 400m inside polygon. Sending update.');
          handleLocationUpdate(location.coords.latitude, location.coords.longitude);
          // Reset the entry odometer to the current value for the next interval.
          polygonEntryOdometer.current = location.odometer;
        }
      }
    });

    return () => locationSubscription.remove();
  }, []);

  // Toggle tracking based on isEnabled state.
  useEffect(() => {
    if (isEnabled === null) return;

    const handleToggle = async () => {
      try {
        console.log(`Toggle changed to: ${isEnabled ? 'ON' : 'OFF'}`);
        const previousEnabled = await EncryptedStorage.getItem('previousEnabled');
        console.log(`Current enabled state: ${isEnabled}, Previous: ${previousEnabled}`);

        if (isEnabled) {
          console.log('Starting location tracking...');
          if (previousEnabled !== 'true') {
            console.log('Fetching initial position...');
            const location = await BackgroundGeolocation.getCurrentPosition({
              timeout: 30,
              maximumAge: 5000,
              desiredAccuracy: 10,
            });
            console.log('Initial position:', location.coords);
            await handleLocationUpdate(location.coords.latitude, location.coords.longitude);
          }
          await BackgroundGeolocation.start();
          console.log('Background tracking STARTED');
        } else {
          console.log('Stopping location tracking...');
          const nullCoordinates = await EncryptedStorage.getItem('nullCoordinates');
          if (nullCoordinates !== 'true') {
            console.log('Sending 0,0 coordinates...');
            await handleLocationUpdate(0, 0);
          }
          await BackgroundGeolocation.stop();
          console.log('Background tracking STOPPED');
        }

        await EncryptedStorage.setItem('previousEnabled', isEnabled ? 'true' : 'false');
      } catch (error) {
        console.error('Toggle operation failed:', error);
      }
    };

    handleToggle();
  }, [isEnabled]);

  // Location updates for map display.
  useEffect(() => {
    const onLocation = (location) => {
      if (onLocationUpdate) {
        onLocationUpdate(location.coords.latitude, location.coords.longitude);
      }
    };

    const locationSubscription = BackgroundGeolocation.onLocation(onLocation);
    return () => locationSubscription.remove();
  }, [onLocationUpdate]);

  return null;
};

export default LocationTracker;

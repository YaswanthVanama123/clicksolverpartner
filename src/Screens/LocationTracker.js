import React, { useEffect, useRef } from 'react';
import BackgroundGeolocation from 'react-native-background-geolocation';
import EncryptedStorage from 'react-native-encrypted-storage';
import firestore from '@react-native-firebase/firestore';
import moment from 'moment-timezone';

// Define polygon geofences directly
const polygons = [
  {
    identifier: 'Eluru',
    notifyOnEntry: true,
    notifyOnExit: true,
    vertices: [
      [16.726072898, 81.161641112],
      [16.760757859, 81.132630339],
      [16.741032589, 81.034611693],
      [16.680200158, 81.039418211],
      [16.675266949, 81.087311735],
      [16.698616345, 81.152543059],
      [16.726072898, 81.161641112],
    ],
  },
  {
    identifier: 'Vijayawada',
    notifyOnEntry: true,
    notifyOnExit: true,
    vertices: [
      [16.516933878, 80.728696144],
      [16.454548798, 80.726292885],
      [16.451256151, 80.683377541],
      [16.486813776, 80.642693793],
      [16.510350651, 80.597890176],
      [16.549023903, 80.54604844],
      [16.569756156, 80.570081033],
      [16.562105225, 80.652049339],
      [16.550258026, 80.663035667],
      [16.516028697, 80.730155266],
      [16.516933878, 80.728696144],
    ],
  },
  {
    identifier: 'Gampalagudem',
    notifyOnEntry: true,
    notifyOnExit: true,
    vertices: [
      [17.011472725, 80.541800484],
      [17.019269713, 80.528325066],
      [16.997355247, 80.511073097],
      [17.006712299, 80.497168526],
      [16.991445289, 80.490473732],
      [16.977490483, 80.522831902],
      [17.011472725, 80.542143807],
      [17.011472725, 80.541800484] // closed loop
    ],    
  },
  {
    identifier: 'Tiruvuru',
    notifyOnEntry: true,
    notifyOnExit: true,
    vertices: [
      
        [17.135924611, 80.646771131],
        [17.080060242, 80.645655332],
        [17.060860689, 80.602396665],
        [17.097945226, 80.588577924],
        [17.148391313, 80.612181364],
        [17.135924611, 80.646771131]  // closing point
  
      
    ],    
  },
  {
    identifier: 'Vinukonda',
    notifyOnEntry: true,
    notifyOnExit: true,
    vertices: [
      [16.062912845, 79.770896149],
      [16.091613719, 79.747550202],
      [16.054829668, 79.701888275],
      [16.021503718, 79.738795472],
      [16.062912845, 79.770896149]  // closing point
  
      
    ],    
  },
  {
    identifier: 'Nellore',
    notifyOnEntry: true,
    notifyOnExit: true,
    vertices: [
      [14.361276241, 79.962574771],
      [14.395364554, 79.902836613],
      [14.463525556, 79.955879979],
      [14.460699783, 79.976307683],
      [14.473498585, 79.989525609],
      [14.483803578, 80.033642583],
      [14.483803578, 80.033642583],
      [14.444076862, 80.036045842],
      [14.419805166, 79.993130498],
      [14.361276241, 79.962574771] // closing point
  
      
    ],    
  },
  {
    identifier: 'Gudivada',
    notifyOnEntry: true,
    notifyOnExit: true,
    vertices: [
      [14.361276241, 79.962574771],
      [14.395364554, 79.902836613],
      [14.463525556, 79.955879979],
      [14.460699783, 79.976307683],
      [14.473498585, 79.989525609],
      [14.483803578, 80.033642583],
      [14.483803578, 80.033642583],
      [14.444076862, 80.036045842],
      [14.419805166, 79.993130498],
      [14.361276241, 79.962574771] // closing point
  
      
    ],    
  },
  {
    identifier: 'Machilipatnam',
    notifyOnEntry: true,
    notifyOnExit: true,
    vertices: [
      [16.200847888, 81.174040988],
      [16.200173815, 81.173642085],
      [16.184677759, 81.172440456],
      [16.153517113, 81.118882106],
      [16.169345357, 81.102230953],
      [16.220778387, 81.135876583],
      [16.200847888, 81.174040988] // closing point
  
      
    ],    
  },
];

// Point-in-polygon test using ray-casting algorithm
const isPointInPolygon = (point, vertices) => {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const xi = vertices[i][0],
          yi = vertices[i][1];
    const xj = vertices[j][0],
          yj = vertices[j][1];
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
};

const LocationTracker = ({ isEnabled, onLocationUpdate }) => {
  const isConfigured = useRef(false);
  const polygonEntryOdometer = useRef(null); // Baseline odometer on polygon entry
  const currentPolygon = useRef(null); // Current polygon identifier

  // Send location data to Firebase
  const manageFirebaseDoc = async (latitude, longitude, timestamp) => {
    try {
      const workerIdStr = await EncryptedStorage.getItem('unique');
      if (!workerIdStr) {
        console.log('[manageFirebaseDoc] Worker ID not found');
        return;
      }
      const workerId = parseInt(workerIdStr, 10);
      const firebaseDocIdData = await EncryptedStorage.getItem('firebaseDocIdData');
      const locationsCollection = firestore().collection('locations');
      const locationData = {
        location: new firestore.GeoPoint(latitude, longitude),
        timestamp,
        worker_id: workerId,
      };

      if (firebaseDocIdData) {
        await locationsCollection.doc(firebaseDocIdData).update(locationData);
        console.log(`[manageFirebaseDoc] Updated doc ${firebaseDocIdData}`);
      } else {
        const querySnapshot = await locationsCollection
          .where('worker_id', '==', workerId)
          .limit(1)
          .get();
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          await EncryptedStorage.setItem('firebaseDocIdData', doc.id);
          await doc.ref.update(locationData);
          console.log(`[manageFirebaseDoc] Updated existing doc ${doc.id}`);
        } else {
          const docRef = await locationsCollection.add(locationData);
          await EncryptedStorage.setItem('firebaseDocIdData', docRef.id);
          console.log(`[manageFirebaseDoc] Created new doc ${docRef.id}`);
        }
      }

      const newNullVal = latitude === 0 && longitude === 0 ? 'true' : 'false';
      await EncryptedStorage.setItem('nullCoordinates', newNullVal);
    } catch (error) {
      console.error('[manageFirebaseDoc] Error:', error);
    }
  };

  // Handle location updates with point-in-polygon test
  const handleLocationUpdate = async (latitude, longitude) => {
    try {
      const timestamp = moment().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');
      const nullCoordinates = await EncryptedStorage.getItem('nullCoordinates') || 'false';
      const previousEnabled = await EncryptedStorage.getItem('previousEnabled') || 'false';

      // Handle 0,0 updates
      if (latitude === 0 && longitude === 0) {
        if (nullCoordinates === 'true' && previousEnabled === 'false') {
          console.log('[handleLocationUpdate] Skipping duplicate 0,0 update');
          return;
        }
        await manageFirebaseDoc(0, 0, timestamp);
        await EncryptedStorage.setItem('previousEnabled', 'false');
        return;
      }

      // Check if the point is inside any polygon
      let insidePolygon = false;
      let polygonId = null;
      for (const poly of polygons) {
        if (isPointInPolygon([latitude, longitude], poly.vertices)) {
          insidePolygon = true;
          polygonId = poly.identifier;
          break;
        }
      }

      if (!insidePolygon) {
        console.log('[handleLocationUpdate] Outside all polygons, sending 0,0');
        await manageFirebaseDoc(0, 0, timestamp);
        await EncryptedStorage.setItem('previousEnabled', 'false');
        return;
      }

      console.log(`[handleLocationUpdate] Inside ${polygonId}`);
      if (previousEnabled === 'true' && nullCoordinates === 'false') {
        console.log('[handleLocationUpdate] Skipping duplicate valid update');
        return;
      }

      await manageFirebaseDoc(latitude, longitude, timestamp);
      await EncryptedStorage.setItem('previousEnabled', 'true');
    } catch (error) {
      console.error('[handleLocationUpdate] Error:', error);
    }
  };

  // Configure BackgroundGeolocation with polygon geofences
  useEffect(() => {
    if (!isConfigured.current) {
      BackgroundGeolocation.ready({
        desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
        distanceFilter: 50, // Trigger updates every 50m
        stopOnTerminate: false,
        startOnBoot: true,
        foregroundService: true,
        enableHeadless: true,
        debug: false,
      }).then(() => {
        console.log('[BGGeo] Configured');
        BackgroundGeolocation.addGeofences(polygons)
          .then(() => console.log('[BGGeo] Polygon geofences added'))
          .catch((error) => console.error('[BGGeo] Geofence error:', error));
        isConfigured.current = true;
      });
    }
  }, []);

  // Geofence event handling
  useEffect(() => {
    const onGeofence = async (event) => {
      const { action, identifier, location } = event;
      if (action === 'ENTER') {
        console.log(`[onGeofence] Entered ${identifier}`);
        currentPolygon.current = identifier;
        polygonEntryOdometer.current = location.odometer || 0;
        await handleLocationUpdate(location.coords.latitude, location.coords.longitude);
      } else if (action === 'EXIT') {
        console.log(`[onGeofence] Exited ${identifier}`);
        currentPolygon.current = null;
        polygonEntryOdometer.current = null;
        await handleLocationUpdate(0, 0);
      }
    };
    const subscription = BackgroundGeolocation.onGeofence(onGeofence);
    return () => subscription.remove();
  }, []);

  // Location updates with odometer check (400m displacement)
  useEffect(() => {
    const subscription = BackgroundGeolocation.onLocation(async (location) => {
      const { latitude, longitude, odometer } = location.coords;
      if (polygonEntryOdometer.current !== null && odometer !== undefined) {
        const displacement = odometer - polygonEntryOdometer.current;
        console.log(`[onLocation] Displacement: ${displacement.toFixed(2)} meters`);
        if (displacement >= 400) {
          console.log('[onLocation] Moved ≥400m, updating location');
          await handleLocationUpdate(latitude, longitude);
          polygonEntryOdometer.current = odometer;
        }
      }
    });
    return () => subscription.remove();
  }, []);

  // Toggle handler
  useEffect(() => {
    if (isEnabled === null) return;
    const handleToggle = async () => {
      console.log(`[handleToggle] Tracking ${isEnabled ? 'ON' : 'OFF'}`);
      if (isEnabled) {
        const location = await BackgroundGeolocation.getCurrentPosition({
          timeout: 30,
          maximumAge: 5000,
          desiredAccuracy: 10,
        });
        await handleLocationUpdate(location.coords.latitude, location.coords.longitude);
        await BackgroundGeolocation.start();
      } else {
        const nullCoordinates = await EncryptedStorage.getItem('nullCoordinates') || 'false';
        if (nullCoordinates !== 'true') {
          await handleLocationUpdate(0, 0);
        }
        await BackgroundGeolocation.stop();
      }
      await EncryptedStorage.setItem('previousEnabled', isEnabled ? 'true' : 'false');
    };
    handleToggle();
  }, [isEnabled]);

  // Optional map display
  useEffect(() => {
    const subscription = BackgroundGeolocation.onLocation((location) => {
      if (onLocationUpdate) {
        onLocationUpdate(location.coords.latitude, location.coords.longitude);
      }
    });
    return () => subscription.remove();
  }, [onLocationUpdate]);

  return null;
};

export default LocationTracker;
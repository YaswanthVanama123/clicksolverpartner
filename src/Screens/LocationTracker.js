import React, { useEffect, useRef } from 'react';
import BackgroundGeolocation from 'react-native-background-geolocation';
import EncryptedStorage from 'react-native-encrypted-storage';
import firestore from '@react-native-firebase/firestore';
import moment from 'moment-timezone';

// Define polygon data
const polygons = [
  {
    identifier: 'PolygonA',
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
    identifier: 'Eluru',
    vertices: [
      [16.67255137959924, 81.03321330178159],
      [16.6824145262823, 81.04647950748898],
      [16.6901906618056, 81.05994340182195],
      [16.694552978963202, 81.06568533268029],
      [16.677859504990124, 81.07340809687918],
      [16.681463988530027, 81.09657586209278],
      [16.68506890661233, 81.11340498431895],
      [16.68392977309564, 81.12271419996296],
      [16.68750736693913, 81.13547809505661],
      [16.689781680226105, 81.14855623455043],
      [16.701923001073155, 81.14795977957687],
      [16.710268916909044, 81.13191111175911],
      [16.710459773455327, 81.13230954617364],
      [16.715581889330167, 81.14954722240287],
      [16.734167808346427, 81.14736380596997],
      [16.749717375531958, 81.14795614271736],
      [16.753503098884124, 81.12557160723918],
      [16.75689984714704, 81.10200134965078],
      [16.739837869176796, 81.07013329316601],
      [16.719937818724915, 81.05944242728924],
      [16.707614321072228, 81.04677046623345],
      [16.707993326270454, 81.0238103387914],
      [16.672526135042432, 81.03270663044418]
    ],
  },
  {
    identifier: 'PolygonB',
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
    vertices: [
      [17.390042404120663, 80.63369145143679],
      [17.393299672168467, 80.63464400354599],
      [17.39213817238675, 80.63975074124545],
      [17.395471151975457, 80.64162938568472],
      [17.395647899197584, 80.6424231791093],
      [17.391759420863266, 80.64168230524632],
      [17.38398742015015, 80.66549013578845],
      [17.371101579573804, 80.66695273406538],
      [17.37945102139436, 80.64701080411146],
      [17.385593101328965, 80.63979862457018],
      [17.390250991288397, 80.63369949884378],
      [17.390042404120663, 80.63369145143679],
    ],
  },
  {
    identifier: 'Tiruvuru',
    vertices: [
      [17.091730887270444, 80.60650204489468],
      [17.09513456976032, 80.62335172753689],
      [17.109038349803853, 80.63004799391479],
      [17.121936424446076, 80.63527313830275],
      [17.131033832357872, 80.6446897485315],
      [17.13762235049235, 80.62366357630856],
      [17.13463581504783, 80.60368200587993]
    ],
  },
];

// Create circular geofences from polygons
function createCircularGeofencesFromPolygons(polygonsArray) {
  const CIRCLE_RADIUS = 7000; // 1000 meters radius
  const geofences = polygonsArray.flatMap((poly) =>
    poly.vertices.map((coord, index) => ({
      identifier: `${poly.identifier}_circle${index + 1}`,
      radius: CIRCLE_RADIUS,
      latitude: coord[0],
      longitude: coord[1],
      notifyOnEntry: true,
      notifyOnExit: true,
      distanceFilter: 50, // Trigger location updates every 50m inside geofence
    }))
  );
  console.log('[createCircularGeofencesFromPolygons] Created geofences:', geofences);
  return geofences;
}

const circularGeofences = createCircularGeofencesFromPolygons(polygons);

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
  const polygonEntryOdometer = useRef(null); // Baseline odometer on geofence entry
  const currentGeofence = useRef(null); // Current geofence identifier

  // Send location data to Firebase
  const manageFirebaseDoc = async (latitude, longitude, timestamp) => {
    try {
      const workerIdStr = await EncryptedStorage.getItem('unique');
      if (!workerIdStr) {
        console.log('[manageFirebaseDoc] Worker ID not found');
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
        console.log(`[manageFirebaseDoc] Updated doc ${firebaseDocId}`);
      } else {
        const querySnapshot = await locationsCollection
          .where('worker_id', '==', workerId)
          .limit(1)
          .get();
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          await EncryptedStorage.setItem('firebaseDocId', doc.id);
          await doc.ref.update(locationData);
          console.log(`[manageFirebaseDoc] Updated existing doc ${doc.id}`);
        } else {
          const docRef = await locationsCollection.add(locationData);
          await EncryptedStorage.setItem('firebaseDocId', docRef.id);
          console.log(`[manageFirebaseDoc] Created new doc ${docRef.id}`);
        }
      }

      const newNullVal = latitude === 0 && longitude === 0 ? 'true' : 'false';
      await EncryptedStorage.setItem('nullCoordinates', newNullVal);
    } catch (error) {
      console.error('[manageFirebaseDoc] Error:', error);
    }
  };

  // Handle location updates
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

      // Handle valid coordinates
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

  // Configure BackgroundGeolocation
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
        console.log('[BGGeo] Configured');
        BackgroundGeolocation.addGeofences(circularGeofences)
          .then(() => console.log('[BGGeo] Geofences added'))
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
        currentGeofence.current = identifier;
        polygonEntryOdometer.current = location.odometer || 0;
        await handleLocationUpdate(location.coords.latitude, location.coords.longitude);
      } else if (action === 'EXIT') {
        console.log(`[onGeofence] Exited ${identifier}`);
        currentGeofence.current = null;
        polygonEntryOdometer.current = null;
        await handleLocationUpdate(0, 0);
      }
    };
    const subscription = BackgroundGeolocation.onGeofence(onGeofence);
    return () => subscription.remove();
  }, []);

  // Location updates with odometer check
  useEffect(() => {
    const subscription = BackgroundGeolocation.onLocation(async (location) => {
      const { latitude, longitude, odometer } = location.coords;
      if (polygonEntryOdometer.current !== null && odometer !== undefined) {
        const displacement = odometer - polygonEntryOdometer.current;
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

  // Map display (optional)
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
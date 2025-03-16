import React, {useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

const CustomSwipeButton = () => {
  const [titleColor, setTitleColor] = useState('#FFFFFF');
  const [containerWidth, setContainerWidth] = useState(0);
  const [thumbWidth, setThumbWidth] = useState(50); // Default thumb width
  const thumbPosition = useRef(new Animated.Value(0)).current; // Will set to center after layout

  // Calculate center position once container dimensions are known
  const getCenterPosition = () => {
    if (containerWidth === 0) return 0;
    return (containerWidth - thumbWidth) / 2;
  };

  // Handle swipe actions
  const handleSwipeRight = () => {
    console.log('Swiped to the Right');
    // Handle your swipe right action here
  };

  const handleSwipeLeft = () => {
    console.log('Swiped to the Left');
    // Handle your swipe left action here
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => containerWidth > 0,
      onMoveShouldSetPanResponder: () => containerWidth > 0,
      onPanResponderGrant: () => {
        setTitleColor('#B0B0B0');
      },
      onPanResponderMove: (evt, gestureState) => {
        // Calculate new X position
        let newX = getCenterPosition() + gestureState.dx;

        // Clamp the value between 0 and (containerWidth - thumbWidth)
        newX = Math.max(0, Math.min(newX, containerWidth - thumbWidth));

        thumbPosition.setValue(newX);
      },
      onPanResponderRelease: (evt, gestureState) => {
        setTitleColor('#FFFFFF');
        const swipeThreshold = containerWidth * 0.3; // 30% of container width

        if (gestureState.dx > swipeThreshold) {
          // Swiped to the right
          Animated.timing(thumbPosition, {
            toValue: containerWidth - thumbWidth,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            handleSwipeRight();
            resetThumb();
          });
        } else if (gestureState.dx < -swipeThreshold) {
          // Swiped to the left
          Animated.timing(thumbPosition, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            handleSwipeLeft();
            resetThumb();
          });
        } else {
          // Not swiped enough, reset to center
          Animated.timing(thumbPosition, {
            toValue: getCenterPosition(),
            duration: 300,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  ).current;

  const resetThumb = () => {
    Animated.timing(thumbPosition, {
      toValue: getCenterPosition(),
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={styles.container}>
      <View
        style={styles.swipeContainer}
        onLayout={event => {
          const {width} = event.nativeEvent.layout;
          setContainerWidth(width);
          const center = (width - thumbWidth) / 2;
          thumbPosition.setValue(center);
        }}>
        <View style={styles.railContainer}>
          <Animated.View
            {...panResponder.panHandlers}
            style={[
              styles.thumb,
              {
                transform: [
                  {
                    translateX: thumbPosition,
                  },
                ],
              },
            ]}
            onLayout={event => {
              const {width} = event.nativeEvent.layout;
              setThumbWidth(width);
              // After thumb width is set, recenter the thumb
              if (containerWidth > 0) {
                thumbPosition.setValue((containerWidth - width) / 2);
              }
            }}>
            <Icon name="arrow-right" size={24} color="#FF5722" />
          </Animated.View>
          <Text style={[styles.title, {color: titleColor}]}>Swipe Me</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Full screen container to center the swipe button
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  swipeContainer: {
    width: 250, // You can adjust or make this dynamic
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF5722',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  railContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  thumb: {
    position: 'absolute',
    width: 50, // Default width, will be updated dynamically
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 2,
    // Elevation for Android
    elevation: 5,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    position: 'absolute',
  },
});

export default CustomSwipeButton;

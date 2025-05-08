import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';

/**
 * DestinationCircles component
 * @param {number} complete - how many circles are completed
 */
const DestinationCircles = ({ complete }) => {
  const totalDestinations = 6;    // or 8, or accept this as a prop
  const activeColor       = '#FF5722';
  
  const defaultColor      = '#212121';

  const { width } = useWindowDimensions();
  const styles    = dynamicStyles(width);

  const renderCircles = () => {
    const circles = [];
    for (let i = 1; i <= totalDestinations; i++) {
      // highlight only the first `complete`
      const circleColor = i <= complete ? activeColor : defaultColor;
      const lineColor   = i <  complete ? activeColor : defaultColor;

      circles.push(
        <View style={styles.circleContainer} key={i}>
          <View style={[styles.circle, { borderColor: circleColor }]}>
            <Text style={[styles.circleText, { color: circleColor }]}>
              {i}
            </Text>
          </View>
          {i < totalDestinations && (
            <View style={[styles.line, { backgroundColor: lineColor }]} />
          )}
        </View>
      );
    }
    return circles;
  };

  return <View style={styles.container}>{renderCircles()}</View>;
};

function dynamicStyles(width) {
  const isTablet   = width >= 600;
  const circleSize = isTablet ? width / 20 : width / 16;
  const lineWidth  = isTablet ? width / 25 : width / 22;

  return StyleSheet.create({
    container: {
      flexDirection : 'row',
      alignItems    : 'center',
      justifyContent: 'center',
      marginVertical: isTablet ? 15 : 10,
    },
    circleContainer: {
      flexDirection: 'row',
      alignItems   : 'center',
    },
    circle: {
      borderWidth   : 2,
      alignItems    : 'center',
      justifyContent: 'center',
      width         : circleSize,
      height        : circleSize,
      borderRadius  : circleSize / 2,
    },
    circleText: {
      fontWeight: 'bold',
      fontSize  : isTablet ? 16 : 14,
    },
    line: {
      width          : lineWidth,
      height         : isTablet ? 3 : 2,
      marginHorizontal: isTablet ? 5 : 3,
    },
  });
}

export default DestinationCircles;





// import React from 'react';
// import { View, Text, StyleSheet, Dimensions, useWindowDimensions } from 'react-native';

// /**
//  * DestinationCircles component
//  * @param {number} complete - how many circles are completed
//  */
// const DestinationCircles = ({ complete }) => {
//   const totalDestinations = 6;
//   const activeColor = '#FF5722'; // color for completed circles
//   const defaultColor = '#212121'; // default color for incomplete circles

//   // For responsive styles, get device width
//   const { width } = useWindowDimensions();
//   const styles = dynamicStyles(width);

//   const renderCircles = () => {
//     let circles = [];
//     for (let i = 1; i <= totalDestinations; i++) {
//       const circleColor = i <= complete ? activeColor : defaultColor;
//       const lineColor = i < complete ? activeColor : defaultColor;

//       circles.push(
//         <View style={styles.circleContainer} key={i}>
//           {/* Circle */}
//           <View style={[styles.circle, { borderColor: circleColor }]}>
//             <Text style={[styles.circleText, { color: circleColor }]}>
//               {i}
//             </Text>
//           </View>
//           {/* Line (Only show if not the last circle) */}
//           {i < totalDestinations && (
//             <View style={[styles.line, { backgroundColor: lineColor }]} />
//           )}
//         </View>,
//       );
//     }
//     return circles;
//   };

//   return <View style={styles.container}>{renderCircles()}</View>;
// };

// /**
//  * Dynamic styles based on screen width.
//  */
// function dynamicStyles(width) {
//   const isTablet = width >= 600;

//   // We'll define the circle size as a fraction of screen width
//   // e.g., circle size is ~ (width / 16) for phone and maybe smaller fraction for tablets
//   const circleSize = isTablet ? width / 20 : width / 16;
//   const lineWidth = isTablet ? width / 25 : width / 22;

//   return StyleSheet.create({
//     container: {
//       flexDirection: 'row',
//       alignItems: 'center',
//       justifyContent: 'center',
//       marginVertical: isTablet ? 15 : 10,
//     },
//     circleContainer: {
//       flexDirection: 'row',
//       alignItems: 'center',
//     },
//     circle: {
//       borderWidth: 2,
//       alignItems: 'center',
//       justifyContent: 'center',
//       width: circleSize,
//       height: circleSize,
//       borderRadius: circleSize / 2,
//       // marginHorizontal: isTablet ? 5 : 3,
//     },
//     circleText: {
//       fontWeight: 'bold',
//       fontSize: isTablet ? 16 : 14,
//     },
//     line: {
//       width: lineWidth,
//       height: isTablet ? 3 : 2,
//       marginHorizontal: isTablet ? 5 : 3,
//     },
//   });
// }

// export default DestinationCircles;

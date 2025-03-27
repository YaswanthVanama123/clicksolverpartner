import React, { useCallback, useEffect, useState, memo } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import EncryptedStorage from 'react-native-encrypted-storage';
import axios from 'axios';
import uuid from 'react-native-uuid';
import { useTheme } from '../context/ThemeContext';
// Import translation hook
import { useTranslation } from 'react-i18next';

/* --------------------- formatDate Helper --------------------- */
const formatDate = (created_at) => {
  const date = new Date(created_at);
  const monthNames = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
  ];
  return `${monthNames[date.getMonth()]} ${String(date.getDate()).padStart(2,'0')}, ${date.getFullYear()}`;
};

/* --------------------- PartialStarRating Component --------------------- */
const PartialStarRating = ({ rating, size = 14, color = '#FF5722' }) => {
  const MAX_STARS = 5;
  const fullStars = Math.floor(rating);
  const decimalPart = rating - fullStars;
  const remaining = MAX_STARS - Math.ceil(rating);
  const stars = [];

  // Full stars
  for (let i = 0; i < fullStars; i++) {
    stars.push(
      <FontAwesome key={`full-${i}`} name="star" size={size} color={color} />
    );
  }
  // Partial star if needed
  if (decimalPart > 0) {
    stars.push(
      <View key="partial-star" style={{ position: 'relative', width: size, marginRight: 2 }}>
        <FontAwesome name="star-o" size={size} color={color} />
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: `${decimalPart * 100}%`,
            overflow: 'hidden',
          }}
        >
          <FontAwesome name="star" size={size} color={color} />
        </View>
      </View>
    );
  }
  // Empty stars
  for (let i = 0; i < remaining; i++) {
    stars.push(
      <FontAwesome key={`empty-${i}`} name="star-o" size={size} color={color} />
    );
  }
  return <View style={{ flexDirection: 'row', marginRight: 3 }}>{stars}</View>;
};

/* --------------------- ReviewItem Component --------------------- */
const ReviewItem = memo(({ item, styles }) => {
  if (!item.comment) return null;
  return (
    <View style={styles.reviewContainer}>
      <View style={styles.userContainer}>
        {item.userImage ? (
          <Image
            source={{ uri: item.userImage }}
            style={styles.userImage}
          />
        ) : (
          <View style={[styles.userImage, styles.userPlaceholder]}>
            <Text style={styles.userInitial}>
              {item.username ? item.username.charAt(0).toUpperCase() : ''}
            </Text>
          </View>
        )}
        <View>
          <Text style={styles.userName}>{item.username}</Text>
          <Text style={styles.reviewTime}>{formatDate(item.created_at)}</Text>
        </View>
      </View>
      <View style={styles.ratingContainerSmall}>
        {Array.from({ length: 5 }, (_, i) => (
          <FontAwesome
            key={i + 1}
            name={i < item.rating ? 'star' : 'star-o'}
            size={16}
            color="#FF5700"
            style={{ marginRight: 3 }}
          />
        ))}
      </View>
      <Text style={styles.reviewText}>{item.comment}</Text>
    </View>
  );
});

/* --------------------- Main Screen: RatingsScreen --------------------- */
const RatingsScreen = () => {
  const { width } = useWindowDimensions();
  const { isDarkMode } = useTheme();
  const styles = dynamicStyles(width, isDarkMode);
  const navigation = useNavigation();
  // Get translation function
  const { t } = useTranslation();

  const [reviews, setReviews] = useState([]);
  const [workerReview, setWorkerReview] = useState({});
  const [ratingDistribution, setRatingDistribution] = useState({
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  const fetchReviews = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = await EncryptedStorage.getItem('pcs_token');
      if (!token) throw new Error('Token not found');

      const response = await axios.get(
        'https://backend.clicksolver.com/api/worker/ratings',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("data", response.data);
      if (response.data.length === 0) {
        setReviews([]);
        setWorkerReview({});
      } else {
        setReviews(response.data);
        setWorkerReview(response.data[0]);
        calculateRatingDistribution(response.data);
      }
    } catch (error) {
      console.error('Error fetching reviews data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const calculateRatingDistribution = (reviewsData) => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviewsData.forEach((review) => {
      if (review.rating >= 1 && review.rating <= 5) {
        distribution[review.rating] += 1;
      }
    });
    const totalReviews = reviewsData.length;
    Object.keys(distribution).forEach((key) => {
      distribution[key] = totalReviews
        ? Math.round((distribution[key] / totalReviews) * 100)
        : 0;
    });
    setRatingDistribution(distribution);
  };

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  /* -------------- Renders each row of the rating distribution -------------- */
  const RatingDistribution = ({ label, value }) => (
    <View style={styles.ratingDistributionRow}>
      <Text style={styles.ratingLabel}>{label}</Text>
      <View style={styles.ratingBarContainer}>
        <View style={[styles.ratingValue, { width: `${value}%` }]} />
      </View>
      <Text style={styles.ratingPercentage}>{value}%</Text>
    </View>
  );

  /* -------------- Render the header that shows rating distribution and average -------------- */
  const renderHeader = () => {
    return (
      <View>
        <View style={styles.ratingHeadContainer}>
          <View style={styles.ratingDistributionContainer}>
            {Object.keys(ratingDistribution)
              .sort((a, b) => b - a)
              .map((key) => (
                <RatingDistribution
                  key={key}
                  label={key}
                  value={ratingDistribution[key]}
                />
              ))}
          </View>
          <View style={styles.ratingSummaryContainer}>
            <Text style={styles.overallRating}>
              {workerReview.average_rating || 0}
            </Text>
            <PartialStarRating
              rating={workerReview.average_rating || 0}
              size={16}
              color="#FF5722"
            />
            <Text style={styles.reviewCount}>
              {reviews.length} {t('ratings', 'ratings')}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF5722" />
      </View>
    );
  }

  if (reviews.length === 0) {
    return (
      <View style={styles.mainContainer}>
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon
              name="arrow-back"
              size={24}
              color={isDarkMode ? "#ffffff" : "#000"}
              style={{ marginRight: 10 }}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {t('ratings_screen', 'Rating Screen')}
          </Text>
        </View>
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>
            {t('no_ratings_reviews', 'No ratings and reviews')}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon
            name="arrow-back"
            size={24}
            color={isDarkMode ? "#ffffff" : "#000"}
            style={{ marginRight: 10 }}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t('ratings_screen', 'Rating Screen')}
        </Text>
      </View>
      <FlatList
        style={styles.container}
        data={reviews}
        keyExtractor={() => uuid.v4()}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => <ReviewItem item={item} styles={styles} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

/* --------------------- Dynamic Styles Generator --------------------- */
function dynamicStyles(width, isDarkMode) {
  const isTablet = width >= 600;
  return StyleSheet.create({
    mainContainer: {
      flex: 1,
      backgroundColor: isDarkMode ? '#121212' : '#FFFFFF',
    },
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#121212' : '#ffffff',
    },
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: isTablet ? 20 : 16,
      backgroundColor: isDarkMode ? '#1f1f1f' : '#ffffff',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
    },
    headerTitle: {
      fontSize: isTablet ? 22 : 18,
      fontWeight: 'bold',
      color: isDarkMode ? '#ffffff' : '#000',
      textAlign: 'center',
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    noDataContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    noDataText: {
      fontSize: isTablet ? 18 : 16,
      color: isDarkMode ? '#cccccc' : '#999',
      fontWeight: 'bold',
    },
    ratingHeadContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginVertical: isTablet ? 30 : 20,
      paddingHorizontal: isTablet ? 24 : 16,
    },
    ratingDistributionContainer: {
      width: isTablet ? '65%' : '70%',
    },
    ratingDistributionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: isTablet ? 4 : 2,
    },
    ratingLabel: {
      width: isTablet ? 30 : 20,
      fontSize: isTablet ? 18 : 16,
      color: isDarkMode ? '#ffffff' : '#4a4a4a',
    },
    ratingBarContainer: {
      flex: 1,
      height: isTablet ? 12 : 10,
      backgroundColor: isDarkMode ? '#333333' : '#e0e0e0',
      borderRadius: 5,
      overflow: 'hidden',
      marginHorizontal: 10,
    },
    ratingValue: {
      height: '100%',
      backgroundColor: '#ff5722',
    },
    ratingPercentage: {
      fontSize: isTablet ? 18 : 16,
      color: isDarkMode ? '#ffffff' : '#4a4a4a',
    },
    ratingSummaryContainer: {
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      width: isTablet ? '35%' : '30%',
    },
    overallRating: {
      fontSize: isTablet ? 40 : 35,
      fontWeight: 'bold',
      color: isDarkMode ? '#ffffff' : '#212121',
    },
    reviewCount: {
      fontSize: isTablet ? 18 : 16,
      color: isDarkMode ? '#cccccc' : '#808080',
      textAlign: 'center',
      marginTop: 4,
    },
    reviewContainer: {
      paddingVertical: isTablet ? 20 : 16,
      paddingHorizontal: isTablet ? 24 : 20,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#333333' : '#e0e0e0',
    },
    userContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: isTablet ? 8 : 4,
    },
    userImage: {
      width: isTablet ? 50 : 40,
      height: isTablet ? 50 : 40,
      borderRadius: isTablet ? 25 : 20,
      marginRight: isTablet ? 16 : 12,
    },
    userPlaceholder: {
      backgroundColor: '#ccc',
      justifyContent: 'center',
      alignItems: 'center',
    },
    userInitial: {
      fontSize: isTablet ? 24 : 18,
      color: '#fff',
      fontWeight: 'bold',
    },
    userName: {
      fontSize: isTablet ? 18 : 16,
      color: isDarkMode ? '#ffffff' : '#4a4a4a',
      fontWeight: 'bold',
    },
    reviewTime: {
      fontSize: isTablet ? 14 : 12,
      color: isDarkMode ? '#cccccc' : '#808080',
    },
    ratingContainerSmall: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
    },
    reviewText: {
      fontSize: isTablet ? 16 : 14,
      color: isDarkMode ? '#dddddd' : '#4a4a4a',
      marginTop: isTablet ? 12 : 8,
      lineHeight: isTablet ? 24 : 20,
    },
    historyItemContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode ? '#222222' : '#fff',
      marginHorizontal: isTablet ? 30 : 16,
      marginVertical: 8,
      borderRadius: 10,
      padding: isTablet ? 20 : 16,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    historyIconWrapper: {
      width: isTablet ? 50 : 45,
      height: isTablet ? 50 : 45,
      borderRadius: isTablet ? 25 : 22.5,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: isTablet ? 18 : 14,
    },
    historyMiddle: {
      flex: 2,
      justifyContent: 'center',
    },
    historyMainText: {
      fontSize: isTablet ? 16 : 14,
      fontWeight: '600',
      color: isDarkMode ? '#ffffff' : '#333',
      marginBottom: 4,
    },
    historyTimeText: {
      fontSize: isTablet ? 14 : 12,
      color: isDarkMode ? '#cccccc' : '#999',
    },
    historyRight: {
      alignItems: 'flex-end',
      justifyContent: 'center',
      marginLeft: isTablet ? 12 : 8,
    },
    historyAmount: {
      fontSize: isTablet ? 18 : 16,
      fontWeight: 'bold',
      color: isDarkMode ? '#ffffff' : '#333',
    },
    historyOrderId: {
      marginTop: 4,
      fontSize: isTablet ? 13 : 12,
      color: isDarkMode ? '#cccccc' : '#999',
      maxWidth: 120,
    },
  });
}

export default RatingsScreen;

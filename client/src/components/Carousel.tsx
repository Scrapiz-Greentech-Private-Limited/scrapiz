import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Image, ActivityIndicator } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import { AuthService } from '../api/apiService';
import { wp, hp } from '../utils/responsive';

const { width } = Dimensions.get('window');

// Fallback images if backend is unavailable
const fallbackCarouselData = [
  {
    id: 1,
    image: require('../../assets/images/Become_A_Scrap_Seller.png'),
    isLocal: true,
  },
  {
    id: 2,
    image: require('../../assets/images/Refer_And_Earn_Rewards.png'),
    isLocal: true,
  },
  {
    id: 3,
    image: require('../../assets/images/Hassle_Free_Service.png'),
    isLocal: true,
  },
];

interface CarouselImage {
  id: number;
  title: string;
  image_url: string;
  order: number;
  is_active: boolean;
}

const renderCarouselItem = ({ item }: { item: any }) => (
  <View style={styles.carouselItem}>
    <View style={styles.carouselImageWrapper}>
      <Image 
        source={item.isLocal ? item.image : { uri: item.image_url }} 
        style={styles.carouselImage} 
      />
    </View>
  </View>
);

export default function CustomCarousel() {
  const [carouselData, setCarouselData] = useState<any[]>(fallbackCarouselData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCarouselImages();
  }, []);

  const loadCarouselImages = async () => {
    try {
      const images: CarouselImage[] = await AuthService.getCarouselImages();
      
      if (images && images.length > 0) {
        // Transform backend data to carousel format
        const transformedData = images.map((img) => ({
          id: img.id,
          image_url: img.image_url,
          title: img.title,
          isLocal: false,
        }));
        setCarouselData(transformedData);
      }
    } catch (error) {
      console.log('Failed to load carousel images, using fallback:', error);
      // Keep fallback data on error
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.carouselContainer}>
        <View style={[styles.carouselItem, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color="#16a34a" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.carouselContainer}>
      <Carousel
        loop
        width={width - 40}
        height={width / 2}
        autoPlay={true}
        data={carouselData}
        scrollAnimationDuration={1000}
        renderItem={renderCarouselItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  carouselContainer: {
    marginVertical: 20,
    alignItems: 'center',
  },
  carouselItem: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  carouselImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
});

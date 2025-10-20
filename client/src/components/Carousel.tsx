import React from 'react';
import { View, StyleSheet, Dimensions, Image } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';

const { width } = Dimensions.get('window');

const carouselData = [
  {
    id: 1,
    image: require('../../assets/images/Become_A_Scrap_Seller.png'),
  },
  {
    id: 2,
    image: require('../../assets/images/Refer_And_Earn_Rewards.png'),
  },
  {
    id: 3,
    image: require('../../assets/images/Hassle_Free_Service.png'),
  },
];

const renderCarouselItem = ({ item }: { item: any }) => (
  <View style={styles.carouselItem}>
    <Image source={item.image} style={styles.carouselImage} />
  </View>
);

export default function CustomCarousel() {
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

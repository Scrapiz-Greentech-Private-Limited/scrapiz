import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
  ImageSourcePropType,
} from 'react-native';
import { fs, spacing } from '../utils/responsive';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - spacing(26);

interface ServiceCardProps {
  title: string;
  description: string;
  image: ImageSourcePropType;
  onLearnMore?: () => void;
  onBookNow?: () => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({
  title,
  description,
  image,
  onLearnMore,
  onBookNow,
}) => {
  const accent = '#0F8B38';

  return (
    <View style={styles.card}>
      <View style={styles.contentRow}>
        <View style={styles.imageWrap}>
          <Image source={image} style={styles.image} resizeMode="cover" />
        </View>

        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>

          <Text style={styles.description} numberOfLines={2} ellipsizeMode="tail">
            {description}
          </Text>

          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.btnOutline, { borderColor: accent }]}
              activeOpacity={0.7}
              onPress={onLearnMore}
            >
              <Text style={styles.btnOutlineText}>Learn more</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnFill}
              activeOpacity={0.8}
              onPress={onBookNow}
            >
              <Text style={styles.btnFillText}>Book now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    alignSelf: 'center',
    minHeight: spacing(116),
    marginBottom: spacing(16),
    borderRadius: 28,
    borderWidth: 1.8,
    borderBottomWidth: 3,
    borderColor: '#12913E',
    backgroundColor: '#FFFFFF',
    shadowColor: '#0C7B31',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
    paddingHorizontal: spacing(14),
    paddingVertical: spacing(14),
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: spacing(84),
  },
  imageWrap: {
    width: spacing(76),
    height: spacing(86),
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#EAF5ED',
    flexShrink: 0,
    borderWidth: 1,
    borderColor: '#D3E6D9',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    marginLeft: spacing(14),
    justifyContent: 'space-between',
    minHeight: spacing(86),
  },
  title: {
    fontSize: fs(20),
    fontWeight: '800',
    fontFamily: 'Inter-Bold',
    lineHeight: fs(24),
    color: '#0C3A1A',
  },
  description: {
    marginTop: spacing(6),
    fontSize: fs(13.5),
    fontFamily: 'Inter-Regular',
    lineHeight: fs(18),
    color: '#4B6A55',
  },
  btnRow: {
    flexDirection: 'row',
    gap: spacing(10),
    marginTop: spacing(14),
  },
  btnOutline: {
    flex: 1,
    minHeight: spacing(34),
    borderRadius: 999,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4FBF6',
    paddingHorizontal: spacing(10),
  },
  btnOutlineText: {
    fontSize: fs(12.5),
    fontWeight: '700',
    fontFamily: 'Inter-SemiBold',
    color: '#0F8B38',
  },
  btnFill: {
    flex: 1,
    minHeight: spacing(34),
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing(10),
    backgroundColor: '#0F8B38',
  },
  btnFillText: {
    color: '#fff',
    fontSize: fs(12.5),
    fontWeight: '700',
    fontFamily: 'Inter-SemiBold',
  },
});

export default ServiceCard;

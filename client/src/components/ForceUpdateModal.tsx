import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Linking,
  Platform,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RefreshCw, ArrowRight, Sparkles } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { wp, hp, fs, spacing } from '../utils/responsive';

interface ForceUpdateModalProps {
  visible: boolean;
  updateUrl: string;
  minVersion: string;
}

const { width } = Dimensions.get('window');

export const ForceUpdateModal: React.FC<ForceUpdateModalProps> = ({
  visible,
  updateUrl,
  minVersion,
}) => {
  const handleUpdate = async () => {
    try {
      const canOpen = await Linking.canOpenURL(updateUrl);
      if (canOpen) {
        await Linking.openURL(updateUrl);
      } else {
        console.error('Cannot open update URL:', updateUrl);
      }
    } catch (error) {
      console.error('Error opening update URL:', error);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent
    >
      <BlurView intensity={90} style={styles.overlay}>
        <View style={styles.container}>
          {/* Animated Background Circles */}
          <View style={styles.bgCircle1} />
          <View style={styles.bgCircle2} />
          
          <View style={styles.content}>
            {/* Icon Container with Gradient */}
            <LinearGradient
              colors={['#16a34a', '#15803d', '#14532d']}
              style={styles.iconContainer}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <RefreshCw size={48} color="#ffffff" strokeWidth={2.5} />
              <View style={styles.sparkleContainer}>
                <Sparkles size={20} color="#fbbf24" fill="#fbbf24" />
              </View>
            </LinearGradient>

            {/* Title */}
            <Text style={styles.title}>Update Required</Text>

            {/* Message */}
            <Text style={styles.message}>
              A new version of Scrapiz is required to continue. Please update the app to get the latest features and fixes.
            </Text>

            {/* Version Info */}
            <View style={styles.versionInfo}>
              <View style={styles.versionBadge}>
                <Text style={styles.versionLabel}>Minimum Version</Text>
                <Text style={styles.versionNumber}>v{minVersion}</Text>
              </View>
            </View>

            {/* Features List */}
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <View style={styles.featureDot} />
                <Text style={styles.featureText}>Enhanced performance</Text>
              </View>
              <View style={styles.featureItem}>
                <View style={styles.featureDot} />
                <Text style={styles.featureText}>Bug fixes & improvements</Text>
              </View>
              <View style={styles.featureItem}>
                <View style={styles.featureDot} />
                <Text style={styles.featureText}>New features & better experience</Text>
              </View>
            </View>

            {/* Update Button */}
            <TouchableOpacity
              style={styles.updateButton}
              onPress={handleUpdate}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#16a34a', '#15803d', '#14532d']}
                style={styles.updateButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.updateButtonText}>Update Now</Text>
                <ArrowRight size={22} color="#ffffff" strokeWidth={2.5} />
              </LinearGradient>
            </TouchableOpacity>

            {/* Store Badge */}
            <View style={styles.storeBadge}>
              <Text style={styles.storeBadgeText}>
                {Platform.OS === 'ios' ? 'App Store' : 'Google Play'}
              </Text>
            </View>
          </View>
        </View>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: wp(85),
    maxWidth: 400,
    position: 'relative',
    overflow: 'hidden',
  },
  bgCircle1: {
    position: 'absolute',
    width: wp(60),
    height: wp(60),
    borderRadius: wp(30),
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    top: -wp(20),
    right: -wp(15),
  },
  bgCircle2: {
    position: 'absolute',
    width: wp(40),
    height: wp(40),
    borderRadius: wp(20),
    backgroundColor: 'rgba(22, 163, 74, 0.08)',
    bottom: -wp(10),
    left: -wp(10),
  },
  content: {
    backgroundColor: '#ffffff',
    borderRadius: spacing(24),
    padding: spacing(32),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: wp(24),
    height: wp(24),
    borderRadius: wp(12),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing(24),
    position: 'relative',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  sparkleContainer: {
    position: 'absolute',
    top: -spacing(4),
    right: -spacing(4),
    backgroundColor: '#ffffff',
    borderRadius: spacing(12),
    padding: spacing(4),
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  title: {
    fontSize: fs(26),
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: spacing(12),
    textAlign: 'center',
  },
  message: {
    fontSize: fs(15),
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: fs(22),
    marginBottom: spacing(24),
    paddingHorizontal: spacing(8),
  },
  versionInfo: {
    width: '100%',
    marginBottom: spacing(24),
  },
  versionBadge: {
    backgroundColor: '#f0fdf4',
    borderRadius: spacing(12),
    padding: spacing(16),
    borderWidth: 1,
    borderColor: '#bbf7d0',
    alignItems: 'center',
  },
  versionLabel: {
    fontSize: fs(12),
    color: '#166534',
    fontWeight: '600',
    marginBottom: spacing(4),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  versionNumber: {
    fontSize: fs(20),
    color: '#16a34a',
    fontWeight: '800',
  },
  featuresList: {
    width: '100%',
    marginBottom: spacing(28),
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing(12),
  },
  featureDot: {
    width: spacing(8),
    height: spacing(8),
    borderRadius: spacing(4),
    backgroundColor: '#16a34a',
    marginRight: spacing(12),
  },
  featureText: {
    fontSize: fs(14),
    color: '#4b5563',
    fontWeight: '500',
  },
  updateButton: {
    width: '100%',
    borderRadius: spacing(16),
    overflow: 'hidden',
    marginBottom: spacing(16),
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  updateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing(18),
    paddingHorizontal: spacing(32),
    gap: spacing(12),
  },
  updateButtonText: {
    fontSize: fs(17),
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  storeBadge: {
    backgroundColor: '#f9fafb',
    paddingHorizontal: spacing(16),
    paddingVertical: spacing(8),
    borderRadius: spacing(20),
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  storeBadgeText: {
    fontSize: fs(12),
    color: '#6b7280',
    fontWeight: '600',
  },
});

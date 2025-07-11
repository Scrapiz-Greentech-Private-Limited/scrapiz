import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

interface ScrapizLogoProps {
  size?: number;
  showText?: boolean;
  textColor?: string;
}

export default function ScrapizLogo({ 
  size = 56, 
  showText = true, 
  textColor = '#111827' 
}: ScrapizLogoProps) {
  const logoSize = size;
  const textSize = size * 0.5;

  return (
    <View style={styles.container}>
      <Image 
        source={require('@/assets/images/Scrapiz-Logo-cropped.svg')}
        style={[styles.logoIcon, { width: logoSize, height: logoSize }]}
        resizeMode="contain"
      />
      {showText && (
        <Text style={[styles.logoText, { fontSize: textSize, color: textColor }]}>
          Scrapiz
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    marginRight: 12,
  },
  logoText: {
    fontWeight: '700',
    fontFamily: 'Inter-SemiBold',
  },
});
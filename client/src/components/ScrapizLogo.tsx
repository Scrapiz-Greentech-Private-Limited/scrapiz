import React from 'react';
import { Image } from 'react-native';

interface ScrapizLogoProps {
  width?: number;
}

export default function ScrapizLogo({ width = 150 }: ScrapizLogoProps) {
  const height = width / 2.5; // Aspect ratio of the logo
  return (
    <Image
      source={require('../../assets/images/LogowithoutS.png')}
      style={{ width, height }}
      resizeMode="contain"
    />
  );
}

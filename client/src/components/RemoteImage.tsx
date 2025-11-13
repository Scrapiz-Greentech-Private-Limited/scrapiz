import React, { useState } from 'react';
import { Image, ImageProps, ActivityIndicator, View, StyleSheet, ImageSourcePropType } from 'react-native';

interface RemoteImageProps extends Omit<ImageProps, 'source'> {
  source: { uri: string } | ImageSourcePropType;
  fallback: ImageSourcePropType; // Local asset fallback
  showLoadingIndicator?: boolean;
}

/**
 * RemoteImage component that displays images from S3 URLs with fallback support
 * 
 * Features:
 * - Displays remote images from S3 URLs
 * - Falls back to local assets on error
 * - Shows loading indicator while image loads
 * - Handles both remote URIs and local assets
 * 
 * @param source - Image source (S3 URI or local asset)
 * @param fallback - Local asset to display on error or when source is unavailable
 * @param showLoadingIndicator - Whether to show loading spinner (default: true)
 */
export const RemoteImage: React.FC<RemoteImageProps> = ({ 
  source, 
  fallback, 
  showLoadingIndicator = true,
  style,
  ...props 
}) => {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // If source is local asset or error occurred, use fallback
  if (typeof source === 'number' || error) {
    return <Image source={fallback} style={style} {...props} />;
  }
  
  // Check if source is a URI object
  const isRemoteImage = source && typeof source === 'object' && 'uri' in source;
  
  // If not a remote image, use fallback
  if (!isRemoteImage) {
    return <Image source={fallback} style={style} {...props} />;
  }
  
  return (
    <View style={[styles.container, style]}>
      <Image 
        source={source} 
        style={[StyleSheet.absoluteFill, style]}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={() => {
          setError(true);
          setLoading(false);
        }}
        {...props} 
      />
      
      {/* Loading indicator */}
      {loading && showLoadingIndicator && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#10b981" />
        </View>
      )}
      
      {/* Fallback image (rendered underneath, visible only on error) */}
      {error && (
        <Image 
          source={fallback} 
          style={[StyleSheet.absoluteFill, style]}
          {...props} 
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
});

export default RemoteImage;

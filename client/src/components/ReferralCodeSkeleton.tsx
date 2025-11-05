import React from 'react';
import { View, StyleSheet } from 'react-native';

export default function ReferralCodeSkeleton() {
  return (
    <View style={styles.codeCard}>
      <View style={styles.codeLeft}>
        <View style={[styles.skeleton, { width: 40, height: 12, marginBottom: 8 }]} />
        <View style={[styles.skeleton, { width: 120, height: 24 }]} />
      </View>
      <View style={[styles.skeleton, { width: 60, height: 36, borderRadius: 10 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  codeCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  codeLeft: {
    flex: 1,
  },
  skeleton: {
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
  },
});

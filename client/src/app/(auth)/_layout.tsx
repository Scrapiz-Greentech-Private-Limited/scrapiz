import React from "react";
import { Stack } from "expo-router";
import {StyleSheet} from 'react-native'
export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="location-permission" />
      <Stack.Screen name="service-unavailable" />
    </Stack>
  );
}
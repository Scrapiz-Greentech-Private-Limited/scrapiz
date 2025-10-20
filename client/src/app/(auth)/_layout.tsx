import React from "react";
import { Stack } from "expo-router";
import {StyleSheet} from 'react-native'
export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#2C3E50' } }}>
      <Stack.Screen 
        name="login" 
        options={{
          headerTransparent: true,
          headerTitle: "",
        }}
      />
      <Stack.Screen 
        name="register" 
        options={{
          headerTitle: "",
          headerTransparent: true,
        }}
      />
      <Stack.Screen 
        name="forgot-password" 
        options={{
          headerTitle: "",
          headerTransparent: true,
        }}
      />
    </Stack>
  );
}
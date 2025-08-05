import React from "react";
import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          headerShown: false 
        }} 
      />
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
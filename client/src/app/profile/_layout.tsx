import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="addresses" />
      <Stack.Screen name="notification-settings" />
      <Stack.Screen name="privacy-security" />
      <Stack.Screen name="help-support" />
      <Stack.Screen name="refer-friends" />
    </Stack>
  );
}

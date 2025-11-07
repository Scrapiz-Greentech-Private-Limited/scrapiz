import React, { useEffect, useState } from 'react';
import { View, Text, Modal, ActivityIndicator } from 'react-native';

interface SessionExpiredDialogProps {
  visible: boolean;
  onRedirect: () => void;
}

export default function SessionExpiredDialog({ visible, onRedirect }: SessionExpiredDialogProps) {
  const [countdown, setCountdown] = useState(5);
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    if (!visible) {
      setCountdown(5);
      setHasRedirected(false);
      return;
    }

    if (hasRedirected) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!hasRedirected) {
            setHasRedirected(true);
            onRedirect();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [visible, onRedirect, hasRedirected]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View className="flex-1 bg-black/50 justify-center items-center px-6">
        <View className="bg-white rounded-2xl p-6 w-full max-w-sm items-center">
          <Text className="text-xl font-bold text-gray-800 mb-2">
            Session Expired
          </Text>
          <Text className="text-gray-600 text-center mb-6">
            Your session has expired. Redirecting to login...
          </Text>
          
          <ActivityIndicator size="large" color="#10b981" />
          
          <Text className="text-4xl font-bold text-emerald-500 mt-4">
            {countdown}s
          </Text>
        </View>
      </View>
    </Modal>
  );
}

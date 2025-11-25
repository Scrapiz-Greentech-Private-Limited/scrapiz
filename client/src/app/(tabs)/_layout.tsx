import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { House, ShoppingBag, User, TrendingUp, Wrench } from 'lucide-react-native';
import { hp, fs, spacing } from '../../utils/responsive';
import { useTheme } from '../../context/ThemeContext';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  
  // Responsive tab bar height with safe area for both iOS and Android
  const baseTabBarHeight = Platform.select({
    ios: hp(10.3),      // ~84px on base device
    android: hp(8.6),   // ~70px on base device
  }) || hp(8.6);
  
  // For Android gesture navigation, ensure proper bottom spacing
  // When insets.bottom is 0, it might still be in gesture mode
  const bottomPadding = Platform.select({
    ios: insets.bottom > 0 ? insets.bottom : spacing(8),
    android: insets.bottom > 0 ? insets.bottom : spacing(10), // More padding for Android to handle gesture bar
  }) || spacing(8);
  
  // Total height including safe area bottom insets (handles both iOS home indicator and Android nav bar)
  const totalTabBarHeight = baseTabBarHeight + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          height: totalTabBarHeight,
          // Apply bottom padding consistently for gesture navigation
          paddingBottom: bottomPadding,
          paddingTop: spacing(8),
          paddingHorizontal: spacing(16),
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontFamily: 'Inter-Medium',
          fontSize: fs(11),
          fontWeight: '600',
          marginBottom: spacing(4),
        },
        tabBarIconStyle: {
          marginTop: spacing(4),
        },
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <House 
              size={focused ? fs(24) : fs(22)} 
              color={color}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="sell"
        options={{
          title: 'Sell',
          tabBarIcon: ({ color, focused }) => (
            <ShoppingBag 
              size={focused ? fs(24) : fs(22)} 
              color={color}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: 'Services',
          tabBarIcon: ({ color, focused }) => (
            <Wrench 
              size={focused ? fs(24) : fs(22)} 
              color={color}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="rates"
        options={{
          title: 'Rates',
          tabBarIcon: ({ color, focused }) => (
            <TrendingUp 
              size={focused ? fs(24) : fs(22)} 
              color={color}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <User 
              size={focused ? fs(24) : fs(22)} 
              color={color}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
    </Tabs>
  );
}

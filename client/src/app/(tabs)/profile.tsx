import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  StatusBar,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  User, 
  MapPin, 
  Bell, 
  Shield, 
  CircleHelp as HelpCircle, 
  Star, 
  Gift, 
  ChevronRight, 
  Edit, 
  Award, 
  LogOut, 
  Phone, 
  Mail,
  Camera,
  Wallet,
  Settings,
  Heart,
  TrendingUp,
  Package
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

const profileData = {
  name: 'Rajesh Kumar',
  email: 'rajesh.kumar@example.com',
  phone: '+91 98765 43210',
  address: '123, Green Valley Apartment, Sector 21, Pune - 411001',
  joinDate: 'January 2024',
  totalOrders: 24,
  totalEarnings: 8420,
  totalRecycled: 186,
  rating: 4.8,
  achievements: ['First Sale', 'Green Warrior', 'Top Seller'],
  membershipTier: 'Gold',
};

export default function ProfileScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const achievements = [
    { id: 1, title: 'First Sale', desc: 'Completed your first order', icon: '🎯', earned: true },
    { id: 2, title: 'Green Warrior', desc: 'Recycled 100kg+ waste', icon: '🌱', earned: true },
    { id: 3, title: 'Top Seller', desc: 'Top 10% sellers this month', icon: '🏆', earned: true },
    { id: 4, title: 'Eco Champion', desc: 'Recycled 500kg+ waste', icon: '♻️', earned: false },
  ];

  const quickStats = [
    { label: 'Orders', value: '24', icon: Package, color: '#3b82f6' },
    { label: 'Earnings', value: '₹8.4K', icon: Wallet, color: '#10b981' },
    { label: 'Rating', value: '4.8★', icon: Star, color: '#f59e0b' },
    { label: 'Recycled', value: '186kg', icon: Award, color: '#8b5cf6' },
  ];

  const menuSections = [
    {
      title: 'Account',
      items: [
        { icon: Edit, title: 'Edit Profile', subtitle: 'Update personal information', hasChevron: true },
        { icon: MapPin, title: 'Addresses', subtitle: 'Manage pickup locations', hasChevron: true },
        { icon: Wallet, title: 'Earnings', subtitle: 'View payment history', hasChevron: true },
      ]
    },
    {
      title: 'Preferences',
      items: [
        { 
          icon: Bell, 
          title: 'Notifications', 
          subtitle: 'Push notifications and alerts',
          hasSwitch: true,
          switchValue: notificationsEnabled,
          onSwitchChange: setNotificationsEnabled
        },
        { icon: Shield, title: 'Privacy & Security', subtitle: 'Account security settings', hasChevron: true },
        { icon: Settings, title: 'App Settings', subtitle: 'Language, theme, etc.', hasChevron: true },
      ]
    },
    {
      title: 'Support',
      items: [
        { icon: HelpCircle, title: 'Help Center', subtitle: 'FAQs and guides', hasChevron: true },
        { icon: Star, title: 'Rate App', subtitle: 'Share your feedback', hasChevron: true },
        { icon: Gift, title: 'Refer Friends', subtitle: 'Earn ₹100 per referral', hasChevron: true },
      ]
    }
  ];

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#7c3aed" barStyle="light-content" />
      
      {/* Header with Gradient */}
      <LinearGradient colors={['#7c3aed', '#a855f7']} style={styles.header}>
        <View style={styles.headerContent}>
          {/* Profile Info */}
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <LinearGradient colors={['#fbbf24', '#f59e0b']} style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {profileData.name.split(' ').map(n => n[0]).join('')}
                </Text>
              </LinearGradient>
              <TouchableOpacity style={styles.cameraButton}>
                <Camera size={16} color="white" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{profileData.name}</Text>
              <Text style={styles.membershipTier}>{profileData.membershipTier} Member</Text>
              
              <View style={styles.contactInfo}>
                <View style={styles.contactItem}>
                  <Mail size={14} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.contactText}>{profileData.email}</Text>
                </View>
                <View style={styles.contactItem}>
                  <Phone size={14} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.contactText}>{profileData.phone}</Text>
                </View>
              </View>
            </View>
          </View>
          
          {/* Quick Stats */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsContainer}>
            {quickStats.map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: `${stat.color}20` }]}>
                  <stat.icon size={20} color={stat.color} />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Achievements */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.achievementsContainer}>
            {achievements.map((achievement) => (
              <View key={achievement.id} style={[styles.achievementCard, !achievement.earned && styles.achievementCardLocked]}>
                <Text style={[styles.achievementIcon, !achievement.earned && styles.achievementIconLocked]}>
                  {achievement.icon}
                </Text>
                <Text style={[styles.achievementTitle, !achievement.earned && styles.achievementTitleLocked]}>
                  {achievement.title}
                </Text>
                <Text style={[styles.achievementDesc, !achievement.earned && styles.achievementDescLocked]}>
                  {achievement.desc}
                </Text>
                {achievement.earned && <View style={styles.achievementBadge} />}
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Environmental Impact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Environmental Impact</Text>
          <LinearGradient colors={['#ecfdf5', '#d1fae5']} style={styles.impactCard}>
            <View style={styles.impactHeader}>
              <Text style={styles.impactEmoji}>🌍</Text>
              <View style={styles.impactContent}>
                <Text style={styles.impactTitle}>Making a Difference!</Text>
                <Text style={styles.impactSubtitle}>Your recycling efforts this month</Text>
              </View>
              <TouchableOpacity style={styles.impactButton}>
                <TrendingUp size={20} color="#059669" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.impactStats}>
              <View style={styles.impactStat}>
                <Text style={styles.impactStatValue}>124</Text>
                <Text style={styles.impactStatLabel}>Trees Saved</Text>
              </View>
              <View style={styles.impactDivider} />
              <View style={styles.impactStat}>
                <Text style={styles.impactStatValue}>340kg</Text>
                <Text style={styles.impactStatLabel}>CO₂ Reduced</Text>
              </View>
              <View style={styles.impactDivider} />
              <View style={styles.impactStat}>
                <Text style={styles.impactStatValue}>89%</Text>
                <Text style={styles.impactStatLabel}>Efficiency</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Menu Sections */}
        {menuSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.menuContainer}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity 
                  key={itemIndex} 
                  style={[
                    styles.menuItem,
                    itemIndex === section.items.length - 1 && styles.menuItemLast
                  ]}
                  onPress={item.onSwitchChange ? undefined : () => {}}
                >
                  <View style={styles.menuItemLeft}>
                    <View style={styles.menuIcon}>
                      <item.icon size={20} color="#6b7280" />
                    </View>
                    <View style={styles.menuItemContent}>
                      <Text style={styles.menuItemTitle}>{item.title}</Text>
                      <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.menuItemRight}>
                    {item.hasSwitch ? (
                      <Switch
                        value={item.switchValue}
                        onValueChange={item.onSwitchChange}
                        trackColor={{ false: '#e5e7eb', true: '#bbf7d0' }}
                        thumbColor={item.switchValue ? '#10b981' : '#f3f4f6'}
                      />
                    ) : item.hasChevron ? (
                      <ChevronRight size={16} color="#d1d5db" />
                    ) : null}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Logout Button */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={() => Alert.alert('Logout', 'Are you sure you want to logout?')}
          >
            <LogOut size={20} color="#dc2626" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Scrapiz v1.0.0</Text>
          <View style={styles.footerLinks}>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Privacy Policy</Text>
            </TouchableOpacity>
            <Text style={styles.footerDivider}>•</Text>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Terms of Service</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: 'white',
    fontFamily: 'Inter-ExtraBold',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
    fontFamily: 'Inter-ExtraBold',
    marginBottom: 4,
  },
  membershipTier: {
    fontSize: 14,
    color: '#fbbf24',
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    marginBottom: 12,
  },
  contactInfo: {
    gap: 6,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: 'Inter-Regular',
  },
  statsContainer: {
    marginHorizontal: -8,
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 8,
    minWidth: 90,
    alignItems: 'center',
    backdropFilter: 'blur(10px)',
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: 'white',
    fontFamily: 'Inter-ExtraBold',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingTop: 24,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Inter-Bold',
  },
  viewAllText: {
    fontSize: 14,
    color: '#7c3aed',
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
  },
  achievementsContainer: {
    marginHorizontal: -8,
  },
  achievementCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 8,
    width: 140,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
  },
  achievementCardLocked: {
    backgroundColor: '#f9fafb',
    opacity: 0.6,
  },
  achievementIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  achievementIconLocked: {
    opacity: 0.5,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
    marginBottom: 4,
  },
  achievementTitleLocked: {
    color: '#9ca3af',
  },
  achievementDesc: {
    fontSize: 11,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 14,
  },
  achievementDescLocked: {
    color: '#d1d5db',
  },
  achievementBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: 'white',
  },
  impactCard: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  impactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  impactEmoji: {
    fontSize: 40,
    marginRight: 16,
  },
  impactContent: {
    flex: 1,
  },
  impactTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#065f46',
    fontFamily: 'Inter-Bold',
  },
  impactSubtitle: {
    fontSize: 14,
    color: '#10b981',
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  impactButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  impactStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  impactStat: {
    alignItems: 'center',
    flex: 1,
  },
  impactStatValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#065f46',
    fontFamily: 'Inter-ExtraBold',
  },
  impactStatLabel: {
    fontSize: 12,
    color: '#059669',
    fontFamily: 'Inter-Medium',
    marginTop: 4,
  },
  impactDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#bbf7d0',
  },
  menuContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
  },
  menuItemSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  menuItemRight: {
    marginLeft: 12,
  },
  logoutButton: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
    fontFamily: 'Inter-SemiBold',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  footerText: {
    fontSize: 12,
    color: '#9ca3af',
    fontFamily: 'Inter-Regular',
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerLink: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Inter-Medium',
  },
  footerDivider: {
    fontSize: 12,
    color: '#d1d5db',
  },
});
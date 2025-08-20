import React, { useEffect, useMemo, useState } from 'react';
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
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { AuthService, UserProfile } from '../../api/apiService';
import { 
  Edit,
  LogOut,
  Phone,
  Mail,
  Camera,
  Package
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [editingName, setEditingName] = useState<boolean>(false);
  const [nameInput, setNameInput] = useState<string>('');
  const [savingName, setSavingName] = useState<boolean>(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await AuthService.getUser();
        setUser(data);
      } catch (e: any) {
        Alert.alert('Error', e.message || 'Failed to load user');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const profileName = user?.name || 'User';
  const profileEmail = user?.email || '';
  const phoneFromAddress = useMemo(() => user?.addresses?.[0]?.phone_number || '', [user]);
  const totalOrders = user?.orders?.length || 0;
  const membershipTier = 'Member';


  const startEditName = () => {
    setNameInput(profileName);
    setEditingName(true);
  };

  const saveName = async () => {
    if (!nameInput.trim()) {
      Alert.alert('Validation', 'Name cannot be empty');
      return;
    }
    setSavingName(true);
    try {
      await AuthService.updateUserName(nameInput.trim());
      const updated = await AuthService.getUser();
      setUser(updated);
      setEditingName(false);
      Alert.alert('Success', 'Name updated successfully');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update name');
    } finally {
      setSavingName(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor="#2C3E50" barStyle="light-content" />
        <LinearGradient colors={['#2C3E50', '#34495E']} style={[styles.header, { flex: 1, justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ color: 'white' }}>Loading...</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#2C3E50" barStyle="light-content" />
      
      {/* Header with Gradient */}
      <LinearGradient colors={['#2C3E50', '#34495E']} style={styles.header}>
        <View style={styles.headerContent}>
          {/* Profile Info */}
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <LinearGradient colors={['#fbbf24', '#f59e0b']} style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {profileName.split(' ').map(n => n[0]).join('')}
                </Text>
              </LinearGradient>
              <TouchableOpacity style={styles.cameraButton}>
                <Camera size={16} color="white" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.profileInfo}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={styles.profileName}>{profileName}</Text>
                <TouchableOpacity onPress={startEditName} accessibilityLabel="Edit name" style={{ padding: 4 }}>
                  <Edit size={18} color="#ffffff" />
                </TouchableOpacity>
              </View>
              <Text style={styles.membershipTier}>{membershipTier} Member</Text>
              
              <View style={styles.contactInfo}>
                <View style={styles.contactItem}>
                  <Mail size={14} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.contactText}>{profileEmail}</Text>
                </View>
                <View style={styles.contactItem}>
                  <Phone size={14} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.contactText}>{phoneFromAddress || '—'}</Text>
                </View>
              </View>
            </View>
          </View>
          
          {/* Quick Stats */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsContainer}>
            {[{ label: 'Orders', value: String(totalOrders), icon: Package, color: '#3b82f6' }].map((stat, index) => (
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

      {/* Inline name editor */}
      {editingName && (
        <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
          <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e5e7eb' }}>
            <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#111827' }}>Edit Name</Text>
            <TextInput
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="Enter your name"
              style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12 }}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <TouchableOpacity onPress={() => setEditingName(false)} style={{ paddingVertical: 10, paddingHorizontal: 16 }}>
                <Text style={{ color: '#6b7280', fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity disabled={savingName} onPress={saveName} style={{ backgroundColor: '#7c3aed', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, marginLeft: 8, opacity: savingName ? 0.6 : 1 }}>
                <Text style={{ color: 'white', fontWeight: '700' }}>{savingName ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Addresses from API */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Addresses</Text>
          </View>
          {user?.addresses?.length ? (
            <View style={styles.menuContainer}>
              {user.addresses.map((addr, idx) => (
                <View key={addr.id} style={[styles.menuItem, idx === user.addresses.length - 1 && styles.menuItemLast]}>
                  <View style={styles.menuItemLeft}>
                    <View style={styles.menuIcon}>
                      <Phone size={20} color="#6b7280" />
                    </View>
                    <View style={styles.menuItemContent}>
                      <Text style={styles.menuItemTitle}>{addr.name} • {addr.phone_number}</Text>
                      <Text style={styles.menuItemSubtitle}>{addr.room_number}, {addr.street}, {addr.area}, {addr.city}, {addr.state}, {addr.country} - {addr.pincode}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={{ color: '#6b7280' }}>No addresses found.</Text>
          )}
        </View>

        {/* Orders from API */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Orders</Text>
          </View>
          {user?.orders?.length ? (
            <View style={styles.menuContainer}>
              {user.orders.map((ord, idx) => (
                <View key={ord.id} style={[styles.menuItem, idx === user.orders.length - 1 && styles.menuItemLast]}>
                  <View style={styles.menuItemLeft}>
                    <View style={styles.menuIcon}>
                      <Package size={20} color="#6b7280" />
                    </View>
                    <View style={styles.menuItemContent}>
                      <Text style={styles.menuItemTitle}>#{ord.order_number}</Text>
                      <Text style={styles.menuItemSubtitle}>{new Date(ord.created_at).toLocaleString()} • {ord.orders.length} items</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={{ color: '#6b7280' }}>No orders found.</Text>
          )}
        </View>

        {/* Logout Button */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={async () => {
              try {
                await AuthService.logout();
                router.replace('/(auth)/login');
              } catch (e: any) {
                Alert.alert('Logout Failed', e.message || 'Please try again');
              }
            }}
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
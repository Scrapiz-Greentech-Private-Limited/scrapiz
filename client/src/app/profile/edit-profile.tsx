import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  StatusBar,
} from 'react-native';
import { ArrowLeft, User, Mail, Phone as PhoneIcon, MapPin, Save, Camera, X, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthService, UserProfile } from '../../api/apiService';
import * as ImagePicker from 'expo-image-picker';
import { useLocalization } from '../../context/LocalizationContext';
import { useTheme } from '../../context/ThemeContext';
import GenderSelectionModal from '../../components/GenderSelectionModal';


export default function EditProfileScreen(){
    const router = useRouter();
    const { t } = useLocalization();
    const { colors, isDark } = useTheme();
    const [user , setUser] = useState<UserProfile | null>(null);
    const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    gender: '' as 'male' | 'female' | 'prefer_not_to_say' | '',
    address: '',
    profileImage: '',
    })
    const [originalData, setOriginalData] = useState({
    fullName: '',
    email: '',
    phone: '',
    gender: '' as 'male' | 'female' | 'prefer_not_to_say' | '',
    address: '',
    profileImage: '',
    })
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching , setIsFetching] = useState(true);
    const [imageError, setImageError] = useState(false);
    const [showGenderModal, setShowGenderModal] = useState(false);

    useEffect(()=>{
        loadUserData();
    },[])
    const loadUserData = async() =>{
        setIsFetching(true);
        try {
            const userData = await AuthService.getUser();
            setUser(userData);
            const primaryAddress = userData.addresses?.[0];
            const addressString = primaryAddress
        ? `${primaryAddress.room_number}, ${primaryAddress.street}, ${primaryAddress.area}, ${primaryAddress.city} - ${primaryAddress.pincode}`
        : '';
        
        // Load from AsyncStorage if not in database
        const storedPhone = await AsyncStorage.getItem('@user_phone');
        const storedGender = await AsyncStorage.getItem('@user_gender');
        
        const data = {
            fullName:userData.name || '',
            email:userData.email || '',
            phone: userData.phone_number || storedPhone || '',
            gender: (userData.gender || storedGender || '') as 'male' | 'female' | 'prefer_not_to_say' | '',
            address:addressString || '',
            profileImage: userData.profile_image || '',
        };
        setFormData(data);
        setOriginalData(data);
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: t('toasts.error.fetchUserData'),
                text2: (error as Error).message,
            });
        } finally {
            setIsFetching(false);
        }
    }
    
    const handlePickImage = async () => {
        try {
            // Request permissions
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            
            if (status !== 'granted') {
                Alert.alert(
                    t('alerts.titles.permissionRequired'),
                    t('alerts.permissions.cameraRollRequired'),
                    [{ text: t('alerts.buttons.ok') }]
                );
                return;
            }
            
            // Launch image picker
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });
            
            if (!result.canceled && result.assets && result.assets.length > 0) {
                setFormData(prev => ({ ...prev, profileImage: result.assets[0].uri }));
                setImageError(false);
            }
        } catch (error) {
            Alert.alert(t('alerts.titles.error'), t('toasts.error.imagePickerFailed'));
            console.error('Image picker error:', error);
        }
    };
    
    const handleRemoveImage = () => {
        Alert.alert(
            t('alerts.titles.removeProfilePicture'),
            t('alerts.confirmations.removeProfilePicture'),
            [
                { text: t('alerts.buttons.cancel'), style: 'cancel' },
                {
                    text: t('alerts.buttons.remove'),
                    style: 'destructive',
                    onPress: () => {
                        setFormData(prev => ({ ...prev, profileImage: '' }));
                        setImageError(false);
                    },
                },
            ]
        );
    };
    const handleSave = async() =>{
        if (!formData.fullName.trim()) {
        Alert.alert(t('alerts.titles.validationError'), t('alerts.validation.enterFullName'));
        return;
    }
    
    setIsLoading(true);
    try {
        const updateData: any = {};
        
        // Check if name changed
        if (formData.fullName.trim() !== originalData.fullName) {
            updateData.name = formData.fullName.trim();
        }
        
        // Check if phone changed
        if (formData.phone.trim() !== originalData.phone) {
            updateData.phone_number = formData.phone.trim();
        }
        
        // Check if gender changed
        if (formData.gender !== originalData.gender) {
            updateData.gender = formData.gender || null;
        }
        
        // Check if profile image changed
        if (formData.profileImage !== originalData.profileImage) {
            if (formData.profileImage === '') {
                // Remove image
                updateData.profile_image = null;
            } else if (formData.profileImage.startsWith('file://') || formData.profileImage.startsWith('content://')) {
                // New image upload
                updateData.profile_image = formData.profileImage;
            }
        }
        
        // Only call API if there are changes
        if (Object.keys(updateData).length > 0) {
            try {
                const updatedUser = await AuthService.updateUserProfile(updateData);
                
                // Update local state with response
                const updatedFormData = {
                    ...formData,
                    fullName: updatedUser.name || formData.fullName,
                    phone: updatedUser.phone_number || formData.phone,
                    gender: (updatedUser.gender || formData.gender) as 'male' | 'female' | 'prefer_not_to_say' | '',
                    profileImage: updatedUser.profile_image || '',
                };
                setFormData(updatedFormData);
                setOriginalData(updatedFormData);
                
                // Save to AsyncStorage as backup
                if (formData.phone) {
                    await AsyncStorage.setItem('@user_phone', formData.phone);
                }
                if (formData.gender) {
                    await AsyncStorage.setItem('@user_gender', formData.gender);
                }
                
                Toast.show({
                    type: 'success',
                    text1: t('toasts.success.profileUpdated'),
                    text2: '',
                });
                
                setTimeout(() => {
                    router.back();
                }, 1000);
            } catch (apiError: any) {
                // If API fails, save to AsyncStorage
                console.error('API update failed, saving to AsyncStorage:', apiError);
                
                if (formData.phone) {
                    await AsyncStorage.setItem('@user_phone', formData.phone);
                }
                if (formData.gender) {
                    await AsyncStorage.setItem('@user_gender', formData.gender);
                }
                
                Toast.show({
                    type: 'info',
                    text1: 'Saved Locally',
                    text2: 'Changes saved on device. Will sync when online.',
                });
                
                setTimeout(() => {
                    router.back();
                }, 1000);
            }
        } else {
            Toast.show({
                type: 'info',
                text1: t('toasts.info.noChanges'),
                text2: '',
            });
        }
    } catch (error: any) {
        Toast.show({
             type: 'error',
             text1: t('alerts.titles.error'),
            text2: error.message || t('toasts.error.updateProfile'),
        })
    }finally{
        setIsLoading(false);
    }
    };
    
    const hasChanges = () => {
        return formData.fullName !== originalData.fullName || 
               formData.phone !== originalData.phone ||
               formData.gender !== originalData.gender ||
               formData.profileImage !== originalData.profileImage;
    };
    
    const getGenderLabel = () => {
        if (!formData.gender) return t('profile.selectGender');
        return t(`profile.gender${formData.gender.charAt(0).toUpperCase() + formData.gender.slice(1).replace(/_/g, '')}`);
    };

    if(isFetching){
        return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading profile...</Text>
      </View>
    );
    }
    return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <View style={[styles.header, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.card }]} onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Profile</Text>
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.1)' : '#f0fdf4' }, isLoading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isLoading}
        >
          <Save size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarSection}>
          <View style={[styles.avatarContainer, { backgroundColor: colors.primary }]}>
            {formData.profileImage && !imageError ? (
              <>
                <Image
                  source={{ uri: formData.profileImage }}
                  style={styles.avatarImage}
                  onError={() => setImageError(true)}
                />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={handleRemoveImage}
                  disabled={isLoading}
                >
                  <X size={16} color="white" />
                </TouchableOpacity>
              </>
            ) : (
              <Text style={styles.avatarText}>
                {formData.fullName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase() || 'U'}
              </Text>
            )}
          </View>
          <TouchableOpacity 
            style={styles.changePhotoButton}
            onPress={handlePickImage}
            disabled={isLoading}
          >
            <Camera size={16} color={colors.primary} style={{ marginRight: 6 }} />
            <Text style={[styles.changePhotoText, { color: colors.primary }]}>
              {formData.profileImage ? 'Change Photo' : 'Add Photo'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Full Name</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <User size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={formData.fullName}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, fullName: text }))}
                placeholder="Enter your full name"
                placeholderTextColor={colors.inputPlaceholder}
                editable={!isLoading}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Email Address</Text>
            <View style={[styles.inputWrapper, styles.inputWrapperDisabled, { backgroundColor: isDark ? colors.card : '#f9fafb', borderColor: colors.border }]}>
              <Mail size={20} color={colors.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.inputDisabled, { color: colors.textTertiary }]}
                value={formData.email}
                placeholder="Enter your email"
                placeholderTextColor={colors.inputPlaceholder}
                keyboardType="email-address"
                editable={false}
              />
            </View>
            <Text style={[styles.inputHint, { color: colors.textSecondary }]}>Email cannot be changed</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>{t('profile.phoneNumber')} <Text style={[styles.optionalText, { color: colors.textTertiary }]}>{t('profile.optional')}</Text></Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <PhoneIcon size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={formData.phone}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, phone: text }))}
                placeholder="Enter your phone number"
                placeholderTextColor={colors.inputPlaceholder}
                keyboardType="phone-pad"
                editable={!isLoading}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>{t('profile.gender')} <Text style={[styles.optionalText, { color: colors.textTertiary }]}>{t('profile.optional')}</Text></Text>
            <TouchableOpacity
              style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => setShowGenderModal(true)}
              disabled={isLoading}
            >
              <User size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <Text style={[styles.input, { color: formData.gender ? colors.text : colors.inputPlaceholder }]}>
                {getGenderLabel()}
              </Text>
              <ChevronRight size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.updateButton, { backgroundColor: colors.primary }, isLoading && styles.updateButtonDisabled]}
          onPress={handleSave}
          disabled={isLoading}
        >
          <Text style={[styles.updateButtonText, { color: isDark ? colors.buttonText : '#ffffff' }]}>
            {isLoading ? 'Updating...' : 'Update Profile'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
      
      <GenderSelectionModal
        visible={showGenderModal}
        selectedGender={formData.gender || null}
        onClose={() => setShowGenderModal(false)}
        onSelect={(gender) => setFormData((prev) => ({ ...prev, gender }))}
      />
      
      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Inter-SemiBold',
  },
  removeImageButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  changePhotoButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  changePhotoText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  formSection: {
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputWrapperDisabled: {
    opacity: 0.7,
  },
  inputIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  inputDisabled: {
    opacity: 0.8,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputHint: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 4,
    marginLeft: 4,
  },
  updateButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  updateButtonDisabled: {
    opacity: 0.7,
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  optionalText: {
    fontSize: 12,
    fontWeight: '400',
    fontFamily: 'Inter-Regular',
  },
});
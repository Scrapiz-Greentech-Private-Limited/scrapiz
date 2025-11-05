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
} from 'react-native';
import { ArrowLeft, User, Mail, Phone, MapPin, Save, Camera, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { AuthService, UserProfile } from '../../api/apiService';
import * as ImagePicker from 'expo-image-picker';
import { useLocalization } from '../../context/LocalizationContext';


export default function EditProfileScreen(){
    const router = useRouter();
    const { t } = useLocalization();
    const [user , setUser] = useState<UserProfile | null>(null);
    const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    profileImage: '',
    })
    const [originalData, setOriginalData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    profileImage: '',
    })
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching , setIsFetching] = useState(true);
    const [imageError, setImageError] = useState(false);

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
        const data = {
            fullName:userData.name || '',
            email:userData.email || '',
            phone:primaryAddress?.phone_number || '',
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
            const updatedUser = await AuthService.updateUserProfile(updateData);
            
            // Update local state with response
            const updatedFormData = {
                ...formData,
                fullName: updatedUser.name || formData.fullName,
                profileImage: updatedUser.profile_image || '',
            };
            setFormData(updatedFormData);
            setOriginalData(updatedFormData);
            
            Toast.show({
                type: 'success',
                text1: t('toasts.success.profileUpdated'),
                text2: '',
            });
            
            setTimeout(() => {
                router.back();
            }, 1000);
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
               formData.profileImage !== originalData.profileImage;
    };

    if(isFetching){
        return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
    }
    return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isLoading}
        >
          <Save size={20} color="#16a34a" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
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
            <Camera size={16} color="#16a34a" style={{ marginRight: 6 }} />
            <Text style={styles.changePhotoText}>
              {formData.profileImage ? 'Change Photo' : 'Add Photo'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <View style={styles.inputWrapper}>
              <User size={20} color="#6b7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={formData.fullName}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, fullName: text }))}
                placeholder="Enter your full name"
                editable={!isLoading}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={[styles.inputWrapper, styles.inputWrapperDisabled]}>
              <Mail size={20} color="#9ca3af" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={formData.email}
                placeholder="Enter your email"
                keyboardType="email-address"
                editable={false}
              />
            </View>
            <Text style={styles.inputHint}>Email cannot be changed</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.updateButton, isLoading && styles.updateButtonDisabled]}
          onPress={handleSave}
          disabled={isLoading}
        >
          <Text style={styles.updateButtonText}>
            {isLoading ? 'Updating...' : 'Update Profile'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
  },
  header: {
    backgroundColor: 'white',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
  },
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0fdf4',
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
    backgroundColor: '#16a34a',
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
    color: '#16a34a',
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
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputWrapperDisabled: {
    backgroundColor: '#f9fafb',
    borderColor: '#e5e7eb',
  },
  inputIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    fontFamily: 'Inter-Regular',
  },
  inputDisabled: {
    color: '#9ca3af',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputHint: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
    marginTop: 4,
    marginLeft: 4,
  },
  updateButton: {
    backgroundColor: '#16a34a',
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
    color: 'white',
    fontFamily: 'Inter-SemiBold',
  },
});
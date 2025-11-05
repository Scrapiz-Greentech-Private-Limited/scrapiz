import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthService } from '../api/apiService';

const PROFILE_STORAGE_KEY = '@scrapiz_user_profile';


export type ProfileData = {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  profileImage: string;
}

type ProfileContextType = {
  profile: ProfileData;
  loadProfile: () => Promise<void>;
  updateProfile: (data: Partial<ProfileData>) => Promise<void>;
  isLoading: boolean;
};


const defaultProfile: ProfileData = {
  fullName: '',
  email: '',
  phone: '',
  address: '',
  profileImage: '',
};


const ProfileContext = createContext<ProfileContextType | undefined>(undefined);


export const ProfileProvider = ({children}: {children: ReactNode})=>{
    const [profile, setProfile] = useState<ProfileData>(defaultProfile);
    const [isLoading, setIsLoading] = useState(true);
    
    const loadProfile = async()=>{
        try {
            setIsLoading(true);
            
            // Try to load from API first
            const isAuthenticated = await AuthService.isAuthenticated();
            if (isAuthenticated) {
                const userData = await AuthService.getUser();
                const profileData: ProfileData = {
                    fullName: userData.name || '',
                    email: userData.email || '',
                    phone: '', // Phone not in API yet
                    address: '', // Address handled separately
                    profileImage: userData.profile_image || '',
                };
                setProfile(profileData);
                await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profileData));
            } else {
                // Load from local storage if not authenticated
                const savedProfile = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
                if(savedProfile){
                    setProfile(JSON.parse(savedProfile));
                }else{
                    setProfile(defaultProfile);
                }
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            // Fallback to local storage
            try {
                const savedProfile = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
                if(savedProfile){
                    setProfile(JSON.parse(savedProfile));
                }else{
                    setProfile(defaultProfile);
                }
            } catch (e) {
                setProfile(defaultProfile);
            }
        } finally {
            setIsLoading(false)
        }
    }

    const updateProfile = async(data: Partial<ProfileData>) =>{
        try {
            const updateData: any = {};
            
            // Map ProfileData to API format
            if (data.fullName !== undefined) {
                updateData.name = data.fullName;
            }
            if (data.profileImage !== undefined) {
                updateData.profile_image = data.profileImage;
            }
            
            // Call API to update
            const updatedUser = await AuthService.updateUserProfile(updateData);
            
            // Update local state
            const updatedProfile: ProfileData = {
                ...profile,
                fullName: updatedUser.name || profile.fullName,
                email: updatedUser.email || profile.email,
                profileImage: updatedUser.profile_image || '',
            };
            
            setProfile(updatedProfile);
            await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updatedProfile));
        } catch (error) {
            console.error('Error updating profile:', error);
            throw error
        }
    };
    
    useEffect(()=>{
        loadProfile();
    },[])

    return(
    <ProfileContext.Provider value={{ profile, loadProfile, updateProfile, isLoading }}>
      {children}
    </ProfileContext.Provider>
    )
}

export const useProfile = () =>{
    const context = useContext(ProfileContext);
    if(context){
        throw new Error('useProfile must be used within a ProfileProvider');
    }
    return context
}
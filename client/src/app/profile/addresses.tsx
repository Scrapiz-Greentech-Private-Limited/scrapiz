import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ArrowLeft, MapPin, Plus, Edit, Trash2, Home, Building, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { AuthService, AddressSummary, CreateAddressRequest, UpdateAddressRequest } from 
'../../api/apiService';
import { set } from 'zod';
import { addressSchema } from '@/src/zod';


type AddressFormData ={
      name: string;
  phone_number: string;
  room_number: string;
  street: string;
  area: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  delivery_suggestion: string;
}

const emptyFormData: AddressFormData = {
      name: '',
  phone_number: '',
  room_number: '',
  street: '',
  area: '',
  city: '',
  state: '',
  country: 'India',
  pincode: '',
  delivery_suggestion: '',
}

export default function AddressesScreen(){
    const router = useRouter();
    const [addresses, setAddresses] = useState<AddressSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [open, setOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState<AddressFormData>(emptyFormData);
    const [saving, setSaving]= useState(false);

    useEffect(()=>{
      loadAddresses();
    },[])
    const loadAddresses = async () =>{
        try {
            setLoading(true);
            setError(null);
            const addressdata = await AuthService.getAddresses();
            setAddresses(addressdata);
        } catch (error) {
            setError('Failed to load addresses. Please try again.');
            console.error('Error fetching addresses:', error);
        }finally{
            setLoading(false);
        }
    }
    const handleDeleteAddress = (id: number) =>{
        Alert.alert(
            'Delete Address',
            'Are you sure you want to delete this address?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                    try {
                        setDeletingId(id);
                        await AuthService.deleteAddress(id);
                        setAddresses((prev) => prev.filter((addr) => addr.id !== id));
                        Alert.alert('Success', 'Address deleted successfully.');
                    } catch (error) {
                        Alert.alert('Error', 'Failed to delete address. Please try again.');
                        console.error('Error deleting address:', error);
                    }finally{
                        setDeletingId(null);
                    }
                }
                },
                
            ]
        )
    }
  
    const EditAddress = (id: number) =>{
        const address = addresses.find((addr) => addr.id === id);
        if (address) {
            setFormData({
                name: address.name,
                phone_number: address.phone_number,
                room_number: address.room_number,
                street: address.street,
                area: address.area,
                city: address.city,
                state: address.state,
                country: address.country,
                pincode: address.pincode,
                delivery_suggestion: address.delivery_suggestion,
            });
            setEditingId(id);
            setOpen(true);
        }
    }

    const handleClose = () =>{
        setOpen(false);
        // setEditMode(false);
        setEditingId(null);
        setFormData(emptyFormData);
    }

    const validatedForm = addressSchema.safeParse(formData);
    const handleSave = async () =>{
        if (!validatedForm.success) {
            const firstError = validatedForm.error.errors[0];
            Alert.alert('Validation Error', firstError.message);
            return;
        }
        try {
            setSaving(true);
            const rawPayload = {
              ...validatedForm.data,
              pincode: parseInt(validatedForm.data.pincode, 10),
            }
            const payload: CreateAddressRequest = {
                name: rawPayload.title,
                phone_number: rawPayload.phone_number,
                room_number: rawPayload.room_number,
                street: rawPayload.addressLine,
                area: rawPayload.area,
                city: rawPayload.city,
                state: rawPayload.state,
                country: rawPayload.country,
                pincode: rawPayload.pincode,
                delivery_suggestion: rawPayload.delivery_suggestion,

            }
            if (editingId !== null) {
                const updated = await AuthService.updateAddress(editingId, payload);
                setAddresses(addresses.map(addr =>
                    addr.id === updated.id ? updated : addr
                ));
                Alert.alert('Success', 'Address updated successfully.');
            }else{
                const newAddress = await AuthService.createAddress(payload);
                setAddresses([newAddress, ...addresses]);
                Alert.alert('Success', 'Address added successfully.');
            }
            setOpen(false);
            setEditingId(null);
        } catch (e) {
            console.error('Error saving address:', e || 'API call returned nothing.');
             Alert.alert('Error', (e as any)?.message || 'Failed to save address. Please check connection/inputs.');
        }finally{
            setSaving(false);
        }
    }

    const handleAddress = () =>{
      setEditingId(null);
      setFormData(emptyFormData);
      setOpen(true);
    }

    const getAddressIcon = (name: string) =>{
        const lowerName = name.toLowerCase();
        if (lowerName.includes('home') || lowerName.includes('house')) {
        return <Home size={20} color="#16a34a" />;
        }
        if (lowerName.includes('office') || lowerName.includes('work')) {
      return <Building size={20} color="#3b82f6" />;
        }
        return <MapPin size={20} color="#6b7280" />;
    }

    const formatAddress = (addr: AddressSummary) =>{
        const parts = [
            addr.room_number,
            addr.street,
            addr.area,
            addr.city,
            addr.pincode
        ].filter(Boolean);
        return parts.join(', ');
    }

    const getDefaultAddress = (): number | null => {
    return addresses.length > 0 ? addresses[0].id : null;
  };

  const isDefaultAddress = (id: number): boolean => {
    return getDefaultAddress() === id;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Addresses</Text>
          <View style={styles.addButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#16a34a" />
          <Text style={styles.loadingText}>Loading addresses...</Text>
        </View>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Addresses</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddress}>
          <Plus size={20} color="#16a34a" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.addAddressCard} onPress={handleAddress}>
          <View style={styles.addAddressIcon}>
            <Plus size={24} color="#16a34a" />
          </View>
          <View style={styles.addAddressContent}>
            <Text style={styles.addAddressTitle}>Add New Address</Text>
            <Text style={styles.addAddressSubtitle}>Add a new pickup location</Text>
          </View>
        </TouchableOpacity>

        {error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadAddresses}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {addresses.length === 0 && !error ? (
          <View style={styles.emptyState}>
            <MapPin size={48} color="#d1d5db" />
            <Text style={styles.emptyStateTitle}>No addresses yet</Text>
            <Text style={styles.emptyStateText}>Add your first pickup address to get started</Text>
          </View>
        ) : (
          <View style={styles.addressesList}>
            {addresses.map((address) => (
              <View key={address.id} style={styles.addressCard}>
                <View style={styles.addressHeader}>
                  <View style={styles.addressTitleRow}>
                    {getAddressIcon(address.name)}
                    <Text style={styles.addressTitle}>{address.name}</Text>
                    {isDefaultAddress(address.id) && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>Default</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.addressActions}>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => EditAddress(address)}
                    >
                      <Edit size={16} color="#6b7280" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => handleDeleteAddress(address.id)}
                      disabled={deletingId === address.id}
                    >
                      {deletingId === address.id ? (
                        <ActivityIndicator size="small" color="#dc2626" />
                      ) : (
                        <Trash2 size={16} color="#dc2626" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
                
                <Text style={styles.addressText}>{formatAddress(address)}</Text>
                
                {address.phone_number && (
                  <Text style={styles.addressPhone}>📞 {address.phone_number}</Text>
                )}
                
                {address.delivery_suggestion && (
                  <Text style={styles.addressNote}>Note: {address.delivery_suggestion}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>About Addresses</Text>
          <Text style={styles.infoText}>
            • You can save multiple pickup addresses for convenience{'\n'}
            • Set a default address for faster checkout{'\n'}
            • Edit or delete addresses anytime{'\n'}
            • All addresses are securely stored
          </Text>
        </View>
      </ScrollView>

      {/* Add/Edit Address Modal */}
      <Modal
        visible={open}
        animationType="slide"
        transparent={false}
        onRequestClose={handleClose }
      >
        <KeyboardAvoidingView 
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleClose }>
              <X size={24} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editMode ? 'Edit Address' : 'Add New Address'}
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Address Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Home, Office"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Phone Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
                value={formData.phone_number}
                onChangeText={(text) => setFormData({ ...formData, phone_number: text })}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>House/Flat Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Flat 101"
                value={formData.room_number}
                onChangeText={(text) => setFormData({ ...formData, room_number: text })}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Street *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter street name"
                value={formData.street}
                onChangeText={(text) => setFormData({ ...formData, street: text })}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Area/Locality *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter area"
                value={formData.area}
                onChangeText={(text) => setFormData({ ...formData, area: text })}
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>City *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter city"
                  value={formData.city}
                  onChangeText={(text) => setFormData({ ...formData, city: text })}
                />
              </View>

              <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>State *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter state"
                  value={formData.state}
                  onChangeText={(text) => setFormData({ ...formData, state: text })}
                />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Pincode *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter pincode"
                  keyboardType="number-pad"
                  value={formData.pincode}
                  onChangeText={(text) => setFormData({ ...formData, pincode: text })}
                />
              </View>

              <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Country *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter country"
                  value={formData.country}
                  onChangeText={(text) => setFormData({ ...formData, country: text })}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Delivery Instructions (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="e.g., Ring bell twice, near gate"
                multiline
                numberOfLines={3}
                value={formData.delivery_suggestion}
                onChangeText={(text) => setFormData({ ...formData, delivery_suggestion: text })}
              />
            </View>

            <TouchableOpacity 
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.saveButtonText}>
                  {editMode ? 'Update Address' : 'Save Address'}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  )


}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  addAddressCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  addAddressIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  addAddressContent: {
    flex: 1,
  },
  addAddressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  addAddressSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
  },
  errorCard: {
    backgroundColor: '#fef2f2',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#fecaca',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  addressesList: {
    marginBottom: 24,
  },
  addressCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  addressTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  addressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  defaultBadge: {
    backgroundColor: '#dcfce7',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 12,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#16a34a',
    fontFamily: 'Inter-SemiBold',
  },
  addressActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressText: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 8,
  },
  addressPhone: {
    fontSize: 13,
    color: '#374151',
    fontFamily: 'Inter-Medium',
    marginBottom: 8,
  },
  addressNote: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
    fontStyle: 'italic',
    backgroundColor: '#f9fafb',
    padding: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#16a34a',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#166534',
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formRow: {
    flexDirection: 'row',
    marginHorizontal: -8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    fontFamily: 'Inter-Medium',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    fontFamily: 'Inter-Regular',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Inter-SemiBold',
  },
});


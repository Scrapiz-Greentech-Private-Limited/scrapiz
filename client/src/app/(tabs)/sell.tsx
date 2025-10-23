import React, { useEffect, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator'
import Toast from 'react-native-toast-message';
import {View,Text,Image,StyleSheet,ScrollView,TouchableOpacity,TextInput,Alert,Dimensions,StatusBar,ActivityIndicator,ColorValue,} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {Plus, Minus,Calendar,MapPin,User,Phone,Camera,X,IndianRupee,ArrowRight,ArrowLeft,Trash2,Clock,CheckCircle,Sparkles,Zap,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { AuthService, AddressSummary, ProductSummary } from '../../api/apiService';
import { AddressForm, addressSchema, contactSchema, scheduleSchema } from '@/src/zod';
import { roundToNearestMinutes } from 'date-fns';
type SelectedItem = {
    id: number;
  name: string;
  rate: number;
  unit: string;
  quantity: number;
  image?: any;
}

const { width } = Dimensions.get('window');
const stepTitles = [
  'Select Materials',
  'Pickup Details',
  'Confirmation'
];
const timeSlots = [
  '9:00 AM - 11:00 AM',
  '11:00 AM - 1:00 PM',
  '1:00 PM - 3:00 PM',
  '3:00 PM - 5:00 PM',
  '5:00 PM - 7:00 PM',
];
export default function SellScreen() {
  const router = useRouter();
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [useNewAddress, setUseNewAddress] = useState(true);
  const [addresses, setAddresses] = useState<AddressSummary[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [loadingAddresses, setLoadingAddresses] = useState<boolean>(false);
  const [loadingData, setLoadingData] = useState(false);
  const [newAddressForm , setNewAddressForm] = useState({
    name:'',
    phone_number:'',
    room_number:'',
    street:'',
    area:'',
    city:'',
    state: '', country:'India', pincode:'', delivery_suggestion: '',
  })
  const [editAddressForm, setEditAddressForm] = useState({
        name: '', phone_number: '', room_number: '', street: '', area: '', city: '',
        state: '', country: 'India', pincode: '', delivery_suggestion: '',
    });
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [creatingAddress, setCreatingAddress] = useState<boolean>(false);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [contactform , setContactForm] = useState({
    name: '',
    mobile: '',
  });
  
   const [addressForm, setAddressForm] = useState({
    title: '',
    addressLine: '',
    landmark: '',
    city: '',
    pinCode: '',
  });
  const [scheduleForm, setScheduleForm] = useState({
    date: '',
    time: '',
  })

  const load = async()=>{
    setLoadingData(true);
    try {
      const [prods, addrs] = await Promise.all([
        AuthService.getProducts(),
        AuthService.getAddresses()
      ])
      setProducts(prods)
      setAddresses(addrs)
      if(addrs.length > 0){
        setSelectedAddressId(addrs[0].id);
        setUseNewAddress(false);
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load data'
      })
    } finally {
      setLoadingData(false);
    }
  }

  useEffect(()=>{
    load();
  },[])

const compressImage = async(uri:string) =>{
  try {
    console.log('Compressing image: ', uri)
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,[
        {resize:{width: 1920}}
      ],
      {
        compress: 0.7,
        format: ImageManipulator.SaveFormat.JPEG,

      }
    );
    console.log('Image Compressed !: ', manipResult.uri)
    return manipResult.uri
  } catch (error) {
    console.error(error)
    return uri;
  }
}

  const pickImage = async() =>{
    const {status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if(status !== 'granted'){
      Alert.alert('Permission Denied', 'Permission to access media library is required!');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
    allowsMultipleSelection:true,
    quality: 0.8,
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
  });
  if (!result.canceled) {
    const compressedUris: string[] = [];
    for(const asset of result.assets){
      const compressedUri = await compressImage(asset.uri)
      compressedUris.push(compressedUri);
    }
      // const uris = result.assets.map((asset) => asset.uri);
      setSelectedImages((prev) => [...prev, ...compressedUris]);
      Toast.show({
        type:"success",
        text1:"Image Added",
        text2: `${compressedUris.length} images are compressed and ready`
      })
    }
  }

  const removeImage = (uri: string) => {
    setSelectedImages((prev) => prev.filter((imageUri) => imageUri !== uri));
  }
  

  const addItem = (product: ProductSummary) => {
    const rate = product.max_rate ?? product.min_rate ?? 0;
    const existingItem = selectedItems.find(item => item.id === product.id);
    if (existingItem) {
      setSelectedItems(selectedItems.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setSelectedItems([...selectedItems, { id: product.id, name: product.name, rate, icon: '♻️', quantity: 1 }]);
    }
  };

  const updateQuantity = (id: number, change: number) => {
    const updated: Array<{ id: number; name: string; rate: number; icon: string; quantity: number }> = [];
    for (const item of selectedItems) {
      if (item.id === id) {
        const newQuantity = Math.max(0, item.quantity + change);
        if (newQuantity > 0) {
          updated.push({ ...item, quantity: newQuantity });
        }
      } else {
        updated.push(item);
      }
    }
    setSelectedItems(updated);
  };

  const removeItem = (id: number) => {
    setSelectedItems(selectedItems.filter(item => item.id !== id));
  };

  const getTotalAmount = () => {
    return selectedItems.reduce((total, item) => total + (item.rate * item.quantity), 0);
  };

  

  const validateStep = (step:number):boolean =>{
    const newErrors: { [key: string]: string } = {};
    try {
      switch(step){
        case 1:
          if(selectedItems.length === 0){
            newErrors.items = 'Please select at least one item to sell';
          }
        break;
        case 2:
          console.log('Validating step 2, scheduleForm:', scheduleForm);
          const scheduleResult = scheduleSchema.safeParse(scheduleForm);
          if(!scheduleResult.success){
            console.log('Schedule validation failed:', scheduleResult.error);
            scheduleResult.error.errors.forEach((err) => {
              newErrors[err.path[0]] = err.message;
            });
          }
        break;
        case 3:
          console.log('Validating step 3, contactform:', contactform);
          console.log('useNewAddress:', useNewAddress);
          console.log('addressForm:', addressForm);
          
          const contactResult = contactSchema.safeParse(contactform); 
          if (!contactResult.success) {
            console.log('Contact validation failed:', contactResult.error);
            contactResult.error.errors.forEach((err) => {
              newErrors[err.path[0]] = err.message;
            });
          }
          
          if(useNewAddress){
            const addressResult = addressSchema.safeParse(addressForm);
            if (!addressResult.success) {
              console.log('Address validation failed:', addressResult.error);
              addressResult.error.errors.forEach((err) => {
                newErrors[err.path[0]] = err.message;
              });
            }
          } else if (!selectedAddressId) {
            newErrors.address = 'Please select a saved address';
          }
        break;

      }
      
      console.log('Validation errors:', newErrors);
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;

    } catch(error:any) {
      console.error('Validation exception:', error);
      Alert.alert('Error', error.message || 'Validation failed');
      return false;
    }
  }

  const handleNext = () =>{
    const validationResult = validateStep(currentStep);
    if(!validationResult){
      // Errors are already set in validateStep and will be displayed
      return;
    }
    if(currentStep < 4) setCurrentStep(currentStep + 1);
    else handleOrderSubmission();
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleOrderSubmission = async() => {
    setSubmittingOrder(true);
    try {
      const itemsPayload = selectedItems.map(i => ({
        product_id: i.id,
        quantity : i.quantity,
      }));
      let addressId = selectedAddressId;
      if(useNewAddress){
        const validateAddress = addressSchema.safeParse(addressForm);
        const validatedContact = contactSchema.safeParse(contactform);
        const newAddr = await AuthService.createAddress({
          name: validateAddress.data.title,
          phone_number: validatedContact.data.mobile,
          room_number:'',
          street: validateAddress.data.addressLine,
          area: validateAddress.data.landmark || '',
          city: validateAddress.data.city,
          state: '',
          country: 'India',
          pincode: parseInt(validateAddress.data.pinCode, 10) || 0,
          delivery_suggestion: ''
        })
        addressId = newAddr.id;

      }else{
        addressId = selectedAddressId || 0;
      }
      console.log('Submitting order with images:', selectedImages);
      console.log('Items payload:', itemsPayload);
      console.log('Address ID:', addressId);
      
      const result = await AuthService.createOrder(itemsPayload, addressId, selectedImages);
      console.log('Order creation result:', result);
      
      Alert.alert('Success', 'Your pickup has been scheduled successfully!', [
        {
          text: 'View Orders',
          onPress: () => {
            resetForm();
            router.push('/(tabs)/orders');
          },

        },{
          text: 'Schedule Another',
          onPress: () => {
            resetForm();
          },
        },
      ]);
    } catch (error) {
      setErrors({ submission: (error as any).message || 'Failed to submit order' });
    }finally{
      setSubmittingOrder(false);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setSelectedItems([]);
    setScheduleForm({date : '', time: ''});
    setAddressForm({
         title: '',
      addressLine: '',
      landmark: '',
      city: '',
      pinCode: '',
    })
    setContactForm({
      name: '',
      mobile: '',
    })
    setErrors({});
    setSelectedImages([]);
  };

  const formatAddress = (addr: AddressForm | AddressSummary):string =>{
    if('addressLine' in addr){
      const parts = [
        addr.addressLine,
        addr.city,
        addr.pinCode
      ].filter(Boolean);
      return parts.join(', ');
    }else{
      const parts = [
        addr.room_number,
        addr.street,
        addr.area,
        addr.city,
        addr.pincode
      ].filter(Boolean);
      return parts.join(', ');
    }
  }

    const clearError = (field: string) => {
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleCreateAddress = async () => {
    if (!newAddressForm.name.trim()) {
      Alert.alert('Error', 'Please enter address name');
      return;
    }
    setCreatingAddress(true);
    
    try {
      const payload = {
        name: newAddressForm.name.trim(),
        phone_number: newAddressForm.phone_number.trim(),
        room_number: newAddressForm.room_number.trim(),
        street: newAddressForm.street.trim(),
        area: newAddressForm.area.trim(),
        city: newAddressForm.city.trim(),
        state: newAddressForm.state.trim(),
        country: newAddressForm.country.trim() || 'India',
        pincode: parseInt(newAddressForm.pincode, 10) || 0,
        delivery_suggestion: newAddressForm.delivery_suggestion.trim(),
      };
      const created = await AuthService.createAddress(payload);
      const list = await AuthService.getAddresses();
      setAddresses(list);
      setUseNewAddress(false);
      setSelectedAddressId(created.id);
      Alert.alert('Success', 'Address saved');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save address');
    } finally {
      setCreatingAddress(false);
    }
  };

  const beginEditAddress = (addr: AddressSummary) => {
    setEditingAddressId(addr.id);
    setEditAddressForm({
      name: addr.name || '',
      phone_number: addr.phone_number || '',
      room_number: addr.room_number || '',
      street: addr.street || '',
      area: addr.area || '',
      city: addr.city || '',
      state: addr.state || '',
      country: addr.country || 'India',
      pincode: String(addr.pincode || ''),
      delivery_suggestion: addr.delivery_suggestion || '',
    });
  };

  const saveEditAddress = async () => {
    if (!editingAddressId) return;
    try {
      const payload: any = { ...editAddressForm };
      if (typeof payload.pincode === 'string') payload.pincode = parseInt(payload.pincode, 10) || 0;
      const updated = await AuthService.updateAddress(editingAddressId, payload);
      const list = await AuthService.getAddresses();
      setAddresses(list);
      setEditingAddressId(null);
      Alert.alert('Success', 'Address updated');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update address');
    }
  };

  const deleteAddress = async (id: number) => {
    Alert.alert('Delete Address', 'Are you sure you want to delete this address?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await AuthService.deleteAddress(id);
          const list = await AuthService.getAddresses();
          setAddresses(list);
          if (selectedAddressId === id) setSelectedAddressId(list[0]?.id ?? null);
        } catch (e: any) {
          Alert.alert('Error', e.message || 'Failed to delete address');
        }
      }}
    ]);
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3, 4].map((step) => (
        <React.Fragment key={step}>
          <View style={[styles.stepCircle, currentStep >= step && styles.stepCircleActive]}>
            <Text style={[styles.stepNumber, currentStep >= step && styles.stepNumberActive]}>
              {step}
            </Text>
          </View>
          {step < 4 && (
            <View style={[styles.stepLine, currentStep > step && styles.stepLineActive]} />
          )}
        </React.Fragment>
      ))}
    </View>
  );

    const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Select Items to Sell</Text>
      <Text style={styles.stepSubtitle}>Choose the scrap materials you want to sell</Text>

      {loadingData ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#16a34a" />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      ) : (
        <ScrollView style={styles.productsContainer} showsVerticalScrollIndicator={false}>
          {products.map((product) => (
            <TouchableOpacity
              key={product.id}
              style={styles.itemCard}
              onPress={() => addItem(product)}
            >
              <View style={styles.itemLeft}>
                <View style={styles.itemIconContainer}>
                  <Text style={styles.itemIcon}>♻️</Text>
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{product.name}</Text>
                  <Text style={styles.itemRate}>
                    ₹{product.min_rate}-{product.max_rate}/{product.unit}
                  </Text>
                  <Text style={styles.itemDescription} numberOfLines={1}>
                    {product.description}
                  </Text>
                </View>
              </View>
              <View style={styles.addButton}>
                <Plus size={16} color="white" />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {selectedItems.length > 0 && (
        <View style={styles.selectedItems}>
          <Text style={styles.selectedItemsTitle}>Selected Items ({selectedItems.length})</Text>
          {selectedItems.map((item) => (
            <View key={item.id} style={styles.selectedItemCard}>
              <View style={styles.selectedItemLeft}>
                <Text style={styles.selectedItemIcon}>♻️</Text>
                <View>
                  <Text style={styles.selectedItemName}>{item.name}</Text>
                  <Text style={styles.selectedItemRate}>
                    ₹{Math.round(item.rate)}/{item.unit}
                  </Text>
                </View>
              </View>
              <View style={styles.quantityControls}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => updateQuantity(item.id, -1)}
                >
                  <Minus size={16} color="#6b7280" />
                </TouchableOpacity>
                <Text style={styles.quantityText}>
                  {item.quantity}
                  {item.unit}
                </Text>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => updateQuantity(item.id, 1)}
                >
                  <Plus size={16} color="#6b7280" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.removeButton} onPress={() => removeItem(item.id)}>
                  <Trash2 size={16} color="#dc2626" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );


   const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Schedule Pickup</Text>
      <Text style={styles.stepSubtitle}>Choose your preferred date and time</Text>

      <View style={styles.dateSection}>
        <Text style={styles.sectionLabel}>Select Date</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.datesScroll}>
          {Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() + i);
            const dateStr = date.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            });
            return (
              <TouchableOpacity
                key={i}
                style={[
                  styles.dateCard,
                  scheduleForm.date === dateStr && styles.dateCardSelected,
                ]}
                onPress={() => {
                  setScheduleForm((prev) => ({ ...prev, date: dateStr }));
                  clearError('date');
                }}
              >
                <Text
                  style={[
                    styles.dateText,
                    scheduleForm.date === dateStr && styles.dateTextSelected,
                  ]}
                >
                  {dateStr}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.timeSection}>
        <Text style={styles.sectionLabel}>Select Time Slot</Text>
        {timeSlots.map((slot) => (
          <TouchableOpacity
            key={slot}
            style={[
              styles.timeSlot,
              scheduleForm.time === slot && styles.timeSlotSelected,
            ]}
            onPress={() => {
              setScheduleForm((prev) => ({ ...prev, time: slot }));
              clearError('time');
            }}
          >
            <Text
              style={[
                styles.timeSlotText,
                scheduleForm.time === slot && styles.timeSlotTextSelected,
              ]}
            >
              {slot}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Contact & Address</Text>
      <Text style={styles.stepSubtitle}>Provide your contact details and pickup address</Text>

      {/* Contact Information */}
      <View style={styles.contactCard}>
        <View style={styles.contactHeader}>
          <User size={20} color="#111827" />
          <Text style={styles.contactHeaderTitle}>Contact Information</Text>
        </View>

        <View style={styles.contactForm}>
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>
              Full Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.formInput, errors.name && styles.formInputError]}
              placeholder="Enter your full name"
              value={contactform.name}
              onChangeText={(text) => {
                setContactForm((prev) => ({ ...prev, name: text }));
                clearError('name');
              }}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>
              Mobile Number <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.mobileInputContainer}>
              <Phone size={16} color="#6b7280" style={styles.mobileIcon} />
              <TextInput
                style={[styles.mobileInput, errors.mobile && styles.formInputError]}
                placeholder="+91 98765 43210"
                value={contactform.mobile}
                onChangeText={(text) => {
                  setContactForm((prev) => ({ ...prev, mobile: text }));
                  clearError('mobile');
                }}
                keyboardType="phone-pad"
                maxLength={15}
              />
            </View>
            {errors.mobile && <Text style={styles.errorText}>{errors.mobile}</Text>}
          </View>
        </View>
      </View>

      <View style={styles.addressCard}>
        <View style={styles.addressHeader}>
          <MapPin size={20} color="#111827" />
          <Text style={styles.addressHeaderTitle}>Select or Add Address</Text>
        </View>

        <View style={styles.addressTabs}>
          <TouchableOpacity
            style={[styles.addressTab, useNewAddress && styles.addressTabActive]}
            onPress={() => setUseNewAddress(true)}
          >
            <Text style={[styles.addressTabText, useNewAddress && styles.addressTabTextActive]}>
              Add New Address
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addressTab, !useNewAddress && styles.addressTabActive]}
            onPress={() => setUseNewAddress(false)}
          >
            <Text style={[styles.addressTabText, !useNewAddress && styles.addressTabTextActive]}>
              Use Saved Address
            </Text>
          </TouchableOpacity>
        </View>

        {useNewAddress ? (
          <View style={styles.addressForm}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                Address Title <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.formInput, errors.title && styles.formInputError]}
                placeholder="e.g., Home, Office"
                value={addressForm.title}
                onChangeText={(text) => {
                  setAddressForm((prev) => ({ ...prev, title: text }));
                  clearError('title');
                }}
              />
              {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                Address Line <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.formInput, errors.addressLine && styles.formInputError]}
                placeholder="House/Flat no, Street name"
                value={addressForm.addressLine}
                onChangeText={(text) => {
                  setAddressForm((prev) => ({ ...prev, addressLine: text }));
                  clearError('addressLine');
                }}
              />
              {errors.addressLine && <Text style={styles.errorText}>{errors.addressLine}</Text>}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Area/Landmark</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Nearby landmark or area"
                value={addressForm.landmark}
                onChangeText={(text) =>
                  setAddressForm((prev) => ({ ...prev, landmark: text }))
                }
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 12 }]}>
                <Text style={styles.formLabel}>
                  City <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.formInput, errors.city && styles.formInputError]}
                  placeholder="City"
                  value={addressForm.city}
                  onChangeText={(text) => {
                    setAddressForm((prev) => ({ ...prev, city: text }));
                    clearError('city');
                  }}
                />
                {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
              </View>
              <View style={[styles.formGroup, { flex: 1, marginLeft: 12 }]}>
                <Text style={styles.formLabel}>
                  PIN Code <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.formInput, errors.pinCode && styles.formInputError]}
                  placeholder="123456"
                  keyboardType="numeric"
                  maxLength={6}
                  value={addressForm.pinCode}
                  onChangeText={(text) => {
                    setAddressForm((prev) => ({ ...prev, pinCode: text }));
                    clearError('pinCode');
                  }}
                />
                {errors.pinCode && <Text style={styles.errorText}>{errors.pinCode}</Text>}
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.savedAddresses}>
            {addresses.length > 0 ? (
              addresses.map((addr) => (
                <TouchableOpacity
                  key={addr.id}
                  style={styles.savedAddressCard}
                  onPress={() => setSelectedAddressId(addr.id)}
                >
                  <View style={styles.savedAddressInfo}>
                    <Text style={styles.savedAddressTitle}>{addr.name}</Text>
                    <Text style={styles.savedAddressText}>{formatAddress(addr)}</Text>
                  </View>
                  <View style={styles.savedAddressRadio}>
                    {selectedAddressId === addr.id && <View style={styles.radioSelected} />}
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.noAddressText}>No saved addresses. Please add a new one.</Text>
            )}
          </View>
        )}
      </View>

      {/* Photo Upload Section */}
      <View style={styles.photoCard}>
        <View style={styles.photoHeader}>
          <Camera size={20} color="#111827" />
          <Text style={styles.photoHeaderTitle}>Upload Photos (Optional)</Text>
        </View>

        <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
          <Camera size={24} color="#6b7280" />
          <Text style={styles.photoButtonText}>Add Photos</Text>
          <Text style={styles.photoButtonSubtext}>Help us identify your scrap better</Text>
        </TouchableOpacity>

        {selectedImages.length > 0 && (
          <View style={styles.selectedImagesContainer}>
            <Text style={styles.selectedImagesTitle}>
              Selected Photos ({selectedImages.length})
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.imagesScroll}
            >
              {selectedImages.map((uri, index) => (
                <View key={index} style={styles.imageContainer}>
                  <Image source={{ uri }} style={styles.selectedImage} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImage(uri)}
                  >
                    <X size={16} color="white" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </View>
  );
  

  const renderStep4 = () => {
    console.log('Rendering step 4');
    console.log('selectedItems:', selectedItems);
    console.log('scheduleForm:', scheduleForm);
    console.log('addressForm:', addressForm);
    console.log('useNewAddress:', useNewAddress);
    console.log('selectedAddressId:', selectedAddressId);
    console.log('addresses:', addresses);
    console.log('selectedImages:', selectedImages);
    
    return (
      <View style={styles.stepContent}>
        <View style={styles.stepHeader}>
          <CheckCircle size={24} color="#10b981" />
          <Text style={styles.stepHeaderTitle}>Order Summary</Text>
          <Text style={styles.stepSubtitle}>Review your pickup details</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Items</Text>
          {selectedItems && selectedItems.length > 0 ? selectedItems.map((item) => (
            <View key={item.id} style={styles.summaryItem}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.itemIcon}>♻️</Text>
                <Text style={styles.summaryItemName}>
                  {item.name} ({item.quantity} {item.unit})
                </Text>
              </View>
              <Text style={styles.summaryItemAmount}>
                ₹{Math.round(item.rate * item.quantity)}
              </Text>
            </View>
          )) : <Text>No items selected</Text>}
          <View style={styles.summaryDivider} />
          <View style={styles.summaryTotal}>
            <Text style={styles.summaryTotalLabel}>Estimated Total</Text>
            <Text style={styles.summaryTotalAmount}>₹{getTotalAmount()}</Text>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Pickup Schedule</Text>
          <View style={styles.summaryDetail}>
            <Calendar size={16} color="#6b7280" />
            <Text style={styles.summaryDetailText}>
              {scheduleForm.date} at {scheduleForm.time}
            </Text>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Pickup Address</Text>
          <View style={styles.summaryDetail}>
            <MapPin size={16} color="#6b7280" />
            <View style={styles.summaryAddressContainer}>
              {useNewAddress && addressForm.title && (
                <Text style={styles.summaryAddressTitle}>{addressForm.title}</Text>
              )}
              {!useNewAddress && selectedAddressId && (
                <Text style={styles.summaryAddressTitle}>
                  {addresses.find((a) => a.id === selectedAddressId)?.name || 'Selected Address'}
                </Text>
              )}
              <Text style={styles.summaryDetailText}>
                {useNewAddress
                  ? formatAddress(addressForm)
                  : (addresses.find((a) => a.id === selectedAddressId) 
                      ? formatAddress(addresses.find((a) => a.id === selectedAddressId)!)
                      : 'Address not found')}
              </Text>
            </View>
          </View>
        </View>

        {selectedImages.length > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Uploaded Photos</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {selectedImages.map((uri, index) => (
                <Image key={index} source={{ uri }} style={styles.selectedImage} />
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    );
  };

   return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#1e293b" barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sell Scrap</Text>
        <Text style={styles.stepTitle}>{stepTitles[currentStep - 1]}</Text>
        {renderStepIndicator()}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </ScrollView>

      {selectedItems.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.navigationButtons}>
            {currentStep > 1 && (
              <TouchableOpacity style={styles.previousButton} onPress={handlePrevious}>
                <ArrowLeft size={20} color="#6b7280" />
                <Text style={styles.previousButtonText}>Previous</Text>
              </TouchableOpacity>
            )}

            <View style={styles.totalSection}>
              <Text style={styles.totalLabel}>Estimated Total</Text>
              <View style={styles.totalAmount}>
                <IndianRupee size={16} color="#16a34a" />
                <Text style={styles.totalValue}>{Math.round(getTotalAmount())}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.nextButton}
              onPress={handleNext}
              disabled={submittingOrder}
            >
              <Text style={styles.nextButtonText}>
                {submittingOrder
                  ? 'Processing...'
                  : currentStep === 4
                  ? 'Schedule Pickup'
                  : 'Next'}
              </Text>
              <ArrowRight size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      )}
      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#1e293b',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: 'white',
    fontFamily: 'Inter-ExtraBold',
    marginBottom: 8,
  },
  stepTitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Inter-Regular',
    marginBottom: 20,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#475569',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleActive: {
    backgroundColor: '#16a34a',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
    fontFamily: 'Inter-SemiBold',
  },
  stepNumberActive: {
    color: 'white',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: '#475569',
    marginHorizontal: 4,
  },
  stepLineActive: {
    backgroundColor: '#16a34a',
  },
  content: {
    flex: 1,
  },
  stepContent: {
    padding: 20,
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
    marginBottom: 24,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
  },
  productsContainer: {
    maxHeight: 400,
  },
  itemCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemIcon: {
    fontSize: 24,
  },
  itemInfo: {
    flex: 1
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  itemRate: {
    fontSize: 13,
    color: '#16a34a',
    fontFamily: 'Inter-Medium',
    marginBottom: 2,
  },
  itemDescription: {
    fontSize: 12,
    color: '#9ca3af',
    fontFamily: 'Inter-Regular',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedItems: {
    marginTop: 24,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  selectedItemsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Inter-Bold',
    marginBottom: 16,
  },
  selectedItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  selectedItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectedItemIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  selectedItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
  },
  selectedItemRate: {
    fontSize: 12,
    color: '#16a34a',
    fontFamily: 'Inter-Medium',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
    minWidth: 40,
    textAlign: 'center',
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  dateSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
  },
  datesScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  dateCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  dateCardSelected: {
    backgroundColor: '#f0fdf4',
    borderColor: '#16a34a',
  },
  dateText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    fontFamily: 'Inter-SemiBold',
  },
  dateTextSelected: {
    color: '#16a34a',
  },
  timeSection: {
    marginBottom: 24,
  },
  timeSlot: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  timeSlotSelected: {
    backgroundColor: '#f0fdf4',
    borderColor: '#16a34a',
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
  },
  timeSlotTextSelected: {
    color: '#16a34a',
  },
  contactCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  contactHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Inter-Bold',
    marginLeft: 8,
  },
  contactForm: {
    gap: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  required: {
    color: '#dc2626',
  },
  formInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: '#111827',
    fontFamily: 'Inter-Regular',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  formInputError: {
    borderColor: '#dc2626',
  },
  errorText: {
    fontSize: 12,
    color: '#dc2626',
    fontFamily: 'Inter-Regular',
    marginTop: 4,
  },
  mobileInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 14,
  },
  mobileIcon: {
    marginRight: 8,
  },
  mobileInput: {
    flex: 1,
    padding: 14,
    fontSize: 14,
    color: '#111827',
    fontFamily: 'Inter-Regular',
  },
  addressCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  addressHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Inter-Bold',
    marginLeft: 8,
  },
  addressTabs: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  addressTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  addressTabActive: {
    backgroundColor: 'white',
  },
  addressTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    fontFamily: 'Inter-SemiBold',
  },
  addressTabTextActive: {
    color: '#16a34a',
  },
  addressForm: {
    gap: 16,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  savedAddresses: {
    gap: 12,
  },
  savedAddressCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  savedAddressInfo: {
    flex: 1,
  },
  savedAddressTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  savedAddressText: {
    fontSize: 13,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
    lineHeight: 18,
  },
  savedAddressRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#16a34a',
  },
  noAddressText: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    paddingVertical: 20,
  },
  photoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  photoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  photoHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Inter-Bold',
    marginLeft: 8,
  },
  photoButton: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  photoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    fontFamily: 'Inter-SemiBold',
    marginTop: 8,
  },
  photoButtonSubtext: {
    fontSize: 12,
    color: '#9ca3af',
    fontFamily: 'Inter-Regular',
    marginTop: 4,
  },
  selectedImagesContainer: {
    marginTop: 16,
  },
  selectedImagesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
  },
  imagesScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  imageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  selectedImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#dc2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryItemIconImage: {
    width: 28,
    height: 28,
    marginRight: 10,
    borderRadius: 6,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Inter-Bold',
    marginBottom: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  summaryItemName: {
    fontSize: 14,
    color: '#374151',
    fontFamily: 'Inter-Regular',
    flex: 1,
  },
  summaryItemAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16a34a',
    fontFamily: 'Inter-SemiBold',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 12,
  },
  summaryTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Inter-Bold',
  },
  summaryTotalAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: '#16a34a',
    fontFamily: 'Inter-ExtraBold',
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  summaryDetail: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  summaryDetailText: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
    marginLeft: 8,
    flex: 1,
  },
  summaryAddressContainer: {
    marginLeft: 8,
    flex: 1,
  },
  summaryAddressTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  footer: {
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  navigationButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previousButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  previousButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    fontFamily: 'Inter-SemiBold',
    marginLeft: 4,
  },
  totalSection: {
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
  },
  totalAmount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#16a34a',
    fontFamily: 'Inter-ExtraBold',
    marginLeft: 2,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16a34a',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  nextButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
    fontFamily: 'Inter-Bold',
    marginRight: 4,
  },
});
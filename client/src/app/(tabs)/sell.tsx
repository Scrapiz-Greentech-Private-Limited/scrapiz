import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
  StatusBar,
  Image,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import {
  Plus,
  Minus,
  Calendar,
  Wallet,
  MapPin,
  Camera,
  IndianRupee,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Phone,
  User,
  X,
  FileText,
  Scale,
  AlertCircle,
  Check,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import { AuthService, ProductSummary, AddressSummary, CategorySummary } from '../../api/apiService';
import { useReferral } from '../../context/ReferralContext';
import { useOrderCalculationStore } from '../../store/orderCalculationStore';
import { RemoteImage } from '../../components/RemoteImage';
import { useTheme } from '../../context/ThemeContext';
import { sellTutorialConfig } from '../../config/tutorials/homeTutorial';
import { useTutorialStore } from '../../store/tutorialStore';
import TutorialOverlay from '../../components/TutorialOverlay';
import { useLocation } from '../../context/LocationContext';
import SellLocationGate from '../../components/SellLocationGate';
import SellServiceUnavailable from '../../components/SellServiceUnavailable';
import {
  hasSellServiceabilityBeenChecked,
  getSellServiceAvailability,
  setSellServiceability,
  resetSellServiceability
} from '../../utils/sellServiceability';
import { isSellScreenGateEnforcedCached } from '../../utils/sellScreenEnforcement';
import FeedbackModal from '../../components/FeedbackModal';
import NetworkRetryOverlay from '../../components/NetworkRetryOverlay';
import { useNetworkRetry } from '../../hooks/useNetworkRetry';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import {
  saveGuestOrderState,
  loadGuestOrderState,
  clearGuestOrderState,
  hasGuestOrderState,
  type GuestOrderState
} from '../../utils/guestOrderPersistence';
const { width, height } = Dimensions.get('window');

type SelectedItem = {
  id: number;
  name: string;
  rate: number;
  unit: string;
  quantity: number;
  image?: any;
};

const timeSlots = [
  '9:00 AM - 11:00 AM',
  '11:00 AM - 1:00 PM',
  '1:00 PM - 3:00 PM',
  '3:00 PM - 5:00 PM',
  '5:00 PM - 7:00 PM'
];

const stepTitles = [
  'Select Items',
  'Schedule Pickup',
  'Pickup Address',
  'Order Summary'
];

// Helper to get product image - checks S3 URL first, then falls back to local assets
const getImageForProduct = (product: ProductSummary) => {
  // Priority 1: Use S3 image if available
  if (product.image_url) {
    return { uri: product.image_url };
  }

  // Priority 2: Fallback to local assets based on product name
  const name = product.name.toLowerCase();
  if (name.includes('newspaper')) return require('../../../assets/images/Scrap_Rates_Photos/Newspaper.jpg');
  if (name.includes('cardboard')) return require('../../../assets/images/Scrap_Rates_Photos/Cardboard.jpg');
  if (name.includes('book') || name.includes('paper')) return require('../../../assets/images/Scrap_Rates_Photos/Book.jpg');
  if (name.includes('plastic')) return require('../../../assets/images/Scrap_Rates_Photos/Plastics.jpg');
  if (name.includes('iron') || name.includes('steel')) return require('../../../assets/images/Scrap_Rates_Photos/Iron.jpg');
  if (name.includes('aluminum') || name.includes('aluminium')) return require('../../../assets/images/Scrap_Rates_Photos/Aluminium.jpg');
  if (name.includes('copper')) return require('../../../assets/images/Scrap_Rates_Photos/Copper.jpg');
  if (name.includes('brass')) return require('../../../assets/images/Scrap_Rates_Photos/Brass.jpg');
  if (name.includes('tin')) return require('../../../assets/images/Scrap_Rates_Photos/Tin.jpg');
  if (name.includes('refrigerator')) return require('../../../assets/images/Scrap_Rates_Photos/fridge.jpg');
  if (name.includes('battery')) return require('../../../assets/images/Scrap_Rates_Photos/Battery.jpg');
  if (name.includes('front load machine')) return require('../../../assets/images/Scrap_Rates_Photos/FrontLoadMachine.jpg');
  if (name.includes('tv')) return require('../../../assets/images/Scrap_Rates_Photos/TV.jpg');
  if (name.includes('laptops')) return require('../../../assets/images/Scrap_Rates_Photos/Laptops.jpg');
  if (name.includes('windowac')) return require('../../../assets/images/Scrap_Rates_Photos/WindowAC.jpg');
  if (name.includes('printer')) return require('../../../assets/images/Scrap_Rates_Photos/Printer.jpg');
  if (name.includes('microwave')) return require('../../../assets/images/Scrap_Rates_Photos/Microwave.jpg');
  if (name.includes('glass')) return require('../../../assets/images/Scrap_Rates_Photos/glass.jpg');
  return null;
};

// Helper to get fallback image for a product (used by RemoteImage component)
const getFallbackImageForProduct = (productName: string) => {
  const name = productName.toLowerCase();
  if (name.includes('newspaper')) return require('../../../assets/images/Scrap_Rates_Photos/Newspaper.jpg');
  if (name.includes('cardboard')) return require('../../../assets/images/Scrap_Rates_Photos/Cardboard.jpg');
  if (name.includes('book') || name.includes('paper')) return require('../../../assets/images/Scrap_Rates_Photos/Book.jpg');
  if (name.includes('plastic')) return require('../../../assets/images/Scrap_Rates_Photos/Plastics.jpg');
  if (name.includes('iron') || name.includes('steel')) return require('../../../assets/images/Scrap_Rates_Photos/Iron.jpg');
  if (name.includes('aluminum') || name.includes('aluminium')) return require('../../../assets/images/Scrap_Rates_Photos/Aluminium.jpg');
  if (name.includes('copper')) return require('../../../assets/images/Scrap_Rates_Photos/Copper.jpg');
  if (name.includes('brass')) return require('../../../assets/images/Scrap_Rates_Photos/Brass.jpg');
  if (name.includes('tin')) return require('../../../assets/images/Scrap_Rates_Photos/Tin.jpg');
  if (name.includes('refrigerator')) return require('../../../assets/images/Scrap_Rates_Photos/fridge.jpg');
  if (name.includes('battery')) return require('../../../assets/images/Scrap_Rates_Photos/Battery.jpg');
  if (name.includes('front load machine')) return require('../../../assets/images/Scrap_Rates_Photos/FrontLoadMachine.jpg');
  if (name.includes('tv')) return require('../../../assets/images/Scrap_Rates_Photos/TV.jpg');
  if (name.includes('laptops')) return require('../../../assets/images/Scrap_Rates_Photos/Laptops.jpg');
  if (name.includes('windowac')) return require('../../../assets/images/Scrap_Rates_Photos/WindowAC.jpg');
  if (name.includes('printer')) return require('../../../assets/images/Scrap_Rates_Photos/Printer.jpg');
  if (name.includes('microwave')) return require('../../../assets/images/Scrap_Rates_Photos/Microwave.jpg');
  if (name.includes('glass')) return require('../../../assets/images/Scrap_Rates_Photos/glass.jpg');
  // Default fallback
  return require('../../../assets/images/Scrap_Rates_Photos/TV.jpg');
};

// Gate states for serviceability check
type SellScreenState = 'checking' | 'location_gate' | 'not_serviceable' | 'serviceable';

export default function SellScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { locationSet, serviceAvailable } = useLocation();

  // Serviceability gate state
  const [screenState, setScreenState] = useState<SellScreenState>('checking');
  const [enforceSellGate, setEnforceSellGate] = useState<boolean>(true); // Default to enforced

  // Check serviceability on mount
  useEffect(() => {
    checkServiceability();
  }, []);

  const checkServiceability = async () => {
    try {
      // First, check if sell screen gating is enforced from backend
      const shouldEnforce = await isSellScreenGateEnforcedCached();

      setEnforceSellGate(shouldEnforce);

      // If enforcement is disabled, skip gating logic entirely
      if (!shouldEnforce) {
        console.log('🚀 Sell screen gate enforcement disabled - allowing direct access');
        setScreenState('serviceable');
        return;
      }

      // Original gating logic (only runs if enforcement is enabled)
      console.log('🔒 Sell screen gate enforcement enabled - checking serviceability');

      // If location is already set and service is available from context, allow access
      if (locationSet && serviceAvailable) {
        await setSellServiceability(true);
        setScreenState('serviceable');
        return;
      }

      // Check if we've already done the serviceability check for sell
      const hasChecked = await hasSellServiceabilityBeenChecked();

      if (hasChecked) {
        const isAvailable = await getSellServiceAvailability();
        if (isAvailable) {
          setScreenState('serviceable');
        } else {
          setScreenState('not_serviceable');
        }
      } else {
        // Need to show location gate
        setScreenState('location_gate');
      }
    } catch (error) {
      console.error('Error checking sell screen enforcement:', error);
      // On error, default to showing the content (fail open for better UX)
      setScreenState('serviceable');
    }
  };

  const handleServiceable = () => {
    setScreenState('serviceable');
  };

  const handleNotServiceable = () => {
    setScreenState('not_serviceable');
  };

  const handleGoHome = () => {
    router.replace('/(tabs)/home');
  };

  const handleRetryPincode = async () => {
    // Reset the serviceability state so user can re-enter pincode
    await resetSellServiceability();
    // Show the location gate again
    setScreenState('location_gate');
  };

  // Show loading while checking
  if (screenState === 'checking') {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary, marginTop: 12 }]}>
          Checking service availability...
        </Text>
      </View>
    );
  }

  // Show location gate if not checked yet
  if (screenState === 'location_gate') {
    return (
      <SellLocationGate
        onServiceable={handleServiceable}
        onNotServiceable={handleNotServiceable}
      />
    );
  }

  // Show service unavailable screen
  if (screenState === 'not_serviceable') {
    return (
      <SellServiceUnavailable
        onGoHome={handleGoHome}
        onRetryPincode={handleRetryPincode}
      />
    );
  }

  // Continue with normal sell screen (serviceable)
  return <SellScreenContent />;
}

// Extracted the original sell screen content into a separate component
function SellScreenContent() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  // Auth guard for guest flow - check if user is authenticated
  const { isGuest, isAuthenticated } = useAuthGuard();

  // Get step parameter for restoring guest order flow after authentication
  const { step: stepParam } = useLocalSearchParams<{ step?: string }>();

  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [addresses, setAddresses] = useState<AddressSummary[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [showGuidelinesModal, setShowGuidelinesModal] = useState(true);
  const [useNewAddress, setUseNewAddress] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [submittingOrder, setSubmittingOrder] = useState(false);

  // Feedback modal state
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [lastOrderId, setLastOrderId] = useState<number | null>(null);

  // Tutorial system integration
  const { setStepTarget, currentScreen } = useTutorialStore();
  const stepIndicatorRef = useRef<View>(null);
  const itemSelectionRef = useRef<View>(null);
  const quantityControlsRef = useRef<View>(null);
  const dateTimeRef = useRef<View>(null);
  const addressRef = useRef<View>(null);
  const summaryRef = useRef<View>(null);
  const {
    items: selectedItems,
    estimatedValue,
    referralBonus,
    totalPayout,
    useReferralBonus,
    setItems,
    addItem: addItemToStore,
    updateItemQuantity,
    removeItem: removeItemFromStore,
    setAvailableReferralBalance,
    toggleReferralBonus,
    resetOrder,
    setTotalPayout,
  } = useOrderCalculationStore();

  const [addressForm, setAddressForm] = useState({
    title: '',
    addressLine: '',
    landmark: '',
    city: '',
    pinCode: ''
  });

  const [contactForm, setContactForm] = useState({
    name: '',
    mobile: ''
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  // Quantity selector modal state
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductSummary | null>(null);
  const [tempQuantity, setTempQuantity] = useState('1');

  // Referral wallet - use context
  const { walletBalance, setWalletBalance, updateBalanceAndCache, applyReferralDiscount } = useReferral();
  const [useReferralBalance, setUseReferralBalance] = useState(false);

  // Data loading function wrapped in useCallback for network retry
  const loadDataFn = useCallback(async () => {
    setLoadingData(true);
    try {
      const [prods, cats, addrs] = await Promise.all([
        AuthService.getProducts(),
        AuthService.getCategories(),
        AuthService.getAddresses()
      ]);
      setProducts(prods);
      setCategories(cats);
      setAddresses(addrs);

      if (addrs.length > 0) {
        setSelectedAddressId(addrs[0].id);
        setUseNewAddress(false);
      }
    } finally {
      setLoadingData(false);
    }
  }, []);

  // Network retry hook for handling connection issues
  const {
    showRetryOverlay,
    countdown,
    isRetrying,
    hasFailedPermanently,
    errorMessage,
    retryNow,
    startRetryFlow,
    resetRetryState,
    checkNetworkAndLoad,
  } = useNetworkRetry({
    fetchFn: loadDataFn,
    countdownSeconds: 5,
    maxRetries: 3,
  });

  useEffect(() => {
    setAvailableReferralBalance(walletBalance);
  }, [walletBalance, setAvailableReferralBalance])

  // Load products, addresses, and user data
  useEffect(() => {
    loadData();
    loadUserData();
  }, []);

  /**
   * Guest Order Flow Restoration
   * When a guest returns from authentication with step parameter,
   * restore their previous order state from AsyncStorage
   */
  useEffect(() => {
    const restoreGuestOrderState = async () => {
      // Only proceed if:
      // 1. User is now authenticated (just came back from login)
      // 2. There's a step parameter in the URL
      // 3. There's saved guest order state
      if (!isAuthenticated || !stepParam) {
        return;
      }

      try {
        // Check if there's saved guest order state
        const hasSavedState = await hasGuestOrderState();
        if (!hasSavedState) {
          console.log('📦 No saved guest order state found');
          // Still navigate to the requested step
          const targetStep = parseInt(stepParam, 10);
          if (targetStep >= 1 && targetStep <= 4) {
            setCurrentStep(targetStep);
          }
          return;
        }

        // Load the saved state
        const savedState = await loadGuestOrderState();
        if (!savedState) {
          console.log('📦 Guest order state expired or invalid');
          return;
        }

        console.log('📦 Restoring guest order state:', {
          itemCount: savedState.items?.length || 0,
          date: savedState.selectedDate,
          time: savedState.selectedTime,
          step: stepParam,
        });

        // Restore items to Zustand store
        if (savedState.items && savedState.items.length > 0) {
          setItems(savedState.items);
        }

        // Restore date/time selections
        if (savedState.selectedDate) {
          setSelectedDate(savedState.selectedDate);
        }
        if (savedState.selectedTime) {
          setSelectedTime(savedState.selectedTime);
        }

        // Set the step from URL parameter
        const targetStep = parseInt(stepParam, 10);
        if (targetStep >= 1 && targetStep <= 4) {
          setCurrentStep(targetStep);
          // Skip guidelines modal when returning from auth
          setShowGuidelinesModal(false);
        }

        // Clear the saved state after restoration
        await clearGuestOrderState();
        console.log('✅ Guest order state restored and cleared');

        Toast.show({
          type: 'success',
          text1: 'Welcome back!',
          text2: 'Your order has been restored. Please review and confirm.',
        });
      } catch (error) {
        console.error('Error restoring guest order state:', error);
      }
    };

    restoreGuestOrderState();
  }, [isAuthenticated, stepParam, setItems]);


  // Tutorial system: Measure element positions when tutorial is active
  useEffect(() => {
    if (currentScreen === 'sell') {
      // Small delay to ensure elements are rendered
      const timer = setTimeout(() => {
        // Measure step indicator
        stepIndicatorRef.current?.measure((x, y, width, height, pageX, pageY) => {
          setStepTarget('sell-step-indicator', { x: pageX, y: pageY, width, height });
        });

        // Measure item selection (first category section)
        itemSelectionRef.current?.measure((x, y, width, height, pageX, pageY) => {
          setStepTarget('sell-item-selection', { x: pageX, y: pageY, width, height });
        });

        // Measure quantity controls (if items are selected)
        if (selectedItems.length > 0) {
          quantityControlsRef.current?.measure((x, y, width, height, pageX, pageY) => {
            setStepTarget('sell-quantity', { x: pageX, y: pageY, width, height });
          });
        }

        // Measure date/time selection
        dateTimeRef.current?.measure((x, y, width, height, pageX, pageY) => {
          setStepTarget('sell-datetime', { x: pageX, y: pageY, width, height });
        });

        // Measure address section
        addressRef.current?.measure((x, y, width, height, pageX, pageY) => {
          setStepTarget('sell-address', { x: pageX, y: pageY, width, height });
        });

        // Measure summary section
        summaryRef.current?.measure((x, y, width, height, pageX, pageY) => {
          setStepTarget('sell-summary', { x: pageX, y: pageY, width, height });
        });
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [currentScreen, currentStep, selectedItems.length, setStepTarget]);

  const loadUserData = async () => {
    try {
      const user = await AuthService.getUser();
      if (user && user.name) {
        setContactForm(prev => ({ ...prev, name: user.name }));
      }
    } catch (error) {
      console.log('Could not load user data:', error);
    }
  };


  const loadData = async () => {
    const isConnected = await checkNetworkAndLoad();
    if (isConnected) {
      try {
        await loadDataFn();
      } catch (error: any) {
        const errorMsg = error.message || 'Failed to load data';
        const isNetworkError =
          errorMsg.toLowerCase().includes('network') ||
          errorMsg.toLowerCase().includes('internet') ||
          errorMsg.toLowerCase().includes('connection');

        if (isNetworkError) {
          startRetryFlow(errorMsg);
        }
        // Non-network errors are logged but not shown as disruptive toasts
        console.log('Load data error:', errorMsg);
      }
    }
  };

  const compressImage = async (uri: string) => {
    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1920 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );
      return manipResult.uri;
    } catch (error) {
      return uri;
    }
  };

  const pickImage = async () => {
    const MAX_IMAGES = 5;

    if (selectedImages.length >= MAX_IMAGES) {
      Alert.alert(
        'Limit Reached',
        `You can upload a maximum of ${MAX_IMAGES} images per order.`
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      selectionLimit: MAX_IMAGES - selectedImages.length, // Android-safe
    });

    if (!result.canceled) {
      const compressedUris: string[] = [];

      for (const asset of result.assets) {
        const compressedUri = await compressImage(asset.uri);
        compressedUris.push(compressedUri);
      }

      setSelectedImages(prev => [...prev, ...compressedUris]);

      Toast.show({
        type: 'success',
        text1: 'Images Added',
        text2: `${compressedUris.length} images ready`,
      });
    }
  };

  const removeImage = (uri: string) => {
    setSelectedImages(prev => prev.filter(imageUri => imageUri !== uri));
  };

  const openQuantityModal = (product: ProductSummary) => {
    setSelectedProduct(product);
    const existingItem = selectedItems.find(i => i.id === product.id);
    setTempQuantity(existingItem ? existingItem.quantity.toString() : '1');
    setShowQuantityModal(true);
  };

  const closeQuantityModal = () => {
    setShowQuantityModal(false);
    setSelectedProduct(null);
    setTempQuantity('1');
  };

  const handleQuantityConfirm = () => {
    if (!selectedProduct) return;

    const quantity = parseFloat(tempQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Quantity',
        text2: 'Please enter a valid quantity',
      });
      return;
    }

    const rate = selectedProduct.min_rate; // Use minimum rate for estimated value
    const existingItem = selectedItems.find(i => i.id === selectedProduct.id);

    if (existingItem) {
      updateItemQuantity(selectedProduct.id, quantity);
    } else {
      addItemToStore({
        id: selectedProduct.id,
        name: selectedProduct.name,
        rate,
        unit: selectedProduct.unit,
        quantity,
        image: getImageForProduct(selectedProduct)
      });
    }

    closeQuantityModal();
  };

  const incrementQuantity = () => {
    const current = parseFloat(tempQuantity) || 0;
    setTempQuantity((current + 1).toString());
  };

  const decrementQuantity = () => {
    const current = parseFloat(tempQuantity) || 0;
    if (current > 1) {
      setTempQuantity((current - 1).toString());
    }
  };

  const updateQuantity = (id: number, change: number) => {
    const item = selectedItems.find(i => i.id === id);
    if (item) {
      const newQuantity = item.quantity + change;
      if (newQuantity <= 0) {
        removeItemFromStore(id);
      } else {
        updateItemQuantity(id, newQuantity);
      }
    }
  };

  const removeItem = (id: number) => {
    removeItemFromStore(id);
  };

  const getTotalAmount = () => {
    const total = selectedItems.reduce((sum, item) => {
      const itemTotal = item.rate * item.quantity;
      console.log(`${item.name}: ${item.rate} × ${item.quantity} = ${itemTotal}`);
      return sum + itemTotal;
    }, 0);
    console.log(`Total Amount: ${total}`);
    return total;
  };

  // Calculate referral discount - use full wallet balance as bonus
  const getReferralDiscount = () => {
    if (!useReferralBalance || walletBalance === 0) return 0;
    // Return full wallet balance as bonus (not capped at order amount)
    return walletBalance;
  };

  // Calculate final amount (total + referral bonus)
  const getFinalAmount = () => {
    return getTotalAmount() + getReferralDiscount();
  };

  const getFormattedAddress = () => {
    const { title, addressLine, landmark, city, pinCode } = addressForm;
    let address = '';
    if (addressLine) address += addressLine;
    if (landmark) address += landmark ? `, ${landmark}` : '';
    if (city) address += city ? `, ${city}` : '';
    if (pinCode) address += pinCode ? ` - ${pinCode}` : '';
    return address || 'Address not provided';
  };

  const getSelectedSavedAddress = () => {
    if (!selectedAddressId) return null;
    return addresses.find(addr => addr.id === selectedAddressId);
  };

  const getDisplayAddress = () => {
    if (useNewAddress) {
      return getFormattedAddress();
    } else {
      const savedAddress = getSelectedSavedAddress();
      if (savedAddress) {
        return `${savedAddress.street}, ${savedAddress.city} - ${savedAddress.pincode}`;
      }
      return 'No address selected';
    }
  };

  const getAddressTitle = () => {
    if (useNewAddress) {
      return addressForm.title;
    } else {
      const savedAddress = getSelectedSavedAddress();
      return savedAddress?.name || '';
    }
  };

  const validateMobileNumber = (mobile: string): boolean => {
    const mobileRegex = /^(\+91|91)?[6-9]\d{9}$/;
    return mobileRegex.test(mobile.replace(/\s/g, ''));
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (currentStep === 1 && selectedItems.length === 0) {
      newErrors.items = '📦 Please select at least one item to sell';
    }

    if (currentStep === 2 && (!selectedDate || !selectedTime)) {
      newErrors.schedule = '📅 Please select date and time for pickup';
    }

    if (currentStep === 3) {
      if (useNewAddress) {
        if (!addressForm.title.trim()) newErrors.title = '🏠 Address title is required';
        if (!addressForm.addressLine.trim()) newErrors.addressLine = '📍 Address line is required';
        if (!addressForm.city.trim()) newErrors.city = '🏙️ City is required';
        if (!addressForm.pinCode.trim()) newErrors.pinCode = '📮 PIN code is required';
        else if (!/^\d{6}$/.test(addressForm.pinCode)) newErrors.pinCode = '📮 PIN code must be 6 digits';
      } else {
        if (!selectedAddressId) {
          newErrors.savedAddress = '📍 Please select a saved address';
        }
      }

      if (!contactForm.name.trim()) newErrors.name = '👤 Name is required';
      if (!contactForm.mobile.trim()) newErrors.mobile = '📱 Mobile number is required';
      else if (!validateMobileNumber(contactForm.mobile)) {
        newErrors.mobile = '📱 Please enter a valid 10-digit mobile number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setCurrentStep(1);

    setSelectedDate('');
    setSelectedTime('');
    setAddressForm({
      title: '',
      addressLine: '',
      landmark: '',
      city: '',
      pinCode: ''
    });
    setContactForm({
      name: '',
      mobile: ''
    });
    setUseNewAddress(true);
    setErrors({});
    setSelectedImages([]);
    setNotes('');
    resetOrder();
  };

  const handleNext = async () => {
    setErrors({});

    setTimeout(async () => {
      if (!validateForm()) {
        return;
      }

      /**
       * AUTH GATE: Step 2 → Step 3 Transition
       * Guests can complete Steps 1-2 (item selection, scheduling),
       * but must authenticate before proceeding to Step 3 (address/confirmation)
       */
      if (currentStep === 2 && isGuest) {
        try {
          // Prepare order state to save
          const orderState: GuestOrderState = {
            items: selectedItems.map(item => ({
              id: item.id,
              name: item.name,
              rate: item.rate,
              unit: item.unit,
              quantity: item.quantity,
              image: item.image,
            })),
            selectedDate,
            selectedTime,
            currentStep: 3, // They should return to step 3
          };

          // Save order state to AsyncStorage
          await saveGuestOrderState(orderState);
          console.log('📦 Guest order state saved, redirecting to auth');

          // Show informative toast
          Toast.show({
            type: 'info',
            text1: 'Sign in required',
            text2: 'Please sign in to complete your order. Your cart has been saved!',
            visibilityTime: 3000,
          });

          // Redirect to login with returnTo parameter
          // The returnTo URL includes step=3 so we know to restore state
          const returnTo = encodeURIComponent('/(tabs)/sell?step=3');
          router.push(`/(auth)/login?returnTo=${returnTo}`);
          return;
        } catch (error) {
          console.error('Error saving guest order state:', error);
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'Unable to save your order. Please try again.',
          });
          return;
        }
      }

      // Normal step progression
      if (currentStep < 4) {
        setCurrentStep(currentStep + 1);
      } else {
        handleOrderSubmission();
      }
    }, 0);
  };

  const handlePrevious = () => {
    setErrors({});
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleOrderSubmission = async () => {
    setSubmittingOrder(true);
    try {
      const itemsPayload = selectedItems.map(i => ({
        product_id: i.id,
        quantity: i.quantity,
      }));

      let addressId = selectedAddressId;

      if (useNewAddress) {
        const newAddr = await AuthService.createAddress({
          name: addressForm.title,
          phone_number: contactForm.mobile,
          room_number: '',
          street: addressForm.addressLine,
          area: addressForm.landmark || '',
          city: addressForm.city,
          state: '',
          country: 'India',
          pincode: parseInt(addressForm.pinCode, 10) || 0,
          delivery_suggestion: notes || ''
        });
        addressId = newAddr.id;
      }

      // Calculate estimated value to send
      const orderEstimatedValue = estimatedValue;

      const result = await AuthService.createOrder(
        itemsPayload,
        addressId || undefined,
        selectedImages,
        orderEstimatedValue
      );

      const orderId = result.order_id;
      const orderNumber = result.order_no;

      const orderReferralBonus = useReferralBonus ? referralBonus : 0;
      const orderTotalPayout = useReferralBonus ? totalPayout : estimatedValue;




      // If using referral balance, redeem it via backend
      if (useReferralBonus && orderReferralBonus > 0) {
        try {
          // Call backend to redeem balance
          await AuthService.redeemReferralBalance(orderId, orderReferralBonus);

          // Update local wallet balance and cache it
          const newBalance = Math.max(0, walletBalance - orderReferralBonus);
          await updateBalanceAndCache(newBalance);

          Toast.show({
            type: 'success',
            text1: 'Referral Applied',
            text2: `₹${Math.round(orderReferralBonus)} bonus added to your payout!`
          });
        } catch (redeemError: any) {
          // Log error but don't fail the order
          console.error('Failed to redeem referral balance:', redeemError);
          Toast.show({
            type: 'info',
            text1: 'Order Created',
            text2: 'Referral redemption will be processed shortly'
          });
        }
        setTotalPayout(totalPayout);
      }

      // Show success message
      const message = orderReferralBonus > 0
        ? `Your scrap pickup has been scheduled successfully!\n\n📋 Order: ${orderNumber}\n💰 Estimated Value: ₹${Math.round(orderEstimatedValue)}\n🎁 Referral Bonus: +₹${Math.round(orderReferralBonus)}\n💸 Total Payout: ₹${Math.round(orderTotalPayout)}\n📅 Pickup: ${selectedDate} at ${selectedTime}\n\nOur team will arrive at your doorstep at the scheduled time.`
        : `Your scrap pickup has been scheduled successfully!\n\n📋 Order: ${orderNumber}\n💰 Total Amount: ₹${Math.round(orderEstimatedValue)}\n📅 Pickup: ${selectedDate} at ${selectedTime}\n\nOur team will arrive at your doorstep at the scheduled time.`;

      // Store order ID for feedback
      setLastOrderId(orderId);

      Alert.alert(
        '✅ Booking Confirmed!',
        message,
        [
          {
            text: '📦 View Order',
            onPress: () => {
              resetForm();
              router.push(`/profile/orders/${orderId}` as any);
            }
          },
          {
            text: '✨ Schedule Another',
            onPress: () => {
              resetForm();
              // Show feedback modal after a short delay
              setTimeout(() => {
                setShowFeedbackModal(true);
              }, 500);
            }
          }
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit order');
    } finally {
      setSubmittingOrder(false);
    }
  };

  // Group products by category for display
  const groupedProducts = products.reduce((acc, product) => {
    const categoryId = product.category;
    if (!acc[categoryId]) {
      acc[categoryId] = [];
    }
    acc[categoryId].push(product);
    return acc;
  }, {} as Record<number, ProductSummary[]>);

  // Helper to get category name by ID
  const getCategoryName = (categoryId: number): string => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || 'Items';
  };

  const renderStepIndicator = () => (
    <View ref={stepIndicatorRef} style={styles.stepIndicator}>
      {[1, 2, 3, 4].map((step) => (
        <React.Fragment key={step}>
          <View style={[
            styles.stepCircle,
            currentStep >= step && styles.stepCircleActive
          ]}>
            {currentStep >= step ? (
              <LinearGradient
                colors={isDark ? ['#22c55e', '#16a34a'] : ['#16a34a', '#15803d']}
                style={styles.stepGradient}
              >
                <Text style={styles.stepNumberActive}>
                  {step}
                </Text>
              </LinearGradient>
            ) : (
              <Text style={[styles.stepNumber, { color: colors.textSecondary }]}>
                {step}
              </Text>
            )}
          </View>
          {step < 4 && (
            <View style={[
              styles.stepLine,
              currentStep > step && styles.stepLineActive
            ]} />
          )}
        </React.Fragment>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>Select Items to Sell</Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>Choose the scrap materials you want to sell</Text>

      {loadingData ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading products...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.categoriesContainer}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
          contentContainerStyle={{ paddingBottom: 16 }}
        >
          {Object.entries(groupedProducts).map(([categoryId, categoryProducts], index) => (
            <View
              key={categoryId}
              ref={index === 0 ? itemSelectionRef : null}
              style={styles.categorySection}
            >
              <LinearGradient
                colors={isDark ? ['#22c55e', '#16a34a'] : ['#16a34a', '#15803d']}
                style={styles.categoryHeaderSell}
              >
                <Text style={styles.categoryTitleSell}>
                  {getCategoryName(Number(categoryId))}
                </Text>
              </LinearGradient>

              <View style={styles.categoryItems}>
                {categoryProducts.map((product) => {
                  const productImage = getImageForProduct(product);
                  const fallbackImage = getFallbackImageForProduct(product.name);
                  const selectedItem = selectedItems.find(item => item.id === product.id);
                  const isSelected = !!selectedItem;

                  return (
                    <View
                      key={product.id}
                      style={[
                        styles.itemCard,
                        { backgroundColor: colors.surface, borderColor: colors.border },
                        isSelected && { backgroundColor: isDark ? '#064e3b' : '#f0fdf4', borderColor: colors.primary, borderWidth: 2 }
                      ]}
                    >
                      <View style={styles.itemLeft}>
                        {productImage && (
                          <RemoteImage
                            source={productImage}
                            fallback={fallbackImage}
                            style={styles.itemIconImage}
                            showLoadingIndicator={false}
                          />
                        )}
                        <View style={styles.itemInfo}>
                          <Text
                            style={[styles.itemName, { color: colors.text }]}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {product.name}
                          </Text>
                          <Text style={[styles.itemRate, { color: colors.primary }]}>
                            ₹{product.min_rate}-{product.max_rate}/{product.unit}
                          </Text>
                          <Text style={[styles.itemDescription, { color: colors.textSecondary }]} numberOfLines={1}>
                            {product.description}
                          </Text>
                        </View>
                      </View>

                      {isSelected ? (
                        <View style={styles.itemActions}>
                          <TouchableOpacity
                            style={[styles.quantityBadge, { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.15)' : '#f0fdf4', borderColor: colors.primary }]}
                            onPress={() => openQuantityModal(product)}
                          >
                            <Text style={[styles.quantityBadgeText, { color: colors.primary }]}>
                              {selectedItem.quantity}{product.unit}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.removeButtonSmall, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fee2e2' }]}
                            onPress={() => removeItem(product.id)}
                          >
                            <Trash2 size={16} color="#dc2626" />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={[styles.addButton, { backgroundColor: colors.primary }]}
                          onPress={() => openQuantityModal(product)}
                        >
                          <Plus size={16} color="white" />
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {selectedItems.length > 0 && (
        <View style={styles.selectedItems}>
          <Text style={[styles.selectedItemsTitle, { color: colors.text }]}>Selected Items ({selectedItems.length})</Text>
          {selectedItems.map((item, index) => {
            const fallbackImage = getFallbackImageForProduct(item.name);
            return (
              <View key={item.id} style={[styles.selectedItemCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.selectedItemLeft}>
                  {item.image && (
                    <RemoteImage
                      source={item.image}
                      fallback={fallbackImage}
                      style={styles.selectedItemIconImage}
                      showLoadingIndicator={false}
                    />
                  )}
                  <View>
                    <Text style={[styles.selectedItemName, { color: colors.text }]}
                      numberOfLines={1}
                      ellipsizeMode='tail'>{item.name}</Text>
                    <Text style={styles.selectedItemRate}>
                      ₹{Math.round(item.rate)}/{item.unit}
                    </Text>
                  </View>
                </View>
                <View
                  ref={index === 0 ? quantityControlsRef : null}
                  style={styles.quantityControls}
                >
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => updateQuantity(item.id, -1)}
                  >
                    <Minus size={14} color="#6b7280" />
                  </TouchableOpacity>
                  <Text style={{ color: colors.primary }}>{item.quantity}{item.unit}</Text>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => updateQuantity(item.id, 1)}
                  >
                    <Plus size={14} color="#6b7280" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeItem(item.id)}
                  >
                    <Trash2 size={14} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {errors.items && (
        <Text style={styles.errorTextCentered}>{errors.items}</Text>
      )}
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>Schedule Pickup</Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>Choose your preferred date and time</Text>

      <View ref={dateTimeRef} style={styles.dateSection}>
        <Text style={[styles.sectionLabel, { color: colors.text }]}>Select Date</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.datesScroll}>
          {Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() + i);
            const dateStr = date.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric'
            });
            return (
              <TouchableOpacity
                key={i}
                style={[
                  styles.dateCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  selectedDate === dateStr && { backgroundColor: isDark ? '#064e3b' : '#f0fdf4', borderColor: colors.primary }
                ]}
                onPress={() => setSelectedDate(dateStr)}
              >
                <Text style={[
                  styles.dateText,
                  { color: colors.textSecondary },
                  selectedDate === dateStr && { color: colors.primary }
                ]}>
                  {dateStr}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.timeSection}>
        <Text style={[styles.sectionLabel, { color: colors.text }]}>Select Time Slot</Text>
        {timeSlots.map((slot) => (
          <TouchableOpacity
            key={slot}
            style={[
              styles.timeSlot,
              { backgroundColor: colors.surface, borderColor: colors.border },
              selectedTime === slot && { backgroundColor: isDark ? '#064e3b' : '#f0fdf4', borderColor: colors.primary }
            ]}
            onPress={() => setSelectedTime(slot)}
          >
            <Text style={[
              styles.timeSlotText,
              { color: colors.textSecondary },
              selectedTime === slot && { color: colors.primary }
            ]}>
              {slot}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {errors.schedule && (
        <Text style={styles.errorTextCentered}>{errors.schedule}</Text>
      )}
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>Contact & Address</Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>Provide your contact details and pickup address</Text>

      {/* Contact Information */}
      <View
        ref={addressRef}
        style={[styles.contactCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <View style={styles.contactHeader}>
          <User size={20} color={colors.text} />
          <Text style={[styles.contactHeaderTitle, { color: colors.text }]}>Contact Information</Text>
        </View>

        <View style={styles.contactForm}>
          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: colors.text }]}>Full Name <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={[styles.formInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }, errors.name && styles.formInputError]}
              placeholder="Enter your full name"
              placeholderTextColor={colors.textSecondary}
              value={contactForm.name}
              onChangeText={(text) => {
                setContactForm(prev => ({ ...prev, name: text }));
                if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
              }}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: colors.text }]}>Mobile Number <Text style={styles.required}>*</Text></Text>
            <View style={[styles.mobileInputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Phone size={16} color={colors.textSecondary} style={styles.mobileIcon} />
              <TextInput
                style={[styles.mobileInput, { color: colors.text }, errors.mobile && styles.formInputError]}
                placeholder="Enter your mobile number"
                placeholderTextColor={colors.textSecondary}
                value={contactForm.mobile}
                onChangeText={(text) => {
                  setContactForm(prev => ({ ...prev, mobile: text }));
                  if (errors.mobile) setErrors(prev => ({ ...prev, mobile: '' }));
                }}
                keyboardType="phone-pad"
                maxLength={15}
              />
            </View>
            {errors.mobile && <Text style={styles.errorText}>{errors.mobile}</Text>}
          </View>
        </View>
      </View>

      <View style={[styles.addressCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.addressHeader}>
          <MapPin size={20} color={colors.text} />
          <Text style={[styles.addressHeaderTitle, { color: colors.text }]}>Select or Add Address</Text>
        </View>

        <View style={[styles.addressTabs, { backgroundColor: isDark ? '#1f2937' : '#f3f4f6' }]}>
          <TouchableOpacity
            style={[
              styles.addressTab,
              useNewAddress && {
                backgroundColor: isDark ? '#374151' : 'white',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 1,
              }
            ]}
            onPress={() => {
              setUseNewAddress(true);
              if (errors.savedAddress) {
                setErrors(prev => ({ ...prev, savedAddress: '' }));
              }
            }}
          >
            <Text style={[
              styles.addressTabText,
              { color: isDark ? '#9ca3af' : '#6b7280' },
              useNewAddress && { color: isDark ? '#f9fafb' : '#111827', fontWeight: '600' }
            ]}>
              Add New Address
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.addressTab,
              !useNewAddress && {
                backgroundColor: isDark ? '#374151' : 'white',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 1,
              }
            ]}
            onPress={() => {
              setUseNewAddress(false);
              const addressErrors = ['title', 'addressLine', 'city', 'pinCode'];
              if (addressErrors.some(key => errors[key])) {
                const newErrors = { ...errors };
                addressErrors.forEach(key => delete newErrors[key]);
                setErrors(newErrors);
              }
            }}
          >
            <Text style={[
              styles.addressTabText,
              { color: isDark ? '#9ca3af' : '#6b7280' },
              !useNewAddress && { color: isDark ? '#f9fafb' : '#111827', fontWeight: '600' }
            ]}>
              Use Saved Address
            </Text>
          </TouchableOpacity>
        </View>

        {useNewAddress ? (
          <View style={styles.addressForm}>
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Address Title <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }, errors.title && styles.formInputError]}
                placeholder="e.g., Home, Office"
                placeholderTextColor={colors.textSecondary}
                value={addressForm.title}
                onChangeText={(text) => {
                  setAddressForm(prev => ({ ...prev, title: text }));
                  if (errors.title) setErrors(prev => ({ ...prev, title: '' }));
                }}
              />
              {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Address Line <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }, errors.addressLine && styles.formInputError]}
                placeholder="House/Flat no, Street name"
                placeholderTextColor={colors.textSecondary}
                value={addressForm.addressLine}
                onChangeText={(text) => {
                  setAddressForm(prev => ({ ...prev, addressLine: text }));
                  if (errors.addressLine) setErrors(prev => ({ ...prev, addressLine: '' }));
                }}
              />
              {errors.addressLine && <Text style={styles.errorText}>{errors.addressLine}</Text>}
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Area/Landmark</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                placeholder="Nearby landmark or area"
                placeholderTextColor={colors.textSecondary}
                value={addressForm.landmark}
                onChangeText={(text) => setAddressForm(prev => ({ ...prev, landmark: text }))}
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 12 }]}>
                <Text style={[styles.formLabel, { color: colors.text }]}>City <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }, errors.city && styles.formInputError]}
                  placeholder="City"
                  placeholderTextColor={colors.textSecondary}
                  value={addressForm.city}
                  onChangeText={(text) => {
                    setAddressForm(prev => ({ ...prev, city: text }));
                    if (errors.city) setErrors(prev => ({ ...prev, city: '' }));
                  }}
                />
                {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
              </View>
              <View style={[styles.formGroup, { flex: 1, marginLeft: 12 }]}>
                <Text style={[styles.formLabel, { color: colors.text }]}>PIN Code <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }, errors.pinCode && styles.formInputError]}
                  placeholder="123456"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  maxLength={6}
                  value={addressForm.pinCode}
                  onChangeText={(text) => {
                    setAddressForm(prev => ({ ...prev, pinCode: text }));
                    if (errors.pinCode) setErrors(prev => ({ ...prev, pinCode: '' }));
                  }}
                />
                {errors.pinCode && <Text style={styles.errorText}>{errors.pinCode}</Text>}
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.savedAddresses}>
            {addresses.length > 0 ? (
              addresses.map((address) => (
                <TouchableOpacity
                  key={address.id}
                  style={[
                    styles.savedAddressCard,
                    { backgroundColor: colors.card, borderColor: colors.border },
                    selectedAddressId === address.id && { backgroundColor: isDark ? '#064e3b' : '#f0fdf4', borderColor: colors.primary }
                  ]}
                  onPress={() => setSelectedAddressId(address.id)}
                >
                  <View style={styles.savedAddressInfo}>
                    <Text style={[styles.savedAddressTitle, { color: colors.text }]}>
                      {address.name}
                    </Text>
                    <Text style={[styles.savedAddressText, { color: colors.textSecondary }]}>
                      {address.street}, {address.city} - {address.pincode}
                    </Text>
                  </View>
                  <View style={[styles.savedAddressRadio, { borderColor: colors.primary }]}>
                    {selectedAddressId === address.id && (
                      <View style={[styles.radioSelected, { backgroundColor: colors.primary }]} />
                    )}
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={[styles.noSavedAddress, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <MapPin size={48} color={colors.border} />
                <Text style={[styles.noSavedAddressText, { color: colors.textSecondary }]}>No saved addresses yet</Text>
                <Text style={[styles.noSavedAddressSubtext, { color: colors.textTertiary }]}>
                  Please add a new address to continue
                </Text>
              </View>
            )}
          </View>
        )}
        {errors.savedAddress && !useNewAddress && (
          <Text style={styles.errorText}>{errors.savedAddress}</Text>
        )}
      </View>

      {/* Photo Upload Section */}
      <View style={[styles.photoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.photoHeader}>
          <Camera size={20} color={colors.text} />
          <Text style={[styles.photoHeaderTitle, { color: colors.text }]}>Upload Photos (Optional)</Text>
        </View>

        <TouchableOpacity style={[styles.photoButton, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={pickImage}>
          <Camera size={24} color={colors.textSecondary} />
          <Text style={[styles.photoButtonText, { color: colors.text }]}>Add Photos</Text>
          <Text style={[styles.photoButtonSubtext, { color: colors.textSecondary }]}>Help us identify your scrap better</Text>
        </TouchableOpacity>

        {selectedImages.length > 0 && (
          <View style={styles.selectedImagesContainer}>
            <Text style={[styles.selectedImagesTitle, { color: colors.text }]}>Selected Photos ({selectedImages.length})</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScroll}>
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

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>Order Summary</Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>Review your pickup details</Text>

      <View
        ref={summaryRef}
        style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <Text style={[styles.summaryTitle, { color: colors.text }]}>Items</Text>
        {selectedItems.map((item) => {
          const fallbackImage = getFallbackImageForProduct(item.name);
          return (
            <View key={item.id} style={styles.summaryItem}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }}>
                {item.image && (
                  <RemoteImage
                    source={item.image}
                    fallback={fallbackImage}
                    style={styles.summaryItemIconImage}
                    showLoadingIndicator={false}
                  />
                )}
                <Text style={[styles.summaryItemName, { color: colors.text }]} numberOfLines={2}>
                  {item.name} ({item.quantity}{item.unit})
                </Text>
              </View>
              <Text style={[styles.summaryItemAmount, { color: colors.primary }]}>
                ₹{Math.round(item.rate * item.quantity)}
              </Text>
            </View>
          );
        })}
        <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
        <View style={styles.summaryTotal}>
          <Text style={[styles.summaryTotalLabel, { color: colors.text }]}>Estimated Total</Text>
          <Text style={[styles.summaryTotalAmount, { color: colors.primary }]}>₹{Math.round(getTotalAmount())}</Text>
        </View>
      </View>
      {walletBalance > 0 && (
        <View style={[styles.referralCard, { backgroundColor: colors.surface, borderColor: isDark ? colors.primary : '#dcfce7' }]}>
          <View style={styles.referralHeader}>
            <View style={styles.referralHeaderLeft}>
              <View style={[styles.referralIconContainer, { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.15)' : '#dcfce7' }]}>
                <Wallet size={20} color={walletBalance >= 120 ? colors.primary : "#f59e0b"} />
              </View>
              <View>
                <Text style={[styles.referralTitle, { color: colors.text }]}>Referral Wallet</Text>
                <Text style={[
                  styles.referralBalance,
                  { color: colors.primary },
                  walletBalance < 120 && { color: '#f59e0b' }
                ]}>
                  ₹{walletBalance.toFixed(2)} available
                </Text>
              </View>
            </View>
            {walletBalance >= 120 ? (
              <TouchableOpacity
                style={[
                  styles.referralToggle,
                  useReferralBonus && styles.referralToggleActive
                ]}
                onPress={toggleReferralBonus}
              >
                <View style={[
                  styles.referralToggleCircle,
                  useReferralBonus && styles.referralToggleCircleActive
                ]} />
              </TouchableOpacity>
            ) : (
              <View style={styles.lockedBadge}>
                <Text style={styles.lockedBadgeText}>🔒</Text>
              </View>
            )}
          </View>

          {walletBalance >= 120 ? (
            useReferralBonus && (
              <View style={[styles.referralDiscountInfo, { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.15)' : '#f0fdf4', borderColor: isDark ? colors.primary : '#bbf7d0' }]}>
                <Text style={[styles.referralDiscountText, { color: colors.primary }]}>
                  💰 Referral Applied: +₹{Math.round(referralBonus)}
                </Text>
                <Text style={[styles.referralDiscountSubtext, { color: isDark ? '#dcfce7' : '#15803d' }]}>
                  Bonus amount will be added to your total payout
                </Text>
              </View>
            )
          ) : (
            <View style={[styles.referralLockedInfo, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#fffbeb', borderColor: isDark ? '#f59e0b' : '#fde68a' }]}>
              <View style={[styles.referralLockedIconContainer, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#fef3c7' }]}>
                <AlertCircle size={20} color="#f59e0b" />
              </View>
              <View style={styles.referralLockedTextContainer}>
                <Text style={[styles.referralLockedTitle, { color: isDark ? '#fbbf24' : '#92400e' }]}>
                  Minimum ₹120 Required
                </Text>
                <Text style={[styles.referralLockedSubtext, { color: isDark ? '#fcd34d' : '#b45309' }]}>
                  Earn ₹{(120 - walletBalance).toFixed(2)} more to redeem your referral balance
                </Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Final Amount Summary */}
      {useReferralBonus && referralBonus > 0 && (
        <View style={[styles.finalAmountCard, { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.15)' : '#f0fdf4', borderColor: colors.primary }]}>
          <View style={styles.finalAmountRow}>
            <Text style={[styles.finalAmountLabel, { color: colors.textSecondary }]}>Estimated Value</Text>
            <Text style={[styles.finalAmountValue, { color: colors.textSecondary }]}>₹{Math.round(estimatedValue)}</Text>
          </View>
          <View style={styles.finalAmountRow}>
            <Text style={[styles.finalAmountLabelBonus, { color: colors.primary }]}>Referral Bonus</Text>
            <Text style={[styles.finalAmountValueBonus, { color: colors.primary }]}>+₹{Math.round(referralBonus)}</Text>
          </View>
          <View style={[styles.finalAmountDivider, { backgroundColor: colors.primary }]} />
          <View style={styles.finalAmountRow}>
            <Text style={[styles.finalAmountLabelFinal, { color: colors.text }]}>Total Payout</Text>
            <Text style={[styles.finalAmountValueFinal, { color: colors.primary }]}>₹{Math.round(totalPayout)}</Text>
          </View>
          <Text style={[styles.finalAmountNote, { color: isDark ? '#dcfce7' : '#15803d', borderTopColor: isDark ? colors.primary : '#bbf7d0' }]}>
            💸 You will receive this amount from us
          </Text>
        </View>
      )}

      {/* Pickup Details */}
      <View style={[styles.pickupDetailsCard, { backgroundColor: colors.surface }]}>
        <View style={[styles.pickupDetailsHeader, { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.15)' : '#f0fdf4', borderBottomColor: isDark ? colors.primary : '#dcfce7' }]}>
          <View style={[styles.pickupDetailsIconWrapper, { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : '#dcfce7' }]}>
            <Calendar size={20} color={colors.primary} />
          </View>
          <Text style={[styles.pickupDetailsTitle, { color: colors.text }]}>Pickup Details</Text>
        </View>

        <View style={styles.pickupDetailsContent}>
          <View style={styles.pickupDetailRow}>
            <View style={styles.pickupDetailLabel}>
              <Calendar size={16} color={colors.textSecondary} />
              <Text style={[styles.pickupDetailLabelText, { color: colors.textSecondary }]}>Schedule</Text>
            </View>
            <View style={styles.pickupDetailValue}>
              <Text style={[styles.pickupDetailValueText, { color: colors.text }]}>{selectedDate}</Text>
              <View style={[styles.pickupTimeBadge, { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.15)' : '#f0fdf4', borderColor: colors.primary }]}>
                <Text style={[styles.pickupTimeText, { color: colors.primary }]}>{selectedTime}</Text>
              </View>
            </View>
          </View>

          <View style={[styles.pickupDetailDivider, { backgroundColor: colors.border }]} />

          <View style={styles.pickupDetailRow}>
            <View style={styles.pickupDetailLabel}>
              <MapPin size={16} color={colors.textSecondary} />
              <Text style={[styles.pickupDetailLabelText, { color: colors.textSecondary }]}>Location</Text>
            </View>
            <View style={styles.pickupDetailValue}>
              {getAddressTitle() && (
                <View style={[styles.addressTitleBadge, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff' }]}>
                  <Text style={[styles.addressTitleText, { color: isDark ? '#60a5fa' : '#2563eb' }]}>{getAddressTitle()}</Text>
                </View>
              )}
              <Text style={[styles.pickupAddressText, { color: colors.textSecondary }]}>
                {getDisplayAddress()}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.summaryTitle, { color: colors.text }]}>Contact Information</Text>
        <View style={styles.summaryDetail}>
          <User size={16} color={colors.textSecondary} />
          <Text style={[styles.summaryDetailText, { color: colors.textSecondary }]}>{contactForm.name}</Text>
        </View>
        <View style={styles.summaryDetail}>
          <Phone size={16} color={colors.textSecondary} />
          <Text style={[styles.summaryDetailText, { color: colors.textSecondary }]}>{contactForm.mobile}</Text>
        </View>
      </View>

      {/* Notes Section */}
      <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.notesTitleContainer}>
          <FileText size={18} color={colors.primary} />
          <Text style={[styles.summaryTitle, { color: colors.text }]}>Notes (Optional)</Text>
        </View>
        <TextInput
          style={[styles.notesInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
          placeholder="Add any special instructions or details for pickup..."
          placeholderTextColor={colors.inputPlaceholder}
          multiline
          numberOfLines={4}
          value={notes}
          onChangeText={setNotes}
          textAlignVertical="top"
        />
        <Text style={[styles.notesHint, { color: colors.textSecondary }]}>
          E.g., Gate code, parking instructions, specific location details, etc.
        </Text>
      </View>

      {/* Pickup Charges Section */}
      <View style={[styles.pickupChargesCard, { backgroundColor: colors.surface }]}>
        <View style={[styles.pickupChargesHeader, { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.15)' : '#f0fdf4', borderBottomColor: isDark ? colors.primary : '#dcfce7' }]}>
          <View style={styles.pickupChargesTitleContainer}>
            <View style={[styles.pickupChargesIconWrapper, { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : '#dcfce7' }]}>
              <Scale size={22} color={colors.primary} />
            </View>
            <Text style={[styles.pickupChargesTitle, { color: colors.text }]}>Pickup Charges</Text>
          </View>
          <TouchableOpacity style={[styles.infoIconContainer, { backgroundColor: colors.card }]}>
            <AlertCircle size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.chargeOptionsContainer}>
          <View style={[styles.freeChargeCard, { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.15)' : '#f0fdf4', borderColor: colors.primary }]}>
            <View style={styles.chargeCardHeader}>
              <View style={[styles.freeTagLarge, { backgroundColor: colors.primary }]}>
                <Text style={styles.freeTagLargeText}>FREE</Text>
              </View>
            </View>
            <View style={styles.chargeConditionsContainer}>
              <View style={[styles.chargeCondition, { backgroundColor: colors.card }]}>
                <View style={[styles.conditionIconCircle, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#fef3c7' }]}>
                  <Text style={styles.conditionIcon}>⚖️</Text>
                </View>
                <Text style={[styles.conditionText, { color: colors.textSecondary }]}>Weight above{'\n'}<Text style={[styles.conditionBold, { color: colors.text }]}>20 kg</Text></Text>
              </View>
              <View style={styles.orDividerContainer}>
                <View style={[styles.orDividerLine, { backgroundColor: colors.primary }]} />
                <Text style={[styles.orDividerText, { color: colors.primary }]}>OR</Text>
                <View style={[styles.orDividerLine, { backgroundColor: colors.primary }]} />
              </View>
              <View style={[styles.chargeCondition, { backgroundColor: colors.card }]}>
                <View style={[styles.conditionIconCircle, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#fef3c7' }]}>
                  <Text style={styles.conditionIcon}>💰</Text>
                </View>
                <Text style={[styles.conditionText, { color: colors.textSecondary }]}>Amount above{'\n'}<Text style={[styles.conditionBold, { color: colors.text }]}>₹200</Text></Text>
              </View>
            </View>
          </View>

          <View style={[styles.paidChargeCard, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#fef9f0', borderColor: '#f59e0b' }]}>
            <View style={styles.chargeCardHeader}>
              <View style={styles.paidTagLarge}>
                <Text style={styles.paidTagLargeText}>₹30</Text>
              </View>
            </View>
            <View style={styles.chargeConditionsContainer}>
              <View style={[styles.chargeCondition, { backgroundColor: colors.card }]}>
                <View style={[styles.conditionIconCircle, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#fef3c7' }]}>
                  <Text style={styles.conditionIcon}>⚖️</Text>
                </View>
                <Text style={[styles.conditionText, { color: colors.textSecondary }]}>Weight below{'\n'}<Text style={[styles.conditionBold, { color: colors.text }]}>20 kg</Text></Text>
              </View>
              <View style={styles.andDividerContainer}>
                <View style={styles.andDividerLine} />
                <Text style={styles.andDividerText}>AND</Text>
                <View style={styles.andDividerLine} />
              </View>
              <View style={[styles.chargeCondition, { backgroundColor: colors.card }]}>
                <View style={[styles.conditionIconCircle, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#fef3c7' }]}>
                  <Text style={styles.conditionIcon}>💰</Text>
                </View>
                <Text style={[styles.conditionText, { color: colors.textSecondary }]}>Amount below{'\n'}<Text style={[styles.conditionBold, { color: colors.text }]}>₹200</Text></Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Keep in Mind Section */}
      <View style={[styles.keepInMindCard, { backgroundColor: colors.surface }]}>
        <Text style={[styles.keepInMindTitle, { color: colors.text }]}>
          Please keep in mind that we do not accept{'\n'}the following items:
        </Text>

        <View style={styles.keepInMindGrid}>
          {/* Wood & Glass */}
          <View
            style={[
              styles.keepInMindItem,
              { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.1)' : '#fef9f0' },
            ]}
          >
            <View
              style={[
                styles.keepInMindIconContainer,
                { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#fef3c7' },
              ]}
            >
              <Text style={styles.keepInMindEmoji}>🪵🍾</Text>
              <View style={styles.keepInMindCross}>
                <X size={28} color="#dc2626" strokeWidth={3} />
              </View>
            </View>
            <Text style={[styles.keepInMindText, { color: colors.text }]}>
              We do not buy{'\n'}Wood & Glass
            </Text>
          </View>

          {/* Clothes */}
          <View
            style={[
              styles.keepInMindItem,
              { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.1)' : '#fef9f0' },
            ]}
          >
            <View
              style={[
                styles.keepInMindIconContainer,
                { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#fef3c7' },
              ]}
            >
              <Text style={styles.keepInMindEmoji}>👕👖</Text>
              <View style={styles.keepInMindCross}>
                <X size={28} color="#dc2626" strokeWidth={3} />
              </View>
            </View>
            <Text style={[styles.keepInMindText, { color: colors.text }]}>
              We do not buy{'\n'}Clothes
            </Text>
          </View>

          {/* Scrap Rates */}
          <View
            style={[
              styles.keepInMindItem,
              { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.1)' : '#fef9f0' },
            ]}
          >
            <View
              style={[
                styles.keepInMindIconContainer,
                { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#fef3c7' },
              ]}
            >
              <Text style={styles.keepInMindEmoji}>🪑💻</Text>
              <View style={styles.keepInMindCross}>
                <X size={28} color="#dc2626" strokeWidth={3} />
              </View>
            </View>
            <Text style={[styles.keepInMindText, { color: colors.text }]}>
              We buy only in{'\n'}scrap rates
            </Text>
          </View>

          {/* 20kg */}
          <View
            style={[
              styles.keepInMindItem,
              { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.1)' : '#fef9f0' },
            ]}
          >
            <View
              style={[
                styles.keepInMindIconContainer,
                { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#fef3c7' },
              ]}
            >
              <Text style={styles.keepInMindEmoji}>⚖️📦</Text>
              <Text
                style={[
                  styles.keepInMindWeight,
                  { backgroundColor: colors.surface, color: colors.text },
                ]}
              >
                20 kg
              </Text>
            </View>
            <Text style={[styles.keepInMindText, { color: colors.text }]}>
              Free pickup only{'\n'}above 20 kg
            </Text>
          </View>
        </View>
      </View>

      {selectedImages.length > 0 && (
        <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.summaryTitle, { color: colors.text }]}>Attached Photos</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.summaryImagesScroll}>
            {selectedImages.map((uri, index) => (
              <Image key={index} source={{ uri }} style={styles.summaryImage} />
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Sell Scrap</Text>
        <Text style={[styles.stepTitle, { color: colors.textSecondary }]}>{stepTitles[currentStep - 1]}</Text>
        {renderStepIndicator()}
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollViewContent}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled={true}
      >
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </ScrollView>

      {selectedItems.length > 0 && (
        <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <View style={styles.navigationButtons}>
            {currentStep > 1 && (
              <TouchableOpacity style={[styles.previousButton, { backgroundColor: colors.card }]} onPress={handlePrevious}>
                <ArrowLeft size={20} color={colors.textSecondary} />
                <Text style={[styles.previousButtonText, { color: colors.textSecondary }]}>Previous</Text>
              </TouchableOpacity>
            )}

            <View style={styles.totalSection}>
              <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Estimated Total</Text>
              <View style={styles.totalAmount}>
                <IndianRupee size={16} color={colors.primary} />
                <Text style={[styles.totalValue, { color: colors.primary }]}>{Math.round(totalPayout)}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.nextButton}
              onPress={handleNext}
              activeOpacity={0.8}
              disabled={submittingOrder}
            >
              <LinearGradient
                colors={isDark ? ['#22c55e', '#16a34a', '#15803d'] : ['#16a34a', '#15803d', '#166534']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 18,
                  paddingVertical: 10,
                  borderRadius: 10,
                }}
              >
                {submittingOrder ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Text style={styles.nextButtonText}>
                      {currentStep === 4 ? 'Schedule' : 'Next'}
                    </Text>
                    <ArrowRight size={16} color="white" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Quantity Selector Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showQuantityModal}
        onRequestClose={closeQuantityModal}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.quantityModalOverlay}>
            <TouchableWithoutFeedback onPress={closeQuantityModal}>
              <View style={styles.quantityModalOverlay} />
            </TouchableWithoutFeedback>

            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={[styles.quantityModalContent, { backgroundColor: colors.surface }]}>
                {/* Header */}
                <View style={[styles.quantityModalHeader, { borderBottomColor: colors.border }]}>
                  <View style={styles.quantityModalTitleContainer}>
                    <Scale size={20} color={colors.primary} />
                    <Text style={[styles.quantityModalTitle, { color: colors.text }]}>
                      Select Quantity
                    </Text>
                  </View>
                  <TouchableOpacity onPress={closeQuantityModal} style={styles.quantityModalClose}>
                    <X size={24} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {/* Product Info */}
                {selectedProduct && (
                  <View style={styles.quantityModalProduct}>
                    <View style={styles.quantityModalProductInfo}>
                      {getImageForProduct(selectedProduct) && (
                        <RemoteImage
                          source={getImageForProduct(selectedProduct)!}
                          fallback={getFallbackImageForProduct(selectedProduct.name)}
                          style={styles.quantityModalProductImage}
                          showLoadingIndicator={false}
                        />
                      )}
                      <View style={styles.quantityModalProductDetails}>
                        <Text style={[styles.quantityModalProductName, { color: colors.text }]}>
                          {selectedProduct.name}
                        </Text>
                        <Text style={[styles.quantityModalProductRate, { color: colors.primary }]}>
                          ₹{selectedProduct.min_rate}-{selectedProduct.max_rate}/{selectedProduct.unit}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Quantity Controls */}
                <View style={styles.quantityModalControls}>
                  <Text style={[styles.quantityModalLabel, { color: colors.textSecondary }]}>
                    Quantity ({selectedProduct?.unit})
                  </Text>

                  <View style={styles.quantityModalInputContainer}>
                    <TouchableOpacity
                      style={[styles.quantityModalButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                      onPress={decrementQuantity}
                    >
                      <Minus size={24} color={colors.text} strokeWidth={2.5} />
                    </TouchableOpacity>

                    <TextInput
                      style={[styles.quantityModalInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                      value={tempQuantity}
                      onChangeText={setTempQuantity}
                      keyboardType="decimal-pad"
                      selectTextOnFocus
                    />

                    <TouchableOpacity
                      style={[styles.quantityModalButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                      onPress={incrementQuantity}
                    >
                      <Plus size={24} color={colors.text} strokeWidth={2.5} />
                    </TouchableOpacity>
                  </View>

                  {/* Quick Select Buttons */}
                  <View style={styles.quantityModalQuickSelect}>
                    <Text style={[styles.quantityModalQuickLabel, { color: colors.textSecondary }]}>
                      Quick Select:
                    </Text>
                    <View style={styles.quantityModalQuickButtons}>
                      {[1, 5, 10, 20, 50].map((value) => (
                        <TouchableOpacity
                          key={value}
                          style={[
                            styles.quantityModalQuickButton,
                            { backgroundColor: colors.card, borderColor: colors.border },
                            tempQuantity === value.toString() && { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.15)' : '#f0fdf4', borderColor: colors.primary }
                          ]}
                          onPress={() => setTempQuantity(value.toString())}
                        >
                          <Text style={[
                            styles.quantityModalQuickButtonText,
                            { color: colors.textSecondary },
                            tempQuantity === value.toString() && { color: colors.primary, fontWeight: '600' }
                          ]}>
                            {value}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Estimated Value */}
                  {selectedProduct && (
                    <View style={[styles.quantityModalEstimate, { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.1)' : '#f0fdf4', borderColor: isDark ? colors.primary : '#dcfce7' }]}>
                      <Text style={[styles.quantityModalEstimateLabel, { color: colors.textSecondary }]}>
                        Estimated Value:
                      </Text>
                      <Text style={[styles.quantityModalEstimateValue, { color: colors.primary }]}>
                        ₹{Math.round(selectedProduct.min_rate * (parseFloat(tempQuantity) || 0))}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Action Buttons */}
                <View style={styles.quantityModalActions}>
                  <TouchableOpacity
                    style={[styles.quantityModalCancelButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={closeQuantityModal}
                  >
                    <Text style={[styles.quantityModalCancelText, { color: colors.textSecondary }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.quantityModalConfirmButton}
                    onPress={handleQuantityConfirm}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={isDark ? ['#22c55e', '#16a34a'] : ['#16a34a', '#15803d']}
                      style={styles.quantityModalConfirmGradient}
                    >
                      <Text style={styles.quantityModalConfirmText}>
                        {selectedItems.find(i => i.id === selectedProduct?.id) ? 'Update' : 'Add Item'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Guidelines Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showGuidelinesModal}
        onRequestClose={() => setShowGuidelinesModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Please keep in mind</Text>
            </View>

            <ScrollView
              style={styles.guidelinesScroll}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.guidelinesScrollContent}
              bounces={false}
            >
              <View style={styles.guidelinesGrid}>
                <View style={[styles.guidelineCard, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.1)' : '#fef9f0' }]}>
                  <View style={[styles.guidelineImageContainer, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#fef3c7' }]}>
                    <Text style={styles.guidelineEmoji}>🪵🍾</Text>
                    <View style={styles.crossMark}>
                      <X size={40} color="#dc2626" strokeWidth={4} />
                    </View>
                  </View>
                  <Text style={[styles.guidelineText, { color: colors.text }]}>We do not buy Wood & Glass</Text>
                </View>

                <View style={[styles.guidelineCard, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.1)' : '#fef9f0' }]}>
                  <View style={[styles.guidelineImageContainer, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#fef3c7' }]}>
                    <Text style={styles.guidelineEmoji}>👕👖</Text>
                    <View style={styles.crossMark}>
                      <X size={40} color="#dc2626" strokeWidth={4} />
                    </View>
                  </View>
                  <Text style={[styles.guidelineText, { color: colors.text }]}>We do not buy Clothes</Text>
                </View>

                <View style={[styles.guidelineCard, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.1)' : '#fef9f0' }]}>
                  <View style={[styles.guidelineImageContainer, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#fef3c7' }]}>
                    <Text style={styles.guidelineEmoji}>🪑💻</Text>
                    <View style={styles.crossMark}>
                      <X size={40} color="#dc2626" strokeWidth={4} />
                    </View>
                  </View>
                  <Text style={[styles.guidelineText, { color: colors.text }]}>We buy only in scrap rates</Text>
                </View>

                <View style={[styles.guidelineCard, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.1)' : '#fef9f0' }]}>
                  <View style={[styles.guidelineImageContainer, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#fef3c7' }]}>
                    <Text style={styles.guidelineEmoji}>⚖️📦</Text>
                    <Text style={[styles.weightBadge, { backgroundColor: colors.surface, color: colors.text }]}>20 kg</Text>
                  </View>
                  <Text style={[styles.guidelineText, { color: colors.text }]}>Free pickup only above 20 kg</Text>
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowGuidelinesModal(false)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={isDark ? ['#22c55e', '#16a34a'] : ['#16a34a', '#15803d']}
                style={styles.modalButtonGradient}
              >
                <Text style={styles.modalButtonText}>Okay, I understand</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Network Retry Overlay - handles network errors silently */}
      <NetworkRetryOverlay
        visible={showRetryOverlay}
        countdown={countdown}
        isRetrying={isRetrying}
        hasFailedPermanently={hasFailedPermanently}
        errorMessage={errorMessage || undefined}
        onRetryNow={retryNow}
      />

      <Toast />

      {/* Tutorial Overlay */}
      <TutorialOverlay />

      {/* Feedback Modal */}
      <FeedbackModal
        visible={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        orderId={lastOrderId}
        context="order_completion"
        onSubmitSuccess={() => {
          setLastOrderId(null);
        }}
      />
    </View>
  );
}

// Styles from the new UI (keeping exactly as provided)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  header: {
    backgroundColor: 'white',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  stepTitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 12,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  stepCircleActive: {
    backgroundColor: 'transparent',
  },
  stepGradient: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
  },
  stepNumberActive: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  stepLine: {
    width: 32,
    height: 2,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 6,
  },
  stepLineActive: {
    backgroundColor: '#16a34a',
  },
  content: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: Platform.OS === 'android' ? 100 : 80,
  },
  stepContent: {
    padding: 20,
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
  },
  categoriesContainer: {
    flexGrow: 0,
    flexShrink: 1,
    marginBottom: 16,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryHeaderSell: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  categoryTitleSell: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  categoryItems: {
    gap: 8,
  },
  itemCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemInfo: {
    flex: 1,
    flexShrink: 1,
    marginRight: 8,
  },

  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  itemRate: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 2,
    color: '#16a34a',
  },
  itemDescription: {
    fontSize: 11,
    color: '#6b7280',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  quantityBadgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  removeButtonSmall: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedItems: {
    marginTop: 24,
  },
  selectedItemsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  selectedItemCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    flexShrink: 1,
    marginRight: 8,
  },
  selectedItemIconImage: {
    width: 36,
    height: 36,
    marginRight: 12,
    borderRadius: 6,
  },
  itemIconImage: {
    width: 44,
    height: 44,
    marginRight: 12,
    borderRadius: 10,
  },
  summaryItemIconImage: {
    width: 28,
    height: 28,
    marginRight: 10,
    borderRadius: 6,
  },
  selectedItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    // helps on very small screens
    flexShrink: 1,
  },
  selectedItemRate: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '500',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
    fontSize: 13,
    fontWeight: '600',
    color: '#16a34a',
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
  },
  dateSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  datesScroll: {
    marginHorizontal: -8,
  },
  dateCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 8,
    minWidth: 100,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dateCardSelected: {
    backgroundColor: '#f0fdf4',
    borderColor: '#16a34a',
  },
  dateText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
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
    borderColor: 'transparent',
  },
  timeSlotSelected: {
    backgroundColor: '#f0fdf4',
    borderColor: '#16a34a',
  },
  timeSlotText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
    textAlign: 'center',
  },
  timeSlotTextSelected: {
    color: '#16a34a',
  },
  addressCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  addressHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  addressTabs: {
    flexDirection: 'row',
    marginBottom: 24,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 4,
  },
  addressTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  addressTabActive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  addressTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  addressTabTextActive: {
    color: '#111827',
  },
  addressForm: {
    gap: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  required: {
    color: '#dc2626',
  },
  formInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
  },
  savedAddresses: {
    gap: 12,
  },
  savedAddressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  savedAddressCardActive: {
    borderColor: '#16a34a',
    backgroundColor: '#f0fdf4',
  },
  savedAddressInfo: {
    flex: 1,
  },
  savedAddressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  savedAddressText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  savedAddressRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#16a34a',
  },
  noSavedAddress: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  noSavedAddressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
  },
  noSavedAddressSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
  photoButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  photoButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginTop: 8,
  },
  photoButtonSubtext: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  summaryCard: {
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
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryItemName: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
    marginLeft: 8,
    flexWrap: 'wrap',
  },
  summaryItemAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16a34a',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 16,
  },
  summaryTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  summaryTotalAmount: {
    fontSize: 20,
    fontWeight: '600',
    color: '#16a34a',
  },
  summaryDetail: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  summaryDetailText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  summaryImagesScroll: {
    marginTop: 12,
  },
  summaryImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  footer: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  navigationButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  previousButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
  },
  previousButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  totalSection: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginHorizontal: 12,
  },
  totalLabel: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 3,
  },
  totalAmount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#16a34a',
    marginLeft: 2,
  },
  nextButton: {
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    flexShrink: 1,
  },
  nextButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
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
    marginBottom: 20,
  },
  contactHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  contactForm: {
    gap: 16,
  },
  formInputError: {
    borderColor: '#dc2626',
  },
  errorText: {
    fontSize: 12,
    color: '#dc2626',
    marginTop: 4,
  },
  errorTextCentered: {
    fontSize: 14,
    color: '#dc2626',
    marginTop: 16,
    textAlign: 'center',
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
  },
  mobileInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  mobileInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
  },
  mobileIcon: {
    marginLeft: 12,
  },
  photoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  photoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  photoHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  selectedImagesContainer: {
    marginTop: 20,
  },
  selectedImagesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  imagesScroll: {
    marginHorizontal: -8,
  },
  imageContainer: {
    marginHorizontal: 8,
    position: 'relative',
  },
  selectedImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#dc2626',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  referralCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#dcfce7',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  referralHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  referralHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  referralIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  referralTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
  },
  referralBalance: {
    fontSize: 14,
    color: '#16a34a',
    fontFamily: 'Inter-Medium',
    marginTop: 2,
  }, referralToggle: {
    width: 52,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#e5e7eb',
    padding: 3,
    justifyContent: 'center',
  },
  referralToggleActive: {
    backgroundColor: '#16a34a',
  },
  referralToggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'white',
  },
  referralToggleCircleActive: {
    alignSelf: 'flex-end',
  },
  referralDiscountInfo: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  referralDiscountText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#16a34a',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  referralDiscountSubtext: {
    fontSize: 13,
    color: '#15803d',
    fontFamily: 'Inter-Regular',
  },
  lockedBadge: {
    width: 52,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockedBadgeText: {
    fontSize: 16,
  },
  referralLockedInfo: {
    marginTop: 16,
    padding: 14,
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  referralLockedIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  referralLockedTextContainer: {
    flex: 1,
  },
  referralLockedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 4,
  },
  referralLockedSubtext: {
    fontSize: 13,
    color: '#b45309',
    lineHeight: 18,
  },
  finalAmountCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#16a34a',
  },
  finalAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  finalAmountLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Inter-Medium',
  },
  finalAmountValue: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Inter-SemiBold',
  },
  finalAmountLabelDiscount: {
    fontSize: 14,
    color: '#16a34a',
    fontFamily: 'Inter-Medium',
  },
  finalAmountValueDiscount: {
    fontSize: 14,
    color: '#16a34a',
    fontFamily: 'Inter-SemiBold',
  },
  finalAmountLabelBonus: {
    fontSize: 14,
    color: '#16a34a',
    fontFamily: 'Inter-Medium',
  },
  finalAmountValueBonus: {
    fontSize: 14,
    color: '#16a34a',
    fontFamily: 'Inter-SemiBold',
  },
  finalAmountDivider: {
    height: 1,
    backgroundColor: '#16a34a',
    marginVertical: 12,
    opacity: 0.3,
  },
  finalAmountLabelFinal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
  },
  finalAmountValueFinal: {
    fontSize: 20,
    fontWeight: '800',
    color: '#16a34a',
    fontFamily: 'Inter-SemiBold',
  },
  finalAmountNote: {
    fontSize: 12,
    color: '#15803d',
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#bbf7d0',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: height * 0.80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    padding: 24,
    paddingBottom: 16,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  guidelinesScroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  guidelinesScrollContent: {
    paddingBottom: 16,
  },
  guidelinesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    gap: 12,
  },
  guidelineCard: {
    width: '48%',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    minHeight: 160,
  },
  guidelineImageContainer: {
    width: '100%',
    height: 100,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  guidelineEmoji: {
    fontSize: 48,
  },
  crossMark: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -20,
    marginLeft: -20,
  },
  weightBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    fontSize: 16,
    fontWeight: '700',
  },
  guidelineText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
  modalButton: {
    margin: 20,
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  pickupDetailsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
  },
  pickupDetailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#dcfce7',
  },
  pickupDetailsIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickupDetailsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  pickupDetailsContent: {
    padding: 20,
  },
  pickupDetailRow: {
    gap: 12,
  },
  pickupDetailLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  pickupDetailLabelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pickupDetailValue: {
    gap: 8,
  },
  pickupDetailValueText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  pickupTimeBadge: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#16a34a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  pickupTimeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16a34a',
  },
  pickupDetailDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 16,
  },
  addressTitleBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  addressTitleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
  },
  pickupAddressText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  notesTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  notesInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
    fontSize: 14,
    color: '#111827',
    minHeight: 100,
    maxHeight: 150,
  },
  notesHint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
    fontStyle: 'italic',
  },
  pickupChargesCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
  },
  pickupChargesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#f0fdf4',
    borderBottomWidth: 1,
    borderBottomColor: '#dcfce7',
  },
  pickupChargesTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pickupChargesIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickupChargesTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  infoIconContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  chargeOptionsContainer: {
    padding: 16,
    gap: 12,
  },
  freeChargeCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#16a34a',
    overflow: 'hidden',
  },
  paidChargeCard: {
    backgroundColor: '#fef9f0',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#f59e0b',
    overflow: 'hidden',
  },
  chargeCardHeader: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  freeTagLarge: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  freeTagLargeText: {
    fontSize: 18,
    fontWeight: '800',
    color: 'white',
    letterSpacing: 1,
  },
  paidTagLarge: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  paidTagLargeText: {
    fontSize: 18,
    fontWeight: '800',
    color: 'white',
    letterSpacing: 1,
  },
  chargeConditionsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  chargeCondition: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 10,
  },
  conditionIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  conditionIcon: {
    fontSize: 24,
  },
  conditionText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    flex: 1,
  },
  conditionBold: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  orDividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 4,
  },
  orDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#16a34a',
    opacity: 0.3,
  },
  orDividerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16a34a',
    paddingHorizontal: 8,
  },
  andDividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 4,
  },
  andDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#f59e0b',
    opacity: 0.3,
  },
  andDividerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f59e0b',
    paddingHorizontal: 8,
  },
  keepInMindCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  keepInMindTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  keepInMindGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  keepInMindItem: {
    width: '48%',
    backgroundColor: '#fef9f0',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    minHeight: 140,
    marginHorizontal: 6,
  },
  keepInMindIconContainer: {
    width: '100%',
    height: 80,
    backgroundColor: '#fef3c7',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    position: 'relative',
  },
  keepInMindEmoji: {
    fontSize: 36,
  },
  keepInMindCross: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -16,
    marginLeft: -16,
  },
  keepInMindWeight: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'white',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  keepInMindText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    lineHeight: 16,
  },
  // Quantity Modal Styles
  quantityModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  quantityModalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  quantityModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  quantityModalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityModalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  quantityModalClose: {
    padding: 4,
  },
  quantityModalProduct: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  quantityModalProductInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityModalProductImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
  },
  quantityModalProductDetails: {
    flex: 1,
  },
  quantityModalProductName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  quantityModalProductRate: {
    fontSize: 14,
    fontWeight: '500',
  },
  quantityModalControls: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  quantityModalLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  quantityModalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  quantityModalButton: {
    width: 56,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityModalInput: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  quantityModalQuickSelect: {
    marginBottom: 20,
  },
  quantityModalQuickLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
  },
  quantityModalQuickButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  quantityModalQuickButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  quantityModalQuickButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  quantityModalEstimate: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  quantityModalEstimateLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  quantityModalEstimateValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  quantityModalActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  quantityModalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  quantityModalCancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
  quantityModalConfirmButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  quantityModalConfirmGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  quantityModalConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
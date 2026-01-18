
import { ViewStyle } from 'react-native';

export type Coordinates = [number, number];

export interface CameraController {
  
  setCamera(options: {
    centerCoordinate: Coordinates;
    zoomLevel?: number;
    animationDuration?: number;
  }): void;

  flyTo(coords: Coordinates, duration?: number): void;

  getCenter(): Promise<Coordinates>;
}

export interface MapProviderProps {
  // Map positioning
  center: Coordinates;
  marker: Coordinates;
  zoom: number;

  // Event handlers
  onMapPress: (coords: Coordinates) => void;
  onRegionChange: (coords: Coordinates) => void;
  onRegionChangeEnd: (coords: Coordinates) => void;

  // Camera control ref
  cameraRef: React.RefObject<CameraController>;

  // Map configuration
  style: ViewStyle;
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
}

/**
 * Location result returned when user confirms location selection
 */
export interface LocationResult {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  state: string;
  pincode: string;
  area: string;
}

/**
 * Address component from geocoding API
 */
export interface AddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

/**
 * Geocoding result structure
 */
export interface GeocodingResult {
  formatted_address: string;
  address_components: AddressComponent[];
  place_id: string;
}

/**
 * Search autocomplete result
 */
export interface SearchResult {
  place_id: string;
  description: string;
  structured_formatting?: {
    main_text: string;
    secondary_text: string;
  };
}

/**
 * Place details from search API
 */
export interface PlaceDetails {
  place_id: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  address_components: AddressComponent[];
}

/**
 * Map state management interface
 */
export interface MapState {
  // Coordinate state
  selectedCoords: Coordinates;
  markerCoords: Coordinates;
  currentUserLocation: Coordinates | null;
  previousCenter: Coordinates | null;

  // Address state
  selectedAddress: string;
  selectedAddressDetails: GeocodingResult | null;

  // Search state
  searchQuery: string;
  searchResults: SearchResult[];
  showResults: boolean;

  // Loading state
  isSearching: boolean;
  isLoadingLocation: boolean;
  isMapReady: boolean;

  // Conflict prevention flags
  isSelectingFromSearch: boolean;
  isUserTyping: boolean;

  // UI state
  showActionMenu: boolean;
  saving: boolean;
}

/**
 * Region format for Apple Maps
 */
export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

/**
 * Map configuration constants
 */
export interface MapConfig {
  defaultZoom: number;
  animationDuration: number;
  searchMinCharacters: number;
  searchDebounceMs: number;
  regionChangeDebounceMs: number;
  movementThreshold: number;
}

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  Image,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { Search, X, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useHomeData } from '../hooks/useHomeData';
import { useScrapCategories } from '../hooks/useScrapCategories';
import { services } from '../app/(tabs)/services';

const { width } = Dimensions.get('window');

interface SearchResult {
  id: string;
  name: string;
  description: string;
  category: string;
  categoryIcon: string;
  categoryColor: string;
  type: 'scrap' | 'service';
  image?: any;
  rate?: string;
}

export default function SearchBar() {
  const router = useRouter();
  
  // Backend data hooks
  const { products, categories, loading, error, refetch } = useHomeData();
  const scrapCategories = useScrapCategories(products, categories);
  
  // UI state
  const [isFocused, setIsFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isNavigating, setIsNavigating] = useState(false);

  // Create category lookup map (Task 2.1)
  const categoryMap = useMemo(() => {
    const map = new Map();
    categories.forEach(cat => map.set(cat.id, cat));
    return map;
  }, [categories]);

  // Task 3.1: Generate popular searches from scrapCategories
  const popularSearches = useMemo(() => {
    return scrapCategories.slice(0, 4).map(category => {
      // Remove common prefixes/suffixes for cleaner display labels
      const displayLabel = category.name
        .replace('Types of ', '')
        .replace(' Scrap', '')
        .trim();
      
      return {
        label: displayLabel,
        color: category.color,
        image: category.icon,
        category: category.name, // Keep full category name for navigation
      };
    });
  }, [scrapCategories]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (query.trim().length === 0) {
      setSearchResults([]);
      return;
    }
    const results: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();
    const addedIds = new Set<string>();
    
    // Task 2.2: Search backend products
    products.forEach((product) => {
      const category = categoryMap.get(product.category);
      const itemId = `product-${product.id}`;
      
      if (!addedIds.has(itemId) &&
          (product.name.toLowerCase().includes(lowerQuery) ||
           product.description.toLowerCase().includes(lowerQuery) ||
           category?.name.toLowerCase().includes(lowerQuery))) {
        
        addedIds.add(itemId);
        results.push({
          id: itemId,
          name: product.name,
          description: product.description,
          category: category?.name || 'Unknown',
          categoryIcon: '📦',
          categoryColor: '#16a34a',
          type: 'scrap',
          rate: `₹${product.min_rate}-${product.max_rate}/${product.unit}`,
        });
      }
    });

    // Task 2.3: Search services (static data - unchanged)
    services.forEach((service) => {
      const serviceId = `service-${service.id}`;
      if (!addedIds.has(serviceId) &&
          (service.title.toLowerCase().includes(lowerQuery) ||
           service.description.toLowerCase().includes(lowerQuery))) {
        addedIds.add(serviceId);
        results.push({
          id: serviceId,
          name: service.title,
          description: service.description,
          category: 'Services',
          categoryIcon: '🛠️',
          categoryColor: '#16a34a',
          type: 'service',
        });
      }
    });

    setSearchResults(results);
  }, [products, categoryMap]);

  const handleClear = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsFocused(false);
    setSearchQuery('');
    setSearchResults([]);
    Keyboard.dismiss();
  }, []);

  const handleSelectResult = useCallback((result: SearchResult) => {
    if (isNavigating) return;
    setIsNavigating(true);
    
    // TODO: Implement navigation logic in subsequent tasks
    
    setTimeout(() => {
      setIsNavigating(false);
      handleCloseModal();
    }, 300);
  }, [isNavigating, handleCloseModal]);

  // Task 3.2: Navigation handler for popular searches
  const navigateToSellTab = useCallback((categoryName: string) => {
    if (isNavigating) return;
    setIsNavigating(true);
    
    router.push({
      pathname: '/(tabs)/sell',
      params: { category: categoryName },
    });
    
    setTimeout(() => {
      setIsNavigating(false);
      handleCloseModal();
    }, 300);
  }, [isNavigating, router, handleCloseModal]);

  return (
    <View style={styles.container}>
      {/* Search Input Trigger */}
      <TouchableOpacity
        style={styles.searchInput}
        onPress={() => setIsFocused(true)}
        activeOpacity={0.7}
      >
        <Search size={20} color="#9ca3af" />
        <Text style={styles.searchPlaceholder}>Search for scrap items...</Text>
      </TouchableOpacity>

      {/* Search Modal */}
      <Modal
        visible={isFocused}
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalContainer}>
          {/* Search Header */}
          <View style={styles.searchHeader}>
            <View style={styles.searchInputContainer}>
              <Search size={20} color="#9ca3af" />
              <TextInput
                style={styles.searchTextInput}
                placeholder="Search for scrap items..."
                placeholderTextColor="#9ca3af"
                value={searchQuery}
                onChangeText={handleSearch}
                autoFocus
                returnKeyType="search"
                editable={!loading}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={handleClear} disabled={loading}>
                  <X size={20} color="#9ca3af" />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity onPress={handleCloseModal}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
          </View>

          {/* Loading State */}
          {loading && (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#16a34a" />
              <Text style={styles.loadingText}>Loading data...</Text>
            </View>
          )}

          {/* Error State - Task 5.2: Keep services section functional during errors */}
          {error && !loading && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Failed to load scrap data</Text>
                <Text style={styles.errorSubtext}>{error}</Text>
                <TouchableOpacity onPress={refetch} style={styles.retryButton}>
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              </View>

              {/* Services Section - Always functional during errors */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Services</Text>
                <Text style={styles.sectionSubtitle}>
                  Browse our professional services
                </Text>
                {services.map((service) => (
                  <TouchableOpacity
                    key={service.id}
                    style={styles.categoryItem}
                    onPress={() => handleSelectResult({
                      id: `service-${service.id}`,
                      name: service.title,
                      description: service.description,
                      category: 'Services',
                      categoryIcon: '🛠️',
                      categoryColor: '#16a34a',
                      type: 'service',
                    })}
                  >
                    <View style={styles.serviceIcon}>
                      <Text style={styles.serviceEmoji}>🛠️</Text>
                    </View>
                    <View style={styles.categoryInfo}>
                      <Text style={styles.categoryTitle}>{service.title}</Text>
                      <Text style={styles.categoryCount}>{service.description}</Text>
                    </View>
                    <ChevronRight size={18} color="#9ca3af" />
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          )}

          {/* Content - Only show when not loading and no error */}
          {!loading && !error && (
            <ScrollView style={styles.modalContent}>
              {/* Search Results or Default View */}
              {searchQuery.trim().length === 0 ? (
                <View>
                  {/* Task 5.3: Handle empty data states gracefully */}
                  {scrapCategories.length === 0 ? (
                    <View style={styles.emptyStateContainer}>
                      <Text style={styles.emptyStateText}>No categories available</Text>
                      <Text style={styles.emptyStateSubtext}>
                        Check back later for scrap categories
                      </Text>
                    </View>
                  ) : (
                    <>
                      {/* Popular Searches - Task 3 */}
                      {popularSearches.length > 0 && (
                        <View style={styles.section}>
                          <Text style={styles.sectionTitle}>Popular Searches</Text>
                          <View style={styles.popularGrid}>
                            {popularSearches.map((item, index) => (
                              <TouchableOpacity
                                key={index}
                                style={[
                                  styles.popularItem,
                                  { backgroundColor: item.color + '15' },
                                ]}
                                onPress={() => navigateToSellTab(item.category)}
                              >
                                <Image
                                  source={item.image}
                                  style={styles.popularImage}
                                  resizeMode="cover"
                                />
                                <Text
                                  style={[styles.popularLabel, { color: item.color }]}
                                  numberOfLines={1}
                                >
                                  {item.label}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                      )}

                      {/* Browse Categories - Task 4.1 & 4.2 */}
                      <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Browse Categories</Text>
                        {scrapCategories.map((category) => (
                          <TouchableOpacity
                            key={category.id}
                            style={styles.categoryItem}
                            onPress={() => navigateToSellTab(category.name)}
                          >
                            <Image
                              source={category.icon}
                              style={styles.categoryImage}
                              resizeMode="cover"
                            />
                            <View style={styles.categoryInfo}>
                              <Text style={styles.categoryTitle}>{category.name}</Text>
                              <Text style={styles.categoryCount}>
                                {category.products.length} items
                              </Text>
                            </View>
                            <ChevronRight size={18} color="#9ca3af" />
                          </TouchableOpacity>
                        ))}
                      </View>
                    </>
                  )}

                  {/* Services Section - Always visible */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Services</Text>
                    <Text style={styles.sectionSubtitle}>
                      Browse our professional services
                    </Text>
                    {services.map((service) => (
                      <TouchableOpacity
                        key={service.id}
                        style={styles.categoryItem}
                        onPress={() => handleSelectResult({
                          id: `service-${service.id}`,
                          name: service.title,
                          description: service.description,
                          category: 'Services',
                          categoryIcon: '🛠️',
                          categoryColor: '#16a34a',
                          type: 'service',
                        })}
                      >
                        <View style={styles.serviceIcon}>
                          <Text style={styles.serviceEmoji}>🛠️</Text>
                        </View>
                        <View style={styles.categoryInfo}>
                          <Text style={styles.categoryTitle}>{service.title}</Text>
                          <Text style={styles.categoryCount}>{service.description}</Text>
                        </View>
                        <ChevronRight size={18} color="#9ca3af" />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ) : (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    Search Results ({searchResults.length})
                  </Text>
                  {searchResults.length === 0 ? (
                    <Text style={styles.noResultsText}>
                      No results found for "{searchQuery}"
                    </Text>
                  ) : (
                    searchResults.map((result) => (
                      <TouchableOpacity
                        key={result.id}
                        style={styles.resultItem}
                        onPress={() => handleSelectResult(result)}
                      >
                        <View style={styles.resultInfo}>
                          <Text style={styles.resultName}>{result.name}</Text>
                          <Text style={styles.resultDescription}>
                            {result.description}
                          </Text>
                          {result.rate && (
                            <Text style={styles.resultRate}>{result.rate}</Text>
                          )}
                          <Text style={styles.resultCategory}>
                            {result.categoryIcon} {result.category}
                          </Text>
                        </View>
                        <ChevronRight size={18} color="#9ca3af" />
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 12,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchPlaceholder: {
    fontSize: 16,
    color: '#9ca3af',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchTextInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  cancelButton: {
    fontSize: 16,
    color: '#16a34a',
    fontWeight: '500',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fef2f2',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#dc2626',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyStateContainer: {
    alignItems: 'center',
    padding: 32,
    marginTop: 24,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  serviceIcon: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  serviceEmoji: {
    fontSize: 24,
  },
  modalContent: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  placeholderText: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  noResultsText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    paddingVertical: 24,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  resultDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  resultRate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16a34a',
    marginBottom: 4,
  },
  resultCategory: {
    fontSize: 12,
    color: '#9ca3af',
  },
  popularGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  popularItem: {
    width: (width - 56) / 2,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 8,
  },
  popularImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  popularLabel: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  categoryImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: 14,
    color: '#6b7280',
  },
});
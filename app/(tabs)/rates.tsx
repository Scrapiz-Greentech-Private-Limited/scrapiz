import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { TrendingUp, CircleAlert as AlertCircle, ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const scrapRates = {
  metal: [
    { name: 'Iron', rate: '₹30-35', icon: '🔧', description: 'Scrap iron, steel parts' },
    { name: 'Tin', rate: '₹25-30', icon: '🥫', description: 'Tin cans, containers' },
    { name: 'Steel', rate: '₹45-50', icon: '⚙️', description: 'Steel utensils, parts' },
    { name: 'Aluminum', rate: '₹150-180', icon: '🪜', description: 'Aluminum sheets, cans' },
    { name: 'Brass', rate: '₹600-680', icon: '🔔', description: 'Brass fittings, decorative items' },
    { name: 'Copper', rate: '₹600-680', icon: '🔌', description: 'Copper wires, pipes' },
  ],
  paper: [
    { name: 'Books', rate: '₹10-12', icon: '📚', description: 'Old books, notebooks' },
    { name: 'Cardboard Boxes', rate: '₹10-12', icon: '📦', description: 'Corrugated boxes' },
    { name: 'Office Paper', rate: '₹10-14', icon: '📄', description: 'White office paper' },
    { name: 'Newspaper', rate: '₹12-15', icon: '📰', description: 'Daily newspapers' },
    { name: 'Magazines', rate: '₹8-10', icon: '📖', description: 'Glossy magazines' },
    { name: 'Mixed Paper', rate: '₹6-8', icon: '📋', description: 'Mixed paper waste' },
  ],
  plastic: [
    { name: 'Blue Drum', rate: '₹40-50', icon: '🛢️', description: 'Large plastic drums' },
    { name: 'PVC Pipe', rate: '₹10-15', icon: '🔧', description: 'PVC pipes, fittings' },
    { name: 'Plastic Bottles', rate: '₹20-25', icon: '🧴', description: 'PET bottles' },
    { name: 'Plastic Crates', rate: '₹25-30', icon: '📦', description: 'Storage crates' },
    { name: 'Plastic Bags', rate: '₹15-88', icon: '🛍️', description: 'Polythene bags' },
    { name: 'Plastic Containers', rate: '₹15-20', icon: '🥡', description: 'Food containers' },
  ],
  electronics: [
    { name: 'Mobile Phones', rate: '₹100-500', icon: '📱', description: 'Old smartphones' },
    { name: 'Laptops', rate: '₹500-2000', icon: '💻', description: 'Old laptops, computers' },
    { name: 'TV/Monitor', rate: '₹200-800', icon: '📺', description: 'CRT/LCD screens' },
    { name: 'Cables & Wires', rate: '₹50-150', icon: '🔌', description: 'Electronic cables' },
    { name: 'Circuit Boards', rate: '₹300-1000', icon: '🔧', description: 'PCBs, motherboards' },
    { name: 'Batteries', rate: '₹80-200', icon: '🔋', description: 'Lead acid, lithium' },
  ],
};

const categoryInfo = {
  metal: { title: 'Types of Metal Scrap', color: '#f59e0b', bgColor: '#fef3c7' },
  paper: { title: 'Types of Paper Scrap', color: '#10b981', bgColor: '#d1fae5' },
  plastic: { title: 'Types of Plastic Scrap', color: '#3b82f6', bgColor: '#dbeafe' },
  electronics: { title: 'Types of Electronic Scrap', color: '#8b5cf6', bgColor: '#ede9fe' },
};

export default function RatesScreen() {
  const router = useRouter();

  const renderCategorySection = (categoryKey: keyof typeof scrapRates) => {
    const category = scrapRates[categoryKey];
    const info = categoryInfo[categoryKey];
    
    return (
      <View key={categoryKey} style={styles.categorySection}>
        <View style={[styles.categoryHeader, { backgroundColor: info.bgColor }]}>
          <Text style={[styles.categoryTitle, { color: info.color }]}>
            {info.title}
          </Text>
        </View>
        
        <View style={styles.itemsGrid}>
          {category.map((item, index) => (
            <View key={index} style={styles.rateItem}>
              <View style={[styles.itemIcon, { backgroundColor: info.color }]}>
                <Text style={styles.itemEmoji}>{item.icon}</Text>
              </View>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={[styles.itemRate, { color: info.color }]}>{item.rate}</Text>
              <Text style={styles.itemUnit}>Per kg</Text>
              <Text style={styles.itemDescription}>{item.description}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scrap Rates</Text>
        <View style={styles.headerRight}>
          <TrendingUp size={24} color="#16a34a" />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Disclaimer */}
        <View style={styles.disclaimerCard}>
          <View style={styles.disclaimerHeader}>
            <AlertCircle size={20} color="#16a34a" />
            <Text style={styles.disclaimerTitle}>Important Note</Text>
          </View>
          <Text style={styles.disclaimerText}>
            The prices shown are for reference only. Actual rates may vary based on:
          </Text>
          <View style={styles.disclaimerList}>
            <Text style={styles.disclaimerItem}>• Current market conditions</Text>
            <Text style={styles.disclaimerItem}>• Quality and quantity of materials</Text>
            <Text style={styles.disclaimerItem}>• Location and transportation costs</Text>
            <Text style={styles.disclaimerItem}>• Seasonal demand fluctuations</Text>
          </View>
          <Text style={styles.disclaimerFooter}>
            Contact us for accurate pricing based on your specific materials.
          </Text>
        </View>

        {/* Last Updated */}
        <View style={styles.lastUpdated}>
          <Text style={styles.lastUpdatedText}>
            Last updated: {new Date().toLocaleDateString('en-IN', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            })}
          </Text>
        </View>

        {/* Rate Categories */}
        {Object.keys(scrapRates).map((categoryKey) => 
          renderCategorySection(categoryKey as keyof typeof scrapRates)
        )}

        {/* Market Trends */}
        <View style={styles.trendsSection}>
          <Text style={styles.trendsTitle}>Market Trends</Text>
          <View style={styles.trendsCard}>
            <View style={styles.trendItem}>
              <View style={[styles.trendIndicator, { backgroundColor: '#16a34a' }]} />
              <Text style={styles.trendText}>Metal prices trending downwards</Text>
            </View>
            <View style={styles.trendItem}>
              <View style={[styles.trendIndicator, { backgroundColor: '#f59e0b' }]} />
              <Text style={styles.trendText}>Paper rates stable this month</Text>
            </View>
            <View style={styles.trendItem}>
              <View style={[styles.trendIndicator, { backgroundColor: '#3b82f6' }]} />
              <Text style={styles.trendText}>Electronics demand increasing</Text>
            </View>
          </View>
        </View>

        {/* Contact Section */}
        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>Need Accurate Pricing?</Text>
          <Text style={styles.contactText}>
            Get real-time quotes for your specific materials by scheduling a pickup.
          </Text>
          <TouchableOpacity 
            style={styles.contactButton}
            onPress={() => router.push('/(tabs)/sell')}
          >
            <Text style={styles.contactButtonText}>Schedule Pickup</Text>
          </TouchableOpacity>
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
  headerRight: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  disclaimerCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  disclaimerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  disclaimerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#16a34a',
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  disclaimerText: {
    fontSize: 14,
    color: '#166534',
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 12,
  },
  disclaimerList: {
    marginBottom: 12,
  },
  disclaimerItem: {
    fontSize: 13,
    color: '#166534',
    fontFamily: 'Inter-Regular',
    lineHeight: 18,
    marginBottom: 4,
  },
  disclaimerFooter: {
    fontSize: 13,
    color: '#166534',
    fontFamily: 'Inter-Medium',
    fontWeight: '500',
  },
  lastUpdated: {
    alignItems: 'center',
    marginBottom: 24,
  },
  lastUpdatedText: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
  },
  categorySection: {
    marginBottom: 32,
  },
  categoryHeader: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  rateItem: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    width: (width - 52) / 2,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  itemIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemEmoji: {
    fontSize: 24,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
    marginBottom: 4,
  },
  itemRate: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  itemUnit: {
    fontSize: 11,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
    marginBottom: 8,
  },
  itemDescription: {
    fontSize: 11,
    color: '#9ca3af',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 14,
  },
  trendsSection: {
    marginBottom: 24,
  },
  trendsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
  },
  trendsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  trendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  trendIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  trendText: {
    fontSize: 14,
    color: '#374151',
    fontFamily: 'Inter-Regular',
  },
  contactSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
    textAlign: 'center',
  },
  contactText: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    maxWidth: 280,
  },
  contactButton: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Inter-SemiBold',
  },
});
import React, { useMemo, useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, ArrowRight, MessageSquare, Mic, X } from 'lucide-react-native';
import ScrappyVoiceOrb from '../components/ScrappyVoiceOrb';

const CONTENT: Record<string, { title: string; intro: string; item: string }> = {
  metal: { title: 'Metal Scrap', intro: 'Let’s turn your metal into value.', item: 'metal items' },
  electronic: { title: 'Electronic Scrap', intro: 'I can help you recycle your electronics safely.', item: 'electronic items' },
  services: { title: 'Scrap Related Services', intro: 'From debris removal to tie-ups, I know the way.', item: 'service needs' },
  demolition: { title: 'Demolition', intro: 'Tell me about the space you want to clear.', item: 'demolition work' },
};

export default function ScrappyCategoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { category } = useLocalSearchParams<{ category?: string }>();
  const [showVoice, setShowVoice] = useState(false);
  const content = useMemo(() => CONTENT[category ?? 'metal'] ?? CONTENT.metal, [category]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient colors={['#012615', '#044226', '#065f38', '#02331c', '#011c0f']} locations={[0, 0.25, 0.55, 0.8, 1]} style={StyleSheet.absoluteFillObject} />
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 14) }]}>
        <TouchableOpacity style={styles.circleButton} onPress={() => router.back()} accessibilityLabel="Go back"><ArrowLeft size={22} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerLabel}>SCRAPPY ASSISTANT</Text>
        <TouchableOpacity style={styles.circleButton} onPress={() => router.back()} accessibilityLabel="Close"><X size={21} color="#fff" /></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]} showsVerticalScrollIndicator={false}>
        <Text style={styles.kicker}>NICE CHOICE</Text>
        <Text style={styles.title}>{content.title}</Text>
        <Text style={styles.intro}>{content.intro}</Text>
        <View style={styles.videoFrame}><Video source={{ uri: 'https://scrapiz-inventory.s3.ap-south-1.amazonaws.com/media/transparent-alpha.webm' }} style={styles.video} resizeMode={ResizeMode.CONTAIN} shouldPlay isLooping isMuted useNativeControls={false} /></View>
        <Text style={styles.prompt}>How would you like to add your {content.item}?</Text>
        <View style={styles.optionsCard}>
          <TouchableOpacity style={[styles.option, styles.voiceOption]} onPress={() => setShowVoice(true)} activeOpacity={0.88}>
            <View style={[styles.optionIcon, styles.voiceIcon]}><Mic size={25} color="#063c28" /></View>
            <View style={styles.optionCopy}><Text style={styles.optionTitle}>Talk to Scrappy</Text><Text style={styles.optionSubtitle}>Use your voice and get instant help</Text></View>
            <View style={styles.arrowCircle}><ArrowRight size={21} color="#075b36" /></View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.option} onPress={() => router.push({ pathname: '/scrappy-chat', params: { category: content.item } } as any)} activeOpacity={0.88}>
            <View style={[styles.optionIcon, styles.writeIcon]}><MessageSquare size={25} color="#075b36" /></View>
            <View style={styles.optionCopy}><Text style={styles.optionTitle}>Write to Scrappy</Text><Text style={styles.optionSubtitle}>Type the details at your own pace</Text></View>
            <View style={styles.arrowCircle}><ArrowRight size={21} color="#075b36" /></View>
          </TouchableOpacity>
        </View>
      </ScrollView>
      {showVoice && <ScrappyVoiceOrb onClose={() => setShowVoice(false)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#012615' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingBottom: 8 },
  circleButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  headerLabel: { color: '#d5fbe3', fontSize: 11, fontWeight: '900', letterSpacing: 1.8 },
  content: { alignItems: 'center', paddingHorizontal: 18, paddingTop: 28 },
  kicker: { color: '#8bf6b7', fontSize: 11, fontWeight: '900', letterSpacing: 2.4 },
  title: { color: '#fff', fontSize: 36, fontWeight: '900', textAlign: 'center', marginTop: 10, letterSpacing: -0.8 },
  intro: { color: '#d6f9e3', fontSize: 15, fontWeight: '600', textAlign: 'center', marginTop: 8 },
  videoFrame: { width: '100%', height: 230, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  video: { width: '100%', height: '100%' },
  prompt: { color: '#fff', fontSize: 19, fontWeight: '800', textAlign: 'center', marginTop: 4, marginBottom: 18 },
  optionsCard: { width: '100%', backgroundColor: 'rgba(255,255,255,0.97)', borderRadius: 26, paddingHorizontal: 16, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 10 },
  option: { minHeight: 92, flexDirection: 'row', alignItems: 'center', gap: 13 },
  voiceOption: { borderBottomWidth: 1, borderBottomColor: '#dceee3' },
  optionIcon: { width: 54, height: 54, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  voiceIcon: { backgroundColor: '#a9f7c8' }, writeIcon: { backgroundColor: '#d9f6e6' }, optionCopy: { flex: 1 },
  optionTitle: { color: '#0a3725', fontSize: 17, fontWeight: '900' }, optionSubtitle: { color: '#62806f', fontSize: 12.5, fontWeight: '600', marginTop: 4 },
  arrowCircle: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#d9f9e5', alignItems: 'center', justifyContent: 'center' },
});

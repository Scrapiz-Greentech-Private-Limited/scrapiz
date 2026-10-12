import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Send, UserRound } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScrappyMessageScroller, { ScrappyMessage } from '../components/ScrappyMessageScroller';

export default function ScrappyChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { category } = useLocalSearchParams<{ category?: string }>();
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<ScrappyMessage[]>([{ id: 'welcome', from: 'assistant', content: 'Hi! I’m Scrappy. Tell me a little about what you want to recycle.' }]);
  const send = () => { if (!text.trim()) return; setMessages((items) => [...items, { id: Date.now().toString(), from: 'user', content: text.trim() }]); setText(''); };

  return <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <View style={[styles.header, { paddingTop: Math.max(insets.top + 8, 22) }]}><TouchableOpacity onPress={() => router.back()} style={styles.headerButton}><ArrowLeft color="#0a392a" size={24} /></TouchableOpacity><View><Text style={styles.eyebrow}>SCRAPIZ ASSISTANT</Text><Text style={styles.headerTitle}>Write to Scrappy</Text></View><View style={[styles.headerButton, styles.profileButton]}><UserRound size={21} color="#16a05a" /></View></View>
    <View style={styles.topic}><Text style={styles.topicText}>Talking about your {category ?? 'scrap'} · Scrappy is ready</Text></View>
    <ScrappyMessageScroller messages={messages} />
    <View style={[styles.inputArea, { paddingBottom: Math.max(insets.bottom + 10, 18) }]}><TextInput value={text} onChangeText={setText} placeholder="Write a message…" placeholderTextColor="#7f988e" style={styles.input} multiline /><TouchableOpacity style={styles.send} onPress={send} accessibilityLabel="Send message"><Send size={19} color="#063c28" /></TouchableOpacity></View>
  </KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7fbf8' }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingBottom: 18, backgroundColor: '#f7fbf8' }, headerButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#eef7f1', alignItems: 'center', justifyContent: 'center' }, profileButton: { backgroundColor: '#e7faed' }, eyebrow: { textAlign: 'center', color: '#17a957', fontSize: 10, fontWeight: '900', letterSpacing: 1.5 }, headerTitle: { color: '#073a29', fontSize: 19, fontWeight: '900', marginTop: 3 }, topic: { alignSelf: 'center', backgroundColor: '#eaf8ee', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 7, marginBottom: 3 }, topicText: { color: '#4c7f65', fontSize: 11, fontWeight: '700' }, inputArea: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 18, paddingTop: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e1eee6' }, input: { flex: 1, minHeight: 50, maxHeight: 110, borderRadius: 22, backgroundColor: '#f2f8f4', paddingHorizontal: 17, paddingVertical: 13, color: '#173d31', fontSize: 15 }, send: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#8df5b7', alignItems: 'center', justifyContent: 'center' },
});

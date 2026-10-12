import React, { useRef, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, Text, View } from 'react-native';

export interface ScrappyMessage { id: string; content: string; from: 'user' | 'assistant' }

interface Props { messages: ScrappyMessage[]; }

export default function ScrappyMessageScroller({ messages }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const [following, setFollowing] = useState(true);
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    setFollowing(contentSize.height - (layoutMeasurement.height + contentOffset.y) < 56);
  };
  return (
    <View style={styles.wrap}>
      <ScrollView
        ref={scrollRef}
        style={styles.viewport}
        contentContainerStyle={styles.content}
        onScroll={handleScroll}
        onContentSizeChange={() => following && scrollRef.current?.scrollToEnd({ animated: true })}
        scrollEventThrottle={80}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message) => <View key={message.id} style={[styles.row, message.from === 'user' && styles.userRow]}><View style={[styles.bubble, message.from === 'user' ? styles.userBubble : styles.assistantBubble]}><Text style={[styles.text, message.from === 'user' && styles.userText]}>{message.content}</Text></View></View>)}
      </ScrollView>
      {!following && <Text style={styles.liveHint}>↓ New messages below</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 }, viewport: { flex: 1 }, content: { flexGrow: 1, justifyContent: 'flex-end', padding: 22, gap: 14 }, row: { alignItems: 'flex-start' }, userRow: { alignItems: 'flex-end' }, bubble: { maxWidth: '83%', paddingHorizontal: 17, paddingVertical: 13, borderRadius: 21, shadowColor: '#607f72', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 1 }, assistantBubble: { backgroundColor: '#ffffff', borderTopLeftRadius: 7 }, userBubble: { backgroundColor: '#d7f7e4', borderTopRightRadius: 7 }, text: { color: '#173d31', fontSize: 15, lineHeight: 22, fontWeight: '600' }, userText: { color: '#075b36' }, liveHint: { position: 'absolute', alignSelf: 'center', bottom: 16, backgroundColor: '#143d30', color: '#fff', borderRadius: 18, paddingHorizontal: 13, paddingVertical: 7, fontSize: 12, fontWeight: '700' },
});

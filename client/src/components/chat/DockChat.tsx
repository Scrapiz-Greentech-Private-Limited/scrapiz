import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { MessageSquare, X, Send, Paperclip } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

interface Message {
  id: string;
  text: string;
  isMe: boolean;
  time: string;
}

export interface DockChatProps {
  title?: string;
  buttonColor?: string;
}

export const DockChat: React.FC<DockChatProps> = ({
  title = 'Chat with Customer',
  buttonColor,
}) => {
  const { colors } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'On my way to your location!',
      isMe: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const accent = buttonColor ?? colors.primary;

  const handleToggle = () => setIsOpen((prev) => !prev);

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        text: trimmed,
        isMe: true,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setInputText('');
  };

  return (
    <>
      {/* Chat Panel - slides in from left */}
      <AnimatePresence>
        {isOpen && (
          <MotiView
            key="dock-chat-panel"
            from={{ opacity: 0, translateX: -20, scale: 0.92 }}
            animate={{ opacity: 1, translateX: 0, scale: 1 }}
            exit={{ opacity: 0, translateX: -20, scale: 0.92 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
            style={[
              styles.panel,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            {/* Header */}
            <View style={[styles.panelHeader, { backgroundColor: accent }]}>
              <MessageSquare size={15} color="#fff" fill="#fff" />
              <Text style={styles.panelTitle}>{title}</Text>
              <TouchableOpacity
                onPress={handleToggle}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                activeOpacity={0.7}
              >
                <X size={17} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Messages area */}
            <ScrollView
              style={styles.messages}
              contentContainerStyle={styles.messagesContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {messages.map((msg) => (
                <View
                  key={msg.id}
                  style={[
                    styles.bubble,
                    msg.isMe ? styles.bubbleMe : styles.bubbleOther,
                    {
                      backgroundColor: msg.isMe ? accent : colors.background,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.bubbleText,
                      { color: msg.isMe ? '#fff' : colors.text },
                    ]}
                  >
                    {msg.text}
                  </Text>
                  <Text
                    style={[
                      styles.bubbleTime,
                      {
                        color: msg.isMe ? 'rgba(255,255,255,0.65)' : colors.textTertiary,
                      },
                    ]}
                  >
                    {msg.time}
                  </Text>
                </View>
              ))}
            </ScrollView>

            {/* Input row */}
            <View style={[styles.inputRow, { borderTopColor: colors.border }]}>
              <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
                <Paperclip size={16} color={colors.textSecondary} />
              </TouchableOpacity>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Message customer..."
                placeholderTextColor={colors.inputPlaceholder}
                returnKeyType="send"
                onSubmitEditing={handleSend}
              />
              <TouchableOpacity
                style={[styles.sendBtn, { backgroundColor: accent }]}
                onPress={handleSend}
                activeOpacity={0.85}
              >
                <Send size={14} color="#fff" />
              </TouchableOpacity>
            </View>
          </MotiView>
        )}
      </AnimatePresence>

      {/* Floating toggle button */}
      <MotiView
        animate={{ scale: isOpen ? 0.91 : 1 }}
        transition={{ type: 'spring', damping: 15, stiffness: 280 }}
        style={[styles.toggleBtn, { backgroundColor: accent }]}
      >
        <TouchableOpacity
          style={styles.toggleBtnInner}
          onPress={handleToggle}
          activeOpacity={0.85}
          accessibilityLabel={isOpen ? 'Close chat' : 'Chat with Customer'}
          accessibilityRole="button"
        >
          <AnimatePresence>
            {isOpen ? (
              <MotiView
                key="x-icon"
                from={{ opacity: 0, rotate: '-90deg' }}
                animate={{ opacity: 1, rotate: '0deg' }}
                exit={{ opacity: 0, rotate: '90deg' }}
                transition={{ type: 'timing', duration: 160 }}
              >
                <X size={22} color="#fff" />
              </MotiView>
            ) : (
              <MotiView
                key="msg-icon"
                from={{ opacity: 0, rotate: '90deg' }}
                animate={{ opacity: 1, rotate: '0deg' }}
                exit={{ opacity: 0, rotate: '-90deg' }}
                transition={{ type: 'timing', duration: 160 }}
              >
                <MessageSquare size={22} color="#fff" fill="#fff" />
              </MotiView>
            )}
          </AnimatePresence>
        </TouchableOpacity>
      </MotiView>
    </>
  );
};

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    left: 0,
    bottom: 64, // sits above the toggle button
    width: 262,
    height: 300,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 14,
    zIndex: 100,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  panelTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
  },
  messages: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    flexGrow: 1,
  },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 14,
    gap: 2,
  },
  bubbleMe: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: 'Inter-Regular',
  },
  bubbleTime: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    alignSelf: 'flex-end',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    gap: 6,
  },
  iconBtn: {
    padding: 5,
  },
  input: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    paddingVertical: Platform.OS === 'ios' ? 6 : 3,
  },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 9,
  },
  toggleBtnInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

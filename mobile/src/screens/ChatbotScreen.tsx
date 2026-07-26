import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Send, Bot, User as UserIcon, Key, Lock, ExternalLink } from 'lucide-react-native';
import { chatService, authService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Toast from 'react-native-toast-message';

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
};

export default function ChatbotScreen() {
  const navigation = useNavigation();
  const { user, setUser } = useAuth();
  
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [savingKey, setSavingKey] = useState(false);

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm your AI Financial Assistant. Ask me anything about your spending, budget, or tips to save money!",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleSaveKey = async () => {
    if (!apiKeyInput.trim()) {
      Alert.alert('Error', 'Please enter a valid API key.');
      return;
    }
    setSavingKey(true);
    try {
      const res = await authService.updateMe({ gemini_api_key: apiKeyInput.trim() });
      setUser(res.data);
      Toast.show({ 
        type: 'success', 
        text1: 'AI Assistant Unlocked! 🎉',
        text2: 'You can now chat with your financial data.',
        position: 'top',
        topOffset: 60
      });
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.detail || 'Failed to save API key');
    } finally {
      setSavingKey(false);
    }
  };

  const openGoogleAIStudio = () => {
    Linking.openURL('https://aistudio.google.com/app/apikey');
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await chatService.sendMessage({ message: userMessage.text });
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.data.reply,
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error: any) {
      let errorText = "Sorry, I'm having trouble connecting right now. Please try again later.";
      
      if (error.response?.data?.detail === "GEMINI_KEY_MISSING") {
        // Fallback safety if the key is removed from DB
        setUser({ ...user, gemini_api_key: null } as any);
        return;
      }
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: errorText,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.gemini_api_key) {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages, user?.gemini_api_key]);

  if (!user?.gemini_api_key) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft color="#1f2937" size={24} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Bot color="#4f46e5" size={24} style={{ marginRight: 8 }} />
            <Text style={styles.headerTitle}>AI Assistant</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.setupContainer}>
          <View style={styles.iconCircle}>
            <Lock color="#4f46e5" size={48} />
          </View>
          
          <Text style={styles.setupTitle}>Unlock AI Assistant</Text>
          <Text style={styles.setupSubtitle}>
            To protect your financial privacy and keep this app entirely free, the AI Assistant requires you to Bring-Your-Own-Key (BYOK).
          </Text>
          
          <View style={styles.instructionCard}>
            <Text style={styles.instructionTitle}>How to get a free API Key:</Text>
            <Text style={styles.instructionStep}>1. Click the button below to visit Google AI Studio.</Text>
            <Text style={styles.instructionStep}>2. Sign in with your Google account.</Text>
            <Text style={styles.instructionStep}>3. Click "Create API Key".</Text>
            <Text style={styles.instructionStep}>4. Copy the key and paste it here!</Text>
            
            <TouchableOpacity style={styles.linkBtn} onPress={openGoogleAIStudio}>
              <Text style={styles.linkBtnText}>Get Free API Key from Google</Text>
              <ExternalLink color="#4f46e5" size={16} style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Your Gemini API Key</Text>
            <View style={styles.keyInputContainer}>
              <Key color="#9ca3af" size={20} style={{ marginLeft: 16 }} />
              <TextInput
                style={styles.keyInput}
                placeholder="AIzaSy..."
                placeholderTextColor="#9ca3af"
                value={apiKeyInput}
                onChangeText={setApiKeyInput}
                secureTextEntry
              />
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.saveKeyBtn} 
            onPress={handleSaveKey}
            disabled={!apiKeyInput.trim() || savingKey}
          >
            {savingKey ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveKeyBtnText}>Unlock Features</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft color="#1f2937" size={24} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Bot color="#4f46e5" size={24} style={{ marginRight: 8 }} />
          <Text style={styles.headerTitle}>AI Assistant</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.chatContainer}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
        {messages.map(msg => (
          <View 
            key={msg.id} 
            style={[
              styles.messageWrapper,
              msg.sender === 'user' ? styles.messageWrapperUser : styles.messageWrapperBot
            ]}
          >
            {msg.sender === 'bot' && (
              <View style={styles.avatarBot}>
                <Bot color="#fff" size={16} />
              </View>
            )}
            <View 
              style={[
                styles.messageBubble,
                msg.sender === 'user' ? styles.messageBubbleUser : styles.messageBubbleBot
              ]}
            >
              <Text 
                style={[
                  styles.messageText,
                  msg.sender === 'user' ? styles.messageTextUser : styles.messageTextBot
                ]}
              >
                {msg.text}
              </Text>
            </View>
            {msg.sender === 'user' && (
              <View style={styles.avatarUser}>
                <UserIcon color="#fff" size={16} />
              </View>
            )}
          </View>
        ))}
        {loading && (
          <View style={[styles.messageWrapper, styles.messageWrapperBot]}>
            <View style={styles.avatarBot}>
              <Bot color="#fff" size={16} />
            </View>
            <View style={[styles.messageBubble, styles.messageBubbleBot]}>
              <ActivityIndicator size="small" color="#4f46e5" />
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask a question..."
          placeholderTextColor="#9ca3af"
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity 
          style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]} 
          onPress={sendMessage}
          disabled={!input.trim() || loading}
        >
          <Send color="#fff" size={20} style={{ marginLeft: 2 }} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  chatContainer: {
    flex: 1,
  },
  messageWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  messageWrapperUser: {
    justifyContent: 'flex-end',
  },
  messageWrapperBot: {
    justifyContent: 'flex-start',
  },
  avatarBot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarUser: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  messageBubbleUser: {
    backgroundColor: '#4f46e5',
    borderBottomRightRadius: 4,
  },
  messageBubbleBot: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
  },
  messageTextUser: {
    color: '#fff',
  },
  messageTextBot: {
    color: '#1f2937',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  input: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
    marginRight: 12,
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#d1d5db',
  },
  
  /* Setup Screen Styles */
  setupContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 4,
    borderColor: '#c7d2fe',
  },
  setupTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  setupSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  instructionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 12,
  },
  instructionStep: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 8,
  },
  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 8,
  },
  linkBtnText: {
    color: '#4f46e5',
    fontWeight: 'bold',
    fontSize: 14,
  },
  inputGroup: {
    width: '100%',
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  keyInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    height: 56,
  },
  keyInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1f2937',
  } as any,
  saveKeyBtn: {
    backgroundColor: '#4f46e5',
    width: '100%',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveKeyBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  }
});

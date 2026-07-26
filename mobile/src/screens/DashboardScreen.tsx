import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, FlatList, Dimensions, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { transactionService, authService } from '../services/api';
import { LogOut, ArrowDownRight, ArrowUpRight, Bell, CreditCard, Send, Plus, PieChart, Activity, Globe, DollarSign, X, Edit3, Camera, Bot } from 'lucide-react-native';
import { format } from 'date-fns';
import * as ImagePicker from 'expo-image-picker';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import NetInfo from '@react-native-community/netinfo';
import { WifiOff } from 'lucide-react-native';
import { exportService } from '../services/exportService';
import Toast from 'react-native-toast-message';

const width = Math.min(Dimensions.get('window').width, 480);

export default function DashboardScreen() {
  const { user, setUser } = useAuth();
  const { t, i18n } = useTranslation();
  const isFocused = useIsFocused();
  const navigation = useNavigation();
  const [summary, setSummary] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showLangModal, setShowLangModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [updatingPrefs, setUpdatingPrefs] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!(state.isConnected && state.isInternetReachable !== false));
    });
    return () => unsubscribe();
  }, []);

  const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'CAD', symbol: '$', name: 'Canadian Dollar' },
    { code: 'AUD', symbol: '$', name: 'Australian Dollar' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
    { code: 'RUB', symbol: '₽', name: 'Russian Ruble' },
  ];

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'hi', name: 'हिन्दी' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'it', name: 'Italiano' },
    { code: 'pt', name: 'Português' },
    { code: 'zh', name: '中文' },
    { code: 'ja', name: '日本語' },
    { code: 'ru', name: 'Русский' },
  ];

  const handleUpdateCurrency = async (currencyCode: string) => {
    if (user?.currency === currencyCode) {
      setShowCurrencyModal(false);
      return;
    }
    setUpdatingPrefs(true);
    try {
      const response = await authService.updateMe({ currency: currencyCode });
      setUser(response.data);
    } catch (error) {
      console.error('Failed to update currency:', error);
    } finally {
      setUpdatingPrefs(false);
      setShowCurrencyModal(false);
    }
  };

  const handleUpdateLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode);
    setShowLangModal(false);
  };

  const handleUpdateBudget = async () => {
    const newLimit = parseFloat(budgetInput);
    if (isNaN(newLimit) || newLimit <= 0) {
      setShowBudgetModal(false);
      return;
    }
    
    setUpdatingPrefs(true);
    try {
      const response = await authService.updateMe({ monthly_budget: newLimit });
      setUser(response.data);
    } catch (error) {
      console.error('Failed to update budget:', error);
    } finally {
      setUpdatingPrefs(false);
      setShowBudgetModal(false);
    }
  };

  const handleScanReceipt = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to make this work!');
        return;
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.5,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIsScanning(true);
        const asset = result.assets[0];
        
        // Prepare FormData
        const formData = new FormData();
        
        if (Platform.OS === 'web') {
          // On web, if asset.file is available use it, otherwise fetch the blob
          if (asset.file) {
            formData.append('file', asset.file);
          } else {
            const res = await fetch(asset.uri);
            const blob = await res.blob();
            formData.append('file', blob, 'receipt.jpg');
          }
        } else {
          const filename = asset.uri.split('/').pop() || 'receipt.jpg';
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : `image`;

          formData.append('file', {
            uri: asset.uri,
            name: filename,
            type
          } as any);
        }

        try {
          // Call scan endpoint
          const scanResponse = await transactionService.scanReceipt(formData);
          const { amount, date } = scanResponse.data;
          
          // Navigate to Add Transaction screen with pre-filled data
          navigation.navigate('Add' as never, {
            amount: amount.toString(),
            date: date,
            description: 'Scanned Receipt'
          } as never);
          
        } catch (e) {
          console.error("Scan failed", e);
          alert("Failed to scan receipt. Please try again.");
        } finally {
          setIsScanning(false);
        }
      }
    } catch (e) {
      console.error("Image picker error", e);
      setIsScanning(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchData();
    }
  }, [isFocused]);

  const fetchData = async () => {
    try {
      const [summaryRes, txRes] = await Promise.all([
        transactionService.getSummary(),
        transactionService.getAll()
      ]);
      setSummary(summaryRes.data);
      setTransactions(txRes.data.slice(0, 10)); // Show top 10 recent
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderTransaction = ({ item }: { item: any }) => {
    // Generate a consistent color based on category name
    const categoryName = item.category?.name || 'Other';
    const charCode = categoryName.charCodeAt(0) || 0;
    const colors = ['#4f46e5', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#06b6d4'];
    const bgColor = colors[charCode % colors.length];

    return (
      <View style={styles.txItem}>
        <View style={[styles.txIcon, { backgroundColor: bgColor + '20' }]}>
          <Text style={[styles.txIconText, { color: bgColor }]}>{categoryName.substring(0, 1)}</Text>
        </View>
        <View style={styles.txInfo}>
          <Text style={styles.txTitle}>{item.description}</Text>
          <Text style={styles.txDate}>{format(new Date(item.date), 'MMM d, yyyy')}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.txAmount}>
            -{user?.currency || 'USD'} {item.amount.toFixed(2)}
          </Text>
          {item.original_currency && item.original_currency !== (user?.currency || 'USD') && (
            <Text style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
              ({item.original_currency} {item.original_amount?.toFixed(2)})
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderQuickAction = (icon: any, label: string, onPress: () => void) => (
    <TouchableOpacity style={styles.quickActionBtn} onPress={onPress}>
      <View style={styles.quickActionIcon}>
        {icon}
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  const initial = user?.email?.charAt(0).toUpperCase() || 'U';

  const hour = new Date().getHours();
  let greeting = 'Good Morning,';
  if (hour >= 12 && hour < 17) greeting = 'Good Afternoon,';
  else if (hour >= 17) greeting = 'Good Evening,';

  const monthlyBudget = user?.monthly_budget || 0;
  const totalSpent = summary?.total_spent || 0;
  const budgetPercent = monthlyBudget > 0 ? Math.min((totalSpent / monthlyBudget) * 100, 100) : 0;
  const isOverBudget = monthlyBudget > 0 && totalSpent > monthlyBudget;

  return (
    <View style={styles.container}>
      {/* Offline Banner */}
      {isOffline && (
        <View style={styles.offlineBanner}>
          <WifiOff color="#fff" size={16} />
          <Text style={styles.offlineText}>Offline Mode - Syncing Paused</Text>
        </View>
      )}
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.email}>{user?.email?.split('@')[0]}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => setShowCurrencyModal(true)} style={styles.headerPill}>
            <DollarSign color="#1f2937" size={16} />
            <Text style={styles.headerPillText}>{user?.currency || 'USD'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowLangModal(true)} style={styles.headerPill}>
            <Globe color="#1f2937" size={16} />
            <Text style={styles.headerPillText}>{i18n.language.toUpperCase()}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Premium Balance Card */}
      <LinearGradient
        colors={['#4f46e5', '#8b5cf6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.balanceCard}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardLabel}>{t('dashboard.totalSpent', { defaultValue: 'Total Spent' })}</Text>
          <CreditCard color="rgba(255,255,255,0.8)" size={24} />
        </View>
        <Text style={styles.amount}>
          {user?.currency || 'USD'} {summary?.total_spent?.toFixed(2) || '0.00'}
        </Text>
        <View style={styles.cardFooter}>
          <Text style={styles.cardNumber}>**** **** **** {user?.card_last_four || '4092'}</Text>
          <Text style={styles.cardDate}>Exp: {user?.card_expiry || '12/28'}</Text>
        </View>
      </LinearGradient>

      {/* Monthly Budget Progress */}
      <View style={styles.budgetCard}>
        <View style={styles.budgetHeader}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Text style={styles.budgetTitle}>Monthly Limit</Text>
            <TouchableOpacity 
              onPress={() => {
                setBudgetInput(monthlyBudget.toFixed(0));
                setShowBudgetModal(true);
              }}
              style={{ marginLeft: 8 }}
            >
              <Edit3 color="#9ca3af" size={16} />
            </TouchableOpacity>
          </View>
          <Text style={styles.budgetAmount}>
            {user?.currency || 'USD'} {totalSpent.toFixed(2)} / {monthlyBudget.toFixed(0)}
          </Text>
        </View>
        <View style={styles.progressBg}>
          <View style={[
            styles.progressFill, 
            { 
              width: `${budgetPercent}%`,
              backgroundColor: isOverBudget ? '#ef4444' : (budgetPercent > 80 ? '#f59e0b' : '#10b981')
            }
          ]} />
        </View>
        {isOverBudget && (
          <Text style={styles.overBudgetText}>You have exceeded your monthly limit!</Text>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <TouchableOpacity style={styles.quickActionBtn} onPress={handleScanReceipt} disabled={isScanning}>
          <View style={styles.quickActionIcon}>
            {isScanning ? <ActivityIndicator color="#4f46e5" /> : <Camera color="#4f46e5" size={24} />}
          </View>
          <Text style={styles.quickActionLabel}>{isScanning ? 'Scanning...' : 'Scan Receipt'}</Text>
        </TouchableOpacity>
        {renderQuickAction(<Send color="#4f46e5" size={24} />, t('dashboard.transfer'), () => Toast.show({ type: 'info', text1: 'Coming Soon', text2: 'Transfer feature is under development.' }))}
        {renderQuickAction(<PieChart color="#4f46e5" size={24} />, t('dashboard.analytics'), () => navigation.navigate('Analytics' as never))}
        {renderQuickAction(<Bot color="#4f46e5" size={24} />, 'AI Chat', () => navigation.navigate('Chatbot' as never))}
      </View>
      
      {/* Transaction List */}
      <View style={styles.listHeader}>
        <Text style={styles.sectionTitle}>{t('dashboard.recentActivity')}</Text>
        <TouchableOpacity>
          <Text style={styles.seeAllText}>{t('dashboard.seeAll')}</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderTransaction}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t('dashboard.noTransactions')}</Text>
          </View>
        }
      />

      {/* Currency Modal */}
      <Modal visible={showCurrencyModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Currency</Text>
              <TouchableOpacity onPress={() => setShowCurrencyModal(false)}>
                <X color="#9ca3af" size={24} />
              </TouchableOpacity>
            </View>
            {updatingPrefs ? <ActivityIndicator color="#4f46e5" style={{marginVertical: 20}} /> : (
              currencies.map(c => (
                <TouchableOpacity 
                  key={c.code} 
                  style={[styles.modalOption, user?.currency === c.code && styles.modalOptionActive]}
                  onPress={() => handleUpdateCurrency(c.code)}
                >
                  <Text style={[styles.modalOptionText, user?.currency === c.code && styles.modalOptionTextActive]}>
                    {c.symbol} - {c.name} ({c.code})
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>
      </Modal>

      {/* Language Modal */}
      <Modal visible={showLangModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Language</Text>
              <TouchableOpacity onPress={() => setShowLangModal(false)}>
                <X color="#9ca3af" size={24} />
              </TouchableOpacity>
            </View>
            {languages.map(l => (
              <TouchableOpacity 
                key={l.code} 
                style={[styles.modalOption, i18n.language === l.code && styles.modalOptionActive]}
                onPress={() => handleUpdateLanguage(l.code)}
              >
                <Text style={[styles.modalOptionText, i18n.language === l.code && styles.modalOptionTextActive]}>
                  {l.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Budget Limit Modal */}
      <Modal visible={showBudgetModal} transparent animationType="fade">
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Set Monthly Limit</Text>
              <TouchableOpacity onPress={() => setShowBudgetModal(false)}>
                <X color="#9ca3af" size={24} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.currencyPrefix}>{user?.currency || 'USD'}</Text>
              <TextInput
                style={styles.budgetInput}
                value={budgetInput}
                onChangeText={setBudgetInput}
                keyboardType="numeric"
                autoFocus
                placeholder="0.00"
              />
            </View>

            <TouchableOpacity 
              style={styles.saveBtn} 
              onPress={handleUpdateBudget}
              disabled={updatingPrefs}
            >
              {updatingPrefs ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>Save Limit</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  offlineBanner: {
    backgroundColor: '#f59e0b',
    paddingVertical: 8,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: -40,
    zIndex: 10,
  },
  offlineText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4f46e5',
  },
  greeting: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  email: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    textTransform: 'capitalize',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  headerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerPillText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1f2937',
    marginLeft: 4,
  },
  balanceCard: {
    marginHorizontal: 20,
    padding: 24,
    borderRadius: 24,
    marginBottom: 24,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardLabel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  amount: {
    fontSize: 36,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 24,
    letterSpacing: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardNumber: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    letterSpacing: 2,
  },
  cardDate: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  quickActionBtn: {
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  quickActionLabel: {
    fontSize: 13,
    color: '#4b5563',
    fontWeight: '500',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  seeAllText: {
    fontSize: 14,
    color: '#4f46e5',
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  txIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  txIconText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  txInfo: {
    flex: 1,
  },
  txTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  budgetCard: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  budgetTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  budgetAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  progressBg: {
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  overBudgetText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 8,
    fontWeight: '500',
  },
  txCategory: {
    fontSize: 13,
    color: '#9ca3af',
    fontWeight: '500',
  },
  txAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#9ca3af',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  modalOption: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#f9fafb',
  },
  modalOptionActive: {
    backgroundColor: '#4f46e5',
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4b5563',
  },
  modalOptionTextActive: {
    color: '#fff',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  currencyPrefix: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginRight: 8,
  },
  budgetInput: {
    flex: 1,
    height: 56,
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  saveBtn: {
    backgroundColor: '#4f46e5',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});

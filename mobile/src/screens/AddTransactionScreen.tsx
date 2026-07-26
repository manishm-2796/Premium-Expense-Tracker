import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView, Modal, FlatList, Platform } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { transactionService, categoryService } from '../services/api';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, ChevronDown, Search, X } from 'lucide-react-native';
import Toast from 'react-native-toast-message';

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: '$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: '$', name: 'Australian Dollar' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'RUB', symbol: '₽', name: 'Russian Ruble' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
];

export default function AddTransactionScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const route = useRoute<any>();
  
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(user?.currency || 'USD');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString());
  
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (route.params?.amount) setAmount(route.params.amount.toString());
    if (route.params?.description) setDescription(route.params.description);
    if (route.params?.date) setDate(route.params.date);
  }, [route.params]);
  
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
    if (user?.currency && currency === 'USD' && user.currency !== 'USD') {
      setCurrency(user.currency);
    }
  }, [user]);

  const fetchCategories = async () => {
    try {
      const response = await categoryService.getAll();
      setCategories(response.data);
      if (response.data.length > 0 && !selectedCategory) {
        setSelectedCategory(response.data[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    setLoading(true);
    try {
      // Default to a premium color
      const response = await categoryService.create({ name: newCategoryName.trim(), color: '#4f46e5' });
      setNewCategoryName('');
      await fetchCategories(); // Refresh list
      setSelectedCategory(response.data.id); // Auto-select it
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to create category');
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
        return;
      }

      let result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.5, // Compress image to save bandwidth
      });

      if (!result.canceled && result.assets[0]) {
        setLoading(true);
        const imageUri = result.assets[0].uri;
        
        // Prepare FormData
        const formData = new FormData();
        const filename = imageUri.split('/').pop() || 'receipt.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;
        
        // @ts-ignore (React Native FormData requires this structure)
        formData.append('file', { uri: imageUri, name: filename, type });

        const response = await transactionService.scanReceipt(formData);
        
        if (response.data.amount) {
          setAmount(response.data.amount.toString());
        }
        setDescription('Scanned Receipt');
        
        Alert.alert('Success', 'Receipt scanned successfully!');
      }
    } catch (error: any) {
      console.error(error);
      Alert.alert('Scan Failed', error.response?.data?.detail || 'Could not parse receipt text');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!amount || !description || !selectedCategory) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const newTx = await transactionService.create({
        amount: parseFloat(amount),
        original_amount: parseFloat(amount),
        original_currency: currency,
        description,
        category_id: selectedCategory,
        date: date,
      });
      
      // Reset form
      setAmount('');
      setDescription('');
      setDate(new Date().toISOString());
      
      // Check budget
      const summary = await transactionService.getSummary();
      const monthlyLimit = summary.data.daily_budget * 30;
      
      if (summary.data.total_spent > monthlyLimit) {
        Toast.show({
          type: 'error',
          text1: 'Budget Alert! 🚨',
          text2: `You have exceeded your monthly limit! Total spent: ${summary.data.total_spent.toFixed(2)}`,
          position: 'top',
          topOffset: 60,
          visibilityTime: 4000,
        });
      }
      
      // Navigate back to Dashboard (tab is named Home)
      navigation.navigate('Home' as never);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to add transaction');
    } finally {
      setLoading(false);
    }
  };

  const filteredCurrencies = CURRENCIES.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.symbol.includes(searchQuery)
  );

  const selectedCurrencyObj = CURRENCIES.find(c => c.code === currency) || { symbol: '$' };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Add Expense</Text>
        <TouchableOpacity style={styles.scanBtn} onPress={handleScan} disabled={loading}>
          <Camera color="#4f46e5" size={24} />
          <Text style={styles.scanBtnText}>Scan Receipt</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Amount</Text>
        <View style={styles.amountInputRow}>
          <TouchableOpacity 
            style={styles.currencySelectorBtn}
            onPress={() => setShowCurrencyModal(true)}
          >
            <Text style={styles.currencySymbolText}>{selectedCurrencyObj.symbol}</Text>
            <Text style={styles.currencyCodeText}>{currency}</Text>
            <ChevronDown color="#9ca3af" size={16} />
          </TouchableOpacity>
          
          <View style={styles.amountInputContainer}>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              placeholderTextColor="#9ca3af"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />
          </View>
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.input}
          placeholder="What did you buy?"
          placeholderTextColor="#9ca3af"
          value={description}
          onChangeText={setDescription}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Category</Text>
        <View style={styles.categoryContainer}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryBadge,
                selectedCategory === cat.id && styles.categoryBadgeSelected
              ]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Text style={[
                styles.categoryText,
                selectedCategory === cat.id && styles.categoryTextSelected
              ]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Inline Category Creation */}
        <View style={styles.newCategoryContainer}>
          <TextInput
            style={styles.newCategoryInput}
            placeholder="New category name"
            placeholderTextColor="#9ca3af"
            value={newCategoryName}
            onChangeText={setNewCategoryName}
          />
          <TouchableOpacity 
            style={styles.addCategoryBtn} 
            onPress={handleAddCategory}
            disabled={!newCategoryName.trim() || loading}
          >
            <Text style={styles.addCategoryBtnText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleAdd} disabled={loading || !selectedCategory}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save Transaction</Text>}
      </TouchableOpacity>
      
      {/* Currency Picker Modal */}
      <Modal
        visible={showCurrencyModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCurrencyModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Currency</Text>
            <TouchableOpacity onPress={() => setShowCurrencyModal(false)} style={styles.modalCloseBtn}>
              <X color="#6b7280" size={24} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalSearchContainer}>
            <Search color="#9ca3af" size={20} style={styles.modalSearchIcon} />
            <TextInput
              style={styles.modalSearchInput}
              placeholder="Search currency..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9ca3af"
              autoFocus={Platform.OS !== 'web'}
            />
          </View>

          <FlatList
            data={filteredCurrencies}
            keyExtractor={item => item.code}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.currencyItem}
                onPress={() => {
                  setCurrency(item.code);
                  setShowCurrencyModal(false);
                  setSearchQuery('');
                }}
              >
                <View style={styles.currencySymbolBadge}>
                  <Text style={styles.currencyItemSymbol}>{item.symbol}</Text>
                </View>
                <Text style={styles.currencyItemName}>{item.name}</Text>
                <Text style={styles.currencyItemCode}>{item.code}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={{ textAlign: 'center', color: '#9ca3af', marginTop: 40 }}>No currencies found</Text>
            }
          />
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f3f4f6',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  scanBtnText: {
    color: '#4f46e5',
    fontWeight: 'bold',
    marginLeft: 6,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 8,
    fontWeight: '600',
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 12,
    width: 100,
    height: 56,
    marginRight: 12,
  },
  currencySymbolText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4f46e5',
  },
  currencyCodeText: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
    flex: 1,
    marginLeft: 6,
  },
  amountInputContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    justifyContent: 'center',
  },
  amountInput: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    height: '100%',
  } as any,
  input: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    fontSize: 16,
    color: '#1f2937',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryBadge: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  categoryBadgeSelected: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  },
  categoryText: {
    color: '#4b5563',
    fontWeight: '500',
  },
  categoryTextSelected: {
    color: '#fff',
  },
  button: {
    backgroundColor: '#4f46e5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 40,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  newCategoryContainer: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  newCategoryInput: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    fontSize: 16,
  },
  addCategoryBtn: {
    backgroundColor: '#10b981',
    paddingHorizontal: 20,
    justifyContent: 'center',
    borderRadius: 12,
  },
  addCategoryBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  
  /* Modal Styles */
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    margin: 16,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  modalSearchIcon: {
    marginRight: 8,
  },
  modalSearchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#1f2937',
    outline: 'none',
  } as any,
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  currencySymbolBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  currencyItemSymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4f46e5',
  },
  currencyItemName: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  currencyItemCode: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: 'bold',
  },
});

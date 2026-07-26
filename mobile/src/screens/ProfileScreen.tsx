import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Modal, FlatList, createElement } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/api';
import { ArrowLeft, User as UserIcon, Calendar, Phone, Mail, Save, ChevronDown, Search, X, CreditCard } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';

const COUNTRIES = [
  { name: 'United States', code: '+1', flag: '🇺🇸' },
  { name: 'India', code: '+91', flag: '🇮🇳' },
  { name: 'United Kingdom', code: '+44', flag: '🇬🇧' },
  { name: 'Australia', code: '+61', flag: '🇦🇺' },
  { name: 'Canada', code: '+1', flag: '🇨🇦' },
  { name: 'Germany', code: '+49', flag: '🇩🇪' },
  { name: 'France', code: '+33', flag: '🇫🇷' },
  { name: 'Japan', code: '+81', flag: '🇯🇵' },
  { name: 'China', code: '+86', flag: '🇨🇳' },
  { name: 'Brazil', code: '+55', flag: '🇧🇷' },
  { name: 'Mexico', code: '+52', flag: '🇲🇽' },
  { name: 'South Africa', code: '+27', flag: '🇿🇦' },
  { name: 'Spain', code: '+34', flag: '🇪🇸' },
  { name: 'Italy', code: '+39', flag: '🇮🇹' },
  { name: 'Russia', code: '+7', flag: '🇷🇺' },
  { name: 'UAE', code: '+971', flag: '🇦🇪' },
  { name: 'Saudi Arabia', code: '+966', flag: '🇸🇦' },
  { name: 'Singapore', code: '+65', flag: '🇸🇬' },
  { name: 'New Zealand', code: '+64', flag: '🇳🇿' },
];

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { user, setUser } = useAuth();
  
  const parsePhone = (fullPhone?: string) => {
    if (!fullPhone) return { code: '+91', number: '', flag: '🇮🇳' };
    const parts = fullPhone.split(' ');
    if (parts.length > 1 && parts[0].startsWith('+')) {
      const cCode = parts[0];
      const match = COUNTRIES.find(c => c.code === cCode);
      return { code: cCode, number: parts.slice(1).join(' '), flag: match ? match.flag : '🌐' };
    }
    return { code: '+91', number: fullPhone, flag: '🇮🇳' };
  };

  const initialPhone = parsePhone(user?.phone);
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [dob, setDob] = useState(user?.dob || '');
  const [countryCode, setCountryCode] = useState(initialPhone.code);
  const [countryFlag, setCountryFlag] = useState(initialPhone.flag);
  const [phone, setPhone] = useState(initialPhone.number);
  const [cardLastFour, setCardLastFour] = useState(user?.card_last_four || '');
  const [cardExpiry, setCardExpiry] = useState(user?.card_expiry || '');
  const [loading, setLoading] = useState(false);
  
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateObj, setDateObj] = useState(() => {
    if (user?.dob) {
      const d = new Date(user.dob);
      return isNaN(d.getTime()) ? new Date() : d;
    }
    return new Date();
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await authService.updateMe({
        full_name: fullName,
        dob: dob,
        phone: `${countryCode} ${phone}`.trim(),
        card_last_four: cardLastFour,
        card_expiry: cardExpiry
      });
      setUser(response.data);
      Toast.show({
        type: 'success',
        text1: 'Profile Updated',
        text2: 'Your personal details have been saved successfully.',
        position: 'top',
        topOffset: 60,
      });
      navigation.goBack();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update profile.',
        position: 'top',
        topOffset: 60,
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredCountries = COUNTRIES.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.code.includes(searchQuery)
  );

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDateObj(selectedDate);
      setDob(selectedDate.toISOString().split('T')[0]);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft color="#1f2937" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitials}>
              {fullName ? fullName.charAt(0).toUpperCase() : (user?.email?.charAt(0).toUpperCase() || 'U')}
            </Text>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Full Name</Text>
          <View style={styles.inputContainer}>
            <UserIcon color="#9ca3af" size={20} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="John Doe"
              placeholderTextColor="#9ca3af"
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Email Address (Read-Only)</Text>
          <View style={[styles.inputContainer, styles.inputDisabled]}>
            <Mail color="#9ca3af" size={20} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: '#9ca3af' }]}
              value={user?.email}
              editable={false}
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Date of Birth</Text>
          {Platform.OS === 'web' ? (
            <View style={styles.inputContainer}>
              <Calendar color="#9ca3af" size={20} style={styles.inputIcon} />
              {createElement('input', {
                type: 'date',
                value: dob,
                onChange: (e: any) => setDob(e.target.value),
                style: {
                  flex: 1,
                  height: 52,
                  fontSize: 16,
                  color: '#1f2937',
                  borderWidth: 0,
                  outline: 'none',
                  backgroundColor: 'transparent',
                }
              })}
            </View>
          ) : (
            <>
              <TouchableOpacity 
                style={styles.inputContainer}
                onPress={() => setShowDatePicker(true)}
              >
                <Calendar color="#9ca3af" size={20} style={styles.inputIcon} />
                <Text style={[styles.input, { lineHeight: 52, color: dob ? '#1f2937' : '#9ca3af' }]}>
                  {dob || 'Select Date of Birth'}
                </Text>
              </TouchableOpacity>
              
              {showDatePicker && (
                <View style={Platform.OS === 'ios' ? styles.iosDatePickerContainer : {}}>
                  {Platform.OS === 'ios' && (
                    <View style={styles.iosDatePickerHeader}>
                      <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                        <Text style={styles.iosDatePickerDone}>Done</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  <DateTimePicker
                    value={dateObj}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onDateChange}
                    maximumDate={new Date()}
                  />
                </View>
              )}
            </>
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <View style={styles.phoneInputRow}>
            <TouchableOpacity 
              style={styles.countryCodeContainer}
              onPress={() => setShowCountryModal(true)}
            >
              <Text style={{ fontSize: 18, marginRight: 6 }}>{countryFlag}</Text>
              <Text style={styles.countryCodeText}>{countryCode}</Text>
              <ChevronDown color="#9ca3af" size={16} />
            </TouchableOpacity>
            
            <View style={styles.phoneInputContainer}>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="8600926373"
                placeholderTextColor="#9ca3af"
                keyboardType="phone-pad"
              />
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Dashboard Card Details</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Card Last 4 Digits</Text>
          <View style={styles.inputContainer}>
            <CreditCard color="#9ca3af" size={20} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={cardLastFour}
              onChangeText={(t) => setCardLastFour(t.replace(/[^0-9]/g, '').slice(0, 4))}
              placeholder="e.g. 4092"
              placeholderTextColor="#9ca3af"
              keyboardType="number-pad"
              maxLength={4}
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Card Expiry</Text>
          <View style={styles.inputContainer}>
            <Calendar color="#9ca3af" size={20} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={cardExpiry}
              onChangeText={setCardExpiry}
              placeholder="MM/YY"
              placeholderTextColor="#9ca3af"
              maxLength={5}
            />
          </View>
        </View>
        
        <View style={{ height: 40 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Save color="#fff" size={20} style={{ marginRight: 8 }} />
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Country Picker Modal */}
      <Modal
        visible={showCountryModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCountryModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Country Code</Text>
            <TouchableOpacity onPress={() => setShowCountryModal(false)} style={styles.modalCloseBtn}>
              <X color="#6b7280" size={24} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalSearchContainer}>
            <Search color="#9ca3af" size={20} style={styles.modalSearchIcon} />
            <TextInput
              style={styles.modalSearchInput}
              placeholder="Search country or code..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9ca3af"
              autoFocus={Platform.OS !== 'web'}
            />
          </View>

          <FlatList
            data={filteredCountries}
            keyExtractor={item => item.name}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.countryItem}
                onPress={() => {
                  setCountryCode(item.code);
                  setCountryFlag(item.flag);
                  setShowCountryModal(false);
                  setSearchQuery('');
                }}
              >
                <Text style={styles.countryItemFlag}>{item.flag}</Text>
                <Text style={styles.countryItemName}>{item.name}</Text>
                <Text style={styles.countryItemCode}>{item.code}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={{ textAlign: 'center', color: '#9ca3af', marginTop: 40 }}>No countries found</Text>
            }
          />
        </View>
      </Modal>

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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 10,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#c7d2fe',
  },
  avatarInitials: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4f46e5',
  },
  sectionHeader: {
    marginTop: 10,
    marginBottom: 20,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 12,
    width: 110,
    height: 52,
    marginRight: 12,
  },
  countryCodeText: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
    flex: 1,
  },
  phoneInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  inputDisabled: {
    backgroundColor: '#f3f4f6',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 52,
    fontSize: 16,
    color: '#1f2937',
  },
  footer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  saveBtn: {
    backgroundColor: '#4f46e5',
    flexDirection: 'row',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
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
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  countryItemFlag: {
    fontSize: 24,
    marginRight: 16,
  },
  countryItemName: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  countryItemCode: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: 'bold',
  },
  
  /* iOS DatePicker Styles */
  iosDatePickerContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    marginTop: 8,
    overflow: 'hidden',
  },
  iosDatePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  iosDatePickerDone: {
    color: '#4f46e5',
    fontWeight: 'bold',
    fontSize: 16,
  }
});

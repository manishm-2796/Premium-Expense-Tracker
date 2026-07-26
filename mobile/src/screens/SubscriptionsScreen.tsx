import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { recurringService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Plus, Calendar, CreditCard, Trash2, X } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';

export default function SubscriptionsScreen() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { user } = useAuth();
  
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState('Monthly'); // Monthly, Weekly, Yearly
  const [nextDate, setNextDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isFocused) {
      fetchSubscriptions();
    }
  }, [isFocused]);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const res = await recurringService.getAll();
      setSubscriptions(res.data);
    } catch (e) {
      console.error('Failed to fetch subscriptions', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!merchant || !amount) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    setSaving(true);
    try {
      await recurringService.create({
        merchant,
        amount: parseFloat(amount),
        frequency,
        next_date: nextDate.toISOString()
      });
      setModalVisible(false);
      resetForm();
      fetchSubscriptions();
    } catch (e) {
      Alert.alert('Error', 'Failed to save subscription');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await recurringService.delete(id);
      fetchSubscriptions();
    } catch (e) {
      Alert.alert('Error', 'Failed to delete subscription');
    }
  };

  const resetForm = () => {
    setMerchant('');
    setAmount('');
    setFrequency('Monthly');
    setNextDate(new Date());
  };

  // Calculations
  const totalMonthly = subscriptions.reduce((acc, sub) => {
    let monthlyCost = sub.amount;
    if (sub.frequency === 'Yearly') monthlyCost = sub.amount / 12;
    if (sub.frequency === 'Weekly') monthlyCost = sub.amount * 4.33;
    return acc + monthlyCost;
  }, 0);

  const totalYearly = totalMonthly * 12;
  const currency = user?.currency || 'USD';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft color="#1f2937" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subscriptions</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={[styles.summaryCard, { backgroundColor: '#4f46e5' }]}>
            <Text style={styles.summaryLabel}>Total Monthly</Text>
            <Text style={styles.summaryValue}>{currency} {totalMonthly.toFixed(2)}</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#ec4899' }]}>
            <Text style={styles.summaryLabel}>Total Yearly</Text>
            <Text style={styles.summaryValue}>{currency} {totalYearly.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>Active Subscriptions ({subscriptions.length})</Text>
          <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addBtnSm}>
            <Plus color="#fff" size={20} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#4f46e5" style={{ marginTop: 40 }} />
        ) : subscriptions.length === 0 ? (
          <View style={styles.emptyState}>
            <CreditCard color="#d1d5db" size={64} style={{ marginBottom: 16 }} />
            <Text style={styles.emptyTitle}>No Subscriptions Yet</Text>
            <Text style={styles.emptySub}>Keep track of Netflix, Gym, and more!</Text>
          </View>
        ) : (
          subscriptions.map((sub) => (
            <View key={sub.id} style={styles.subCard}>
              <View style={styles.subLeft}>
                <View style={styles.iconBox}>
                  <CreditCard color="#4f46e5" size={24} />
                </View>
                <View>
                  <Text style={styles.subName}>{sub.merchant}</Text>
                  <Text style={styles.subFreq}>{sub.frequency} • Next: {new Date(sub.next_date).toLocaleDateString()}</Text>
                </View>
              </View>
              
              <View style={styles.subRight}>
                <Text style={styles.subAmount}>{currency} {sub.amount.toFixed(2)}</Text>
                <TouchableOpacity onPress={() => handleDelete(sub.id)} style={styles.deleteBtn}>
                  <Trash2 color="#ef4444" size={20} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Subscription</Text>
              <TouchableOpacity onPress={() => { setModalVisible(false); resetForm(); }}>
                <X color="#6b7280" size={24} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Service Name (e.g., Netflix)"
              value={merchant}
              onChangeText={setMerchant}
            />

            <TextInput
              style={styles.input}
              placeholder="Amount"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />

            <View style={styles.freqRow}>
              {['Weekly', 'Monthly', 'Yearly'].map(f => (
                <TouchableOpacity 
                  key={f}
                  style={[styles.freqBtn, frequency === f && styles.freqBtnActive]}
                  onPress={() => setFrequency(f)}
                >
                  <Text style={[styles.freqText, frequency === f && styles.freqTextActive]}>{f}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity 
              style={styles.dateBtn}
              onPress={() => {
                if (Platform.OS === 'web') {
                  const p = prompt('Next Date (YYYY-MM-DD)', nextDate.toISOString().split('T')[0]);
                  if (p) setNextDate(new Date(p));
                } else {
                  setShowDatePicker(true);
                }
              }}
            >
              <Calendar color="#6b7280" size={20} style={{ marginRight: 10 }} />
              <Text style={styles.dateText}>Next Bill: {nextDate.toLocaleDateString()}</Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={nextDate}
                mode="date"
                display="default"
                onChange={(event, date) => {
                  setShowDatePicker(false);
                  if (date) setNextDate(date);
                }}
              />
            )}

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Subscription</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: '#fff' },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
  content: { padding: 20 },
  summaryContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  summaryCard: { flex: 1, padding: 20, borderRadius: 20, marginHorizontal: 4, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 },
  summaryLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 8 },
  summaryValue: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#374151' },
  addBtnSm: { backgroundColor: '#4f46e5', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 40, padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#374151', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
  subCard: { backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 1 },
  subLeft: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#e0e7ff', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  subName: { fontSize: 16, fontWeight: 'bold', color: '#1f2937', marginBottom: 4 },
  subFreq: { fontSize: 12, color: '#6b7280' },
  subRight: { alignItems: 'flex-end' },
  subAmount: { fontSize: 16, fontWeight: 'bold', color: '#1f2937', marginBottom: 8 },
  deleteBtn: { padding: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
  input: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', padding: 16, borderRadius: 12, fontSize: 16, marginBottom: 16 },
  freqRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  freqBtn: { flex: 1, padding: 12, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, marginHorizontal: 4, alignItems: 'center' },
  freqBtnActive: { backgroundColor: '#e0e7ff', borderColor: '#4f46e5' },
  freqText: { color: '#6b7280', fontWeight: '500' },
  freqTextActive: { color: '#4f46e5', fontWeight: 'bold' },
  dateBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', padding: 16, borderRadius: 12, marginBottom: 24 },
  dateText: { fontSize: 16, color: '#374151' },
  saveBtn: { backgroundColor: '#4f46e5', padding: 16, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});

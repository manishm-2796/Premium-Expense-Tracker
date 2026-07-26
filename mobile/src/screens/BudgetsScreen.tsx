import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { transactionService, categoryService, authService } from '../services/api';
import { useIsFocused } from '@react-navigation/native';
import { Target, X, Check } from 'lucide-react-native';

export default function BudgetsScreen() {
  const { user, setUser } = useAuth();
  const isFocused = useIsFocused();
  
  const [summary, setSummary] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingType, setEditingType] = useState<'overall' | 'category' | null>(null);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isFocused) {
      fetchData();
    }
  }, [isFocused]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [summaryRes, catsRes] = await Promise.all([
        transactionService.getSummary(),
        categoryService.getAll()
      ]);
      setSummary(summaryRes.data);
      setCategories(catsRes.data);
    } catch (e) {
      console.error('Failed to fetch budget data', e);
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage < 50) return '#10b981'; // Green
    if (percentage < 75) return '#f59e0b'; // Yellow
    if (percentage < 90) return '#f97316'; // Orange
    return '#ef4444'; // Red
  };

  const handleEditOverall = () => {
    setEditingType('overall');
    setEditValue(user?.monthly_budget ? user.monthly_budget.toString() : '');
    setModalVisible(true);
  };

  const handleEditCategory = (cat: any) => {
    setEditingType('category');
    setEditingCategory(cat);
    setEditValue(cat.budget_limit ? cat.budget_limit.toString() : '');
    setModalVisible(true);
  };

  const handleSave = async () => {
    const val = parseFloat(editValue);
    if (isNaN(val) && editValue !== '') {
      Alert.alert('Invalid amount');
      return;
    }
    
    setSaving(true);
    try {
      if (editingType === 'overall') {
        const payload = editValue === '' ? null : val;
        const res = await authService.updateMe({ monthly_budget: payload as any });
        setUser(res.data);
      } else if (editingType === 'category' && editingCategory) {
        const payload = editValue === '' ? null : val;
        await categoryService.update(editingCategory.id, { budget_limit: payload });
        await fetchData(); // refresh categories
      }
      setModalVisible(false);
    } catch (e) {
      Alert.alert('Error', 'Failed to update budget');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !summary) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  const currency = user?.currency || 'USD';
  
  // Calculate overall budget progress
  const totalBudget = user?.monthly_budget || 0;
  const totalSpent = summary?.total_spent || 0;
  const overallPercentage = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;
  const overallColor = totalBudget > 0 ? getProgressColor(overallPercentage) : '#9ca3af';

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Budgets</Text>
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Overall Budget Card */}
        <TouchableOpacity style={[styles.card, styles.masterCard]} onPress={handleEditOverall}>
          <View style={styles.cardHeader}>
            <View style={styles.row}>
              <Target color="#fff" size={24} style={{ marginRight: 8 }} />
              <Text style={styles.masterTitle}>Monthly Budget</Text>
            </View>
            <Text style={styles.masterEditHint}>Tap to edit</Text>
          </View>
          
          <Text style={styles.masterAmount}>
            {currency} {totalSpent.toFixed(2)} <Text style={styles.masterLimit}>/ {totalBudget > 0 ? totalBudget : '∞'}</Text>
          </Text>
          
          {totalBudget > 0 && (
            <View style={styles.progressBarContainerMaster}>
              <View 
                style={[styles.progressBarMaster, { width: `${overallPercentage}%`, backgroundColor: '#fff' }]} 
              />
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Category Limits</Text>

        {/* Category Budgets */}
        {categories.map((cat) => {
          const spent = summary?.by_category?.[cat.name] || 0;
          const limit = cat.budget_limit;
          const percentage = limit && limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
          const color = limit && limit > 0 ? getProgressColor(percentage) : '#9ca3af';

          return (
            <TouchableOpacity key={cat.id} style={styles.catCard} onPress={() => handleEditCategory(cat)}>
              <View style={styles.catHeader}>
                <View style={styles.row}>
                  <View style={[styles.colorDot, { backgroundColor: cat.color }]} />
                  <Text style={styles.catName}>{cat.name}</Text>
                </View>
                <Text style={styles.catAmount}>
                  {currency} {spent.toFixed(2)} <Text style={styles.catLimit}>/ {limit ? limit : '∞'}</Text>
                </Text>
              </View>
              
              {limit > 0 && (
                <View style={styles.progressBarContainer}>
                  <View 
                    style={[styles.progressBar, { width: `${percentage}%`, backgroundColor: color }]} 
                  />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
        
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Set {editingType === 'overall' ? 'Total' : editingCategory?.name} Budget
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} disabled={saving}>
                <X color="#6b7280" size={24} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSubtitle}>Leave blank for no limit (∞)</Text>
            
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              value={editValue}
              onChangeText={setEditValue}
              placeholder="0.00"
              autoFocus
            />
            
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Limit</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: '#f8f9fa',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 60,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  masterCard: {
    backgroundColor: '#4f46e5',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  masterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  masterEditHint: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  masterAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  masterLimit: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.7)',
  },
  progressBarContainerMaster: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarMaster: {
    height: '100%',
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 16,
  },
  catCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  catHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  catName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  catAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  catLimit: {
    color: '#9ca3af',
    fontWeight: 'normal',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
    borderRadius: 12,
    fontSize: 18,
    marginBottom: 20,
  },
  saveBtn: {
    backgroundColor: '#4f46e5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});

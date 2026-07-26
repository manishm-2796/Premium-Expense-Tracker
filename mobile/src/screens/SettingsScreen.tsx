import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/api';
import { exportService } from '../services/exportService';
import { LogOut, ChevronRight, Bell, CreditCard, User as UserIcon, Shield } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const testPushNotification = async () => {
    if (!user?.push_token) {
      Alert.alert('No Push Token', 'Please test this on a physical device using Expo Go to generate a push token.');
      return;
    }
    
    try {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: user.push_token,
          sound: 'default',
          title: 'Test Notification! 🔔',
          body: 'This is a test push notification from Expense Tracker.',
          data: { type: 'test' },
        }),
      });
      Toast.show({
        type: 'success',
        text1: 'Test notification sent! 🔔',
        text2: 'If you are on your physical device, it should arrive shortly.',
        position: 'top',
        topOffset: 60,
      });
    } catch (e) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to send test notification',
        position: 'top',
        topOffset: 60,
      });
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.headerTitle}>{t('settings.title')}</Text>

      {/* Account Profile Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Profile</Text>
        
        <View style={styles.card}>
          <TouchableOpacity 
            style={[styles.menuItem, { paddingVertical: 20 }]}
            onPress={() => navigation.navigate('Profile' as never)}
          >
            <View style={styles.settingRowLeft}>
              <View style={styles.avatarBox}>
                <UserIcon color="#4f46e5" size={32} />
              </View>
              <View>
                <Text style={styles.profileEmail}>{user?.full_name || user?.email || 'User Account'}</Text>
                <View style={styles.proBadge}>
                  <Shield color="#10b981" size={12} style={{ marginRight: 4 }} />
                  <Text style={styles.proBadgeText}>Pro Member</Text>
                </View>
              </View>
            </View>
            <ChevronRight color="#d1d5db" size={20} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Notifications & Subscriptions Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Billing & Notifications</Text>
        
        <View style={styles.card}>
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => navigation.navigate('Subscriptions' as never)}
          >
            <View style={styles.settingRowLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#fdf2f8' }]}>
                <CreditCard color="#ec4899" size={20} />
              </View>
              <Text style={styles.settingLabel}>Manage Subscriptions</Text>
            </View>
            <ChevronRight color="#d1d5db" size={20} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.settingRowBtn} onPress={testPushNotification}>
            <View style={styles.settingRowLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#fef3c7' }]}>
                <Bell color="#d97706" size={20} />
              </View>
              <Text style={styles.settingLabel}>Test Push Notification</Text>
            </View>
            <ChevronRight color="#d1d5db" size={20} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Data & Export Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data & Export</Text>
        
        <View style={styles.card}>
          <TouchableOpacity 
            style={styles.settingRowBtn} 
            onPress={async () => {
              try {
                await exportService.generatePDF(user?.currency || 'USD');
              } catch (e) {
                Alert.alert('Error', 'Failed to generate PDF');
              }
            }}
          >
            <View style={styles.settingRowLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#e0e7ff' }]}>
                <Text style={{fontWeight: 'bold', color: '#4f46e5'}}>PDF</Text>
              </View>
              <Text style={styles.settingLabel}>Generate Monthly Report</Text>
            </View>
            <ChevronRight color="#d1d5db" size={20} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity 
            style={styles.settingRowBtn} 
            onPress={async () => {
              try {
                await exportService.exportCSV();
              } catch (e) {
                Alert.alert('Error', 'Failed to export CSV');
              }
            }}
          >
            <View style={styles.settingRowLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#dcfce7' }]}>
                <Text style={{fontWeight: 'bold', color: '#16a34a'}}>CSV</Text>
              </View>
              <Text style={styles.settingLabel}>Export Raw Data</Text>
            </View>
            <ChevronRight color="#d1d5db" size={20} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.account')}</Text>
        
        <View style={styles.card}>
          <TouchableOpacity style={styles.settingRowBtn} onPress={logout}>
            <View style={styles.settingRowLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#fee2e2' }]}>
                <LogOut color="#ef4444" size={20} />
              </View>
              <Text style={[styles.settingLabel, { color: '#ef4444' }]}>{t('settings.logout')}</Text>
            </View>
            <ChevronRight color="#d1d5db" size={20} />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 60,
    marginBottom: 30,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    paddingLeft: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  settingRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  settingRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#c7d2fe',
  },
  profileEmail: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  proBadgeText: {
    color: '#16a34a',
    fontSize: 12,
    fontWeight: '600',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  divider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginHorizontal: 16,
    marginVertical: 4,
  }
});

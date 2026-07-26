import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { transactionService } from '../services/api';
import { PieChart, LineChart, BarChart } from 'react-native-chart-kit';
import { useIsFocused } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

export default function AnalyticsScreen() {
  const { user } = useAuth();
  const isFocused = useIsFocused();
  const [activeTab, setActiveTab] = useState<'categories' | 'trends'>('categories');
  const [summary, setSummary] = useState<any>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Constrain width to 480 for the web wrapper
  const screenWidth = Math.min(Dimensions.get('window').width, 480);

  useEffect(() => {
    if (isFocused) {
      fetchData();
    }
  }, [isFocused]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [summaryRes, trendsRes, txRes] = await Promise.all([
        transactionService.getSummary(),
        transactionService.getTrends(),
        transactionService.getAll() // default params get current month transactions
      ]);
      setSummary(summaryRes.data);
      setTrends(trendsRes.data);
      setTransactions(txRes.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePieData = () => {
    if (!summary?.by_category) return [];
    const colors = ['#4f46e5', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4'];
    
    return Object.keys(summary.by_category).map((category, index) => ({
      name: category,
      amount: summary.by_category[category],
      color: colors[index % colors.length],
      legendFontColor: '#4b5563',
      legendFontSize: 13,
    })).filter(item => item.amount > 0);
  };

  const generateLineData = () => {
    // Generate daily spending for the current month
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const dailyTotals = Array(daysInMonth).fill(0);
    
    transactions.forEach(tx => {
      const day = new Date(tx.date).getDate();
      dailyTotals[day - 1] += tx.amount;
    });

    // Simplify labels to not clutter x-axis
    const labels = dailyTotals.map((_, i) => (i % 5 === 0 ? (i + 1).toString() : ''));

    return {
      labels,
      datasets: [{ data: dailyTotals.length > 0 && dailyTotals.some(d => d > 0) ? dailyTotals : [0] }]
    };
  };

  const generateBarData = () => {
    if (!trends || trends.length === 0) {
      return { labels: [''], datasets: [{ data: [0] }] };
    }
    return {
      labels: trends.map(t => t.label),
      datasets: [{ data: trends.map(t => t.amount) }]
    };
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  const pieData = generatePieData();
  const lineData = generateLineData();
  const barData = generateBarData();

  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    strokeWidth: 3,
    barPercentage: 0.6,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.headerTitle}>Analytics</Text>
      
      {/* Custom Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'categories' && styles.activeTab]}
          onPress={() => setActiveTab('categories')}
        >
          <Text style={[styles.tabText, activeTab === 'categories' && styles.activeTabText]}>Categories</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'trends' && styles.activeTab]}
          onPress={() => setActiveTab('trends')}
        >
          <Text style={[styles.tabText, activeTab === 'trends' && styles.activeTabText]}>Trends</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'categories' ? (
        <View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Spending Breakdown</Text>
            {pieData.length > 0 ? (
              <PieChart
                data={pieData}
                width={screenWidth - 80}
                height={220}
                chartConfig={chartConfig}
                accessor={"amount"}
                backgroundColor={"transparent"}
                paddingLeft={"15"}
                center={[10, 0]}
                absolute
              />
            ) : (
              <Text style={styles.emptyText}>No spending data for this month yet.</Text>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Category Totals</Text>
            {pieData.map((item, index) => (
              <View key={index} style={styles.row}>
                <View style={styles.rowLeft}>
                  <View style={[styles.dot, { backgroundColor: item.color }]} />
                  <Text style={styles.categoryText}>{item.name}</Text>
                </View>
                <Text style={styles.amountText}>
                  {user?.currency || 'USD'} {item.amount.toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Daily Spending (This Month)</Text>
            <LineChart
              data={lineData}
              width={screenWidth - 80}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chartStyle}
              withInnerLines={false}
              withOuterLines={false}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>6-Month Trend</Text>
            <BarChart
              data={barData}
              width={screenWidth - 80}
              height={220}
              yAxisLabel={user?.currency === 'USD' ? '$' : ''}
              yAxisSuffix=""
              chartConfig={{
                ...chartConfig,
                fillShadowGradientFrom: '#8b5cf6',
                fillShadowGradientTo: '#ec4899',
                fillShadowGradientFromOpacity: 0.8,
                fillShadowGradientToOpacity: 0.8,
              }}
              style={styles.chartStyle}
              showValuesOnTopOfBars
              withInnerLines={false}
            />
          </View>
        </View>
      )}
      
      <View style={{ height: 40 }} />
    </ScrollView>
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#e5e7eb',
    borderRadius: 20,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 16,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontWeight: '600',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#4f46e5',
  },
  card: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 20,
  },
  emptyText: {
    color: '#6b7280',
    textAlign: 'center',
    padding: 20,
  },
  chartStyle: {
    marginVertical: 8,
    borderRadius: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  categoryText: {
    fontSize: 16,
    color: '#4b5563',
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  }
});

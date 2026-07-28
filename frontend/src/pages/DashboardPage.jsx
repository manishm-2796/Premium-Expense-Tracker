import { useState } from 'react';
import Navbar from '../components/Navbar';
import DashboardCharts from '../components/DashboardCharts';
import TransactionForm from '../components/TransactionForm';
import TransactionList from '../components/TransactionList';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleTransactionAdded = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar activePage="dashboard" />
      
      <main className="main-content" style={{ flex: 1 }}>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="dashboard-grid"
        >
          <div style={{ width: '100%' }}>
            <DashboardCharts refreshKey={refreshKey} />
          </div>
          
          <div style={{ width: '100%' }}>
            <TransactionForm onTransactionAdded={handleTransactionAdded} />
          </div>
        </motion.div>

        <TransactionList refreshKey={refreshKey} />
      </main>
    </div>
  );
}

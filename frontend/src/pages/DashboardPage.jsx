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
      <Navbar />
      
      <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', width: '100%', flex: 1 }}>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem', alignItems: 'start' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', flex: 2 }}>
            <DashboardCharts refreshKey={refreshKey} />
          </div>
          
          <div style={{ flex: 1, minWidth: '350px' }}>
            <TransactionForm onTransactionAdded={handleTransactionAdded} />
          </div>
        </motion.div>

        <TransactionList refreshKey={refreshKey} />
      </main>
    </div>
  );
}

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { transactionService } from './api';
import { format } from 'date-fns';
import { Platform } from 'react-native';

export const exportService = {
  generatePDF: async (currency: string = 'USD') => {
    try {
      // Fetch data
      const [summaryRes, txRes] = await Promise.all([
        transactionService.getSummary(),
        transactionService.getAll()
      ]);
      
      const summary = summaryRes.data;
      const transactions = txRes.data;
      
      const month = format(new Date(), 'MMMM yyyy');
      
      // Generate HTML
      const html = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #1f2937; }
              .header { text-align: center; margin-bottom: 40px; }
              h1 { color: #4f46e5; margin-bottom: 5px; }
              h2 { font-size: 18px; color: #6b7280; font-weight: normal; margin-top: 0; }
              .summary-box { background-color: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 40px; border-left: 5px solid #4f46e5; }
              .summary-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 16px; }
              .summary-row.total { font-weight: bold; font-size: 20px; margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th { text-align: left; padding: 12px; background-color: #4f46e5; color: white; }
              td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
              .amount { font-weight: bold; text-align: right; }
              th.amount-header { text-align: right; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Expense Report</h1>
              <h2>${month}</h2>
            </div>
            
            <div class="summary-box">
              <div class="summary-row">
                <span>Monthly Budget</span>
                <span>${currency} ${(summary.daily_budget * 30).toFixed(2)}</span>
              </div>
              <div class="summary-row total">
                <span>Total Spent</span>
                <span style="color: ${summary.total_spent > (summary.daily_budget * 30) ? '#ef4444' : '#10b981'}">
                  ${currency} ${summary.total_spent.toFixed(2)}
                </span>
              </div>
            </div>
            
            <h3>Transaction History</h3>
            <table>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th class="amount-header">Amount</th>
              </tr>
              ${transactions.map((tx: any) => `
                <tr>
                  <td>${format(new Date(tx.date), 'MMM dd')}</td>
                  <td>${tx.description}</td>
                  <td>${tx.category?.name || 'Other'}</td>
                  <td class="amount">${currency} ${tx.amount.toFixed(2)}</td>
                </tr>
              `).join('')}
            </table>
          </body>
        </html>
      `;

      if (Platform.OS === 'web') {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        iframe.contentDocument?.write(html);
        iframe.contentDocument?.close();
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 2000);
        return;
      }

      // Generate PDF on mobile
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      
    } catch (error) {
      console.error('PDF Generation failed:', error);
      throw error;
    }
  },

  exportCSV: async () => {
    try {
      if (Platform.OS === 'web') {
        // Fetch raw text with authentication using our configured axios instance
        const response = await transactionService.exportCSV();
        const blob = response.data;
        
        // Create an invisible anchor tag to trigger download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'transactions.csv';
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        return;
      }
      
      // Mobile download requires token in headers
      const { authService } = await import('./api');
      const token = await authService.getToken();
      
      const fileUri = FileSystem.documentDirectory + 'transactions.csv';
      const downloadRes = await FileSystem.downloadAsync(
        'http://10.0.2.2:8000/transactions/export-csv',
        fileUri,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      await Sharing.shareAsync(downloadRes.uri, { UTI: '.csv', mimeType: 'text/csv' });
      
    } catch (error) {
      console.error('CSV Export failed:', error);
      throw error;
    }
  }
};

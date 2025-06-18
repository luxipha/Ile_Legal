import React, { useState } from 'react';
import { Container, Box, Tabs, Tab, Typography, Paper } from '@mui/material';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import WalletDashboard from './WalletDashboard';
import WalletTransactions from './WalletTransactions';
import WalletFunding from './WalletFunding';
import WalletTest from './WalletTest';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PaymentIcon from '@mui/icons-material/Payment';
import BugReportIcon from '@mui/icons-material/BugReport';
import { useAuth } from '../../contexts/AuthContext';

const WalletIndex: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<number>(() => {
    if (location.pathname.includes('/transactions')) return 1;
    if (location.pathname.includes('/funding')) return 2;
    if (location.pathname.includes('/test')) return 3;
    return 0;
  });

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h5" color="error">
            Authentication Required
          </Typography>
          <Typography variant="body1" sx={{ mt: 2 }}>
            Please log in to access your wallet.
          </Typography>
        </Paper>
      </Container>
    );
  }

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    
    switch (newValue) {
      case 0:
        navigate('/wallet');
        break;
      case 1:
        navigate('/wallet/transactions');
        break;
      case 2:
        navigate('/wallet/funding');
        break;
      case 3:
        navigate('/wallet/test');
        break;
      default:
        navigate('/wallet');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom component="h1" sx={{ display: 'flex', alignItems: 'center' }}>
        <AccountBalanceWalletIcon sx={{ mr: 1 }} />
        USDC Wallet
      </Typography>
      
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab 
            icon={<AccountBalanceWalletIcon />} 
            label="Dashboard" 
            iconPosition="start"
          />
          <Tab 
            icon={<ReceiptLongIcon />} 
            label="Transactions" 
            iconPosition="start"
          />
          <Tab 
            icon={<PaymentIcon />} 
            label="Deposit & Withdraw" 
            iconPosition="start"
          />
          {/* Only show API Test tab for admin users */}
          {user.role === 'admin' && (
            <Tab 
              icon={<BugReportIcon />} 
              label="API Test" 
              iconPosition="start"
            />
          )}
        </Tabs>
      </Paper>
      
      <Box sx={{ mt: 3 }}>
        <Routes>
          <Route path="/" element={<WalletDashboard />} />
          <Route path="/transactions" element={<WalletTransactions />} />
          <Route path="/funding" element={<WalletFunding />} />
          {/* Only render the WalletTest component for admin users */}
          <Route path="/test" element={
            user.role === 'admin' ? <WalletTest /> : <Navigate to="/wallet" replace />
          } />
          <Route path="*" element={<WalletDashboard />} />
        </Routes>
      </Box>
    </Container>
  );
};

export default WalletIndex;

import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Card, CardContent, Button, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Chip } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { getUserWallet, getWalletTransactions } from '../../services/walletService';
import { TransactionData } from '../../types';
import { FilCDNContentViewer } from '../../components/filcdn/FilCDNContentViewer/FilCDNContentViewer';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { formatDistanceToNow } from 'date-fns';

const WalletDashboard: React.FC = () => {
  const { user } = useAuth();
  const [walletData, setWalletData] = useState<any>(null);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;

  useEffect(() => {
    const fetchWalletData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch wallet details
        const wallet = await getUserWallet(user.id);
        setWalletData(wallet);
        
        // Fetch transaction history
        const txHistory = await getWalletTransactions(user.id, pageSize, page);
        setTransactions(txHistory.data || []);
      } catch (err: any) {
        console.error('Error fetching wallet data:', err);
        setError(err.message || 'Failed to load wallet data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchWalletData();
  }, [user, page]);

  const handleNextPage = () => {
    setPage(prev => prev + 1);
  };

  const handlePrevPage = () => {
    setPage(prev => Math.max(1, prev - 1));
  };

  const formatAmount = (amount: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(parseFloat(amount) / 100); // Convert cents to dollars
  };

  const getTransactionStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'complete':
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const getTransactionTypeIcon = (transaction: TransactionData) => {
    // Determine if this is an incoming or outgoing transaction
    const isOutgoing = transaction.source.id === walletData?.walletId;
    
    if (isOutgoing) {
      return <ArrowUpwardIcon color="error" />;
    } else {
      return <ArrowDownwardIcon color="success" />;
    }
  };

  const getTransactionDescription = (transaction: TransactionData) => {
    const isOutgoing = transaction.source.id === walletData?.walletId;
    
    switch (transaction.type) {
      case 'transfer':
        return isOutgoing ? 'Sent USDC' : 'Received USDC';
      case 'payment':
        return isOutgoing ? 'Payment Sent' : 'Payment Received';
      case 'escrow_funding':
        return 'Funds Escrowed';
      case 'escrow_release':
        return 'Escrow Released';
      default:
        return transaction.type;
    }
  };

  if (loading && !walletData) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading wallet data...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#fff4f4' }}>
          <Typography variant="h6" color="error">
            {error}
          </Typography>
          <Button 
            variant="contained" 
            sx={{ mt: 2 }} 
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom component="h1">
        <AccountBalanceWalletIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Wallet Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        {/* Wallet Balance Card */}
        <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Available Balance
              </Typography>
              
              {walletData?.balances?.map((balance: any) => (
                <Box key={balance.currency}>
                  <Typography variant="body2" color="text.secondary">
                    {balance.currency}
                  </Typography>
                  <Typography variant="h3" component="div">
                    {formatAmount(balance.amount)}
                  </Typography>
                </Box>
              )) || (
                <Typography variant="h3" component="div">
                  $0.00
                </Typography>
              )}
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Wallet Address: {walletData?.address ? `${walletData.address.substring(0, 8)}...${walletData.address.substring(walletData.address.length - 8)}` : 'N/A'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Status: {walletData?.status || 'Unknown'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Quick Actions Card */}
        <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Quick Actions
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  startIcon={<ArrowDownwardIcon />}
                  fullWidth
                >
                  Deposit Funds
                </Button>
                
                <Button 
                  variant="outlined" 
                  color="primary" 
                  startIcon={<ArrowUpwardIcon />}
                  fullWidth
                >
                  Withdraw Funds
                </Button>
                
                <Button 
                  variant="outlined" 
                  startIcon={<SwapHorizIcon />}
                  fullWidth
                >
                  Transfer USDC
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Transaction History */}
        <Grid sx={{ gridColumn: 'span 12' }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom component="div">
              Transaction History
            </Typography>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>ID</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactions.length > 0 ? (
                    transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {getTransactionTypeIcon(transaction)}
                            <Typography variant="body2" sx={{ ml: 1 }}>
                              {getTransactionDescription(transaction)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {formatAmount(transaction.amount.amount)}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            size="small" 
                            label={transaction.status} 
                            color={getTransactionStatusColor(transaction.status) as any}
                          />
                        </TableCell>
                        <TableCell>
                          {formatDistanceToNow(new Date(transaction.createDate), { addSuffix: true })}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {transaction.id.substring(0, 8)}...
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography variant="body1" sx={{ py: 2 }}>
                          No transactions found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            {transactions.length > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button 
                  disabled={page === 1} 
                  onClick={handlePrevPage}
                >
                  Previous
                </Button>
                <Button 
                  disabled={transactions.length < pageSize} 
                  onClick={handleNextPage}
                >
                  Next
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* FilCDN Storage Section */}
        <Grid sx={{ gridColumn: 'span 12' }}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Stored Documents (FilCDN)
              </Typography>
              <FilCDNContentViewer />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default WalletDashboard;

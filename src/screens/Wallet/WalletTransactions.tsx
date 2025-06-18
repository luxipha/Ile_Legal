import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, CircularProgress, Chip,
  Button, TextField, MenuItem, FormControl, InputLabel, Select,
  SelectChangeEvent
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { getWalletTransactions } from '../../services/walletService';
import { TransactionData } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import FilterListIcon from '@mui/icons-material/FilterList';

const WalletTransactions: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [filter, setFilter] = useState<string>('all');
  const [walletId, setWalletId] = useState<string>('');

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch transaction history
        const txHistory = await getWalletTransactions(user.id, pageSize, page);
        setTransactions(txHistory.data || []);
        
        // Store wallet ID for filtering
        if (txHistory.data && txHistory.data.length > 0) {
          // Try to determine the user's wallet ID from the transactions
          const userTransactions = txHistory.data.filter((tx: TransactionData) => 
            tx.source.type === 'wallet' || tx.destination.type === 'wallet'
          );
          
          if (userTransactions.length > 0) {
            // Check if user is in the source or destination of the first transaction
            const firstTx = userTransactions[0];
            if (firstTx.source.type === 'wallet') {
              setWalletId(firstTx.source.id);
            } else if (firstTx.destination.type === 'wallet') {
              setWalletId(firstTx.destination.id);
            }
          }
        }
      } catch (err: any) {
        console.error('Error fetching transactions:', err);
        setError(err.message || 'Failed to load transaction data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTransactions();
  }, [user, page, pageSize]);

  const handleNextPage = () => {
    setPage(prev => prev + 1);
  };

  const handlePrevPage = () => {
    setPage(prev => Math.max(1, prev - 1));
  };

  const handlePageSizeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPageSize(parseInt(event.target.value));
    setPage(1); // Reset to first page when changing page size
  };

  const handleFilterChange = (event: SelectChangeEvent) => {
    setFilter(event.target.value);
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
    const isOutgoing = transaction.source.id === walletId;
    
    if (isOutgoing) {
      return <ArrowUpwardIcon color="error" />;
    } else {
      return <ArrowDownwardIcon color="success" />;
    }
  };

  const getTransactionDescription = (transaction: TransactionData) => {
    const isOutgoing = transaction.source.id === walletId;
    
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

  // Filter transactions based on selected filter
  const filteredTransactions = transactions.filter(transaction => {
    if (filter === 'all') return true;
    if (filter === 'incoming') return transaction.destination.id === walletId;
    if (filter === 'outgoing') return transaction.source.id === walletId;
    if (filter === 'completed') return transaction.status.toLowerCase() === 'complete' || transaction.status.toLowerCase() === 'completed';
    if (filter === 'pending') return transaction.status.toLowerCase() === 'pending';
    return true;
  });

  if (loading && transactions.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading transaction history...
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
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="div">
            Transaction History
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FilterListIcon sx={{ mr: 1 }} />
            <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
              <InputLabel id="filter-select-label">Filter</InputLabel>
              <Select
                labelId="filter-select-label"
                id="filter-select"
                value={filter}
                onChange={handleFilterChange}
                label="Filter"
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="incoming">Incoming</MenuItem>
                <MenuItem value="outgoing">Outgoing</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Type</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>From/To</TableCell>
                <TableCell>Transaction ID</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction) => (
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
                      <Box>
                        <Typography variant="body2">
                          {new Date(transaction.createDate).toLocaleDateString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDistanceToNow(new Date(transaction.createDate), { addSuffix: true })}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {transaction.source.id === walletId ? (
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          To: {transaction.destination.id.substring(0, 8)}...
                        </Typography>
                      ) : (
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          From: {transaction.source.id.substring(0, 8)}...
                        </Typography>
                      )}
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
                  <TableCell colSpan={6} align="center">
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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
            <Typography variant="body2">
              Page {page} • Showing {filteredTransactions.length} of {transactions.length} transactions
            </Typography>
            
            <Box>
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
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default WalletTransactions;

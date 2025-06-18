import React, { useState } from 'react';
import { 
  Container, Typography, Box, Paper, Stepper, Step, StepLabel,
  Button, TextField, CircularProgress, Alert, Grid, Card, CardContent,
  Radio, RadioGroup, FormControlLabel, FormControl,
  InputAdornment
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { getUserWallet } from '../../services/walletService';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import PaymentIcon from '@mui/icons-material/Payment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

// Mock function for deposit - in production, this would call the Circle API
const mockDepositFunds = async (depositAmount: number, method: string) => {
  // Simulate API call
  return new Promise<{ success: boolean; transactionId: string }>((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        transactionId: `tx-${Math.random().toString(36).substring(2, 15)}`
      });
    }, 2000);
  });
};

// Mock function for withdrawal - in production, this would call the Circle API
const mockWithdrawFunds = async (withdrawAmount: number, destination: string) => {
  // Simulate API call
  return new Promise<{ success: boolean; transactionId: string }>((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        transactionId: `tx-${Math.random().toString(36).substring(2, 15)}`
      });
    }, 2000);
  });
};

const WalletFunding: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('card');
  const [destinationAddress, setDestinationAddress] = useState<string>('');
  const [activeStep, setActiveStep] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [transactionId, setTransactionId] = useState<string>('');
  const [walletBalance, setWalletBalance] = useState<string>('0.00');

  React.useEffect(() => {
    const fetchWalletBalance = async () => {
      if (!user) return;
      
      try {
        const wallet = await getUserWallet(user.id);
        if (wallet.balances && wallet.balances.length > 0) {
          const usdcBalance = wallet.balances.find((b: any) => b.currency === 'USD');
          if (usdcBalance) {
            setWalletBalance((parseFloat(usdcBalance.amount) / 100).toFixed(2));
          }
        }
      } catch (err) {
        console.error('Error fetching wallet balance:', err);
      }
    };
    
    fetchWalletBalance();
  }, [user]);

  const depositSteps = ['Enter Amount', 'Payment Method', 'Confirm', 'Complete'];
  const withdrawSteps = ['Enter Amount', 'Destination', 'Confirm', 'Complete'];
  
  const steps = activeTab === 'deposit' ? depositSteps : withdrawSteps;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and decimals
    const value = e.target.value;
    if (/^\d*\.?\d{0,2}$/.test(value) || value === '') {
      setAmount(value);
    }
  };

  const handleNext = async () => {
    if (activeStep === 2) {
      // Confirm step - process the transaction
      setLoading(true);
      setError(null);
      
      try {
        let result;
        
        if (activeTab === 'deposit') {
          result = await mockDepositFunds(parseFloat(amount), paymentMethod);
        } else {
          result = await mockWithdrawFunds(parseFloat(amount), destinationAddress);
        }
        
        if (result.success) {
          setTransactionId(result.transactionId);
          setSuccess(true);
          setActiveStep(activeStep + 1);
        } else {
          throw new Error('Transaction failed');
        }
      } catch (err: any) {
        console.error(`Error processing ${activeTab}:`, err);
        setError(err.message || `Failed to process ${activeTab}`);
      } finally {
        setLoading(false);
      }
    } else {
      // Just move to next step
      setActiveStep(activeStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setAmount('');
    setPaymentMethod('card');
    setDestinationAddress('');
    setError(null);
    setSuccess(false);
    setTransactionId('');
  };

  const isNextDisabled = () => {
    if (loading) return true;
    
    switch (activeStep) {
      case 0:
        return !amount || parseFloat(amount) <= 0;
      case 1:
        if (activeTab === 'deposit') {
          return !paymentMethod;
        } else {
          return !destinationAddress;
        }
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box sx={{ mt: 4, maxWidth: 400, mx: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              {activeTab === 'deposit' ? 'Deposit Amount' : 'Withdrawal Amount'}
            </Typography>
            
            <TextField
              label="Amount (USD)"
              variant="outlined"
              fullWidth
              value={amount}
              onChange={handleAmountChange}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              helperText={`Current balance: $${walletBalance}`}
              sx={{ mb: 2 }}
            />
            
            {activeTab === 'withdraw' && parseFloat(amount) > parseFloat(walletBalance) && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Withdrawal amount exceeds available balance
              </Alert>
            )}
            
            <Typography variant="body2" color="text.secondary">
              {activeTab === 'deposit' 
                ? 'Enter the amount you wish to deposit into your wallet.'
                : 'Enter the amount you wish to withdraw from your wallet.'}
            </Typography>
          </Box>
        );
      
      case 1:
        if (activeTab === 'deposit') {
          return (
            <Box sx={{ mt: 4, maxWidth: 400, mx: 'auto' }}>
              <Typography variant="h6" gutterBottom>
                Select Payment Method
              </Typography>
              
              <FormControl component="fieldset" sx={{ width: '100%' }}>
                <RadioGroup
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <Paper sx={{ mb: 2, p: 2 }}>
                    <FormControlLabel 
                      value="card" 
                      control={<Radio />} 
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CreditCardIcon sx={{ mr: 1 }} />
                          <Typography>Credit/Debit Card</Typography>
                        </Box>
                      } 
                    />
                  </Paper>
                  
                  <Paper sx={{ mb: 2, p: 2 }}>
                    <FormControlLabel 
                      value="ach" 
                      control={<Radio />} 
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <PaymentIcon sx={{ mr: 1 }} />
                          <Typography>ACH Bank Transfer</Typography>
                        </Box>
                      } 
                    />
                  </Paper>
                  
                  <Paper sx={{ mb: 2, p: 2 }}>
                    <FormControlLabel 
                      value="wire" 
                      control={<Radio />} 
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <AccountBalanceWalletIcon sx={{ mr: 1 }} />
                          <Typography>Wire Transfer</Typography>
                        </Box>
                      } 
                    />
                  </Paper>
                </RadioGroup>
              </FormControl>
            </Box>
          );
        } else {
          return (
            <Box sx={{ mt: 4, maxWidth: 400, mx: 'auto' }}>
              <Typography variant="h6" gutterBottom>
                Withdrawal Destination
              </Typography>
              
              <TextField
                label="Destination Wallet Address"
                variant="outlined"
                fullWidth
                value={destinationAddress}
                onChange={(e) => setDestinationAddress(e.target.value)}
                sx={{ mb: 2 }}
              />
              
              <Typography variant="body2" color="text.secondary">
                Enter the wallet address where you want to withdraw your funds.
                Make sure to double-check the address as transactions cannot be reversed.
              </Typography>
            </Box>
          );
        }
      
      case 2:
        return (
          <Box sx={{ mt: 4, maxWidth: 400, mx: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              Confirm {activeTab === 'deposit' ? 'Deposit' : 'Withdrawal'}
            </Typography>
            
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Amount:
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body1" fontWeight="bold">
                      ${parseFloat(amount).toFixed(2)}
                    </Typography>
                  </Grid>
                  
                  {activeTab === 'deposit' && (
                    <>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Payment Method:
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body1">
                          {paymentMethod === 'card' && 'Credit/Debit Card'}
                          {paymentMethod === 'ach' && 'ACH Bank Transfer'}
                          {paymentMethod === 'wire' && 'Wire Transfer'}
                        </Typography>
                      </Grid>
                    </>
                  )}
                  
                  {activeTab === 'withdraw' && (
                    <>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Destination:
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
                          {`${destinationAddress.substring(0, 6)}...${destinationAddress.substring(destinationAddress.length - 4)}`}
                        </Typography>
                      </Grid>
                    </>
                  )}
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Fee:
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body1">
                      $0.00
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Box sx={{ borderTop: '1px solid #eee', pt: 1, mt: 1 }}>
                      <Grid container>
                        <Grid item xs={6}>
                          <Typography variant="body1" fontWeight="bold">
                            Total:
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body1" fontWeight="bold">
                            ${parseFloat(amount).toFixed(2)}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
            
            <Typography variant="body2" color="text.secondary">
              Please review the details above and click "Confirm" to proceed with the 
              {activeTab === 'deposit' ? ' deposit.' : ' withdrawal.'}
            </Typography>
          </Box>
        );
      
      case 3:
        return (
          <Box sx={{ mt: 4, textAlign: 'center', maxWidth: 400, mx: 'auto' }}>
            <CheckCircleIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
            
            <Typography variant="h5" gutterBottom>
              {activeTab === 'deposit' ? 'Deposit Successful!' : 'Withdrawal Initiated!'}
            </Typography>
            
            <Typography variant="body1" paragraph>
              {activeTab === 'deposit'
                ? `Your deposit of $${parseFloat(amount).toFixed(2)} has been processed successfully.`
                : `Your withdrawal of $${parseFloat(amount).toFixed(2)} has been initiated and is being processed.`
              }
            </Typography>
            
            <Typography variant="body2" color="text.secondary" paragraph>
              Transaction ID: {transactionId}
            </Typography>
            
            <Typography variant="body2" color="text.secondary">
              {activeTab === 'deposit'
                ? 'The funds will be available in your wallet shortly.'
                : 'The funds should arrive at the destination address within 1-2 business days.'
              }
            </Typography>
            
            <Button
              variant="contained"
              onClick={handleReset}
              sx={{ mt: 3 }}
            >
              {activeTab === 'deposit' ? 'Make Another Deposit' : 'Make Another Withdrawal'}
            </Button>
          </Box>
        );
      
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom component="h1">
        <AccountBalanceWalletIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        {activeTab === 'deposit' ? 'Deposit Funds' : 'Withdraw Funds'}
      </Typography>
      
      <Box sx={{ mb: 4 }}>
        <Button
          variant={activeTab === 'deposit' ? 'contained' : 'outlined'}
          onClick={() => {
            setActiveTab('deposit');
            handleReset();
          }}
          sx={{ mr: 1 }}
        >
          Deposit
        </Button>
        <Button
          variant={activeTab === 'withdraw' ? 'contained' : 'outlined'}
          onClick={() => {
            setActiveTab('withdraw');
            handleReset();
          }}
        >
          Withdraw
        </Button>
      </Box>
      
      <Paper sx={{ p: 3 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {error && (
          <Alert severity="error" sx={{ mt: 3 }}>
            {error}
          </Alert>
        )}
        
        {renderStepContent()}
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
          {activeStep > 0 && activeStep < 3 && (
            <Button
              disabled={loading}
              onClick={handleBack}
              sx={{ mr: 1 }}
            >
              Back
            </Button>
          )}
          
          {activeStep < 3 && (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={isNextDisabled()}
            >
              {activeStep === 2 ? 'Confirm' : 'Next'}
              {loading && <CircularProgress size={24} sx={{ ml: 1 }} />}
            </Button>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default WalletFunding;

import React, { useState } from 'react';
import { 
  Container, Typography, Box, Button, Paper, CircularProgress, Alert, 
  Grid, Card, CardContent, Divider, List, ListItem, ListItemText, Chip
} from '@mui/material';
import { testCircleConnection } from '../../services/circleApi';

const WalletTest: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastTestedAt, setLastTestedAt] = useState<string | null>(null);

  const handleTestConnection = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const connectionResult = await testCircleConnection();
      setResult(connectionResult);
      setLastTestedAt(new Date().toLocaleString());
      
      if (!connectionResult.success) {
        setError(connectionResult.error || 'Connection failed');
      }
    } catch (err: any) {
      console.error('Error testing Circle API:', err);
      setError(err.message || 'An unexpected error occurred');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom component="h1">
        Circle USDC API Administration
      </Typography>
      
      <Grid container spacing={3}>
        {/* API Connection Test */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3, mb: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Test Circle API Connection
            </Typography>
            
            <Typography variant="body1" paragraph>
              This admin-only tool allows you to test the Circle API connection with your configured credentials.
              The test will verify wallet connectivity and retrieve current balance information.
            </Typography>
            
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleTestConnection}
              disabled={loading}
              sx={{ mb: 3 }}
            >
              {loading ? <CircularProgress size={24} sx={{ mr: 1 }} /> : null}
              Test Connection
            </Button>
            
            {lastTestedAt && (
              <Typography variant="caption" display="block" sx={{ mb: 2, color: 'text.secondary' }}>
                Last tested: {lastTestedAt}
              </Typography>
            )}
            
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            {result && result.success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Connection successful! Wallet balance retrieved.
              </Alert>
            )}
            
            {result && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Connection Status: {result.success ? 
                    <Chip label="Connected" color="success" size="small" /> : 
                    <Chip label="Failed" color="error" size="small" />}
                </Typography>
                
                <Typography variant="subtitle2" gutterBottom>
                  Wallet Address: <Box component="span" sx={{ fontFamily: 'monospace' }}>{result.walletAddress}</Box>
                </Typography>
                
                {result.data && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1, overflow: 'auto', maxHeight: 300 }}>
                    <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace' }}>
                      {JSON.stringify(result.data, null, 2)}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </Paper>
        </Grid>
        
        {/* API Configuration Info */}
        <Grid item xs={12} md={5}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Circle API Configuration
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="API URL" 
                    secondary={import.meta.env.VITE_CIRCLE_API_URL || "Not configured"} 
                    secondaryTypographyProps={{ sx: { fontFamily: 'monospace' } }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Modular SDK URL" 
                    secondary={import.meta.env.VITE_CIRCLE_MODULAR_URL || "Not configured"} 
                    secondaryTypographyProps={{ sx: { fontFamily: 'monospace' } }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Wallet Address" 
                    secondary={import.meta.env.VITE_CIRCLE_WALLET_ADDRESS || "Not configured"} 
                    secondaryTypographyProps={{ sx: { fontFamily: 'monospace' } }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="API Key" 
                    secondary="••••••••••••••••" 
                  />
                </ListItem>
              </List>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="body2" color="text.secondary">
                These settings can only be modified through environment variables. Changes require redeployment of the application.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default WalletTest;

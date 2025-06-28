#!/usr/bin/env node
/**
 * Check actual Circle wallet balance for your wallet
 */

require('dotenv').config();

const API_KEY = process.env.CIRCLE_API_KEY;
const WALLET_ID = process.env.CIRCLE_WALLET_ID;

async function checkBalance() {
  console.log('🔍 Checking Circle wallet balance...');
  console.log('📋 Wallet ID:', WALLET_ID);
  
  try {
    const response = await fetch(`https://api.circle.com/v1/w3s/wallets/${WALLET_ID}/balances`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Balance Response:', JSON.stringify(result, null, 2));
      
      if (result.data && result.data.tokenBalances) {
        console.log('\n💰 Token Balances:');
        result.data.tokenBalances.forEach(balance => {
          console.log(`   ${balance.token.symbol}: ${balance.amount}`);
        });
      }
    } else {
      console.error('❌ Error response:', result);
    }
    
  } catch (error) {
    console.error('❌ Error checking balance:', error);
  }
}

checkBalance();
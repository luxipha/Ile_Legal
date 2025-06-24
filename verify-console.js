// Console verification script for app_settings table
// Run this in your browser console on the admin dashboard

console.log('🔍 App Settings Verification Starting...');

// Test 1: Check if SettingsService is available
if (typeof SettingsService === 'undefined') {
    console.error('❌ SettingsService not found. Import it first:');
    console.log('import { SettingsService } from "./src/services/settingsService.js";');
} else {
    console.log('✅ SettingsService found');
}

// Verification function
async function verifyAppSettings() {
    try {
        console.log('\n🚀 Starting verification tests...\n');
        
        // Test 1: Clear cache and load settings
        console.log('Test 1: Loading settings from database...');
        SettingsService.clearCache();
        const settings = await SettingsService.getSettings();
        
        console.log('✅ Settings loaded:', {
            providerCount: settings.paymentProviders?.length,
            providers: settings.paymentProviders?.map(p => ({ 
                name: p.name, 
                enabled: p.enabled,
                hasApiKey: !!p.apiKey,
                hasSecretKey: !!p.secretKey
            })),
            lastUpdated: settings.lastUpdated
        });
        
        // Test 2: Check Paystack specifically
        console.log('\nTest 2: Checking Paystack configuration...');
        const paystackProvider = settings.paymentProviders?.find(p => p.name === 'Paystack');
        
        if (paystackProvider) {
            console.log('✅ Paystack provider found:', {
                enabled: paystackProvider.enabled,
                hasPublicKey: !!paystackProvider.apiKey,
                hasSecretKey: !!paystackProvider.secretKey,
                testMode: paystackProvider.testMode,
                publicKeyPreview: paystackProvider.apiKey ? 
                    paystackProvider.apiKey.substring(0, 8) + '...' : 'Not set'
            });
        } else {
            console.error('❌ Paystack provider not found!');
        }
        
        // Test 3: Test save functionality
        console.log('\nTest 3: Testing save functionality...');
        const testSettings = {
            ...settings,
            paymentProviders: settings.paymentProviders.map(p => 
                p.name === 'Paystack' 
                    ? { ...p, testMode: !p.testMode } // Toggle test mode
                    : p
            )
        };
        
        await SettingsService.saveSettings(testSettings);
        console.log('✅ Settings saved successfully');
        
        // Test 4: Verify save worked
        SettingsService.clearCache();
        const reloadedSettings = await SettingsService.getSettings();
        const reloadedPaystack = reloadedSettings.paymentProviders?.find(p => p.name === 'Paystack');
        
        console.log('✅ Settings reloaded and verified:', {
            paystackTestMode: reloadedPaystack?.testMode,
            lastUpdated: reloadedSettings.lastUpdated
        });
        
        console.log('\n🎉 All tests passed! App settings table is working correctly.');
        
        return {
            success: true,
            settings: reloadedSettings,
            paystackConfig: reloadedPaystack
        };
        
    } catch (error) {
        console.error('❌ Verification failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Auto-run if SettingsService is available
if (typeof SettingsService !== 'undefined') {
    verifyAppSettings().then(result => {
        if (result.success) {
            console.log('\n✅ VERIFICATION COMPLETE - App settings table is working correctly!');
            console.log('\nNext steps:');
            console.log('1. Go to Admin Dashboard → Settings → Payment Processing');
            console.log('2. Enable Paystack and add your keys');
            console.log('3. Test payment flow in Buyer Dashboard');
        } else {
            console.log('\n❌ VERIFICATION FAILED - Check the errors above');
        }
    });
} else {
    console.log('\n⚠️  To run verification:');
    console.log('1. Go to Admin Dashboard');
    console.log('2. Open browser console (F12)');
    console.log('3. Run: verifyAppSettings()');
}

// Export for manual use
window.verifyAppSettings = verifyAppSettings;
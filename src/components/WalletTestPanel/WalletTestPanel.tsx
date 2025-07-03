import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useAuth } from '../../contexts/AuthContext';
import { 
  testWalletCreation, 
  testWalletDataRetrieval, 
  testPaymentFlow, 
  testWalletBalance, 
  runWalletSystemTest,
  debugWalletState,
  WalletTestResult 
} from '../../utils/walletTestUtils';
import { 
  PlayIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  LoaderIcon,
  BugIcon,
  RefreshCcwIcon
} from 'lucide-react';

interface TestResult {
  name: string;
  result: WalletTestResult | null;
  isRunning: boolean;
}

export const WalletTestPanel: React.FC = () => {
  const { user } = useAuth();
  const [tests, setTests] = useState<TestResult[]>([
    { name: 'Wallet Data Retrieval', result: null, isRunning: false },
    { name: 'Wallet Balance Check', result: null, isRunning: false },
    { name: 'Payment Flow Test', result: null, isRunning: false },
    { name: 'Comprehensive System Test', result: null, isRunning: false }
  ]);
  const [debugData, setDebugData] = useState<WalletTestResult | null>(null);
  const [isDebugging, setIsDebugging] = useState(false);

  const updateTestResult = (testName: string, result: WalletTestResult, isRunning: boolean = false) => {
    setTests(prev => prev.map(test => 
      test.name === testName 
        ? { ...test, result, isRunning }
        : test
    ));
  };

  const runTest = async (testName: string) => {
    if (!user?.id) {
      alert('Please log in to run tests');
      return;
    }

    updateTestResult(testName, null, true);

    try {
      let result: WalletTestResult;

      switch (testName) {
        case 'Wallet Data Retrieval':
          result = await testWalletDataRetrieval(user.id);
          break;
        case 'Wallet Balance Check':
          result = await testWalletBalance(user.id);
          break;
        case 'Payment Flow Test':
          result = await testPaymentFlow(user.id, user.id, 1000, 'NGN');
          break;
        case 'Comprehensive System Test':
          result = await runWalletSystemTest(user.id);
          break;
        default:
          result = { success: false, message: 'Unknown test' };
      }

      updateTestResult(testName, result, false);
    } catch (error: any) {
      updateTestResult(testName, {
        success: false,
        message: 'Test failed with exception',
        error: error.message
      }, false);
    }
  };

  const runDebug = async () => {
    if (!user?.id) {
      alert('Please log in to run debug');
      return;
    }

    setIsDebugging(true);
    try {
      const result = await debugWalletState(user.id);
      setDebugData(result);
    } catch (error: any) {
      setDebugData({
        success: false,
        message: 'Debug failed',
        error: error.message
      });
    } finally {
      setIsDebugging(false);
    }
  };

  const runAllTests = async () => {
    for (const test of tests) {
      await runTest(test.name);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  const getStatusIcon = (test: TestResult) => {
    if (test.isRunning) {
      return <LoaderIcon className="w-5 h-5 text-blue-500 animate-spin" />;
    }
    if (!test.result) {
      return <PlayIcon className="w-5 h-5 text-gray-400" />;
    }
    return test.result.success 
      ? <CheckCircleIcon className="w-5 h-5 text-green-500" />
      : <XCircleIcon className="w-5 h-5 text-red-500" />;
  };

  if (!user) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <p className="text-center text-gray-500">Please log in to access wallet testing tools.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCcwIcon className="w-5 h-5" />
            Wallet System Tests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <Button onClick={runAllTests} className="bg-blue-600 hover:bg-blue-700">
              Run All Tests
            </Button>
            <Button 
              onClick={runDebug} 
              variant="outline" 
              disabled={isDebugging}
              className="flex items-center gap-2"
            >
              {isDebugging ? (
                <LoaderIcon className="w-4 h-4 animate-spin" />
              ) : (
                <BugIcon className="w-4 h-4" />
              )}
              Debug Wallet State
            </Button>
          </div>

          {/* Individual Tests */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tests.map((test) => (
              <Card key={test.name} className="border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">{test.name}</h4>
                    {getStatusIcon(test)}
                  </div>
                  
                  {test.result && (
                    <div className="mb-3">
                      <p className={`text-sm ${test.result.success ? 'text-green-600' : 'text-red-600'}`}>
                        {test.result.message}
                      </p>
                      {test.result.error && (
                        <p className="text-xs text-red-500 mt-1">{test.result.error}</p>
                      )}
                    </div>
                  )}
                  
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => runTest(test.name)}
                    disabled={test.isRunning}
                    className="w-full"
                  >
                    {test.isRunning ? 'Running...' : 'Run Test'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Debug Results */}
      {debugData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BugIcon className="w-5 h-5" />
              Debug Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg">
              <pre className="text-xs overflow-auto max-h-96">
                {JSON.stringify(debugData.data, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Results Details */}
      {tests.some(test => test.result?.data) && (
        <Card>
          <CardHeader>
            <CardTitle>Detailed Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tests.filter(test => test.result?.data).map((test) => (
                <div key={test.name} className="border-l-4 border-l-blue-500 pl-4">
                  <h4 className="font-medium mb-2">{test.name}</h4>
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    <pre className="overflow-auto max-h-48">
                      {JSON.stringify(test.result?.data, null, 2)}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Info */}
      <Card>
        <CardHeader>
          <CardTitle>Test Environment Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>User ID:</strong> {user.id}
            </div>
            <div>
              <strong>User Role:</strong> {user.role}
            </div>
            <div>
              <strong>Email:</strong> {user.email}
            </div>
            <div>
              <strong>Name:</strong> {user.name}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
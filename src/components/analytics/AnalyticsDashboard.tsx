import React, { useState } from 'react';
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { UserGrowthChart } from './UserGrowthChart';
import { TransactionVolumeChart } from './TransactionVolumeChart';
import { 
  TrendingUpIcon, 
  BarChart3Icon
} from "lucide-react";

type TimeframeType = 'week' | 'month' | 'quarter' | 'year';

export const AnalyticsDashboard: React.FC = () => {
  const [userGrowthTimeframe, setUserGrowthTimeframe] = useState<TimeframeType>('month');
  const [transactionTimeframe, setTransactionTimeframe] = useState<TimeframeType>('month');

  // Chart timeframes are managed by state

  return (
    <div className="space-y-8">

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* User Growth Chart */}
        <Card className="bg-white border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <TrendingUpIcon className="w-5 h-5 text-gray-600" />
                </div>
                <h4 className="font-semibold text-gray-900">User Growth</h4>
              </div>
              <div className="flex gap-2">
                {(['week', 'month', 'quarter', 'year'] as TimeframeType[]).map((timeframe) => (
                  <Button 
                    key={timeframe}
                    variant={userGrowthTimeframe === timeframe ? "default" : "outline"}
                    size="sm"
                    onClick={() => setUserGrowthTimeframe(timeframe)}
                    className={userGrowthTimeframe === timeframe ? "bg-[#1B1828] text-white" : ""}
                  >
                    {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
            <div className="h-64">
              <UserGrowthChart timeframe={userGrowthTimeframe} />
            </div>
          </CardContent>
        </Card>

        {/* Transaction Volume */}
        <Card className="bg-white border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <BarChart3Icon className="w-5 h-5 text-gray-600" />
                </div>
                <h4 className="font-semibold text-gray-900">Transaction Volume</h4>
              </div>
              <div className="flex gap-2">
                {(['week', 'month', 'quarter', 'year'] as TimeframeType[]).map((timeframe) => (
                  <Button 
                    key={timeframe}
                    variant={transactionTimeframe === timeframe ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTransactionTimeframe(timeframe)}
                    className={transactionTimeframe === timeframe ? "bg-[#1B1828] text-white" : ""}
                  >
                    {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
            <div className="h-64">
              <TransactionVolumeChart timeframe={transactionTimeframe} />
            </div>
          </CardContent>
        </Card>
      </div>


    </div>
  );
};

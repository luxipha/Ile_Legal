import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface TransactionVolumeData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string;
    borderColor?: string;
    borderWidth?: number;
  }[];
}

interface TransactionVolumeChartProps {
  timeframe: 'week' | 'month' | 'quarter' | 'year';
}

export const TransactionVolumeChart: React.FC<TransactionVolumeChartProps> = ({ timeframe }) => {
  // Sample data - in a real application, this would come from an API
  const getChartData = (): TransactionVolumeData => {
    // Different data based on timeframe
    switch (timeframe) {
      case 'week':
        return {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [
            {
              label: 'Transaction Volume (₦)',
              data: [1200000, 1500000, 1800000, 1300000, 2000000, 2500000, 1700000],
              backgroundColor: 'rgba(254, 200, 95, 0.8)',
              borderColor: '#FEC85F',
              borderWidth: 1
            }
          ]
        };
      case 'month':
        return {
          labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
          datasets: [
            {
              label: 'Transaction Volume (₦)',
              data: [8000000, 9500000, 11000000, 12500000],
              backgroundColor: 'rgba(254, 200, 95, 0.8)',
              borderColor: '#FEC85F',
              borderWidth: 1
            }
          ]
        };
      case 'quarter':
        return {
          labels: ['Jan', 'Feb', 'Mar'],
          datasets: [
            {
              label: 'Transaction Volume (₦)',
              data: [35000000, 42000000, 48000000],
              backgroundColor: 'rgba(254, 200, 95, 0.8)',
              borderColor: '#FEC85F',
              borderWidth: 1
            }
          ]
        };
      case 'year':
        return {
          labels: ['Q1', 'Q2', 'Q3', 'Q4'],
          datasets: [
            {
              label: 'Transaction Volume (₦)',
              data: [120000000, 150000000, 180000000, 210000000],
              backgroundColor: 'rgba(254, 200, 95, 0.8)',
              borderColor: '#FEC85F',
              borderWidth: 1
            }
          ]
        };
      default:
        return {
          labels: [],
          datasets: []
        };
    }
  };

  // Calculate total transaction volume
  const calculateTotal = (): string => {
    const data = getChartData().datasets[0].data;
    const total = data.reduce((acc, curr) => acc + curr, 0);
    
    // Format as currency
    if (total >= 1000000000) {
      return `₦${(total / 1000000000).toFixed(1)}B`;
    } else if (total >= 1000000) {
      return `₦${(total / 1000000).toFixed(1)}M`;
    } else if (total >= 1000) {
      return `₦${(total / 1000).toFixed(1)}K`;
    } else {
      return `₦${total}`;
    }
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              const value = context.parsed.y;
              if (value >= 1000000) {
                label += `₦${(value / 1000000).toFixed(1)}M`;
              } else if (value >= 1000) {
                label += `₦${(value / 1000).toFixed(1)}K`;
              } else {
                label += `₦${value}`;
              }
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          callback: function(value: any) {
            if (value >= 1000000) {
              return `₦${value / 1000000}M`;
            } else if (value >= 1000) {
              return `₦${value / 1000}K`;
            } else {
              return `₦${value}`;
            }
          }
        }
      },
      x: {
        grid: {
          display: false,
        },
      },
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="text-right mb-2">
        <div className="text-2xl font-bold text-gray-900">{calculateTotal()}</div>
        <div className="text-sm text-gray-500">Total Volume ({timeframe})</div>
      </div>
      <div className="flex-1 relative">
        <Bar data={getChartData()} options={options} />
      </div>
    </div>
  );
};

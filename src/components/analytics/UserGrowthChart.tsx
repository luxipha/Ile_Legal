import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface UserGrowthData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string;
    borderColor: string;
    fill?: boolean;
    tension?: number;
  }[];
}

interface UserGrowthChartProps {
  timeframe: 'week' | 'month' | 'quarter' | 'year';
}

export const UserGrowthChart: React.FC<UserGrowthChartProps> = ({ timeframe }) => {
  // Sample data - in a real application, this would come from an API
  const getChartData = (): UserGrowthData => {
    // Different data based on timeframe
    switch (timeframe) {
      case 'week':
        return {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [
            {
              label: 'New Users',
              data: [5, 8, 12, 7, 10, 15, 20],
              backgroundColor: 'rgba(254, 200, 95, 0.2)',
              borderColor: '#FEC85F',
              fill: true,
              tension: 0.4
            },
            {
              label: 'Active Users',
              data: [30, 35, 40, 38, 45, 50, 65],
              backgroundColor: 'rgba(27, 24, 40, 0.1)',
              borderColor: '#1B1828',
              fill: true,
              tension: 0.4
            }
          ]
        };
      case 'month':
        return {
          labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
          datasets: [
            {
              label: 'New Users',
              data: [45, 60, 75, 90],
              backgroundColor: 'rgba(254, 200, 95, 0.2)',
              borderColor: '#FEC85F',
              fill: true,
              tension: 0.4
            },
            {
              label: 'Active Users',
              data: [150, 180, 210, 250],
              backgroundColor: 'rgba(27, 24, 40, 0.1)',
              borderColor: '#1B1828',
              fill: true,
              tension: 0.4
            }
          ]
        };
      case 'quarter':
        return {
          labels: ['Jan', 'Feb', 'Mar'],
          datasets: [
            {
              label: 'New Users',
              data: [180, 220, 270],
              backgroundColor: 'rgba(254, 200, 95, 0.2)',
              borderColor: '#FEC85F',
              fill: true,
              tension: 0.4
            },
            {
              label: 'Active Users',
              data: [600, 750, 900],
              backgroundColor: 'rgba(27, 24, 40, 0.1)',
              borderColor: '#1B1828',
              fill: true,
              tension: 0.4
            }
          ]
        };
      case 'year':
        return {
          labels: ['Q1', 'Q2', 'Q3', 'Q4'],
          datasets: [
            {
              label: 'New Users',
              data: [650, 800, 950, 1100],
              backgroundColor: 'rgba(254, 200, 95, 0.2)',
              borderColor: '#FEC85F',
              fill: true,
              tension: 0.4
            },
            {
              label: 'Active Users',
              data: [2500, 3200, 3800, 4500],
              backgroundColor: 'rgba(27, 24, 40, 0.1)',
              borderColor: '#1B1828',
              fill: true,
              tension: 0.4
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

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false
    }
  };

  return (
    <div className="w-full h-full">
      <Line data={getChartData()} options={options} />
    </div>
  );
};

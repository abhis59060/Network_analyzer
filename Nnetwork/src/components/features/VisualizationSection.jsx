import { Bar, Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function VisualizationSection({
  visualizations,
  loading,
  graphType,
  setGraphType
}) {
  if (loading || visualizations.length === 0) return null;

  // 🔥 DARK THEME COLORS - BEAUTIFUL!
  const colors = [
    'rgba(59, 130, 246, 0.8)',   // Blue
    'rgba(16, 185, 129, 0.8)',   // Green
    'rgba(245, 158, 11, 0.8)',   // Orange
    'rgba(239, 68, 68, 0.8)',    // Red
    'rgba(168, 85, 247, 0.8)',   // Purple
    'rgba(59, 130, 246, 0.5)',   // Blue (border)
    'rgba(16, 185, 129, 0.5)',   // Green (border)
    'rgba(245, 158, 11, 0.5)',   // Orange (border)
  ];

  // 🔥 DATA PROCESSING - Handle different viz types
  const chartData = {
    labels: visualizations.map(v => v.label || v.protocol || v.ip || 'Unknown'),
    datasets: [{
      label: 'Packet Count',
      data: visualizations.map(v => v.value || v.count || 0),
      backgroundColor: colors.slice(0, visualizations.length),
      borderColor: colors.slice(5, 5 + visualizations.length),
      borderWidth: 2,
      tension: 0.4, // Smooth lines
    }]
  };

  // 🔥 BEAUTIFUL CHART OPTIONS
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#ffffff', // White text
          font: { size: 14 }
        }
      },
      title: {
        display: true,
        text: 'Network Traffic Analysis',
        color: '#ffffff',
        font: { size: 18, weight: 'bold' }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#3b82f6',
        borderWidth: 1,
        cornerRadius: 8
      }
    },
    scales: {
      x: {
        ticks: { color: '#d1d5db' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      },
      y: {
        ticks: { 
          color: '#d1d5db',
          callback: function(value) {
            return value.toLocaleString(); // 1,000 format
          }
        },
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        beginAtZero: true
      }
    },
    // 🔥 DARK THEME
    backgroundColor: 'rgba(31, 41, 55, 0.8)',
  };

  const renderChart = () => {
    switch (graphType) {
      case 'bar':
        return (
          <Bar 
            data={chartData} 
            options={{ ...options, indexAxis: 'x' }} 
            height={400}
          />
        );
      case 'line':
        return (
          <Line 
            data={chartData} 
            options={options} 
            height={400}
          />
        );
      case 'pie':
        return (
          <Pie 
            data={chartData} 
            options={{
              ...options,
              plugins: {
                ...options.plugins,
                legend: { position: 'right' }
              }
            }} 
            height={400}
          />
        );
      default:
        return <Bar data={chartData} options={options} height={400} />;
    }
  };

  return (
    <div className="mt-8 chart-container bg-gray-800 rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-white">📊 Network Visualizations</h3>
        <select
          value={graphType}
          onChange={(e) => setGraphType(e.target.value)}
          className="chart-switch bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
        >
          <option value="bar">📈 Bar Chart</option>
          <option value="line">📉 Line Chart</option>
          <option value="pie">🥧 Pie Chart</option>
        </select>
      </div>
      
      {/* 🔥 RESPONSIVE CHART CONTAINER */}
      <div className="relative h-96 w-full">
        {renderChart()}
      </div>
      
      <div className="mt-4 text-center text-gray-400">
        Total packets analyzed: {visualizations.reduce((sum, v) => sum + (v.value || v.count || 0), 0).toLocaleString()}
      </div>
    </div>
  );
}
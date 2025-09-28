import { useState, useEffect, useRef, useContext, createContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Component } from 'react';
import { saveAs } from 'file-saver';
import ReactMarkdown from 'react-markdown';
import networkAnalyzerImage from '../assets/images/network-analyzer.png';
import './Homepage.css';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

// Theme Context for Dark/Light Mode
const ThemeContext = createContext();

// ThemeProvider Component
function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('dark');

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Error Boundary Component
class ErrorBoundary extends Component {
  state = { hasError: false, error: null, errorInfo: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-900 text-white p-6 text-center">
          <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
          <p className="text-gray-400">Error: {this.state.error?.message || 'Unknown error'}</p>
          <pre className="text-gray-400 text-sm">{this.state.errorInfo?.componentStack}</pre>
          <button
            onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-300 hover:scale-105"
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// UploadSection Component
function UploadSection({ file, setFile, loading, error, setError, uploadProgress, handleAnalyzePcap, fileInputRef }) {
  const [inputBorder, setInputBorder] = useState('border-blue-400');
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    const maxSize = 100 * 1024 * 1024; // 100MB limit
    if (selectedFile) {
      const fileExtension = selectedFile.name.split('.').pop().toLowerCase();
      if (!['pcap', 'pcapng'].includes(fileExtension)) {
        setError('Invalid file format. Please select a .pcap or .pcapng file.');
        setInputBorder('border-red-500');
        setFile(null);
        return;
      }
      if (selectedFile.size > maxSize) {
        setError('File size exceeds 100MB limit. Please select a smaller file.');
        setInputBorder('border-red-500');
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError(null);
      setInputBorder('border-blue-400');
      console.log('File selected:', selectedFile.name);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragOver(false);
    if (loading) return;
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const mockEvent = { target: { files: files } };
      handleFileChange(mockEvent);
    }
  };

  const dropZoneClasses = `border-2 border-dashed ${inputBorder} p-10 text-center transition duration-300 ease-in-out ${isDragOver ? 'bg-gray-700 drop-zone drag-over border-blue-500' : ''}`;

  return (
    <section id="home" className="bg-gray-800 p-8 rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-3xl font-bold">Upload PCAP File</h2>
      </div>
      <div
        className={dropZoneClasses}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".pcap,.pcapng"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          onClick={() => {
            if (fileInputRef.current && !loading) {
              fileInputRef.current.click();
              console.log('File browser triggered');
            }
          }}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-500 mb-4 custom-browse-button transition duration-300 hover:scale-105"
        >
          Browse Files
        </button>
        <p className="mt-4 text-gray-400">or drag and drop your .cap, .pcap file here</p>
        {file && (
          <div className="mt-4 text-center">
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div>
                <p>Uploading: {file.name} ({uploadProgress}%)</p>
                <div className="w-full bg-gray-600 rounded mt-2 relative overflow-hidden progress-bar">
                  <div
                    className="bg-blue-400 h-2 rounded transition-width duration-300 ease-in-out"
                    style={{ width: `${uploadProgress}%` }}
                  >
                    <span className="absolute inset-0 flex items-center justify-center text-xs text-white">
                      {uploadProgress}%
                    </span>
                  </div>
                </div>
              </div>
            )}
            {(uploadProgress === 100 && !loading) && (
              <button
                onClick={handleAnalyzePcap}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 mt-4 custom-analyze-button transition duration-300 hover:scale-105"
              >
                Analyze PCAP
              </button>
            )}
            {(loading && uploadProgress === 100) && (
              <button
                disabled
                className="bg-blue-600 text-white px-6 py-3 rounded-lg mt-4 custom-analyze-button animate-pulse flex items-center justify-center mx-auto space-x-2"
              >
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Analyzing...</span>
              </button>
            )}
          </div>
        )}
        {error && <p className="mt-4 text-red-400">{error}</p>}
      </div>
    </section>
  );
}

// AnalysisTable Component
function AnalysisTable({ analysisResults, loading, currentPage, setCurrentPage, resultsPerPage, searchTerm, setSearchTerm }) {
  const filteredResults = analysisResults.filter((row) =>
    Object.values(row).some((value) =>
      String(value || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
  );
  const indexOfLastResult = currentPage * resultsPerPage;
  const indexOfFirstResult = indexOfLastResult - resultsPerPage;
  const currentResults = filteredResults.slice(indexOfFirstResult, indexOfLastResult);
  const totalPages = Math.ceil(filteredResults.length / resultsPerPage) || 1;

  console.log('Analysis Results:', analysisResults);
  console.log('Filtered Results:', filteredResults);
  console.log('Current Results:', currentResults);
  console.log('Current Page:', currentPage, 'Total Pages:', totalPages);

  const nextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  return (
    <section id="analysis" className="mt-6 bg-gray-800 p-6 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Analysis Results</h2>
        <input
          type="text"
          placeholder="Search by IP, Protocol, Port..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-gray-700 text-white p-2 rounded w-1/3 transition duration-300 focus:ring-2 focus:ring-blue-500 search-input"
        />
      </div>
      {loading ? (
        <p className="text-center text-gray-400">Loading...</p>
      ) : analysisResults.length > 0 ? (
        filteredResults.length > 0 ? (
          <div>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-gray-800 border border-gray-600">
                <thead>
                  <tr className="bg-gray-700">
                    <th className="border-b border-gray-600 px-4 py-2 text-left text-white">No.</th>
                    <th className="border-b border-gray-600 px-4 py-2 text-left text-white">Source IP</th>
                    <th className="border-b border-gray-600 px-4 py-2 text-left text-white">Destination IP</th>
                    <th className="border-b border-gray-600 px-4 py-2 text-left text-white">Protocol</th>
                    <th className="border-b border-gray-600 px-4 py-2 text-left text-white">Size (Bytes)</th>
                    <th className="border-b border-gray-600 px-4 py-2 text-left text-white">Source Port</th>
                    <th className="border-b border-gray-600 px-4 py-2 text-left text-white">Destination Port</th>
                    <th className="border-b border-gray-600 px-4 py-2 text-left text-white">TCP Flags</th>
                  </tr>
                </thead>
                <tbody>
                  {currentResults.map((row, index) => (
                    <tr key={index} className="bg-gray-900 animate-row">
                      <td className="border-b border-gray-600 px-4 py-2 text-white">{indexOfFirstResult + index + 1}</td>
                      <td className="border-b border-gray-600 px-4 py-2 text-white">{row.src_ip || '-'}</td>
                      <td className="border-b border-gray-600 px-4 py-2 text-white">{row.dst_ip || '-'}</td>
                      <td className="border-b border-gray-600 px-4 py-2 text-white">{row.protocol || '-'}</td>
                      <td className="border-b border-gray-600 px-4 py-2 text-white">{row.size || '-'}</td>
                      <td className="border-b border-gray-600 px-4 py-2 text-white">{row.src_port || '-'}</td>
                      <td className="border-b border-gray-600 px-4 py-2 text-left text-white">{row.dst_port || '-'}</td>
                      <td className="border-b border-gray-600 px-4 py-2 text-left text-white">{row.tcp_flags || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-center mt-4 space-x-2">
              <button
                onClick={prevPage}
                disabled={currentPage === 1}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-500 transition duration-300 hover:scale-105 pagination-button"
              >
                Previous
              </button>
              <span className="px-4 py-2">Page {currentPage} of {totalPages}</span>
              <button
                onClick={nextPage}
                disabled={currentPage === totalPages}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-500 transition duration-300 hover:scale-105 pagination-button"
              >
                Next
              </button>
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-400">No results match the search term.</p>
        )
      ) : (
        <p className="text-center text-gray-400">Upload a valid PCAP file to see results.</p>
      )}
    </section>
  );
}

// VisualizationSection Component
function VisualizationSection({ visualizations, loading, graphType, setGraphType, graphOptions, setGraphOptions }) {
  console.log('Visualizations:', visualizations); // Debug visualizations

  return (
    <section id="visualizations" className="mt-6 bg-gray-800 p-6 rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Visualizations</h2>
      {loading && <p className="text-center">Generating visualizations...</p>}
      {visualizations.length > 0 ? (
        <div>
          <div className="flex space-x-4 mb-4">
            <select
              value={graphType}
              onChange={(e) => setGraphType(e.target.value)}
              className="bg-gray-700 text-white p-2 rounded transition duration-300 hover:ring-2 hover:ring-blue-500"
            >
              <option value="bar">Bar</option>
              <option value="line">Line</option>
              <option value="pie">Pie</option>
            </select>
            <input
              type="color"
              value={graphOptions.barColor}
              onChange={(e) => setGraphOptions({ ...graphOptions, barColor: e.target.value })}
              className="p-1 rounded cursor-pointer"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {visualizations.map((viz) => (
              <div key={viz.id} className="bg-gray-700 p-4 rounded-lg shadow relative chart-container" style={{ height: '400px' }}>
                <h3 className="text-lg font-semibold mb-2">{viz.title}</h3>
                <div key={graphType} className="chart-switch" style={{ position: 'relative', height: '300px' }}>
                  {!viz.chart || !viz.chart.data ? (
                    <p className="text-center text-gray-400">No valid chart data available.</p>
                  ) : graphType === 'bar' ? (
                    <Bar
                      data={{
                        labels: viz.chart.data.labels || ['TCP', 'UDP', 'ICMP'],
                        datasets: [{
                          label: viz.chart.data.datasets?.[0]?.label || 'Protocol Distribution',
                          data: viz.chart.data.datasets?.[0]?.data || [50, 30, 20],
                          backgroundColor: graphOptions.barColor || '#10b981',
                          borderColor: graphOptions.borderColor || '#047857',
                          borderWidth: 1,
                        }],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { labels: { color: 'white' } },
                          title: { display: true, text: viz.title || 'Packet Distribution', color: 'white', font: { size: 16 } },
                        },
                        scales: {
                          x: { ticks: { color: 'white', font: { size: 12 } }, grid: { color: 'rgba(255, 255, 255, 0.1)' } },
                          y: { ticks: { color: 'white', font: { size: 12 }, beginAtZero: true }, grid: { color: 'rgba(255, 255, 255, 0.1)' } },
                        },
                      }}
                      height={300}
                    />
                  ) : graphType === 'line' ? (
                    <Line
                      data={{
                        labels: viz.chart.data.labels || ['TCP', 'UDP', 'ICMP'],
                        datasets: [{
                          label: viz.chart.data.datasets?.[0]?.label || 'Protocol Distribution',
                          data: viz.chart.data.datasets?.[0]?.data || [50, 30, 20],
                          backgroundColor: graphOptions.barColor || '#10b981',
                          borderColor: graphOptions.borderColor || '#047857',
                          borderWidth: 1,
                        }],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { labels: { color: 'white' } },
                          title: { display: true, text: viz.title || 'Packet Distribution', color: 'white', font: { size: 16 } },
                        },
                        scales: {
                          x: { ticks: { color: 'white' } },
                          y: { ticks: { color: 'white', beginAtZero: true } },
                        },
                      }}
                    />
                  ) : graphType === 'pie' ? (
                    <Pie
                      data={{
                        labels: viz.chart.data.labels || ['TCP', 'UDP', 'ICMP'],
                        datasets: [{
                          data: viz.chart.data.datasets?.[0]?.data || [50, 30, 20],
                          backgroundColor: [graphOptions.barColor || '#10b981', '#ef4444', '#fbbf24', '#3b82f6', '#facc15'],
                        }],
                      }}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: { labels: { color: 'white' } },
                          title: { display: true, text: viz.title || 'Packet Distribution', color: 'white' },
                        },
                      }}
                    />
                  ) : (
                    <p className="text-center text-gray-400">Invalid graph type selected.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        !loading && <p className="text-center text-gray-400">Visualizations will appear here after analysis.</p>
      )}
    </section>
  );
}

// RecentlyUploaded Component
function RecentlyUploaded() {
  return (
    <div className="mt-6 bg-gray-800 p-4 rounded-lg">
      <h3 className="text-xl font-semibold mb-2">Recently Uploaded</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {['catburk_traffic_dump.pcap', 'network_traffic_dump.cap', 'capture_traffic_dump.cap'].map((file, index) => (
          <div key={file} className="bg-gray-700 p-2 rounded transform transition duration-300 hover:bg-gray-600 hover:scale-[1.03] recent-card" style={{ '--index': index }}>
            <p className="text-sm">{file}</p>
            <p className="text-xs text-gray-400">Last upload: 2025-09-24 21:{58 - index}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// AboutSection Component
function AboutSection() {
  const upperContent = `
# About PCAP Data Analyzer

The **PCAP Data Analyzer** is a powerful web-based tool designed to simplify network traffic analysis. Built with React and Chart.js, this application allows users to upload PCAP or PCAPNG files, analyze network packets, and visualize key insights through interactive charts. Whether you're a network administrator, cybersecurity professional, or researcher, this tool provides a user-friendly interface to explore bandwidth usage, protocol distribution, and packet details.

## Key Features
- **File Upload & Validation**: Seamlessly upload PCAP/PCAPNG files with a drag-and-drop interface, supporting files up to 100MB with real-time validation for format and size.
- **Detailed Analysis**: View comprehensive packet data, including source/destination IPs, protocols, ports, and TCP flags, presented in a searchable, paginated table.
- **Interactive Visualizations**: Generate dynamic bar, line, or pie charts to visualize protocol distribution and network trends, with customizable colors for enhanced clarity.
- **Data Export**: Export analysis results as CSV or JSON files for further processing or reporting.
- **Responsive Design**: Optimized for both desktop and mobile devices, with a sleek dark/light mode interface (toggle currently disabled for simplicity).
- **Error Handling**: Robust error boundaries ensure a smooth experience, with clear feedback for invalid files or server issues.
`;

  const lowerContent = `
## Purpose
The PCAP Data Analyzer aims to make network traffic analysis accessible and efficient. By providing detailed packet insights and intuitive visualizations, it empowers users to identify patterns, troubleshoot network issues, and enhance security monitoring without complex setup or external tools.

## Technology Stack
- **Frontend**: React, Chart.js, Tailwind CSS
- **Backend Integration**: REST API for PCAP processing (assumes a backend server at \`localhost:5000/analyze\`)
- **File Handling**: FileSaver.js for exporting results
- **Styling**: Custom CSS with animations for a modern, engaging user experience

## Future Enhancements
We plan to expand the tool with real-time analysis, advanced filtering options, and support for additional file formats. Stay tuned for updates as we continue to improve the PCAP Data Analyzer!

*Developed with ❤️ by the network analysis community for the network analysis community.*
`;

  return (
    <section id="about" className="mt-6 bg-gray-800 p-6 rounded-lg">
      <h2 className="text-2xl font-bold mb-4">About</h2>
      <div className="text-gray-400 prose prose-invert max-w-none">
        <ReactMarkdown>{upperContent}</ReactMarkdown>
        <div className="flex justify-center my-4">
          <img
            src={networkAnalyzerImage}
            alt="PCAP Data Analyzer"
            className="w-1/2 md:w-1/3 rounded-lg shadow-lg about-image"
          />
        </div>
        <ReactMarkdown>{lowerContent}</ReactMarkdown>
      </div>
    </section>
  );
}

// Footer Component
function Footer() {
  return (
    <footer className="mt-6 bg-gray-800 p-4 text-center text-gray-400">
      <p>© 2025 Network Traffic Analyzer</p>
    </footer>
  );
}

// MainContent Component to use ThemeContext
function MainContent() {
  const [file, setFile] = useState(null);
  const [analysisResults, setAnalysisResults] = useState([]);
  const [visualizations, setVisualizations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [graphType, setGraphType] = useState('bar');
  const [graphOptions, setGraphOptions] = useState({ barColor: '#10b981', borderColor: '#047857' });
  const [showConfirmation, setShowConfirmation] = useState(false);
  const fileInputRef = useRef(null);
  const location = useLocation();
  const { theme } = useContext(ThemeContext);
  const rootClass = theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900';
  const resultsPerPage = 10;

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const sectionMap = {
      '/': 'home',
      '/about': 'about',
      '/analysis': 'analysis',
      '/visualizations': 'visualizations',
    };
    const sectionId = sectionMap[location.pathname];
    if (sectionId) {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [location.pathname]);

  useEffect(() => {
    let timer;
    if (file && uploadProgress < 100) {
      console.log('Starting upload simulation for:', file.name);
      setLoading(true);
      timer = setInterval(() => {
        setUploadProgress((prev) => {
          const newProgress = prev + 10;
          if (newProgress >= 100) {
            clearInterval(timer);
            setLoading(false);
            return 100;
          }
          return newProgress;
        });
      }, 500);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [file]);

  useEffect(() => {
    setCurrentPage(1); // Reset page when analysisResults change
  }, [analysisResults]);

  const handleAnalyzePcap = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setAnalysisResults([]);
    setVisualizations([]);
    setSearchTerm(''); // Reset search term
    setCurrentPage(1); // Reset pagination
    console.log('Starting PCAP analysis for:', file.name);

    const formData = new FormData();
    formData.append('pcap_file', file);

    try {
      console.log('Sending request to:', `${apiUrl}/analyze`);
      const response = await fetch(`${apiUrl}/analyze`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Analysis failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response:', data);
      console.log('Analysis Results:', data.analysis_results);

      if (!data.analysis_results || !Array.isArray(data.analysis_results)) {
        throw new Error('Invalid analysis results received from server');
      }

      setAnalysisResults(data.analysis_results);
      setVisualizations(data.visualizations || []); // Ensure visualizations is an array
      setCurrentPage(1);
      const analysisSection = document.getElementById('analysis');
      if (analysisSection) {
        analysisSection.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (e) {
      const errorMessage = e.message.includes('Failed to fetch')
        ? 'Unable to connect to the backend. Please ensure the server is running on ' + apiUrl + '. Click retry to try again.'
        : `Failed to analyze PCAP: ${e.message}. Click retry to try again.`;
      setError(errorMessage);
      console.error('Error during analysis:', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    handleAnalyzePcap();
  };

  const exportToCSV = () => {
    const headers = ['src_ip,dst_ip,protocol,size,src_port,dst_port,tcp_flags'];
    const rows = analysisResults.map(row =>
      `${row.src_ip || ''},${row.dst_ip || ''},${row.protocol || ''},${row.size || ''},${row.src_port || ''},${row.dst_port || ''},${row.tcp_flags || ''}`
    );
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'analysis_results.csv');
  };

  const exportToJSON = () => {
    const json = JSON.stringify(analysisResults, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    saveAs(blob, 'analysis_results.json');
  };

  const handleDeleteData = () => {
    setShowConfirmation(true);
  };

  const confirmDelete = () => {
    setAnalysisResults([]);
    setVisualizations([]);
    setFile(null);
    setUploadProgress(0);
    setShowConfirmation(false);
  };

  return (
    <div className={`${rootClass} min-h-screen flex`}>
      <nav className="w-64 bg-gray-800 p-4">
        <div className="text-2xl font-bold mb-6 flex items-center">
          <span className="text-blue-400 mr-2">⚙️</span> PCAP Data Analyzer
        </div>
        <ul className="space-y-2">
          <li>
            <Link to="/" className="block p-2 hover:bg-blue-600 rounded transition duration-300 hover:translate-x-1">Home</Link>
          </li>
          <li>
            <Link to="/analysis" className="block p-2 hover:bg-blue-600 rounded transition duration-300 hover:translate-x-1">Analysis</Link>
          </li>
          <li>
            <Link to="/about" className="block p-2 hover:bg-blue-600 rounded transition duration-300 hover:translate-x-1">About</Link>
          </li>
        </ul>
      </nav>
      <div className="flex-1 p-6">
        <UploadSection
          file={file}
          setFile={setFile}
          loading={loading}
          error={error}
          setError={setError}
          uploadProgress={uploadProgress}
          handleAnalyzePcap={handleAnalyzePcap}
          fileInputRef={fileInputRef}
        />
        <RecentlyUploaded />
        <AnalysisTable
          analysisResults={analysisResults}
          loading={loading}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          resultsPerPage={resultsPerPage}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />
        {analysisResults.length > 0 && (
          <div className="ml-4 mt-2 flex space-x-2">
            <button
              onClick={exportToCSV}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-300 hover:scale-105 export-csv-button"
            >
              Export CSV
            </button>
            <button
              onClick={exportToJSON}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-300 hover:scale-105 export-json-button"
            >
              Export JSON
            </button>
          </div>
        )}
        <VisualizationSection
          visualizations={visualizations}
          loading={loading}
          graphType={graphType}
          setGraphType={setGraphType}
          graphOptions={graphOptions}
          setGraphOptions={setGraphOptions}
        />
        {analysisResults.length > 0 && (
          <div className="ml-4 mt-4">
            <button
              onClick={handleDeleteData}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-300 hover:scale-105 delete-analysis-button"
            >
              Delete Analysis Data
            </button>
          </div>
        )}
        <AboutSection />
        <Footer />
        {showConfirmation && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-gray-800 p-6 rounded-lg shadow-2xl modal">
              <p className="mb-4">Are you sure you want to delete the analysis data?</p>
              <button
                onClick={confirmDelete}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 mr-2 transition duration-300 hover:scale-105 confirm-yes-button"
              >
                Yes
              </button>
              <button
                onClick={() => setShowConfirmation(false)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-300 hover:scale-105 confirm-no-button"
              >
                No
              </button>
            </div>
          </div>
        )}
        {error && (
          <div className="mt-4 text-center">
            <p className="text-red-400">{error}</p>
            <button
              onClick={handleRetry}
              className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-300 hover:scale-105"
            >
              Retry Analysis
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Homepage Component
function Homepage() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <MainContent />
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default Homepage;
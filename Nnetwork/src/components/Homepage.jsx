import { useState, useEffect, useRef, useContext, createContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Component } from 'react'; // For ErrorBoundary
import { saveAs } from 'file-saver'; // For file and image download

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

// Theme Context for Dark/Light Mode
const ThemeContext = createContext();

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('dark');

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Error Boundary Component
class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-900 text-white p-6 text-center">
          <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
          <p className="text-gray-400">Error: {this.state.error.message}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
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
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [inputBorder, setInputBorder] = useState('border-blue-400');

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    const maxSize = 100 * 1024 * 1024; // 100MB limit
    if (selectedFile) {
      if (!['pcap', 'pcapng'].includes(selectedFile.name.split('.').pop().toLowerCase())) {
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

  return (
    <section id="home" className="bg-gray-800 p-8 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Upload PCAP File</h2>
        <button
          onClick={toggleTheme}
          className="bg-transparent text-white p-1 rounded-lg hover:bg-blue-700"
          style={{ fontSize: '1.2em' }}
        >
          {theme === 'dark' ? '🌙' : '☀️'}
        </button>
      </div>
      <div className={`border-2 border-dashed ${inputBorder} p-10 text-center`}>
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
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-500 mb-4 custom-browse-button"
          style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
        >
          Browse Files
        </button>
        <p className="mt-4 text-gray-400">or drag and drop your .cap, .pcap file here</p>
        {file && (
          <div className="mt-4 text-center">
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div>
                <p>Uploading: {file.name} ({uploadProgress}%)</p>
                <div className="w-full bg-gray-600 rounded mt-2 relative overflow-hidden transition-all duration-500 ease-in-out">
                  <div
                    className="bg-blue-400 h-2 rounded transition-width duration-500 ease-in-out"
                    style={{ width: `${uploadProgress}%` }}
                  >
                    <span className="absolute inset-0 flex items-center justify-center text-xs text-white">
                      {uploadProgress}%
                    </span>
                  </div>
                </div>
              </div>
            )}
            {uploadProgress === 100 && !loading && (
              <button
                onClick={handleAnalyzePcap}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 mt-4 custom-analyze-button"
                style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
              >
                Analyze PCAP
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
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );
  const indexOfLastResult = currentPage * resultsPerPage;
  const indexOfFirstResult = indexOfLastResult - resultsPerPage;
  const currentResults = filteredResults.slice(indexOfFirstResult, indexOfLastResult);
  const totalPages = Math.ceil(filteredResults.length / resultsPerPage);

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
          className="bg-gray-700 text-white p-2 rounded w-1/3"
        />
      </div>
      {loading && <p className="text-center">Loading...</p>}
      {analysisResults.length > 0 ? (
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
                  <tr key={index} className="bg-gray-900 hover:bg-gray-700">
                    <td className="border-b border-gray-600 px-4 py-2 text-white">{indexOfFirstResult + index + 1}</td>
                    <td className="border-b border-gray-600 px-4 py-2 text-white">{row.src_ip || '-'}</td>
                    <td className="border-b border-gray-600 px-4 py-2 text-white">{row.dst_ip || '-'}</td>
                    <td className="border-b border-gray-600 px-4 py-2 text-white">{row.protocol || '-'}</td>
                    <td className="border-b border-gray-600 px-4 py-2 text-white">{row.size !== null ? row.size : '-'}</td>
                    <td className="border-b border-gray-600 px-4 py-2 text-white">{row.src_port !== null ? row.src_port : '-'}</td>
                    <td className="border-b border-gray-600 px-4 py-2 text-white">{row.dst_port !== null ? row.dst_port : '-'}</td>
                    <td className="border-b border-gray-600 px-4 py-2 text-white">{row.tcp_flags || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-center mt-4 space-x-2">
            <button
              onClick={prevPage}
              disabled={currentPage === 1}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-500"
              style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
            >
              Previous
            </button>
            <span className="px-4 py-2">Page {currentPage} of {totalPages}</span>
            <button
              onClick={nextPage}
              disabled={currentPage === totalPages}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-500"
              style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
            >
              Next
            </button>
          </div>
        </div>
      ) : (
        !loading && <p className="text-center text-gray-400">Upload a valid PCAP file to see results.</p>
      )}
    </section>
  );
}

// VisualizationSection Component
function VisualizationSection({ visualizations, loading, graphType, setGraphType, graphOptions, setGraphOptions }) {
  const downloadGraphImage = (chartRef, title) => {
    const link = document.createElement('a');
    link.download = `${title}.png`;
    link.href = chartRef.toBase64Image();
    link.click();
  };

  return (
    <section id="visualizations" className="mt-6 bg-gray-800 p-6 rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Visualizations</h2>
      {loading && <p className="text-center">Generating visualizations...</p>}
      {visualizations.length > 0 ? (
        <div>
          {/* Customizable Options */}
          <div className="flex space-x-4 mb-4">
            <select
              value={graphType}
              onChange={(e) => setGraphType(e.target.value)}
              className="bg-gray-700 text-white p-2 rounded"
            >
              <option value="bar">Bar</option>
              <option value="line">Line</option>
              <option value="pie">Pie</option>
            </select>
            {/* Basic customization, e.g., color picker for bars */}
            <input
              type="color"
              value={graphOptions.barColor}
              onChange={(e) => setGraphOptions({ ...graphOptions, barColor: e.target.value })}
              className="p-1 rounded"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {visualizations.map((viz) => (
              <div key={viz.id} className="bg-gray-700 p-4 rounded-lg shadow relative" style={{ height: '400px' }}>
                <h3 className="text-lg font-semibold mb-2">{viz.title}</h3>
                <div style={{ position: 'relative', height: '300px' }}>
                  {graphType === 'bar' ? (
                    <Bar
                      ref={(ref) => { if (ref) viz.chartRef = ref.chartInstance; }}
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
                      ref={(ref) => { if (ref) viz.chartRef = ref.chartInstance; }}
                      data={viz.chart.data}
                      options={{
                        ...viz.chart.options,
                        plugins: {
                          legend: { labels: { color: 'white' } },
                          title: { color: 'white' },
                        },
                        scales: {
                          x: { ticks: { color: 'white' } },
                          y: { ticks: { color: 'white' } },
                        },
                      }}
                    />
                  ) : graphType === 'pie' ? (
                    <Pie
                      ref={(ref) => { if (ref) viz.chartRef = ref.chartInstance; }}
                      data={{
                        labels: viz.chart.data.labels || ['TCP', 'UDP', 'ICMP'],
                        datasets: [{
                          data: viz.chart.data.datasets?.[0]?.data || [50, 30, 20],
                          backgroundColor: [graphOptions.barColor || '#10b981', '#ef4444', '#fbbf24'],
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
                  ) : null}
                </div>
                <button
                  onClick={() => downloadGraphImage(viz.chartRef, viz.title)}
                  className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                >
                  Download Image
                </button>
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
        <div className="bg-gray-700 p-2 rounded">
          <p className="text-sm">catburk_traffic_dump.pcap</p>
          <p className="text-xs text-gray-400">Last upload: 2025-09-24 22:00</p>
        </div>
        <div className="bg-gray-700 p-2 rounded">
          <p className="text-sm">network_traffic_dump.cap</p>
          <p className="text-xs text-gray-400">Last upload: 2025-09-24 21:58</p>
        </div>
        <div className="bg-gray-700 p-2 rounded">
          <p className="text-sm">capture_traffic_dump.cap</p>
          <p className="text-xs text-gray-400">Last upload: 2025-09-24 21:55</p>
        </div>
      </div>
    </div>
  );
}

// AboutSection Component
function AboutSection() {
  return (
    <section id="about" className="mt-6 bg-gray-800 p-6 rounded-lg">
      <h2 className="text-2xl font-bold mb-4">About</h2>
      <p className="text-gray-400">
        Analyze network traffic from PCAP files to gain insights into bandwidth usage and protocol distribution.
      </p>
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

function Homepage() {
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
  const { theme, toggleTheme } = useContext(ThemeContext);
  const rootClass = theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900';
  const resultsPerPage = 10;

  // API URL from environment variable
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
          console.log('Progress updated to:', newProgress);
          if (newProgress >= 100) {
            clearInterval(timer);
            setLoading(false);
            console.log('Upload completed at 100%');
            return 100;
          }
          return newProgress;
        });
      }, 500);
    }
    return () => {
      if (timer) clearInterval(timer);
      console.log('Effect cleanup, progress:', uploadProgress);
    };
  }, [file]);

  const handleAnalyzePcap = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setAnalysisResults([]);
    setVisualizations([]);
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
        const errorMessage = errorData.error || `Analysis failed with status ${response.status}`;
        console.error('Analysis failed:', errorMessage);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Received response:', data);

      if (!data.analysis_results || !Array.isArray(data.analysis_results)) {
        throw new Error('Invalid analysis results received from server');
      }
      if (!data.visualizations || !Array.isArray(data.visualizations)) {
        throw new Error('Invalid visualizations received from server');
      }

      setAnalysisResults(data.analysis_results);
      setVisualizations(data.visualizations);

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
      console.log('Analysis complete, loading state:', false);
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

  const filteredResults = analysisResults.filter((row) =>
    Object.values(row).some((value) =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const indexOfLastResult = currentPage * resultsPerPage;
  const indexOfFirstResult = indexOfLastResult - resultsPerPage;
  const currentResults = filteredResults.slice(indexOfFirstResult, indexOfLastResult);
  const totalPages = Math.ceil(filteredResults.length / resultsPerPage);

  const nextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

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
    <ErrorBoundary>
      <div className={`${rootClass} min-h-screen flex`}>
        {/* Sidebar Navigation */}
        <nav className="w-64 bg-gray-800 p-4">
          <div className="text-2xl font-bold mb-6 flex items-center">
            <span className="text-blue-400 mr-2">⚙️</span> PCAP Data Analyzer
          </div>
          <ul className="space-y-2">
            <li>
              <Link to="/" className="block p-2 hover:bg-blue-600 rounded">Dashboard</Link>
            </li>
            <li>
              <Link to="/analysis" className="block p-2 hover:bg-blue-600 rounded">Analysis</Link>
            </li>
            <li>
              <Link to="/reports" className="block p-2 hover:bg-blue-600 rounded">Reports</Link>
            </li>
            <li>
              <Link to="/settings" className="block p-2 hover:bg-blue-600 rounded">Settings</Link>
            </li>
          </ul>
        </nav>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Upload Section */}
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

          {/* Recently Uploaded */}
          <RecentlyUploaded />

          {/* Analysis Results */}
          <AnalysisTable
            analysisResults={filteredResults}
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
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
              >
                Export CSV
              </button>
              <button
                onClick={exportToJSON}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
              >
                Export JSON
              </button>
            </div>
          )}

          {/* Visualizations */}
          <VisualizationSection
            visualizations={visualizations}
            loading={loading}
            graphType={graphType}
            setGraphType={setGraphType}
            graphOptions={graphOptions}
            setGraphOptions={setGraphOptions}
          />

          {/* Data Privacy Delete Button */}
          {analysisResults.length > 0 && (
            <div className="ml-4 mt-4">
              <button
                onClick={handleDeleteData}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
              >
                Delete Analysis Data
              </button>
            </div>
          )}

          {/* About */}
          <AboutSection />

          {/* Footer */}
          <Footer />

          {/* Confirmation Dialog */}
          {showConfirmation && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-gray-800 p-6 rounded-lg">
                <p className="mb-4">Are you sure you want to delete the analysis data?</p>
                <button
                  onClick={confirmDelete}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 mr-2"
                  style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                >
                  Yes
                </button>
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                >
                  No
                </button>
              </div>
            </div>
          )}

          {/* Retry Button for Errors */}
          {error && (
            <div className="mt-4 text-center">
              <p className="text-red-400">{error}</p>
              <button
                onClick={handleRetry}
                className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
              >
                Retry Analysis
              </button>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <Homepage />
    </ThemeProvider>
  );
}
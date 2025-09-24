import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';
import { Component } from 'react'; // For ErrorBoundary

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

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

function Homepage() {
  const [file, setFile] = useState(null);
  const [analysisResults, setAnalysisResults] = useState([]);
  const [visualizations, setVisualizations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0); // Track upload progress
  const [currentPage, setCurrentPage] = useState(1); // Track current page for pagination
  const resultsPerPage = 10; // Show 10 results per page
  const location = useLocation();
  const fileInputRef = useRef(null);

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
      }, 500); // Increment every 0.5 seconds
    }
    return () => {
      if (timer) clearInterval(timer); // Cleanup timer
      console.log('Effect cleanup, progress:', uploadProgress);
    };
  }, [file]); // Only trigger on file change

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && ['pcap', 'pcapng'].includes(selectedFile.name.split('.').pop().toLowerCase())) {
      setFile(selectedFile);
      setError(null);
      setAnalysisResults([]);
      setVisualizations([]);
      setUploadProgress(0); // Reset on new file
      setCurrentPage(1); // Reset to first page
      console.log('File selected:', selectedFile.name);
    } else {
      setError('Please select a valid .pcap or .pcapng file');
      setFile(null);
      console.error('Invalid file selected:', selectedFile ? selectedFile.name : 'No file');
    }
  };

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
        ? 'Unable to connect to the backend. Please ensure the server is running on ' + apiUrl
        : `Failed to analyze PCAP: ${e.message}`;
      setError(errorMessage);
      console.error('Error during analysis:', errorMessage);
    } finally {
      setLoading(false);
      console.log('Analysis complete, loading state:', false);
    }
  };

  // Pagination logic
  const indexOfLastResult = currentPage * resultsPerPage;
  const indexOfFirstResult = indexOfLastResult - resultsPerPage;
  const currentResults = analysisResults.slice(indexOfFirstResult, indexOfLastResult);
  const totalPages = Math.ceil(analysisResults.length / resultsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-900 text-white flex">
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
          <section id="home" className="bg-gray-800 p-8 rounded-lg shadow-lg">
            <h2 className="text-3xl font-bold mb-6 text-center">Upload PCAP File</h2>
            <div className="border-2 border-dashed border-blue-400 p-10 text-center">
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
                style={{ backgroundColor: '#2563eb', color: '#ffffff' }} // Blue background, white text
              >
                Browse Files
              </button>
              <p className="mt-4 text-gray-400">or drag and drop your .cap, .pcap file here</p>
              {file && (
                <div className="mt-4 text-center">
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div>
                      <p>Uploading: {file.name} ({uploadProgress}%)</p>
                      <div className="w-full bg-gray-600 rounded mt-2">
                        <div
                          className="bg-blue-400 h-2 rounded"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  {uploadProgress === 100 && !loading && (
                    <button
                      onClick={handleAnalyzePcap}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 mt-4 custom-analyze-button"
                      style={{ backgroundColor: '#2563eb', color: '#ffffff' }} // Match Browse Files styling
                    >
                      Analyze PCAP
                    </button>
                  )}
                </div>
              )}
              {error && <p className="mt-4 text-red-400">{error}</p>}
            </div>
          </section>

          {/* Recently Uploaded */}
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

          {/* Analysis Results */}
          <section id="analysis" className="mt-6 bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Analysis Results</h2>
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

          {/* Visualizations */}
          <section id="visualizations" className="mt-6 bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Visualizations</h2>
            {loading && <p className="text-center">Generating visualizations...</p>}
            {visualizations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {visualizations.map((viz) => (
                  <div key={viz.id} className="bg-gray-700 p-4 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-2">{viz.title}</h3>
                    {viz.chart.type === 'bar' ? (
                      <Bar
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
                    ) : viz.chart.type === 'line' ? (
                      <Line
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
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              !loading && <p className="text-center text-gray-400">Visualizations will appear here after analysis.</p>
            )}
          </section>

          {/* About */}
          <section id="about" className="mt-6 bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">About</h2>
            <p className="text-gray-400">
              Analyze network traffic from PCAP files to gain insights into bandwidth usage and protocol distribution.
            </p>
          </section>

          {/* Footer */}
          <footer className="mt-6 bg-gray-800 p-4 text-center text-gray-400">
            <p>© 2025 Network Traffic Analyzer</p>
          </footer>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default Homepage;
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

function Homepage() {
  const [file, setFile] = useState(null);
  const [analysisResults, setAnalysisResults] = useState([]);
  const [visualizations, setVisualizations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const location = useLocation();

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

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && ['pcap', 'pcapng'].includes(selectedFile.name.split('.').pop().toLowerCase())) {
      setFile(selectedFile);
      setError(null);
      setAnalysisResults([]);
      setVisualizations([]);
    } else {
      setError('Please select a valid .pcap or .pcapng file');
      setFile(null);
    }
  };

  const handleAnalyzePcap = async () => {
    if (!file) {
      setError('Please select a PCAP file first');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('pcap_file', file);

    try {
      const response = await fetch('http://localhost:5000/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const data = await response.json();
      setAnalysisResults(data.analysis_results || []);
      setVisualizations(data.visualizations || []);

      const analysisSection = document.getElementById('analysis');
      if (analysisSection) {
        analysisSection.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (e) {
      setError(`Failed to analyze PCAP: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      {/* Navigation */}
      <nav className="bg-blue-600 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Network Traffic Analyzer</h1>
          <div className="space-x-4">
            <Link to="/" className="hover:underline">Home</Link>
            <Link to="/about" className="hover:underline">About</Link>
            <Link to="/analysis" className="hover:underline">Analysis</Link>
            <Link to="/visualizations" className="hover:underline">Visualizations</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="py-16 bg-gray-200">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Network Traffic Analyzer</h2>
          <p className="text-lg mb-6">Upload a PCAP file to analyze network traffic and view results.</p>
          <div className="flex justify-center gap-4">
            <input
              type="file"
              accept=".pcap,.pcapng"
              onChange={handleFileChange}
              className="border p-2 rounded"
            />
            <button
              onClick={handleAnalyzePcap}
              disabled={!file || loading}
              className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
            >
              {loading ? 'Analyzing...' : 'Analyze PCAP'}
            </button>
          </div>
          {file && <p className="mt-4 text-sm">Selected: {file.name}</p>}
          {error && <p className="mt-4 text-red-500">{error}</p>}
        </div>
      </section>

      {/* Analysis Results */}
      <section id="analysis" className="py-16">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold mb-4 text-center">Analysis Results</h2>
          {loading && <p className="text-center">Loading...</p>}
          {analysisResults.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border">
                <thead>
                  <tr>
                    {['Source IP', 'Destination IP', 'Protocol', 'Size', 'Source Port', 'Destination Port', 'TCP Flags'].map((header) => (
                      <th key={header} className="border px-4 py-2">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {analysisResults.map((row, index) => (
                    <tr key={index}>
                      <td className="border px-4 py-2">{row.src_ip || '-'}</td>
                      <td className="border px-4 py-2">{row.dst_ip || '-'}</td>
                      <td className="border px-4 py-2">{row.protocol || '-'}</td>
                      <td className="border px-4 py-2">{row.size !== null ? row.size : '-'}</td>
                      <td className="border px-4 py-2">{row.src_port !== null ? row.src_port : '-'}</td>
                      <td className="border px-4 py-2">{row.dst_port !== null ? row.dst_port : '-'}</td>
                      <td className="border px-4 py-2">{row.tcp_flags || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            !loading && <p className="text-center text-gray-500">Upload a valid PCAP file to see results.</p>
          )}
        </div>
      </section>

      {/* Visualizations */}
      <section id="visualizations" className="py-16 bg-gray-200">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">Visualizations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {loading && <p className="text-center col-span-full">Generating visualizations...</p>}
            {visualizations.length > 0 ? (
              visualizations.map((viz) => (
                <div key={viz.id} className="bg-white p-4 rounded shadow">
                  <h3 className="text-xl font-semibold mb-4">{viz.title}</h3>
                  {viz.chart.type === 'bar' ? (
                    <Bar data={viz.chart.data} options={viz.chart.options} />
                  ) : (
                    <Line data={viz.chart.data} options={viz.chart.options} />
                  )}
                </div>
              ))
            ) : (
              !loading && <p className="text-center col-span-full text-gray-500">Visualizations will appear here after analysis.</p>
            )}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-16">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">About</h2>
          <p className="text-lg max-w-2xl mx-auto">
            Analyze network traffic from PCAP files to gain insights into bandwidth usage and protocol distribution.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-blue-600 text-white p-4 text-center">
        <p>© 2025 Network Traffic Analyzer</p>
      </footer>
    </div>
  );
}

export default Homepage;
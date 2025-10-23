import { useState, useEffect, useRef, createContext } from 'react';
import Sidebar from '../components/common/Sidebar';
import UploadSection from '../components/features/UploadSection';
import AnalysisTable from '../components/features/AnalysisTable';
import VisualizationSection from '../components/features/VisualizationSection';
import RecentlyUploaded from '../components/features/RecentlyUploaded';
import DeleteConfirmation from '../components/features/DeleteConfirmation';
import Footer from '../components/common/Footer';
import ErrorBoundary from '../components/common/ErrorBoundary';
import './Homepage.css';

export const ThemeContext = createContext();

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('dark');
  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

function MainContent() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysisResults, setAnalysisResults] = useState([]);
  const [visualizations, setVisualizations] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [resultsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [graphType, setGraphType] = useState('bar');
  const fileInputRef = useRef(null);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleAnalyzePcap = async () => {
    console.log('🔥 ANALYZE BUTTON CLICKED!');
    if (!file) return;
    
    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append('pcap_file', file);

    try {
      const response = await fetch('http://localhost:5000/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      setAnalysisResults(data.analysis_results || []);
      setVisualizations(data.visualizations || []);
      setUploadProgress(100);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['src_ip,dst_ip,protocol,size,src_port,dst_port,tcp_flags'];
    const rows = analysisResults.map(row =>
      `${row.src_ip || ''},${row.dst_ip || ''},${row.protocol || ''},${row.size || ''},${row.src_port || ''},${row.dst_port || ''},${row.tcp_flags || ''}`
    );
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'analysis_results.csv';
    a.click();
  };

  const exportToJSON = () => {
    const json = JSON.stringify(analysisResults, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'analysis_results.json';
    a.click();
  };

  const handleDeleteData = () => setShowConfirmation(true);
  const confirmDelete = () => {
    setAnalysisResults([]);
    setVisualizations([]);
    setFile(null);
    setUploadProgress(0);
    setShowConfirmation(false);
    setCurrentPage(1);
    setSearchTerm('');
  };

  const handleRetry = () => {
    setError(null);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex bg-gray-900 text-white">
      <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div className="flex-1 p-6 overflow-auto">
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
        
        {/* 🔥 SIMPLE BLUE EXPORT BUTTONS */}
        {analysisResults.length > 0 && (
          <div className="mt-4 flex space-x-2">
           <button 
  onClick={exportToJSON} 
  className="custom-browse-button bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 hover:scale-105 transition duration-300"
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
        />
        
        {/* 🔥 SIMPLE BLUE DELETE BUTTON */}
        {analysisResults.length > 0 && (
          <div className="mt-4">
            <button
              onClick={handleDeleteData}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-300 hover:scale-105"
            >
              Delete Analysis Data
            </button>
          </div>
        )}
        
        <Footer />
      </div>
      
      <DeleteConfirmation
        show={showConfirmation}
        onConfirm={confirmDelete}
        onCancel={() => setShowConfirmation(false)}
      />
      
      {error && !loading && (
        <div className="fixed top-4 right-4 bg-red-600 text-white p-4 rounded-lg">
          <p>{error}</p>
          <button onClick={handleRetry} className="mt-2 bg-white text-red-600 px-3 py-1 rounded">
            Retry
          </button>
        </div>
      )}
    </div>
  );
}

export default function Homepage() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <MainContent />
      </ErrorBoundary>
    </ThemeProvider>
  );
}
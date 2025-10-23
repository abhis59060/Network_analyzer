import { useState } from 'react';

export default function UploadSection({ 
  file, 
  setFile, 
  loading, 
  error, 
  setError, 
  uploadProgress, 
  handleAnalyzePcap, 
  fileInputRef 
}) {
  const [inputBorder, setInputBorder] = useState('border-blue-400');
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileChange = (event) => {
    console.log('🗂️ FILE INPUT CHANGED!');
    const selectedFile = event.target.files[0];
    console.log('🗂️ Selected file:', selectedFile?.name, selectedFile?.size);
    
    const maxSize = 100 * 1024 * 1024;
    if (selectedFile) {
      const fileExtension = selectedFile.name.split('.').pop().toLowerCase();
      console.log('📋 File extension:', fileExtension);
      
      if (!['pcap', 'pcapng'].includes(fileExtension)) {
        console.log('❌ INVALID FORMAT');
        setError('Invalid file format. Please select a .pcap or .pcapng file.');
        setInputBorder('border-red-500');
        setFile(null);
        return;
      }
      
      if (selectedFile.size > maxSize) {
        console.log('❌ FILE TOO BIG');
        setError('File size exceeds 100MB limit. Please select a smaller file.');
        setInputBorder('border-red-500');
        setFile(null);
        return;
      }
      
      console.log('✅ VALID FILE - setting state');
      setFile(selectedFile);
      setError(null);
      setInputBorder('border-blue-400');
    }
  };

  const handleDrop = (event) => {
    console.log('🐸 DRAG DROP!');
    event.preventDefault();
    setIsDragOver(false);
    if (loading) return;
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const mockEvent = { target: { files: files } };
      handleFileChange(mockEvent);
    }
  };

  const handleBrowseClick = () => {
    console.log('🔍 BROWSE BUTTON CLICKED');
    if (fileInputRef.current && !loading) {
      fileInputRef.current.click();
    }
  };

  const dropZoneClasses = `border-2 border-dashed ${inputBorder} p-10 text-center transition duration-300 ease-in-out ${
    isDragOver ? 'bg-gray-700 drop-zone drag-over border-blue-500' : ''
  }`;

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
          onClick={handleBrowseClick}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-500 mb-4 custom-browse-button"
        >
          Browse Files
        </button>
        <p className="mt-4 text-gray-400">or drag and drop your .cap, .pcap file here</p>
        
        {/* 🔥 FIXED: SHOW ANALYZE BUTTON WHEN FILE EXISTS */}
        {file && (
          <div className="mt-4 text-center">
            <p className="text-green-400 mb-2">✅ {file.name} selected</p>
            
            {/* Progress bar */}
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div>
                <p>Uploading: {uploadProgress}%</p>
                <div className="w-full bg-gray-600 rounded mt-2 relative overflow-hidden progress-bar">
                  <div
                    className="bg-blue-400 h-2 rounded"
                    style={{ width: `${uploadProgress}%` }}
                  >
                  </div>
                </div>
              </div>
            )}
            
            {/* ANALYZE BUTTON - ALWAYS SHOW WHEN FILE EXISTS */}
            {!loading && (
              <button
                onClick={handleAnalyzePcap}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 mt-4 custom-analyze-button transition duration-300 hover:scale-105"
              >
                🔍 Analyze PCAP
              </button>
            )}
            
            {/* LOADING SPINNER */}
            {loading && (
              <button
                disabled
                className="bg-blue-600 text-white px-6 py-3 rounded-lg mt-4 custom-analyze-button animate-pulse flex items-center justify-center mx-auto"
              >
                <svg className="animate-spin h-5 w-5 mr-2 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing...
              </button>
            )}
          </div>
        )}
        
        {error && <p className="mt-4 text-red-400">{error}</p>}
      </div>
    </section>
  );
}
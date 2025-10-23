import { useState } from 'react';

export default function AnalysisTable({
  analysisResults,
  loading,
  currentPage,
  setCurrentPage,
  resultsPerPage,
  searchTerm,
  setSearchTerm
}) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const filteredResults = analysisResults.filter(row =>
    Object.values(row).some(val =>
      val?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const indexOfLast = currentPage * resultsPerPage;
  const indexOfFirst = indexOfLast - resultsPerPage;
  const currentResults = filteredResults.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredResults.length / resultsPerPage);

  const handlePrevious = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="bg-gray-700 h-96 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          placeholder="🔍 Search packets..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-4 py-2 bg-gray-700 text-white rounded-lg w-64 border border-gray-600 focus:border-blue-500 focus:outline-none"
        />
        <p className="text-gray-400">
          Page {currentPage} of {totalPages} • {filteredResults.length} packets
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full bg-gray-700 rounded-lg">
          <thead>
            <tr className="bg-gray-600">
              {['src_ip', 'dst_ip', 'protocol', 'size', 'src_port', 'dst_port', 'tcp_flags'].map(header => (
                <th key={header} className="px-4 py-3 text-left">
                  {header.replace('_', ' ').toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentResults.map((row, index) => (
              <tr key={index} className="border-b border-gray-600 hover:bg-gray-600">
                {['src_ip', 'dst_ip', 'protocol', 'size', 'src_port', 'dst_port', 'tcp_flags'].map(field => (
                  <td key={field} className="px-4 py-3">
                    <span className="text-gray-300">{row[field] ?? 'N/A'}</span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 🔥 FIXED: SIMPLE BLUE PREVIOUS/NEXT BUTTONS */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center space-x-4">
          <button
  onClick={handlePrevious}
  disabled={currentPage === 1}
  className="custom-browse-button bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 hover:scale-105 transition duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed"
>
  Previous
</button>

          <button
  onClick={handleNext}
  disabled={currentPage === totalPages}
  className="custom-browse-button bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 hover:scale-105 transition duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed"
>
  Next
</button>
        </div>
      )}
    </div>
  );
}
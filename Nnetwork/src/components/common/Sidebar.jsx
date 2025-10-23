import { Link } from 'react-router-dom';

export default function Sidebar({ isSidebarOpen, toggleSidebar }) {
  return (
    <nav className={`p-4 transition-all duration-300 ease-in-out ${
      isSidebarOpen ? 'w-64' : 'w-20 items-center'
    } bg-gray-800 flex flex-col`}>
      {/* Header */}
      <div className={`text-2xl font-bold mb-6 flex items-center ${
        isSidebarOpen ? 'justify-between' : 'justify-center'
      } w-full`}>
        <button 
          onClick={toggleSidebar} 
          className="bg-blue-600 text-white p-2 rounded transition duration-300 hover:bg-blue-700"
          aria-label={isSidebarOpen ? "Collapse navigation" : "Expand navigation"}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-6 w-6" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor" 
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16m-7 6h7" /> 
          </svg>
        </button>
        
        {isSidebarOpen && (
          <div className="flex items-center">
            <span className="text-blue-400 mr-2">⚙️</span> 
            PCAP Data Analyzer
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <ul className="space-y-2 w-full flex-1">
        <li>
          <Link to="/" className="flex items-center p-2 hover:bg-blue-600 rounded transition duration-300 hover:translate-x-1">
            <span className={`text-xl ${isSidebarOpen ? 'mr-3' : 'mr-0'}`}>🏠</span>
            {isSidebarOpen && <span>Home</span>}
          </Link>
        </li>
        <li>
          <Link to="/analysis" className="flex items-center p-2 hover:bg-blue-600 rounded transition duration-300 hover:translate-x-1">
            <span className={`text-xl ${isSidebarOpen ? 'mr-3' : 'mr-0'}`}>📊</span>
            {isSidebarOpen && <span>Analysis</span>}
          </Link>
        </li>
        <li>
          <Link to="/about" className="flex items-center p-2 hover:bg-blue-600 rounded transition duration-300 hover:translate-x-1">
            <span className={`text-xl ${isSidebarOpen ? 'mr-3' : 'mr-0'}`}>ℹ️</span>
            {isSidebarOpen && <span>About</span>}
          </Link>
        </li>
      </ul>
    </nav>
  );
}
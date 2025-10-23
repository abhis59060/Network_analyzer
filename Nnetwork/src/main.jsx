import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import Homepage from './pages/Homepage';  // Updated path

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/analysis" element={<Homepage />} />
        <Route path="/about" element={<Homepage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
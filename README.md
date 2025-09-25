# Network Traffic Analyzer

Welcome to the **Network Traffic Analyzer**, a web-based application designed to analyze network traffic from PCAP (Packet Capture) files. This project allows users to upload `.pcap` or `.pcapng` files, visualize traffic data, and export results for further analysis. Built with React and integrated with a Python/Flask backend, it provides an intuitive interface for network administrators and security professionals.

## Table of Contents
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## Features
- **Upload and Analyze**: Upload PCAP files (up to 100MB) and analyze network traffic data.
- **Interactive Visualizations**: View traffic distributions (e.g., protocol, bandwidth) using customizable bar, line, or pie charts.
- **Search and Filter**: Search analysis results by IP address, protocol, port, or TCP flags.
- **Export Options**: Export analysis results as CSV or JSON files, and download graph images for reports.
- **Theme Toggle**: Switch between dark and light modes for better usability.
- **Data Management**: Delete analysis data with a confirmation dialog.
- **Error Handling**: Robust error boundaries to handle application failures gracefully.

## Prerequisites
- **Node.js**: v18.x or later (for the frontend).
- **Python**: v3.8 or later (for the backend).
- **npm**: v9.x or later (included with Node.js).
- **Git**: For version control and cloning the repository.

## Installation

### Clone the Repository
```bash
git clone https://github.com/your-username/Network_analyzer.git
cd Network_analyzer

Backend Setup

Navigate to the backend directory:
cd backend
Install Python dependencies:
pip install -r requirements.txt
Start the Flask server:
python app.py
Ensure the server runs on http://localhost:5000 (default).
Frontend Setup
Navigate to the frontend directory:
cd Nnetwork
Install Node.js dependencies:
npm install
Required packages: react, react-router-dom, chart.js, file-saver.
Create a .env file in the Nnetwork directory with the following:
textVITE_API_URL=http://localhost:5000
Start the development server:
npm run dev
Open http://localhost:5173 in your browser to view the app.

## Usage
- **Upload a PCAP File**:
  - Click "Browse Files" or drag and drop a `.pcap` or `.pcapng` file (max 100MB).
  - Wait for the upload to complete (simulated progress bar).
- **Analyze Traffic**:
  - Click "Analyze PCAP" to process the file. Results and visualizations will appear.
- **Explore Results**:
  - Use the table to view detailed packet information (IP, protocol, ports, etc.).
  - Search for specific data using the search bar.
- **Visualize Data**:
  - Switch between bar, line, or pie charts and customize colors.
  - Download graph images for reporting.
- **Export Data**:
  - Export analysis results as CSV or JSON files.
- **Manage Data**:
  - Delete analysis data via the "Delete Analysis Data" button with confirmation.

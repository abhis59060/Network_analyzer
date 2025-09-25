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
--git clone https://github.com/your-username/Network_analyzer.git
--cd Network_analyzer



## Usage
1. **Upload a PCAP File**:
   - Click "Browse Files" or drag/drop a `.pcap`/`.pcapng` file (max 100MB).
   - Wait for the upload (simulated progress bar).
2. **Analyze Traffic**:
   - Click "Analyze PCAP" to process; see results and visualizations.
3. **Explore Results**:
   - View packet details (IP, protocol, ports) in the table.
   - Search data using the search bar.
4. **Visualize Data**:
   - Switch between bar, line, or pie charts; customize colors.
   - Download graph images for reports.
5. **Export Data**:
   - Export results as CSV or JSON files.
6. **Manage Data**:
   - Delete data via "Delete Analysis Data" with confirmation.

## Project Structure
Network_analyzer/
│
├── Nnetwork/                    # Frontend (React with Vite)
│   ├── node_modules/           # Dependency directory
│   ├── public/                 # Static files
│   │   ├── index.html
│   │   └── favicon.ico
│   ├── src/                    # Source code
│   │   ├── components/         # Reusable components
│   │   │   ├── UploadSection.jsx
│   │   │   ├── AnalysisTable.jsx
│   │   │   ├── VisualizationSection.jsx
│   │   │   ├── RecentlyUploaded.jsx
│   │   │   ├── AboutSection.jsx
│   │   │   └── Footer.jsx
│   │   ├── App.jsx             # Main app component
│   │   ├── index.js            # Entry point
│   │   └── .env                # Environment variables
│   ├── package.json            # Frontend dependencies
│   ├── vite.config.js          # Vite configuration
│   └── README.md               # Frontend docs
│
├── backend/                     # Backend (Python/Flask)
│   ├── app.py                  # Flask server
│   ├── requirements.txt        # Python dependencies
│   └── README.md               # Backend docs
│
├── .gitignore                   # Git ignore file
└── README.md                    # Root-level project documentation

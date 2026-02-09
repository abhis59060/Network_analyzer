# 🛡️ Network Analyzer

A powerful, low-level packet sniffer and network traffic monitoring tool. This application is designed for security professionals and students to intercept, decode, and analyze network packets in real-time using Python's raw socket capabilities and the Scapy framework.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [How It Works (Deep Dive)](#how-it-works-deep-dive)
- [Installation](#installation)
- [Usage](#usage)
- [Security Considerations](#security-considerations)
- [License](#license)

## ✨ Features

- **Real-Time Packet Inspection**
  - Captures live traffic from any network interface (Ethernet, Wi-Fi).
  - Promiscuous mode support for total network visibility.

- **Protocol Decoding & Analysis**
  - **Layer 2:** Ethernet Frame analysis (MAC addresses, EtherType).
  - **Layer 3:** IPv4/IPv6 Header parsing (IP addresses, TTL, Protocol IDs).
  - **Layer 4:** Transport layer breakdown for TCP (Flags, Port mapping) and UDP.

- **Deep Packet Inspection (DPI)**
  - Raw payload extraction and hex-to-text conversion.
  - Identification of common service protocols (HTTP, DNS, ICMP).

- **Performance & Logging**
  - Minimalistic and fast execution for high-traffic environments.
  - Structured console output for easy debugging and auditing.

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| **Language** | Python 3.x |
| **Core Library** | Scapy |
| **Networking** | Raw Sockets (`socket` module) |
| **Data Parsing** | `struct` & `binascii` |

## 📁 Project Structure
```
Network_analyzer/
│
├── main.py              # Entry point of the application; initializes the sniffer.
├── decoder.py           # Core logic for parsing headers and decoding protocols.
├── utils.py             # Helper functions for data formatting and logging.
├── requirements.txt     # List of necessary Python dependencies.
└── README.md            # Project documentation and setup guide.
```

## 🔍 How It Works (Deep Dive)

**The Layman Analogy:** Imagine standing inside a massive courier sorting facility. Every package (packet) moving through the belts has multiple layers of wrapping. This tool acts as an inspector that peels back each layer—first the outer shipping box (Ethernet), then the routing label (IP), and finally the letter inside (Payload)—to understand exactly what is happening in the network.

**Technical Process:**
1. **Socket Initialization:** The script creates a raw socket that bypasses the standard TCP/IP stack of the OS to see every bit.
2. **Buffer Capture:** Packets are pulled into a buffer as raw binary.
3. **Unpacking:** Using the `struct` module, the script maps binary data to specific protocol headers (e.g., knowing that the first 14 bytes of an Ethernet frame contain MAC addresses).
4. **Traffic Monitoring:** The loop continues indefinitely, providing a live stream of network events.

## 🚀 Installation

### Prerequisites

- Python 3.7 or higher
- Npcap (for Windows users) or libpcap (for Linux users)
- Root/Administrator privileges

### Setup

```bash
# Clone the repository
git clone [https://github.com/abhis59060/Network_analyzer.git](https://github.com/abhis59060/Network_analyzer.git)

# Navigate to project directory
cd Network_analyzer

# Install dependencies
pip install -r requirements.txt


💻 Usage
Starting the Sniffer
On Linux/macOS:

Bash
sudo python3 main.py
On Windows:

Open PowerShell or Command Prompt as Administrator.

Run:

Bash
python main.py
Analyzing Results
The tool will display a live feed of packets.

Observe the Source/Destination IP to track traffic flow.

Check the Payload section to see raw data being transmitted.

🔒 Security Considerations
Ethical Use: This tool is for educational and authorized auditing purposes only.

Privacy: Sniffing data on public or unauthorized networks is a violation of privacy laws.

Network Load: Running heavy analysis on high-speed production links may impact performance.

🤝 Contributing
Contributions are what make the open-source community such an amazing place to learn, inspire, and create.

Fork the Project

Create your Feature Branch (git checkout -b feature/NewProtocol)

Commit your Changes (git commit -m 'Add support for ICMPv6')

Push to the Branch (git push origin feature/NewProtocol)

Open a Pull Request

📝 License
Distributed under the MIT License. See LICENSE for more information.

Author: Abhishek Tiwary

Last Updated: 2026-02-09


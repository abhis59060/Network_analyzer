# 🛡️ Network Analyzer - Packet Sniffer & Traffic Monitor

Ek robust Python-based tool jo network traffic ko real-time mein capture aur analyze karne ke liye design kiya gaya hai. Yeh tool network security monitoring aur packet-level inspection ke liye ek essential utility hai.

## 📖 Overview
Network Analyzer ek utility hai jo network interface se guzarne wale packets ko intercept karti hai. Yeh tool Raw Sockets aur Scapy library ka upyog karke protocols (jaise TCP, UDP, ICMP) ko decode karta hai aur data ko human-readable format mein display karta hai.

**Layman Example:** Sochiye ki aap ek bade courier hub (router) mein khade hain. Har box (packet) jo waha se guzar raha hai, yeh tool us box ko khol kar dekhta hai ki wo kahan se aa raha hai, kahan ja raha hai, aur uske andar kya saman (payload/data) hai.

## ✨ Key Features
- **Real-time Packet Capture:** Bina kisi delay ke live packets ko intercept karna.
- **Multi-Protocol Support:** Ethernet frames, IP headers, aur Transport layer (TCP/UDP) ka vistaar mein analysis.
- **Payload Extraction:** Packets ke andar maujood raw data ko analyze karne ki suvidha.
- **Security Auditing:** Network mein hone wali suspicious activity ko detect karne mein sahayak.

## 📂 Project Structure
Is project ka architecture modular rakha gaya hai taki code maintainable rahe:

```text
Network_analyzer/
│
├── main.py              # Main execution file jo sniffer ko start karti hai.
├── decoder.py           # Packets aur protocols ko parse karne ka core logic.
├── utils.py             # Helper functions aur text formatting utilities.
├── requirements.txt     # Dependencies ki list (Scapy, etc.).
└── README.md            # Project documentation.
🛠️ Technical Stack
Language: Python 3.x

Libraries: scapy, socket, struct

Focus: Network Security & Protocol Analysis

🔍 Deep Dive: How it Works?
Raw Socket Creation: Tool OS kernel se sidha network interface ka access maangta hai taaki har bit ko read kiya ja sake.

Ethernet Frame Decoding: Sabse pehle Layer 2 (Data Link Layer) ki information nikali jati hai jaise MAC addresses.

IP Header Parsing: Iske baad Layer 3 (Network Layer) se Source aur Destination IP ko extract kiya jata hai.

Transport Layer Breakdown: Protocol ID ke basis par yeh decide hota hai ki packet TCP hai ya UDP, aur phir ports aur flags ki jaanch hoti hai.

🚀 Getting Started
Prerequisites
Is tool ko chalane ke liye aapke system mein Python installed hona chahiye aur scapy library ki zarurat hogi:

Bash
pip install scapy
Installation
Repository ko clone karein:

Bash
git clone [https://github.com/abhis59060/Network_analyzer.git](https://github.com/abhis59060/Network_analyzer.git)
Project directory mein jayein:

Bash
cd Network_analyzer
Usage
Tool ko administrator ya root privileges ke saath run karein (kyunki raw sockets access ke liye permissions chahiye hoti hain):

Bash
# For Linux
sudo python3 main.py

# For Windows
python main.py (Run as Administrator)
⚠️ Disclaimer
Yeh tool sirf Educational Purposes aur Ethical Hacking ke liye banaya gaya hai. Bina permission ke kisi dusre ke network ko monitor karna illegal hai.

👤 Author
Abhishek Tiwary MCA Cyber Security Student

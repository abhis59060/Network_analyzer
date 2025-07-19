import sys
import logging
import argparse
import json
import os
import re
from multiprocessing import Pool
from uuid import uuid4
import pandas as pd
from tabulate import tabulate
from tqdm import tqdm
from scapy.all import PcapReader, IP, TCP, DNS, ARP

# Set up logging with DEBUG level for detailed diagnostics
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class NetworkAnalyzer:
    """A class to analyze network traffic from PCAP files without requiring Npcap."""
    
    def __init__(self, pcap_file, port_scan_threshold=100, output_file="network_analysis.csv", viz_output="visualizations.json"):
        """
        Initialize the NetworkAnalyzer.

        Args:
            pcap_file (str): Path to the PCAP file (e.g., 'C:\\Users\\at410\\Downloads\\one.pcap').
            port_scan_threshold (int): Threshold for detecting port scanning.
            output_file (str): Path to save analysis results (CSV).
            viz_output (str): Path to save visualization JSON.
        """
        self.pcap_file = os.path.normpath(pcap_file)
        self.port_scan_threshold = port_scan_threshold
        self.output_file = os.path.normpath(output_file)
        self.viz_output = os.path.normpath(viz_output)
        self.packets = None
        self.df = None
        self.df_security = None
        self.protocol_map = self.load_protocol_map()

    def validate_file(self):
        """Validate that the PCAP file exists."""
        logger.debug(f"Validating PCAP file: {self.pcap_file}")
        if not os.path.isfile(self.pcap_file):
            logger.error(f"PCAP file not found: {self.pcap_file}")
            logger.error("Please verify the file path (e.g., 'C:\\Users\\at410\\Downloads\\one.pcap') and ensure the file exists.")
            sys.exit(1)

    def load_protocol_map(self):
        """Load protocol mapping from a dictionary or external file."""
        logger.debug("Loading protocol map")
        protocol_dict = {
            0: "HOPOPT",
            1: "ICMP",
            2: "IGMP",
            6: "TCP",
            17: "UDP",
            19: "CHARGEN",
            37: "Time",
            89: "OSPF",
            118: "STP",
            120: "SMP",
            127: "Private",
            170: "EMFAS",
            240: "Experimental"
        }
        try:
            with open('protocol_map.json', 'r') as f:
                protocol_dict.update(json.load(f))
        except FileNotFoundError:
            logger.debug("No protocol_map.json found, using default protocol mapping.")
        return protocol_dict

    def protocol_name(self, number):
        """Convert protocol number to name."""
        return self.protocol_map.get(number, f"Unknown({number})")

    def is_valid_ip(self, ip):
        """Validate IP address format."""
        try:
            # Basic regex for valid IPv4: four numbers (0-255) separated by dots
            pattern = r'^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$'
            return re.match(pattern, ip) and not ip.startswith('0.')
        except Exception:
            return False

    def read_pcap(self):
        """Read packets from a PCAP file incrementally using Scapy's built-in reader."""
        logger.debug(f"Reading PCAP file: {self.pcap_file}")
        self.validate_file()
        try:
            self.packets = []
            with PcapReader(self.pcap_file) as pcap_reader:
                for packet in tqdm(pcap_reader, desc=f"Reading packets from {os.path.basename(self.pcap_file)}", unit="packet"):
                    self.packets.append(packet)
            if not self.packets:
                logger.error(f"No packets found in {self.pcap_file}")
                logger.error("Ensure the file is a valid PCAP file (try opening it in Wireshark).")
                sys.exit(1)
            logger.debug(f"Read {len(self.packets)} packets")
        except Exception as e:
            logger.error(f"Error reading PCAP file {self.pcap_file}: {e}")
            logger.error("Ensure the file is a valid PCAP file (try opening it in Wireshark).")
            sys.exit(1)
        return self

    def process_packet(self, packet):
        """Process a single packet for general analysis."""
        if IP in packet:
            src_ip = packet[IP].src
            dst_ip = packet[IP].dst
            if self.is_valid_ip(src_ip) and self.is_valid_ip(dst_ip):
                logger.debug(f"Processing packet: {src_ip} -> {dst_ip}")
                return {
                    "src_ip": src_ip,
                    "dst_ip": dst_ip,
                    "protocol": packet[IP].proto,
                    "size": len(packet),
                    "time": float(packet.time),  # Convert EDecimal to float
                    "src_port": packet[TCP].sport if TCP in packet else 0,
                    "dst_port": packet[TCP].dport if TCP in packet else 0,
                    "tcp_flags": str(packet[TCP].flags) if TCP in packet else ""
                }
            else:
                logger.debug(f"Skipping packet with invalid IPs: {src_ip} -> {dst_ip}")
        return None

    def extract_packet_data(self):
        """Extract packet data using parallel processing."""
        logger.debug("Extracting packet data")
        with Pool() as pool:
            results = list(tqdm(pool.imap(self.process_packet, self.packets),
                               total=len(self.packets), desc="Processing packets"))
        self.df = pd.DataFrame([r for r in results if r is not None])
        if self.df.empty:
            logger.error("No valid IP packets found for analysis.")
            sys.exit(1)
        logger.debug(f"Extracted {len(self.df)} valid packets")
        return self

    def extract_security_data(self):
        """Extract packet data for security analysis."""
        logger.debug("Extracting security data")
        packet_data = []
        for packet in tqdm(self.packets, desc="Processing packets for security", unit="packet"):
            if IP in packet:
                src_ip = packet[IP].src
                dst_ip = packet[IP].dst
                if self.is_valid_ip(src_ip) and self.is_valid_ip(dst_ip):
                    packet_data.append({
                        "src_ip": src_ip,
                        "dst_ip": dst_ip,
                        "protocol": packet[IP].proto,
                        "dst_port": packet[TCP].dport if TCP in packet else 0,
                        "tcp_flags": str(packet[TCP].flags) if TCP in packet else "",
                        "time": float(packet.time)  # Convert EDecimal to float
                    })
        self.df_security = pd.DataFrame(packet_data)
        if self.df_security.empty:
            logger.warning("No valid IP packets found for security analysis.")
        logger.debug(f"Extracted {len(self.df_security)} packets for security analysis")
        return self

    def extract_dns_data(self):
        """Extract DNS-specific data."""
        logger.debug("Extracting DNS data")
        dns_data = []
        for packet in self.packets:
            if DNS in packet and packet[DNS].qd:
                src_ip = packet[IP].src
                dst_ip = packet[IP].dst
                if self.is_valid_ip(src_ip) and self.is_valid_ip(dst_ip):
                    dns_data.append({
                        "src_ip": src_ip,
                        "dst_ip": dst_ip,
                        "query": packet[DNS].qd.qname.decode() if packet[DNS].qd else None
                    })
        logger.debug(f"Extracted {len(dns_data)} DNS packets")
        return pd.DataFrame(dns_data)

    def extract_non_ip_data(self):
        """Extract non-IP data (e.g., ARP)."""
        logger.debug("Extracting non-IP data")
        arp_data = []
        for packet in self.packets:
            if ARP in packet:
                arp_data.append({
                    "src_mac": packet[ARP].hwsrc,
                    "dst_mac": packet[ARP].hwdst,
                    "op": packet[ARP].op
                })
        logger.debug(f"Extracted {len(arp_data)} ARP packets")
        return pd.DataFrame(arp_data)

    def add_geolocation(self):
        """Add geolocation data to IPs (requires MaxMind GeoIP database)."""
        logger.debug("Geolocation not enabled (commented out)")
        # try:
        #     reader = geoip2.database.Reader('GeoLite2-City.mmdb')
        #     self.df['src_country'] = self.df['src_ip'].apply(
        #         lambda ip: reader.city(ip).country.name if ip else 'Unknown')
        #     self.df['dst_country'] = self.df['dst_ip'].apply(
        #         lambda ip: reader.city(ip).country.name if ip else 'Unknown')
        # except Exception as e:
        #     logger.warning(f"Geolocation failed: {e}. Ensure GeoLite2-City.mmdb is in the script directory.")
        return self

    def analyze_packet_data(self):
        """Analyze packet data for bandwidth, protocols, and IP communications."""
        logger.debug("Analyzing packet data")
        self.df["size"] = pd.to_numeric(self.df["size"], errors="coerce")
        self.df["protocol"] = self.df["protocol"].astype(int).apply(self.protocol_name)

        total_bandwidth = self.df["size"].sum()
        protocol_counts = self.df["protocol"].value_counts(normalize=True) * 100
        protocol_frequency = self.df["protocol"].value_counts()
        protocol_counts_df = pd.concat([protocol_frequency, protocol_counts], axis=1).reset_index()
        protocol_counts_df.columns = ["Protocol", "Count", "Percentage"]

        ip_communication = self.df.groupby(["src_ip", "dst_ip"]).size().sort_values(ascending=False)
        ip_communication_percentage = ip_communication / ip_communication.sum() * 100
        ip_communication_table = pd.concat([ip_communication, ip_communication_percentage], axis=1).reset_index()
        ip_communication_table.columns = ["Source IP", "Destination IP", "Count", "Percentage"]

        ip_communication_protocols = self.df.groupby(["src_ip", "dst_ip", "protocol"]).size().reset_index()
        ip_communication_protocols.columns = ["Source IP", "Destination IP", "Protocol", "Count"]
        ip_communication_protocols["Percentage"] = ip_communication_protocols["Count"] / \
            ip_communication_protocols.groupby(["Source IP", "Destination IP"])["Count"].transform("sum") * 100

        flow_counts = self.df.groupby(["src_ip", "dst_ip", "src_port", "dst_port", "protocol"]).size().reset_index(name="count")

        logger.debug(f"Total bandwidth: {total_bandwidth} bytes")
        return total_bandwidth, protocol_counts_df, ip_communication_table, protocol_frequency, ip_communication_protocols, flow_counts

    def detect_port_scanning(self):
        """Detect potential port scanning activity."""
        logger.debug("Detecting port scanning")
        syn_packets = self.df_security[(self.df_security['protocol'] == 6) & (self.df_security['tcp_flags'].str.contains('S', na=False))]
        port_scan_df = syn_packets.groupby(['src_ip', 'dst_port']).size().reset_index(name='count')
        unique_ports_per_ip = port_scan_df.groupby('src_ip').size().reset_index(name='unique_ports')
        potential_scanners = unique_ports_per_ip[unique_ports_per_ip['unique_ports'] >= self.port_scan_threshold]
        if not potential_scanners.empty:
            logger.warning(f"Potential port scanners in {self.pcap_file}: {', '.join(potential_scanners['src_ip'])}")
        logger.debug(f"Found {len(potential_scanners)} potential scanners")
        return potential_scanners

    def detect_ddos(self, rate_threshold=1000):
        """Detect potential DDoS attacks based on packet rates."""
        logger.debug("Detecting DDoS activity")
        time_span = self.df_security['time'].max() - self.df_security['time'].min()
        if time_span == 0:
            logger.debug("Time span is zero, skipping DDoS detection")
            return pd.Series()
        packet_rate = self.df_security.groupby('dst_ip').size() / time_span
        ddos_targets = packet_rate[packet_rate > rate_threshold].index
        if not ddos_targets.empty:
            logger.warning(f"Potential DDoS targets in {self.pcap_file}: {', '.join(ddos_targets)}")
        logger.debug(f"Found {len(ddos_targets)} potential DDoS targets")
        return ddos_targets

    def print_results(self, total_bandwidth, protocol_counts_df, ip_communication_table, protocol_frequency, ip_communication_protocols, flow_counts):
        """Print analysis results."""
        logger.debug("Printing analysis results")
        bandwidth_unit = "Mbps" if total_bandwidth < 10**9 else "Gbps"
        total_bandwidth /= 10**6 if bandwidth_unit == "Mbps" else 10**9

        logger.info(f"\nAnalysis for {self.pcap_file}")
        logger.info(f"Total bandwidth used: {total_bandwidth:.2f} {bandwidth_unit}")
        logger.info("\nProtocol Distribution:\n")
        logger.info(tabulate(protocol_counts_df, headers=["Protocol", "Count", "Percentage"], tablefmt="grid", floatfmt=".2f"))
        logger.info("\nTop IP Address Communications (Top 10):\n")
        logger.info(tabulate(ip_communication_table.head(10), headers=["Source IP", "Destination IP", "Count", "Percentage"], tablefmt="grid", floatfmt=".2f"))
        logger.info("\nShare of Protocols Between IPs (Top 10):\n")
        logger.info(tabulate(ip_communication_protocols.head(10), headers=["Source IP", "Destination IP", "Protocol", "Count", "Percentage"], tablefmt="grid", floatfmt=".2f"))
        logger.info("\nFlow Analysis (Top 10 Flows):\n")
        logger.info(tabulate(flow_counts.head(10), headers=["Source IP", "Destination IP", "Source Port", "Destination Port", "Protocol", "Count"], tablefmt="grid"))

    def save_results(self):
        """Save analysis results to a file."""
        logger.debug(f"Saving results to {self.output_file}")
        try:
            self.df.to_csv(self.output_file, index=False)
            logger.info(f"Results saved to {self.output_file}")
        except Exception as e:
            logger.error(f"Failed to save results to {self.output_file}: {e}")
            sys.exit(1)

    def generate_visualizations(self):
        """Generate visualizations using Chart.js format and save to file."""
        logger.debug("Generating visualizations")
        protocol_counts = self.df["protocol"].value_counts(normalize=True) * 100
        protocol_counts_df = pd.DataFrame({"Protocol": protocol_counts.index, "Percentage": protocol_counts.values})

        bar_chart = {
            "type": "bar",
            "data": {
                "labels": protocol_counts_df["Protocol"].tolist(),
                "datasets": [{
                    "label": "Protocol Distribution",
                    "data": protocol_counts_df["Percentage"].tolist(),
                    "backgroundColor": ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd"],
                    "borderColor": ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd"],
                    "borderWidth": 1
                }]
            },
            "options": {
                "scales": {
                    "y": {"beginAtZero": True, "title": {"display": True, "text": "Percentage"}},
                    "x": {"title": {"display": True, "text": "Protocol"}}
                },
                "plugins": {"title": {"display": True, "text": f"Protocol Distribution ({os.path.basename(self.pcap_file)})"}},
                "responsive": True
            }
        }

        # Convert timestamps to relative time (seconds from first packet)
        time_df = self.df.groupby("time")["size"].sum().reset_index()
        if not time_df.empty:
            time_df["time"] = time_df["time"] - time_df["time"].min()
            time_series = {
                "type": "line",
                "data": {
                    "labels": time_df["time"].round(2).astype(str).tolist(),  # Round to 2 decimals for readability
                    "datasets": [{
                        "label": "Packet Size Over Time",
                        "data": time_df["size"].tolist(),
                        "borderColor": "#1f77b4",
                        "fill": False
                    }]
                },
                "options": {
                    "scales": {
                        "x": {"title": {"display": True, "text": "Time (seconds)"}},
                        "y": {"title": {"display": True, "text": "Packet Size (bytes)"}}
                    },
                    "plugins": {"title": {"display": True, "text": f"Packet Size Over Time ({os.path.basename(self.pcap_file)})"}},
                    "responsive": True
                }
            }
        else:
            logger.warning("No time-series data available for visualization")
            time_series = None

        visualizations = [
            {"id": str(uuid4()), "chart": bar_chart, "title": "Protocol Distribution"}
        ]
        if time_series:
            visualizations.append({"id": str(uuid4()), "chart": time_series, "title": "Packet Size Over Time"})

        logger.debug(f"Saving visualizations to {self.viz_output}")
        try:
            with open(self.viz_output, 'w') as f:
                json.dump(visualizations, f, indent=2)
            logger.info(f"Visualizations saved to {self.viz_output}")
        except Exception as e:
            logger.error(f"Failed to save visualizations to {self.viz_output}: {e}")
            sys.exit(1)

        return visualizations

    def run(self):
        """Run the full analysis pipeline."""
        logger.debug("Starting analysis pipeline")
        self.read_pcap().extract_packet_data().extract_security_data()
        total_bandwidth, protocol_counts_df, ip_communication_table, protocol_frequency, ip_communication_protocols, flow_counts = self.analyze_packet_data()
        self.detect_port_scanning()
        self.detect_ddos()
        self.print_results(total_bandwidth, protocol_counts_df, ip_communication_table, protocol_frequency, ip_communication_protocols, flow_counts)
        self.save_results()
        return self.generate_visualizations()

def parse_args():
    """Parse command-line arguments."""
    logger.debug("Parsing command-line arguments")
    parser = argparse.ArgumentParser(description="Analyze network traffic from PCAP files without Npcap.")
    parser.add_argument("pcap_files", nargs='+', help="Path to PCAP file(s), e.g., 'C:\\Users\\at410\\Downloads\\one.pcap'")
    parser.add_argument("--port-scan-threshold", type=int, default=100, help="Threshold for detecting port scanning")
    parser.add_argument("--output", default="network_analysis.csv", help="Output file for results (CSV)")
    parser.add_argument("--viz-output", default="visualizations.json", help="Output file for visualization JSON")
    return parser.parse_args()

def check_dependencies():
    """Check if required dependencies are installed."""
    logger.debug("Checking dependencies")
    required = ['scapy', 'pandas', 'tabulate', 'tqdm']
    missing = []
    for module in required:
        try:
            __import__(module)
        except ImportError:
            missing.append(module)
    if missing:
        logger.error(f"Missing dependencies: {', '.join(missing)}")
        logger.error("Install them using: pip install " + " ".join(missing))
        sys.exit(1)

def main():
    """Main function to process multiple PCAP files."""
    check_dependencies()
    args = parse_args()
    for pcap_file in args.pcap_files:
        analyzer = NetworkAnalyzer(pcap_file, args.port_scan_threshold, args.output, args.viz_output)
        visualizations = analyzer.run()
        for viz in visualizations:
            logger.info(f"\nVisualization: {viz['title']}\n{json.dumps(viz['chart'], indent=2)}")

if __name__ == "__main__":
    main()
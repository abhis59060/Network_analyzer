import os
import sys
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
from uuid import uuid4
import logging
import pandas as pd
import numpy as np # Ensure numpy is imported for np.integer, np.floating

# Add parent directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from network_analysis import NetworkAnalyzer

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173"])

# Configuration for file uploads
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pcap', 'pcapng'}
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE

# Create upload directory
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Custom JSON serializer (kept as a fallback, but our goal is to avoid hitting it for NaNs)
# This will only be invoked if a non-standard serializable object slips through
def custom_json_serializer(obj):
    if isinstance(obj, (np.integer, np.floating)):
        if np.isnan(obj):
            return None
        return int(obj) if isinstance(obj, np.integer) else float(obj)
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")

@app.route('/')
def health_check():
    return jsonify({"status": "Backend is running!"})

@app.route('/analyze', methods=['POST'])
def analyze_pcap():
    logger.info("Received request to /analyze endpoint.")

    if 'pcap_file' not in request.files:
        logger.warning("No 'pcap_file' part in the request.")
        return jsonify({"error": "No PCAP file provided"}), 400

    file = request.files['pcap_file']
    if file.filename == '':
        logger.warning("No selected file.")
        return jsonify({"error": "No file selected"}), 400

    if not allowed_file(file.filename):
        logger.warning(f"Invalid file type for {file.filename}")
        return jsonify({"error": "Only .pcap or .pcapng files are allowed"}), 400

    unique_filename = f"{uuid4()}_{secure_filename(file.filename)}"
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
    output_csv_path = os.path.join(app.config['UPLOAD_FOLDER'], f"analysis_{uuid4()}.csv")
    output_viz_path = os.path.join(app.config['UPLOAD_FOLDER'], f"visualizations_{uuid4()}.json")

    try:
        file.save(filepath)
        logger.info(f"File saved to {filepath}")

        analyzer = NetworkAnalyzer(
            pcap_file=filepath,
            output_file=output_csv_path,
            viz_output=output_viz_path
        )
        visualizations_data = analyzer.run()

        if not os.path.exists(output_csv_path):
            raise FileNotFoundError("Analysis CSV file was not generated")
        analysis_df = pd.read_csv(output_csv_path)

        # --- CRITICAL FIX: Ensure all relevant NaNs are converted to Python None before to_dict ---
        # Define columns that might contain missing numerical values and should be integers
        columns_to_int_or_none = ['src_port', 'dst_port', 'size']
        # Define columns that might contain missing numerical values and should be floats
        columns_to_float_or_none = ['time']

        for col in columns_to_int_or_none:
            if col in analysis_df.columns:
                # Convert to numeric, coercing errors to NaN (float type initially)
                analysis_df[col] = pd.to_numeric(analysis_df[col], errors='coerce')
                # Replace numpy.nan with Python None, and convert valid numbers to int
                analysis_df[col] = analysis_df[col].apply(lambda x: None if pd.isna(x) else int(x))

        for col in columns_to_float_or_none:
            if col in analysis_df.columns:
                # Convert to numeric, coercing errors to NaN (float type)
                analysis_df[col] = pd.to_numeric(analysis_df[col], errors='coerce')
                # Replace numpy.nan with Python None, and convert valid numbers to float
                analysis_df[col] = analysis_df[col].apply(lambda x: None if pd.isna(x) else float(x))

        # This general safeguard should catch any remaining NaNs in other columns (e.g., non-numeric ones)
        analysis_df = analysis_df.where(pd.notna(analysis_df), None)
        # --- END CRITICAL FIX ---

        # Convert the DataFrame to a list of dictionaries (records)
        # At this point, all relevant NaNs should already be Python None.
        analysis_results = analysis_df.to_dict(orient='records')

        response_data = {
            "message": "Analysis completed successfully",
            "analysis_results": analysis_results,
            "visualizations": visualizations_data
        }

        logger.info(f"Response data before serialization: {response_data}")

        # Use default JSON serialization with jsonify, which handles Python None -> JSON null
        return jsonify(response_data), 200

    except Exception as e:
        logger.error(f"Error during PCAP analysis: {e}", exc_info=True)
        return jsonify({"error": f"Analysis failed: {str(e)}"}), 500

    finally:
        for path in [filepath, output_csv_path, output_viz_path]:
            if os.path.exists(path):
                try:
                    os.remove(path)
                    logger.info(f"Removed file: {path}")
                except Exception as e:
                    logger.error(f"Failed to remove {path}: {e}")

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)

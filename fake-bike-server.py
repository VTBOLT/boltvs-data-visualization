from flask import Flask, jsonify
import pandas as pd
import time
from flask_cors import CORS
from threading import Thread
import json

app = Flask(__name__)

# Enable CORS for all origins
CORS(app)

# Load CSV data into a DataFrame
csv_file = 'sample_data/TRIMMED_track1_run_4_second_10ms_interp.csv'
df = pd.read_csv(csv_file)
total_rows = len(df)
start_time = time.time()
ms_per_step = 10  # Interval in milliseconds

@app.route('/data', methods=['GET'])
def get_data():
    if df.empty:
        return jsonify({'error': 'No data available'}), 500

    # Calculate the current index based on elapsed time
    elapsed_time = (time.time() - start_time) * 1000  # Convert to milliseconds
    current_index = int(elapsed_time // ms_per_step) % total_rows

    # Get the current row
    row = df.iloc[current_index]

    # Convert row to a dictionary with preserved column order
    row_dict = dict(zip(df.columns, row))

    # Convert dictionary to JSON with ordered keys
    row_json = json.dumps(row_dict, ensure_ascii=False)

    return row_json, 200, {'Content-Type': 'application/json'}

@app.route('/rows', methods=['GET'])
def get_total_rows():
    return jsonify({'totalRows': total_rows})

if __name__ == '__main__':
    app.run(port=3000)

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
current_index = 0
ms_per_step = 10  # Interval in milliseconds


@app.route('/data', methods=['GET'])
def get_data():
    global current_index
    if df.empty:
        return jsonify({'error': 'No data available'}), 500

    # Get the current row
    row = df.iloc[current_index]

    # Convert row to a dictionary with preserved column order
    row_dict = dict(zip(df.columns, row))

    # Convert dictionary to JSON with ordered keys
    row_json = json.dumps(row_dict, ensure_ascii=False)

    # Update index
    current_index = (current_index + 1) % total_rows

    return row_json, 200, {'Content-Type': 'application/json'}


@app.route('/rows', methods=['GET'])
def get_total_rows():
    return jsonify({'totalRows': total_rows})


def update_index():
    global current_index
    while True:
        time.sleep(ms_per_step / 1000)  # Convert milliseconds to seconds
        current_index = (current_index + 1) % total_rows


if __name__ == '__main__':
    # Start the index update in a separate thread
    thread = Thread(target=update_index)
    thread.daemon = True
    thread.start()

    app.run(port=3000)

import express from 'express'
import fs from 'fs'
import csv from 'csv-parser'
import cors from 'cors';

const app = express();
app.use(cors());
const port = 3000;
const msPerStep = 10; //milliseconds between each sample (row) of the csv

let csvData = [];
let currentIndex = 0;
let totalRows = 0;

// Read the CSV file and store data in an array
fs.createReadStream('sample_data/TRIMMED_track1_run_4_second_10ms_interp.csv')
  .pipe(csv())
  .on('data', (row) => {
    csvData.push(row);
    totalRows++;
  })
  .on('end', () => {
    console.log('CSV file successfully processed');
  });

// Endpoint to get the next row of CSV data
app.get('/data', (req, res) => {
  if (csvData.length === 0) {
    return res.status(500).json({ error: 'No data available' });
  }

  res.json(csvData[currentIndex]);
});

// Endpoint to get the total number of rows
app.get('/rows', (req, res) => {
  res.json({ totalRows });
});

// Set an interval to update currentIndex based on msPerStep
setInterval(() => {
  if (csvData.length > 0) {
    currentIndex = (currentIndex + 1) % totalRows;
  }
}, msPerStep);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
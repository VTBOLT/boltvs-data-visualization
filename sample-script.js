let sampleRate = 250;
window.fetchCallback = {};
let missedPackets = 0
const rowMap = new Map(); //holds table data

// Fetch data from our server (bike). The "timeout" is very critical, otherwise we could be recieving very old data if there are many requests backing up
async function fetchData() {
    const startTime = performance.now();
    fetch('http://localhost:3000/data', { signal: AbortSignal.timeout(100) })
        .then(response => response.json())
        .then(data => {
            // Record the end time and Calculate the latency
            const endTime = performance.now();
            const latency = endTime - startTime;

            updateTable(data);
            updateTime(data.epoch);
            updateLatency(latency)
            updateMissedPacketCounter();
        })
        .catch(error => {
            console.error('Fetch error:', error);
            missedPackets++;
        });
}

// Update the table with new data
function updateTable(data) {
    const tableBody = document.getElementById('table-body');

    // Iterate over the data
    for (const [key, value] of Object.entries(data)) {
        let row = rowMap.get(key);

        if (!row) {
            // Create a new row if it doesn't exist
            row = document.createElement('tr');

            const tdKey = document.createElement('td');
            tdKey.className = 'td-key'
            tdKey.innerText = key;
            row.appendChild(tdKey);

            // Create and append the value cell
            const tdValue = document.createElement('td');
            row.appendChild(tdValue);

            // Create and append the min cell
            const tdMin = document.createElement('td');
            tdMin.innerText = Number.POSITIVE_INFINITY // initial value +inf
            row.appendChild(tdMin);

            // Create and append the max cell
            const tdMax = document.createElement('td');
            tdMax.innerText = Number.NEGATIVE_INFINITY // initial value -inf
            row.appendChild(tdMax);

            // Append the row to the table body
            tableBody.appendChild(row);

            // Add the row to the map
            rowMap.set(key, row);
        }

        // Update the value cell
        let tdValue = row.querySelector('td:nth-child(2)');
        tdValue.innerText = value;

        // Update the min cell
        let tdMin = row.querySelector('td:nth-child(3)');
        if (tdMin.innerText > value)
            tdMin.innerText = value;

        // Update the max cell with the same value as tdValue
        let tdMax = row.querySelector('td:nth-child(4)');
        if (tdMax.innerText < value)
            tdMax.innerText = value;
    }

    // Remove rows that are no longer in the data
    for (const [key, row] of rowMap.entries()) {
        if (!data.hasOwnProperty(key)) {
            tableBody.removeChild(row);
            rowMap.delete(key);
        }
    }
}
function updateMissedPacketCounter() {
    const missedPacketLabel = document.getElementById('missedPackets');
    missedPacketLabel.innerHTML = `${missedPackets}`;
}

function updateLatency(latency) {
    const latencyLabel = document.getElementById('latency');
    latencyLabel.innerHTML = `${latency.toFixed(1)}ms`;

    latencyLabel.style.color = `hsl(${Math.max(0, 120 - ((latency - 60) / 60) * 120)}, 75%, 50%)`;
    console.log(`hsl(${Math.max(0, 120 - ((parseFloat(latency.textContent) - 50) / 50) * 120)}, 100%, 50%)`)
}

function updateTime(epoch) {
    const clock = document.getElementById('clock');
    clock.innerHTML = formatEpochToET(epoch)
}

function formatEpochToET(epochSeconds) {
    // Convert epoch seconds to milliseconds
    const date = new Date(epochSeconds * 1000);

    // Extract individual components
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    const hour24 = date.getHours();
    const minute = ('0' + date.getMinutes()).slice(-2);
    const second = ('0' + date.getSeconds()).slice(-2);
    const millisecond = ('00' + date.getMilliseconds()).slice(-3);

    // Convert to 12-hour format and determine AM/PM
    const hour12 = hour24 % 12 || 12;
    const ampm = hour24 >= 12 ? 'PM' : 'AM';

    // Create formatted date string
    const formattedDate = `${month}/${day}/${year}`;
    const formattedTime = `${('0' + hour12).slice(-2)}:${minute}:${second}.${millisecond}`;

    // Return formatted string as MM/DD/YYYY, HH:MM:SS.SSS AM/PM
    return `${formattedDate}, ${formattedTime} ${ampm}`;
}

function setSampleRate() {
    let input = document.getElementById('sampleRate');
    try {
        sampleRate = parseInt(input.value, 10);
    }
    catch {
        input.innerHTML = ""
        return
    }

    // Reset missed packet count
    missedPackets = 0

    // Kill the old fetch callback, make a new one with our new sample rate
    clearInterval(window.fetchCallback)
    window.fetchCallback = setInterval(fetchData, sampleRate);

    console.log('Sample rate set to', sampleRate, 'ms');
}

function resetSampleRate() {
    // Reset missed packet count
    missedPackets = 0

    // Kill the old fetch callback, make a new one with our new sample rate
    clearInterval(window.fetchCallback)
    window.fetchCallback = setInterval(fetchData, 250);

    console.log('Sample rate set to', sampleRate, 'ms');
}

// Fetch data every 250 milliseconds by default
window.fetchCallback = setInterval(fetchData, sampleRate);

// Initial fetch
fetchData();
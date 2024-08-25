// Initialize the map
var map = L.map('map').setView([51.505, -0.09], 2); // Set initial view to a low zoom level

// Add OpenStreetMap tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 17,
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Variable to hold the heatmap layer
var heat;

// Function to load heatmap data from a JSON file
function loadHeatmapData(data) {
    // Show loading indicator
    document.getElementById('loading').style.display = 'block';
    document.getElementById('error').style.display = 'none'; // Hide error message

    // Center the map on the average of all points
    centerMapOnPoints(data);

    // Create the heatmap layer with the loaded data
    if (heat) {
        map.removeLayer(heat); // Remove existing heat layer if it exists
    }
    heat = L.heatLayer(data, { radius: getDynamicRadius() }).addTo(map);

    // Hide loading indicator
    document.getElementById('loading').style.display = 'none';
}

// Function to center the map on the average of all points
function centerMapOnPoints(data) {
    if (data.length === 0) return; // No data points

    // Create a bounds object to fit all points
    var bounds = L.latLngBounds(data.map(point => [point[0], point[1]]));

    // Set the view to the bounds
    map.fitBounds(bounds);
}

// Function to get dynamic radius based on zoom level
function getDynamicRadius() {
    var zoom = map.getZoom();
    // Adjust the radius based on zoom level
    return Math.max(10, 15 - (zoom * 0.75)); // Example: decrease radius as zoom increases
}

// Event listener to update heatmap radius on zoom change
map.on('zoomend', function () {
    if (heat) {
        heat.setOptions({ radius: getDynamicRadius() });
    }
});

// Drag and drop functionality
var dropZone = document.getElementById('map');

dropZone.addEventListener('dragover', function (event) {
    event.preventDefault(); // Prevent default behavior (Prevent file from being opened)
});

dropZone.addEventListener('drop', function (event) {
    event.preventDefault();

    // Clear previous error messages
    const errorElement = document.getElementById('error');
    errorElement.innerText = "";
    errorElement.style.display = 'none';

    const dataPromises = [];

    for (const file of event.dataTransfer.files) {
        if (file && file.type === "application/json") {
            const readerPromise = new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = function (e) {
                    try {
                        const jsonData = JSON.parse(e.target.result);
                        resolve(jsonData);
                    } catch (error) {
                        reject('Error parsing JSON: ' + error.message);
                    }
                };
                reader.onerror = function () {
                    reject('Error reading file');
                };
                reader.readAsText(file);
            });
            dataPromises.push(readerPromise);
        } else {
            errorElement.innerText = "Invalid file type";
            errorElement.style.display = 'block';
            return; // Exit early if there's an invalid file type
        }
    }

    // Wait for all file reads to complete
    Promise.all(dataPromises)
        .then(dataArray => {
            // Flatten the array if needed
            const combinedData = dataArray.flat();
            loadHeatmapData(combinedData);
        })
        .catch(error => {
            errorElement.innerText = error;
            errorElement.style.display = 'block';
        });
});

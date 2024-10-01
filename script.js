const SPREADSHEET_ID = '1OCVaGfgp-1dLdCdkon4sepmJJ5EKQIfsIWM18_CmDAo'; // Your spreadsheet ID
const API_KEY = 'AIzaSyBVMmQQtaGToyRhlOgo1ujXTReS0T1LQXQ'; // Your API key
const SHEET_NAME = 'Data Dokter'; // Your sheet name

async function fetchDoctorData() {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_NAME}?key=${API_KEY}`;
    console.log('Fetching data from:', url); // Log the API URL
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.values || []; // Ensure an array is returned
    } catch (error) {
        console.error('Error fetching doctor data:', error);
        return []; // Return an empty array on error
    }
}

// Call the fetch function and populate the dropdowns
document.addEventListener('DOMContentLoaded', async () => {
    const clinicDropdown = document.getElementById('clinic');
    const doctorDropdown = document.getElementById('doctor');
    const serviceTypeDropdown = document.getElementById('service-type');

    const rows = await fetchDoctorData();
    if (!rows.length) {
        alert('No data found or access denied.');
        return; // Exit if no data
    }

    const clinics = new Set();

    // Extract unique clinics and populate the clinic dropdown
    rows.slice(1).forEach(row => {
        const clinic = row[0]; // Column A
        if (clinic) clinics.add(clinic);
    });

    clinics.forEach(clinic => {
        const option = document.createElement('option');
        option.value = clinic;
        option.textContent = clinic;
        clinicDropdown.appendChild(option);
    });

    serviceTypeDropdown.addEventListener('change', () => {
        const serviceType = serviceTypeDropdown.value;
        updateDoctors(serviceType, rows);
    });

    function updateDoctors(serviceType, rows) {
        doctorDropdown.innerHTML = '';
        const selectedClinic = clinicDropdown.value;

        const filteredDoctors = rows.slice(1).filter(row => {
            const clinicMatch = row[0] === selectedClinic; // Column A
            if (serviceType === 'behel') {
                const endDate = new Date(row[8]); // Column I
                const today = new Date();
                const monthsRemaining = (endDate.getFullYear() - today.getFullYear()) * 12 + (endDate.getMonth() - today.getMonth());
                return clinicMatch && row[2] === 'Yes' && monthsRemaining > 3; // Behel status and months remaining
            } else {
                return clinicMatch; // For Non-Behel, return all doctors from the selected clinic
            }
        });

        // Sort doctors based on service type
        if (serviceType === 'behel') {
            filteredDoctors.sort((a, b) => {
                return b[10] - a[10] || (b[3] === 'Yes' ? -1 : 1); // Sort by CVR and SLB status
            });
        } else {
            filteredDoctors.sort((a, b) => b[4] - a[4]); // Sort by Upsell rate
        }

        filteredDoctors.forEach(doctor => {
            const option = document.createElement('option');
            option.value = doctor[1]; // Column B (Doctor Name)
            option.textContent = doctor[1];
            doctorDropdown.appendChild(option);
        });
    }

    // Handle form submission
    document.getElementById('telesales-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        const selectedDoctor = doctorDropdown.value;

        // Record to Google Sheets here (using an API or a script)
        const response = await fetch('https://script.google.com/macros/library/d/1h1Dyk0gNgQj3lI6u_JyEVTev-5se_Veppln_mfrdG_JfO2uLQ3dtGHRT/1', { // Replace with your Google Apps Script URL
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ doctor: selectedDoctor })
        });

        const result = await response.json();
        console.log('Response:', result);
        alert('Doctor submitted: ' + selectedDoctor);
    });
});

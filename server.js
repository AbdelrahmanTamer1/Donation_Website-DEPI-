// server.js

const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data', 'donations.json');
const DONATION_GOAL = 10000;

// --- Data Storage and Initialization ---

let donations = [];
let totalAmount = 0;
let totalDonors = 0;

// Function to read data from JSON file
function loadDonations() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    donations = JSON.parse(data);

    // Calculate totals
    totalAmount = donations.reduce((sum, d) => sum + d.amount, 0);
    totalDonors = new Set(donations.map(d => d.email)).size;

    console.log(`Donations loaded: ${donations.length}`);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('Donations file not found. Starting with empty data.');
      donations = [];
    } else {
      console.error('Error loading donations:', error.message);
    }
  }
}

// Function to write data to JSON file
function saveDonations() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(donations, null, 4), 'utf8');
    console.log('Donations saved to file.');
  } catch (error) {
    console.error('Error saving donations:', error.message);
  }
}

// Load initial data
loadDonations();

// --- Middleware ---

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Routes ---

// 1. Root route to serve the Home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pages', 'index.html'));
});

// 2. Route to serve the Donation page
app.get('/donation', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pages', 'donation.html'));
});

// 3. Route to serve the Contact page
app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pages', 'contact.html'));
});

// 4. Route to serve the About page
app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pages', 'about.html'));
});

// 5. API endpoint for current stats (used by frontend)
app.get('/stats', (req, res) => {
  const recentDonations = donations
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5)
    .map(d => ({
      name: d.name || 'Anonymous',
      amount: d.amount,
      type: d.type
    }));

  res.json({
    totalDonors,
    totalAmount: totalAmount.toFixed(2),
    donationGoal: DONATION_GOAL,
    progress: Math.min((totalAmount / DONATION_GOAL) * 100, 100).toFixed(2),
    recentDonations
  });
});

// 6. API endpoint to handle new donations (POST)
app.post('/donate', (req, res) => {
  const { name, email, amount, type, message } = req.body;

  if (!name || !email || !amount || isNaN(Number(amount)) || Number(amount) <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or missing required fields: Name, Email, and a positive Amount are required.'
    });
  }

  const newDonation = {
    id: Date.now().toString(),
    name: name.trim(),
    email: email.trim(),
    amount: Number(amount),
    type: type || 'General',
    message: (message || '').trim(),
    date: new Date().toISOString()
  };

  const isNewDonor = !donations.some(d => d.email === newDonation.email);

  donations.push(newDonation);
  totalAmount += newDonation.amount;
  if (isNewDonor) {
    totalDonors++;
  }

  saveDonations();

  console.log(`New Donation received: ${newDonation.name} donated $${newDonation.amount}`);

  res.json({ success: true, message: 'Donation successfully processed!', donation: newDonation });
});

// 7. API endpoint to handle contact form submissions (POST)
app.post('/contact', (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({
      success: false,
      message: 'Please fill in all fields: Name, Email, and Message.'
    });
  }

  console.log(`\n--- New Contact Message Received ---`);
  console.log(`Name: ${name}`);
  console.log(`Email: ${email}`);
  console.log(`Message: ${message}`);
  console.log(`Time: ${new Date().toISOString()}\n`);

  res.json({
    success: true,
    message: 'Your message has been received. We will get back to you soon.'
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`\nServer is running on http://localhost:${PORT}`);
  console.log(`\nGo to http://localhost:${PORT} in your browser.`);
});

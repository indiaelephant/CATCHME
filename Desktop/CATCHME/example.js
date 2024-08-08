const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Route to handle data
app.post('/data', async (req, res) => {
  const { usr_name, usr_email, usr_password, usr_phone } = req.body;

  // Check if all required fields are provided
  if (!usr_name || !usr_email || !usr_password || !usr_phone) {
    return res.status(400).json({ status: 'error', message: 'All fields are required' });
  }

  try {
    // Simulate database operation
    // For example, you could log the data or perform other operations here
    console.log('User registration data:', { usr_name, usr_email, usr_password, usr_phone });

    // Respond with success
    res.status(200).json({ status: 'success', message: 'Registration Successful' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

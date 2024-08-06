const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// In-memory user store (for demonstration purposes)
let users = [];

// Route to handle registration
app.post('/data', (req, res) => {
  const { stu_nick, stu_id, stu_gender, password } = req.body;

  // Check if all required fields are provided
  if (!stu_nick || !stu_id || !stu_gender || !password) {
    return res.status(400).json({ status: 'error', message: 'All fields are required' });
  }

  // Check for duplicate ID
  const userExists = users.find(user => user.stu_id === stu_id);
  if (userExists) {
    return res.status(400).json({ status: 'duplicate', message: '이미 존재하는 아이디입니다.' });
  }

  // Add new user to the store
  users.push({ stu_nick, stu_id, stu_gender, password });
  console.log({stu_nick}, {stu_id}, {stu_gender}, {password});
  // Respond with success
  res.status(200).json({ status: 'success', message: 'Registration Successful' });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

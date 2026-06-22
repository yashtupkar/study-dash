const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const fs = require('fs');
const dotenv = require('dotenv');

let envConfig = {};
if (fs.existsSync('.env')) {
  envConfig = dotenv.parse(fs.readFileSync('.env'));
}

const app = express();
const PORT = envConfig.PORT || process.env.PORT || 5000;
const MONGO_URI = envConfig.MONGO_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/study-dash';

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(helmet());
app.use(morgan('dev'));

// Database Connection
console.log('Connecting to MongoDB...');
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB successfully connected.'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/subjects', require('./routes/subjects'));
app.use('/api/progress', require('./routes/progress'));
app.use('/api/mocks', require('./routes/mocks'));
app.use('/api/notes', require('./routes/notes'));
app.use('/api/today-tasks', require('./routes/tasks'));
app.use('/api', require('./routes/settings'));

app.get('/', (req, res) => {
  res.json({ message: 'N-Day Study Dashboard API is running.' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

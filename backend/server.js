const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/auth', require('./routes/authRoutes'));
app.use('/users', require('./routes/userRoutes'));
app.use('/bookings', require('./routes/bookingRoutes'));
app.use('/reviews', require('./routes/reviewRoutes'));
app.use('/admin', require('./routes/adminRoutes'));
app.use('/payments', require('./routes/paymentRoutes'));   // ✅ correct

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'TravelX API is running 🚀' });
});

app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.path}` });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error.' });
});

connectDB()
  .then(() => {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  });
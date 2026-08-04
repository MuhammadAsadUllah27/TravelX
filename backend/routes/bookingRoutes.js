const express = require('express');
const router = express.Router();
const Booking = require('../models/booking');
const { auth } = require('../middleware/auth');

// ── GET all bookings for the logged-in user ──
router.get('/my-bookings', auth, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const bookings = await Booking.find({ userId }).sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET booking history (for user dashboard) ──
router.get('/my-history', auth, async (req, res) => {
  // if you store history in a separate collection, adjust; otherwise just return all bookings
  try {
    const userId = req.user._id || req.user.id;
    const bookings = await Booking.find({ userId }).sort({ updatedAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── CREATE a new booking ──
router.post('/', auth, async (req, res) => {
  try {
    const { name, email, phone, date, destination, flight, hotel, passengers } = req.body;
    const userId = req.user._id || req.user.id;

    const booking = new Booking({
      userId,
      name,
      email,
      phone,
      date,
      destination,
      flight,
      hotel,
      passengers,
      // status will default to 'pending'
    });

    await booking.save();
    res.status(201).json({ message: 'Booking created successfully', booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── UPDATE a booking ──
router.put('/:id', auth, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const booking = await Booking.findOne({ _id: req.params.id, userId });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot edit a cancelled booking.' });
    }

    const { destination, flight, hotel, date, phone, passengers } = req.body;
    booking.destination = destination || booking.destination;
    booking.flight = flight || booking.flight;
    booking.hotel = hotel || booking.hotel;
    booking.date = date || booking.date;
    booking.phone = phone || booking.phone;
    booking.passengers = passengers || booking.passengers;
    // status remains unchanged (if it was pending, it stays pending until payment)

    await booking.save();
    res.json({ message: 'Booking updated', booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── DELETE (cancel) a booking ──
router.delete('/:id', auth, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const booking = await Booking.findOne({ _id: req.params.id, userId });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    booking.status = 'cancelled';
    await booking.save();
    res.json({ message: 'Booking cancelled' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
// routes/admin.js
//
// Public GET routes (used by main-site booking form & destinations grid):
//   GET  /admin/flights
//   GET  /admin/hotels
//   GET  /admin/hotels/by-destination/:dest
//   GET  /admin/destinations
//
// Admin-only routes (require role === 'admin' JWT):
//   GET    /admin/stats
//   POST   /admin/flights
//   PUT    /admin/flights/:id
//   DELETE /admin/flights/:id
//   POST   /admin/hotels
//   PUT    /admin/hotels/:id
//   DELETE /admin/hotels/:id
//   POST   /admin/destinations
//   PUT    /admin/destinations/:id
//   DELETE /admin/destinations/:id
//   GET    /admin/bookings
//   GET    /admin/users

const express     = require('express')
const router      = express.Router()
const mongoose    = require('mongoose')
const {auth, adminAuth}   = require('../middleware/auth')
const User        = require('../models/user')
const Booking     = require('../models/booking')
const Flight      = require('../models/flight')
const Hotel       = require('../models/hotel')
const Destination = require('../models/destination')


// ════════════════════════════════════════════════════
//  STATS  (admin only)
// ════════════════════════════════════════════════════

// GET /admin/stats
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const [totalUsers, totalBookings, totalFlights, totalHotels] = await Promise.all([
      User.countDocuments(),
      Booking.countDocuments(),
      Flight.countDocuments(),
      Hotel.countDocuments()
    ])
    res.json({ totalUsers, totalBookings, totalFlights, totalHotels })
  } catch (err) {
    console.error('Stats error:', err.message)
    res.status(500).json({ message: 'Could not load stats.' })
  }
})


// ════════════════════════════════════════════════════
//  FLIGHTS
// ════════════════════════════════════════════════════

// GET /admin/flights  —  PUBLIC (booking form needs this without a token)
router.get('/flights', async (req, res) => {
  try {
    const flights = await Flight.find()
      .sort({ createdAt: -1 })
      .populate('destination', '_id name')
      .lean()

    const normalizedFlights = flights.map(flight => {
      const destinationValue = flight.destination
      const destinationName =
        typeof destinationValue === 'object' && destinationValue?.name
          ? destinationValue.name
          : typeof flight.destinationName === 'string'
            ? flight.destinationName
            : null

      return {
        ...flight,
        destinationName,
        destination: destinationName || (typeof destinationValue === 'string' ? destinationValue : null)
      }
    })

    res.json(normalizedFlights)
  } catch (err) {
    console.error('Load flights error:', err.message)
    res.status(500).json({ message: 'Could not load flights.' })
  }
});

// POST /admin/flights  —  admin only
router.post('/flights', adminAuth, async (req, res) => {
  try {
    const {
      airline,
      destination,
      destinationId,
      departureTime,
      price,
      seats,        // frontend might send only this
      totalSeats,   // … or this
      bookedSeats
    } = req.body

    const normalizedSeats   = Number(seats ?? totalSeats ?? 0)
    const normalizedBooked  = Number(bookedSeats || 0)
    const departureDate     = new Date(departureTime)

    const missing = []
    if (!airline) missing.push('airline')
    if (!(destinationId || destination)) missing.push('destination (or destinationId)')
    if (!departureTime || Number.isNaN(departureDate.getTime())) missing.push('departureTime (must be a valid date)')
    if (price === undefined || price === null || Number(price) <= 0) missing.push('price (positive number)')
    if (normalizedSeats < 1 || !Number.isInteger(normalizedSeats)) missing.push('seats (positive whole number)')
    if (normalizedBooked < 0 || !Number.isInteger(normalizedBooked)) missing.push('bookedSeats (non‑negative whole number)')

    if (missing.length) {
      return res.status(400).json({
        message: 'Validation failed. Missing/invalid fields: ' + missing.join(', ')
      })
    }

    let destinationRef = destinationId
    if (!destinationRef && destination) {
      if (mongoose.Types.ObjectId.isValid(destination)) {
        destinationRef = destination
      } else {
        const destDoc = await Destination.findOne({
          name: new RegExp(`^${destination}$`, 'i')
        })
        if (!destDoc) {
          return res.status(404).json({ message: 'Destination not found.' })
        }
        destinationRef = destDoc._id
      }
    }

    const availableSeats = Math.max(normalizedSeats - normalizedBooked, 0)

    const flight = await Flight.create({
      airline:        airline.trim(),
      destination:    destinationRef,
      departureTime:  departureDate,
      price:          Number(price),
      totalSeats:     normalizedSeats,
      availableSeats: availableSeats
    })

    res.status(201).json({ message: 'Flight added.', flight })
  } catch (err) {
    console.error('Add flight error:', err)
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message })
    }
    res.status(500).json({ message: 'Could not add flight.' })
  }
})

// PUT /admin/flights/:id  —  admin only
router.put('/flights/:id', adminAuth, async (req, res) => {
  try {
    const flight = await Flight.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    if (!flight) return res.status(404).json({ message: 'Flight not found.' })
    res.json({ message: 'Flight updated.', flight })
  } catch (err) {
    console.error('Update flight error:', err.message)
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message })
    }
    res.status(500).json({ message: 'Could not update flight.' })
  }
})

// DELETE /admin/flights/:id  —  admin only
router.delete('/flights/:id', adminAuth, async (req, res) => {
  try {
    const flight = await Flight.findByIdAndDelete(req.params.id)
    if (!flight) return res.status(404).json({ message: 'Flight not found.' })
    res.json({ message: 'Flight deleted.' })
  } catch (err) {
    console.error('Delete flight error:', err.message)
    res.status(500).json({ message: 'Could not delete flight.' })
  }
})


// ════════════════════════════════════════════════════
//  HOTELS
// ════════════════════════════════════════════════════

// GET /admin/hotels  —  PUBLIC
router.get('/hotels', async (req, res) => {
  try {
    const hotels = await Hotel.find().sort({ createdAt: -1 })
    res.json(hotels)
  } catch (err) {
    res.status(500).json({ message: 'Could not load hotels.' })
  }
})

// GET /admin/hotels/by-destination/:dest  —  PUBLIC
router.get('/hotels/by-destination/:dest', async (req, res) => {
  try {
    const hotels = await Hotel
      .find({ destination: new RegExp(`^${req.params.dest}$`, 'i') })
      .sort({ stars: -1 })
    res.json(hotels)
  } catch (err) {
    console.error('Hotels by destination error:', err.message)
    res.status(500).json({ message: 'Could not load hotels.' })
  }
})

// POST /admin/hotels  —  admin only
router.post('/hotels', adminAuth, async (req, res) => {
  try {
    const { name, destination, stars, pricePerNight, imageUrl, image } = req.body

    const missing = []
    if (!name) missing.push('name')
    if (!destination) missing.push('destination')
    if (pricePerNight === undefined || pricePerNight === null || Number(pricePerNight) <= 0)
      missing.push('pricePerNight (positive number)')

    if (missing.length) {
      return res.status(400).json({
        message: 'Validation failed. Missing/invalid fields: ' + missing.join(', ')
      })
    }

    const hotel = await Hotel.create({
      name:          name.trim(),
      destination:   destination.trim(),
      stars:         Number(stars) || 3,
      pricePerNight: Number(pricePerNight),
      imageUrl:      (imageUrl || image || '').trim()
    })
    res.status(201).json({ message: 'Hotel added.', hotel })
  } catch (err) {
    console.error('Add hotel error:', err.message)
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message })
    }
    res.status(500).json({ message: 'Could not add hotel.' })
  }
})

// PUT /admin/hotels/:id  —  admin only
router.put('/hotels/:id', adminAuth, async (req, res) => {
  try {
    const hotel = await Hotel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    if (!hotel) return res.status(404).json({ message: 'Hotel not found.' })
    res.json({ message: 'Hotel updated.', hotel })
  } catch (err) {
    console.error('Update hotel error:', err.message)
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message })
    }
    res.status(500).json({ message: 'Could not update hotel.' })
  }
})

// DELETE /admin/hotels/:id  —  admin only
router.delete('/hotels/:id', adminAuth, async (req, res) => {
  try {
    const hotel = await Hotel.findByIdAndDelete(req.params.id)
    if (!hotel) return res.status(404).json({ message: 'Hotel not found.' })
    res.json({ message: 'Hotel deleted.' })
  } catch (err) {
    console.error('Delete hotel error:', err.message)
    res.status(500).json({ message: 'Could not delete hotel.' })
  }
})


// ════════════════════════════════════════════════════
//  DESTINATIONS
// ════════════════════════════════════════════════════

// GET /admin/destinations  —  PUBLIC (main site destinations grid)
router.get('/destinations', async (req, res) => {
  try {
    const destinations = await Destination.find().sort({ createdAt: -1 })
    res.json(destinations)
  } catch (err) {
    res.status(500).json({ message: 'Could not load destinations.' })
  }
})

// POST /admin/destinations  —  admin only
router.post('/destinations', adminAuth, async (req, res) => {
  try {
    const { name, description, price, imageUrl, country } = req.body

    const missing = []
    if (!name) missing.push('name')
    if (!description) missing.push('description')
    if (price === undefined || price === null || Number(price) <= 0) missing.push('price (positive number)')

    if (missing.length) {
      return res.status(400).json({
        message: 'Validation failed. Missing/invalid fields: ' + missing.join(', ')
      })
    }

    const dest = await Destination.create({
      name:        name.trim(),
      description: description.trim(),
      price:       Number(price),
      imageUrl:    (imageUrl || '').trim(),
      country:     (country || '').trim()
    })
    res.status(201).json({ message: 'Destination added.', dest })
  } catch (err) {
    console.error('Add destination error:', err.message)
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message })
    }
    res.status(500).json({ message: 'Could not add destination.' })
  }
})

// PUT /admin/destinations/:id  —  admin only
router.put('/destinations/:id', adminAuth, async (req, res) => {
  try {
    const dest = await Destination.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    if (!dest) return res.status(404).json({ message: 'Destination not found.' })
    res.json({ message: 'Destination updated.', dest })
  } catch (err) {
    console.error('Update destination error:', err.message)
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message })
    }
    res.status(500).json({ message: 'Could not update destination.' })
  }
})

// DELETE /admin/destinations/:id  —  admin only
router.delete('/destinations/:id', adminAuth, async (req, res) => {
  try {
    const dest = await Destination.findByIdAndDelete(req.params.id)
    if (!dest) return res.status(404).json({ message: 'Destination not found.' })
    res.json({ message: 'Destination deleted.' })
  } catch (err) {
    console.error('Delete destination error:', err.message)
    res.status(500).json({ message: 'Could not delete destination.' })
  }
})


// ════════════════════════════════════════════════════
//  ALL BOOKINGS  —  admin read-only table
// ════════════════════════════════════════════════════

// GET /admin/bookings
router.get('/bookings', auth, adminAuth, async (req, res) => {
  try {
    // ✅ Removed `.populate('user')` – user info is stored directly in booking
    const bookings = await Booking
      .find()
      .sort({ createdAt: -1 })
    res.json(bookings)
  } catch (err) {
    console.error('Admin bookings error:', err.message)
    res.status(500).json({ message: 'Could not load bookings.' })
  }
})


// ════════════════════════════════════════════════════
//  ALL USERS  —  admin read-only table
// ════════════════════════════════════════════════════

// GET /admin/users
router.get('/users', adminAuth, async (req, res) => {
  try {
    const users = await User
      .find()
      .select('-password')
      .sort({ createdAt: -1 })
    res.json(users)
  } catch (err) {
    console.error('Admin users error:', err.message)
    res.status(500).json({ message: 'Could not load users.' })
  }
})


module.exports = router
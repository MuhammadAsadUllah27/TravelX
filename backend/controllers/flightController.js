const mongoose = require("mongoose")
const { ObjectId } = mongoose.Types
const { getDB } = require("../config/db")

// ── Helper: validate MongoDB ObjectId format
const isValidObjectId = (id) => ObjectId.isValid(id) && String(new ObjectId(id)) === id

// ── Helper: validate date string is a real future date
const isFutureDate = (dateStr) => {
  const date = new Date(dateStr)
  return !isNaN(date.getTime()) && date > new Date()
}


// ─────────────────────────────
// ADD FLIGHT  (admin only)
// ─────────────────────────────
exports.addFlight = async (req, res) => {
  try {
    const db = getDB()
    const { airline, from, to, departureDate, returnDate, price, seats, type } = req.body

    // Validate required fields
    if (!airline || !from || !to || !departureDate || !price || !seats || !type) {
      return res.status(400).json({ message: "All fields are required." })
    }

    // Validate flight type
    const validTypes = ["one-way", "round-trip"]
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: "Type must be 'one-way' or 'round-trip'." })
    }

    // Validate departure date is in the future
    if (!isFutureDate(departureDate)) {
      return res.status(400).json({ message: "Departure date must be a valid future date." })
    }

    // Round-trip requires a return date after departure
    if (type === "round-trip") {
      if (!returnDate) {
        return res.status(400).json({ message: "Return date is required for round-trip flights." })
      }
      if (!isFutureDate(returnDate)) {
        return res.status(400).json({ message: "Return date must be a valid future date." })
      }
      if (new Date(returnDate) <= new Date(departureDate)) {
        return res.status(400).json({ message: "Return date must be after departure date." })
      }
    }

    // Validate price
    const numericPrice = Number(price)
    if (isNaN(numericPrice) || numericPrice <= 0) {
      return res.status(400).json({ message: "Price must be a positive number." })
    }

    // Validate seat count
    const numericSeats = Number(seats)
    if (isNaN(numericSeats) || numericSeats < 1 || !Number.isInteger(numericSeats)) {
      return res.status(400).json({ message: "Seats must be a positive whole number." })
    }

    // Prevent same origin and destination
    if (from.trim().toLowerCase() === to.trim().toLowerCase()) {
      return res.status(400).json({ message: "Origin and destination cannot be the same." })
    }

    const flight = {
      airline:       airline.trim(),
      from:          from.trim().toUpperCase(),    // e.g. LHR, JFK
      to:            to.trim().toUpperCase(),
      departureDate: new Date(departureDate),
      returnDate:    type === "round-trip" ? new Date(returnDate) : null,
      price:         numericPrice,
      seats:         numericSeats,                 // available seats
      type,
      createdAt:     new Date()
    }

    const result = await db.collection("flights").insertOne(flight)

    res.status(201).json({
      message: "Flight added successfully!",
      id: result.insertedId
    })

  } catch (err) {
    console.error("Add Flight Error:", err)
    res.status(500).json({ message: "Failed to add flight." })
  }
}


// ─────────────────────────────
// SEARCH FLIGHTS
// GET /flights?from=&to=&date=&type=
// ─────────────────────────────
exports.searchFlights = async (req, res) => {
  try {
    const db = getDB()
    const { from, to, date, type } = req.query

    // At least from and to are required for a search
    if (!from || !to) {
      return res.status(400).json({ message: "Origin and destination are required." })
    }

    const filter = {
      from: from.trim().toUpperCase(),
      to:   to.trim().toUpperCase(),
      seats: { $gt: 0 }              // only show flights with available seats
    }

    // Filter by flight type if provided
    if (type && ["one-way", "round-trip"].includes(type)) {
      filter.type = type
    }

    // Filter by departure date (match the whole day)
    if (date) {
      const start = new Date(date)
      const end   = new Date(date)
      end.setDate(end.getDate() + 1)
      filter.departureDate = { $gte: start, $lt: end }
    }

    const flights = await db.collection("flights")
      .find(filter)
      .sort({ price: 1 })            // cheapest first
      .toArray()

    res.json(flights)

  } catch (err) {
    console.error("Search Flights Error:", err)
    res.status(500).json({ message: "Failed to search flights." })
  }
}


// ─────────────────────────────
// GET SINGLE FLIGHT BY ID
// ─────────────────────────────
exports.getFlightById = async (req, res) => {
  try {
    const db = getDB()

    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid flight ID." })
    }

    const flight = await db.collection("flights").findOne({
      _id: new ObjectId(req.params.id)
    })

    if (!flight) {
      return res.status(404).json({ message: "Flight not found." })
    }

    res.json(flight)

  } catch (err) {
    console.error("Get Flight Error:", err)
    res.status(500).json({ message: "Failed to fetch flight." })
  }
}


// ─────────────────────────────
// UPDATE FLIGHT  (admin only)
// ─────────────────────────────
exports.updateFlight = async (req, res) => {
  try {
    const db = getDB()

    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid flight ID." })
    }

    const { airline, from, to, departureDate, returnDate, price, seats, type } = req.body
    const updateData = {}

    if (airline !== undefined) updateData.airline = airline.trim()
    if (from    !== undefined) updateData.from    = from.trim().toUpperCase()
    if (to      !== undefined) updateData.to      = to.trim().toUpperCase()
    if (type    !== undefined) {
      if (!["one-way", "round-trip"].includes(type)) {
        return res.status(400).json({ message: "Type must be 'one-way' or 'round-trip'." })
      }
      updateData.type = type
    }

    if (departureDate !== undefined) {
      if (!isFutureDate(departureDate)) {
        return res.status(400).json({ message: "Departure date must be a valid future date." })
      }
      updateData.departureDate = new Date(departureDate)
    }

    if (returnDate !== undefined) {
      if (!isFutureDate(returnDate)) {
        return res.status(400).json({ message: "Return date must be a valid future date." })
      }
      updateData.returnDate = new Date(returnDate)
    }

    if (price !== undefined) {
      const numericPrice = Number(price)
      if (isNaN(numericPrice) || numericPrice <= 0) {
        return res.status(400).json({ message: "Price must be a positive number." })
      }
      updateData.price = numericPrice
    }

    if (seats !== undefined) {
      const numericSeats = Number(seats)
      if (isNaN(numericSeats) || numericSeats < 0 || !Number.isInteger(numericSeats)) {
        return res.status(400).json({ message: "Seats must be a non-negative whole number." })
      }
      updateData.seats = numericSeats
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No fields provided to update." })
    }

    const result = await db.collection("flights").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Flight not found." })
    }

    res.json({ message: "Flight updated successfully!" })

  } catch (err) {
    console.error("Update Flight Error:", err)
    res.status(500).json({ message: "Failed to update flight." })
  }
}


// ─────────────────────────────
// DELETE FLIGHT  (admin only)
// ─────────────────────────────
exports.deleteFlight = async (req, res) => {
  try {
    const db = getDB()

    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid flight ID." })
    }

    const result = await db.collection("flights").deleteOne({
      _id: new ObjectId(req.params.id)
    })

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Flight not found." })
    }

    res.json({ message: "Flight deleted successfully!" })

  } catch (err) {
    console.error("Delete Flight Error:", err)
    res.status(500).json({ message: "Failed to delete flight." })
  }
}
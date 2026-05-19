// Import ObjectId from MongoDB so we can convert string IDs to MongoDB format
const { ObjectId } = require("mongodb")

// Import the database connection function
const { getDB } = require("../config/db")

// Import the Booking model function (creates a booking object)
const Booking = require("../models/booking")

// Import the BookingHistory model function (creates a history record)
const BookingHistory = require("../models/bookingHistory")

// Import the CancelledBooking model function (creates a cancelled record)
const CancelledBooking = require("../models/cancelledBooking")

// ─────────────────────────────────────────────────────────────
// NOTE: Removed the broken import below — it was unused and
// caused a crash because "param" does not exist in bookingRoutes
// ❌ REMOVED: const { param } = require("../routes/bookingRoutes")
// ─────────────────────────────────────────────────────────────



// ─────────────────────────────────────────────────────────────
// CREATE BOOKING
// Saves a new booking into the "bookings" collection
// ─────────────────────────────────────────────────────────────

// Export createBooking so it can be used in the router
exports.createBooking = async (req, res) => {

  try {

    // Get the active database connection
    const db = getDB()

    // Build a booking object using the Booking model
    // Spread req.body to get all fields sent from the frontend form
    // Also attach the logged-in user's ID and email from the auth token
    const booking = Booking({
      ...req.body,              // name, email, phone, date, destination, flight, hotel
      userId: req.user.id,      // logged-in user's ID (from auth middleware)
      userEmail: req.user.email // logged-in user's email (from auth middleware)
    })

    // Insert the new booking document into the "bookings" collection
    await db.collection("bookings").insertOne(booking)

    // Send a 201 Created response with a success message
    res.status(201).json({
      message: "Booking successful!"
    })

  } catch (err) {

    // Print the error in the terminal for debugging
    console.error("Create Booking Error:", err)

    // Send a 500 Internal Server Error response to the frontend
    res.status(500).json({
      message: "Failed to create booking"
    })
  }
}



// ─────────────────────────────────────────────────────────────
// GET MY ACTIVE BOOKINGS
// Returns all bookings that belong to the logged-in user
// ─────────────────────────────────────────────────────────────

// Export getMyBookings so it can be used in the router
exports.getMyBookings = async (req, res) => {

  try {

    // Get the active database connection
    const db = getDB()

    // Find all documents in "bookings" where userEmail matches the logged-in user
    // Sort by createdAt descending so newest bookings appear first
    // Convert the cursor to a plain JavaScript array
    const bookings = await db.collection("bookings")
      .find({ userEmail: req.user.email })
      .sort({ createdAt: -1 })
      .toArray()

    // Send the bookings array back to the frontend as JSON
    res.json(bookings)

  } catch (err) {

    // Log the error in the terminal
    console.error("Get My Bookings Error:", err)

    // Send a 500 error response if something went wrong
    res.status(500).json({
      message: "Failed to fetch bookings"
    })
  }
}



// ─────────────────────────────────────────────────────────────
// GET BOOKING HISTORY
// Returns the edit/cancel history for the logged-in user
// History is stored in the "bookingHistory" collection
// ─────────────────────────────────────────────────────────────

// Export getMyHistory so it can be used in the router
exports.getMyHistory = async (req, res) => {

  try {

    // Get the active database connection
    const db = getDB()

    // Find all history records where userEmail matches the logged-in user
    // Sort by savedAt descending so newest history appears first
    // Convert the cursor to a plain JavaScript array
    const history = await db.collection("bookingHistory")
      .find({ userEmail: req.user.email })
      .sort({ savedAt: -1 })
      .toArray()

    // Send the history array to the frontend
    res.json(history)

  } catch (err) {

    // Log the error in the terminal
    console.error("Get History Error:", err)

    // Send a 500 error response
    res.status(500).json({
      message: "Failed to fetch history"
    })
  }
}



// ─────────────────────────────────────────────────────────────
// GET ALL BOOKINGS (ADMIN USE)
// Returns every booking in the database regardless of user
// ─────────────────────────────────────────────────────────────

// Export getAllBookings so it can be used in the router
exports.getAllBookings = async (req, res) => {

  try {

    // Get the active database connection
    const db = getDB()

    // Fetch ALL documents from the "bookings" collection
    const data = await db.collection("bookings").find().toArray()

    // Send all bookings to the frontend
    res.json(data)

  } catch (err) {

    // Log the error
    console.error("Get All Bookings Error:", err)

    // Send a 500 error response
    res.status(500).json({
      message: "Failed to fetch all bookings"
    })
  }
}



// ─────────────────────────────────────────────────────────────
// UPDATE BOOKING
// Steps:
//   1. Find the existing booking by ID
//   2. Save the old booking data into bookingHistory (audit trail)
//   3. Update the booking with new values
//
// ❌ BUG FIXED: The old code used _id: id (plain string) in the
//    updateOne() query. MongoDB stores _id as ObjectId, not string.
//    That's why editing never worked — the query matched nothing.
// ✅ FIX: Changed _id: id → _id: new ObjectId(id) in updateOne()
// ─────────────────────────────────────────────────────────────

// Export updateBooking so it can be used in the router
exports.updateBooking = async (req, res) => {

  try {

    // Get the active database connection
    const db = getDB()

    // Get the booking ID from the URL parameter (e.g. /bookings/123)
    const id = req.params.id


    // ── STEP 1: FIND THE EXISTING BOOKING ─────────────────

    // Search for the booking using its ObjectId AND the logged-in user's email
    // This ensures users can only edit THEIR OWN bookings
    const existing = await db.collection("bookings").findOne({
      _id: new ObjectId(id),      // Convert string ID to MongoDB ObjectId format
      userEmail: req.user.email   // Security check — must belong to this user
    })

    // If no booking was found, return a 404 error
    if (!existing) {
      return res.status(404).json({
        message: "Booking not found or not authorized"
      })
    }


    // ── STEP 2: SAVE OLD BOOKING INTO HISTORY ─────────────

    // Build a history record using the BookingHistory model
    // This saves a snapshot of the booking BEFORE the edit
    const historyRecord = BookingHistory({
      bookingId:   existing._id.toString(), // Store original booking ID as string
      userId:      existing.userId,         // Store user ID
      userEmail:   existing.userEmail,      // Store user email
      name:        existing.name,           // Store old customer name
      email:       existing.email,          // Store old customer email
      phone:       existing.phone,          // Store old phone number
      date:        existing.date,           // Store old travel date
      destination: existing.destination,   // Store old destination
      flight:      existing.flight,         // Store old flight choice
      hotel:       existing.hotel,          // Store old hotel choice
      status:      existing.status,         // Store old booking status
      action:      "edited"                 // Mark this history record as an edit
    })

    // Insert the history record into the "bookingHistory" collection
    await db.collection("bookingHistory").insertOne(historyRecord)


    // ── STEP 3: UPDATE THE BOOKING WITH NEW DATA ──────────

    // ✅ BUG FIX: _id must use new ObjectId(id) — NOT plain string id
    // Without this fix, MongoDB could never find the document to update
    await db.collection("bookings").updateOne(

      // Filter: find the booking by its ObjectId AND user email
      {
        _id: new ObjectId(id),     // ✅ FIXED: was _id: id (string) — now ObjectId
        userEmail: req.user.email  // Ensures the user owns this booking
      },

      // Update: set only the changed fields
      {
        $set: {
          destination: req.body.destination, // New destination value
          flight:      req.body.flight,      // New flight value
          hotel:       req.body.hotel,       // New hotel value
          date:        req.body.date,        // New travel date
          phone:       req.body.phone,       // New phone number
          updatedAt:   new Date()            // Record the time of this update
        }
      }
    )

    // Send a success response back to the frontend
    res.json({
      message: "Booking updated successfully!"
    })

  } catch (err) {

    // Log the error in the terminal
    console.error("Update Booking Error:", err)

    // Send a 500 error response
    res.status(500).json({
      message: "Failed to update booking"
    })
  }
}



// ─────────────────────────────────────────────────────────────
// CANCEL BOOKING
// Steps:
//   1. Find the existing booking
//   2. Save it to "bookingHistory" with action = "cancelled"
//      so it appears in the dashboard History tab
//   3. Save it to "cancelledBookings" collection as well
//   4. Delete it from the active "bookings" collection
//
// ❌ BUG FIXED: The old code ONLY saved to cancelledBookings.
//    The frontend History tab reads from "bookingHistory" collection.
//    So cancelled bookings never appeared in the History tab.
// ✅ FIX: Also insert a record into "bookingHistory" with action "cancelled"
// ─────────────────────────────────────────────────────────────

// Export cancelBooking so it can be used in the router
exports.cancelBooking = async (req, res) => {

  try {

    // Get the active database connection
    const db = getDB()

    // Get the booking ID from the URL (e.g. /bookings/123)
    const id = req.params.id


    // ── STEP 1: FIND THE EXISTING BOOKING ─────────────────

    // Find booking by ObjectId AND user email for security
    const existing = await db.collection("bookings").findOne({
      _id: new ObjectId(id),     // Convert string to MongoDB ObjectId
      userEmail: req.user.email  // Ensure the booking belongs to this user
    })

    // If booking not found, return 404
    if (!existing) {
      return res.status(404).json({
        message: "Booking not found or not authorized"
      })
    }


    // ── STEP 2: SAVE TO bookingHistory (for History tab) ──

    // ✅ BUG FIX: This was missing — without it, cancelled bookings
    // never appeared in the dashboard History tab
    const historyRecord = BookingHistory({
      bookingId:   existing._id.toString(), // Original booking ID
      userId:      existing.userId,         // User ID
      userEmail:   existing.userEmail,      // User email
      name:        existing.name,           // Customer name
      email:       existing.email,          // Customer email
      phone:       existing.phone,          // Phone number
      date:        existing.date,           // Travel date
      destination: existing.destination,   // Destination
      flight:      existing.flight,         // Flight
      hotel:       existing.hotel,          // Hotel
      status:      existing.status,         // Status at time of cancel
      action:      "cancelled"              // Mark as cancelled (not edited)
    })

    // Insert into bookingHistory so it shows in the History tab
    await db.collection("bookingHistory").insertOne(historyRecord)


    // ── STEP 3: SAVE TO cancelledBookings COLLECTION ──────

    // Build a cancelled booking record using the CancelledBooking model
    const record = CancelledBooking({
      bookingId:   existing._id.toString(), // Original booking reference
      userId:      existing.userId,         // User ID
      userEmail:   existing.userEmail,      // User email
      name:        existing.name,           // Customer name
      email:       existing.email,          // Customer email
      phone:       existing.phone,          // Phone number
      date:        existing.date,           // Travel date
      destination: existing.destination,   // Destination
      flight:      existing.flight,         // Flight
      hotel:       existing.hotel,          // Hotel
      status:      existing.status          // Original status
    })

    // Insert into the cancelledBookings collection as a permanent archive
    await db.collection("cancelledBookings").insertOne(record)


    // ── STEP 4: DELETE FROM ACTIVE BOOKINGS ───────────────

    // Remove the booking from the active "bookings" collection
    await db.collection("bookings").deleteOne({
      _id: new ObjectId(id),     // Match by ObjectId
      userEmail: req.user.email  // Double-check ownership for safety
    })

    // Send a success response to the frontend
    res.json({
      message: "Booking cancelled successfully!"
    })

  } catch (err) {

    // Log the error in the terminal
    console.error("Cancel Booking Error:", err)

    // Send a 500 error response
    res.status(500).json({
      message: "Failed to cancel booking"
    })
  }
}



// ─────────────────────────────────────────────────────────────
// GET MY CANCELLED BOOKINGS
// Returns all cancelled bookings for the logged-in user
// ─────────────────────────────────────────────────────────────

// Export getMyCancelledBookings so it can be used in the router
exports.getMyCancelledBookings = async (req, res) => {

  try {

    // Get the active database connection
    const db = getDB()

    // Find all cancelled bookings that belong to the logged-in user
    // Sort by cancelledAt descending so most recent cancellations appear first
    const data = await db.collection("cancelledBookings")
      .find({ userEmail: req.user.email })
      .sort({ cancelledAt: -1 })
      .toArray()

    // Send the cancelled bookings array to the frontend
    res.json(data)

  } catch (err) {

    // Log the error in the terminal
    console.error("Get Cancelled Bookings Error:", err)

    // Send a 500 error response
    res.status(500).json({
      message: "Failed to fetch cancelled bookings"
    })
  }
}
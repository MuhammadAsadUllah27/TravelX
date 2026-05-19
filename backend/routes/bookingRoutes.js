// Import Express framework
const express = require("express")

// Create router object
// Router helps create separate route files
const router = express.Router()

// Import booking controller
// Controller contains all booking-related functions
const controller = require("../controllers/bookingController")

// Import authentication middleware
// auth checks if user is logged in
const auth = require("../middleware/auth")

// ─────────────────────────────
// CREATE BOOKING ROUTE
// ─────────────────────────────

// POST request to create a new booking
// Route:
// /bookings
//
// auth:
// Verifies logged-in user
//
// controller.createBooking:
// Adds booking into database
router.post("/", auth, controller.createBooking)

// ─────────────────────────────
// GET MY BOOKINGS ROUTE
// ─────────────────────────────

// GET request to fetch current user's bookings
// Route:
// /bookings/my-bookings
//
// auth:
// Checks user authentication
//
// controller.getMyBookings:
// Returns logged-in user's bookings
router.get("/my-bookings", auth, controller.getMyBookings)

// ─────────────────────────────
// GET MY BOOKING HISTORY ROUTE
// ─────────────────────────────

// GET request to fetch booking edit/cancel history
// Route:
// /bookings/my-history
//
// auth:
// Verifies user
//
// controller.getMyHistory:
// Returns booking history records
router.get("/my-history", auth, controller.getMyHistory)

// ─────────────────────────────
// GET ALL BOOKINGS ROUTE
// ─────────────────────────────

// GET request to fetch all bookings
// Route:
// /bookings/all
//
// auth:
// Requires authentication
//
// controller.getAllBookings:
// Returns all bookings from database
router.get("/all", auth, controller.getAllBookings)

// ─────────────────────────────
// UPDATE BOOKING ROUTE
// ─────────────────────────────

// PUT request to update a booking
// Route Example:
// /bookings/123
//
// auth:
// Verifies user
//
// controller.updateBooking:
// Updates booking information
router.put("/:id", auth, controller.updateBooking)

// ─────────────────────────────
// CANCEL BOOKING ROUTE
// ─────────────────────────────

// DELETE request to cancel/delete booking
// Route Example:
// /bookings/123
//
// auth:
// Checks authentication
//
// controller.cancelBooking:
// Cancels booking from database
router.delete("/:id", auth, controller.cancelBooking)

// ─────────────────────────────
// GET MY CANCELLED BOOKINGS ROUTE
// ─────────────────────────────

// GET request to fetch cancelled bookings
// Route:
// /bookings/my-cancelled
//
// auth:
// Verifies logged-in user
//
// controller.getMyCancelledBookings:
// Returns cancelled bookings of current user
router.get(
  "/my-cancelled",
  auth,
  controller.getMyCancelledBookings
)

// Export router
// Allows this route file to be used in server.js
module.exports = router
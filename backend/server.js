// Import Express framework
// Express is used to create the backend server
const express = require("express")

// Import CORS middleware
// CORS allows frontend and backend to communicate
const cors = require("cors")

// Import database connection function
const { connectDB } = require("./config/db")

// Import authentication routes
// Handles register and login APIs
const authRoutes = require("./routes/authRoutes")

// Import booking routes
// Handles booking-related APIs
const bookingRoutes = require("./routes/bookingRoutes")

// Import statistics routes
// Handles stats APIs
const statsRoutes = require("./routes/statsRoutes")

// Import user routes
// Handles profile update and delete account APIs
const userRoutes = require("./routes/userRoutes")

// Import review routes
// Handles review APIs
const reviewRoutes = require("./routes/reviewRoutes")

// Create Express application
const app = express()

// Set server port
// Use environment PORT if available, otherwise use 3000
const PORT = process.env.PORT || 3000

// ─────────────────────────────
// MIDDLEWARE
// Middleware runs before routes
// ─────────────────────────────

// Enable CORS
app.use(cors())

// Allow server to read JSON data
app.use(express.json())

// ─────────────────────────────
// ROUTES
// Define API routes
// ─────────────────────────────

// Authentication routes
// Example:
// /auth/register
// /auth/login
app.use("/auth", authRoutes)

// Booking routes
// Example:
// /bookings
// /bookings/:id
// /bookings/my-bookings
app.use("/bookings", bookingRoutes)

// Statistics routes
// Example:
// /stats
app.use("/stats", statsRoutes)

// User routes
// Example:
// /users/update-profile
// /users/delete-account
app.use("/users", userRoutes)

// Review routes
// Example:
// /reviews
app.use("/reviews", reviewRoutes)

// ─────────────────────────────
// 404 HANDLER
// Runs if route does not exist
// ─────────────────────────────
app.use((req, res) => {

  // Send 404 response
  res.status(404).json({ message: "Route not found" })
})

// ─────────────────────────────
// GLOBAL ERROR HANDLER
// Handles server errors
// ─────────────────────────────
app.use((err, req, res, next) => {

  // Print error in terminal
  console.error("Unhandled Error:", err)

  // Send server error response
  res.status(500).json({ message: "Internal server error" })
})

// ─────────────────────────────
// START SERVER FUNCTION
// ─────────────────────────────
async function startServer() {

  try {

    // Connect to MongoDB database
    await connectDB()

    // Start Express server
    app.listen(PORT, () => {

      // Print server running message
      console.log(`Server running on http://localhost:${PORT}`)
    })

  } 
  catch (error) {

    // Print startup error
    console.error("Failed to start server:", error)

    // Stop application if server fails
    process.exit(1)
  }
}

// Call function to start server
startServer()
// Import Express framework
const express = require("express")

// Create a router object
// Router helps organize routes separately
const router = express.Router()

// Import database connection function
// getDB() gives access to MongoDB database
const { getDB } = require("../config/db")

// ─────────────────────────────
// GET /stats ROUTE
// ─────────────────────────────

// Create GET API route
// URL:
// /stats
router.get("/", async (req, res) => {

  try {

    // Get database instance
    const db = getDB()

    // Access "bookings" collection
    // aggregate() is used for data analysis/grouping
    const stats = await db.collection("bookings").aggregate([

      // GROUP STAGE
      {
        $group: {

          // Group bookings by destination
          // Example:
          // Paris, Dubai, Turkey
          _id: "$destination",

          // Count total bookings for each destination
          totalBookings: { $sum: 1 }
        }
      },

      // SORT STAGE
      {
        // Sort results in descending order
        // Highest bookings appear first
        $sort: { totalBookings: -1 }
      }

    ]).toArray()

    // Send successful response with stats data
    res.status(200).json(stats)

  } catch (error) {

    // Print error in terminal
    console.error("Stats Error:", error)

    // Send error response to frontend
    res.status(500).json({
      message: "Failed to load stats"
    })
  }
})

// Export router
// Allows this route file to be used in server.js
module.exports = router
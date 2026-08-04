// Import Express framework
const express = require("express")

// Create router object
// Router is used to create separate route files
const router = express.Router()

// Import review controller
// Controller contains all review-related functions
const controller = require("../controllers/reviewController")

// Import authentication middleware
// auth middleware checks if user is logged in
const {auth, adminAuth} = require("../middleware/auth")

// ─────────────────────────────
// ADD REVIEW ROUTE
// ─────────────────────────────

// POST request to add a new review
// Route:
// /reviews
//
// auth:
// Verifies user token before allowing access
//
// controller.addReview:
// Function that adds review into database
router.post("/", auth, controller.addReview)

// ─────────────────────────────
// GET LATEST REVIEWS ROUTE
// ─────────────────────────────

// GET request to fetch latest reviews
// Route:
// /reviews/latest
//
// No authentication required
//
// controller.getLatestReviews:
// Returns latest reviews from database
router.get("/latest", controller.getLatestReviews)

// ─────────────────────────────
// GET MY REVIEWS ROUTE
// ─────────────────────────────

// GET request to fetch logged-in user's reviews
// Route:
// /reviews/my-reviews
//
// auth:
// Checks if user is authenticated
//
// controller.getMyReviews:
// Returns reviews created by current user
router.get("/my-reviews", auth, controller.getMyReviews)



// ─────────────────────────────
// DELETE REVIEW ROUTE
// ─────────────────────────────

// DELETE request to remove a review
// Route Example:
// /reviews/123
//
// auth:
// Verifies user before deletion
//
// controller.deleteReview:
// Deletes review from database
router.delete("/:id", auth, controller.deleteReview)

// Export router
// Allows this file to be used in server.js
module.exports = router
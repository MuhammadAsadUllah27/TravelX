// Import ObjectId from MongoDB
// Used to convert string IDs into MongoDB Object IDs
const { ObjectId } = require("mongodb")
// Import database getter function
// This gives access to MongoDB database
const { getDB }    = require("../config/db")
// Import Review model/template
const Review       = require("../models/review")

// ── ADD REVIEW ────────────────────────────────────────────────────────
// Export controller function to add a review
exports.addReview = async (req, res) => {
  try {
    // Get database connection
    const db = getDB()
    // Extract data from request body
    const { destination, rating, comment } = req.body
    // Validate required fields
    if (!destination || !rating || !comment) {
      // Return 400 Bad Request if fields missing
      return res.status(400).json({ message: "All fields are required." })
    }
    // Validate rating range
    if (rating < 1 || rating > 5) {
      // Rating must be between 1 and 5
      return res.status(400).json({ message: "Rating must be 1–5." })
    }
    // Create review object using Review model
    const review = Review({
      // Logged-in user ID from auth middleware
      userId:      req.user.id,
      // Logged-in user name
      userName:    req.user.name,
      // Logged-in user email
      userEmail:   req.user.email,
      // Travel destination
      destination,
      // Convert rating string into number
      rating:      Number(rating),
      // User comment
      comment
    })
    // Insert review into MongoDB reviews collection
    await db.collection("reviews").insertOne(review)
    // Send success response
    res.status(201).json({ message: "Review submitted!" })
  } catch (err) {
    // Print error in terminal
    console.error("Add Review Error:", err)
    // Send server error response
    res.status(500).json({ message: "Failed to submit review" })
  }
}

// ── GET REVIEWS FOR A DESTINATION ─────────────────────────────────────
// Export function to get reviews by destination
exports.getReviewsByDestination = async (req, res) => {
  try {
    // Get database connection
    const db      = getDB()
    // Find reviews matching destination
    const reviews = await db.collection("reviews")
      // Search by destination from URL parameter
      .find({ destination: req.params.destination })
      // Sort newest reviews first
      .sort({ createdAt: -1 })
      // Convert MongoDB cursor into array
      .toArray()
      // Send reviews to frontend
    res.json(reviews)
  } catch (err) {
    // Send error response
    res.status(500).json({ message: "Failed to fetch reviews" })
  }
}

// ── GET MY REVIEWS ────────────────────────────────────────────────────
// Export function to get current user's reviews
exports.getMyReviews = async (req, res) => {
  try {
    // Get database
    const db      = getDB()
    // Find reviews written by logged-in user
    const reviews = await db.collection("reviews")
      // Match user email
      .find({ userEmail: req.user.email })
      // Newest first
      .sort({ createdAt: -1 })
      // Convert to array
      .toArray()
      // Send reviews
    res.json(reviews)
  } catch (err) {
    // Error response
    res.status(500).json({ message: "Failed to fetch reviews" })
  }
}

// ── DELETE MY REVIEW ──────────────────────────────────────────────────
// Export delete review controller
exports.deleteReview = async (req, res) => {
  try {
    // Get database
    const db     = getDB()
    // Delete review matching ID and user email
    const result = await db.collection("reviews").deleteOne({
      // Convert URL ID string into MongoDB ObjectId
      _id:       new ObjectId(req.params.id),
      // Ensure user can delete only own review
      userEmail: req.user.email
    })
    // If no review deleted
    if (result.deletedCount === 0) {
      // Either review not found
      // OR user not authorized
      return res.status(404).json({ message: "Review not found or not authorized" })
    }
    // Success response
    res.json({ message: "Review deleted!" })
  } catch (err) {
    // Server error responses
    res.status(500).json({ message: "Failed to delete review" })
  }
}

// ── LATEST REVIEWS (homepage widget) ─────────────────────────────────
// Export function for homepage latest reviews
exports.getLatestReviews = async (req, res) => {
  try {
    // Get database
    const db      = getDB()
    // Find latest reviews
    const reviews = await db.collection("reviews")
      // Get all reviews
      .find()
      // Sort newest first
      .sort({ createdAt: -1 })
      // Limit to latest 6 reviews
      .limit(6)
      // Convert cursor into array
      .toArray()
    // Send reviews to frontend
    res.json(reviews)
  } catch (err) {
    // Error response
    res.status(500).json({ message: "Failed to fetch latest reviews" })
  }
}
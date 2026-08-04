const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;
const { getDB } = require("../config/db");
const Review = require("../models/review");

// ── Helper: check if a string is a valid MongoDB ObjectId
const isValidObjectId = (id) =>
  ObjectId.isValid(id) && String(new ObjectId(id)) === id;

// ─────────────────────────────────────────────────────────────
// ADD REVIEW
// ─────────────────────────────────────────────────────────────
exports.addReview = async (req, res) => {
  try {
    const db = getDB();   // ⬅️ THIS WAS MISSING – ADD IT BACK
    const { rating, comment } = req.body;

    // Validate required fields
    if (rating === undefined || !comment) {
      return res.status(400).json({ message: "Rating and comment are required." });
    }

    // Validate rating is a number
    const numericRating = Number(rating);
    if (isNaN(numericRating)) {
      return res.status(400).json({ message: "Rating must be a number." });
    }

    // Validate rating range
    if (numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5." });
    }

    // Sanitise comment
    const trimmedComment = comment.trim();
    if (!trimmedComment) {
      return res.status(400).json({ message: "Comment cannot be empty." });
    }

    // Build review document
    const review = new Review({
      userId:    req.user.id,
      userName:  req.user.name,
      userEmail: req.user.email,
      rating:    numericRating,
      comment:   trimmedComment,
    });

    // Insert using native driver (or you could use review.save() with Mongoose)
    await db.collection("reviews").insertOne(review);

    res.status(201).json({ message: "Review submitted!" });
  } catch (err) {
    console.error("Add Review Error:", err);
    res.status(500).json({ message: "Failed to submit review." });
  }
};

// ─────────────────────────────────────────────────────────────
// GET MY REVIEWS
// ─────────────────────────────────────────────────────────────
exports.getMyReviews = async (req, res) => {
  try {
    const db = getDB();
    const reviews = await db
      .collection("reviews")
      .find({ userEmail: req.user.email })
      .sort({ createdAt: -1 })
      .toArray();
    res.json(reviews);
  } catch (err) {
    console.error("Get My Reviews Error:", err);
    res.status(500).json({ message: "Failed to fetch reviews." });
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE MY REVIEW
// ─────────────────────────────────────────────────────────────
exports.deleteReview = async (req, res) => {
  try {
    const db = getDB();
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid review ID." });
    }

    const result = await db.collection("reviews").deleteOne({
      _id:       new ObjectId(req.params.id),
      userEmail: req.user.email,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Review not found or not authorized." });
    }

    res.json({ message: "Review deleted!" });
  } catch (err) {
    console.error("Delete Review Error:", err);
    res.status(500).json({ message: "Failed to delete review." });
  }
};

// ─────────────────────────────────────────────────────────────
// LATEST REVIEWS (homepage widget)
// ─────────────────────────────────────────────────────────────
exports.getLatestReviews = async (req, res) => {
  try {
    const db = getDB();
    const limit = Math.min(parseInt(req.query.limit) || 6, 20);

    const reviews = await db
      .collection("reviews")
      .find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    res.json(reviews);
  } catch (err) {
    console.error("Get Latest Reviews Error:", err);
    res.status(500).json({ message: "Failed to fetch latest reviews." });
  }
};

// ─────────────────────────────────────────────────────────────
// (Optional) GET REVIEWS BY DESTINATION – removed because no destination
// ─────────────────────────────────────────────────────────────
// If you still have this route, return a 404 or delete it entirely.
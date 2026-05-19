// Import Express framework
const express = require("express")

// Create a router object
// Router is used to define routes separately
const router = express.Router()

// Import user controller
// Controller contains the logic/functions
const controller = require("../controllers/userController")

// Import authentication middleware
// This checks if user is logged in or not
const auth = require("../middleware/auth")

// ─────────────────────────────
// UPDATE PROFILE ROUTE
// ─────────────────────────────

// PUT request for updating user profile
// Route:
// /users/update-profile
//
// auth middleware:
// First checks JWT token and verifies user
//
// controller.updateProfile:
// Runs the update profile function
router.put("/update-profile", auth, controller.updateProfile)

// ─────────────────────────────
// DELETE ACCOUNT ROUTE
// ─────────────────────────────

// DELETE request for deleting user account
// Route:
// /users/delete-account
//
// auth middleware:
// First verifies user authentication
//
// controller.deleteAccount:
// Runs delete account function
router.delete("/delete-account", auth, controller.deleteAccount)

// Export router
// Allows this route file to be used in server.js
module.exports = router
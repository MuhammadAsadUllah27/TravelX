// Import Express framework
const express = require("express")

// Create router object
// Router is used to manage routes separately
const router = express.Router()

// Import authentication controller
// Controller contains register, login, and profile functions
const controller = require("../controllers/authController")

// Import authentication middleware
// auth middleware verifies JWT token
const {auth, adminAuth} = require("../middleware/auth")

// ─────────────────────────────
// AUTH ROUTES
// Handles registration and login
// ─────────────────────────────

// POST request for user registration
// Route:
// /auth/register
//
// controller.register:
// Creates new user account
router.post("/register", controller.register)

// POST request for user login
// Route:
// /auth/login
//
// controller.login:
// Authenticates user and returns token
router.post("/login", controller.login)

// ─────────────────────────────
// USER PROFILE ROUTES
// Handles profile management
// ─────────────────────────────

// GET request to fetch current logged-in user profile
// Route:
// /auth/me
//
// auth:
// Verifies user token
//
// controller.getProfile:
// Returns user profile data
router.get("/me", auth, controller.getProfile)

// PUT request to update current user profile
// Route:
// /auth/me
//
// auth:
// Checks authentication
//
// controller.updateProfile:
// Updates user information
router.put("/me", auth, controller.updateProfile)

// DELETE request to remove current user account
// Route:
// /auth/me
//
// auth:
// Verifies user
//
// controller.deleteAccount:
// Deletes user account from database
router.delete("/me", auth, controller.deleteAccount)

// Export router
// Allows this file to be used inside server.js
module.exports = router

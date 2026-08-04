// Import Express framework
const express = require("express")

// Create a router object
const router = express.Router()

// Import user controller
const controller = require("../controllers/userController")

// Import auth middleware
const { auth } = require("../middleware/auth")

// ─────────────────────────────
// UPDATE PROFILE
// ─────────────────────────────
router.put("/update-profile", auth, controller.updateProfile)

// ─────────────────────────────
// DELETE ACCOUNT
// ─────────────────────────────
router.delete("/delete-account", auth, controller.deleteAccount)

// Export router
module.exports = router
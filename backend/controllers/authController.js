// Import bcrypt library for hashing passwords securely
const bcrypt = require("bcryptjs")

// Import JWT library for generating authentication tokens
const jwt = require("jsonwebtoken")

// Import User model
const User = require("../models/user")

// Import database connection function
const { getDB } = require("../config/db")

// Secret key used for JWT token generation
const SECRET = "travelx_secret_key"




// ─────────────────────────────────────────────────────────────
// REGISTER USER
// Creates a new user account
// ─────────────────────────────────────────────────────────────
exports.register = async (req, res) => {

  try {

    // Get MongoDB database connection
    const db = getDB()

    // Extract data sent from frontend
    const { name, email, password } = req.body



    // ── VALIDATION ──────────────────────────────────────────
    // Check if all fields are filled

    if (!name || !email || !password) {

      return res.status(400).json({
        message: "Please fill all fields."
      })
    }



    // ── CHECK IF EMAIL ALREADY EXISTS ──────────────────────

    const existingUser = await db.collection("users").findOne({

      // Match email
      email
    })



    // If user already exists
    if (existingUser) {

      return res.status(400).json({
        message: "Email already registered."
      })
    }



    // ── HASH PASSWORD ──────────────────────────────────────
    // Encrypt password before saving

    const hashedPassword = await bcrypt.hash(password, 10)



    // ── CREATE USER OBJECT ─────────────────────────────────

    const user = User({

      // Save name
      name,

      // Save email
      email,

      // Save encrypted password
      password: hashedPassword
    })



    // ── SAVE USER INTO DATABASE ────────────────────────────

    const result = await db.collection("users").insertOne(user)



    // ── GENERATE JWT TOKEN ─────────────────────────────────
    // Token is used for authentication

    const token = jwt.sign(

      // Payload data inside token
      {
        id: result.insertedId,
        name,
        email
      },

      // Secret key
      SECRET,

      // Token expiry
      {
        expiresIn: "7d"
      }
    )



    // ── SEND RESPONSE ──────────────────────────────────────

    res.status(201).json({

      message: "Registration successful!",

      token,

      name,

      email
    })

  } catch (error) {

    // Print error in terminal
    console.error("Register Error:", error)



    // Send server error response
    res.status(500).json({
      message: "Server error during registration."
    })
  }
}




// ─────────────────────────────────────────────────────────────
// LOGIN USER
// Checks email and password for authentication
// ─────────────────────────────────────────────────────────────
exports.login = async (req, res) => {

  try {

    // Get database connection
    const db = getDB()

    // Get email and password from frontend
    const { email, password } = req.body



    // ── VALIDATION ──────────────────────────────────────────

    if (!email || !password) {

      return res.status(400).json({
        message: "Please fill all fields."
      })
    }



    // ── FIND USER IN DATABASE ──────────────────────────────

    const user = await db.collection("users").findOne({

      email
    })



    // If user does not exist
    if (!user) {

      return res.status(400).json({
        message: "Email not found."
      })
    }



    // ── COMPARE PASSWORD ───────────────────────────────────
    // Compare entered password with hashed password

    const match = await bcrypt.compare(

      password,

      user.password
    )



    // If password is incorrect
    if (!match) {

      return res.status(400).json({
        message: "Wrong password."
      })
    }



    // ── GENERATE JWT TOKEN ─────────────────────────────────

    const token = jwt.sign(

      // Data stored in token
      {
        id: user._id,
        name: user.name,
        email: user.email
      },

      // Secret key
      SECRET,

      // Token expiry time
      {
        expiresIn: "7d"
      }
    )



    // ── SEND SUCCESS RESPONSE ──────────────────────────────

    res.json({

      message: "Login successful!",

      token,

      name: user.name,

      email: user.email
    })

  } catch (error) {

    // Print error in terminal
    console.error("Login Error:", error)



    // Send server error
    res.status(500).json({
      message: "Server error during login."
    })
  }
}




// ─────────────────────────────────────────────────────────────
// GET PROFILE
// Fetch logged-in user's profile
// ─────────────────────────────────────────────────────────────
exports.getProfile = async (req, res) => {

  try {

    // Get database connection
    const db = getDB()



    // Find user using logged-in email
    const user = await db.collection("users").findOne({

      email: req.user.email
    })



    // Send user data
    res.json(user)

  } catch (error) {

    // Send error response
    res.status(500).json({
      message: "Error fetching profile"
    })
  }
}




// ─────────────────────────────────────────────────────────────
// UPDATE PROFILE
// Updates logged-in user's profile data
// ─────────────────────────────────────────────────────────────
exports.updateProfile = async (req, res) => {

  try {

    // Get database connection
    const db = getDB()



    // Extract updated name from frontend
    const { name } = req.body



    // Update user data
    await db.collection("users").updateOne(

      // Find user by email
      {
        email: req.user.email
      },

      // Update fields
      {
        $set: {

          name
        }
      }
    )



    // Send success response
    res.json({
      message: "Profile updated"
    })

  } catch (error) {

    // Send error response
    res.status(500).json({
      message: "Update failed"
    })
  }
}




// ─────────────────────────────────────────────────────────────
// DELETE ACCOUNT
// Permanently removes user account
// ─────────────────────────────────────────────────────────────
exports.deleteAccount = async (req, res) => {

  try {

    // Get database connection
    const db = getDB()



    // Delete user from database
    await db.collection("users").deleteOne({

      // Match logged-in user's email
      email: req.user.email
    })



    // Send success response
    res.json({
      message: "Account deleted"
    })

  } catch (error) {

    // Send error response
    res.status(500).json({
      message: "Delete failed"
    })
  }
}
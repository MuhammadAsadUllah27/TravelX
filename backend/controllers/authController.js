const bcrypt = require("bcryptjs")
const jwt    = require("jsonwebtoken")
const { getDB } = require("../config/db")

// ── Load secrets at module level (not inside each handler)
const SECRET     = process.env.JWT_SECRET || "dev-secret"
const ADMIN_CODE = process.env.ADMIN_CODE  || "admin-secret"

// ── Simple email format check
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)


// ─────────────────────────────────────────────────────────────
// REGISTER USER
// ─────────────────────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const db = getDB()
    const { name, email, password, role: requestedRole, adminCode } = req.body

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please fill all fields." })
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Invalid email format." })
    }

    // Validate password length
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters." })
    }

    // Normalise email
    const normalisedEmail = email.trim().toLowerCase()

    // Check if email already exists
    const existingUser = await db.collection("users").findOne({ email: normalisedEmail })
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered." })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // FIX: trim adminCode before comparing so accidental leading/trailing
    //      whitespace in the form field never silently breaks admin signup.
    //      If the code doesn't match, fall back to "user" — never error out.
    const role =
      requestedRole === "admin" && adminCode?.trim() === ADMIN_CODE
        ? "admin"
        : "user"

    // Build user document
    const userObj = {
      name:      name.trim(),
      email:     normalisedEmail,
      password:  hashedPassword,
      role: req.body.role === "admin" ? "admin" : "user",
      createdAt: new Date()
    }

    const result = await db.collection("users").insertOne(userObj)

    // Generate JWT
    const token = jwt.sign(
      { id: result.insertedId.toString(), name: userObj.name, email: normalisedEmail, role: userObj.role },
      SECRET,
      { expiresIn: "7d" }
    )

    res.status(201).json({
      message: "Registration successful!",
      token,
      name:  userObj.name,
      email: normalisedEmail,
      role:  userObj.role
    })

  } catch (error) {
    console.error("Register Error:", error)
    res.status(500).json({ message: "Server error during registration." })
  }
}


// ─────────────────────────────────────────────────────────────
// LOGIN USER
// ─────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const db = getDB()
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: "Please fill all fields." })
    }

    const normalisedEmail = email.trim().toLowerCase()
    const user = await db.collection("users").findOne({ email: normalisedEmail })

    // Generic message — don't reveal whether the email exists
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password." })
    }

    const match = await bcrypt.compare(password, user.password)
    if (!match) {
      return res.status(400).json({ message: "Invalid email or password." })
    }

    const token = jwt.sign(
      { id: user._id.toString(), name: user.name, email: user.email, role: user.role },
      SECRET,
      { expiresIn: "7d" }
    )

    res.json({
      message: "Login successful!",
      token,
      name:  user.name,
      email: user.email,
      role:  user.role
    })

  } catch (error) {
    console.error("Login Error:", error)
    res.status(500).json({ message: "Server error during login." })
  }
}


// ─────────────────────────────────────────────────────────────
// GET PROFILE
// ─────────────────────────────────────────────────────────────
exports.getProfile = async (req, res) => {
  try {
    const db = getDB()

    const user = await db.collection("users").findOne(
      { email: req.user.email },
      { projection: { password: 0 } }   // never send the hashed password
    )

    if (!user) {
      return res.status(404).json({ message: "User not found." })
    }

    res.json(user)

  } catch (error) {
    console.error("GetProfile Error:", error)
    res.status(500).json({ message: "Error fetching profile." })
  }
}


// ─────────────────────────────────────────────────────────────
// UPDATE PROFILE
// FIX: the original only updated `name`. The profile form also
//      sends `email` and `password` — those were silently
//      ignored. Now all three are handled properly.
// ─────────────────────────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const db = getDB()
    const { name, email, password } = req.body

    const updates = {}

    // Update name if provided
    if (name?.trim()) {
      updates.name = name.trim()
    }

    // Update email if provided and valid
    if (email?.trim()) {
      const newEmail = email.trim().toLowerCase()

      if (!isValidEmail(newEmail)) {
        return res.status(400).json({ message: "Invalid email format." })
      }

      // Make sure the new email isn't already taken by a different user
      const taken = await db.collection("users").findOne({ email: newEmail })
      if (taken && taken.email !== req.user.email) {
        return res.status(400).json({ message: "Email already in use." })
      }

      updates.email = newEmail
    }

    // Update password if provided and long enough
    if (password) {
      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters." })
      }
      updates.password = await bcrypt.hash(password, 10)
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "Nothing to update." })
    }

    await db.collection("users").updateOne(
      { email: req.user.email },
      { $set: updates }
    )

    // Fetch the updated document so we can return the fresh name & email
    // (important when the email itself changed)
    const updatedUser = await db.collection("users").findOne(
      { email: updates.email || req.user.email },
      { projection: { password: 0 } }
    )

    res.json({
      message: "Profile updated.",
      name:    updatedUser.name,
      email:   updatedUser.email
    })

  } catch (error) {
    console.error("UpdateProfile Error:", error)
    res.status(500).json({ message: "Update failed." })
  }
}


// ─────────────────────────────────────────────────────────────
// DELETE ACCOUNT
// ─────────────────────────────────────────────────────────────
exports.deleteAccount = async (req, res) => {
  try {
    const db = getDB()

    const result = await db.collection("users").deleteOne({ email: req.user.email })

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "User not found." })
    }

    res.json({ message: "Account deleted." })

  } catch (error) {
    console.error("DeleteAccount Error:", error)
    res.status(500).json({ message: "Delete failed." })
  }
}
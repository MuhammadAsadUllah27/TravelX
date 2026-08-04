const mongoose = require("mongoose")
const { ObjectId } = mongoose.Types
const { getDB } = require("../config/db")
const bcrypt = require("bcryptjs")

// ── Helper: validate MongoDB ObjectId format
const isValidObjectId = (id) => ObjectId.isValid(id) && String(new ObjectId(id)) === id

// ── Helper: basic email format check
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)


// ─────────────────────────────
// UPDATE PROFILE
// ─────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const db = getDB()
    const { name, email, password } = req.body

    // Validate ObjectId before using it
    if (!isValidObjectId(req.user.id)) {
      return res.status(400).json({ message: "Invalid user ID." })
    }

    // Build update object only from fields that were actually sent
    const updateData = {}

    if (name !== undefined) {
      const trimmedName = name.trim()
      if (!trimmedName) {
        return res.status(400).json({ message: "Name cannot be empty." })
      }
      updateData.name = trimmedName
    }

    if (email !== undefined) {
      const normalisedEmail = email.trim().toLowerCase()
      if (!isValidEmail(normalisedEmail)) {
        return res.status(400).json({ message: "Invalid email format." })
      }

      // Check the new email isn't already taken by someone else
      const existing = await db.collection("users").findOne({
        email: normalisedEmail,
        _id: { $ne: new ObjectId(req.user.id) }   // exclude current user
      })
      if (existing) {
        return res.status(400).json({ message: "Email already in use." })
      }

      updateData.email = normalisedEmail
    }

    if (password !== undefined && password.trim() !== "") {
      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters." })
      }
      updateData.password = await bcrypt.hash(password, 10)
    }

    // Nothing to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No fields provided to update." })
    }

    await db.collection("users").updateOne(
      { _id: new ObjectId(req.user.id) },
      { $set: updateData }
    )

    res.json({
      message: "Profile updated successfully!",
      // Only return what was actually updated
      ...(updateData.name  && { name:  updateData.name }),
      ...(updateData.email && { email: updateData.email })
    })

  } catch (err) {
    console.error("Update Profile Error:", err)
    res.status(500).json({ message: "Failed to update profile." })
  }
}


// ─────────────────────────────
// DELETE ACCOUNT
// ─────────────────────────────
exports.deleteAccount = async (req, res) => {
  try {
    const db = getDB()

    // Validate ObjectId before using it
    if (!isValidObjectId(req.user.id)) {
      return res.status(400).json({ message: "Invalid user ID." })
    }

    // Check user actually exists before attempting deletion
    const user = await db.collection("users").findOne({
      _id: new ObjectId(req.user.id)
    })

    if (!user) {
      return res.status(404).json({ message: "User not found." })
    }

    // Delete all bookings tied to this user first
    await db.collection("bookings").deleteMany({
      userEmail: req.user.email
    })

    // Then delete the user account
    const result = await db.collection("users").deleteOne({
      _id: new ObjectId(req.user.id)
    })

    // Guard against silent failure
    if (result.deletedCount === 0) {
      return res.status(500).json({ message: "Failed to delete account." })
    }

    res.json({ message: "Account deleted successfully!" })

  } catch (err) {
    console.error("Delete Account Error:", err)
    res.status(500).json({ message: "Failed to delete account." })
  }
}
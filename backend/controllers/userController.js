// Import database connection function
const { getDB } = require("../config/db")

// Import ObjectId to convert string ID into MongoDB ObjectId
const { ObjectId } = require("mongodb")

// Import bcrypt for password hashing
const bcrypt = require("bcryptjs")


// ─────────────────────────────
// UPDATE PROFILE
// ─────────────────────────────
exports.updateProfile = async (req, res) => {

  // Get database instance
  const db = getDB()

  // Get updated data from frontend request body
  const { name, email, password } = req.body

  // Create object for fields to update
  const updateData = {
    name,
    email
  }

  // Check if user entered a new password
  if (password && password.trim() !== "") {

    // Hash the password before saving
    updateData.password = await bcrypt.hash(password, 10)
  }

  // Update user document in MongoDB
  await db.collection("users").updateOne(

    // Find user by logged-in user's ID
    { _id: new ObjectId(req.user.id) },

    // Update fields using $set
    { $set: updateData }
  )

  // Send success response
  res.json({
    message: "Profile updated successfully!",
    name,
    email
  })
}

// ─────────────────────────────
// DELETE ACCOUNT
// ─────────────────────────────
exports.deleteAccount = async (req, res) => {

  // Get database instance
  const db = getDB()

  // Delete all bookings related to this user
  await db.collection("bookings").deleteMany({

    // Match bookings using user's email
    userEmail: req.user.email
  })

  // Delete user account from users collection
  await db.collection("users").deleteOne({

    // Find user using logged-in user ID
    _id: new ObjectId(req.user.id)
  })

  // Send success response
  res.json({
    message: "Account deleted successfully!"
  })
}
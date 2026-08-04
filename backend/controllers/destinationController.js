const mongoose = require("mongoose")
const { ObjectId } = mongoose.Types
const { getDB } = require("../config/db")

// ── Helper: validate MongoDB ObjectId format
const isValidObjectId = (id) => ObjectId.isValid(id) && String(new ObjectId(id)) === id


// ─────────────────────────────
// ADD DESTINATION  (admin only)
// ─────────────────────────────
exports.addDestination = async (req, res) => {
  try {
    const db = getDB()
    const { name, country, description, image, price, category } = req.body

    // Validate required fields
    if (!name || !country || !description || !image || !price || !category) {
      return res.status(400).json({ message: "All fields are required." })
    }

    // Validate price is a positive number
    const numericPrice = Number(price)
    if (isNaN(numericPrice) || numericPrice <= 0) {
      return res.status(400).json({ message: "Price must be a positive number." })
    }

    // Prevent duplicate destination names (case-insensitive)
    const existing = await db.collection("destinations").findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") }
    })
    if (existing) {
      return res.status(400).json({ message: "Destination already exists." })
    }

    const destination = {
      name:        name.trim(),
      country:     country.trim(),
      description: description.trim(),
      image:       image.trim(),
      price:       numericPrice,
      category:    category.trim().toLowerCase(),
      createdAt:   new Date()
    }

    const result = await db.collection("destinations").insertOne(destination)

    res.status(201).json({
      message: "Destination added successfully!",
      id: result.insertedId
    })

  } catch (err) {
    console.error("Add Destination Error:", err)
    res.status(500).json({ message: "Failed to add destination." })
  }
}


// ─────────────────────────────
// GET ALL DESTINATIONS
// Supports ?category= and ?search= filters
// ─────────────────────────────
exports.getAllDestinations = async (req, res) => {
  try {
    const db = getDB()
    const { category, search } = req.query

    // Build dynamic filter object
    const filter = {}

    // Filter by category if provided
    if (category) {
      filter.category = category.trim().toLowerCase()
    }

    // Search by name or country (case-insensitive)
    if (search) {
      filter.$or = [
        { name:    { $regex: search.trim(), $options: "i" } },
        { country: { $regex: search.trim(), $options: "i" } }
      ]
    }

    const destinations = await db.collection("destinations")
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray()

    res.json(destinations)

  } catch (err) {
    console.error("Get Destinations Error:", err)
    res.status(500).json({ message: "Failed to fetch destinations." })
  }
}


// ─────────────────────────────
// GET SINGLE DESTINATION BY ID
// ─────────────────────────────
exports.getDestinationById = async (req, res) => {
  try {
    const db = getDB()

    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid destination ID." })
    }

    const destination = await db.collection("destinations").findOne({
      _id: new ObjectId(req.params.id)
    })

    if (!destination) {
      return res.status(404).json({ message: "Destination not found." })
    }

    res.json(destination)

  } catch (err) {
    console.error("Get Destination Error:", err)
    res.status(500).json({ message: "Failed to fetch destination." })
  }
}


// ─────────────────────────────
// UPDATE DESTINATION  (admin only)
// ─────────────────────────────
exports.updateDestination = async (req, res) => {
  try {
    const db = getDB()

    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid destination ID." })
    }

    const { name, country, description, image, price, category } = req.body
    const updateData = {}

    // Only include fields that were actually sent
    if (name        !== undefined) updateData.name        = name.trim()
    if (country     !== undefined) updateData.country     = country.trim()
    if (description !== undefined) updateData.description = description.trim()
    if (image       !== undefined) updateData.image       = image.trim()
    if (category    !== undefined) updateData.category    = category.trim().toLowerCase()

    if (price !== undefined) {
      const numericPrice = Number(price)
      if (isNaN(numericPrice) || numericPrice <= 0) {
        return res.status(400).json({ message: "Price must be a positive number." })
      }
      updateData.price = numericPrice
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No fields provided to update." })
    }

    const result = await db.collection("destinations").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Destination not found." })
    }

    res.json({ message: "Destination updated successfully!" })

  } catch (err) {
    console.error("Update Destination Error:", err)
    res.status(500).json({ message: "Failed to update destination." })
  }
}


// ─────────────────────────────
// DELETE DESTINATION  (admin only)
// ─────────────────────────────
exports.deleteDestination = async (req, res) => {
  try {
    const db = getDB()

    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid destination ID." })
    }

    const result = await db.collection("destinations").deleteOne({
      _id: new ObjectId(req.params.id)
    })

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Destination not found." })
    }

    res.json({ message: "Destination deleted successfully!" })

  } catch (err) {
    console.error("Delete Destination Error:", err)
    res.status(500).json({ message: "Failed to delete destination." })
  }
}
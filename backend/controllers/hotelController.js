const mongoose = require("mongoose")
const { ObjectId } = mongoose.Types
const { getDB } = require("../config/db")

// ── Helper: validate MongoDB ObjectId format
const isValidObjectId = (id) => ObjectId.isValid(id) && String(new ObjectId(id)) === id


// ─────────────────────────────
// ADD HOTEL  (admin only)
// ─────────────────────────────
exports.addHotel = async (req, res) => {
  try {
    const db = getDB()
    const { name, destination, stars, pricePerNight, image, amenities } = req.body

    // Validate required fields
    if (!name || !destination || !stars || !pricePerNight || !image) {
      return res.status(400).json({ message: "All fields are required." })
    }

    // Validate star rating (1–5)
    const numericStars = Number(stars)
    if (isNaN(numericStars) || numericStars < 1 || numericStars > 5) {
      return res.status(400).json({ message: "Stars must be between 1 and 5." })
    }

    // Validate price per night
    const numericPrice = Number(pricePerNight)
    if (isNaN(numericPrice) || numericPrice <= 0) {
      return res.status(400).json({ message: "Price per night must be a positive number." })
    }

    const hotel = {
      name:          name.trim(),
      destination:   destination.trim(),
      stars:         numericStars,
      pricePerNight: numericPrice,
      image:         image.trim(),
      // amenities is optional — default to empty array if not sent
      amenities:     Array.isArray(amenities) ? amenities.map(a => a.trim()) : [],
      createdAt:     new Date()
    }

    const result = await db.collection("hotels").insertOne(hotel)

    res.status(201).json({
      message: "Hotel added successfully!",
      id: result.insertedId
    })

  } catch (err) {
    console.error("Add Hotel Error:", err)
    res.status(500).json({ message: "Failed to add hotel." })
  }
}


// ─────────────────────────────
// GET HOTELS BY DESTINATION
// Supports ?minPrice= ?maxPrice= ?stars= filters
// ─────────────────────────────
exports.getHotelsByDestination = async (req, res) => {
  try {
    const db = getDB()
    const destination = req.params.destination?.trim()

    if (!destination) {
      return res.status(400).json({ message: "Destination is required." })
    }

    const { minPrice, maxPrice, stars } = req.query
    const filter = {
      // Case-insensitive destination match
      destination: { $regex: new RegExp(`^${destination}$`, "i") }
    }

    // Optional price range filter
    if (minPrice || maxPrice) {
      filter.pricePerNight = {}
      if (minPrice) filter.pricePerNight.$gte = Number(minPrice)
      if (maxPrice) filter.pricePerNight.$lte = Number(maxPrice)
    }

    // Optional star rating filter
    if (stars) {
      filter.stars = Number(stars)
    }

    const hotels = await db.collection("hotels")
      .find(filter)
      .sort({ pricePerNight: 1 })   // cheapest first
      .toArray()

    res.json(hotels)

  } catch (err) {
    console.error("Get Hotels Error:", err)
    res.status(500).json({ message: "Failed to fetch hotels." })
  }
}


// ─────────────────────────────
// GET SINGLE HOTEL BY ID
// ─────────────────────────────
exports.getHotelById = async (req, res) => {
  try {
    const db = getDB()

    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid hotel ID." })
    }

    const hotel = await db.collection("hotels").findOne({
      _id: new ObjectId(req.params.id)
    })

    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found." })
    }

    res.json(hotel)

  } catch (err) {
    console.error("Get Hotel Error:", err)
    res.status(500).json({ message: "Failed to fetch hotel." })
  }
}


// ─────────────────────────────
// UPDATE HOTEL  (admin only)
// ─────────────────────────────
exports.updateHotel = async (req, res) => {
  try {
    const db = getDB()

    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid hotel ID." })
    }

    const { name, destination, stars, pricePerNight, image, amenities } = req.body
    const updateData = {}

    if (name        !== undefined) updateData.name        = name.trim()
    if (destination !== undefined) updateData.destination = destination.trim()
    if (image       !== undefined) updateData.image       = image.trim()

    if (amenities !== undefined) {
      if (!Array.isArray(amenities)) {
        return res.status(400).json({ message: "Amenities must be an array." })
      }
      updateData.amenities = amenities.map(a => a.trim())
    }

    if (stars !== undefined) {
      const numericStars = Number(stars)
      if (isNaN(numericStars) || numericStars < 1 || numericStars > 5) {
        return res.status(400).json({ message: "Stars must be between 1 and 5." })
      }
      updateData.stars = numericStars
    }

    if (pricePerNight !== undefined) {
      const numericPrice = Number(pricePerNight)
      if (isNaN(numericPrice) || numericPrice <= 0) {
        return res.status(400).json({ message: "Price per night must be a positive number." })
      }
      updateData.pricePerNight = numericPrice
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No fields provided to update." })
    }

    const result = await db.collection("hotels").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Hotel not found." })
    }

    res.json({ message: "Hotel updated successfully!" })

  } catch (err) {
    console.error("Update Hotel Error:", err)
    res.status(500).json({ message: "Failed to update hotel." })
  }
}


// ─────────────────────────────
// DELETE HOTEL  (admin only)
// ─────────────────────────────
exports.deleteHotel = async (req, res) => {
  try {
    const db = getDB()

    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid hotel ID." })
    }

    const result = await db.collection("hotels").deleteOne({
      _id: new ObjectId(req.params.id)
    })

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Hotel not found." })
    }

    res.json({ message: "Hotel deleted successfully!" })

  } catch (err) {
    console.error("Delete Hotel Error:", err)
    res.status(500).json({ message: "Failed to delete hotel." })
  }
}
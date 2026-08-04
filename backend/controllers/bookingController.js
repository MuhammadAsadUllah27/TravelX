const mongoose = require("mongoose");
const { ObjectId } = mongoose.mongo;
const { getDB } = require("../config/db");

// ── Helper: escape regex special characters ──
function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ── Helper: find a flight by airline name + destination ──
async function findFlight(db, flightName, destination) {
  return db.collection("flights").findOne({
    airline:     { $regex: new RegExp(`^${escapeRegex(flightName.trim())}$`,       "i") },
    destination: { $regex: new RegExp(`^${escapeRegex((destination || "").trim())}$`, "i") },
  });
}

// ── Helper: validate a single booking item from the request body ──
function validateBookingItem(item, index) {
  const errors = [];
  if (!item.destination || !item.destination.trim())
    errors.push(`Booking #${index + 1}: destination is required.`);
  if (!item.flight || !item.flight.trim())
    errors.push(`Booking #${index + 1}: flight is required.`);
  if (!item.date)
    errors.push(`Booking #${index + 1}: date is required.`);
  const passengers = parseInt(item.passengers);
  if (isNaN(passengers) || passengers < 1)
    errors.push(`Booking #${index + 1}: passengers must be at least 1.`);
  if (passengers > 10)
    errors.push(`Booking #${index + 1}: maximum 10 passengers per booking.`);
  return errors;
}

// ─────────────────────────────────────────────
// CREATE BOOKING  (single OR multi-booking)
// ─────────────────────────────────────────────
exports.createBooking = async (req, res) => {
  try {
    const db = getDB();

    const rawItems = Array.isArray(req.body) ? req.body : [req.body];

    if (rawItems.length === 0) {
      return res.status(400).json({ message: "No booking data provided." });
    }

    if (rawItems.length > 20) {
      return res.status(400).json({ message: "Cannot create more than 20 bookings at once." });
    }

    const allErrors = [];
    rawItems.forEach((item, i) => {
      const errs = validateBookingItem(item, i);
      allErrors.push(...errs);
    });

    if (allErrors.length > 0) {
      return res.status(400).json({ message: "Validation failed.", errors: allErrors });
    }

    const batchKeys = rawItems.map(
      (item) => `${item.flight.trim().toLowerCase()}::${item.destination.trim().toLowerCase()}::${item.date}`
    );
    const duplicateKeys = batchKeys.filter((k, i) => batchKeys.indexOf(k) !== i);
    if (duplicateKeys.length > 0) {
      return res.status(400).json({
        message: "Duplicate flight+destination+date combinations detected in your request.",
        duplicates: [...new Set(duplicateKeys)],
      });
    }

    const flightCache = {};
    const seatErrors  = [];

    for (let i = 0; i < rawItems.length; i++) {
      const item       = rawItems[i];
      const passengers = Math.min(10, Math.max(1, parseInt(item.passengers) || 1));
      const cacheKey   = `${item.flight.trim().toLowerCase()}::${item.destination.trim().toLowerCase()}`;

      if (!flightCache[cacheKey]) {
        flightCache[cacheKey] = await findFlight(db, item.flight, item.destination);
      }

      const matchingFlight = flightCache[cacheKey];
      if (matchingFlight) {
        const totalSeats     = Number(matchingFlight.totalSeats || matchingFlight.seats || 0);
        const bookedSeats    = Number(matchingFlight.bookedSeats || 0);

        const alreadyClaimedInBatch = rawItems
          .slice(0, i)
          .filter(
            (prev) =>
              prev.flight.trim().toLowerCase()      === item.flight.trim().toLowerCase() &&
              prev.destination.trim().toLowerCase() === item.destination.trim().toLowerCase()
          )
          .reduce((sum, prev) => sum + Math.min(10, Math.max(1, parseInt(prev.passengers) || 1)), 0);

        const effectiveBooked    = bookedSeats + alreadyClaimedInBatch;
        const availableSeats     = totalSeats - effectiveBooked;

        if (availableSeats < passengers) {
          seatErrors.push(
            `Booking #${i + 1} (${item.flight} → ${item.destination}): ` +
            `only ${availableSeats} seat(s) available, requested ${passengers}.`
          );
        }
      }
    }

    if (seatErrors.length > 0) {
      return res.status(400).json({ message: "Seat availability check failed.", errors: seatErrors });
    }

    const insertedBookings = [];
    const now = new Date();

    for (let i = 0; i < rawItems.length; i++) {
      const item       = rawItems[i];
      const passengers = Math.min(10, Math.max(1, parseInt(item.passengers) || 1));

      const bookingDoc = {
        ...item,
        passengers,
        userId:    req.user.id,
        userEmail: req.user.email,
        status:    item.status || "active",
        createdAt: now,
        updatedAt: now,
      };

      const cacheKey       = `${item.flight.trim().toLowerCase()}::${item.destination.trim().toLowerCase()}`;
      const matchingFlight = flightCache[cacheKey];

      if (matchingFlight) {
        const freshFlight   = await db.collection("flights").findOne({ _id: matchingFlight._id });
        const freshBooked   = Number(freshFlight?.bookedSeats || 0);
        await db.collection("flights").updateOne(
          { _id: matchingFlight._id },
          { $set: { bookedSeats: freshBooked + passengers, updatedAt: now } }
        );
      }

      const insertResult = await db.collection("bookings").insertOne(bookingDoc);

      await db.collection("bookingHistory").insertOne({
        bookingId:   insertResult.insertedId.toString(),
        userId:      req.user.id,
        userEmail:   req.user.email,
        name:        bookingDoc.name,
        email:       bookingDoc.email,
        phone:       bookingDoc.phone,
        date:        bookingDoc.date,
        destination: bookingDoc.destination,
        flight:      bookingDoc.flight,
        hotel:       bookingDoc.hotel,
        passengers,
        status:      bookingDoc.status,
        action:      "booked",
        snapshot: {
          destination: bookingDoc.destination,
          flight:      bookingDoc.flight,
          hotel:       bookingDoc.hotel,
          date:        bookingDoc.date,
          passengers,
        },
        savedAt: now,
      });

      insertedBookings.push({
        bookingId:   insertResult.insertedId.toString(),
        flight:      bookingDoc.flight,
        destination: bookingDoc.destination,
        date:        bookingDoc.date,
        passengers,
      });
    }

    const isBatch = rawItems.length > 1;
    return res.status(201).json({
      message: isBatch
        ? `${insertedBookings.length} booking(s) created successfully!`
        : "Booking successful!",
      bookings: insertedBookings,
    });

  } catch (err) {
    console.error("Create Booking Error:", err);

    if (err.code === 11000) {
      return res.status(409).json({
        message: "A booking with these details already exists.",
      });
    }

    res.status(500).json({ message: "Failed to create booking" });
  }
};

// ─────────────────────────────────────────────
// GET MY BOOKINGS
// ─────────────────────────────────────────────
exports.getMyBookings = async (req, res) => {
  try {
    const db = getDB();
    const bookings = await db.collection("bookings")
      .find({ userEmail: req.user.email })
      .sort({ createdAt: -1 })
      .toArray();
    res.json(bookings);
  } catch (err) {
    console.error("Get My Bookings Error:", err);
    res.status(500).json({ message: "Failed to fetch bookings" });
  }
};

// ─────────────────────────────────────────────
// GET MY HISTORY
// ─────────────────────────────────────────────
exports.getMyHistory = async (req, res) => {
  try {
    const db = getDB();
    const history = await db.collection("bookingHistory")
      .aggregate([
        { $match: { userId: req.user.id } },
        { $sort: { savedAt: -1 } },
        { $group: { _id: "$bookingId", doc: { $first: "$$ROOT" } } },
        { $replaceRoot: { newRoot: "$doc" } },
        { $sort: { savedAt: -1 } },
      ])
      .toArray();
    res.json(history);
  } catch (err) {
    console.error("Get History Error:", err);
    res.status(500).json({ message: "Failed to fetch history" });
  }
};

// ─────────────────────────────────────────────
// GET SINGLE BOOKING (for edit)
// ─────────────────────────────────────────────
exports.getBookingById = async (req, res) => {
  try {
    const db = getDB();
    const id = req.params.id;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid booking ID" });
    }
    const booking = await db.collection("bookings").findOne({
      _id: new ObjectId(id),
      $or: [
        { userEmail: req.user.email },
        { userId:    req.user.id },
      ],
    });
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    res.json(booking);
  } catch (err) {
    console.error("Get Booking Error:", err);
    res.status(500).json({ message: "Failed to fetch booking" });
  }
};

// ─────────────────────────────────────────────
// UPDATE BOOKING
// ─────────────────────────────────────────────
exports.updateBooking = async (req, res) => {
  try {
    const db = getDB();
    const id = req.params.id;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid booking ID" });
    }

    const existing = await db.collection("bookings").findOne({
      _id: new ObjectId(id),
      $or: [
        { userEmail: req.user.email },
        { userId:    req.user.id },
      ],
    });
    if (!existing) {
      return res.status(404).json({ message: "Booking not found or not authorized" });
    }

    const oldPassengers = Number(existing.passengers || 1);
    const newPassengers = Math.min(10, Math.max(1, parseInt(req.body.passengers) || oldPassengers));

    const oldFlight      = (existing.flight      || "").trim().toLowerCase();
    const oldDestination = (existing.destination || "").trim().toLowerCase();
    const newFlight      = (req.body.flight      || "").trim().toLowerCase();
    const newDestination = (req.body.destination || "").trim().toLowerCase();

    const flightChanged      = newFlight && newFlight !== oldFlight;
    const destinationChanged = newDestination && newDestination !== oldDestination;
    const passengersChanged  = newPassengers !== oldPassengers;

    if (existing.flight && (flightChanged || destinationChanged || passengersChanged)) {

      if (flightChanged || destinationChanged) {
        const oldMatchingFlight = await findFlight(db, existing.flight, existing.destination);
        if (oldMatchingFlight) {
          const restored = Math.max(Number(oldMatchingFlight.bookedSeats || 0) - oldPassengers, 0);
          await db.collection("flights").updateOne(
            { _id: oldMatchingFlight._id },
            { $set: { bookedSeats: restored, updatedAt: new Date() } }
          );
        }

        const newMatchingFlight = await findFlight(db, req.body.flight, req.body.destination);
        if (newMatchingFlight) {
          const totalSeats     = Number(newMatchingFlight.totalSeats || newMatchingFlight.seats || 0);
          const bookedSeats    = Number(newMatchingFlight.bookedSeats || 0);
          const availableSeats = totalSeats - bookedSeats;

          if (availableSeats < newPassengers) {
            return res.status(400).json({
              message: `Not enough seats on the new flight. Only ${availableSeats} seat(s) available.`,
            });
          }

          await db.collection("flights").updateOne(
            { _id: newMatchingFlight._id },
            { $set: { bookedSeats: bookedSeats + newPassengers, updatedAt: new Date() } }
          );
        }

      } else if (passengersChanged) {
        const matchingFlight = await findFlight(db, existing.flight, existing.destination);
        if (matchingFlight) {
          const totalSeats            = Number(matchingFlight.totalSeats || matchingFlight.seats || 0);
          const bookedSeats           = Number(matchingFlight.bookedSeats || 0);
          const availableAfterRelease = totalSeats - bookedSeats + oldPassengers;

          if (availableAfterRelease < newPassengers) {
            return res.status(400).json({
              message: `Not enough seats. Only ${availableAfterRelease} seat(s) available for this flight.`,
            });
          }

          const updatedBooked = bookedSeats - oldPassengers + newPassengers;
          await db.collection("flights").updateOne(
            { _id: matchingFlight._id },
            { $set: { bookedSeats: updatedBooked, updatedAt: new Date() } }
          );
        }
      }
    }

    await db.collection("bookingHistory").insertOne({
      bookingId:   existing._id.toString(),
      userId:      existing.userId,
      userEmail:   existing.userEmail,
      name:        existing.name,
      email:       existing.email,
      phone:       existing.phone,
      date:        existing.date,
      destination: existing.destination,
      flight:      existing.flight,
      hotel:       existing.hotel,
      passengers:  oldPassengers,
      status:      existing.status,
      action:      "edited",
      snapshot: {
        destination: existing.destination,
        flight:      existing.flight,
        hotel:       existing.hotel,
        date:        existing.date,
        passengers:  oldPassengers,
      },
      savedAt: new Date(),
    });

    await db.collection("bookings").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          destination: req.body.destination,
          flight:      req.body.flight,
          hotel:       req.body.hotel,
          date:        req.body.date,
          phone:       req.body.phone,
          passengers:  newPassengers,
          updatedAt:   new Date(),
        },
      }
    );

    res.json({ message: "Booking updated successfully!" });
  } catch (err) {
    console.error("Update Booking Error:", err);
    res.status(500).json({ message: "Failed to update booking" });
  }
};

// ─────────────────────────────────────────────
// CANCEL BOOKING
// ─────────────────────────────────────────────
exports.cancelBooking = async (req, res) => {
  const db        = getDB();
  const id        = req.params.id;
  const userEmail = req.user.email.toLowerCase();
  const userId    = req.user.id;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid booking ID" });
  }

  try {
    const existing = await db.collection("bookings").findOne({
      _id: new ObjectId(id),
      $or: [{ userEmail }, { userId }],
    });

    if (!existing) {
      return res.status(404).json({ message: "Booking not found or not authorised." });
    }

    if (existing.status === "cancelled") {
      return res.status(400).json({ message: "This booking has already been cancelled." });
    }

    if (existing.date && new Date(existing.date) < new Date()) {
      return res.status(400).json({ message: "Cannot cancel a booking for a past date." });
    }

    const now        = new Date();
    const passengers = Number(existing.passengers || 1);

    await db.collection("bookings").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status:      "cancelled",
          cancelledAt: now,
          updatedAt:   now,
        },
      }
    );

    await db.collection("bookingHistory").insertOne({
      bookingId:   id,
      userId:      existing.userId,
      userEmail:   existing.userEmail,
      name:        existing.name,
      email:       existing.email,
      phone:       existing.phone,
      destination: existing.destination,
      flight:      existing.flight,
      hotel:       existing.hotel,
      passengers,
      travelDate:  existing.date,
      bookedAt:    existing.createdAt ?? existing.bookedAt ?? null,
      cancelledAt: now,
      action:      "cancelled",
      savedAt:     now,
    });

    if (existing.flight) {
      const matchingFlight = await findFlight(db, existing.flight, existing.destination);
      if (matchingFlight) {
        const restored = Math.max(Number(matchingFlight.bookedSeats || 0) - passengers, 0);
        await db.collection("flights").updateOne(
          { _id: matchingFlight._id },
          { $set: { bookedSeats: restored, updatedAt: now } }
        );
      }
    }

    return res.json({ message: "Booking cancelled successfully!" });

  } catch (err) {
    console.error("Cancel Booking Error:", err);
    return res.status(500).json({ message: "Failed to cancel booking." });
  }
};

// ─────────────────────────────────────────────
// GET MY CANCELLED BOOKINGS
// ─────────────────────────────────────────────
exports.getMyCancelledBookings = async (req, res) => {
  try {
    const db = getDB();
    const data = await db
      .collection("bookings")
      .find({
        status: "cancelled",
        $or: [
          { userEmail: req.user.email.toLowerCase() },
          { userId:    req.user.id },
        ],
      })
      .sort({ cancelledAt: -1 })
      .toArray();
    return res.json(data);
  } catch (err) {
    console.error("Get Cancelled Bookings Error:", err);
    return res.status(500).json({ message: "Failed to fetch cancelled bookings." });
  }
};

// ─────────────────────────────────────────────
// GET BOOKING HISTORY  (full audit trail for a user)
// ─────────────────────────────────────────────
exports.getBookingHistory = async (req, res) => {
  try {
    const db = getDB();
    const data = await db
      .collection("bookingHistory")
      .find({
        $or: [
          { userEmail: req.user.email.toLowerCase() },
          { userId:    req.user.id },
        ],
      })
      .sort({ savedAt: -1 })
      .toArray();
    return res.json(data);
  } catch (err) {
    console.error("Get Booking History Error:", err);
    return res.status(500).json({ message: "Failed to fetch booking history." });
  }
};

// ─────────────────────────────────────────────
// ADMIN: GET ALL BOOKINGS  (with flight & user details)
// ─────────────────────────────────────────────
exports.getAllBookings = async (req, res) => {
  try {
    const db = getDB();

    // 1. Aggregate bookings with flight details (join on flight + destination)
    const bookings = await db.collection("bookings").aggregate([
      {
        $lookup: {
          from: "flights",
          let: { flightName: "$flight", dest: "$destination" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: [{ $toLower: "$airline" }, { $toLower: "$$flightName" }] },
                    { $eq: [{ $toLower: "$destination" }, { $toLower: "$$dest" }] }
                  ]
                }
              }
            }
          ],
          as: "flightDetails"
        }
      },
      // Unwind (if a flight is missing, keep the booking with empty flightDetails)
      { $unwind: { path: "$flightDetails", preserveNullAndEmptyArrays: true } },

      // Optional: join user details if you have a "users" collection
      // {
      //   $lookup: {
      //     from: "users",
      //     localField: "userId",
      //     foreignField: "_id",
      //     as: "userDetails"
      //   }
      // },
      // { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },

      { $sort: { createdAt: -1 } }
    ]).toArray();

    res.json(bookings);
  } catch (err) {
    console.error("Get All Bookings Error:", err);
    res.status(500).json({ message: "Failed to fetch all bookings" });
  }
};
const mongoose = require("mongoose");

const bookingHistorySchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
    },
    userEmail: {
      type: String,
      required: true,
    },
    name: String,
    email: String,
    phone: String,
    date: Date,
    destination: String,
    flight: String,
    hotel: String,
    status: String,
    snapshot: {
      destination: String,
      flight: String,
      hotel: String,
      date: Date,
    },
    action: {
      type: String,
      enum: ["booked", "edited", "cancelled"],
      required: true,
    },
    savedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: "bookingHistory",
  }
);

bookingHistorySchema.index({ bookingId: 1, action: 1 });

module.exports = mongoose.model("BookingHistory", bookingHistorySchema);
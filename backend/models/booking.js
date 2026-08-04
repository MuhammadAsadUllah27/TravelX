const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    date: { type: String, required: true },
    destination: { type: String, required: true },
    flight: { type: String, required: true },
    hotel: { type: String, required: true },
    passengers: { type: Number, default: 1 },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

// Prevent re‑compilation if the model already exists
module.exports = mongoose.models.booking || mongoose.model('booking', bookingSchema);
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    userName: { type: String, default: '' },
    userEmail: { type: String, default: '' },
    destination: { type: String, default: '' },
    amount: { type: Number, required: true },
    method: {
      type: String,
      enum: ['credit_card', 'bank_transfer', 'digital_wallet', 'cash'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },
    transactionId: { type: String, unique: true },
    paidAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
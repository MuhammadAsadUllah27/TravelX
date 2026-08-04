const crypto = require('crypto');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const User = require('../models/User');

function generateTxnId() {
  return 'TXN-' + crypto.randomBytes(5).toString('hex').toUpperCase();
}

async function createPayment(req, res) {
  try {
    const { bookingId, amount, method } = req.body;
    const userId = req.user._id || req.user.id;

    if (!bookingId || !amount || !method) {
      return res.status(400).json({ message: 'bookingId, amount, and method are required.' });
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      $or: [{ userId }, { user: userId }],
    });
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found or does not belong to you.' });
    }
    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot pay for a cancelled booking.' });
    }

    const existing = await Payment.findOne({ bookingId, status: 'paid' });
    if (existing) {
      return res.status(409).json({ message: 'This booking has already been paid.' });
    }

    const user = await User.findById(userId).select('name email');

    const payment = await Payment.create({
      userId,
      bookingId,
      userName: user?.name || req.user.name || '',
      userEmail: user?.email || req.user.email || '',
      destination: booking.destination || '',
      amount: Number(amount),
      method,
      status: 'paid',
      transactionId: generateTxnId(),
      paidAt: new Date(),
    });

    // ✅ Update booking status to confirmed
    await Booking.findByIdAndUpdate(bookingId, { status: 'confirmed' });

    return res.status(201).json({
      message: 'Payment successful! Booking is now confirmed.',
      payment,
    });
  } catch (err) {
    console.error('createPayment error:', err);
    return res.status(500).json({ message: 'Server error processing payment.' });
  }
}

async function getMyPayments(req, res) {
  try {
    const userId = req.user._id || req.user.id;
    const payments = await Payment.find({ userId })
      .sort({ paidAt: -1 })
      .lean();
    return res.json(payments);
  } catch (err) {
    console.error('getMyPayments error:', err);
    return res.status(500).json({ message: 'Server error fetching payments.' });
  }
}

async function getAllPayments(req, res) {
  try {
    const payments = await Payment.find()
      .sort({ paidAt: -1 })
      .lean();
    return res.json(payments);
  } catch (err) {
    console.error('getAllPayments error:', err);
    return res.status(500).json({ message: 'Server error fetching payments.' });
  }
}

async function getPaymentSummary(req, res) {
  try {
    const [paidAgg, pendingAgg, failedAgg, total] = await Promise.all([
      Payment.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: null, sum: { $sum: '$amount' } } }]),
      Payment.aggregate([{ $match: { status: 'pending' } }, { $group: { _id: null, sum: { $sum: '$amount' } } }]),
      Payment.aggregate([{ $match: { status: 'failed' } }, { $group: { _id: null, sum: { $sum: '$amount' } } }]),
      Payment.countDocuments(),
    ]);

    return res.json({
      totalCollected: paidAgg[0]?.sum || 0,
      totalPending: pendingAgg[0]?.sum || 0,
      totalFailed: failedAgg[0]?.sum || 0,
      totalTransactions: total,
    });
  } catch (err) {
    console.error('getPaymentSummary error:', err);
    return res.status(500).json({ message: 'Server error fetching summary.' });
  }
}

module.exports = {
  createPayment,
  getMyPayments,
  getAllPayments,
  getPaymentSummary,
};
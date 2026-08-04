const mongoose = require("mongoose");

const flightSchema = new mongoose.Schema(
{
    airline: {
        type: String,
        required: true,
        trim: true
    },

    destination: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Destination",
        required: true
    },

    departureTime: {
        type: Date,
        required: true
    },

    price: {
        type: Number,
        required: true,
        min: 0
    },

    totalSeats: {
        type: Number,
        required: true,
        min: 1
    },

    availableSeats: {
        type: Number,
        required: true,
        min: 0
    },

    isActive: {
        type: Boolean,
        default: true
    }
},
{
    timestamps: true
});

module.exports = mongoose.model("Flight", flightSchema);
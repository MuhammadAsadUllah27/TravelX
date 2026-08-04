const mongoose = require("mongoose");

const hotelSchema = new mongoose.Schema(
{
    name: {
        type: String,
        required: true,
        trim: true
    },

    destination: {
        type: String,
        required: true,
        trim: true
    },

    stars: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },

    pricePerNight: {
        type: Number,
        required: true,
        min: 0
    },

    imageUrl: {
        type: String,
        default: ""
    },

    isActive: {
        type: Boolean,
        default: true
    }
},
{
    timestamps: true
});

module.exports = mongoose.model("Hotel", hotelSchema);
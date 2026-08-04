const mongoose = require("mongoose");

const destinationSchema = new mongoose.Schema(
{
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },

    description: {
        type: String,
        required: true,
        trim: true
    },

    price: {
        type: Number,
        required: true,
        min: 0
    },

    imageUrl: {
        type: String,
        default: ""
    },

    country: {
        type: String,
        required: true,
        trim: true
    },

    isActive: {
        type: Boolean,
        default: true
    }
},
{
    timestamps: true
});

module.exports = mongoose.model("Destination", destinationSchema);
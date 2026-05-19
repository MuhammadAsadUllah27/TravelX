// Booking Model Function
// This function creates a Booking object.
// It takes data as input and sets default values if data is missing.

function Booking(data = {}) {
  return {

    // Customer full name
    // If no name is provided, store an empty string ""
    name: data.name || "",

    // Customer email address
    // Used for contact and booking confirmation
    email: data.email || "",

    // Customer phone number
    // Useful for communication
    phone: data.phone || "",

    // Booking date
    // Example: "2026-05-13"
    date: data.date || "",

    // Travel destination chosen by the user
    // Example: "Paris", "Dubai", "Turkey"
    destination: data.destination || "",

    // Flight information selected by the user
    // Example: "PIA", "Emirates"
    flight: data.flight || "",

    // Hotel selected for stay
    // Example: "Pearl Continental"
    hotel: data.hotel || "",

    // ID of the logged-in user
    // Used to connect booking with a specific account
    // If no user exists, value will be null
    userId: data.userId || null,

    // Email of the logged-in user
    // Helpful for searching booking history
    userEmail: data.userEmail || "",

    // Booking status
    // Default value is "pending"
    // Future possible values:
    // "approved", "cancelled", "completed"
    status: data.status || "pending",

    // Automatically store booking creation time
    // Helps in booking history and records
    createdAt: new Date()
  }
}

// Export the Booking function
// So it can be used in other files
module.exports = Booking
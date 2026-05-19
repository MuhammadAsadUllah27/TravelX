// Function to create a Booking History object
function BookingHistory(data = {}) {

  // Return a booking history object
  return {

    // Stores the original booking ID
    // This is the _id of the booking before edit/cancel
    bookingId: data.bookingId || null,

    // Stores the ID of the user
    userId: data.userId || null,

    // Stores the email of the user
    userEmail: data.userEmail || "",

    // Snapshot object
    // Stores complete old booking data before any change
    snapshot: {

      // Stores customer name
      name: data.name || "",

      // Stores customer email
      email: data.email || "",

      // Stores customer phone number
      phone: data.phone || "",

      // Stores booking/travel date
      date: data.date || "",

      // Stores selected destination
      destination: data.destination || "",

      // Stores selected flight information
      flight: data.flight || "",

      // Stores selected hotel information
      hotel: data.hotel || "",

      // Stores booking status
      // Default status is "pending"
      status: data.status || "pending"
    },

    // Stores the action performed on the booking
    // Possible values:
    // "edited"    → booking updated
    // "cancelled" → booking deleted/cancelled
    action: data.action || "edited",

    // Stores date and time when history was saved
    savedAt: new Date()
  }
}

// Export the BookingHistory function
// This allows other files to use this model
module.exports = BookingHistory
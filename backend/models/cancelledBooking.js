// Function that creates a cancelled booking object
// data = {} means if no data is passed,
// use an empty object as default
function CancelledBooking(data = {}) {
  // Return a new booking object
  return {
    // Store original booking ID
    // If not provided, use null
    bookingId:   data.bookingId   || null,
    // Store user ID who cancelled booking
    // If missing, use null
    userId:      data.userId      || null,
    // Store user's email from account
    // Default is empty string
    userEmail:   data.userEmail   || "",
    // Store customer's name
    // Default is empty string
    name:        data.name        || "",
    // Store booking email
    // Default is empty string
    email:       data.email       || "",
    // Store phone number
    // Default is empty string
    phone:       data.phone       || "",
    // Store travel date
    // Default is empty string
    date:        data.date        || "",
    // Store destination name
    // Default is empty string
    destination: data.destination || "",
    // Store selected flight
    // Default is empty string
    flight:      data.flight      || "",
    // Store selected hotel
    // Default is empty string
    hotel:       data.hotel       || "",
    // Store booking status
    // Default status is "pending"
    status:      data.status      || "pending",
    // Store current date and time of cancellation
    // Automatically generated
    cancelledAt: new Date()
  }
}
// Export function so it can be used in other files
module.exports = CancelledBooking
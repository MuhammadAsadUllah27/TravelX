// Function to create a Review object
function Review(data = {}) {

  // Return a review object containing all review information
  return {

    // User ID of the person who submitted the review
    userId: data.userId || null,

    // Name of the user who submitted the review
    userName: data.userName || "",

    // Email address of the user
    userEmail: data.userEmail || "",

    // Destination/place being reviewed
    destination: data.destination || "",

    // Rating given by the user
    // Default value is 5 if no rating is provided
    // Rating should be between 1 and 5
    rating: data.rating || 5,

    // User's written comment/review
    comment: data.comment || "",

    // Date and time when the review was created
    createdAt: new Date()
  }
}

// Export the Review function
// This allows other files to use this model
module.exports = Review
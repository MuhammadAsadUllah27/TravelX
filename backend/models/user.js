// Function to create a User object
function User(data = {}) {

  // Return user object
  return {

    // Store user's name
    // Default value is empty string if no name is provided
    name: data.name || "",

    // Store user's email address
    // Default value is empty string
    email: data.email || "",

    // Store user's password
    // Password should be hashed before saving into database
    password: data.password || "",

    // Store user role
    // Default role is "user"
    // Can later be changed to "admin"
    // Useful for admin panel and permissions
    role: data.role || "user",

    // Store account active status
    // true  = account is active
    // false = account is deactivated/deleted
    //
    // Soft delete means account is not permanently removed
    // Data still exists in database
    isActive:
      data.isActive !== undefined
        ? data.isActive
        : true,

    // Store account creation date and time
    createdAt: new Date(),

    // Store last update date and time
    updatedAt: new Date()
  }
}

// Export User function
// Allows other files to use this model
module.exports = User
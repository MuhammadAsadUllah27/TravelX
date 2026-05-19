// Import jsonwebtoken package
// Used for creating and verifying JWT tokens
const jwt = require("jsonwebtoken")

// Secret key used to sign and verify tokens
// IMPORTANT:
// In real projects, store this in .env file
const SECRET = "travelx_secret_key"

// ─────────────────────────────────────────────
// AUTHENTICATION MIDDLEWARE
// ─────────────────────────────────────────────

// Middleware function
// Runs before protected routes
// Example:
// router.get("/profile", auth, controller.profile)

module.exports = function (req, res, next) {

  try {

    // Get token from request headers
    // Example header:
    // Authorization: Bearer eyhdbshd...

    let token = req.headers["authorization"]

    // ✔ Check if token starts with "Bearer "
    // Because token usually comes like:
    // "Bearer xxxxxxxxx"

    if (token && token.startsWith("Bearer ")) {

      // Split string into array:
      // ["Bearer", "token"]

      // Take only the token part
      token = token.split(" ")[1]
    }

    // ✔ If token does not exist
    // User is not logged in

    if (!token) {

      return res.status(401).json({

        // 401 = Unauthorized
        message: "No token. Access denied."
      })
    }

    // ✔ Verify token using secret key
    // If token is valid:
    // jwt.verify returns decoded user data

    const decoded = jwt.verify(token, SECRET)

    // Attach decoded user data to request object
    // So other routes can access logged-in user

    // Example:
    // req.user.id
    // req.user.email

    req.user = decoded

    // Move to next middleware or controller
    next()

  } catch (error) {

    // If token is invalid or expired
    // Send unauthorized response

    return res.status(401).json({

      // Invalid token message
      message: "Invalid or expired token."
    })
  }
}
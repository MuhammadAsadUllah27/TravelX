// Import MongoClient class from mongodb package
const { MongoClient } = require("mongodb")
// MongoDB server URL
// localhost means MongoDB is running on your own computer
// 27017 is MongoDB's default port
const MONGO_URL = "mongodb://localhost:27017/"
// Name of the database you want to use
// MongoDB will automatically create this database if it doesn't exist
const DB_NAME = "travel_agency_db"
// Create a new MongoClient object
// This client is responsible for connecting Node.js to MongoDB
const client = new MongoClient(MONGO_URL)
// Variable to store database connection
// Initially it is null because connection has not been made yet
let db = null

// Async function to connect to MongoDB
async function connectDB() {
  try {

    // Prevent reconnecting again and again
    // If database already connected,
    // return existing database object
    if (db) return db
    // Connect to MongoDB server
    // await pauses execution until connection completes
    await client.connect()
    // Select database using database name
    db = client.db(DB_NAME)
    // Show success message in terminal
    console.log("MongoDB Connected Successfully")
    // Return connected database object
    return db

  } catch (error) {
    // If connection fails,
    // show error in terminal
    console.error("MongoDB Connection Error:", error)
    // Stop Node.js server completely
    // exit code 1 means failure
    process.exit(1)
  }
}
// Function to get already connected database
function getDB() {
  // If database is not connected yet
  if (!db) {
    // Throw custom error
    throw new Error("Database not connected")
  }
  // Return database object
  return db
}
// Export functions so other files can use them
module.exports = {
  // Function to connect database
  connectDB,
  // Function to get database
  getDB
}
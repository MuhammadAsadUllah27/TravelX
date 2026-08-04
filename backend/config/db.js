// config/db.js
const mongoose = require('mongoose')

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/travel_agency_db'

async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI)
    console.log('✅ Mongoose connected to MongoDB')
    return mongoose.connection
  } catch (err) {
    console.error('❌ Mongoose connection error:', err.message)
    process.exit(1)
  }
}

function getDB() {
  if (!mongoose.connection || !mongoose.connection.db) {
    throw new Error('Database connection is not ready yet.')
  }
  return mongoose.connection.db
}

module.exports = { connectDB, getDB }
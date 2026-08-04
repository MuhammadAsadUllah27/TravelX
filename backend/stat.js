// Async function to load booking statistics from backend
async function loadStats() {

  try {

    // Get the HTML element with id="stats"
    // This is where stats data will be displayed
    const el = document.getElementById("stats")

    // If the element does not exist, stop the function
    if (!el) return

    // Show loading message while fetching data
    el.innerHTML = "Loading stats..."

    // Send request to backend API
    // Fetch stats data from server
    const res = await fetch("http://localhost:3000/stats")

    // Check if request failed
    if (!res.ok) {

      // Show error message on webpage
      el.innerHTML = "Failed to load stats"

      // Stop further execution
      return
    }

    // Convert response data into JSON format
    const data = await res.json()

    // Check if no stats data exists
    if (!data || data.length === 0) {

      // Show message if database has no stats
      el.innerHTML = "<p>No stats available</p>"

      // Stop function execution
      return
    }

    // Display all stats data on webpage
    // map() loops through each object in array
    el.innerHTML = data

      // Create HTML paragraph for each stat
      .map(d => `<p>${d._id}: ${d.totalBookings}</p>`)

      // Join all paragraphs into one string
      .join("")

  } 
  catch (error) {

    // Catch and handle any errors
    console.error("Stats Load Error:", error)

    // Get stats element again
    const el = document.getElementById("stats")

    // Check if element exists
    if (el) {

      // Show error message on webpage
      el.innerHTML = "Error loading stats"
    }
  }
}

// Call the function
// This runs automatically when file loads
loadStats()
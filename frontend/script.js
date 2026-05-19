// ─────────────────────────────────────────────────────────────
// MODAL HELPERS
// These functions control opening, closing,
// and switching between modals/popups.
// ─────────────────────────────────────────────────────────────


// Function to open a modal by its HTML element ID
function openModal(id) {

  // Find the modal element in the DOM using its ID
  // Then set its display to "flex" so it becomes visible
  document.getElementById(id).style.display = "flex"
}


// Function to close/hide a modal by its HTML element ID
function closeModal(id) {

  // Set display to "none" so the modal becomes invisible
  document.getElementById(id).style.display = "none"
}


// Function to switch from one modal to another
function switchModal(from, to) {

  // Close the currently open modal first
  closeModal(from)

  // Then open the new target modal
  openModal(to)
}


// Function to open the trip details modal with dynamic content
function openDetails(title, text) {

  // Set the title text inside the details modal
  document.getElementById("detailTitle").innerText = title

  // Set the description text inside the details modal
  document.getElementById("detailText").innerText = text

  // Now open the details modal so the user can see it
  openModal("detailsModal")
}



// ─────────────────────────────────────────────────────────────
// BOOKING ACCESS CONTROL
// Prevent users from booking trips
// without login authentication.
// ─────────────────────────────────────────────────────────────


// Function to open the booking modal (only if user is logged in)
function openBooking() {

  // Check local storage for a token — token means user is logged in
  if (!localStorage.getItem("token")) {

    // If no token found, warn the user to sign in first
    alert("Please sign in first to book a trip.")

    // Open the login modal so they can sign in
    openModal("loginModal")

    // Stop execution — do NOT open booking modal
    return
  }

  // If token exists (user is logged in), open the booking modal
  openModal("bookingModal")
}



// ─────────────────────────────────────────────────────────────
// AUTH STATE MANAGEMENT
// Updates navbar based on login/logout state.
// ─────────────────────────────────────────────────────────────


// Function to update the navbar UI based on login state
function updateNavbar() {

  // Get the authentication token from local storage
  const token = localStorage.getItem("token")

  // Get the saved username from local storage
  const name = localStorage.getItem("userName")


  // If a token exists, the user is logged in
  if (token) {

    // Hide the "Login" nav button (not needed when logged in)
    document.getElementById("navLogin").style.display = "none"

    // Hide the "Register" nav button (not needed when logged in)
    document.getElementById("navRegister").style.display = "none"

    // Show the user name section in the navbar
    document.getElementById("navUser").style.display = "list-item"

    // Show the profile option in the navbar
    document.getElementById("navProfile").style.display = "list-item"

    // Show the logout option in the navbar
    document.getElementById("navLogout").style.display = "list-item"

    // Set the navbar user button text to the user's name
    document.getElementById("navUser")
      .querySelector("button").innerText = name

  } else {

    // No token means user is NOT logged in

    // Show the "Login" button so they can sign in
    document.getElementById("navLogin").style.display = "list-item"

    // Show the "Register" button so they can create an account
    document.getElementById("navRegister").style.display = "list-item"

    // Hide user name display (no user is logged in)
    document.getElementById("navUser").style.display = "none"

    // Hide profile option (not available when logged out)
    document.getElementById("navProfile").style.display = "none"

    // Hide logout option (not needed when already logged out)
    document.getElementById("navLogout").style.display = "none"
  }
}



// ─────────────────────────────────────────────────────────────
// USER REGISTRATION
// Handles new account creation.
// ─────────────────────────────────────────────────────────────


// Async function to register a new user account
async function register() {

  // Read the name value typed in the registration form
  const name = document.getElementById("regName").value

  // Read the email value typed in the registration form
  const email = document.getElementById("regEmail").value

  // Read the password value typed in the registration form
  const password = document.getElementById("regPass").value

  // Get the message element used to show errors or feedback
  const msg = document.getElementById("regMsg")


  // If any field is empty, stop and show a validation message
  if (!name || !email || !password) {

    // Show a warning to the user to fill all fields
    msg.innerText = "Please fill all fields."

    // Exit the function — do not proceed to API call
    return
  }


  // Send a POST request to the backend to create a new account
  const res = await fetch("http://localhost:3000/auth/register", {

    // Use POST because we are sending new data to the server
    method: "POST",

    // Tell the server we are sending JSON data
    headers: {
      "Content-Type": "application/json"
    },

    // Convert the JS object to a JSON string for the request body
    body: JSON.stringify({ name, email, password })
  })


  // Parse the server's JSON response into a JS object
  const data = await res.json()


  // Check if the server returned a success response (status 200–299)
  if (res.ok) {

    // Save the returned auth token in local storage for future requests
    localStorage.setItem("token", data.token)

    // Save the user's name in local storage for display purposes
    localStorage.setItem("userName", data.name)

    // Save the user's email in local storage
    localStorage.setItem("userEmail", data.email)

    // Close the registration modal
    closeModal("registerModal")

    // Refresh the navbar to show the logged-in state
    updateNavbar()

    // Show a welcome alert with the user's name
    alert("Welcome " + data.name)

  } else {

    // If registration failed, show the server's error message
    msg.innerText = data.message
  }
}



// ─────────────────────────────────────────────────────────────
// USER LOGIN
// Handles user authentication.
// ─────────────────────────────────────────────────────────────


// Async function to log in an existing user
async function login() {

  // Read the email entered in the login form
  const email = document.getElementById("loginEmail").value

  // Read the password entered in the login form
  const password = document.getElementById("loginPass").value

  // Get the message element to display errors
  const msg = document.getElementById("loginMsg")


  // Send a POST request to the backend login endpoint
  const res = await fetch("http://localhost:3000/auth/login", {

    // POST because we're sending credentials to the server
    method: "POST",

    // Tell the server we are sending JSON
    headers: {
      "Content-Type": "application/json"
    },

    // Convert login data to JSON for the request body
    body: JSON.stringify({ email, password })
  })


  // Parse the server response into a JS object
  const data = await res.json()


  // If login was successful (status 200–299)
  if (res.ok) {

    // Save the auth token in local storage
    localStorage.setItem("token", data.token)

    // Save the user's name in local storage
    localStorage.setItem("userName", data.name)

    // Save the user's email in local storage
    localStorage.setItem("userEmail", data.email)

    // Close the login modal
    closeModal("loginModal")

    // Update the navbar to reflect the logged-in state
    updateNavbar()

    // Show a welcome back message with the user's name
    alert("Welcome back " + data.name)

  } else {

    // If login failed, display the server's error message
    msg.innerText = data.message
  }
}



// ─────────────────────────────────────────────────────────────
// LOGOUT
// Removes user session.
// ─────────────────────────────────────────────────────────────


// Function to log out the current user
function logout() {

  // Remove all data stored in local storage (token, name, email)
  localStorage.clear()

  // Update the navbar to reflect the logged-out state
  updateNavbar()

  // Notify the user that they have been logged out
  alert("Logged out")
}



// ─────────────────────────────────────────────────────────────
// DASHBOARD
// Opens the dashboard modal and loads the default tab.
// NOTE: Only ONE definition of openDashboard is kept below.
//       The duplicate that existed before caused bugs.
// ─────────────────────────────────────────────────────────────


// Async function to open the user dashboard
async function openDashboard() {

  // Get the auth token from local storage (used by child functions)
  const token = localStorage.getItem("token")

  // Get the saved username from local storage
  const name = localStorage.getItem("userName")

  // Display the username inside the dashboard header element
  document.getElementById("dashUserName").innerText = name

  // Open the dashboard modal so it becomes visible
  openModal("dashboardModal")

  // Load the default tab which is "bookings"
  await loadTab("bookings")
}



// ─────────────────────────────────────────────────────────────
// DASHBOARD TABS
// Handles switching between bookings / history / reviews tabs.
// NOTE: Only ONE definition of loadTab is kept.
//       The duplicate that existed before caused bugs.
// ─────────────────────────────────────────────────────────────


// Async function to load a specific dashboard tab by name
async function loadTab(tab) {

  // Loop through all tab buttons and update their background color
  document.querySelectorAll(".dash-tab").forEach(btn => {

    // Highlight the active tab in orange, others in dark navy
    btn.style.background =
      btn.dataset.tab === tab ? "orange" : "#0a1f44"
  })


  // Get the container element where tab content will be rendered
  const container = document.getElementById("bookingsList")

  // Show a loading message while the data is being fetched
  container.innerHTML = "<p>Loading...</p>"


  // Check which tab was selected and call the correct render function

  // If "bookings" tab is clicked, load active bookings
  if (tab === "bookings") await renderActiveBookings(container)

  // If "history" tab is clicked, load booking history
  if (tab === "history")  await renderHistory(container)

  // If "reviews" tab is clicked, load user's reviews
  if (tab === "reviews")  await renderMyReviews(container)
}



// ─────────────────────────────────────────────────────────────
// ACTIVE BOOKINGS RENDER
// Fetches and displays current user bookings.
// NOTE: Only ONE definition is kept — duplicate removed.
// ─────────────────────────────────────────────────────────────


// Async function to render the user's active bookings
async function renderActiveBookings(container) {

  // Get the auth token needed to identify the user on the server
  const token = localStorage.getItem("token")

  try {

    // Fetch the logged-in user's active bookings from the backend
    const res = await fetch(
      "http://localhost:3000/bookings/my-bookings",
      {
        // Pass token in Authorization header so server knows who is requesting
        headers: { Authorization: token }
      }
    )

    // Parse the server's JSON response into a JS array
    const data = await res.json()


    // If the returned array is empty, show an empty state message
    if (!data.length) {
      container.innerHTML = "<p>No active bookings.</p>"
      return // Stop here — nothing more to render
    }


    // Map over each booking and create an HTML card string for it
    container.innerHTML = data.map(b => `

      <div class="booking-card">

        <!-- Show destination with map pin icon -->
        <p><b>📍 Destination:</b> ${b.destination}</p>

        <!-- Show flight name/number -->
        <p><b>✈️ Flight:</b> ${b.flight}</p>

        <!-- Show hotel name -->
        <p><b>🏨 Hotel:</b> ${b.hotel}</p>

        <!-- Show travel date -->
        <p><b>📅 Date:</b> ${b.date}</p>

        <!-- Show phone number or dash if not set -->
        <p><b>📞 Phone:</b> ${b.phone || "—"}</p>


        <div>

          <!-- Edit button — passes all booking fields into editBooking() -->
          <button onclick="editBooking(
            '${b._id}',
            '${b.destination}',
            '${b.flight}',
            '${b.hotel}',
            '${b.date}',
            '${b.phone || ""}'
          )">
            ✏️ Edit
          </button>


          <!-- Cancel button — passes booking ID to deleteBooking() -->
          <button onclick="deleteBooking('${b._id}')"
            style="background:red;">
            ❌ Cancel
          </button>

        </div>

      </div>

    `).join("") // Join all card strings into one HTML string

  } catch (err) {

    // If the fetch fails for any reason, show an error message
    container.innerHTML = "<p>Error loading bookings.</p>"
  }
}



// ─────────────────────────────────────────────────────────────
// CREATE BOOKING
// Submits a new booking to the backend.
// ─────────────────────────────────────────────────────────────


// Async function to handle booking form submission
async function submitForm(e) {

  // Prevent the default form submission which would refresh the page
  e.preventDefault()

  // Get the auth token to identify the user making the booking
  const token = localStorage.getItem("token")

  // Select all input and select elements inside the booking modal
  const inputs = document.querySelectorAll(
    "#bookingModal input, #bookingModal select"
  )


  // Build a booking data object from the form field values
  const data = {

    name:        inputs[0].value, // Full name of the traveller
    email:       inputs[1].value, // Email address
    phone:       inputs[2].value, // Phone number
    date:        inputs[3].value, // Travel date
    destination: inputs[4].value, // Selected destination
    flight:      inputs[5].value, // Selected flight
    hotel:       inputs[6].value  // Selected hotel
  }


  // Send a POST request to create the booking on the backend
  const res = await fetch("http://localhost:3000/bookings", {

    // POST because we are creating a new booking record
    method: "POST",

    headers: {
      // Tell the server we are sending JSON
      "Content-Type": "application/json",

      // Pass auth token so server knows which user is booking
      Authorization: token
    },

    // Convert the data object into a JSON string for the body
    body: JSON.stringify(data)
  })


  // Parse the server response into a JS object
  const result = await res.json()

  // Display success or failure message from the server
  alert(result.message)

  // Close the booking modal after submission
  closeModal("bookingModal")
}



// ─────────────────────────────────────────────────────────────
// EDIT BOOKING
// Opens the edit modal pre-filled with existing booking data.
// ─────────────────────────────────────────────────────────────


// Function to open the edit modal and fill it with existing values
function editBooking(id, destination, flight, hotel, date, phone) {

  // Store the booking's ID in a hidden input field for later use
  document.getElementById("editBookingId").value = id

  // Fill in the phone field — use empty string if phone is undefined
  document.getElementById("editPhone").value = phone || ""

  // Fill in the date field — use empty string if date is undefined
  document.getElementById("editDate").value = date || ""


  // Use helper to auto-select the correct destination in the dropdown
  setSelectValue("editDestination", destination)

  // Use helper to auto-select the correct flight in the dropdown
  setSelectValue("editFlight", flight)

  // Use helper to auto-select the correct hotel in the dropdown
  setSelectValue("editHotel", hotel)


  // Open the edit booking modal so the user can make changes
  openModal("editBookingModal")
}



// ─────────────────────────────────────────────────────────────
// SELECT HELPER
// Auto-selects a dropdown option that matches a given value.
// ─────────────────────────────────────────────────────────────


// Helper function to set a <select> element to a specific value
function setSelectValue(selectId, value) {

  // Get the select element from the DOM by its ID
  const select = document.getElementById(selectId)

  // Loop through each option inside the select element
  for (let i = 0; i < select.options.length; i++) {

    // Check if the current option matches by value OR by visible text
    if (
      select.options[i].value === value ||
      select.options[i].text  === value
    ) {

      // Set this option as the currently selected one
      select.selectedIndex = i

      // Exit the loop — no need to check the rest
      break
    }
  }
}



// ─────────────────────────────────────────────────────────────
// SUBMIT EDIT BOOKING
// Sends updated booking data to the backend (PUT request).
// ─────────────────────────────────────────────────────────────


// Async function to save changes made in the edit booking modal
async function submitEditBooking() {

  // Get the booking ID stored in the hidden input field
  const id = document.getElementById("editBookingId").value

  // Get the updated destination from the dropdown
  const destination = document.getElementById("editDestination").value

  // Get the updated flight from the dropdown
  const flight = document.getElementById("editFlight").value

  // Get the updated hotel from the dropdown
  const hotel = document.getElementById("editHotel").value

  // Get the updated travel date
  const date = document.getElementById("editDate").value

  // Get the updated phone number
  const phone = document.getElementById("editPhone").value


  // Validate — if any field is empty, stop and warn the user
  if (!destination || !flight || !hotel || !date || !phone) {
    alert("Please fill all fields before saving.")
    return // Stop the function here
  }


  // Get the auth token to authenticate the request
  const token = localStorage.getItem("token")


  // Send a PUT request to update the specific booking by ID
  const res = await fetch(`http://localhost:3000/bookings/${id}`, {

    // PUT because we are updating an existing record
    method: "PUT",

    headers: {
      // Tell server we are sending JSON
      "Content-Type": "application/json",

      // Pass auth token for authentication
      Authorization: token
    },

    // Send the updated fields as a JSON string in the body
    body: JSON.stringify({ destination, flight, hotel, date, phone })
  })


  // Parse the server's response into a JS object
  const data = await res.json()

  // Show the server's success or failure message
  alert(data.message)

  // Close the edit modal
  closeModal("editBookingModal")

  // Reload the dashboard to show the updated booking data
  openDashboard()
}



// ─────────────────────────────────────────────────────────────
// DELETE BOOKING
// Sends a DELETE request to cancel and remove a booking.
// ─────────────────────────────────────────────────────────────


// Async function to cancel/delete a booking by its ID
async function deleteBooking(id) {

  // Get the auth token for the request
  const token = localStorage.getItem("token")

  // Ask the user to confirm before permanently cancelling
  if (!confirm("Cancel this booking?")) return // Stop if user clicks "Cancel"


  // Send a DELETE request to the backend for this booking
  const res = await fetch(`http://localhost:3000/bookings/${id}`, {

    // DELETE method removes the booking from the database
    method: "DELETE",

    // Pass auth token to verify the user owns this booking
    headers: { Authorization: token }
  })


  // Parse the server response
  const data = await res.json()

  // Show success or failure message to the user
  alert(data.message)

  // Reload the dashboard so the deleted booking disappears
  openDashboard()
}



// ─────────────────────────────────────────────────────────────
// UPDATE PROFILE
// Sends updated name, email, and password to the backend.
// ─────────────────────────────────────────────────────────────


// Async function to update the logged-in user's profile
async function updateProfile() {

  // Get the new name entered in the profile form
  const name = document.getElementById("profileName").value

  // Get the new email entered in the profile form
  const email = document.getElementById("profileEmail").value

  // Get the new password entered in the profile form (can be blank)
  const password = document.getElementById("profilePass").value

  // Get auth token to authenticate the update request
  const token = localStorage.getItem("token")


  // Send a PUT request to update the user's profile on the server
  const res = await fetch("http://localhost:3000/users/update-profile", {

    // PUT because we are updating an existing user record
    method: "PUT",

    headers: {
      // Tell the server we are sending JSON
      "Content-Type": "application/json",

      // Include auth token to identify the user
      Authorization: token
    },

    // Send updated profile data as JSON
    body: JSON.stringify({ name, email, password })
  })


  // Parse the server response
  const data = await res.json()


  // If update was successful
  if (res.ok) {

    // Update the stored name in local storage with the new value
    localStorage.setItem("userName", data.name)

    // Update the stored email in local storage with the new value
    localStorage.setItem("userEmail", data.email)

    // Refresh the navbar so it shows the updated name
    updateNavbar()

    // Show the success message from the server
    alert(data.message)

    // Close the profile modal
    closeModal("profileModal")

  } else {

    // If update failed, show the server's error message
    alert(data.message)
  }
}



// ─────────────────────────────────────────────────────────────
// DELETE ACCOUNT
// Permanently removes the user's account from the database.
// ─────────────────────────────────────────────────────────────


// Async function to permanently delete the user's account
async function deleteAccount() {

  // Ask the user to confirm before doing anything irreversible
  if (!confirm("Are you sure you want to delete your account?")) return


  // Get auth token to authenticate the delete request
  const token = localStorage.getItem("token")


  // Send a DELETE request to remove the user's account
  const res = await fetch("http://localhost:3000/users/delete-account", {

    // DELETE method removes the user record from the database
    method: "DELETE",

    // Pass auth token so server knows whose account to delete
    headers: { Authorization: token }
  })


  // Parse the server response
  const data = await res.json()

  // Show the server's success or error message
  alert(data.message)

  // Clear all locally stored user data (token, name, email)
  localStorage.clear()

  // Update the navbar to reflect the logged-out state
  updateNavbar()

  // Close the profile modal
  closeModal("profileModal")
}



// ─────────────────────────────────────────────────────────────
// BOOKING HISTORY RENDER
// Shows edited/cancelled bookings as an audit log.
// NOTE: Only ONE definition is kept — duplicate removed.
// ─────────────────────────────────────────────────────────────


// Async function to render the user's booking history tab
async function renderHistory(container) {

  // Get auth token to identify the user in the API request
  const token = localStorage.getItem("token")

  try {

    // Fetch booking history records from the backend
    const res = await fetch(
      "http://localhost:3000/bookings/my-history",
      {
        // Pass token so server returns only THIS user's history
        headers: { Authorization: token }
      }
    )

    // Parse the JSON array of history records
    const data = await res.json()


    // If history array is empty, show an empty state message
    if (!data.length) {
      container.innerHTML = "<p>No booking history yet.</p>"
      return // Nothing else to render
    }


    // Map over history items and build HTML card for each one
    container.innerHTML = data.map(h => {

      // Decide which badge to show based on the action type
      const badge = h.action === "cancelled"

        // Red badge for cancelled bookings
        ? `<span style="background:red;color:white;padding:2px 8px;border-radius:12px;font-size:12px;">
            Cancelled
          </span>`

        // Orange badge for edited bookings
        : `<span style="background:orange;color:white;padding:2px 8px;border-radius:12px;font-size:12px;">
            Edited
          </span>`


      // snapshot = the old booking data saved at time of edit/cancel
      const s = h.snapshot

      // Convert the savedAt timestamp to a readable date string
      const date = new Date(h.savedAt).toLocaleDateString()


      // Return the HTML card for this history record
      return `
        <div class="booking-card">

          <!-- Action badge (Cancelled / Edited) -->
          ${badge}

          <p style="margin-top:6px;"><b>📍</b> ${s.destination}</p>
          <p><b>✈️</b> ${s.flight}</p>
          <p><b>🏨</b> ${s.hotel}</p>
          <p><b>📅 Trip date:</b> ${s.date}</p>

          <!-- Timestamp when this record was archived -->
          <p style="font-size:12px;color:#888;">
            Archived on ${date}
          </p>

        </div>
      `
    }).join("") // Join all card strings into one HTML block

  } catch (err) {

    // If the request fails, show an error message
    container.innerHTML = "<p>Error loading history.</p>"
  }
}



// ─────────────────────────────────────────────────────────────
// MY REVIEWS (DASHBOARD TAB)
// Shows all reviews written by the logged-in user.
// NOTE: Only ONE definition is kept — duplicate removed.
// ─────────────────────────────────────────────────────────────


// Async function to render the user's reviews in the dashboard
async function renderMyReviews(container) {

  // Get auth token to authenticate the reviews fetch
  const token = localStorage.getItem("token")

  try {

    // Fetch this user's reviews from the backend
    const res = await fetch("http://localhost:3000/reviews/my-reviews", {

      // Pass token so server returns only THIS user's reviews
      headers: { Authorization: token }
    })

    // Parse the JSON response into a JS array
    const data = await res.json()


    // If the user has not written any reviews yet
    if (!data.length) {

      // Show empty state with a button to write a new review
      container.innerHTML = `
        <p>You haven't written any reviews yet.</p>

        <!-- Close dashboard and open the review modal -->
        <button onclick="closeModal('dashboardModal');openModal('reviewModal')"
          style="margin-top:10px;">
          ✍️ Write a Review
        </button>
      `
      return // Stop — nothing else to render
    }


    // If reviews exist, render them as cards
    container.innerHTML = `

      <!-- Always show write review button at the top -->
      <button onclick="closeModal('dashboardModal');openModal('reviewModal')"
        style="margin-bottom:12px;">
        ✍️ Write a Review
      </button>

      ${data.map(r => `

        <div class="booking-card">

          <!-- Destination name and star rating icons -->
          <p>
            <b>📍 ${r.destination}</b>
            ${"⭐".repeat(r.rating)}
          </p>

          <!-- The review comment text -->
          <p style="margin-top:4px;">
            ${r.comment}
          </p>

          <!-- Date the review was created -->
          <p style="font-size:12px;color:#888;">
            ${new Date(r.createdAt).toLocaleDateString()}
          </p>

          <!-- Delete button — passes review ID to deleteReview() -->
          <button onclick="deleteReview('${r._id}')"
            style="background:red;margin-top:6px;">
            🗑️ Delete
          </button>

        </div>

      `).join("")}

    `

  } catch (err) {

    // Show error message if the request fails
    container.innerHTML = "<p>Error loading reviews.</p>"
  }
}



// ─────────────────────────────────────────────────────────────
// OPEN REVIEW MODAL
// Opens the review form — requires user to be logged in.
// NOTE: Only ONE definition is kept — duplicate removed.
// ─────────────────────────────────────────────────────────────


// Function to open the review form modal safely
function openReviewModal(destination = "") {

  // If no token is found, the user is not logged in
  if (!localStorage.getItem("token")) {

    // Warn the user they must sign in before leaving a review
    alert("Please sign in first to leave a review.")

    // Open the login modal so they can sign in
    openModal("loginModal")

    return // Stop — do not open review modal
  }


  // If a destination was passed as an argument, auto-fill it
  if (destination) {
    document.getElementById("reviewDestination").value = destination
  }

  // Open the review form modal
  openModal("reviewModal")
}



// ─────────────────────────────────────────────────────────────
// SUBMIT REVIEW
// Sends the new review to the backend server.
// NOTE: Only ONE definition is kept — duplicate removed.
// ─────────────────────────────────────────────────────────────


// Async function to submit a new review to the server
async function submitReview() {

  // Get auth token for the API request
  const token = localStorage.getItem("token")

  // Get the destination value from the review form
  const destination = document.getElementById("reviewDestination").value

  // Get the star rating value (stored in a hidden input by setRating)
  const rating = document.getElementById("reviewRating").value

  // Get the comment text from the review form
  const comment = document.getElementById("reviewComment").value

  // Get the element used to display inline validation messages
  const msg = document.getElementById("reviewMsg")


  // Validate — all fields must be filled before submitting
  if (!destination || !rating || !comment.trim()) {
    msg.innerText = "Please fill all fields."
    return // Stop the function here
  }


  // Send a POST request to create the review on the backend
  const res = await fetch("http://localhost:3000/reviews", {

    // POST because we are creating a new review record
    method: "POST",

    headers: {
      // Tell the server we are sending JSON
      "Content-Type": "application/json",

      // Pass auth token to associate review with the logged-in user
      Authorization: token
    },

    // Convert review data to JSON for the request body
    body: JSON.stringify({ destination, rating, comment })
  })


  // Parse the server's response
  const data = await res.json()


  // If the review was saved successfully
  if (res.ok) {

    // Show the server's success message
    alert(data.message)

    // Close the review modal
    closeModal("reviewModal")

    // Clear the comment textarea for next time
    document.getElementById("reviewComment").value = ""

    // Refresh the homepage latest reviews section
    loadLatestReviews()

  } else {

    // Show the server's error message inside the modal
    msg.innerText = data.message
  }
}



// ─────────────────────────────────────────────────────────────
// DELETE REVIEW
// Removes a review from the database by ID.
// NOTE: Only ONE definition is kept — duplicate removed.
// ─────────────────────────────────────────────────────────────


// Async function to delete a specific review by its ID
async function deleteReview(id) {

  // Ask the user to confirm before deleting permanently
  if (!confirm("Delete this review?")) return // Stop if user cancels

  // Get auth token for the delete request
  const token = localStorage.getItem("token")


  // Send a DELETE request to remove the review from the database
  const res = await fetch(`http://localhost:3000/reviews/${id}`, {

    // DELETE method removes this review record
    method: "DELETE",

    // Pass auth token so server verifies ownership
    headers: { Authorization: token }
  })


  // Parse the server response
  const data = await res.json()

  // Show success or failure message
  alert(data.message)

  // Reload the reviews tab to reflect the deletion
  loadTab("reviews")
}



// ─────────────────────────────────────────────────────────────
// STAR RATING HELPER
// Highlights selected stars in the review form.
// NOTE: Only ONE definition is kept — duplicate removed.
// ─────────────────────────────────────────────────────────────


// Function to handle star selection in the review form
function setRating(val) {

  // Store the numeric rating value in the hidden input field
  document.getElementById("reviewRating").value = val

  // Loop through all star buttons and update their color
  document.querySelectorAll(".star-btn").forEach((btn, i) => {

    // Color stars orange up to the selected value, grey for the rest
    btn.style.color = i < val ? "orange" : "#ccc"
  })
}



// ─────────────────────────────────────────────────────────────
// HOMEPAGE: LATEST REVIEWS
// Fetches and displays the most recent reviews on the homepage.
// NOTE: Only ONE definition is kept — duplicate removed.
// ─────────────────────────────────────────────────────────────


// Async function to load the latest reviews onto the homepage
async function loadLatestReviews() {

  // Get the container element on the homepage for reviews
  const container = document.getElementById("latestReviews")

  // If this element doesn't exist on the current page, stop here
  if (!container) return

  try {

    // Fetch the latest reviews from the backend (no token needed — public)
    const res = await fetch("http://localhost:3000/reviews/latest")

    // Parse the JSON array of review objects
    const data = await res.json()


    // If no reviews exist in the database yet
    if (!data.length) {
      container.innerHTML = "<p>No reviews yet. Be the first!</p>"
      return // Nothing else to render
    }


    // Map over reviews and build an HTML card for each one
    container.innerHTML = data.map(r => `

      <div class="card simple"
        style="min-width:260px;max-width:320px;text-align:left;">

        <!-- Reviewer's name and star icons -->
        <p>
          <b>${r.userName}</b> &nbsp;
          ${"⭐".repeat(r.rating)}
        </p>

        <!-- Destination being reviewed -->
        <p style="color:#555;font-size:13px;">
          📍 ${r.destination}
        </p>

        <!-- The review text/comment -->
        <p style="margin-top:6px;">
          ${r.comment}
        </p>

        <!-- Date the review was written -->
        <p style="font-size:11px;color:#aaa;margin-top:8px;">
          ${new Date(r.createdAt).toLocaleDateString()}
        </p>

      </div>

    `).join("") // Join all card HTML strings into one block

  } catch (err) {

    // Log the error to the browser console if the fetch fails
    console.error("Load Reviews Error:", err)
  }
}



// ─────────────────────────────────────────────────────────────
// STATS SECTION
// Loads booking statistics (e.g. bookings per destination).
// ─────────────────────────────────────────────────────────────


// Async function to load and display booking stats
async function loadStats() {

  try {

    // Get the stats container element from the DOM
    const el = document.getElementById("stats")

    // If the stats element doesn't exist on this page, stop
    if (!el) return


    // Fetch stats data from the backend
    const res = await fetch("http://localhost:3000/stats")

    // If the server returned an error status, stop
    if (!res.ok) return


    // Parse the JSON array of stat objects
    const data = await res.json()


    // Render each stat as a paragraph (destination: count)
    el.innerHTML = data.map(d =>
      `<p>${d._id}: ${d.totalBookings}</p>`
    ).join("") // Join all <p> strings into one block

  } catch (error) {

    // Log any error to the console without crashing the page
    console.error("Stats Load Error:", error)
  }
}



// ─────────────────────────────────────────────────────────────
// INITIAL SETUP — runs automatically when the page loads
// ─────────────────────────────────────────────────────────────

// Update the navbar immediately based on current login state
updateNavbar()

// Load stats section if it exists on this page
loadStats()

// Load latest reviews onto the homepage if section exists
loadLatestReviews()
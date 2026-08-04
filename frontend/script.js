// ─────────────────────────────────────────────────────────────
// MODAL HELPERS
// ─────────────────────────────────────────────────────────────

function openModal(id) {
  document.getElementById(id).style.display = "flex"
}

function closeModal(id) {
  document.getElementById(id).style.display = "none"
}

function switchModal(from, to) {
  closeModal(from)
  openModal(to)
}

function openDetails(title, text) {
  document.getElementById("detailTitle").innerText = title
  document.getElementById("detailText").innerText  = text
  openModal("detailsModal")
}


// ─────────────────────────────────────────────────────────────
// GLOBALS
// ─────────────────────────────────────────────────────────────

const BASE     = "http://localhost:3000"
let adminToken = localStorage.getItem("adminToken") || ""
let flights      = []
let hotels       = []
let destinations = []
let allPayments  = []   // cached for filtering
let cachedMyBookings = []  // FIX: cache active bookings for edit without re-fetch


// ─────────────────────────────────────────────────────────────
// LOAD DESTINATIONS TO PAGE (homepage grid)
// ─────────────────────────────────────────────────────────────

async function loadDestinationsToPage() {
  const section = document.getElementById("destinationsGrid")
  if (!section) return

  try {
    const res  = await fetch(`${BASE}/admin/destinations`)
    const data = await res.json()

    if (!data.length) {
      section.innerHTML = "<p>No destinations available yet.</p>"
      return
    }

    section.innerHTML = data.map(d => `
      <div class="card">
        <img src="${d.imageUrl || "./pic/home .jpg"}" alt="${d.name}">
        <div class="card-content">
          <h3>${d.name}</h3>
          <p><strong>From $${d.price}</strong></p>
          <p style="font-size:13px;color:#666;">${d.description}</p>
          <button onclick="openDetails('${d.name}', '${d.description}')">Explore Trip</button>
        </div>
      </div>
    `).join("")
  } catch (err) {
    console.error("Failed to load destinations:", err)
  }
}


// ─────────────────────────────────────────────────────────────
// BOOKING ACCESS CONTROL
// ─────────────────────────────────────────────────────────────

async function openBooking() {
  if (!localStorage.getItem("token")) {
    alert("Please sign in first to book a trip.")
    openModal("loginModal")
    return
  }
  await populateBookingOptions()
  openModal("bookingModal")
}

async function populateBookingOptions() {
  const destinationSelect = document.getElementById("bookingDestination")
  const flightSelect      = document.getElementById("bookingFlightSelect")
  const hotelSelect       = document.getElementById("bookingHotel")

  if (!destinationSelect || !flightSelect || !hotelSelect) return

  destinationSelect.innerHTML = "<option value=''>Select Destination</option>"
  flightSelect.innerHTML      = "<option value=''>Select Flight</option>"
  hotelSelect.innerHTML       = "<option value=''>Select Hotel</option>"

  try {
    const [flightsRes, hotelsRes, destinationsRes] = await Promise.all([
      fetch(`${BASE}/admin/flights`),
      fetch(`${BASE}/admin/hotels`),
      fetch(`${BASE}/admin/destinations`)
    ])

    const flightsData      = await flightsRes.json()
    const hotelsData       = await hotelsRes.json()
    const destinationsData = await destinationsRes.json()

    const destinationNames = []
    const flightOptions = []

    destinationsData.forEach(d => {
      if (d?.name && !destinationNames.includes(d.name)) destinationNames.push(d.name)
    })

    flightsData.forEach(f => {
      const total    = Number(f.totalSeats || f.seats || 0)
      const booked   = Number(f.bookedSeats || 0)
      const empty    = Math.max(total - booked, 0)
      const normalizedDest =
        (f.destination?.name || f.destinationName || f.destination || "Unknown")
      const destName = typeof normalizedDest === "string" ? normalizedDest.trim() || "Unknown" : "Unknown"
      const label    = `${f.airline} — ${destName} (${new Date(f.departureTime).toLocaleString()}) — ${empty} seats left`

      flightOptions.push({ airline: f.airline, label, destination: destName })

      if (destName && destName !== "Unknown" && !destinationNames.includes(destName)) {
        destinationNames.push(destName)
      }
    })

    destinationNames.sort().forEach(d => {
      destinationSelect.innerHTML += `<option value="${d}">${d}</option>`
    })

    destinationSelect.onchange = function () {
      const chosen = this.value
      const chosenLower = chosen.toLowerCase()

      flightSelect.innerHTML = "<option value=''>Select Flight</option>"
      hotelSelect.innerHTML  = "<option value=''>Select Hotel</option>"

      if (!chosen) {
        flightOptions.forEach(f => {
          flightSelect.innerHTML += `<option value="${f.airline}">${f.label}</option>`
        })
        return
      }

      const matchingFlights = flightOptions.filter(f => {
        return (f.destination || "").toLowerCase() === chosenLower
      })

      if (matchingFlights.length) {
        matchingFlights.forEach(f => {
          flightSelect.innerHTML += `<option value="${f.airline}">${f.label}</option>`
        })
      } else {
        flightSelect.innerHTML += `<option disabled>No flights for this destination yet</option>`
      }

      const matches = hotelsData.filter(h => {
        const hotelDestination = h.destination?.name || h.destination || ""
        return hotelDestination.toLowerCase() === chosenLower
      })

      if (matches.length) {
        matches.forEach(h => {
          hotelSelect.innerHTML += `<option value="${h.name}">${h.name} (${h.stars}★ — $${h.pricePerNight}/night)</option>`
        })
      } else {
        hotelSelect.innerHTML += `<option disabled>No hotels for this destination yet</option>`
      }
    }

    flightOptions.forEach(f => {
      flightSelect.innerHTML += `<option value="${f.airline}">${f.label}</option>`
    })

    if (!destinationNames.length) {
      destinationSelect.innerHTML += `<option disabled>No destinations available yet</option>`
    }

    if (!flightsData.length) {
      flightSelect.innerHTML += `<option disabled>No flights available yet</option>`
    }
  } catch (err) {
    destinationSelect.innerHTML = "<option value=''>Could not load destinations</option>"
    flightSelect.innerHTML      = "<option value=''>Could not load flights</option>"
    hotelSelect.innerHTML       = "<option value=''>Select Hotel</option>"
    console.error("Failed to load booking options:", err)
  }
}


// ─────────────────────────────────────────────────────────────
// AUTH STATE MANAGEMENT
// ─────────────────────────────────────────────────────────────

function updateNavbar() {
  const token = localStorage.getItem("token")
  const name  = localStorage.getItem("userName")
  const role  = localStorage.getItem("userRole")

  if (token) {
    document.getElementById("navLogin").style.display    = "none"
    document.getElementById("navRegister").style.display = "none"
    document.getElementById("navLogout").style.display   = "list-item"

    if (role === "admin") {
      document.getElementById("navUser").style.display    = "none"
      document.getElementById("navProfile").style.display = "none"
    } else {
      document.getElementById("navUser").style.display    = "list-item"
      document.getElementById("navProfile").style.display = "list-item"
      document.getElementById("navUser").querySelector("button").innerText = name
    }
  } else {
    document.getElementById("navLogin").style.display    = "list-item"
    document.getElementById("navRegister").style.display = "list-item"
    document.getElementById("navUser").style.display     = "none"
    document.getElementById("navProfile").style.display  = "none"
    document.getElementById("navLogout").style.display   = "none"
  }
}

function updateAdminUI() {
  const role         = localStorage.getItem("userRole")
  const customerArea = document.getElementById("customerArea")
  const adminArea    = document.getElementById("adminArea")

  if (role === "admin") {
    customerArea.style.display = "none"
    adminArea.style.display    = "block"
  } else {
    customerArea.style.display = "block"
    adminArea.style.display    = "none"
  }
}


// ─────────────────────────────────────────────────────────────
// USER REGISTRATION
// ─────────────────────────────────────────────────────────────

async function register() {
  const name      = document.getElementById("regName").value
  const email     = document.getElementById("regEmail").value
  const password  = document.getElementById("regPass").value
  const adminCode = document.getElementById("adminCode").value
  const msg       = document.getElementById("regMsg")

  if (!name || !email || !password) {
    msg.innerText = "Please fill all fields."
    return
  }

  const role = document.querySelector('input[name="regRole"]:checked')?.value || "user"

  const res = await fetch(`${BASE}/auth/register`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ name, email, password, role, adminCode })
  })

  const data = await res.json()

  if (res.ok) {
    localStorage.setItem("token",     data.token)
    localStorage.setItem("userName",  data.name)
    localStorage.setItem("userEmail", data.email)
    localStorage.setItem("userRole",  data.role || "user")

    if (data.role === "admin") {
      adminToken = data.token
      localStorage.setItem("adminToken", data.token)
      localStorage.setItem("adminName",  data.name)
    }

    closeModal("registerModal")
    updateNavbar()
    updateAdminUI()

    if (data.role === "admin") initAdmin()

    alert("Welcome " + data.name)

  } else {
    msg.innerText = data.message
  }
}


// ─────────────────────────────────────────────────────────────
// USER LOGIN
// ─────────────────────────────────────────────────────────────

async function login() {
  const email    = document.getElementById("loginEmail").value
  const password = document.getElementById("loginPass").value
  const msg      = document.getElementById("loginMsg")

  const role = document.getElementById("loginRole").checked ? "admin" : "user"

  const res = await fetch(`${BASE}/auth/login`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ email, password, role })
  })

  const data = await res.json()

  if (res.ok) {
    localStorage.setItem("token",     data.token)
    localStorage.setItem("userName",  data.name)
    localStorage.setItem("userEmail", data.email)
    localStorage.setItem("userRole",  data.role || "user")

    if (data.role === "admin") {
      adminToken = data.token
      localStorage.setItem("adminToken", data.token)
      localStorage.setItem("adminName",  data.name)
    }

    closeModal("loginModal")
    updateNavbar()
    updateAdminUI()

    if (data.role === "admin") initAdmin()

    alert("Welcome back " + data.name)

  } else {
    msg.innerText = data.message
  }
}


// ─────────────────────────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────────────────────────

function logout() {
  localStorage.clear()
  adminToken = ""
  updateNavbar()
  updateAdminUI()
  location.reload()
}


// ─────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────

async function openDashboard() {
  const name = localStorage.getItem("userName")
  document.getElementById("dashUserName").innerText = name
  openModal("dashboardModal")
  await loadTab("bookings")
}

async function loadTab(tab) {
  document.querySelectorAll(".dash-tab").forEach(btn => {
    btn.style.background = btn.dataset.tab === tab ? "orange" : "#0a1f44"
  })

  const container = document.getElementById("bookingsList")
  container.innerHTML = "<p>Loading...</p>"

  if (tab === "bookings")  await renderActiveBookings(container)
  if (tab === "history")   await renderHistory(container)
  if (tab === "statement") await renderAccountStatement(container)
  if (tab === "reviews")   await renderMyReviews(container)
}


// ─────────────────────────────────────────────────────────────
// ACTIVE BOOKINGS
// ─────────────────────────────────────────────────────────────

async function renderActiveBookings(container) {
  const token = localStorage.getItem("token")

  try {
    const res  = await fetch(`${BASE}/bookings/my-bookings`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()

    const active = data.filter(b => b.status !== "cancelled")
    cachedMyBookings = active  // FIX: cache so editBooking() can find them without re-fetching

    if (!active.length) {
      container.innerHTML = "<p>No active bookings.</p>"
      return
    }

    container.innerHTML = active.map(b => {
      const statusBadge = b.status === 'pending'
        ? `<span style="background:orange;color:white;padding:2px 10px;border-radius:20px;font-size:12px;font-weight:600;">⏳ Pending</span>`
        : `<span style="background:#0aa;color:white;padding:2px 10px;border-radius:20px;font-size:12px;font-weight:600;">✅ Confirmed</span>`

      return `
      <div class="booking-card">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <div>
            <p><b>📍 Destination:</b> ${b.destination}</p>
            <p><b>✈️ Flight:</b> ${b.flight}</p>
            <p><b>🏨 Hotel:</b> ${b.hotel}</p>
            <p><b>📅 Date:</b> ${b.date}</p>
            <p><b>📞 Phone:</b> ${b.phone || "—"}</p>
            <p><b>👥 Passengers:</b> ${b.passengers || 1}</p>
          </div>
          ${statusBadge}
        </div>
        <div style="margin-top:8px;">
          <button onclick="editBooking('${b._id}')">✏️ Edit</button>
          <button onclick="cancelBooking('${b._id}')" style="background:red;margin-left:8px;">🗑️ Cancel</button>
        </div>
      </div>
    `}).join("")
  } catch {
    container.innerHTML = "<p>Error loading bookings.</p>"
  }
}


// ─────────────────────────────────────────────────────────────
// ACCOUNT STATEMENT
// ─────────────────────────────────────────────────────────────

async function renderAccountStatement(container) {
  const token = localStorage.getItem("token")

  try {
    const [bookingsRes, paymentsRes, flightsRes, hotelsRes] = await Promise.all([
      fetch(`${BASE}/bookings/my-bookings`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${BASE}/payments/my-payments`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${BASE}/admin/flights`),
      fetch(`${BASE}/admin/hotels`)
    ])

    const bookings   = await bookingsRes.json()
    const payments   = await paymentsRes.json()
    const flightData = await flightsRes.json()
    const hotelData  = await hotelsRes.json()

    const flightPrices = {}
    flightData.forEach(f => { flightPrices[f.airline] = Number(f.price) || 0 })

    const hotelPrices = {}
    hotelData.forEach(h => { hotelPrices[h.name] = Number(h.pricePerNight) || 0 })

    const paidBookingIds = new Set(
      payments.filter(p => p.status === "paid").map(p => String(p.bookingId))
    )

    const activeBookings = bookings.filter(b => b.status !== "cancelled")

    if (!activeBookings.length) {
      container.innerHTML = `
        <p style="color:#666;">No bookings to show on your statement.</p>
        <button onclick="closeModal('dashboardModal');openBooking()" style="margin-top:10px;background:#0056b3;color:white;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;">
          Book a Trip
        </button>
      `
      return
    }

    let totalDue  = 0
    let totalPaid = 0

    const rows = activeBookings.map(b => {
      const passengers  = Number(b.passengers) || 1
      const flightCost  = (flightPrices[b.flight] || 0) * passengers
      const hotelCost   = hotelPrices[b.hotel] || 0
      const total       = flightCost + hotelCost
      const isPaid      = paidBookingIds.has(String(b._id))

      if (isPaid) totalPaid += total
      else        totalDue  += total

      const statusBadge = isPaid
        ? `<span style="background:#d4edda;color:#155724;padding:2px 10px;border-radius:20px;font-size:12px;font-weight:600;">✅ Paid</span>`
        : `<span style="background:#fff3cd;color:#856404;padding:2px 10px;border-radius:20px;font-size:12px;font-weight:600;">⏳ Pending</span>`

      const payBtn = isPaid
        ? ``
        : `<button onclick="openPaymentModal('${b._id}','${b.destination}','${b.flight}','${b.hotel}',${total})"
             style="background:#0056b3;color:white;border:none;padding:7px 14px;border-radius:8px;font-size:13px;cursor:pointer;margin-top:8px;">
             💳 Pay $${total.toLocaleString()}
           </button>`

      return `
        <div class="booking-card" style="border-left:4px solid ${isPaid ? '#28a745' : '#ffc107'};">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;">
            <div>
              <p style="font-weight:700;font-size:15px;margin:0 0 6px;">📍 ${b.destination}</p>
              <p style="margin:2px 0;font-size:13px;color:#555;">✈️ ${b.flight}</p>
              <p style="margin:2px 0;font-size:13px;color:#555;">🏨 ${b.hotel}</p>
              <p style="margin:2px 0;font-size:13px;color:#555;">📅 ${b.date} &nbsp;|&nbsp; 👥 ${passengers} passenger${passengers > 1 ? 's' : ''}</p>
            </div>
            ${statusBadge}
          </div>
          <div style="margin-top:10px;padding-top:10px;border-top:1px solid #eee;">
            <div style="display:flex;justify-content:space-between;font-size:13px;color:#555;">
              <span>Flight (${passengers} × $${flightPrices[b.flight] || 0})</span>
              <span>$${flightCost.toLocaleString()}</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:13px;color:#555;margin-top:4px;">
              <span>Hotel (1 night)</span>
              <span>$${hotelCost.toLocaleString()}</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-weight:700;font-size:15px;margin-top:8px;padding-top:8px;border-top:1px dashed #ccc;">
              <span>Total</span>
              <span>$${total.toLocaleString()}</span>
            </div>
          </div>
          ${payBtn}
        </div>
      `
    })

    container.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:18px;">
        <div style="background:#f0faf5;border:1px solid #b2dfcf;border-radius:10px;padding:12px;text-align:center;">
          <div style="font-size:11px;color:#2e7d5e;font-weight:600;">PAID</div>
          <div style="font-size:20px;font-weight:700;color:#1a5c43;">$${totalPaid.toLocaleString()}</div>
        </div>
        <div style="background:#fffbf0;border:1px solid #ffe08a;border-radius:10px;padding:12px;text-align:center;">
          <div style="font-size:11px;color:#b07d00;font-weight:600;">OUTSTANDING</div>
          <div style="font-size:20px;font-weight:700;color:#7a5500;">$${totalDue.toLocaleString()}</div>
        </div>
        <div style="background:#f0f4ff;border:1px solid #b5c8f5;border-radius:10px;padding:12px;text-align:center;">
          <div style="font-size:11px;color:#1a3a8a;font-weight:600;">TOTAL</div>
          <div style="font-size:20px;font-weight:700;color:#0d2660;">$${(totalPaid + totalDue).toLocaleString()}</div>
        </div>
      </div>
      ${rows.join("")}
      <div style="text-align:center;margin-top:12px;">
        <button onclick="loadPaymentHistory()" style="background:none;border:1px solid #0056b3;color:#0056b3;padding:8px 18px;border-radius:8px;cursor:pointer;font-size:13px;">
          📜 View Payment History
        </button>
      </div>
    `
  } catch (err) {
    console.error("Statement error:", err)
    container.innerHTML = "<p>Error loading account statement.</p>"
  }
}

async function loadPaymentHistory() {
  const token     = localStorage.getItem("token")
  const container = document.getElementById("bookingsList")

  try {
    const res  = await fetch(`${BASE}/payments/my-payments`, { headers: { Authorization: `Bearer ${token}` } })
    const data = await res.json()

    const historyHtml = data.length
      ? data.map(p => {
          const statusColor = p.status === "paid" ? "#28a745" : p.status === "failed" ? "#dc3545" : "#ffc107"
          const statusText  = p.status === "paid" ? "✅ Paid" : p.status === "failed" ? "❌ Failed" : "⏳ Pending"
          return `
            <div style="background:#fff;border:1px solid #eee;border-radius:10px;padding:12px;margin-bottom:10px;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <div>
                  <p style="font-weight:600;margin:0;font-size:14px;">📍 ${p.destination || "—"}</p>
                  <p style="font-size:12px;color:#888;margin:2px 0;">Txn: ${p.transactionId || p._id}</p>
                  <p style="font-size:12px;color:#888;margin:2px 0;">Method: ${formatMethod(p.method)}</p>
                  <p style="font-size:12px;color:#888;margin:2px 0;">${new Date(p.paidAt || p.createdAt).toLocaleString()}</p>
                </div>
                <div style="text-align:right;">
                  <div style="font-size:18px;font-weight:700;color:#0056b3;">$${Number(p.amount).toLocaleString()}</div>
                  <div style="font-size:12px;color:${statusColor};font-weight:600;">${statusText}</div>
                </div>
              </div>
            </div>
          `
        }).join("")
      : "<p style='color:#888;'>No payment history yet.</p>"

    container.innerHTML = `
      <button onclick="loadTab('statement')" style="background:none;border:none;color:#0056b3;cursor:pointer;font-size:13px;margin-bottom:12px;">← Back to Statement</button>
      <h3 style="margin:0 0 12px;font-size:15px;color:#333;">Payment History</h3>
      ${historyHtml}
    `
  } catch {
    document.getElementById("bookingsList").innerHTML = "<p>Error loading payment history.</p>"
  }
}

function formatMethod(method) {
  const map = {
    credit_card:    "💳 Credit / Debit Card",
    bank_transfer:  "🏦 Bank Transfer",
    digital_wallet: "📱 Digital Wallet",
    cash:           "💵 Cash"
  }
  return map[method] || method || "—"
}


// ─────────────────────────────────────────────────────────────
// PAYMENT MODAL
// ─────────────────────────────────────────────────────────────

function openPaymentModal(bookingId, destination, flight, hotel, amount) {
  document.getElementById("payBookingId").value          = bookingId
  document.getElementById("payAmountDisplay").innerText  = `$${Number(amount).toLocaleString()}`
  document.getElementById("payBookingSummary").innerText = `${destination} — ${flight} + ${hotel}`
  document.getElementById("payMsg").innerText            = ""
  document.getElementById("payCardNumber").value         = ""
  document.getElementById("payExpiry").value             = ""
  document.getElementById("payCvv").value                = ""
  document.getElementById("payCardName").value           = ""

  document.getElementById("payMethod").onchange = function () {
    document.getElementById("cardFields").style.display =
      this.value === "credit_card" ? "block" : "none"
  }
  document.getElementById("cardFields").style.display = "block"
  document.getElementById("payMethod").value = "credit_card"

  openModal("paymentModal")
}

function formatCardNumber(input) {
  let val = input.value.replace(/\D/g, "").substring(0, 16)
  input.value = val.replace(/(.{4})/g, "$1 ").trim()
}

function formatExpiry(input) {
  let val = input.value.replace(/\D/g, "").substring(0, 4)
  if (val.length >= 3) val = val.substring(0, 2) + "/" + val.substring(2)
  input.value = val
}

let isPaymentSubmitting = false

async function submitPayment() {
  if (isPaymentSubmitting) return
  isPaymentSubmitting = true

  const token     = localStorage.getItem("token")
  const bookingId = document.getElementById("payBookingId").value
  const method    = document.getElementById("payMethod").value
  const amountStr = document.getElementById("payAmountDisplay").innerText.replace(/[^0-9.]/g, "")
  const amount    = parseFloat(amountStr) || 0
  const msgEl     = document.getElementById("payMsg")
  const payBtn    = document.getElementById("payBtn")

  msgEl.innerText   = ""
  msgEl.style.color = "red"

  if (method === "credit_card") {
    const cardNum  = document.getElementById("payCardNumber").value.replace(/\s/g, "")
    const expiry   = document.getElementById("payExpiry").value
    const cvv      = document.getElementById("payCvv").value
    const cardName = document.getElementById("payCardName").value.trim()

    if (cardNum.length !== 16)           { msgEl.innerText = "Enter a valid 16-digit card number."; isPaymentSubmitting = false; return }
    if (!/^\d{2}\/\d{2}$/.test(expiry)) { msgEl.innerText = "Enter expiry as MM/YY.";              isPaymentSubmitting = false; return }
    if (cvv.length !== 3)                { msgEl.innerText = "Enter a valid 3-digit CVV.";          isPaymentSubmitting = false; return }
    if (!cardName)                       { msgEl.innerText = "Enter the name on card.";             isPaymentSubmitting = false; return }
  }

  payBtn.innerText = "Processing..."
  payBtn.disabled  = true

  try {
    const res = await fetch(`${BASE}/payments`, {
      method:  "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body:    JSON.stringify({ bookingId, amount, method })
    })

    const data = await res.json()

    if (!res.ok) {
      msgEl.innerText = data.message || "Payment failed. Please try again."
      return
    }

    closeModal("paymentModal")
    showPaymentSuccess(data)

  } catch (err) {
    msgEl.innerText = "Network error. Please try again."
    console.error("Payment error:", err)
  } finally {
    payBtn.innerText = "Pay Now"
    payBtn.disabled  = false
    isPaymentSubmitting = false
  }
}

function showPaymentSuccess(data) {
  const payment = data.payment || {}
  document.getElementById("paySuccessMsg").innerText =
    "Your payment has been recorded. A receipt is shown below."
  document.getElementById("payReceiptBox").innerHTML = `
    <div style="display:flex;justify-content:space-between;"><span>Destination</span><strong>${payment.destination || "—"}</strong></div>
    <div style="display:flex;justify-content:space-between;"><span>Amount</span><strong>$${Number(payment.amount || 0).toLocaleString()}</strong></div>
    <div style="display:flex;justify-content:space-between;"><span>Method</span><strong>${formatMethod(payment.method)}</strong></div>
    <div style="display:flex;justify-content:space-between;"><span>Status</span><strong style="color:#28a745;">✅ Paid</strong></div>
    <div style="display:flex;justify-content:space-between;"><span>Txn ID</span><strong style="font-size:12px;color:#666;">${payment.transactionId || "—"}</strong></div>
    <div style="display:flex;justify-content:space-between;"><span>Date</span><strong>${new Date(payment.paidAt || Date.now()).toLocaleString()}</strong></div>
  `
  openModal("paySuccessModal")
}


// ─────────────────────────────────────────────────────────────
// CREATE BOOKING
// ─────────────────────────────────────────────────────────────

let isSubmittingBooking = false

async function submitForm(e) {
  e.preventDefault()

  if (isSubmittingBooking) return
  isSubmittingBooking = true

  const token      = localStorage.getItem("token")
  const passengers = Math.min(10, Math.max(1, parseInt(document.getElementById("bookingPassengers").value) || 1))

  const data = {
    name:        document.getElementById("bookingName").value,
    email:       document.getElementById("bookingEmail").value,
    phone:       document.getElementById("bookingPhone").value,
    date:        document.getElementById("bookingDate").value,
    destination: document.getElementById("bookingDestination").value,
    flight:      document.getElementById("bookingFlightSelect").value,           // keep for display
    flightId: flightId,                   
    hotel:       document.getElementById("bookingHotel").value,
    passengers,
  }

  try {
    const res    = await fetch(`${BASE}/bookings`, {
      method:  "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body:    JSON.stringify(data)
    })
    const result = await res.json()
    alert(result.message)
    if (res.ok) closeModal("bookingModal")
  } catch (err) {
    alert("Booking failed. Please try again.")
  } finally {
    isSubmittingBooking = false
  }
}


// ─────────────────────────────────────────────────────────────
// EDIT BOOKING
// ─────────────────────────────────────────────────────────────

async function populateSelectWithOptions(selectId, url, valueKey, labelKey, selectedValue) {
  const select = document.getElementById(selectId)
  if (!select) return

  const placeholder = select.options[0]
  select.innerHTML = ""
  if (placeholder) select.appendChild(placeholder)

  try {
    const token = localStorage.getItem("token")
    const res   = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    const data  = await res.json()
    data.forEach(item => {
      const option      = document.createElement("option")
      const val         = item[valueKey] || item._id
      option.value      = val
      option.textContent = item[labelKey] || item.name || item.airline || val
      if (selectedValue && String(val) === String(selectedValue)) option.selected = true
      select.appendChild(option)
    })
  } catch (err) {
    console.error("Failed to load options for", selectId, err)
  }
}

// FIX: Uses cachedMyBookings instead of re-fetching GET /bookings/:id (which doesn't exist)
async function editBooking(bookingId) {
  const booking = cachedMyBookings.find(b => b._id === bookingId)
  if (!booking) return alert("Booking not found. Please refresh the dashboard.")

  document.getElementById("editBookingId").value  = booking._id
  document.getElementById("editPhone").value      = booking.phone || ""
  document.getElementById("editDate").value       = booking.date ? booking.date.split("T")[0] : ""
  document.getElementById("editPassengers").value = booking.passengers || 1

  await populateSelectWithOptions("editDestination", `${BASE}/admin/destinations`, "name",    "name",    booking.destination)
  await populateSelectWithOptions("editFlight",      `${BASE}/admin/flights`,      "airline", "airline", booking.flight)
  await populateSelectWithOptions("editHotel",       `${BASE}/admin/hotels`,       "name",    "name",    booking.hotel)

  openModal("editBookingModal")
}

let isEditingBooking = false

async function submitEditBooking() {
  if (isEditingBooking) return
  isEditingBooking = true

  const id          = document.getElementById("editBookingId").value
  const destination = document.getElementById("editDestination").value
  const flight      = document.getElementById("editFlight").value
  const hotel       = document.getElementById("editHotel").value
  const date        = document.getElementById("editDate").value
  const phone       = document.getElementById("editPhone").value
  const passengers  = Math.min(10, Math.max(1, parseInt(document.getElementById("editPassengers").value) || 1))

  if (!destination || !flight || !hotel || !date || !phone) {
    alert("Please fill all fields before saving.")
    isEditingBooking = false
    return
  }

  const token = localStorage.getItem("token")
  try {
    const res  = await fetch(`${BASE}/bookings/${id}`, {
      method:  "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body:    JSON.stringify({ destination, flight, hotel, date, phone, passengers })
    })
    const data = await res.json()
    alert(data.message)
    // FIX: both calls correctly inside the if block (was broken syntax before)
    if (res.ok) {
      closeModal("editBookingModal")
      openDashboard()
    }
  } catch (err) {
    alert("Update failed.")
  } finally {
    isEditingBooking = false
  }
}


// ─────────────────────────────────────────────────────────────
// CANCEL BOOKING
// ─────────────────────────────────────────────────────────────

let isCancellingBooking = false

async function cancelBooking(id) {
  if (!confirm("Are you sure you want to cancel this booking? This cannot be undone.")) return
  if (isCancellingBooking) return
  isCancellingBooking = true

  const token = localStorage.getItem("token")
  try {
    const res  = await fetch(`${BASE}/bookings/${id}`, {
      method:  "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    alert(data.message)
    if (res.ok) openDashboard()
  } catch (err) {
    alert("Cancellation failed. Please try again.")
  } finally {
    isCancellingBooking = false
  }
}


// ─────────────────────────────────────────────────────────────
// UPDATE PROFILE
// ─────────────────────────────────────────────────────────────

async function updateProfile() {
  const name     = document.getElementById("profileName").value
  const email    = document.getElementById("profileEmail").value
  const password = document.getElementById("profilePass").value
  const token    = localStorage.getItem("token")

  const res  = await fetch(`${BASE}/users/update-profile`, {
    method:  "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body:    JSON.stringify({ name, email, password })
  })
  const data = await res.json()

  if (res.ok) {
    localStorage.setItem("userName",  data.name)
    localStorage.setItem("userEmail", data.email)
    updateNavbar()
    alert(data.message)
    closeModal("profileModal")
  } else {
    alert(data.message)
  }
}


// ─────────────────────────────────────────────────────────────
// DELETE ACCOUNT
// ─────────────────────────────────────────────────────────────

async function deleteAccount() {
  if (!confirm("Are you sure you want to delete your account?")) return

  const token = localStorage.getItem("token")
  const res   = await fetch(`${BASE}/users/delete-account`, {
    method:  "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  })
  const data = await res.json()
  alert(data.message)
  localStorage.clear()
  updateNavbar()
  closeModal("profileModal")
}


// ─────────────────────────────────────────────────────────────
// BOOKING HISTORY
// ─────────────────────────────────────────────────────────────

async function renderHistory(container) {
  const token = localStorage.getItem("token")

  try {
    const res  = await fetch(`${BASE}/bookings/my-history`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()

    if (!data.length) {
      container.innerHTML = "<p>No booking history yet.</p>"
      return
    }

    container.innerHTML = data.map(h => {
      let statusBadge = ''
      if (h.status === 'pending') {
        statusBadge = `<span style="background:orange;color:white;padding:2px 10px;border-radius:20px;font-size:12px;font-weight:600;">⏳ Pending</span>`
      } else if (h.status === 'confirmed') {
        statusBadge = `<span style="background:#0aa;color:white;padding:2px 10px;border-radius:20px;font-size:12px;font-weight:600;">✅ Confirmed</span>`
      } else if (h.status === 'cancelled') {
        statusBadge = `<span style="background:red;color:white;padding:2px 10px;border-radius:20px;font-size:12px;font-weight:600;">❌ Cancelled</span>`
      } else {
        statusBadge = `<span style="background:#888;color:white;padding:2px 10px;border-radius:20px;font-size:12px;font-weight:600;">Unknown</span>`
      }

      const s = h.snapshot || {
        destination: h.destination,
        flight:      h.flight,
        hotel:       h.hotel,
        date:        h.date,
        passengers:  h.passengers,
      }

      const date = new Date(h.savedAt || h.createdAt || Date.now()).toLocaleDateString()

      return `
        <div class="booking-card">
          ${statusBadge}
          <p style="margin-top:6px;"><b>📍</b> ${s.destination || "—"}</p>
          <p><b>✈️</b> ${s.flight || "—"}</p>
          <p><b>🏨</b> ${s.hotel || "—"}</p>
          <p><b>📅 Trip date:</b> ${s.date || "—"}</p>
          <p><b>👥 Passengers:</b> ${s.passengers || h.passengers || 1}</p>
          <p style="font-size:12px;color:#888;">Archived on ${date}</p>
        </div>
      `
    }).join("")
  } catch {
    container.innerHTML = "<p>Error loading history.</p>"
  }
}


// ─────────────────────────────────────────────────────────────
// MY REVIEWS (dashboard tab)
// ─────────────────────────────────────────────────────────────

async function renderMyReviews(container) {
  const token = localStorage.getItem("token")

  try {
    const res  = await fetch(`${BASE}/reviews/my-reviews`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()

    if (!data.length) {
      container.innerHTML = `
        <p>You haven't written any reviews yet.</p>
        <button onclick="closeModal('dashboardModal');openReviewModal()" style="margin-top:10px;">✍️ Write a Review</button>
      `
      return
    }

    container.innerHTML = `
      <button onclick="closeModal('dashboardModal');openReviewModal()" style="margin-bottom:12px;">✍️ Write a Review</button>
      ${data.map(r => `
        <div class="booking-card">
          <p>${"⭐".repeat(r.rating)}</p>
          <p style="margin-top:4px;">${r.comment}</p>
          <p style="font-size:12px;color:#888;">${new Date(r.createdAt).toLocaleDateString()}</p>
          <button onclick="deleteReview('${r._id}')" style="background:red;margin-top:6px;">🗑️ Delete</button>
        </div>
      `).join("")}
    `
  } catch {
    container.innerHTML = "<p>Error loading reviews.</p>"
  }
}


// ─────────────────────────────────────────────────────────────
// REVIEWS
// ─────────────────────────────────────────────────────────────

function openReviewModal() {
  if (!localStorage.getItem("token")) {
    alert("Please sign in first to leave a review.")
    openModal("loginModal")
    return
  }

  document.getElementById("reviewComment").value   = ""
  document.getElementById("reviewMsg").textContent = ""
  setRating(0)
  openModal("reviewModal")
}

function setRating(value) {
  document.getElementById("reviewRating").value = value
  document.querySelectorAll(".star-btn").forEach((star, index) => {
    star.style.color = index < value ? "orange" : "#ccc"
  })
}

async function submitReview() {
  const rating  = parseInt(document.getElementById("reviewRating").value)
  const comment = document.getElementById("reviewComment").value.trim()
  const msgEl   = document.getElementById("reviewMsg")

  msgEl.style.color = "red"
  msgEl.textContent = ""

  if (!rating || rating < 1 || rating > 5) { msgEl.textContent = "Please select a star rating."; return }
  if (!comment)                             { msgEl.textContent = "Please write a comment.";      return }

  try {
    const token = localStorage.getItem("token")
    const res   = await fetch(`${BASE}/reviews`, {
      method:  "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body:    JSON.stringify({ rating, comment })
    })
    const data = await res.json()

    if (!res.ok) { msgEl.textContent = data.message || "Failed to submit review."; return }

    msgEl.style.color = "green"
    msgEl.textContent = "Review submitted successfully!"
    setTimeout(() => closeModal("reviewModal"), 1500)
  } catch (err) {
    msgEl.textContent = "Network error. Please try again."
  }
}

async function deleteReview(id) {
  if (!confirm("Delete this review?")) return

  const token = localStorage.getItem("token")
  const res   = await fetch(`${BASE}/reviews/${id}`, {
    method:  "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  })
  const data = await res.json()
  alert(data.message)
  loadTab("reviews")
}

async function loadLatestReviews() {
  const container = document.getElementById("latestReviews")
  if (!container) return

  try {
    const res  = await fetch(`${BASE}/reviews/latest`)
    const data = await res.json()

    if (!data.length) {
      container.innerHTML = "<p>No reviews yet. Be the first!</p>"
      return
    }

    container.innerHTML = data.map(r => `
      <div class="card simple" style="min-width:260px;max-width:320px;text-align:left;">
        <p><b>${r.userName}</b> &nbsp; ${"⭐".repeat(r.rating)}</p>
        <p style="margin-top:6px;">${r.comment}</p>
        <p style="font-size:11px;color:#aaa;margin-top:8px;">${new Date(r.createdAt).toLocaleDateString()}</p>
      </div>
    `).join("")
  } catch (err) {
    console.error("Load Reviews Error:", err)
  }
}


// ─────────────────────────────────────────────────────────────
// ADMIN — INIT & PANEL SWITCHING
// ─────────────────────────────────────────────────────────────

function initAdmin() {
  const role = localStorage.getItem("userRole")
  if (role !== "admin") return

  const name        = localStorage.getItem("adminName") || localStorage.getItem("userName") || "Admin"
  const adminNameEl = document.getElementById("adminName")
  const dashNameEl  = document.getElementById("dashName")

  if (adminNameEl) adminNameEl.innerText = name
  if (dashNameEl)  dashNameEl.innerText  = name

  loadStats()
  loadFlights()
}

function switchPanel(name) {
  document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"))
  document.querySelectorAll(".sidebar-item").forEach(s => s.classList.remove("active"))

  const panel = document.getElementById(`panel-${name}`)
  const item  = document.querySelector(`[data-panel="${name}"]`)

  if (panel) panel.classList.add("active")
  if (item)  item.classList.add("active")

  if (name === "flights")      loadFlights()
  if (name === "hotels")       loadHotels()
  if (name === "destinations") loadDestinations()
  if (name === "bookings")     loadAllBookings()
  if (name === "users")        loadUsers()
  if (name === "payments")     loadAdminPayments()
}

function adminLogout() {
  localStorage.removeItem("adminToken")
  localStorage.removeItem("adminName")
  localStorage.removeItem("userRole")
  localStorage.removeItem("token")
  adminToken = ""
  location.reload()
}

function toggleAdminCode(role) {
  document.getElementById("adminCodeRow").style.display =
    role === "admin" ? "block" : "none"
}


// ─────────────────────────────────────────────────────────────
// ADMIN — STATS
// ─────────────────────────────────────────────────────────────

async function loadStats() {
  try {
    const res  = await fetch(`${BASE}/admin/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    })
    const data = await res.json()

    document.getElementById("statUsers").innerText    = data.totalUsers    ?? "0"
    document.getElementById("statBookings").innerText = data.totalBookings ?? "0"
    document.getElementById("statFlights").innerText  = data.totalFlights  ?? "0"
    document.getElementById("statHotels").innerText   = data.totalHotels   ?? "0"

    try {
      const payRes  = await fetch(`${BASE}/payments/admin/summary`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      })
      const payData   = await payRes.json()
      const revenueEl = document.getElementById("statRevenue")
      if (revenueEl) revenueEl.innerText = `$${Number(payData.totalCollected || 0).toLocaleString()}`
    } catch { /* silently ignore */ }

  } catch (err) {
    console.error("Stats error:", err)
  }
}


// ─────────────────────────────────────────────────────────────
// ADMIN — PAYMENTS PANEL
// FIX: Cross-references bookings to show pending payments that
//      have no payment record yet (previously they were invisible)
// ─────────────────────────────────────────────────────────────

async function loadAdminPayments() {
  try {
    const [paymentsRes, bookingsRes, flightsRes, hotelsRes] = await Promise.all([
      fetch(`${BASE}/payments/admin/all`, { headers: { Authorization: `Bearer ${adminToken}` } }),
      fetch(`${BASE}/admin/bookings`,     { headers: { Authorization: `Bearer ${adminToken}` } }),
      fetch(`${BASE}/admin/flights`),
      fetch(`${BASE}/admin/hotels`)
    ])

    const payments   = await paymentsRes.json()
    const bookings   = await bookingsRes.json()
    const flightData = await flightsRes.json()
    const hotelData  = await hotelsRes.json()

    // Build price lookup maps
    const flightPrices = {}
    flightData.forEach(f => { flightPrices[f.airline] = Number(f.price) || 0 })

    const hotelPrices = {}
    hotelData.forEach(h => { hotelPrices[h.name] = Number(h.pricePerNight) || 0 })

    // IDs of bookings that already have a real payment record
    const paidBookingIds = new Set(payments.map(p => String(p.bookingId)))

    // Synthesize a pending row for every active booking with no payment record
    const pendingRecords = bookings
      .filter(b => b.status !== "cancelled" && !paidBookingIds.has(String(b._id)))
      .map(b => {
        const passengers = Number(b.passengers) || 1
        const flightCost = (flightPrices[b.flight] || 0) * passengers
        const hotelCost  = hotelPrices[b.hotel] || 0
        return {
          _id:           b._id,
          bookingId:     b._id,
          transactionId: "—",
          userName:      b.user?.name  || b.name  || "—",
          userEmail:     b.user?.email || b.email || "—",
          destination:   b.destination,
          amount:        flightCost + hotelCost,
          method:        "—",
          status:        "pending",
          paidAt:        null,
          createdAt:     b.createdAt || new Date().toISOString()
        }
      })

    // Merge real records + synthetic pending records
    allPayments = [...payments, ...pendingRecords]
    renderPaymentsTable(allPayments)
    updatePaymentSummaryCards(allPayments)

  } catch (err) {
    console.error("Load payments error:", err)
    const tbody = document.getElementById("paymentsBody")
    if (tbody) tbody.innerHTML = `<tr><td colspan="8" class="empty">Error loading payments.</td></tr>`
  }
}

function filterPayments() {
  const filter   = document.getElementById("paymentStatusFilter").value
  const filtered = filter === "all"
    ? allPayments
    : allPayments.filter(p => p.status === filter)
  renderPaymentsTable(filtered)
}

function renderPaymentsTable(data) {
  const tbody = document.getElementById("paymentsBody")
  if (!tbody) return

  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="empty">No payments found.</td></tr>`
    return
  }

  tbody.innerHTML = data.map(p => {
    const statusColor =
      p.status === "paid"   ? "background:#d4edda;color:#155724;" :
      p.status === "failed" ? "background:#f8d7da;color:#721c24;" :
                              "background:#fff3cd;color:#856404;"
    const statusLabel =
      p.status === "paid"   ? "✅ Paid"    :
      p.status === "failed" ? "❌ Failed"  :
                              "⏳ Pending"

    const paidAtDisplay = p.paidAt || p.createdAt
      ? new Date(p.paidAt || p.createdAt).toLocaleString()
      : "—"

    return `
      <tr>
        <td style="font-size:12px;color:#888;font-family:monospace;">${p.transactionId || p._id}</td>
        <td><b>${p.userName || p.user?.name || "—"}</b></td>
        <td style="font-size:13px;color:#555;">${p.userEmail || p.user?.email || "—"}</td>
        <td><span class="badge badge-dest">${p.destination || "—"}</span></td>
        <td style="font-weight:700;">$${Number(p.amount).toLocaleString()}</td>
        <td style="font-size:13px;">${formatMethod(p.method)}</td>
        <td><span style="padding:2px 10px;border-radius:20px;font-size:12px;font-weight:600;${statusColor}">${statusLabel}</span></td>
        <td style="font-size:12px;color:#666;">${paidAtDisplay}</td>
      </tr>
    `
  }).join("")
}

function updatePaymentSummaryCards(data) {
  let collected = 0, pending = 0, failed = 0

  data.forEach(p => {
    const amount = Number(p.amount) || 0
    if (p.status === "paid")    collected += amount
    else if (p.status === "failed") failed += amount
    else                            pending += amount
  })

  const c  = document.getElementById("adminTotalCollected")
  const pe = document.getElementById("adminTotalPending")
  const f  = document.getElementById("adminTotalFailed")
  const t  = document.getElementById("adminTotalTxns")

  if (c)  c.innerText  = `$${collected.toLocaleString()}`
  if (pe) pe.innerText = `$${pending.toLocaleString()}`
  if (f)  f.innerText  = `$${failed.toLocaleString()}`
  if (t)  t.innerText  = data.length
}


// ─────────────────────────────────────────────────────────────
// ADMIN — FLIGHTS
// ─────────────────────────────────────────────────────────────

async function loadFlights() {
  try {
    const res = await fetch(`${BASE}/admin/flights`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    })
    flights = await res.json()
    const tbody = document.getElementById("flightsBody")
    if (!tbody) return

    if (!flights.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="empty">No flights yet. Add one above.</td></tr>`
      return
    }

    tbody.innerHTML = flights.map(f => {
      const total    = Number(f.totalSeats || f.seats || 0)
      const booked   = Number(f.bookedSeats || 0)
      const empty    = Math.max(total - booked, 0)
      const destName = f.destination?.name || f.destination

      return `
        <tr>
          <td><b>${f.airline}</b></td>
          <td><span class="badge badge-dest">${destName || "Unknown"}</span></td>
          <td>${f.departureTime}</td>
          <td>$${f.price}</td>
          <td>${booked} booked / ${empty} empty</td>
          <td>
            <button class="btn-edit" onclick="openFlightModal('${f._id}')">✏️ Edit</button>
            <button class="btn-del"  onclick="deleteFlight('${f._id}')">🗑️ Delete</button>
          </td>
        </tr>
      `
    }).join("")
  } catch (err) {
    console.error("Load flights error:", err)
  }
}

function openFlightModal(id = "") {
  document.getElementById("flightMsg").innerText        = ""
  document.getElementById("flightId").value             = id
  document.getElementById("flightModalTitle").innerText = id ? "Edit Flight" : "Add Flight"

  if (id) {
    const f = flights.find(x => x._id === id)
    if (f) {
      const destName = f.destination?.name || f.destination || ""
      document.getElementById("fAirline").value     = f.airline       || ""
      document.getElementById("fDestination").value = destName
      document.getElementById("fDeparture").value   = f.departureTime || ""
      document.getElementById("fPrice").value       = f.price         || 0
      document.getElementById("fSeats").value       = f.totalSeats || f.seats || 0
      document.getElementById("fBooked").value      = f.bookedSeats   || 0
    }
  } else {
    ["fAirline","fDestination","fDeparture","fPrice","fSeats"].forEach(id => {
      document.getElementById(id).value = ""
    })
    document.getElementById("fBooked").value = "0"
  }

  openModal("flightModal")
}

async function saveFlight() {
  const id  = document.getElementById("flightId").value
  const msg = document.getElementById("flightMsg")
  const payload = {
    airline:       document.getElementById("fAirline").value.trim(),
    destination:   document.getElementById("fDestination").value.trim(),
    departureTime: document.getElementById("fDeparture").value.trim(),
    price:         Number(document.getElementById("fPrice").value),
    totalSeats:    Number(document.getElementById("fSeats").value),
    bookedSeats:   Number(document.getElementById("fBooked").value)
  }

  if (!payload.airline || !payload.destination || !payload.departureTime || !payload.price || !payload.totalSeats) {
    msg.innerText = "Please fill all required fields."
    return
  }

  const url    = id ? `${BASE}/admin/flights/${id}` : `${BASE}/admin/flights`
  const method = id ? "PUT" : "POST"

  const res  = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
    body:    JSON.stringify(payload)
  })
  const data = await res.json()

  if (res.ok) { closeModal("flightModal"); loadFlights(); loadStats() }
  else        { msg.innerText = data.message || "Could not save flight" }
}

async function deleteFlight(id) {
  if (!confirm("Delete this flight?")) return
  await fetch(`${BASE}/admin/flights/${id}`, {
    method: "DELETE", headers: { Authorization: `Bearer ${adminToken}` }
  })
  loadFlights()
  loadStats()
}


// ─────────────────────────────────────────────────────────────
// ADMIN — HOTELS
// ─────────────────────────────────────────────────────────────

async function loadHotels() {
  try {
    const res = await fetch(`${BASE}/admin/hotels`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    })
    hotels = await res.json()
    const tbody = document.getElementById("hotelsBody")
    if (!tbody) return

    if (!hotels.length) {
      tbody.innerHTML = `<tr><td colspan="5" class="empty">No hotels yet. Add one above.</td></tr>`
      return
    }

    tbody.innerHTML = hotels.map(h => `
      <tr>
        <td><b>${h.name}</b></td>
        <td><span class="badge badge-dest">${h.destination}</span></td>
        <td><span class="badge badge-star">${"⭐".repeat(h.stars || 0)}</span></td>
        <td>$${h.pricePerNight}/night</td>
        <td>
          <button class="btn-edit" onclick="openHotelModal('${h._id}')">✏️ Edit</button>
          <button class="btn-del"  onclick="deleteHotel('${h._id}')">🗑️ Delete</button>
        </td>
      </tr>
    `).join("")
  } catch (err) {
    console.error("Load hotels error:", err)
  }
}

function openHotelModal(id = "") {
  document.getElementById("hotelMsg").innerText        = ""
  document.getElementById("hotelId").value             = id
  document.getElementById("hotelModalTitle").innerText = id ? "Edit Hotel" : "Add Hotel"

  if (id) {
    const h = hotels.find(x => x._id === id)
    if (h) {
      document.getElementById("hName").value  = h.name          || ""
      document.getElementById("hDest").value  = h.destination   || ""
      document.getElementById("hStars").value = h.stars         || 4
      document.getElementById("hPrice").value = h.pricePerNight || 0
    }
  } else {
    ["hName","hDest","hPrice"].forEach(id => document.getElementById(id).value = "")
    document.getElementById("hStars").value = "4"
  }

  openModal("hotelModal")
}

async function saveHotel() {
  const id  = document.getElementById("hotelId").value
  const msg = document.getElementById("hotelMsg")
  const payload = {
    name:          document.getElementById("hName").value.trim(),
    destination:   document.getElementById("hDest").value.trim(),
    stars:         Number(document.getElementById("hStars").value),
    pricePerNight: Number(document.getElementById("hPrice").value)
  }

  if (!payload.name || !payload.destination || !payload.pricePerNight) {
    msg.innerText = "Please fill all required fields."
    return
  }

  const url    = id ? `${BASE}/admin/hotels/${id}` : `${BASE}/admin/hotels`
  const method = id ? "PUT" : "POST"

  const res  = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
    body:    JSON.stringify(payload)
  })
  const data = await res.json()

  if (res.ok) { closeModal("hotelModal"); loadHotels(); loadStats() }
  else        { msg.innerText = data.message || "Could not save hotel" }
}

async function deleteHotel(id) {
  if (!confirm("Delete this hotel?")) return
  await fetch(`${BASE}/admin/hotels/${id}`, {
    method: "DELETE", headers: { Authorization: `Bearer ${adminToken}` }
  })
  loadHotels()
  loadStats()
}


// ─────────────────────────────────────────────────────────────
// ADMIN — DESTINATIONS
// ─────────────────────────────────────────────────────────────

async function loadDestinations() {
  try {
    const res = await fetch(`${BASE}/admin/destinations`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    })
    destinations = await res.json()
    const tbody = document.getElementById("destBody")
    if (!tbody) return

    if (!destinations.length) {
      tbody.innerHTML = `<tr><td colspan="5" class="empty">No destinations yet. Add one above.</td></tr>`
      return
    }

    tbody.innerHTML = destinations.map(d => `
      <tr>
        <td><b>${d.name}</b></td>
        <td style="max-width:220px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${d.description}</td>
        <td>$${d.price}</td>
        <td style="font-size:12px;color:#888;">${d.imageUrl || "—"}</td>
        <td>
          <button class="btn-edit" onclick="openDestModal('${d._id}')">✏️ Edit</button>
          <button class="btn-del"  onclick="deleteDest('${d._id}')">🗑️ Delete</button>
        </td>
      </tr>
    `).join("")
  } catch (err) {
    console.error("Load destinations error:", err)
  }
}

function openDestModal(id = "") {
  document.getElementById("destMsg").innerText        = ""
  document.getElementById("destId").value             = id
  document.getElementById("destModalTitle").innerText = id ? "Edit Destination" : "Add Destination"

  if (id) {
    const d = destinations.find(x => x._id === id)
    if (d) {
      document.getElementById("dName").value    = d.name        || ""
      document.getElementById("dDesc").value    = d.description || ""
      document.getElementById("dCountry").value = d.country     || ""
      document.getElementById("dPrice").value   = d.price       || 0
      document.getElementById("dImage").value   = d.imageUrl    || ""
    }
  } else {
    ["dName","dDesc","dCountry","dPrice","dImage"].forEach(id => document.getElementById(id).value = "")
  }

  openModal("destModal")
}

async function saveDest() {
  const id  = document.getElementById("destId").value
  const msg = document.getElementById("destMsg")
  const payload = {
    name:        document.getElementById("dName").value.trim(),
    description: document.getElementById("dDesc").value.trim(),
    country:     document.getElementById("dCountry").value.trim(),
    price:       Number(document.getElementById("dPrice").value),
    imageUrl:    document.getElementById("dImage").value.trim()
  }

  if (!payload.name || !payload.description || !payload.country || !payload.price) {
    msg.innerText = "Please fill all required fields."
    return
  }

  const url    = id ? `${BASE}/admin/destinations/${id}` : `${BASE}/admin/destinations`
  const method = id ? "PUT" : "POST"

  const res  = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
    body:    JSON.stringify(payload)
  })
  const data = await res.json()

  if (res.ok) { closeModal("destModal"); loadDestinations() }
  else        { msg.innerText = data.message || "Could not save destination" }
}

async function deleteDest(id) {
  if (!confirm("Delete this destination?")) return
  await fetch(`${BASE}/admin/destinations/${id}`, {
    method: "DELETE", headers: { Authorization: `Bearer ${adminToken}` }
  })
  loadDestinations()
}


// ─────────────────────────────────────────────────────────────
// ADMIN — ALL BOOKINGS
// ─────────────────────────────────────────────────────────────

async function loadAllBookings() {
  try {
    const res   = await fetch(`${BASE}/admin/bookings`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    })
    const data  = await res.json()
    const tbody = document.getElementById("bookingsBody")
    if (!tbody) return

    if (!data.length) {
      tbody.innerHTML = `<tr><td colspan="8" class="empty">No bookings yet.</td></tr>`
      return
    }

    tbody.innerHTML = data.map(b => {
      let statusBadge = ''
      if (b.status === 'pending') {
        statusBadge = `<span style="background:orange;color:white;padding:2px 8px;border-radius:10px;font-size:11px;">⏳ Pending</span>`
      } else if (b.status === 'confirmed') {
        statusBadge = `<span style="background:#0aa;color:white;padding:2px 8px;border-radius:10px;font-size:11px;">✅ Confirmed</span>`
      } else if (b.status === 'cancelled') {
        statusBadge = `<span style="background:red;color:white;padding:2px 8px;border-radius:10px;font-size:11px;">❌ Cancelled</span>`
      } else {
        statusBadge = `<span style="background:#888;color:white;padding:2px 8px;border-radius:10px;font-size:11px;">Unknown</span>`
      }

      return `
        <tr>
          <td>${b.user?.name  || b.name  || "—"}</td>
          <td>${b.user?.email || b.email || "—"}</td>
          <td><span class="badge badge-dest">${b.destination}</span></td>
          <td>${b.flight}</td>
          <td>${b.hotel}</td>
          <td>${b.date}</td>
          <td>${b.passengers || 1}</td>
          <td>${statusBadge}</td>
        </tr>
      `
    }).join("")
  } catch (err) {
    console.error("Load all bookings error:", err)
  }
}


// ─────────────────────────────────────────────────────────────
// ADMIN — USERS
// ─────────────────────────────────────────────────────────────

async function loadUsers() {
  try {
    const res   = await fetch(`${BASE}/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    })
    const data  = await res.json()
    const tbody = document.getElementById("usersBody")
    if (!tbody) return

    if (!data.length) {
      tbody.innerHTML = `<tr><td colspan="4" class="empty">No users registered yet.</td></tr>`
      return
    }

    tbody.innerHTML = data.map(u => `
      <tr>
        <td><b>${u.name}</b></td>
        <td>${u.email}</td>
        <td><span class="badge badge-dest">${u.role}</span></td>
        <td>${new Date(u.createdAt || Date.now()).toLocaleDateString()}</td>
      </tr>
    `).join("")
  } catch (err) {
    console.error("Load users error:", err)
  }
}


// ─────────────────────────────────────────────────────────────
// PAGE INIT — runs once when the DOM is ready
// ─────────────────────────────────────────────────────────────

window.addEventListener("DOMContentLoaded", () => {
  updateNavbar()
  updateAdminUI()
  initAdmin()
  loadLatestReviews()
  loadDestinationsToPage()
})
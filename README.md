# TravelX – Travel Agency Web Application
**TravelX** is a full‑stack travel booking platform that lets users explore destinations, book flights and hotels, make payments, and manage their trips.
**Administrators** have a dedicated panel to manage inventory, users, bookings, and payments.

## ✨ Features
### 👤 User Features
**Authentication** – Register, login, and logout with JWT‑based sessions.

**Browse** – View destinations, flights, and hotels in a clean grid layout.

**Book Trips** – Select destination, flight, hotel, travel date, and number of passengers (1‑10).

**My Dashboard** – View active bookings, edit or cancel them, and see booking history.

**Account Statement** – See paid and outstanding amounts per booking, with an option to pay directly.

**Payment** – Simulate payments via credit card, bank transfer, digital wallet, or cash. Payment status is tracked.

**Reviews** – Write and delete reviews; latest reviews appear on the homepage.

### 🔒 Admin Features
**Admin Panel** – Dedicated interface with sidebar navigation.

**Dashboard** – Quick stats: total users, bookings, flights, hotels, and revenue.

**Manage Flights** – Add, edit, or delete flights (airline, destination, departure, price, seats).

**Manage Hotels** – Add, edit, or delete hotels (name, destination, stars, price per night).

**Manage Destinations** – Add, edit, or delete destinations (name, description, country, price, image URL).

**View All Bookings** – See all user bookings with status (pending/confirmed/cancelled).

**View Users** – List registered users with their roles.

**Payments Oversight** – View all payment transactions, filter by status, and see revenue summary.

## 🧰 Tech Stack
### Layer	Technologies
**Backend**	–            Node.js, Express.js, MongoDB (Mongoose ODM).
**Frontend** –	          HTML5, CSS3, Vanilla JavaScript (no frameworks).
**Auth**	–               JSON Web Tokens (JWT), bcryptjs.
**Other** –             	CORS, dotenv.

---

## 📁 Project Structure

```
travelX/
│
├── frontend/                 # Frontend
│   ├── index.html
│   ├── style.css
│   └── script.js
│
├── backend/                 # Backend
│   ├── config/
|   |   └── db.js
│   ├── controllers/
|   |   ├── authController.js
|   |   ├── bookingController.js
|   |   ├── reviewController.js
|   |   ├── userController.js
|   |   ├── paymentController.js
|   |   └── statsController.js
│   ├── middleware/
|   |   └── auth.js
│   ├── models/
|   |   ├── booking.js
|   |   ├── bookingHistory.js
|   |   ├── Payment.js
|   |   ├── review.js
|   |   ├── user.js
|   |   ├── hotel.js
|   |   ├── flight.js
|   |   └── Destination.js
│   └── routes
|   |   ├── authRoutes.js
|   |   ├── bookingRoutes.js
|   |   ├── reviewRoutes.js
|   |   ├── statsRoutes.js
|   |   ├── adminRoutes.js
|   |   ├── paymentRoutes.js
|   |   └── userRoutes.js
|   ├── package.json
|   ├── package-lock.json
|   ├──server.js
|   └──stat.js
├── .gitignore
└── README.md
```

---

## ⚙️ Installation & Setup

### 🔹 1. Clone the Repository

```bash
git clone https://github.com/MuhammadAsadUllah27/travelX.git
cd travelX
```

---

### 🔹 2. Install Dependencies

```bash
npm install
```
---
###  3. Run the Application

```bash
node server.js
```
## 🔌 API Endpoints
All endpoints are prefixed with /api (except the root).
Authentication is required for protected routes (pass Authorization: Bearer <token> header).

Auth
**POST /auth/register** – Register a new user (body: {name, email, password, role?, adminCode?})

**POST /auth/login** – Login (body: {email, password})

**GET /auth/me** – Get current user profile (requires token)

**PUT /auth/me** – Update profile (requires token)

**DELETE /auth/me** – Delete account (requires token)

**Users** (profile management)
**PUT /users/update-profile** – Update profile (requires token)

**DELETE /users/delete-account** – Delete account (requires token)

**Bookings**
**GET /bookings/my-bookings** – Get user's active bookings

**GET /bookings/my-history** – Get user's booking history

**POST /bookings** – Create a new booking (requires token)

**PUT /bookings/:id** – Update a booking (requires token)

**DELETE /bookings/:id** – Cancel a booking (requires token)

**Reviews**
**POST /reviews** – Create a review (requires token)

**GET /reviews/my-reviews** – Get user's reviews

**DELETE /reviews/:id** – Delete a review (requires token)

**GET /reviews/latest** – Get latest reviews (public)

**Payments**
**POST /payments** – Make a payment (requires token)

**GET /payments/my-payments** – Get user's payment history

**GET /payments/admin/all** – Admin: get all payments

**GET /payments/admin/summary** – Admin: revenue summary

**Admin** (all require admin token)
**GET /admin/stats** – System stats

**GET /admin/flights** – Get all flights (public)

**POST /admin/flights** – Add flight

**PUT /admin/flights/:id** – Update flight

**DELETE /admin/flights/:id** – Delete flight

**GET /admin/hotels** – Get all hotels (public)

**POST /admin/hotels** – Add hotel

**PUT /admin/hotels/:id** – Update hotel

**DELETE /admin/hotels/:id** – Delete hotel

**GET /admin/destinations** – Get all destinations (public)

**POST /admin/destinations** – Add destination

**PUT /admin/destinations/:id** – Update destination

**DELETE /admin/destinations/:id** – Delete destination

**GET /admin/bookings** – Get all bookings

**GET /admin/users** – Get all users

**Stats** (public)
**GET /stats** – Aggregate booking stats by destination

## 🧪 Testing
No automated tests are included yet. Manual testing can be performed using Postman or by using the frontend interface.

## 🤝 Contributing
Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

Fork the repository.

Create a new branch (git checkout -b feature/your-feature).

Commit your changes (git commit -am 'Add some feature').

Push to the branch (git push origin feature/your-feature).

Open a Pull Request.

## 📄 License
This project is licensed under the MIT License – see the LICENSE file for details.

## 🙏 Acknowledgements
Icons used: emoji icons (✈️, 🏨, 💳, etc.) from Unicode.

Background images are placeholders; replace with your own assets.

---

##  Author

**Muhammad Asad Ullah**
 BS Computer Science Student
 Future AI & Robotics Engineer

---
## Happy Traveling! 🌍
---


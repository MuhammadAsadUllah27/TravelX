# TravelX

> A full-stack, modern travel agency web application designed to simplify trip planning, booking, and user experience through a clean interface and powerful backend.

---

##  Overview

**TravelX** is a complete travel management platform where users can explore destinations, book trips, manage bookings, and share reviews.
It is built using **modern web technologies** with a scalable backend architecture.

---

## ✨ Features

### 👤 User Features

* User Registration & Login (Authentication System)
* Browse travel destinations and packages
* Book trips easily with a smooth workflow
* View booking history
* Cancel bookings
* Add and manage reviews

---

### Admin / System Features

*Manage bookings
* Manage users
* Manage travel packages
* Real-time updates via API

---

## Tech Stack

### Frontend

* HTML
* CSS
* JavaScript 

### Backend

* Node.js
* Express.js

### Database

* MongoDB 

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
|   |   └── db
│   ├── controllers/
|   |   ├── authController
|   |   ├── bookingController
|   |   ├── reviewController
|   |   └── userController
│   ├── middleware/
|   |   └── auth
│   ├── models/
|   |   ├── booking
|   |   ├── bookingHistory
|   |   ├── cancelledBooking
|   |   ├── review
|   |   └── user
│   └── routes
|   |   ├── authRoutes
|   |   ├── bookingRoutes
|   |   ├── reviewRoutes
|   |   ├── statsRoutes
|   |   └── userRoutes
|   ├── package.json
|   ├── package-lock.json
|   ├──server
|   └──stat
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
npm start
```
##  API Endpoints (Sample)

| Method | Endpoint           | Description          |
| ------ | ------------------ | -------------------- |
| POST   | /api/auth/register | Register user        |
| POST   | /api/auth/login    | Login user           |
| GET    | /api/packages      | Get travel packages  |
| POST   | /api/bookings      | Create booking       |
| GET    | /api/bookings/my   | User booking history |

---

##  Security Features

* Password hashing using bcrypt
* JWT-based authentication
* Protected API routes
* Environment variable protection

---

## Future Improvements

*  AI-based travel recommendations
*  Payment gateway integration
*  Mobile responsive optimization
*  Multi-language support
*  Admin analytics dashboard

---

##  Author

**Muhammad Asad Ullah**
 BS Computer Science Student
 Future AI & Robotics Engineer

---

## Vision

This project is part of a larger goal to build intelligent systems and contribute to the future of **AI-powered smart applications** in industries like travel, robotics, and automation.

---


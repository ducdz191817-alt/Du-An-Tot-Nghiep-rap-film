# 🎬 Nova Cinema - Premium Movie Ticket Booking System

A state-of-the-art, premium Movie Ticket Reservation web application featuring real-time seat charts generations, concession snacks aggregators, email receipt invoicing, and a fully featured administrative analytics dashboard.

---

## 🚀 Key Features

* **Beautiful Glassmorphic UI**: High-end modern styling utilizing Outfit typography, deep dark colors, glowing borders, and smooth micro-animations.
* **Master Seating Charts**: Beautiful, curved cinematic layout mapping standard, VIP (+20k), and Sweetbox Couple (+40k) seats with real-time occupancy checks.
* **Concession Snacks Selector**: Popcorn, soft drinks, and custom popcorn combo adjusters with instant receipt price accumulation.
* **Email Invoices**: Automated ticketing confirmation emails sent with custom transaction keys (falls back to clean console logs during local testing!).
* **Admin Analytics & Dashboards**: Full interactive SVG charts mapping monthly booking revenue, movie shares, venue performance statistics, and quick CRUD entries.

---

## 🛠️ Project Structure

```
movie-ticket-booking/
├── backend/
│   ├── src/
│   │   ├── config/database.js          # Mongoose DB connector
│   │   ├── models/                     # Mongo Schemas (User, Movie, Booking...)
│   │   ├── controllers/                # REST Controllers (Auth, Bookings...)
│   │   ├── routes/                     # Router Mappings (Admin, Movies...)
│   │   ├── middleware/                 # Route protections & Global Error handlers
│   │   ├── utils/                      # Seat generators, Mail transmitters
│   │   └── app.js                      # Express App & Seeder Routine
│   ├── .env                            # Backend configuration keys
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/                 # Layout cards, seat grids, dashboards
│   │   ├── pages/                      # Auth screens, checkout, history logs
│   │   ├── services/                   # Axios API instances & service functions
│   │   ├── store/                      # Redux Toolkit sessions & booking states
│   │   ├── hooks/                      # Custom useAuth & useBooking selectors
│   │   └── App.jsx                     # Routes wrapped in Redux Provider
│   ├── index.html                      # SEO metadata & Google Fonts
│   ├── tailwind.config.js              # Theme extend, custom HSL brand colors
│   └── package.json
└── README.md                           # Startup guidebook
```

---

## 🔌 Running Locally

### 1. Setup & Launch MongoDB
Ensure you have MongoDB running locally, or specify your cloud string in `backend/.env`.
```bash
# Verify MongoDB status
brew services list
```

### 2. Startup Backend API
The backend automatically checks for entries inside the database on launch. If empty, it **automatically seeds initial catalogs** (movies, theater venues, cinema rooms, standard concession items, and pre-registers default accounts!).
```bash
cd backend
npm install
npm run dev
```
*Backend runs on `http://localhost:5000`*

### 3. Startup Frontend Client
```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```
*Frontend runs on `http://localhost:5173`*

---

## 🔑 Seed Accounts (Pre-registered)

The seeder automatically inserts two accounts for immediate dashboard testing out-of-the-box:

### 👤 Standard User Account (Ticket Reservation Flow)
* **Email**: `john@gmail.com`
* **Password**: `userpassword123`

### 🛡️ Administration Account (Admin Console & Analytics Dashboard)
* **Email**: `admin@booking.com`
* **Password**: `adminpassword123`

---

## 💎 Design Tokens & CSS Utilities
Custom brand colors are pre-configured inside `tailwind.config.js`:
* **Brand Red**: `#e50914` (Accented glow keys)
* **Deep Charcoal**: `#0a0a0c`
* **Card Charcoal**: `#16161e`
* **Borders Slate**: `#2a2a35`

Enjoy the ultimate movie booking experience! 🍿🎥

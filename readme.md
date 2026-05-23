This project is used to find the nearby pharmacy to save the user time and user can know which pharmacy is open and check medicine availability
# Live Medicine Availability Finder

Live Medicine Availability Finder is a full‑stack web application that helps users quickly find which nearby pharmacies have a required medicine in stock, along with price and distance. Pharmacies can maintain their live stock and location, and an admin can verify pharmacy accounts.

## Features

### User
- Register/Login (JWT)
- Search medicines and view:
  - Pharmacy name
  - Stock availability
  - Price
  - Distance (when location permission is allowed)
- Nearby pharmacies list based on current location
- In‑app map view for pharmacy locations (OpenStreetMap)

### Pharmacy
- Register as pharmacy and request verification
- Add/Update medicine stock (quantity + price)
- Search and view own stock
- Set pharmacy location using:
  - Map click (Leaflet)
  - Current location button
  - Manual latitude/longitude
- “View on map” for saved location

### Admin
- View pharmacy verification requests in Notifications
- Approve/Deny pharmacy accounts
- Monitor pharmacy/user data

## Tech Stack

**Frontend**
- React
- React Router
- Axios
- Leaflet + React‑Leaflet (OpenStreetMap)

**Backend**
- Node.js
- Express.js
- PostgreSQL (Render)
- pg (Postgres driver)
- bcryptjs (password hashing)
- jsonwebtoken (JWT)
- cors, dotenv

## Database Schema
PostgreSQL tables:
- `users` (roles: user/pharmacy/admin, verification status)
- `pharmacies` (latitude/longitude, open_24x7)
- `medicines`
- `pharmacy_medicines` (stock, price)

Schema file:
- `backend/sql/schema.sql`

## Deployment
- Frontend: Render Static Site
- Backend: Render Web Service
- Database: Render PostgreSQL

## Run Locally

### Backend
```bash
cd backend
npm install
# create backend/.env with DATABASE_URL and JWT_SECRET
npm start

# Live Medicine Availability Finder (MVP)

## Backend folder structure

```txt
backend/
  package.json
  .env.example
  server.js
  src/
    config/
      db.js
    controllers/
      authController.js
      medicineController.js
      pharmacyController.js
    middleware/
      auth.js
      role.js
    routes/
      adminRoutes.js
      authRoutes.js
      medicineRoutes.js
      pharmacyRoutes.js
  sql/
    schema.sql
```

## Frontend folder structure

```txt
frontend/
  package.json
  .env.example
  public/
    index.html
  src/
    api/
      axios.js
    components/
      Navbar.js
    pages/
      AdminDataPage.js
      HomePage.js
      MedicineSearchPage.js
      NearbyPharmacyPage.js
      EmergencyModePage.js
      LoginPage.js
      RegisterPage.js
    App.js
    index.js
    styles.css
```

## Run backend

1. Copy `backend/.env.example` to `backend/.env`
2. Set PostgreSQL variables in `backend/.env`
3. Run SQL in `backend/sql/schema.sql`
3. Install and run:

```bash
cd backend
npm install
npm run dev
```

## Run frontend

1. Copy `frontend/.env.example` to `frontend/.env`
2. Install and run:

```bash
cd frontend
npm install
npm start
```

## Implemented APIs

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/medicine/search-medicine?name=`
- `GET /api/pharmacy/nearby-pharmacies`
- `POST /api/pharmacy/update-stock` (pharmacy role only)
- `GET /api/medicine/alternative-medicine?category=`
- `GET /api/admin/users` (admin only)
- `GET /api/admin/medicines` (admin only)
- `GET /api/admin/pharmacies` (admin only)

## Host both on Render (free setup)

1. Push project to GitHub.
2. Create Render PostgreSQL database.
3. In Render Postgres, open SQL editor and run `backend/sql/schema.sql`.
4. Create Render Web Service for backend:
   - Root directory: `backend`
   - Build command: `npm install`
   - Start command: `npm start`
   - Env:
     - `JWT_SECRET=<strong-secret>`
     - `DATABASE_URL=<Render Postgres Internal Database URL>`
     - `DB_SSL=true`
5. Create Render Static Site for frontend:
   - Root directory: `frontend`
   - Build command: `npm install && npm run build`
   - Publish directory: `build`
   - Env:
     - `REACT_APP_API_BASE_URL=https://<your-backend-service>.onrender.com/api`
6. Redeploy frontend after setting env.

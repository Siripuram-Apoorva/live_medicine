CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'pharmacy', 'admin')),
  pharmacy_verified BOOLEAN NOT NULL DEFAULT FALSE,
  pharmacy_verification_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  pharmacy_license_no VARCHAR(100),
  pharmacy_store_name VARCHAR(150),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS pharmacy_verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS pharmacy_verification_status VARCHAR(20) NOT NULL DEFAULT 'pending';
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS pharmacy_license_no VARCHAR(100);
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS pharmacy_store_name VARCHAR(150);

UPDATE users
SET pharmacy_verification_status = CASE
  WHEN role IN ('user', 'admin') THEN 'approved'
  WHEN role = 'pharmacy' AND pharmacy_verified = TRUE THEN 'approved'
  WHEN role = 'pharmacy' AND pharmacy_verified = FALSE THEN 'pending'
  ELSE 'pending'
END
WHERE pharmacy_verification_status IS NULL
   OR pharmacy_verification_status NOT IN ('pending', 'approved', 'denied');

CREATE TABLE IF NOT EXISTS medicines (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  category VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS pharmacies (
  id SERIAL PRIMARY KEY,
  user_id INT UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  name VARCHAR(120) NOT NULL UNIQUE,
  latitude NUMERIC(10, 7) NOT NULL,
  longitude NUMERIC(10, 7) NOT NULL,
  open_24x7 BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS pharmacy_medicines (
  pharmacy_id INT NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  medicine_id INT NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
  stock INT NOT NULL DEFAULT 0,
  price NUMERIC(10, 2) NOT NULL,
  PRIMARY KEY (pharmacy_id, medicine_id)
);

INSERT INTO medicines (name, category) VALUES
('Paracetamol 500mg', 'Fever'),
('Ibuprofen 400mg', 'Pain Relief'),
('Azithromycin 500mg', 'Antibiotic'),
('Cetirizine 10mg', 'Allergy'),
('ORS Powder', 'Hydration')
ON CONFLICT (name) DO UPDATE SET category = EXCLUDED.category;

-- Seed users with password: password123
INSERT INTO users (name, email, password, role) VALUES
('CityCare Pharmacy Owner', 'pharmacy1@example.com', '$2a$10$35nIPtx9jGeL9So5soO2du3XtA9V6h6Sa2atK.jWnMbxY0nQjCW3u', 'pharmacy'),
('HealthPlus Pharmacy Owner', 'pharmacy2@example.com', '$2a$10$35nIPtx9jGeL9So5soO2du3XtA9V6h6Sa2atK.jWnMbxY0nQjCW3u', 'pharmacy'),
('Admin', 'admin@example.com', '$2a$10$35nIPtx9jGeL9So5soO2du3XtA9V6h6Sa2atK.jWnMbxY0nQjCW3u', 'admin')
ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name;

UPDATE users
SET pharmacy_verified = TRUE,
    pharmacy_verification_status = 'approved',
    pharmacy_store_name = COALESCE(pharmacy_store_name, name)
WHERE role = 'pharmacy';

INSERT INTO pharmacies (user_id, name, latitude, longitude, open_24x7) VALUES
((SELECT id FROM users WHERE email = 'pharmacy1@example.com'), 'CityCare Pharmacy', 12.9716, 77.5946, TRUE),
((SELECT id FROM users WHERE email = 'pharmacy2@example.com'), 'HealthPlus Pharmacy', 12.9611, 77.6387, FALSE)
ON CONFLICT (name) DO UPDATE SET open_24x7 = EXCLUDED.open_24x7;

INSERT INTO pharmacy_medicines (pharmacy_id, medicine_id, stock, price) VALUES
((SELECT id FROM pharmacies WHERE name = 'CityCare Pharmacy'), (SELECT id FROM medicines WHERE name = 'Paracetamol 500mg'), 30, 12.50),
((SELECT id FROM pharmacies WHERE name = 'CityCare Pharmacy'), (SELECT id FROM medicines WHERE name = 'Ibuprofen 400mg'), 20, 18.00),
((SELECT id FROM pharmacies WHERE name = 'HealthPlus Pharmacy'), (SELECT id FROM medicines WHERE name = 'Paracetamol 500mg'), 0, 11.75),
((SELECT id FROM pharmacies WHERE name = 'HealthPlus Pharmacy'), (SELECT id FROM medicines WHERE name = 'Cetirizine 10mg'), 40, 9.99)
ON CONFLICT (pharmacy_id, medicine_id) DO UPDATE
SET stock = EXCLUDED.stock, price = EXCLUDED.price;

# Medora

A hospital management system for a single hospital, built with the MERN stack. Patients book appointments online, doctors record visits and prescriptions, the front desk handles walk-ins and billing, and an admin manages staff and setup.

> **Demo project.** Medora is a portfolio project, not a real hospital. All data is fake. Do not enter real patient information.

## Features

**Patients**
- Sign up, find a doctor by department and book a free time slot
- See their own appointments, visit notes, prescriptions and invoices

**Doctors**
- See their own appointments and the patients they have seen
- Consultation form: vitals, complaint, diagnosis, notes and prescriptions
- Can only open records of patients who have an appointment with them

**Receptionists**
- Register walk-in patients, book and cancel appointments
- Create and print invoices
- Never see clinical notes

**Admins**
- Create staff accounts, departments and doctor profiles (schedule, slot length, fee)
- Upload doctor photos

**Public landing page**
- Hero, department list, live stats from the database, doctor cards with a department filter, FAQ and contact details

## How it works (and why)

| Topic | Approach |
|---|---|
| Double booking | A partial unique index on `{ doctor, date, slotStart }` where `status` is `"booked"`. MongoDB rejects a second booking for the same slot, and the API returns a 409. Cancelling frees the slot. |
| Time slots | Generated from each doctor's working days, hours and slot length, in the hospital timezone (`HOSPITAL_TZ`). Past times are blocked. |
| Access control | Every route checks the user's role on the server. Patients get a 404 for other people's ids, doctors only reach their own patients and visits, and billing is blocked for doctors. |
| Hidden staff sign-in | Admin and receptionist sign in through a form opened with a keyboard shortcut, or at `/staff-login`. This is only a convenience: the server's `/api/auth/staff-login` accepts only those roles, and `/api/auth/login` refuses them. |
| Money | Stored as integer minor units. Totals are calculated on the server. |
| Numbering | A `Counter` collection generates patient numbers (P-10001) and invoice numbers (INV-1001). |
| Sessions | JWT in an httpOnly, SameSite=Lax cookie (Secure in production). |

## Security notes

- Passwords hashed with bcrypt (cost 12)
- Generic "Invalid email or password" errors, plus a dummy hash comparison so response time does not reveal whether an email exists
- Input validation with zod, rate limiting with express-rate-limit, security headers with helmet
- Public sign-up creates patients only. Admin is created by a script, and staff are created by the admin.
- Photo uploads: admin only, 2 MB limit, JPG/PNG/WebP only, type checked from the file's first bytes, random file names

## Tech stack

- **Frontend:** React (Vite), Tailwind CSS v4, react-router-dom, axios
- **Backend:** Node.js, Express 5, Mongoose
- **Database:** MongoDB Atlas

## Project structure

```
client/          React app
  src/pages/       Landing, Dashboard, Appointments, Consultation, Billing, ...
  src/components/  App shell, staff login modal, doctor photo upload, ...
server/
  src/models/      User, Department, DoctorProfile, Appointment, PatientProfile, Visit, Invoice, Counter
  src/routes/      auth, users, departments, doctors, appointments, patients, visits, billing, public, doctor photos
  src/middleware/  auth (protect, requireRole), validation
  src/scripts/     seedAdmin.js
```

## Run it locally

You need Node.js 20.6 or newer and a MongoDB Atlas database (the free tier works).

1. **Install**
   ```
   cd server && npm install
   cd ../client && npm install
   ```

2. **Create `server/.env`**
   ```
   PORT=5000
   CLIENT_ORIGIN=http://localhost:5173
   MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/medora?appName=Cluster0
   JWT_SECRET=a-long-random-string
   HOSPITAL_TZ=Asia/Karachi
   ```
   Generate a secret with:
   ```
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```
   Never commit `.env`.

3. **Create the first admin**
   Add `ADMIN_EMAIL` and an `ADMIN_PASSWORD` of at least 10 characters to `server/.env`, then run:
   ```
   cd server
   npm run seed:admin
   ```
   Remove `ADMIN_PASSWORD` from `.env` afterwards.

4. **Start both servers**
   ```
   cd server && npm run dev
   cd client && npm run dev
   ```
   Open http://localhost:5173.

5. **Set up the hospital**
   Open the staff sign-in (the keyboard shortcut ctrl+shift+L or `/staff-login`), sign in as admin, then add departments, doctor accounts and doctor profiles. Patients can register from the public page.

## Deployment

Medora can run as a single web service: the Express server also serves the built React app, so cookies stay same-site.

- **Build command:** `npm run build`
- **Start command:** `npm start`
- **Environment variables:** `NODE_ENV=production`, `NODE_VERSION`, `MONGODB_URI`, `JWT_SECRET`, `CLIENT_ORIGIN`, `HOSPITAL_TZ`
- Health check path: `/api/health`

Free hosting limits to know about:
- Free web services may sleep when idle, so the first request can be slow.
- Uploaded doctor photos are stored on the server's disk and are lost when the service restarts or redeploys. Use cloud storage for permanent photos.

## Demo accounts

Use these to try the app. They contain fake data only.

| Role | Email | Password |
|---|---|---|
| Patient | usmankashif@gmail.com | usman12345 |
| Doctor | wardah@gmail.com | doctor12345 |
| Receptionist | repo@gmail.com | repo12345  |

The admin account is private.
<img width="1919" height="912" alt="Screenshot 2026-10-17 165131" src="https://github.com/user-attachments/assets/d703b7a8-1c3b-41bb-84ab-ef75e2090324" />


## What I learned

- Letting the database enforce rules (a unique index) is safer than checking in application code
- Hiding a button is not security, so the server has to check every role on every request
- Debugging cookies across a dev proxy and in production

## License

Personal portfolio project. All data shown is sample data.

# ExpenseHub (Expense Management)

Comprehensive Expense Management web application built with Node.js, Express, MongoDB and EJS. It supports three user roles (Admin, Manager, User) and includes real-time updates with Socket.IO, image uploads via Cloudinary, email notifications using Nodemailer, and secure authentication with Passport.

---

## Table of Contents
- Project overview
- Features
- Architecture & folders
- Tech stack & dependencies
- Environment / configuration
- Installation & run
- Database & cloud media
- Email (Nodemailer)
- Real-time (Socket.IO)
- Validation and security notes
- How routes/controllers map to features
- Troubleshooting & next steps

## Project overview

ExpenseHub is an internal expense management system that allows:
- Admins: create/manage companies, admins, managers, and users; view and manage expenses across the company.
- Managers: review expenses submitted by their team, approve or reject expenses, and view team metrics.
- Users: submit expense reports with image attachments (receipts), view their expense history and status.

The app updates relevant interfaces in real-time using Socket.IO so Admins/Managers/Users receive immediate feedback when expenses are added, approved, or rejected.

## Key features

- Multi-role access: Admin, Manager, User (built using Passport and passport-local-mongoose).
- Real-time notifications & table updates via Socket.IO (rooms per admin/manager/user).
- Image upload and storage using Cloudinary (via `multer-storage-cloudinary`).
- Email notifications using Nodemailer (helper in `utils/emailTransporter.js`).
- Input validation using Joi (`schema.js`).
- MongoDB session store for Express sessions (connect-mongo).
- Templating with EJS and `ejs-mate` layouts.

## Architecture & important files

- `app.js` — main Express app, DB connection, Passport setup, Socket.IO wiring and global routes.
- `cloudConfig.js` — Cloudinary and multer-storage-cloudinary configuration used for image uploads.
- `schema.js` — Joi validation schemas used by routes to validate incoming payloads.
- `utils/`:
  - `emailTransporter.js` — nodemailer transport instance (currently configured for Gmail).
  - `authentication.js`, `expressError.js`, `wrapAsync.js` — helpers for auth and error handling.
- `controllers/` — controllers for `admin`, `manager`, `user`, `auth` (business logic).
- `routes/` — route files mapping HTTP endpoints to controllers.
- `models/` — Mongoose models: `company`, `admin`, `manager`, `user`, `expense`, etc.
- `public/` — static assets (CSS, client JS). Client socket logic lives in `public/js/*`.
- `views/` — EJS view templates for each role and UI.

## Tech stack & dependencies

Primary runtime: Node.js (engine in package.json is `24.8.0`). Key dependencies (see `package.json`):

- express, ejs, ejs-mate
- mongoose
- passport, passport-local, passport-local-mongoose
- joi (validation)
- socket.io (real-time)
- cloudinary, multer, multer-storage-cloudinary
- nodemailer (email)
- connect-mongo (session storage)
- dotenv, moment, method-override, connect-flash

Refer to `package.json` for full dependency list.

## Environment / configuration

Create a `.env` file (do NOT commit it). Required environment variables used by the project:

```
NODE_ENV=development
ATLAS_URL=<your-mongodb-atlas-connection-string>
SECRET=<session-secret>
CLOUD_NAME=<cloudinary-cloud-name>
CLOUD_API_KEY=<cloudinary-api-key>
CLOUD_API_SECRET=<cloudinary-api-secret>
# Optional: to replace hard-coded nodemailer credentials (recommended)
EMAIL_USER=<your-email@example.com>
EMAIL_PASS=<your-email-or-app-password>
```

Notes:
- `ATLAS_URL` should be the MongoDB connection string for your database (Atlas or local). Example: `mongodb+srv://<user>:<pass>@cluster0.mongodb.net/expenseManagement?retryWrites=true&w=majority`.
- `SECRET` is used to sign session cookies.
- Cloudinary credentials allow image uploads; configure a Cloudinary account and set the three variables above.
- `EMAIL_USER` and `EMAIL_PASS` are recommended to configure the mail transporter; the code currently contains a hard-coded Gmail user and an app password in `utils/emailTransporter.js`—move those into environment variables before deploying.

## Installation & run (local)

1. Clone the repository and cd into it:

   git clone <repo-url>
   cd ExpenseManagement

2. Install dependencies:

   npm install

3. Create `.env` in project root and set variables as shown above.

4. Start the app:

   npm start

5. Open https://expensemanagement-e6i4.onrender.com in your browser.

The server listens on port `8080` by default (see `app.js`).

## Database & media storage

- The app uses MongoDB (Mongoose) and expects `ATLAS_URL` to be configured.
- Sessions are stored in MongoDB via `connect-mongo` (session store configured in `app.js`).
- Images (expense receipts) are uploaded to Cloudinary using `multer-storage-cloudinary`. The storage configuration lives in `cloudConfig.js` and uses environment variables to configure the Cloudinary SDK.

## Email (Nodemailer)

- The project includes `utils/emailTransporter.js` which exports a transport called `transporter`.
- Current implementation:
  - service: `gmail`
  - credentials are hard-coded in `utils/emailTransporter.js` (email and app password).

Important security note: do not store credentials in source control. Replace the hard-coded credentials with variables using `process.env.EMAIL_USER` and `process.env.EMAIL_PASS`. Example (recommended change to `utils/emailTransporter.js`):

```js
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
module.exports.transporter = transporter;
```

The code currently sends emails for actions like account creation, user deletion, and user edit. Some calls are commented out—enable/adjust as needed.

## Real-time (Socket.IO)

Socket.IO is configured in `app.js`. The `io` instance is attached to the Express app via `app.set('io', io)` so controllers can access it as `req.app.get('io')`.

Room naming convention:
- Admin: `admin_<adminId>`
- Manager: `manager_<managerId>`
- User: `user_<userId>`

Clients join a room by emitting `joinRoom` from the front-end. Example client-side code (see `public/js/*`):

```js
const socket = io();
socket.on('connect', () => {
  socket.emit('joinRoom', { userId: userId });
});
```

Socket events used by the app (server emits these):

- `addExpense` — payload shape (example):
  {
    _id: <expenseId>,
    title: <string>,
    userName: <string>,
    category: <string>,
    amount: <number>,
    status: "Pending",
    date: <date-string>,
    image: <url>
  }

- `approvedExpense` — payload: { _id: <expenseId> }
- `rejectedExpense` — payload: { _id: <expenseId> }

How events are emitted (examples):
- When a User or Manager creates an expense, controllers call:
  - `io.to('admin_<adminId>').emit('addExpense', expenseData)`
  - `io.to('manager_<managerId>').emit('addExpense', expenseData)`
- When a Manager approves an expense, controllers call:
  - `io.to('admin_<adminId>').emit('approvedExpense', { _id })`
  - `io.to('user_<userId>').emit('approvedExpense', { _id })`
- When a Manager rejects an expense, controllers call similar `rejectedExpense` emits.

Client-side listeners are found at:
- `public/js/user/user.js` — listens for `approvedExpense` and `rejectedExpense` and updates the UI counts and badges.
- `public/js/manager/manager.js` — listens for `addExpense` to append new pending rows for review.
- `public/js/admin/admin.js` — listens for `addExpense`, `approvedExpense`, `rejectedExpense` to update dashboard tables and counts.

This setup allows immediate updates without page refresh.

## Validation

- `schema.js` contains Joi validation schemas used in routes to validate incoming payloads. Schemas include `addUserSchema`, `addExpenseSchema`, and `signUp` for registration.

## Authentication & sessions

- Uses `passport-local` + `passport-local-mongoose` with the `User` model.
- Sessions are configured with `express-session` and persisted in MongoDB using `connect-mongo`.

## Routes & controllers (high-level)

- `/auth` — registration and login (see `controllers/auth.js`).
- `/companies/:id` — user routes (add expense, list users), `routes/user.js` -> `controllers/user.js`.
- `/companies/:id/managers/:managerId` — manager pages and expense review, `routes/manager.js` -> `controllers/manager.js`.
- `/companies/:id/admins/:adminId` — admin dashboard and management features, `routes/admin.js` -> `controllers/admin.js`.

Use the `routes/` files to see full endpoint lists and middleware.

## Security & deployment notes

- Do NOT commit `.env` or any secrets.
- Replace hard-coded email credentials in `utils/emailTransporter.js` with env variables.
- For production:
  - Use HTTPS and secure cookie flags.
  - Use a strong `SESSION SECRET`.
  - Restrict Cloudinary and email account access.
  - Consider rate limiting and CSRF protection for forms.

## Troubleshooting & common issues

- Ensure `ATLAS_URL` is correct and the IP whitelist allows connections (if using Atlas).
- If images fail to upload, verify Cloudinary credentials and that `multer` uploads are successful.
- If emails are not sent:
  - If using Gmail, ensure you use an App Password for the account or configure OAuth2.
  - Check `utils/emailTransporter.js` and the env values.
- Socket.IO: if client isn't receiving events, confirm the client includes `<script src="/socket.io/socket.io.js"></script>` and that the browser is connecting to the same origin and port as the server.

## Suggested next steps / improvements

- Move email credentials to `.env` and update `utils/emailTransporter.js` to use `process.env`.
- Add tests for controllers and socket event emissions.
- Add rate limiting and input sanitization beyond Joi where necessary.
- Add a health-check endpoint and a `Procfile` for platforms like Heroku.
- Dockerize the app for consistent deployments.

## Contact & contribution

If you want to contribute, fork the repository, create a branch and open a PR. Provide precise steps and a short description of your change.

---

Thanks for using ExpenseHub — this README documents current behavior (server, socket events, and email flows) and suggests a few immediate security improvements.

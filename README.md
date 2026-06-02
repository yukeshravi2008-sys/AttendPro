# AttendPro - Employee Attendance Management System

A complete SaaS Employee Attendance Management System built with React, Firebase, and Tailwind CSS.

## Features

- **GPS-based Check-in/Check-out** with geofencing and haversine distance validation
- **Role-based Access Control** (Super Admin, Admin, Employee)
- **Attendance Tracking** with late arrival detection
- **Leave Management** with approval workflow
- **QR Code Attendance** for quick check-in
- **Selfie Capture** during check-in
- **Live Map View** of employee locations
- **Export Reports** to CSV, Excel, and PDF
- **Dark Mode** support
- **Mobile Responsive** design
- **Holiday and Shift Management**

## Tech Stack

- React 18 + Vite
- Firebase (Auth + Firestore + Storage)
- Tailwind CSS
- React Router v6
- React Leaflet + OpenStreetMap
- Recharts
- xlsx, jsPDF
- date-fns

## Setup

1. **Clone the repository**

```bash
git clone <repo-url>
cd attendance-system
```

2. **Install dependencies**

```bash
npm install
```

3. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Create a new project
   - Enable Authentication (Email/Password)
   - Create Firestore Database
   - Create Storage bucket

4. **Configure environment variables**

```bash
cp .env.example .env
```

Fill in your Firebase config values in `.env`.

5. **Deploy Firestore Security Rules**

```bash
# Copy rules from firestore.rules and deploy via Firebase Console
```

6. **Run development server**

```bash
npm run dev
```

7. **Build for production**

```bash
npm run build
```

## Deployment

Deploy to Vercel or Netlify:

1. Connect your repository
2. Add environment variables from `.env`
3. Set build command: `npm run build`
4. Set output directory: `dist`

## Project Structure

```
src/
  components/     # Reusable UI components
  pages/          # Route pages
  hooks/          # Custom React hooks
  lib/            # Firebase configuration
  utils/          # Utility functions
  context/        # React context providers
```

## Roles

- **Super Admin**: Manage companies, system-wide oversight
- **Admin**: Manage employees, view reports, approve leaves
- **Employee**: Check-in/out, apply for leave, view attendance

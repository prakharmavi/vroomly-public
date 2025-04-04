# Vroomly - Car Sharing Platform

live demo: https://vroomly.pmavi.com/  

## Overview

Vroomly is a modern car sharing application that enables users to list their vehicles for rent and rent cars from other users. Built with React, TypeScript, and Firebase, Vroomly provides a seamless experience for car owners and renters alike.

## Features

### User Management
- User authentication (email/password and Google sign-in)
- Profile creation and management
- User onboarding flow
- Profile completion tracking
- Public user profiles

### Car Management
- List vehicles with detailed information
- Upload multiple car photos
- Manage car availability
- View and edit car listings
- Deactivate or remove listings

### Booking System
- Search for available cars
- Filter by location, dates, price, and car features
- Book cars for specific date ranges
- Manage bookings as owner or renter
- Booking approval workflow

### Messaging System
- Real-time messaging between users
- Conversation management
- Unread message notifications

### Reviews
- Leave reviews for users
- Rate experiences
- View user ratings

## Technology Stack

### Frontend
- React 19
- TypeScript
- Vite 6
- TailwindCSS 4
- Framer Motion for animations
- shadcn/ui component library
- Radix UI primitives
- Lucide React for icons

### Backend
- Firebase Authentication
- Firestore Database
- Firebase Hosting
- Firebase Storage

### Additional Tools
- ESLint
- date-fns for date manipulation
- Lodash for utilities

## Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- Firebase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/vroomly.git
   cd vroomly
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment variables**
   Create a `.env` file in the root directory with the following variables:
   ```
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
   VITE_IMGBB_API_KEY=your-imgbb-api-key
   ```

4. **Update Firebase configuration**
   Modify `/src/firebase/firebase.ts` to use environment variables:

   ```typescript
   const firebaseConfig = {
     apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
     authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
     projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
     storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
     messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
     appId: import.meta.env.VITE_FIREBASE_APP_ID,
     measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
   };
   ```

5. **Update ImgBB API key**
   Modify `/src/config/api-keys.ts` to use environment variables:
   ```typescript
   export const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY;
   ```

6. **Run the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   Navigate to `http://localhost:5173` to see the application running

### Firebase Setup

1. Create a new Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Enable Authentication with Email/Password and Google providers
3. Create a Firestore database
4. Set up Firebase storage
5. Configure Firebase Hosting
6. Add your web app to the Firebase project and get the configuration

## Project Structure

The project is organized as follows:

```
src/
├── assets/         # Static assets like images
├── components/     # Reusable React components
├── config/         # Configuration files
├── firebase/       # Firebase setup and initialization
├── hooks/          # Custom React hooks
├── pages/          # Page components
├── styles/         # Global and component-specific styles
├── utils/          # Utility functions
├── App.tsx         # Main application component
├── main.tsx        # Entry point of the application
└── vite-env.d.ts   # TypeScript environment definitions
```

## Learnings as a First-Time Programming Student

As a first-time programming student, building Vroomly was an incredible learning experience. Here are some key takeaways:

1. **Understanding React and TypeScript**: Learning how to build components, manage state, and use TypeScript for type safety was challenging but rewarding.
2. **Firebase Integration**: Setting up authentication, Firestore, and storage taught me how to work with backend services.
3. **Project Structure**: Organizing files and directories in a logical way helped me understand the importance of maintainable code.
4. **Debugging and Problem-Solving**: Encountering and resolving errors improved my problem-solving skills.
5. **Version Control**: Using Git and GitHub for collaboration and version control was a valuable skill to learn.

This project not only helped me understand the technical aspects of web development but also taught me the importance of perseverance and continuous learning.

## Acknowledgments

### AI Assistance
Special thanks to GitHub Copilot for being an invaluable pair programming companion throughout this project. What would have taken months of trial and error was accomplished in a fraction of the time with Copilot's assistance. As a first-time programming student, having access to:

- Real-time code suggestions that adapt to my project context
- Alternative implementation approaches when I got stuck
- Explanations of complex patterns and techniques
- Help with debugging and troubleshooting

Copilot truly lived up to its name, serving as a real "copilot" during my development journey. The AI assistance acted as a superpower, filling knowledge gaps while still allowing me to make architectural decisions and develop my understanding of the codebase. This project would have been significantly more challenging without this technology accelerating my learning process.

# Amazon Now - Grocery in 9 Mins

A quick-commerce mobile web application that allows users to order groceries in under 10 minutes. 

It includes an **AI-powered Voice Search** and **AI Meal Planner** that automatically recommends all the necessary ingredients from the catalog based on the user's recipe queries.

## Prerequisites
- Node.js 18+
- MongoDB running locally (`mongod`) or MongoDB Atlas URI
- Groq API Key (for the AI Meal Planner & Smart Search)

## 1. Setup Environment
```bash
cd backend
cp .env.example .env
```
Edit the `.env` file and add your credentials:
```env
GROQ_API_KEY=gsk_...
MONGO_URI=mongodb://localhost:27017/amazon-now
PORT=3001
```

## 2. Install Dependencies
```bash
# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

## 3. Seed the Database
Seed the 249+ products into your MongoDB database:
```bash
cd backend
npm run seed
```

## 4. Start Development Servers

You will need to run the frontend and backend in two separate terminals.

**Terminal 1 — Backend (Port 3001)**
```bash
cd backend
npm run dev
```

**Terminal 2 — Frontend (Port 3000)**
```bash
cd frontend
npm run dev
```

## 5. View the App
Open [http://localhost:3000](http://localhost:3000) in your browser. 
Since this is a mobile-first app, you should **open Chrome DevTools and toggle the Device Toolbar** to view the app at a mobile width (e.g., iPhone 12/13/14 Pro).

## Key Features
- **AI Meal Planner:** Ask "I want to make Biryani" and the AI will auto-populate your cart with rice, chicken, spices, curd, etc.
- **Voice Search:** Tap the microphone in the search bar to speak your grocery needs.
- **Dynamic Image Loading:** Automatically maps Unsplash images to products.
- **Global Cart:** Cart state persists across the entire application using Zustand.

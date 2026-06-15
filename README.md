# Amazon Now — Grocery in 9 Mins

A quick-commerce mobile web app that allows users to order groceries delivered in under 10 minutes. Built for **Amazon HackOn** with a fully AWS-native infrastructure.

---

## AWS Infrastructure

| Service | Purpose |
|---|---|
| **Amazon S3** | Stores 387 product images (`amzn-now-hackon` bucket) |
| **Amazon CloudFront** | Global CDN for fast image delivery (`d124nq9cpdz5ld.cloudfront.net`) |
| **MongoDB Atlas (on AWS)** | Product catalog & order database (hosted on AWS ap-south-1) |
| **EC2** *(deployment)* | Hosts the Node.js backend |

---

##  Key Features

- **AI Smart Search** — Natural language search powered by Groq (Llama 3.1). Ask "low-fat breakfast options" and get relevant products instantly.
- **AI Meal Planner / Cart Builder** — Type "I want to make Biryani" and the AI auto-populates your cart with rice, spices, curd, and everything else.
- **AI Grocery Recommendations** — Personalized replenishment, occasion, and discovery suggestions based on your order history.
- **AI Reorder** — Ranks previously ordered items by urgency so you restock smarter.
- **Voice Search** — Tap the microphone to speak your grocery needs.
- **CloudFront CDN Images** — All 387 product images are served from AWS CloudFront for blazing-fast loads.
- **Real-time Order Tracking** — Live delivery tracking via Socket.io with an interactive map.
- **PWA Ready** — Installable on mobile devices with offline support via Workbox.
- **Smart Cart** — Swipe-based UX to quickly build situational carts (party, weeknight dinner, etc.).
- **Global Cart State** — Cart persists across all pages via Zustand.

---
##  Project Structure
The project follows a modern, scalable architecture, cleanly separating the client and server concerns. The backend implements a robust layered architecture (Controllers → Services → Repositories → Models) to ensure maintainability, while the frontend uses a feature-based structure for maximum reusability.
```
├── backend/
│   ├── src/
│   │   ├── index.ts          # Express + Socket.io server
│   │   ├── models/           # Mongoose schemas (Product, Order)
│   │   ├── routes/           # REST API routes (products, orders, ai)
│   │   └── services/
│   │       ├── claude.ts     # AI engine (Groq — active)
│   │       └── claude.bedrock.ts  # AWS Bedrock version (ready to swap)
│   ├── scripts/
│   │   ├── seed.ts           # Database seeder
│   │   └── upload-images-to-s3.ts  # S3 image uploader
│   ├── Dockerfile            # Production Docker image
│   └── .env.example          # Environment variable template
│
└── frontend/
    ├── src/
    │   ├── components/       # ProductImage (CDN-aware), Header, Cart, etc.
    │   ├── pages/            # Home, ProductDetail, Cart, Checkout, etc.
    │   ├── store/            # Zustand cart store
    │   └── api/              # Axios API client
    ├── public/               # Static assets (logo, favicon)
    └── .env.production.example  # Production env template
```
##  Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS v4, Framer Motion |
| Backend | Node.js, Express, TypeScript, Socket.io |
| Database | MongoDB Atlas (Mongoose) |
| AI Engine | Groq API (Llama 3.1-8b-instant) |
| Image CDN | AWS S3 + CloudFront |
| State Management | Zustand |
| PWA | vite-plugin-pwa + Workbox |

---

##  Prerequisites

- Node.js 20+
- MongoDB Atlas URI (or local MongoDB)
- Groq API Key — get one free at [console.groq.com](https://console.groq.com)
- AWS credentials (for S3/CloudFront image uploads — optional for local dev)

---

##  1. Environment Setup

### Backend
```bash
cd backend
cp .env.example .env
```
Fill in your `.env`:
```env
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/amazon-now
PORT=3001
GROQ_API_KEY=gsk_...
GROQ_MODEL=llama-3.1-8b-instant

# AWS (for image CDN)
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=ap-south-1
S3_MEDIA_BUCKET=your-bucket-name
CLOUDFRONT_URL=https://xxxx.cloudfront.net

FRONTEND_URL=http://localhost:3000
```

### Frontend
```bash
cd frontend
```
Create a `.env` file:
```env
# CloudFront CDN for product images
VITE_CDN_URL=https://xxxx.cloudfront.net

# Leave empty for local dev (uses Vite proxy to localhost:3001)
# VITE_API_URL=http://YOUR_EC2_IP:3001/api
```

---

##  2. Install Dependencies

```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

---

##  3. Seed the Database

Populate MongoDB with 380+ products:
```bash
cd backend
npm run seed
```

---

##  4. Start Development Servers

Run backend and frontend in **two separate terminals**:

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

Open [http://localhost:3000](http://localhost:3000) in your browser.

>  This is a **mobile-first** app. Open Chrome DevTools → Toggle Device Toolbar → Select **iPhone 12/13/14 Pro** for the best experience.

---

##  5. Product Images (AWS S3 + CloudFront)

Product images are stored in S3 and served via CloudFront CDN. They are **not committed to this repository** to keep the repo lean.

To upload images to S3:
```bash
cd backend
S3_BUCKET=your-bucket-name CLOUDFRONT_URL=https://xxxx.cloudfront.net npm run upload:images
```

---



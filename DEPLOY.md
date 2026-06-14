# Deployment Guide — AWS (Amazon HackOn)

## Architecture
```
Frontend  →  AWS Amplify        (React build, CDN, HTTPS)
Backend   →  AWS App Runner     (Docker container, auto-scale)
Database  →  MongoDB Atlas      (free M0 cluster, or Amazon DocumentDB)
```

---

## Prerequisites
- AWS account with access to Amplify + App Runner + ECR
- AWS CLI installed: `brew install awscli` → `aws configure`
- Docker installed
- MongoDB Atlas cluster (or DocumentDB) with connection string ready

---

## Part 1 — Deploy Backend to AWS App Runner

### 1.1 Push Docker image to Amazon ECR

```bash
# Create ECR repository
aws ecr create-repository --repository-name amazon-now-backend --region ap-south-1

# Get the login command (replace 123456789 with your AWS account ID)
aws ecr get-login-password --region ap-south-1 | \
  docker login --username AWS --password-stdin 123456789.dkr.ecr.ap-south-1.amazonaws.com

# Build and push
cd backend
docker build -t amazon-now-backend .
docker tag amazon-now-backend:latest 123456789.dkr.ecr.ap-south-1.amazonaws.com/amazon-now-backend:latest
docker push 123456789.dkr.ecr.ap-south-1.amazonaws.com/amazon-now-backend:latest
```

### 1.2 Create App Runner service

1. Go to **AWS Console → App Runner → Create service**
2. Source: **Container registry → Amazon ECR**
3. Select your `amazon-now-backend` image
4. Configure:
   - CPU: 1 vCPU, Memory: 2 GB
   - Port: **3001**
   - Health check path: `/health`
5. **Environment variables** (add all of these):

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `3001` |
| `MONGO_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/amazon-now` |
| `GROQ_API_KEY` | `gsk_...your key...` |
| `GROQ_MODEL` | `llama-3.1-8b-instant` |
| `FRONTEND_URL` | *(leave blank for now, fill after Amplify deploy)* |

6. Click **Create & deploy** — App Runner builds and gives you a URL like:
   `https://abc123.ap-south-1.awsapprunner.com`

7. Test it:
```bash
curl https://abc123.ap-south-1.awsapprunner.com/health
# → {"status":"ok","time":"..."}
```

---

## Part 2 — Seed the Database

Run this once against your production MongoDB:

```bash
cd backend
MONGO_URI="mongodb+srv://user:pass@cluster.mongodb.net/amazon-now" npm run seed
```

---

## Part 3 — Deploy Frontend to AWS Amplify

### 3.1 Set the backend URL

Create `frontend/.env.production`:
```
VITE_API_URL=https://abc123.ap-south-1.awsapprunner.com/api
```

### 3.2 Connect via Amplify Console

1. Go to **AWS Console → Amplify → New app → Host web app**
2. Connect your **GitHub repository** (push code to GitHub first if not done)
3. Branch: `main`
4. Build settings — Amplify auto-detects Vite. Verify:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - cd frontend && npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: frontend/dist
    files:
      - '**/*'
  cache:
    paths:
      - frontend/node_modules/**/*
```

5. **Environment variables** in Amplify console:
   - `VITE_API_URL` = `https://abc123.ap-south-1.awsapprunner.com/api`

6. Click **Save and deploy** — Amplify builds and gives you:
   `https://main.abcdef.amplifyapp.com`

### 3.3 Add CORS to backend

Update `backend/src/index.ts` — replace the open CORS with your Amplify URL:

```ts
app.use(cors({
  origin: [
    'https://main.abcdef.amplifyapp.com',
    'http://localhost:3000',
  ],
  credentials: true,
}));
```

Then rebuild and push the Docker image again (repeat Part 1.1).

### 3.4 Update App Runner env

In App Runner → your service → Configuration → Environment variables:
- `FRONTEND_URL` = `https://main.abcdef.amplifyapp.com`

---

## Part 4 — Custom Domain (Optional)

In Amplify → Domain management → Add domain → connect your domain.
App Runner also supports custom domains under Networking → Custom domains.

---

## Quick Reference: URLs after deploy

| Service | URL |
|---------|-----|
| Frontend | `https://main.abcdef.amplifyapp.com` |
| Backend API | `https://abc123.ap-south-1.awsapprunner.com/api` |
| Health check | `https://abc123.ap-south-1.awsapprunner.com/health` |

---

## Cost Estimate (Free / Very Low)

| Service | Cost |
|---------|------|
| AWS Amplify | Free tier — 1000 build mins/month, 5 GB storage, 15 GB transfer |
| AWS App Runner | ~$0.064/vCPU-hr + $0.007/GB-hr. Pauses when idle → ~$1-3/day for a hackathon demo |
| MongoDB Atlas M0 | Free forever (512 MB) |
| Amazon ECR | Free tier — 500 MB/month |

For a hackathon demo running a few days, total cost is under **$5**.

---

## Fastest Path for Demo Day

If you need it live in 30 minutes:
1. Push code to GitHub
2. Deploy backend via App Runner (10 min)
3. Deploy frontend via Amplify (5 min)
4. Seed DB (2 min)
5. Done ✅

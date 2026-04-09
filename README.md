# 🎮 BATTLEZONE — BGMI Tournament Platform

A complete full-stack BGMI tournament management platform with:
- **Frontend** — Mobile-first player-facing website
- **Admin Panel** — Full control dashboard for tournament management  
- **Backend** — Node.js + Express REST API

---

## 📁 Project Structure

```
bgmi-platform/
├── frontend/
│   └── index.html          ← Player-facing website (API-connected)
├── admin/
│   └── admin.html          ← Admin control panel
└── backend/
    ├── server.js            ← Express server entry point
    ├── package.json
    ├── data/
    │   └── store.js         ← In-memory database (replace with MongoDB)
    ├── middleware/
    │   └── auth.js          ← JWT authentication middleware
    └── routes/
        ├── auth.js          ← Login / token verification
        ├── tournaments.js   ← Tournament CRUD
        ├── registrations.js ← Team registration
        ├── chat.js          ← Chat messages
        └── results.js       ← Match results & leaderboards
```

---

## 🚀 Quick Start

### 1. Install dependencies
```bash
cd backend
npm install
```

### 2. Start the server
```bash
# Development (auto-restart on file changes)
npm run dev

# OR Production
npm start
```

### 3. Open the app
| Page | URL |
|------|-----|
| Player Frontend | http://localhost:3000/frontend/index.html |
| Admin Panel | http://localhost:3000/admin/admin.html |
| API Health | http://localhost:3000/api/health |

---

## 🔐 Admin Login

| Field | Value |
|-------|-------|
| Username | `admin` |
| Password | `battlezone@123` |

> ⚠️ Change the password in `backend/data/store.js` before going live!

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Admin login → returns JWT |
| POST | `/api/auth/verify` | Verify JWT token |

### Tournaments
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/tournaments` | Public | List all tournaments |
| GET | `/api/tournaments/:id` | Public | Get single tournament |
| POST | `/api/tournaments` | Admin | Create tournament |
| PUT | `/api/tournaments/:id` | Admin | Update tournament |
| DELETE | `/api/tournaments/:id` | Admin | Delete tournament |

### Registrations
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/registrations` | Admin | All registrations |
| GET | `/api/registrations/tournament/:id` | Public | By tournament |
| POST | `/api/registrations` | Public | Register team |
| DELETE | `/api/registrations/:id` | Admin | Remove registration |

### Chat
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/chat` | Public | Get messages |
| POST | `/api/chat` | Public | Send message |
| DELETE | `/api/chat/:id` | Admin | Delete message |

### Results
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/results` | Public | All results |
| GET | `/api/results/:id` | Public | Single result |
| POST | `/api/results` | Admin | Publish result |
| PUT | `/api/results/:id` | Admin | Update result |
| DELETE | `/api/results/:id` | Admin | Delete result |

---

## 💾 Upgrade to MongoDB (Optional)

Install mongoose:
```bash
npm install mongoose
```

Replace `data/store.js` with Mongoose models. Each route uses the same array operations which map directly to `Model.find()`, `Model.create()`, etc.

---

## 🔧 Configuration

Edit `backend/data/store.js`:
- `ADMIN_CREDENTIALS` — Change username/password
- `JWT_SECRET` — Use a strong random secret in production

---

## 🌐 Deployment

For production:
1. Set `PORT` environment variable
2. Use a proper JWT secret via environment variable
3. Replace in-memory store with MongoDB Atlas
4. Serve frontend via Nginx or a CDN
5. Run backend with PM2: `pm2 start server.js`

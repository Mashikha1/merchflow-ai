# MerchFlow AI - Full-Stack Application Guide

Welcome to the **MerchFlow AI** project documentation. This application is a comprehensive B2B wholesale and merchandising platform integrating AI virtual try-on, quotes management, showrooms, order fulfillment, and robust inventory tracking.

---

## 🛠 Tech Stack & Languages

### **Languages**
- **JavaScript (ES6+)**: Used across the entire stack (Node.js backend + React frontend).
- **JSX**: Used for rendering UI components.
- **HTML / CSS**: Semantic web markup and standard styling.

### **Frontend**
- **Framework**: React (built with Vite)
- **Styling**: Tailwind CSS 
- **Routing**: React Router DOM (`react-router-dom`)
- **State Management & Data Fetching**: 
  - Zustand (for global UI/Auth state)
  - TanStack React Query (`@tanstack/react-query`) (for API fetching, caching, and server state)
- **Icons**: Lucide React (`lucide-react`)
- **Components**: Custom, accessible UI components (Cards, Badges, Modals, DataTables).

### **Backend**
- **Framework**: Node.js with Express.js
- **Routing**: Express Router
- **Security & Auth**: JSON Web Tokens (JWT), bcrypt (for password hashing), CORS.
- **File Uploads**: `multer` for media processing.
- **External Integration**: Hugging Face Gradio API client (`@gradio/client`) for AI Virtual Try-on generation.

### **Database**
- **Database Engine**: PostgreSQL
- **ORM (Object-Relational Mapper)**: Prisma (`prisma`)

---

## 🚀 Setup & Installation Process

### Prerequisites
Make sure you have the following installed on your system:
- **Node.js** (v18 or higher recommended)
- **PostgreSQL** running locally on your machine on port 5432.

### 1. Database Setup
1. Open PostgreSQL and ensure you have a database named `merchflow` created. 
2. In the `backend` directory, create a `.env` file and set the `DATABASE_URL`:
   ```env
   DATABASE_URL="postgresql://YOUR_SYSTEM_USER@localhost:5432/merchflow?schema=public"
   JWT_SECRET="merchflow_super_secret_jwt_key_2026"
   PORT="4000"
   ```

### 2. Backend Setup
Execute the following commands in your terminal:
```bash
cd backend
npm install

# Push the Prisma schema to PostgreSQL to create all necessary tables
npx prisma db push

# (Optional, but recommended) Seed the database with initial users, products, and mock activity
node src/seed.js

# Start the development server
npm run dev
```
> The backend server will start on `http://localhost:4000`.

### 3. Frontend Setup
Open a new terminal window and execute:
```bash
cd merchflow-ai
npm install

# Start the Vite development server
npm run dev
```
> The frontend application will be accessible at `http://localhost:5173`.

---

## 🔌 System Architecture & Wiring

### Database ↔ Backend (Prisma)
- The entire database shape is defined in `backend/prisma/schema.prisma`. 
- **Prisma Client** is exported from `backend/src/prisma.js`.
- Whenever a backend route (e.g., `backend/src/routes/products.js`) needs to interact with the database, it imports the configured Prisma Client to run queries like `prisma.product.findMany()`.

### Backend ↔ Frontend (React Query + API Client)
- **API Client Layer**: Look at `merchflow-ai/src/lib/api.js`. This file configures the base URL (`http://localhost:4000/api`) and handles attaching the JWT `Bearer` token to the `Authorization` header of every outgoing request based on the local storage state.
- **Data Hooking**: The React pages use `useQuery` or `useMutation` from `@tanstack/react-query` to hit the API endpoints smoothly. 
- **Example Request Flow**: 
  1. Frontend Component: `InventoryPage.jsx` calls `api.get('/inventory')`.
  2. API layer attaches token and triggers an HTTP GET to `http://localhost:4000/api/inventory`.
  3. Backend Express Router `routes/inventory.js` intercepts it, authorizes it via `auth.js` middleware, fetches from Prisma `prisma.inventoryItem.findMany()`, and responds with JSON.

---

## 📂 File Structure & Feature Map

Below is exactly where you will find the code for specific platform features.

### Frontend (`merchflow-ai/`)
The primary UI layer, divided into semantic pages representing specific business workflows.

| Feature | Directory/File | API Endpoint Consumed |
|---|---|---|
| **Authentication Flow** | `src/pages/auth/LoginPage.jsx` & `SignupPage.jsx`<br/>`src/stores/authStore.js` | `POST /api/auth/login`<br/>`POST /api/auth/signup` |
| **Dashboard Metrics** | `src/pages/DashboardPage.jsx` | `GET /api/dashboard/summary`<br/>`GET /api/dashboard/activity`<br/>`GET /api/dashboard/traffic` |
| **Product Catalog** | `src/pages/ProductsPage.jsx`<br/>`src/pages/ProductFormPage.jsx` | `/api/products` |
| **AI Try-On / Jobs** | `src/pages/AIStudioPage.jsx`<br/>`src/components/AITryOnPanel.jsx` | `/api/ai/jobs`<br/>`POST /api/ai/try-on` |
| **Inventory Tracking** | `src/pages/InventoryPage.jsx` | `/api/inventory` |
| **Collections/Catalogs** | `src/pages/CollectionsPage.jsx`<br/>`src/pages/CatalogsPage.jsx` | `/api/collections`<br/>`/api/catalogs` |
| **B2B Buyers & CRM** | `src/pages/CustomersPage.jsx`<br/>`src/pages/CustomerDetailPage.jsx` | `/api/customers` |
| **B2B Quotes** | `src/pages/QuotesPage.jsx` | `/api/quotes` |
| **Order Management** | `src/pages/OrdersPage.jsx` | `GET /api/orders` |
| **Media/Asset Library** | `src/pages/MediaLibraryPage.jsx` | `/api/media`<br/>`POST /api/media/upload` |
| **Showrooms** | `src/pages/ShowroomsPage.jsx` | `/api/showrooms` |
| **Recent Activity Log** | `src/pages/ActivityPage.jsx` | `GET /api/activity` |
| **Data Importer** | `src/pages/ImportsPage.jsx` | `/api/imports` |

> **Components (`src/components/`)**: Shared reusable UI concepts like `PageHeader.jsx`, `DataTable.jsx`, `Sidebar.jsx`, and atomic generic elements under `src/components/ui/` (`Card`, `Badge`, `Button`, `Input`).
> **Routing (`src/routes/AppRoutes.jsx`)**: Declares how URL paths map to page components.

### Backend (`backend/`)
The RESTful Express service providing data persistence and business logic.

| Module/Layer | File Path | Responsibility |
|---|---|---|
| **Entry Point** | `src/index.js` | Connects middlewares, registers all route paths, spins up the server on port 4000. |
| **Prisma Schema** | `prisma/schema.prisma` | Defines PostgreSQL DB structure (Models: User, Product, Quote, Collection, Media, AIJob, etc.). |
| **Auth Middleware** | `src/middleware/auth.js` | Validates JWT token from incoming requests and injects the context `req.user`. |
| **Auth Routes** | `src/routes/auth.js` | Sign up, password hashing, and token generation. |
| **Product Routes** | `src/routes/products.js` | CRUD, bulk-deletes, multi-editing products. |
| **CRM Routes** | `src/routes/customers.js` | CRUD customers, taking notes, creating reminders. |
| **Quote Routes** | `src/routes/quotes.js` | Advanced business logic: creating quotes, calculating totals, approving, expiring, converting to Orders. |
| **AI Workflows** | `src/routes/ai.js` | Connects to Hugging Face Gradio to generate garment Try-Ons, handles async job state polling (pending, completed, failed). |
| **Media Handling** | `src/routes/media.js` | Takes multipart form uploads and saves them to local disk `/uploads/` and logs to DB. |
| **Dashboard** | `src/routes/dashboard.js` | Aggregation logic extracting macro statistics from across all DB tables for visual rendering. |
| **Seed Utility** | `src/seed.js` | Essential for demo environments; creates standard Mock users (e.g. `admin@merchflow.ai`) and dummy records. |

---

## 🔑 Key Takeaways
1. The **Frontend** never accesses DB directly. It fully talks to the **Backend** over HTTP standard REST endpoints using Bearer Tokens.
2. The UI is completely "live", meaning every data-grid (Inventory, CRM, Products) relies dynamically on PostgreSQL responses.
3. Hugging Face AI requests are offloaded dynamically by the Backend `/api/ai/try-on` route processing queue.

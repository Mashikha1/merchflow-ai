# MerchFlow AI - Viva Preparation & Complete Project Guide

This document is specifically tailored for your Viva preparation. It contains readymade answers based on your required templates, explicitly adapted for the **MerchFlow AI** project. It also contains an exhaustive breakdown of where every piece of code is located.

---

## 🎤 1. OJT Viva Introduction

**Template Answer:**
"Hi, my name is [Your Name]. I am currently pursuing my [Degree] in [Branch] from [College Name], and I am in my [Year]. I have a strong interest in full-stack development and AI integration, which led me to build this project."

---

## 🚀 2. OJT Opening Statement (MerchFlow AI Context)

**Template Answer:**
“This project, **MerchFlow AI**, is a comprehensive B2B wholesale platform where users can manage product catalogs, generate business quotes, and perform AI-driven virtual try-ons.
The architecture follows a layered full-stack approach: the React client sends requests to a Node.js/Express backend API, which interacts with a PostgreSQL database via the Prisma ORM.
I used a SQL database because our data—like quotes, products, and user roles—has a highly structured schema, relies heavily on relationships, and requires strong consistency (ACID guarantees).
The API flow is straightforward—requests go through Express routers (handling routing & auth), then to our controllers for business logic, and finally use Prisma to interact with the database. We also handle third-party asynchronous operations by integrating with Hugging Face for AI image generation.
For handling concurrent requests, we rely on relational database constraints, and for scaling, this system can be extended using read replicas and dedicated background worker queues (like Redis/BullMQ) to handle heavy AI tasks without blocking the main server.”

---

## ⚖️ 3. SQL vs NoSQL (Ready-made Answer)

**Template Answer:**
"The real tradeoff is not SQL vs NoSQL, but consistency vs availability under partition (CAP theorem).
SQL databases traditionally prioritize strong consistency using ACID guarantees, often sacrificing availability during failures. 
NoSQL databases typically relax consistency (eventual consistency) to achieve higher scalability and availability.
However, modern databases blur this line by offering tunable consistency.

**TL;DR**
- **SQL (What we used in MerchFlow AI):** Relational data, Vertical Scaling, Strong Consistency (Crucial for B2B Quotes and Inventory).
- **NoSQL:** Non-Relational data, Horizontal Scaling, Flexible Schema."

---

## 🧱 4. What data structures are you using in your project?

**Template Answer:**
"In MerchFlow AI, I used a combination of data structures depending on the use case:
• **Arrays/Lists:** Used extensively for storing ordered data like product lists, fetching AI job history, and rendering UI grids.
• **HashMaps (JavaScript Objects):** Used for fast key-value lookups, managing React component states, building API request payloads, and formatting JSON responses.
• **Sets:** Used to maintain uniqueness, such as filtering out duplicate tags on products or maintaining a unique list of selected inventory items.
• **Queues (Conceptually):** Used for handling asynchronous tasks, specifically managing our AI Virtual Try-On jobs where requests are queued and polled for completion.
• **Trees/Graphs:** Implicitly used in our Category hierarchy (Categories can have Parent/Child relationships) and inherently used by React (Virtual DOM tree) for rendering the UI."

---

## 🏛 5. What are Models?

**Template Answer:**
"Models are essentially blueprints that define the structure, schema, and relationships of the data stored in our database. They represent real-world entities in our code.
In MerchFlow AI, our models are defined using **Prisma ORM** in a file called `schema.prisma`. 
For example, we have a `Product` model that defines fields like `sku`, `name`, `price`, and `stock`. We also have relationships defined in these models, such as a `Quote` model having a one-to-many relationship with `QuoteItem` models, and a `User` model linked to multiple `AIJob` models. By using models, the ORM handles the complex SQL queries, allowing us to interact with the database using standard JavaScript objects."

---

## 🗺 6. Code & API Architecture Map (Where is everything?)

If the examiner asks *where* a specific feature is written, here is the exact breakdown of the files and APIs.

### The Flow of an API Call
1. **Frontend:** A React component calls a function using `axios` or `fetch` (via TanStack React Query).
2. **Backend Entry:** The request hits `backend/src/index.js`, which routes it.
3. **Middleware:** `backend/src/middleware/auth.js` checks if the user is logged in (Validates JWT).
4. **Router/Controller:** The specific file (e.g., `routes/products.js`) handles the logic.
5. **Database:** `backend/src/prisma.js` (Prisma ORM) executes the query on PostgreSQL.

### Key API Designs (Write these on your A4 sheet)

#### 1. Authentication (`backend/src/routes/auth.js`)
- **POST /api/auth/signup** → Registers a new user, hashes password with `bcrypt`, saves to DB.
- **POST /api/auth/login** → Verifies credentials, generates and returns a JWT (JSON Web Token).
- **Frontend File:** `frontend/src/pages/auth/LoginPage.jsx`

#### 2. Products (`backend/src/routes/products.js`)
- **GET /api/products** → Fetches a list of all products from the database.
- **POST /api/products** → Creates a new product in the catalog.
- **GET /api/products/{id}** → Retrieves details of a specific product.
- **DELETE /api/products/{id}** → Deletes a product.
- **Frontend File:** `frontend/src/pages/ProductsPage.jsx`

#### 3. AI Virtual Try-On (`backend/src/routes/ai.js`)
- **POST /api/ai/try-on** → Creates a new AI Job. It takes an image of a garment and an image of a person, saves the job to the database with a "QUEUED" status, and pings the Hugging Face Gradio API.
- **GET /api/ai/jobs** → Fetches the user's past AI generation jobs.
- **Frontend File:** `frontend/src/pages/ai/AIBackgroundsPage.jsx` and `AIStudioPage.jsx`

#### 4. Quotes & B2B Orders (`backend/src/routes/quotes.js`)
- **POST /api/quotes** → Creates a business quote for a B2B customer, linking multiple `QuoteItem` records to one `Quote`.
- **GET /api/quotes** → Fetches all active quotes.
- **PUT /api/quotes/{id}/status** → Updates a quote to "APPROVED" or "REJECTED".
- **Frontend File:** `frontend/src/pages/QuotesPage.jsx`

#### 5. Database Schema (`backend/prisma/schema.prisma`)
- **Purpose:** This single file contains every single Database table definition. If you need to see what fields a "Customer" or "InventoryItem" has, you look here.

---

## 🎯 Final Tips for the Viva
1. **Confidence:** If asked about something complex, tie it back to the **CRUD** (Create, Read, Update, Delete) concept. Every feature is essentially CRUD.
2. **State Management:** If asked how the frontend updates without reloading, say: *"We use React Query for caching server data and Zustand for global UI state."*
3. **Security:** If asked how the app is secure, say: *"We use JWT (JSON Web Tokens) for authenticating API requests. Passwords are mathematically hashed using bcrypt before being saved to the database, so even administrators cannot see plain-text passwords."*

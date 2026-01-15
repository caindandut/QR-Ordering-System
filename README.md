# 🍽️ QR Ordering System

A comprehensive QR code-based ordering management system for restaurants. Customers can scan QR codes on tables to place orders and track them in real-time.

## 🚀 Live Demo

Try the system online! Visit the admin dashboard:

**🔗 Demo URL:** [https://qr-ordering-admin.vercel.app/](https://qr-ordering-admin.vercel.app/)

**Demo Credentials:**
- **Email:** `admin@gmail.com`
- **Password:** `admin`

> ⚠️ **Note:** This is a demo environment. Please use responsibly and do not modify critical data.

## 📋 Table of Contents

- [🚀 Live Demo](#-live-demo)
- [🎯 Overview](#-overview)
  - [Key Benefits](#key-benefits)
- [✨ Key Features](#-key-features)
  - [Customer App Features](#-customer-app-features)
  - [Admin & Staff Features](#-admin--staff-features)
- [🛠️ Technologies Used](#️-technologies-used)
  - [Backend](#backend)
  - [Frontend (Admin & Customer)](#frontend-admin--customer)
- [🏗️ System Architecture](#️-system-architecture)
- [📦 System Requirements](#-system-requirements)
- [🚀 Installation](#-installation)
  - [Clone Repository](#1-clone-repository)
  - [Install Dependencies](#2-install-dependencies)
- [⚙️ Environment Configuration](#️-environment-configuration)
  - [Backend Environment Variables](#backend-environment-variables)
  - [Frontend Environment Variables](#frontend-environment-variables)
  - [Database Setup](#database-setup)
- [🎬 Running the Application](#-running-the-application)
  - [Development Environment](#development-environment)
  - [Initial Setup](#initial-setup)
- [📁 Project Structure](#-project-structure)
- [🗄️ Database Schema](#️-database-schema)
  - [Main Tables](#main-tables)
  - [Relationship Diagram](#relationship-diagram)
- [🚢 Deployment](#-deployment)
  - [Backend Deployment](#backend-deployment-recommended-rendercom)
  - [Frontend Deployment](#frontend-deployment-recommended-vercel)
  - [Production Environment Variables](#production-environment-variables)
- [🔧 Troubleshooting](#-troubleshooting)
  - [Common Issues and Solutions](#common-issues-and-solutions)
  - [Checking Logs](#checking-logs)
- [📝 Development Guide](#-development-guide)
  - [Code Conventions](#code-conventions)
  - [Git Workflow](#git-workflow)
- [🤝 Contributing](#-contributing)

## 🎯 Overview

This QR ordering system is a complete solution for digital transformation in restaurants. Customers simply scan the QR code on their table to easily view the menu and place orders from their smartphones. Staff and managers can efficiently manage orders, menus, tables, and staff from a dedicated admin interface.

### Key Benefits

- ✅ **Contactless Ordering** - Customers place orders directly from their phones
- ✅ **Real-time Updates** - Instant order status notifications via Socket.IO
- ✅ **Multi-language** - Supports Vietnamese and Japanese
- ✅ **Payment Integration** - Supports VNPay payment gateway
- ✅ **Comprehensive Management** - Full management of menu, tables, staff, and orders
- ✅ **Analytics Dashboard** - Visualize revenue, popular items, and order statistics

## ✨ Key Features

### 👥 Customer App Features

- **QR Code Scanning**: Scan QR code on table to start ordering
- **Menu Viewing**: Beautiful menu display by category
- **Cart Management**: Add, remove, change quantity of items
- **Order Tracking**: Check order status in real-time
- **Online Payment**: Secure payment via VNPay integration
- **Multi-language**: Switch between Vietnamese and Japanese
- **Dark Mode**: Eye-friendly dark interface support

### 🔧 Admin & Staff Features

- **Dashboard**: 
  - Revenue statistics and real-time charts
  - Active orders list
  - Top 10 popular items
  - Table status map
  
- **Order Management**:
  - Process orders: accept, prepare, serve, complete
  - View and print order details
  - Real-time notifications and sound alerts
  
- **Menu Management**:
  - Add, edit, delete menu items
  - Upload images (Cloudinary integration)
  - Multi-language (Japanese and Vietnamese)
  - Inventory status management
  
- **Table Management**:
  - Create and edit tables
  - Generate and print QR codes
  - Visualize table status
  
- **Staff Management**:
  - Create staff accounts
  - Manage roles and access permissions
  - Edit profiles

- **Authentication and Security**:
  - JWT authentication
  - Role-based access control (ADMIN/STAFF)
  - Secure password hashing

## 🛠️ Technologies Used

### Backend

- **Node.js** (v18+) - Server-side runtime
- **Express.js** (v5.1.0) - Web application framework
- **Prisma** (v6.18.0) - Next-generation ORM and database management
- **MySQL** - Relational database
- **Socket.IO** (v4.8.1) - Real-time bidirectional communication
- **JWT** - Authentication and token management
- **bcryptjs** - Password hashing
- **Cloudinary** - Image storage and optimization
- **VNPay SDK** - Payment gateway integration
- **Multer** - File upload handling

### Frontend (Admin & Customer)

- **React** (v19) - UI library
- **Vite** (v7.1.7) - Fast development server and build tool
- **React Router DOM** (v7.9.5) - Routing
- **TailwindCSS** (v3.4.18) - Utility-first CSS framework
- **Radix UI** - Accessible UI components
- **Zustand** (v5.0.8) - Lightweight state management
- **TanStack Query** (v5.90.7) - Data fetching and caching
- **Socket.IO Client** - Real-time communication
- **i18next** - Internationalization (i18n)
- **Recharts** - Data visualization (admin interface)
- **Axios** - HTTP client
- **Lucide React** - Icon library

## 🏗️ System Architecture

```
┌─────────────────┐
│  Customer App   │ (React + Vite)
│   QR Scan       │
│   View Menu     │
│   Order & Pay   │
└────────┬────────┘
         │
         │ HTTPS/WSS
         │
┌────────▼────────┐
│   Admin App     │ (React + Vite)
│   Dashboard     │
│   Order Mgmt    │
│   Menu Mgmt     │
└────────┬────────┘
         │
         │ HTTPS/WSS
         │
┌────────▼────────┐
│   Backend       │ (Node.js + Express)
│   RESTful API   │
│   Socket.IO     │
│   JWT Auth      │
└────────┬────────┘
         │
    ┌────┴────┬─────────┬──────────┐
    │         │         │          │
┌───▼───┐ ┌──▼───┐ ┌───▼────┐ ┌──▼──────┐
│ MySQL │ │VNPay │ │Cloudinary│ │Socket.IO│
│  DB   │ │PG    │ │  Images │ │Real-time│
│       │ │      │ │         │ │         │
└───────┘ └──────┘ └─────────┘ └─────────┘
```

## 📦 System Requirements

To run the system, you need the following software:

- **Node.js**: v18.0.0 or higher
- **npm**: v8.0.0 or higher
- **MySQL**: v8.0 or higher (or PlanetScale, cloud MySQL-compatible database)
- **Git**: For version control

## 🚀 Installation

### 1. Clone Repository

```bash
git clone <repository-url>
cd "QR Ordering System"
```

### 2. Install Dependencies

#### Backend
```bash
cd backend
npm install
```

#### Admin App
```bash
cd ../admin
npm install
```

#### Customer App
```bash
cd ../customer
npm install
```

## ⚙️ Environment Configuration

### Backend Environment Variables

Create a `backend/.env` file and configure the following:

```env
# Database connection
DATABASE_URL="mysql://username:password@host:3306/database_name"

# JWT authentication
JWT_SECRET="set_a_strong_random_secret_key"
ACCESS_TOKEN_SECRET="set_a_strong_random_secret_key"
REFRESH_TOKEN_SECRET="set_a_strong_random_secret_key"

# Server configuration
PORT=8080
NODE_ENV=development

# Cloudinary configuration (image upload)
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# VNPay payment gateway configuration
VNPAY_TMN_CODE="your_TMN_code"
VNPAY_HASH_SECRET="your_hash_secret"
VNPAY_URL="https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
VNPAY_RETURN_URL="http://localhost:5173/payment-return"

# Frontend URLs (for CORS)
ADMIN_URL="http://localhost:5174"
CUSTOMER_URL="http://localhost:5173"
CUSTOMER_APP_URL="http://localhost:5173"
```

### Frontend Environment Variables

#### Admin App (`admin/.env`)
```env
VITE_API_URL=http://localhost:8080
VITE_SOCKET_URL=http://localhost:8080
```

#### Customer App (`customer/.env`)
```env
VITE_API_URL=http://localhost:8080
VITE_SOCKET_URL=http://localhost:8080
```

### Database Setup

```bash
cd backend

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# (Optional) View database with Prisma Studio
npx prisma studio
```

## 🎬 Running the Application

### Development Environment

Open 3 terminal windows and run the following commands in each:

#### Terminal 1: Backend
```bash
cd backend
npm run dev
```
Server will run at `http://localhost:8080`

#### Terminal 2: Admin App
```bash
cd admin
npm run dev
```
Admin interface will run at `http://localhost:5173`

#### Terminal 3: Customer App
```bash
cd customer
npm run dev
```
Customer app will run at `http://localhost:5174`

### Initial Setup

1. **Create admin account**
   - Create admin user directly in database from backend console or Prisma Studio
   - Or add temporary registration endpoint to `authRoutes.js`

2. **Create tables and categories**
   - Login to admin interface
   - Create tables in table management page
   - Create menu categories in category management page

3. **Add menu items**
   - Register menu items in menu management page
   - Upload images
   - Enter descriptions in Japanese and Vietnamese

4. **Print QR codes**
   - Print QR codes for each table from table management page
   - Place on tables

## 📁 Project Structure

```
QR Ordering System/
│
├── backend/                      # Backend server
│   ├── config/                   # Configuration files
│   │   └── cloudinary.js        # Cloudinary configuration
│   ├── middleware/               # Middleware
│   │   ├── authMiddleware.js    # JWT authentication
│   │   └── uploadMiddleware.js  # File upload
│   ├── prisma/                   # Prisma ORM
│   │   ├── schema.prisma        # Database schema
│   │   └── migrations/          # Migration files
│   ├── routes/                   # API routes
│   │   ├── authRoutes.js        # Authentication API
│   │   ├── menuRoutes.js        # Menu API
│   │   ├── tableRoutes.js       # Table API
│   │   ├── categoryRoutes.js    # Category API
│   │   ├── orderRoutes.js       # Order API (customer)
│   │   ├── adminOrderRoutes.js  # Order API (admin)
│   │   ├── paymentRoutes.js     # Payment API
│   │   ├── staffRoutes.js       # Staff API
│   │   ├── dashboardRoutes.js   # Dashboard API
│   │   └── uploadRoutes.js      # Upload API
│   ├── services/                 # Business logic
│   │   └── vnpayService.js      # VNPay payment service
│   ├── index.js                  # Entry point
│   └── package.json             # Dependencies
│
├── admin/                        # Admin frontend
│   ├── public/                   # Static files
│   │   ├── locales/             # Translation files
│   │   │   ├── jp/              # Japanese
│   │   │   └── vi/              # Vietnamese
│   │   └── sounds/              # Notification sounds
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── ui/              # Reusable UI components
│   │   │   ├── dashboard/       # Dashboard-specific components
│   │   │   └── ...              # Other components
│   │   ├── context/             # React context
│   │   │   ├── NotificationContext.jsx  # Notification management
│   │   │   └── SocketContext.jsx        # Socket.IO connection
│   │   ├── hooks/               # Custom hooks
│   │   ├── layouts/             # Layout components
│   │   ├── pages/               # Page components
│   │   │   ├── Login.jsx        # Login page
│   │   │   ├── Dashboard.jsx    # Dashboard
│   │   │   ├── ManageMenu.jsx   # Menu management
│   │   │   ├── ManageTables.jsx # Table management
│   │   │   ├── ManageOrders.jsx # Order management
│   │   │   ├── ManageStaff.jsx  # Staff management
│   │   │   └── Account.jsx      # Account settings
│   │   ├── services/            # API services
│   │   │   ├── api.js           # Axios configuration and API calls
│   │   │   └── dashboardService.js  # Dashboard API
│   │   ├── store/               # State management (Zustand)
│   │   │   └── authStore.js     # Authentication state
│   │   ├── i18n.js              # i18n configuration
│   │   ├── App.jsx              # Main App component
│   │   └── main.jsx             # Entry point
│   └── package.json
│
└── customer/                     # Customer frontend
    ├── public/                   # Static files
    │   └── locales/             # Translation files
    ├── src/
    │   ├── components/          # React components
    │   │   ├── ui/              # Reusable UI components
    │   │   ├── CartButton.jsx   # Cart button
    │   │   ├── Header.jsx       # Header
    │   │   └── ...
    │   ├── layouts/             # Layout components
    │   │   ├── OrderGateway.jsx # Order gateway (QR scan)
    │   │   └── CustomerLayout.jsx  # Main layout
    │   ├── pages/               # Page components
    │   │   ├── WelcomePage.jsx  # Welcome page
    │   │   ├── Menu.jsx         # Menu list
    │   │   ├── Cart.jsx         # Cart page
    │   │   ├── OrderStatus.jsx  # Order status
    │   │   ├── PaymentSuccess.jsx  # Payment success
    │   │   └── PaymentFailed.jsx   # Payment failed
    │   ├── services/            # API services
    │   │   └── api.js           # Axios configuration and API calls
    │   ├── store/               # State management (Zustand)
    │   │   └── cartStore.js     # Cart state
    │   ├── i18n.js              # i18n configuration
    │   ├── App.jsx              # Main App component
    │   └── main.jsx             # Entry point
    └── package.json
```


## 🗄️ Database Schema

### Main Tables

#### Users
- Account information for managers and staff
- Role-based access control (ADMIN/STAFF)
- Passwords hashed with bcrypt

#### Tables
- Restaurant table information
- Each table has unique ID and QR code
- Status management (available/in use)

#### Categories
- Menu categories
- Multi-language (Japanese/Vietnamese)

#### MenuItems
- Menu item information (name, description, price, image)
- Multi-language
- Inventory status management

#### Orders
- Order information (customer name, total amount, status)
- Linked to tables
- Staff assignment

#### OrderDetails
- Individual item information in orders
- Stores price at time of order

#### Payments
- VNPay payment information
- Transaction tracking

### Relationship Diagram

```
User (1) ─────< (Many) Order
Table (1) ─────< (Many) Order
Order (1) ─────< (Many) OrderDetail
MenuItem (1) ──< (Many) OrderDetail
Category (1) ──< (Many) MenuItem
Order (1) ─────< (Many) Payment
```

## 🚢 Deployment

### Backend Deployment (Recommended Render.com)

1. **Create Render account**
   - Sign up at [Render.com](https://render.com)

2. **Create new Web Service**
   - Connect GitHub repository
   - Specify `backend` directory
   - Build Command: `npm install && npx prisma generate`
   - Start Command: `npm start`

3. **Configure environment variables**
   - Set environment variables in Render dashboard
   - Add all environment variables like `DATABASE_URL`, `JWT_SECRET`, etc.

4. **Set up database**
   - Use PlanetScale or Render Database
   - Run migrations: `npx prisma migrate deploy`

### Frontend Deployment (Recommended Vercel)

#### Admin App

```bash
cd admin
npm run build

# Deploy using Vercel CLI
npx vercel --prod
```

#### Customer App

```bash
cd customer
npm run build

# Deploy using Vercel CLI
npx vercel --prod
```

### Production Environment Variables

After deployment, update frontend environment variables with production URLs:

```env
VITE_API_URL=https://your-backend.onrender.com
VITE_SOCKET_URL=https://your-backend.onrender.com
```

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 1. Database Connection Error

```
Error: Can't reach database server
```

**Solution:**
- Check if `DATABASE_URL` is configured correctly
- Check if database server is running
- Check firewall settings

#### 2. Socket.IO Connection Error

```
WebSocket connection failed
```

**Solution:**
- Check if backend is running
- Check if CORS is configured correctly
- Check if frontend `VITE_SOCKET_URL` is correct

#### 3. Image Upload Error

```
Cloudinary upload failed
```

**Solution:**
- Check if Cloudinary credentials are correct
- Check if upload preset is configured
- Check file size limits

#### 4. VNPay Payment Error

```
Payment processing failed
```

**Solution:**
- Check if VNPay credentials are correct
- Check if return URL is configured correctly
- If in sandbox environment, use test credentials

#### 5. JWT Authentication Error

```
Unauthorized - Invalid token
```

**Solution:**
- Logout and login again
- Check if `JWT_SECRET` is configured correctly in backend
- Check if token hasn't expired

### Checking Logs

#### Backend Logs
```bash
cd backend
npm run dev
# Check error logs in console
```

#### Prisma Logs
```bash
# View database with Prisma Studio
npx prisma studio
```

#### Browser Console
- Press F12 to open developer tools
- Check errors in Console tab
- Check request/response in Network tab

## 📝 Development Guide

### Code Conventions

- **JavaScript/JSX**: Follow ESLint rules
- **Naming conventions**: 
  - Components: PascalCase
  - Functions/variables: camelCase
  - Constants: UPPER_SNAKE_CASE
- **Component structure**: Organize by directory by functionality
- **State management**: Zustand for global state, useState for local state

### Git Workflow

```bash
# Create new feature branch
git checkout -b feature/feature_name

# Commit changes
git add .
git commit -m "Descriptive commit message"

# Merge into main branch
git checkout main
git merge feature/feature_name
```

## 🤝 Contributing

We welcome all contributions to the project!

1. Fork this repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Create a Pull Request

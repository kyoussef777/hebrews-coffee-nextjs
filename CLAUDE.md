# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Start development server**: `npm run dev` (uses Turbopack for faster builds)
- **Build for production**: `npm run build` (automatically runs `prisma generate`)
- **Start production server**: `npm start`
- **Lint code**: `npm run lint`
- **Generate Prisma client**: `prisma generate` (runs automatically on build and after install)

## Project Architecture

### Core Technology Stack
- **Framework**: Next.js 15 with App Router
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js v5 with credentials provider
- **Styling**: Tailwind CSS 4
- **Charts**: Chart.js with react-chartjs-2
- **PDF Generation**: jsPDF for label printing

### Database Schema Key Models
- **Order**: Central entity with orderNumber, customer details, drink specifications, status tracking, and pricing
- **MenuConfig**: Configurable menu items by type (DRINK, MILK, SYRUP, FOAM, TEMPERATURE)
- **User**: Authentication with bcrypt-hashed passwords
- **InventoryCost**: Cost tracking for profit analytics by category
- **LabelSettings**: Customizable label configurations for printing
- **Settings**: Application-wide configuration (wait time thresholds, etc.)

### Authentication Flow
- NextAuth.js with dual fallback: database users → environment variables (APP_USERNAME/APP_PASSWORD)
- Middleware protects all routes except `/login` and `/api/auth`
- Session strategy: JWT with username storage

### Key Business Logic

#### Order Management
- Orders progress through statuses: PENDING → IN_PROGRESS → COMPLETED
- Auto-incrementing order numbers for customer identification
- Real-time order tracking with status updates
- Label printing integration with customizable templates

#### Menu System
- Dynamic menu items loaded from database
- Category-based organization (drinks, milk types, syrups, foam, temperature)
- Price configuration per item type

#### Analytics & Reporting
- Revenue and profit tracking with cost calculation
- Time-series analytics for order patterns
- Inventory cost management for profit margins
- CSV export functionality for external analysis

#### Label Printing System
- Customizable label layouts with element positioning
- PDF generation optimized for Brother QL-820 printer
- Template management with default configurations
- Preview functionality before printing

### Component Architecture
- **OrderForm**: Primary order creation interface with dynamic menu loading
- **ActiveOrders**: Real-time order status display with update capabilities
- **AnalyticsDashboard**: Comprehensive reporting with charts and metrics
- **InventoryManager**: Cost tracking for profit calculations
- **LabelEditor**: Visual label design tool
- **Navigation**: App-wide navigation with responsive design

### Database Initialization
- Auto-seeding on startup via `initializeDatabase()` in app layout
- Creates default admin user, menu items, and settings if tables are empty
- Fallback authentication to environment variables if database unavailable

### API Route Patterns
- RESTful APIs under `/api/` with consistent response format: `{ success, data?, error?, message? }`
- Protected routes require authentication middleware
- Comprehensive CRUD operations for all major entities
- Analytics endpoints with aggregated data queries

### Environment Configuration
Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Session encryption key
- `NEXTAUTH_URL`: Application base URL
- `APP_USERNAME`/`APP_PASSWORD`: Fallback admin credentials

### Production Considerations
- Standalone output for Docker deployment
- Security headers configured in next.config.ts
- Image optimization with WebP/AVIF formats
- Prisma connection pooling for database efficiency

## Deployment & DevOps

### Docker Configuration
- **Multi-stage Dockerfile**: Optimized production build with minimal footprint
- **Docker Compose**: Full-stack deployment with PostgreSQL, Nginx, and Redis
- **Development Override**: Separate docker-compose.dev.yml for development with hot reloading
- **Health Checks**: Container health monitoring for all services

### Deployment Scripts
- **deploy.sh**: Comprehensive deployment automation script
  - `./deploy.sh setup` - Initial configuration and SSL certificate generation
  - `./deploy.sh start [--with-nginx]` - Start services with optional Nginx/Redis
  - `./deploy.sh backup` - Database backup automation
  - `./deploy.sh update` - Zero-downtime application updates

### Environment Management
- **Development**: .env.local with SQLite database
- **Production**: .env.production with PostgreSQL and security settings
- **Templates**: .env.example with comprehensive configuration documentation

### Database Deployment
- **PostgreSQL**: Production database with automated migrations
- **Health Checks**: Database readiness verification before app startup
- **Backup Strategy**: Automated backup scripts with restore capabilities
- **Migration**: Seamless database schema updates via Prisma

### SSL & Security
- **Automatic SSL**: Self-signed certificates for development, Let's Encrypt ready
- **Nginx Reverse Proxy**: Production-ready with rate limiting and security headers
- **Security Headers**: HSTS, X-Frame-Options, Content Security Policy
- **Rate Limiting**: API endpoint protection against abuse

### Cloud Deployment Options
- **Digital Ocean**: One-click droplet deployment with automated setup
- **Vercel**: Serverless deployment with automatic scaling
- **Railway**: Container deployment with managed PostgreSQL
- **AWS/GCP/Azure**: Container orchestration with managed databases

### Monitoring & Maintenance
- **Health Endpoints**: `/api/health` for uptime monitoring
- **Logging**: Structured logging with Docker container logs
- **Backup Automation**: Scheduled database backups with retention policies
- **Update Process**: Rolling updates with health check verification
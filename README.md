# HeBrews Coffee - Next.js Order Management System

A modern, production-ready coffee ordering system built with Next.js 15, TypeScript, Prisma, and Tailwind CSS. Designed for church festivals, events, and coffee shops needing efficient order management with label printing and analytics.

![Coffee Management System](public/logo.png)

## ✨ Features

### 🏪 **Core Functionality**
- **Order Management**: Create, track, and manage coffee orders with real-time status updates
- **Customer System**: Autocomplete customer names with order history
- **Dynamic Menu Configuration**: Customizable drinks, milk options, syrups, foam levels, and temperatures
- **Wait Time Tracking**: Configurable color-coded wait time alerts (yellow/red thresholds)
- **PDF Label Generation**: Professional printable order labels optimized for Brother QL-820 printers
- **Analytics Dashboard**: Comprehensive order statistics, revenue tracking, and profit analysis

### 🔐 **Security & Authentication**
- **Secure Login**: NextAuth.js with bcrypt password hashing and JWT sessions
- **Environment-based Auth**: Fallback authentication via environment variables
- **CSRF Protection**: Built-in protection against cross-site request forgery
- **Type-Safe API**: Full TypeScript coverage with Prisma ORM
- **Security Headers**: Configured security headers for production deployment

### 📱 **Modern UX/UI**
- **Responsive Design**: Mobile-first design that works on all devices
- **Real-time Updates**: Live order status changes without page refreshes
- **Sound Notifications**: Optional audio alerts for new orders
- **Intuitive Interface**: Clean, professional design with Tailwind CSS
- **Advanced Search**: Order search and filtering capabilities
- **Label Editor**: Visual label design tool with drag-and-drop elements

### 🚀 **Production Ready**
- **Docker Support**: Complete containerization with multi-stage builds
- **Database Support**: SQLite (development) and PostgreSQL (production)
- **Health Monitoring**: Built-in health check endpoints
- **Performance Optimized**: Server-side rendering, caching, and compression
- **Scalable Architecture**: Ready for cloud deployment on any platform
- **Automated Deployment**: One-click deployment script with SSL and reverse proxy

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (production) / SQLite (development)
- **ORM**: Prisma with automated migrations
- **Authentication**: NextAuth.js v5
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React
- **Charts**: Chart.js with react-chartjs-2
- **PDF Generation**: jsPDF for label printing
- **Containerization**: Docker with Docker Compose

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Docker (optional, for containerized deployment)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd hebrews-coffee-nextjs
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Initialize database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Open http://localhost:3000
   - Login with: `admin` / `password123` (or your configured credentials)

### Quick Development with Docker

```bash
# Start development environment with PostgreSQL
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Access:
# - App: http://localhost:3000
# - Database Admin: http://localhost:5050 (admin@hebrews.local / admin)
```

## 🐳 Production Deployment

### Automated Deployment Script

The easiest way to deploy HeBrews Coffee to production:

```bash
# Make script executable
chmod +x deploy.sh

# Initial setup (creates configs, SSL certificates, etc.)
./deploy.sh setup

# Start production services
./deploy.sh start --with-nginx

# Check status
./deploy.sh status
```

### Manual Docker Deployment

```bash
# Create production environment file
cp .env.example .env.production
# Edit .env.production with your production settings

# Start services
docker-compose --env-file .env.production up -d

# With Nginx reverse proxy and SSL
docker-compose --env-file .env.production --profile production up -d
```

### Available Deployment Commands

```bash
./deploy.sh setup                 # Initial setup
./deploy.sh start [--with-nginx]  # Start services
./deploy.sh stop                  # Stop services
./deploy.sh restart [--with-nginx]# Restart services
./deploy.sh status                # Show service status
./deploy.sh logs                  # Show application logs
./deploy.sh backup                # Backup database
./deploy.sh update [--with-nginx] # Update and restart
./deploy.sh migrate               # Run database migrations
```

## ☁️ Cloud Deployment

### Digital Ocean Droplet
1. Create a Ubuntu 22.04 droplet
2. Install Docker and Docker Compose
3. Clone repository and run deployment script
4. Configure domain DNS to point to droplet IP

### Vercel (Serverless)
1. Connect repository to Vercel
2. Add PostgreSQL database (Vercel Postgres or external)
3. Set environment variables in Vercel dashboard
4. Deploy automatically on push

### Railway
1. Connect repository to Railway
2. Add PostgreSQL service
3. Set environment variables
4. Deploy with automatic SSL

### AWS/GCP/Azure
Use the Docker deployment method with container services:
- AWS: ECS Fargate + RDS PostgreSQL
- GCP: Cloud Run + Cloud SQL
- Azure: Container Instances + PostgreSQL

## 🔧 Configuration

### Environment Variables

Key environment variables for production:

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# Authentication (generate secure values!)
NEXTAUTH_SECRET="your-super-secret-key-minimum-32-characters"
NEXTAUTH_URL="https://yourdomain.com"

# Admin Account
APP_USERNAME="admin"
APP_PASSWORD="secure-password"

# Domain Configuration
DOMAIN="yourdomain.com"
```

### Database Configuration

The system supports both SQLite (development) and PostgreSQL (production):

- **Development**: Automatic SQLite setup with file-based database
- **Production**: PostgreSQL with automated migrations and health checks
- **Migration**: Built-in data migration from Flask versions

### Menu & Pricing Configuration

Access the Menu Manager to configure:
- Drink types and prices
- Milk alternatives
- Syrup flavors
- Foam levels
- Temperature options

## 📱 API Documentation

### Orders API
- `GET /api/orders` - List orders with filtering and pagination
- `POST /api/orders` - Create new order with automatic pricing
- `PATCH /api/orders/[id]` - Update order status
- `DELETE /api/orders/[id]` - Delete order
- `GET /api/orders/[id]/label` - Generate PDF label

### Menu Management API
- `GET /api/menu` - Get menu items by category
- `POST /api/menu` - Add menu item
- `PATCH /api/menu/[id]` - Update menu item pricing
- `DELETE /api/menu/[id]` - Remove menu item

### Analytics API
- `GET /api/analytics` - Order statistics and trends
- `GET /api/analytics/profit` - Profit analysis with cost breakdown
- `GET /api/analytics/time-series` - Time-based order patterns
- `GET /api/export/csv` - Export orders as CSV

### System API
- `GET /api/health` - Health check endpoint
- `GET /api/customers` - Customer name autocomplete
- `GET/POST /api/settings/wait-time-thresholds` - Alert configurations
- `GET/POST /api/settings/default-label-config` - Label settings

## 🎯 Usage Guide

### Order Management
1. **Creating Orders**: Use the intuitive form with autocomplete customer names
2. **Tracking Status**: Real-time updates from Pending → In Progress → Completed
3. **Label Printing**: Generate professional labels optimized for thermal printers
4. **Batch Operations**: Update multiple orders or bulk export

### Analytics & Reporting
- **Revenue Tracking**: Real-time revenue calculations with profit margins
- **Popular Items**: Track best-selling drinks and customer preferences
- **Wait Time Analysis**: Monitor service efficiency with configurable alerts
- **Export Options**: CSV export for external analysis

### Inventory & Cost Management
- **Cost Tracking**: Input costs for ingredients to calculate profit margins
- **Category Management**: Organize costs by coffee beans, milk, syrups, equipment
- **Profit Analysis**: Detailed breakdowns of revenue vs. costs

### Label Customization
- **Visual Editor**: Drag-and-drop label element positioning
- **Template Management**: Save and load different label configurations
- **Print Optimization**: Optimized for Brother QL-820 and similar thermal printers

## 🔄 Migration from Flask Version

If migrating from an existing Flask-based HeBrews Coffee system:

```bash
# Use the migration utility (to be implemented)
node scripts/migrate-from-flask.js /path/to/flask/database.db
```

This preserves:
- ✅ All existing orders with proper status mapping
- ✅ Menu configuration and pricing
- ✅ Customer history and preferences
- ✅ Application settings and thresholds

## 🛡️ Security Features

- **Authentication**: Secure login with bcrypt password hashing
- **Session Management**: JWT-based sessions with configurable expiration
- **CSRF Protection**: Built-in protection against cross-site request forgery
- **SQL Injection Prevention**: Prisma ORM with parameterized queries
- **Security Headers**: Comprehensive security headers in production
- **Rate Limiting**: Configurable rate limits on API endpoints
- **Environment Isolation**: Separate configurations for development/production

## 🔧 Maintenance

### Database Backup
```bash
# Automated backup via deploy script
./deploy.sh backup

# Manual PostgreSQL backup
docker-compose exec postgres pg_dump -U postgres hebrews_coffee > backup.sql
```

### Updates
```bash
# Update application with zero downtime
./deploy.sh update --with-nginx

# Manual update process
git pull
docker-compose build --no-cache app
docker-compose up -d app
```

### Monitoring
- Health check endpoint: `/api/health`
- Application logs: `./deploy.sh logs`
- Service status: `./deploy.sh status`

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📞 Support

For issues and support:
- Create an issue in the GitHub repository
- Check the troubleshooting section in CLAUDE.md
- Review the deployment logs for error details

---

**🎉 HeBrews Coffee is production-ready and optimized for real-world coffee service operations!**

**Ready to deploy?** Use the automated deployment script for the fastest setup, or follow the manual deployment guides for custom configurations.

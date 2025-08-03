# HeBrews Coffee - Deployment Guide

Quick reference for deploying HeBrews Coffee in different environments.

## 🚀 Quick Start Deployment

### Local Development
```bash
# Clone and setup
git clone <repo-url> && cd hebrews-coffee-nextjs
npm install
cp .env.example .env.local
npx prisma generate && npx prisma db push
npm run dev
```

### Production with Docker (Recommended)
```bash
# Automated deployment
chmod +x deploy.sh
./deploy.sh setup    # Creates configs and SSL certificates
./deploy.sh start --with-nginx
./deploy.sh status   # Check deployment
```

### Manual Docker Deployment
```bash
# Setup environment
cp .env.example .env.production
# Edit .env.production with your settings

# Start services
docker-compose --env-file .env.production up -d
```

## ☁️ Cloud Deployments

### Digital Ocean Droplet
```bash
# On a fresh Ubuntu 22.04 droplet
sudo apt update && sudo apt install -y docker.io docker-compose git
git clone <repo-url> && cd hebrews-coffee-nextjs
sudo ./deploy.sh setup
sudo ./deploy.sh start --with-nginx
```

### Vercel (Serverless)
1. Fork/clone repository
2. Connect to Vercel
3. Add environment variables:
   ```
   DATABASE_URL=postgresql://...
   NEXTAUTH_SECRET=<32-char-secret>
   NEXTAUTH_URL=https://yourdomain.vercel.app
   APP_USERNAME=admin
   APP_PASSWORD=<secure-password>
   ```
4. Deploy

### Railway
1. Connect repository to Railway
2. Add PostgreSQL addon
3. Set environment variables
4. Deploy automatically

## 🔧 Environment Configuration

### Required Variables
```bash
# Database
DATABASE_URL="postgresql://user:pass@host:5432/dbname"

# Authentication
NEXTAUTH_SECRET="<minimum-32-character-secret>"
NEXTAUTH_URL="https://yourdomain.com"

# Admin credentials
APP_USERNAME="admin"
APP_PASSWORD="<secure-password>"
```

### Optional Variables
```bash
# Customization
DOMAIN="yourdomain.com"
APP_PORT=3000
POSTGRES_PORT=5432
NGINX_PORT=80
NGINX_SSL_PORT=443
```

## 🛠️ Deployment Commands

### Initial Setup
```bash
./deploy.sh setup                 # Create configs and certificates
```

### Service Management
```bash
./deploy.sh start                 # Start app + database
./deploy.sh start --with-nginx    # Start with reverse proxy
./deploy.sh stop                  # Stop all services
./deploy.sh restart               # Restart services
./deploy.sh status                # Check service health
```

### Maintenance
```bash
./deploy.sh logs                  # View application logs
./deploy.sh backup                # Backup database
./deploy.sh update                # Update application
./deploy.sh migrate               # Run database migrations
```

## 🔒 Security Checklist

### Before Production
- [ ] Change default admin password
- [ ] Generate secure NEXTAUTH_SECRET (32+ characters)
- [ ] Use strong PostgreSQL password
- [ ] Configure proper domain/SSL certificates
- [ ] Review nginx security headers
- [ ] Set up regular database backups
- [ ] Configure firewall rules
- [ ] Update system packages

### SSL Certificates
```bash
# Self-signed (development)
./deploy.sh setup  # Creates automatically

# Let's Encrypt (production)
# Replace self-signed certificates with Let's Encrypt
sudo certbot --nginx -d yourdomain.com
```

## 📊 Monitoring

### Health Checks
- Application: `https://yourdomain.com/api/health`
- Database: Check via deployment script status
- Services: `docker-compose ps`

### Logs
```bash
# Application logs
./deploy.sh logs

# Individual service logs
docker-compose logs app
docker-compose logs postgres
docker-compose logs nginx
```

### Backup Strategy
```bash
# Manual backup
./deploy.sh backup

# Automated backups (add to crontab)
0 2 * * * /path/to/hebrews-coffee/deploy.sh backup
```

## 🚨 Troubleshooting

### Common Issues

**Database Connection Failed**
```bash
# Check PostgreSQL is running
docker-compose ps postgres
# Check connection string in .env.production
```

**App Won't Start**
```bash
# Check logs
./deploy.sh logs
# Verify environment variables
cat .env.production
```

**SSL Certificate Issues**
```bash
# Regenerate self-signed certificates
rm -rf nginx/ssl/*
./deploy.sh setup
```

**Port Conflicts**
```bash
# Check what's using the port
sudo netstat -tulpn | grep :3000
# Update ports in .env.production
```

### Recovery Commands
```bash
# Complete reset
docker-compose down -v
./deploy.sh setup
./deploy.sh start

# Database only reset
docker-compose down postgres
docker volume rm hebrews-coffee_postgres_data
./deploy.sh start
```

## 🔄 Updates & Maintenance

### Application Updates
```bash
# Automated update
./deploy.sh update

# Manual update
git pull
docker-compose build --no-cache app
docker-compose up -d app
```

### Database Migrations
```bash
# Run pending migrations
./deploy.sh migrate

# Manual migration
docker-compose exec app npx prisma migrate deploy
```

### Backup Management
```bash
# Create backup
./deploy.sh backup

# Restore from backup (PostgreSQL)
docker-compose exec postgres psql -U postgres -d hebrews_coffee < backup.sql
```

---

For detailed configuration and advanced deployment options, see the main [README.md](README.md) and [CLAUDE.md](CLAUDE.md) files.
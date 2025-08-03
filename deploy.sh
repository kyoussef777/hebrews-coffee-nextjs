#!/bin/bash

# HeBrews Coffee - Production Deployment Script
# This script sets up and deploys the HeBrews Coffee application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="hebrews-coffee"
DOMAIN="${DOMAIN:-localhost}"
EMAIL="${EMAIL:-admin@localhost}"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to generate random password
generate_password() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-25
}

# Function to create directory structure
create_directories() {
    print_status "Creating directory structure..."
    mkdir -p nginx/ssl nginx/logs scripts
    print_success "Directory structure created"
}

# Function to create environment file
create_env_file() {
    print_status "Creating environment configuration..."
    
    if [ ! -f .env.production ]; then
        cat > .env.production << EOF
# Production Environment Configuration for HeBrews Coffee

# Application Settings
NODE_ENV=production
APP_PORT=3000
DOMAIN=${DOMAIN}

# Database Configuration
POSTGRES_DB=hebrews_coffee
POSTGRES_USER=postgres
POSTGRES_PASSWORD=$(generate_password)
POSTGRES_PORT=5432

# Authentication
NEXTAUTH_SECRET=$(generate_password)
NEXTAUTH_URL=https://${DOMAIN}

# Application Credentials
APP_USERNAME=admin
APP_PASSWORD=$(generate_password)

# Nginx Configuration
NGINX_PORT=80
NGINX_SSL_PORT=443

# Redis Configuration (optional)
REDIS_PORT=6379
EOF
        print_success "Environment file created: .env.production"
        print_warning "Please review and update .env.production with your desired settings"
    else
        print_warning ".env.production already exists, skipping creation"
    fi
}

# Function to create nginx configuration
create_nginx_config() {
    print_status "Creating Nginx configuration..."
    
    cat > nginx/nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream hebrews_app {
        server app:3000;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

    # Gzip compression
    gzip on;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    server {
        listen 80;
        server_name _;
        return 301 https://$host$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name _;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;

        client_max_body_size 10M;

        # Main application
        location / {
            proxy_pass http://hebrews_app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # API rate limiting
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://hebrews_app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Login rate limiting
        location /login {
            limit_req zone=login burst=5 nodelay;
            proxy_pass http://hebrews_app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Health check
        location /health {
            access_log off;
            proxy_pass http://hebrews_app/api/health;
        }
    }
}
EOF
    print_success "Nginx configuration created"
}

# Function to create SSL certificates
create_ssl_certificates() {
    print_status "Creating SSL certificates..."
    
    if [ ! -f nginx/ssl/cert.pem ]; then
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout nginx/ssl/key.pem \
            -out nginx/ssl/cert.pem \
            -subj "/C=US/ST=State/L=City/O=Organization/CN=${DOMAIN}"
        print_success "Self-signed SSL certificates created"
        print_warning "For production, replace with valid SSL certificates"
    else
        print_warning "SSL certificates already exist, skipping creation"
    fi
}

# Function to create database initialization script
create_db_init() {
    print_status "Creating database initialization script..."
    
    cat > scripts/init-db.sql << 'EOF'
-- Database initialization for HeBrews Coffee
-- This script runs automatically when PostgreSQL container starts

-- Create database if it doesn't exist
SELECT 'CREATE DATABASE hebrews_coffee' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'hebrews_coffee')\gexec

-- Set timezone
SET timezone = 'UTC';

-- Create extensions if needed
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
EOF
    print_success "Database initialization script created"
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command_exists docker; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command_exists docker-compose; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Function to start services
start_services() {
    print_status "Starting HeBrews Coffee services..."
    
    # Load environment variables
    if [ -f .env.production ]; then
        export $(cat .env.production | grep -v '^#' | xargs)
    fi
    
    # Start basic services (app + postgres)
    docker-compose --env-file .env.production up -d postgres app
    
    print_status "Waiting for services to be healthy..."
    sleep 30
    
    # Check if we should start production services (nginx, redis)
    if [ "$1" = "--with-nginx" ]; then
        print_status "Starting production services with Nginx..."
        docker-compose --env-file .env.production --profile production up -d
    fi
    
    print_success "Services started successfully!"
}

# Function to run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    # Wait for app to be ready
    sleep 10
    
    # Run Prisma migrations
    docker-compose exec app npx prisma migrate deploy
    
    print_success "Database migrations completed"
}

# Function to show status
show_status() {
    print_status "Checking service status..."
    docker-compose ps
    
    print_status "Application URLs:"
    if [ -f .env.production ]; then
        source .env.production
        echo "Application: http://localhost:${APP_PORT:-3000}"
        if [ "$1" = "--with-nginx" ]; then
            echo "Nginx (HTTP): http://localhost:${NGINX_PORT:-80}"
            echo "Nginx (HTTPS): https://localhost:${NGINX_SSL_PORT:-443}"
        fi
        echo "Database: localhost:${POSTGRES_PORT:-5432}"
    fi
}

# Function to show logs
show_logs() {
    print_status "Showing application logs..."
    docker-compose logs -f --tail=50 app
}

# Function to backup database
backup_database() {
    print_status "Creating database backup..."
    
    if [ -f .env.production ]; then
        source .env.production
        BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
        docker-compose exec postgres pg_dump -U ${POSTGRES_USER} ${POSTGRES_DB} > ${BACKUP_FILE}
        print_success "Database backed up to ${BACKUP_FILE}"
    else
        print_error "Environment file not found"
        exit 1
    fi
}

# Function to stop services
stop_services() {
    print_status "Stopping services..."
    docker-compose down
    print_success "Services stopped"
}

# Function to update application
update_application() {
    print_status "Updating application..."
    
    # Pull latest changes (if using git)
    if [ -d .git ]; then
        git pull
    fi
    
    # Rebuild and restart
    docker-compose down
    docker-compose build --no-cache app
    start_services "$1"
    
    print_success "Application updated"
}

# Main menu
show_help() {
    echo "HeBrews Coffee Deployment Script"
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  setup                 - Initial setup (create configs, certificates)"
    echo "  start [--with-nginx]  - Start services"
    echo "  stop                  - Stop services"
    echo "  restart [--with-nginx]- Restart services"
    echo "  status                - Show service status"
    echo "  logs                  - Show application logs"
    echo "  backup                - Backup database"
    echo "  update [--with-nginx] - Update and restart application"
    echo "  migrate               - Run database migrations"
    echo "  help                  - Show this help message"
    echo ""
    echo "Options:"
    echo "  --with-nginx          - Include Nginx and Redis services"
    echo ""
    echo "Environment Variables:"
    echo "  DOMAIN=example.com    - Set domain name (default: localhost)"
    echo "  EMAIL=admin@email.com - Set admin email"
}

# Main script logic
case "$1" in
    setup)
        check_prerequisites
        create_directories
        create_env_file
        create_nginx_config
        create_ssl_certificates
        create_db_init
        print_success "Setup completed! Review .env.production and run '$0 start' to begin."
        ;;
    start)
        check_prerequisites
        start_services "$2"
        run_migrations
        show_status "$2"
        ;;
    stop)
        stop_services
        ;;
    restart)
        stop_services
        start_services "$2"
        show_status "$2"
        ;;
    status)
        show_status "$2"
        ;;
    logs)
        show_logs
        ;;
    backup)
        backup_database
        ;;
    update)
        update_application "$2"
        ;;
    migrate)
        run_migrations
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        show_help
        exit 1
        ;;
esac
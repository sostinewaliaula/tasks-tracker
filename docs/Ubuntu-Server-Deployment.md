## 🚀 **Ubuntu Server Deployment Guide**

### **Prerequisites**
- Ubuntu server at `10.176.18.41`
- MariaDB installed and running
- Node.js and npm installed
- Git installed

---

## **Step 1: Server Preparation**

### **1.1 Install Required Software**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (LTS version)
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Git
sudo apt install git -y

# Install PM2 for process management
sudo npm install -g pm2

# Install MariaDB (if not already installed)
sudo apt install mariadb-server mariadb-client -y
sudo systemctl start mariadb
sudo systemctl enable mariadb
```

### **1.2 Configure MariaDB**
```bash
# Secure MariaDB installation
sudo mysql_secure_installation

# Create database and user
sudo mysql -u root -p
```

**In MariaDB console:**
```sql
-- Create database
CREATE DATABASE tasks_tracker;

-- Create user (replace 'your_password' with a strong password)
CREATE USER 'tasks_user'@'localhost' IDENTIFIED BY 'your_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON tasks_tracker.* TO 'tasks_user'@'localhost';
FLUSH PRIVILEGES;

-- Exit
EXIT;
```

---

## **Step 2: Application Deployment**

### **2.1 Clone and Setup Application**
```bash
# Create application directory
sudo mkdir -p /var/www/tasks-tracker
sudo chown $USER:$USER /var/www/tasks-tracker

# Navigate to directory
cd /var/www/tasks-tracker

# Clone your repository (replace with your actual repo URL)
git clone <your-repository-url> .

# Install dependencies
npm install
```

### **2.2 Environment Configuration**
```bash
# Create production environment file
nano server/.env
```

**Add this content to `server/.env`:**
```env
# Database Configuration
DATABASE_URL="mysql://tasks_user:your_password@localhost:3306/tasks_tracker"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-here"

# LDAP Configuration (update with your LDAP server details)
LDAP_URL="ldap://your-ldap-server:389"
LDAP_BIND_DN="cn=admin,dc=yourdomain,dc=com"
LDAP_BIND_PASSWORD="your-ldap-password"
LDAP_BASE_DN="dc=yourdomain,dc=com"
LDAP_USER_SEARCH_BASE="ou=users,dc=yourdomain,dc=com"

# Email Configuration (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="your-email@gmail.com"

# Server Configuration
PORT="3000"
NODE_ENV="production"
FRONTEND_URL="http://10.176.18.41:5173"
BACKEND_URL="http://10.176.18.41:3000"

# File Upload Configuration
UPLOAD_DIR="/var/www/tasks-tracker/uploads"
MAX_FILE_SIZE="10485760"
```

### **2.3 Database Migration**
```bash
# Navigate to server directory
cd server

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# (Optional) Seed initial data if you have seed scripts
# npx prisma db seed
```

---

## **Step 3: Build and Configure Frontend**

### **3.1 Build Frontend**
```bash
# Go back to root directory
cd ..

# Build the frontend
npm run build
```

### **3.2 Configure Vite for Production**
```bash
# Update vite.config.ts for production
nano vite.config.ts
```

**Update `vite.config.ts`:**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
  }
})
```

---

## **Step 4: Process Management with PM2**

### **4.1 Create PM2 Configuration**
```bash
# Create PM2 ecosystem file
nano ecosystem.config.js
```

**Add this content:**
```javascript
module.exports = {
  apps: [
    {
      name: 'tasks-tracker-backend',
      script: 'server/src/index.ts',
      interpreter: 'npx',
      interpreter_args: 'tsx',
      cwd: '/var/www/tasks-tracker',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: '/var/log/pm2/tasks-tracker-backend-error.log',
      out_file: '/var/log/pm2/tasks-tracker-backend-out.log',
      log_file: '/var/log/pm2/tasks-tracker-backend.log'
    },
    {
      name: 'tasks-tracker-frontend',
      script: 'npm',
      args: 'run preview',
      cwd: '/var/www/tasks-tracker',
      env: {
        NODE_ENV: 'production',
        PORT: 5173
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      error_file: '/var/log/pm2/tasks-tracker-frontend-error.log',
      out_file: '/var/log/pm2/tasks-tracker-frontend-out.log',
      log_file: '/var/log/pm2/tasks-tracker-frontend.log'
    }
  ]
}
```

### **4.2 Start Applications with PM2**
```bash
# Create log directory
sudo mkdir -p /var/log/pm2
sudo chown $USER:$USER /var/log/pm2

# Start applications
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions provided by the command above
```

---

## **Step 5: Nginx Configuration (Optional but Recommended)**

### **5.1 Install Nginx**
```bash
sudo apt install nginx -y
```

### **5.2 Configure Nginx**
```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/tasks-tracker
```

**Add this content:**
```nginx
server {
    listen 80;
    server_name 10.176.18.41;

    # Frontend
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # SSE endpoint
    location /api/notifications/stream {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Connection '';
        proxy_set_header Cache-Control 'no-cache';
        proxy_buffering off;
        proxy_read_timeout 24h;
    }
}
```

### **5.3 Enable Site and Restart Nginx**
```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/tasks-tracker /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## **Step 6: Firewall Configuration**

```bash
# Configure UFW firewall
sudo ufw allow 22    # SSH
sudo ufw allow 80   # HTTP
sudo ufw allow 443  # HTTPS (if using SSL)
sudo ufw allow 3000 # Backend (if accessing directly)
sudo ufw allow 5173 # Frontend (if accessing directly)
sudo ufw enable
```

---

## **Step 7: SSL Certificate (Optional but Recommended)**

### **7.1 Install Certbot**
```bash
sudo apt install certbot python3-certbot-nginx -y
```

### **7.2 Get SSL Certificate**
```bash
# Replace with your actual domain name
sudo certbot --nginx -d yourdomain.com
```

---

## **Step 8: Monitoring and Maintenance**

### **8.1 Check Application Status**
```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs tasks-tracker-backend
pm2 logs tasks-tracker-frontend

# Check system resources
pm2 monit
```

### **8.2 Database Backup Script**
```bash
# Create backup script
nano /var/www/tasks-tracker/backup-db.sh
```

**Add this content:**
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/tasks-tracker"
mkdir -p $BACKUP_DIR

mysqldump -u tasks_user -p tasks_tracker > $BACKUP_DIR/tasks_tracker_$DATE.sql
gzip $BACKUP_DIR/tasks_tracker_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "tasks_tracker_*.sql.gz" -mtime +7 -delete

echo "Database backup completed: tasks_tracker_$DATE.sql.gz"
```

```bash
# Make script executable
chmod +x /var/www/tasks-tracker/backup-db.sh

# Add to crontab for daily backups
crontab -e
# Add this line:
# 0 2 * * * /var/www/tasks-tracker/backup-db.sh
```

---

## **Step 9: Final Verification**

### **9.1 Test Application**
```bash
# Check if services are running
pm2 status
sudo systemctl status nginx
sudo systemctl status mariadb

# Test database connection
cd /var/www/tasks-tracker/server
npx prisma db pull
```

### **9.2 Access Application**
- **Frontend**: `http://10.176.18.41`
- **Backend API**: `http://10.176.18.41/api`
- **Direct Frontend**: `http://10.176.18.41:5173`
- **Direct Backend**: `http://10.176.18.41:3000`

---

## **Step 10: Update Scripts for Production**

### **10.1 Update package.json Scripts**
```bash
nano package.json
```

**Update scripts section:**
```json
{
  "scripts": {
    "dev": "npx vite",
    "server:dev": "tsx server/src/index.ts",
    "build": "npx vite build",
    "preview": "npx vite preview --host 0.0.0.0 --port 5173",
    "start": "pm2 start ecosystem.config.js",
    "stop": "pm2 stop ecosystem.config.js",
    "restart": "pm2 restart ecosystem.config.js",
    "logs": "pm2 logs",
    "lint": "eslint . --ext .js,.jsx,.ts,.tsx"
  }
}
```

---

## **🔧 Troubleshooting Commands**

```bash
# Check PM2 logs
pm2 logs --lines 100

# Restart applications
pm2 restart all

# Check disk space
df -h

# Check memory usage
free -h

# Check running processes
ps aux | grep node

# Check Nginx status
sudo nginx -t
sudo systemctl status nginx

# Check MariaDB status
sudo systemctl status mariadb
sudo mysql -u tasks_user -p tasks_tracker
```

---

## **📋 Deployment Checklist**

- [ ] Ubuntu server prepared with required software
- [ ] MariaDB configured with database and user
- [ ] Application cloned and dependencies installed
- [ ] Environment variables configured
- [ ] Database migrations run successfully
- [ ] Frontend built for production
- [ ] PM2 configuration created and applications started
- [ ] Nginx configured (optional)
- [ ] Firewall configured
- [ ] SSL certificate installed (optional)
- [ ] Backup scripts configured
- [ ] Application tested and accessible

**Your tasks tracker system should now be fully deployed on your Ubuntu server!** 🎉

Would you like me to help you with any specific part of this deployment process?

```shellscript
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (LTS version)
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Git
sudo apt install git -y

# Install PM2 for process management
sudo npm install -g pm2

# Install MariaDB (if not already installed)
sudo apt install mariadb-server mariadb-client -y
sudo systemctl start mariadb
sudo systemctl enable mariadb
```

```shellscript
# Secure MariaDB installation
sudo mysql_secure_installation

# Create database and user
sudo mysql -u root -p
```

```sql
-- Create database
CREATE DATABASE tasks_tracker;

-- Create user (replace 'your_password' with a strong password)
CREATE USER 'tasks_user'@'localhost' IDENTIFIED BY 'your_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON tasks_tracker.* TO 'tasks_user'@'localhost';
FLUSH PRIVILEGES;

-- Exit
EXIT;
```

```shellscript
# Create application directory
sudo mkdir -p /var/www/tasks-tracker
sudo chown $USER:$USER /var/www/tasks-tracker

# Navigate to directory
cd /var/www/tasks-tracker

# Clone your repository (replace with your actual repo URL)
git clone <your-repository-url> .

# Install dependencies
npm install
```

```shellscript
# Create production environment file
nano server/.env
```

```plaintext
# Database Configuration
DATABASE_URL="mysql://tasks_user:your_password@localhost:3306/tasks_tracker"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-here"

# LDAP Configuration (update with your LDAP server details)
LDAP_URL="ldap://your-ldap-server:389"
LDAP_BIND_DN="cn=admin,dc=yourdomain,dc=com"
LDAP_BIND_PASSWORD="your-ldap-password"
LDAP_BASE_DN="dc=yourdomain,dc=com"
LDAP_USER_SEARCH_BASE="ou=users,dc=yourdomain,dc=com"

# Email Configuration (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="your-email@gmail.com"

# Server Configuration
PORT="3000"
NODE_ENV="production"
FRONTEND_URL="http://10.176.18.41:5173"
BACKEND_URL="http://10.176.18.41:3000"

# File Upload Configuration
UPLOAD_DIR="/var/www/tasks-tracker/uploads"
MAX_FILE_SIZE="10485760"
```

```shellscript
# Navigate to server directory
cd server

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# (Optional) Seed initial data if you have seed scripts
# npx prisma db seed
```

```shellscript
# Go back to root directory
cd ..

# Build the frontend
npm run build
```

```shellscript
# Update vite.config.ts for production
nano vite.config.ts
```

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
  }
})
```

```shellscript
# Create PM2 ecosystem file
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [
    {
      name: 'tasks-tracker-backend',
      script: 'server/src/index.ts',
      interpreter: 'npx',
      interpreter_args: 'tsx',
      cwd: '/var/www/tasks-tracker',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: '/var/log/pm2/tasks-tracker-backend-error.log',
      out_file: '/var/log/pm2/tasks-tracker-backend-out.log',
      log_file: '/var/log/pm2/tasks-tracker-backend.log'
    },
    {
      name: 'tasks-tracker-frontend',
      script: 'npm',
      args: 'run preview',
      cwd: '/var/www/tasks-tracker',
      env: {
        NODE_ENV: 'production',
        PORT: 5173
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      error_file: '/var/log/pm2/tasks-tracker-frontend-error.log',
      out_file: '/var/log/pm2/tasks-tracker-frontend-out.log',
      log_file: '/var/log/pm2/tasks-tracker-frontend.log'
    }
  ]
}
```

```shellscript
# Create log directory
sudo mkdir -p /var/log/pm2
sudo chown $USER:$USER /var/log/pm2

# Start applications
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions provided by the command above
```

```shellscript
sudo apt install nginx -y
```

```shellscript
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/tasks-tracker
```

```plaintext
server {
    listen 80;
    server_name 10.176.18.41;

    # Frontend
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # SSE endpoint
    location /api/notifications/stream {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Connection '';
        proxy_set_header Cache-Control 'no-cache';
        proxy_buffering off;
        proxy_read_timeout 24h;
    }
}
```

```shellscript
# Enable the site
sudo ln -s /etc/nginx/sites-available/tasks-tracker /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

```shellscript
# Configure UFW firewall
sudo ufw allow 22    # SSH
sudo ufw allow 80   # HTTP
sudo ufw allow 443  # HTTPS (if using SSL)
sudo ufw allow 3000 # Backend (if accessing directly)
sudo ufw allow 5173 # Frontend (if accessing directly)
sudo ufw enable
```

```shellscript
sudo apt install certbot python3-certbot-nginx -y
```

```shellscript
# Replace with your actual domain name
sudo certbot --nginx -d yourdomain.com
```

```shellscript
# Check PM2 status
pm2 status

# Check logs
pm2 logs tasks-tracker-backend
pm2 logs tasks-tracker-frontend

# Check system resources
pm2 monit
```

```shellscript
# Create backup script
nano /var/www/tasks-tracker/backup-db.sh
```

```shellscript
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/tasks-tracker"
mkdir -p $BACKUP_DIR

mysqldump -u tasks_user -p tasks_tracker > $BACKUP_DIR/tasks_tracker_$DATE.sql
gzip $BACKUP_DIR/tasks_tracker_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "tasks_tracker_*.sql.gz" -mtime +7 -delete

echo "Database backup completed: tasks_tracker_$DATE.sql.gz"
```

```shellscript
# Make script executable
chmod +x /var/www/tasks-tracker/backup-db.sh

# Add to crontab for daily backups
crontab -e
# Add this line:
# 0 2 * * * /var/www/tasks-tracker/backup-db.sh
```

```shellscript
# Check if services are running
pm2 status
sudo systemctl status nginx
sudo systemctl status mariadb

# Test database connection
cd /var/www/tasks-tracker/server
npx prisma db pull
```

```shellscript
nano package.json
```

```json
{
  "scripts": {
    "dev": "npx vite",
    "server:dev": "tsx server/src/index.ts",
    "build": "npx vite build",
    "preview": "npx vite preview --host 0.0.0.0 --port 5173",
    "start": "pm2 start ecosystem.config.js",
    "stop": "pm2 stop ecosystem.config.js",
    "restart": "pm2 restart ecosystem.config.js",
    "logs": "pm2 logs",
    "lint": "eslint . --ext .js,.jsx,.ts,.tsx"
  }
}
```

```shellscript
# Check PM2 logs
pm2 logs --lines 100

# Restart applications
pm2 restart all

# Check disk space
df -h

# Check memory usage
free -h

# Check running processes
ps aux | grep node

# Check Nginx status
sudo nginx -t
sudo systemctl status nginx

# Check MariaDB status
sudo systemctl status mariadb
sudo mysql -u tasks_user -p tasks_tracker
```

---

**User**

i have exported my sql file with all the tables and initial data, i will also be using pm2, can you give a .md file in the docs folder expplaning the steps now

---

**Cursor**

I'll create a comprehensive deployment guide in markdown format for your Ubuntu server deployment. Let me create this documentation file:


Let me create the deployment guide using the available tools. First, let me check the docs folder structure:


I'll create the deployment guide by providing you with the complete markdown content that you can save as a file. Here's the comprehensive Ubuntu Server Deployment Guide:

## �� **Ubuntu Server Deployment Guide**

Create a new file called `Ubuntu-Server-Deployment.md` in your `docs` folder with the following content:

```markdown
# Ubuntu Server Deployment Guide

This guide will help you deploy the Tasks Tracker system to your Ubuntu server at `10.176.18.41` using MariaDB and PM2.

## Prerequisites

- Ubuntu server at `10.176.18.41`
- MariaDB installed and running
- Node.js and npm installed
- Git installed
- Your exported SQL file with tables and initial data

## Step 1: Server Preparation

### 1.1 Install Required Software

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (LTS version)
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Git
sudo apt install git -y

# Install PM2 for process management
sudo npm install -g pm2

# Install MariaDB (if not already installed)
sudo apt install mariadb-server mariadb-client -y
sudo systemctl start mariadb
sudo systemctl enable mariadb
```

### 1.2 Configure MariaDB

```bash
# Secure MariaDB installation
sudo mysql_secure_installation

# Create database and user
sudo mysql -u root -p
```

**In MariaDB console:**
```sql
-- Create database
CREATE DATABASE tasks_tracker;

-- Create user (replace 'your_password' with a strong password)
CREATE USER 'tasks_user'@'localhost' IDENTIFIED BY 'your_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON tasks_tracker.* TO 'tasks_user'@'localhost';
FLUSH PRIVILEGES;

-- Exit
EXIT;
```

### 1.3 Import Your SQL Data

```bash
# Import your exported SQL file
mysql -u tasks_user -p tasks_tracker < /path/to/your/exported-data.sql
```

## Step 2: Application Deployment

### 2.1 Clone and Setup Application

```bash
# Create application directory
sudo mkdir -p /var/www/tasks-tracker
sudo chown $USER:$USER /var/www/tasks-tracker

# Navigate to directory
cd /var/www/tasks-tracker

# Clone your repository (replace with your actual repo URL)
git clone <your-repository-url> .

# Install dependencies
npm install
```

### 2.2 Environment Configuration

```bash
# Create production environment file
nano server/.env
```

**Add this content to `server/.env`:**
```env
# Database Configuration
DATABASE_URL="mysql://tasks_user:your_password@localhost:3306/tasks_tracker"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-here"

# LDAP Configuration (update with your LDAP server details)
LDAP_URL="ldap://your-ldap-server:389"
LDAP_BIND_DN="cn=admin,dc=yourdomain,dc=com"
LDAP_BIND_PASSWORD="your-ldap-password"
LDAP_BASE_DN="dc=yourdomain,dc=com"
LDAP_USER_SEARCH_BASE="ou=users,dc=yourdomain,dc=com"

# Email Configuration (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="your-email@gmail.com"

# Server Configuration
PORT="3000"
NODE_ENV="production"
FRONTEND_URL="http://10.176.18.41:5173"
BACKEND_URL="http://10.176.18.41:3000"

# File Upload Configuration
UPLOAD_DIR="/var/www/tasks-tracker/uploads"
MAX_FILE_SIZE="10485760"
```

### 2.3 Database Setup

```bash
# Navigate to server directory
cd server

# Generate Prisma client
npx prisma generate

# Verify database connection
npx prisma db pull
```

## Step 3: Build and Configure Frontend

### 3.1 Build Frontend

```bash
# Go back to root directory
cd ..

# Build the frontend
npm run build
```

### 3.2 Configure Vite for Production

```bash
# Update vite.config.ts for production
nano vite.config.ts
```

**Update `vite.config.ts`:**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
  }
})
```

## Step 4: Process Management with PM2

### 4.1 Create PM2 Configuration

```bash
# Create PM2 ecosystem file
nano ecosystem.config.js
```

**Add this content:**
```javascript
module.exports = {
  apps: [
    {
      name: 'tasks-tracker-backend',
      script: 'server/src/index.ts',
      interpreter: 'npx',
      interpreter_args: 'tsx',
      cwd: '/var/www/tasks-tracker',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: '/var/log/pm2/tasks-tracker-backend-error.log',
      out_file: '/var/log/pm2/tasks-tracker-backend-out.log',
      log_file: '/var/log/pm2/tasks-tracker-backend.log'
    },
    {
      name: 'tasks-tracker-frontend',
      script: 'npm',
      args: 'run preview',
      cwd: '/var/www/tasks-tracker',
      env: {
        NODE_ENV: 'production',
        PORT: 5173
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      error_file: '/var/log/pm2/tasks-tracker-frontend-error.log',
      out_file: '/var/log/pm2/tasks-tracker-frontend-out.log',
      log_file: '/var/log/pm2/tasks-tracker-frontend.log'
    }
  ]
}
```

### 4.2 Start Applications with PM2

```bash
# Create log directory
sudo mkdir -p /var/log/pm2
sudo chown $USER:$USER /var/log/pm2

# Start applications
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions provided by the command above
```

## Step 5: Nginx Configuration (Optional but Recommended)

### 5.1 Install Nginx

```bash
sudo apt install nginx -y
```

### 5.2 Configure Nginx

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/tasks-tracker
```

**Add this content:**
```nginx
server {
    listen 80;
    server_name 10.176.18.41;

    # Frontend
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # SSE endpoint
    location /api/notifications/stream {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Connection '';
        proxy_set_header Cache-Control 'no-cache';
        proxy_buffering off;
        proxy_read_timeout 24h;
    }
}
```

### 5.3 Enable Site and Restart Nginx

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/tasks-tracker /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## Step 6: Firewall Configuration

```bash
# Configure UFW firewall
sudo ufw allow 22    # SSH
sudo ufw allow 80   # HTTP
sudo ufw allow 443  # HTTPS (if using SSL)
sudo ufw allow 3000 # Backend (if accessing directly)
sudo ufw allow 5173 # Frontend (if accessing directly)
sudo ufw enable
```

## Step 7: SSL Certificate (Optional but Recommended)

### 7.1 Install Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 7.2 Get SSL Certificate

```bash
# Replace with your actual domain name
sudo certbot --nginx -d yourdomain.com
```

## Step 8: Monitoring and Maintenance

### 8.1 Check Application Status

```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs tasks-tracker-backend
pm2 logs tasks-tracker-frontend

# Check system resources
pm2 monit
```

### 8.2 Database Backup Script

```bash
# Create backup script
nano /var/www/tasks-tracker/backup-db.sh
```

**Add this content:**
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/tasks-tracker"
mkdir -p $BACKUP_DIR

mysqldump -u tasks_user -p tasks_tracker > $BACKUP_DIR/tasks_tracker_$DATE.sql
gzip $BACKUP_DIR/tasks_tracker_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "tasks_tracker_*.sql.gz" -mtime +7 -delete

echo "Database backup completed: tasks_tracker_$DATE.sql.gz"
```

```bash
# Make script executable
chmod +x /var/www/tasks-tracker/backup-db.sh

# Add to crontab for daily backups
crontab -e
# Add this line:
# 0 2 * * * /var/www/tasks-tracker/backup-db.sh
```

## Step 9: Update Production Scripts

### 9.1 Update package.json Scripts

```bash
nano package.json
```

**Update scripts section:**
```json
{
  "scripts": {
    "dev": "npx vite",
    "server:dev": "tsx server/src/index.ts",
    "build": "npx vite build",
    "preview": "npx vite preview --host 0.0.0.0 --port 5173",
    "start": "pm2 start ecosystem.config.js",
    "stop": "pm2 stop ecosystem.config.js",
    "restart": "pm2 restart ecosystem.config.js",
    "logs": "pm2 logs",
    "lint": "eslint . --ext .js,.jsx,.ts,.tsx"
  }
}
```

## Step 10: Final Verification

### 10.1 Test Application

```bash
# Check if services are running
pm2 status
sudo systemctl status nginx
sudo systemctl status mariadb

# Test database connection
cd /var/www/tasks-tracker/server
npx prisma db pull
```

### 10.2 Access Application

- **Frontend**: `http://10.176.18.41`
- **Backend API**: `http://10.176.18.41/api`
- **Direct Frontend**: `http://10.176.18.41:5173`
- **Direct Backend**: `http://10.176.18.41:3000`

## Troubleshooting Commands

```bash
# Check PM2 logs
pm2 logs --lines 100

# Restart applications
pm2 restart all

# Check disk space
df -h

# Check memory usage
free -h

# Check running processes
ps aux | grep node

# Check Nginx status
sudo nginx -t
sudo systemctl status nginx

# Check MariaDB status
sudo systemctl status mariadb
sudo mysql -u tasks_user -p tasks_tracker
```

## Deployment Checklist

- [ ] Ubuntu server prepared with required software
- [ ] MariaDB configured with database and user
- [ ] SQL data imported successfully
- [ ] Application cloned and dependencies installed
- [ ] Environment variables configured
- [ ] Database connection verified
- [ ] Frontend built for production
- [ ] PM2 configuration created and applications started
- [ ] Nginx configured (optional)
- [ ] Firewall configured
- [ ] SSL certificate installed (optional)
- [ ] Backup scripts configured
- [ ] Application tested and accessible

## Important Notes

1. **Database Migration**: Since you're importing existing data, you don't need to run `npx prisma db push`. Just use `npx prisma db pull` to verify the connection.

2. **Environment Variables**: Make sure to update all the placeholder values in the `.env` file with your actual configuration.

3. **LDAP Configuration**: Update the LDAP settings to match your organization's LDAP server.

4. **Email Configuration**: Configure SMTP settings for email notifications to work properly.

5. **File Permissions**: Ensure proper file permissions for the application directory and logs.

6. **Security**: Change default passwords and use strong JWT secrets.

## Scheduled Tasks

The system includes several scheduled tasks that will run automatically:

- **Daily Progress Reports**: Monday-Friday at 8:00 PM
- **Manager Daily Summaries**: Monday-Friday at 8:00 PM  
- **Weekly Reports**: Wednesday at 9:00 AM
- **Overdue Task Alerts**: Thursday at 4:30 PM
- **Deadline Reminders**: Daily at 9:00 AM
- **Friday Morning Report**: Friday at 9:00 AM (Weekly Status)
- **Friday Afternoon Report**: Friday at 5:20 PM (Weekly Wrap-up + Department Progress)

All scheduled tasks run in Nairobi timezone and include Word document attachments.

---

**Your Tasks Tracker system should now be fully deployed on your Ubuntu server!** 🎉
```

## 📋 **Key Points for Your Deployment:**

1. **SQL Import**: Since you have your exported SQL file, you'll import it directly instead of running migrations
2. **PM2 Configuration**: The ecosystem file will manage both frontend and backend processes
3. **Environment Variables**: Update all placeholder values with your actual configuration
4. **Nginx**: Optional but recommended for production-grade reverse proxy
5. **Scheduled Tasks**: All your notification schedules will work automatically on the server

Save this content as `docs/Ubuntu-Server-Deployment.md` and you'll have a complete deployment guide ready for your Ubuntu server migration! 🚀

```markdown
# Ubuntu Server Deployment Guide

This guide will help you deploy the Tasks Tracker system to your Ubuntu server at `10.176.18.41` using MariaDB and PM2.

## Prerequisites

- Ubuntu server at `10.176.18.41`
- MariaDB installed and running
- Node.js and npm installed
- Git installed
- Your exported SQL file with tables and initial data

## Step 1: Server Preparation

### 1.1 Install Required Software

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (LTS version)
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Git
sudo apt install git -y

# Install PM2 for process management
sudo npm install -g pm2

# Install MariaDB (if not already installed)
sudo apt install mariadb-server mariadb-client -y
sudo systemctl start mariadb
sudo systemctl enable mariadb
```

### 1.2 Configure MariaDB

```bash
# Secure MariaDB installation
sudo mysql_secure_installation

# Create database and user
sudo mysql -u root -p
```

**In MariaDB console:**
```sql
-- Create database
CREATE DATABASE tasks_tracker;

-- Create user (replace 'your_password' with a strong password)
CREATE USER 'tasks_user'@'localhost' IDENTIFIED BY 'your_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON tasks_tracker.* TO 'tasks_user'@'localhost';
FLUSH PRIVILEGES;

-- Exit
EXIT;
```

### 1.3 Import Your SQL Data

```bash
# Import your exported SQL file
mysql -u tasks_user -p tasks_tracker < /path/to/your/exported-data.sql
```

## Step 2: Application Deployment

### 2.1 Clone and Setup Application

```bash
# Create application directory
sudo mkdir -p /var/www/tasks-tracker
sudo chown $USER:$USER /var/www/tasks-tracker

# Navigate to directory
cd /var/www/tasks-tracker

# Clone your repository (replace with your actual repo URL)
git clone <your-repository-url> .

# Install dependencies
npm install
```

### 2.2 Environment Configuration

```bash
# Create production environment file
nano server/.env
```

**Add this content to `server/.env`:**
```env
# Database Configuration
DATABASE_URL="mysql://tasks_user:your_password@localhost:3306/tasks_tracker"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-here"

# LDAP Configuration (update with your LDAP server details)
LDAP_URL="ldap://your-ldap-server:389"
LDAP_BIND_DN="cn=admin,dc=yourdomain,dc=com"
LDAP_BIND_PASSWORD="your-ldap-password"
LDAP_BASE_DN="dc=yourdomain,dc=com"
LDAP_USER_SEARCH_BASE="ou=users,dc=yourdomain,dc=com"

# Email Configuration (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="your-email@gmail.com"

# Server Configuration
PORT="3000"
NODE_ENV="production"
FRONTEND_URL="http://10.176.18.41:5173"
BACKEND_URL="http://10.176.18.41:3000"

# File Upload Configuration
UPLOAD_DIR="/var/www/tasks-tracker/uploads"
MAX_FILE_SIZE="10485760"
```

### 2.3 Database Setup

```bash
# Navigate to server directory
cd server

# Generate Prisma client
npx prisma generate

# Verify database connection
npx prisma db pull
```

## Step 3: Build and Configure Frontend

### 3.1 Build Frontend

```bash
# Go back to root directory
cd ..

# Build the frontend
npm run build
```

### 3.2 Configure Vite for Production

```bash
# Update vite.config.ts for production
nano vite.config.ts
```

**Update `vite.config.ts`:**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
  }
})
```

## Step 4: Process Management with PM2

### 4.1 Create PM2 Configuration

```bash
# Create PM2 ecosystem file
nano ecosystem.config.js
```

**Add this content:**
```javascript
module.exports = {
  apps: [
    {
      name: 'tasks-tracker-backend',
      script: 'server/src/index.ts',
      interpreter: 'npx',
      interpreter_args: 'tsx',
      cwd: '/var/www/tasks-tracker',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: '/var/log/pm2/tasks-tracker-backend-error.log',
      out_file: '/var/log/pm2/tasks-tracker-backend-out.log',
      log_file: '/var/log/pm2/tasks-tracker-backend.log'
    },
    {
      name: 'tasks-tracker-frontend',
      script: 'npm',
      args: 'run preview',
      cwd: '/var/www/tasks-tracker',
      env: {
        NODE_ENV: 'production',
        PORT: 5173
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      error_file: '/var/log/pm2/tasks-tracker-frontend-error.log',
      out_file: '/var/log/pm2/tasks-tracker-frontend-out.log',
      log_file: '/var/log/pm2/tasks-tracker-frontend.log'
    }
  ]
}
```

### 4.2 Start Applications with PM2

```bash
# Create log directory
sudo mkdir -p /var/log/pm2
sudo chown $USER:$USER /var/log/pm2

# Start applications
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions provided by the command above
```

## Step 5: Nginx Configuration (Optional but Recommended)

### 5.1 Install Nginx

```bash
sudo apt install nginx -y
```

### 5.2 Configure Nginx

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/tasks-tracker
```

**Add this content:**
```nginx
server {
    listen 80;
    server_name 10.176.18.41;

    # Frontend
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # SSE endpoint
    location /api/notifications/stream {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Connection '';
        proxy_set_header Cache-Control 'no-cache';
        proxy_buffering off;
        proxy_read_timeout 24h;
    }
}
```

### 5.3 Enable Site and Restart Nginx

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/tasks-tracker /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## Step 6: Firewall Configuration

```bash
# Configure UFW firewall
sudo ufw allow 22    # SSH
sudo ufw allow 80   # HTTP
sudo ufw allow 443  # HTTPS (if using SSL)
sudo ufw allow 3000 # Backend (if accessing directly)
sudo ufw allow 5173 # Frontend (if accessing directly)
sudo ufw enable
```

## Step 7: SSL Certificate (Optional but Recommended)

### 7.1 Install Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 7.2 Get SSL Certificate

```bash
# Replace with your actual domain name
sudo certbot --nginx -d yourdomain.com
```

## Step 8: Monitoring and Maintenance

### 8.1 Check Application Status

```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs tasks-tracker-backend
pm2 logs tasks-tracker-frontend

# Check system resources
pm2 monit
```

### 8.2 Database Backup Script

```bash
# Create backup script
nano /var/www/tasks-tracker/backup-db.sh
```

**Add this content:**
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/tasks-tracker"
mkdir -p $BACKUP_DIR

mysqldump -u tasks_user -p tasks_tracker > $BACKUP_DIR/tasks_tracker_$DATE.sql
gzip $BACKUP_DIR/tasks_tracker_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "tasks_tracker_*.sql.gz" -mtime +7 -delete

echo "Database backup completed: tasks_tracker_$DATE.sql.gz"
```

```bash
# Make script executable
chmod +x /var/www/tasks-tracker/backup-db.sh

# Add to crontab for daily backups
crontab -e
# Add this line:
# 0 2 * * * /var/www/tasks-tracker/backup-db.sh
```

```shellscript
nano package.json
```

```json
{
  "scripts": {
    "dev": "npx vite",
    "server:dev": "tsx server/src/index.ts",
    "build": "npx vite build",
    "preview": "npx vite preview --host 0.0.0.0 --port 5173",
    "start": "pm2 start ecosystem.config.js",
    "stop": "pm2 stop ecosystem.config.js",
    "restart": "pm2 restart ecosystem.config.js",
    "logs": "pm2 logs",
    "lint": "eslint . --ext .js,.jsx,.ts,.tsx"
  }
}
```

```shellscript
# Check if services are running
pm2 status
sudo systemctl status nginx
sudo systemctl status mariadb

# Test database connection
cd /var/www/tasks-tracker/server
npx prisma db pull
```

```shellscript
# Check PM2 logs
pm2 logs --lines 100

# Restart applications
pm2 restart all

# Check disk space
df -h

# Check memory usage
free -h

# Check running processes
ps aux | grep node

# Check Nginx status
sudo nginx -t
sudo systemctl status nginx

# Check MariaDB status
sudo systemctl status mariadb
sudo mysql -u tasks_user -p tasks_tracker
```

```plaintext

## 📋 **Key Points for Your Deployment:**

1. **SQL Import**: Since you have your exported SQL file, you'll import it directly instead of running migrations
2. **PM2 Configuration**: The ecosystem file will manage both frontend and backend processes
3. **Environment Variables**: Update all placeholder values with your actual configuration
4. **Nginx**: Optional but recommended for production-grade reverse proxy
5. **Scheduled Tasks**: All your notification schedules will work automatically on the server

Save this content as `docs/Ubuntu-Server-Deployment.md` and you'll have a complete deployment guide ready for your Ubuntu server migration! 🚀
```

---

**User**

update to also include also MariaDB installed and running and also importing my sql file to maria deb and make it detailed explainign each step

---

**Cursor**

I'll update the deployment guide to include detailed MariaDB installation and SQL import steps. Let me read the current file and then provide you with the updated version:


Now I'll provide you with the updated deployment guide that includes detailed MariaDB installation and SQL import steps:

## 📝 **Updated Ubuntu Server Deployment Guide**

Replace the content of `docs/Ubuntu-Server-Deployment.md` with this enhanced version:

```markdown
# Ubuntu Server Deployment Guide

This guide will help you deploy the Tasks Tracker system to your Ubuntu server at `10.176.18.41` using MariaDB and PM2.

## Prerequisites

- Ubuntu server at `10.176.18.41`
- Your exported SQL file with tables and initial data
- SSH access to your server
- Basic knowledge of Linux command line

## Step 1: Server Preparation

### 1.1 Update System and Install Basic Tools

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install curl wget git unzip -y
```

### 1.2 Install Node.js (LTS Version)

```bash
# Add NodeSource repository for LTS version
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -

# Install Node.js
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

**Expected Output:**
```
v20.x.x
10.x.x
```

### 1.3 Install PM2 Process Manager

```bash
# Install PM2 globally
sudo npm install -g pm2

# Verify installation
pm2 --version
```

## Step 2: MariaDB Installation and Configuration

### 2.1 Install MariaDB Server

```bash
# Install MariaDB server and client
sudo apt install mariadb-server mariadb-client -y

# Start MariaDB service
sudo systemctl start mariadb

# Enable MariaDB to start on boot
sudo systemctl enable mariadb

# Check MariaDB status
sudo systemctl status mariadb
```

**Expected Output:**
```
● mariadb.service - MariaDB 10.x.x database server
     Loaded: loaded (/lib/systemd/system/mariadb.service; enabled; vendor preset: enabled)
     Active: active (running) since [timestamp]
```

### 2.2 Secure MariaDB Installation

```bash
# Run MariaDB security script
sudo mysql_secure_installation
```

**Follow these prompts:**
```
Enter current password for root (enter for none): [Press Enter]
Set root password? [Y/n]: Y
New password: [Enter strong password]
Re-enter new password: [Confirm password]
Remove anonymous users? [Y/n]: Y
Disallow root login remotely? [Y/n]: Y
Remove test database and access to it? [Y/n]: Y
Reload privilege tables now? [Y/n]: Y
```

### 2.3 Create Database and User

```bash
# Login to MariaDB as root
sudo mysql -u root -p
```

**In MariaDB console, execute these commands:**

```sql
-- Create the database
CREATE DATABASE tasks_tracker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create a dedicated user (replace 'your_strong_password' with a secure password)
CREATE USER 'tasks_user'@'localhost' IDENTIFIED BY 'your_strong_password';

-- Grant all privileges on the database to the user
GRANT ALL PRIVILEGES ON tasks_tracker.* TO 'tasks_user'@'localhost';

-- Grant additional privileges for better compatibility
GRANT CREATE, ALTER, INDEX, LOCK TABLES, REFERENCES, UPDATE, DELETE, DROP, SELECT, INSERT ON tasks_tracker.* TO 'tasks_user'@'localhost';

-- Flush privileges to apply changes
FLUSH PRIVILEGES;

-- Verify the database was created
SHOW DATABASES;

-- Exit MariaDB
EXIT;
```

**Expected Output:**
```
+--------------------+
| Database           |
+--------------------+
| information_schema |
| mysql              |
| performance_schema |
| tasks_tracker      |
+--------------------+
```

### 2.4 Test Database Connection

```bash
# Test connection with the new user
mysql -u tasks_user -p tasks_tracker
```

**In MariaDB console:**
```sql
-- Show current database
SELECT DATABASE();

-- Show tables (should be empty initially)
SHOW TABLES;

-- Exit
EXIT;
```

**Expected Output:**
```
+----------------+
| DATABASE()     |
+----------------+
| tasks_tracker  |
+----------------+
```

## Step 3: Import Your SQL Data

### 3.1 Prepare Your SQL File

```bash
# Create a directory for your SQL file
mkdir -p ~/sql-imports

# Copy your SQL file to the server (use scp from your local machine)
# scp /path/to/your/exported-data.sql user@10.176.18.41:~/sql-imports/

# Or if you have the file locally on the server, move it
# mv /path/to/your/exported-data.sql ~/sql-imports/
```

### 3.2 Import SQL Data

```bash
# Navigate to the SQL file directory
cd ~/sql-imports

# List files to confirm your SQL file is there
ls -la

# Import the SQL file into MariaDB
mysql -u tasks_user -p tasks_tracker < your-exported-data.sql
```

**If the import is successful, you should see no error messages.**

### 3.3 Verify Data Import

```bash
# Connect to MariaDB to verify the import
mysql -u tasks_user -p tasks_tracker
```

**In MariaDB console:**
```sql
-- Show all tables
SHOW TABLES;

-- Check User table (example)
SELECT COUNT(*) as user_count FROM User;

-- Check Task table (example)
SELECT COUNT(*) as task_count FROM Task;

-- Check Department table (example)
SELECT COUNT(*) as department_count FROM Department;

-- Check Notification table (example)
SELECT COUNT(*) as notification_count FROM Notification;

-- Exit
EXIT;
```

**Expected Output (example):**
```
+------------------+
| Tables_in_tasks_tracker |
+------------------+
| Department        |
| Notification      |
| Task              |
| User              |
| _prisma_migrations |
+------------------+

+------------+
| user_count |
+------------+
|          3 |
+------------+

+-------------+
| task_count  |
+-------------+
|         25  |
+-------------+
```

## Step 4: Application Deployment

### 4.1 Create Application Directory

```bash
# Create application directory
sudo mkdir -p /var/www/tasks-tracker

# Change ownership to your user
sudo chown $USER:$USER /var/www/tasks-tracker

# Navigate to the directory
cd /var/www/tasks-tracker
```

### 4.2 Clone Application Repository

```bash
# Clone your repository (replace with your actual repository URL)
git clone https://github.com/yourusername/tasks-tracker.git .

# Or if you're using a private repository
# git clone https://username:token@github.com/yourusername/tasks-tracker.git .
```

### 4.3 Install Dependencies

```bash
# Install all dependencies
npm install

# Verify installation
npm list --depth=0
```

## Step 5: Environment Configuration

### 5.1 Create Production Environment File

```bash
# Create the environment file
nano server/.env
```

**Add this content to `server/.env` (update all placeholder values):**

```env
# Database Configuration
DATABASE_URL="mysql://tasks_user:your_strong_password@localhost:3306/tasks_tracker"

# JWT Configuration (generate a strong secret)
JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters-long"

# LDAP Configuration (update with your LDAP server details)
LDAP_URL="ldap://your-ldap-server:389"
LDAP_BIND_DN="cn=admin,dc=yourdomain,dc=com"
LDAP_BIND_PASSWORD="your-ldap-password"
LDAP_BASE_DN="dc=yourdomain,dc=com"
LDAP_USER_SEARCH_BASE="ou=users,dc=yourdomain,dc=com"

# Email Configuration (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="your-email@gmail.com"

# Server Configuration
PORT="3000"
NODE_ENV="production"
FRONTEND_URL="http://10.176.18.41:5173"
BACKEND_URL="http://10.176.18.41:3000"

# File Upload Configuration
UPLOAD_DIR="/var/www/tasks-tracker/uploads"
MAX_FILE_SIZE="10485760"
```

### 5.2 Generate Prisma Client

```bash
# Navigate to server directory
cd server

# Generate Prisma client
npx prisma generate

# Verify database connection
npx prisma db pull
```

**Expected Output:**
```
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": MySQL database "tasks_tracker", schema "public" at "localhost:3306"

✔ Introspected 5 models and wrote them into prisma/schema.prisma in 2.5s
```

## Step 6: Build Frontend

### 6.1 Build Production Frontend

```bash
# Go back to root directory
cd ..

# Build the frontend for production
npm run build
```

**Expected Output:**
```
vite v5.x.x building for production...
✓ 123 modules transformed.
dist/index.html                   0.45 kB │ gzip:  0.32 kB
dist/assets/index-abc123.js       1.23 MB │ gzip: 0.45 MB
dist/assets/index-def456.css      0.12 MB │ gzip: 0.03 MB
✓ built in 15.23s
```

### 6.2 Configure Vite for Production

```bash
# Update vite.config.ts for production
nano vite.config.ts
```

**Update `vite.config.ts`:**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
  }
})
```

## Step 7: Process Management with PM2

### 7.1 Create PM2 Configuration

```bash
# Create PM2 ecosystem file
nano ecosystem.config.js
```

**Add this content:**
```javascript
module.exports = {
  apps: [
    {
      name: 'tasks-tracker-backend',
      script: 'server/src/index.ts',
      interpreter: 'npx',
      interpreter_args: 'tsx',
      cwd: '/var/www/tasks-tracker',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: '/var/log/pm2/tasks-tracker-backend-error.log',
      out_file: '/var/log/pm2/tasks-tracker-backend-out.log',
      log_file: '/var/log/pm2/tasks-tracker-backend.log'
    },
    {
      name: 'tasks-tracker-frontend',
      script: 'npm',
      args: 'run preview',
      cwd: '/var/www/tasks-tracker',
      env: {
        NODE_ENV: 'production',
        PORT: 5173
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      error_file: '/var/log/pm2/tasks-tracker-frontend-error.log',
      out_file: '/var/log/pm2/tasks-tracker-frontend-out.log',
      log_file: '/var/log/pm2/tasks-tracker-frontend.log'
    }
  ]
}
```

### 7.2 Start Applications with PM2

```bash
# Create log directory
sudo mkdir -p /var/log/pm2
sudo chown $USER:$USER /var/log/pm2

# Start applications
pm2 start ecosystem.config.js

# Check status
pm2 status

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

**Expected Output:**
```
┌─────┬─────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id  │ name                │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├─────┼─────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 0   │ tasks-tracker-backend │ default     │ 1.0.0   │ fork    │ 12345    │ 0s     │ 0    │ online    │ 0%       │ 45.2mb   │ ubuntu   │ disabled │
│ 1   │ tasks-tracker-frontend│ default     │ 1.0.0   │ fork    │ 12346    │ 0s     │ 0    │ online    │ 0%       │ 23.1mb   │ ubuntu   │ disabled │
└─────┴─────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
```

## Step 8: Nginx Configuration (Optional but Recommended)

### 8.1 Install Nginx

```bash
sudo apt install nginx -y
```

### 8.2 Configure Nginx

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/tasks-tracker
```

**Add this content:**
```nginx
server {
    listen 80;
    server_name 10.176.18.41;

    # Frontend
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # SSE endpoint
    location /api/notifications/stream {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Connection '';
        proxy_set_header Cache-Control 'no-cache';
        proxy_buffering off;
        proxy_read_timeout 24h;
    }
}
```

### 8.3 Enable Site and Restart Nginx

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/tasks-tracker /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## Step 9: Firewall Configuration

```bash
# Configure UFW firewall
sudo ufw allow 22    # SSH
sudo ufw allow 80   # HTTP
sudo ufw allow 443  # HTTPS (if using SSL)
sudo ufw allow 3000 # Backend (if accessing directly)
sudo ufw allow 5173 # Frontend (if accessing directly)

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

## Step 10: Final Verification

### 10.1 Test Application Services

```bash
# Check PM2 status
pm2 status

# Check Nginx status
sudo systemctl status nginx

# Check MariaDB status
sudo systemctl status mariadb

# Check system resources
pm2 monit
```

### 10.2 Test Database Connection

```bash
# Test database connection
cd /var/www/tasks-tracker/server
npx prisma db pull
```

### 10.3 Access Application

- **Frontend**: `http://10.176.18.41`
- **Backend API**: `http://10.176.18.41/api`
- **Direct Frontend**: `http://10.176.18.41:5173`
- **Direct Backend**: `http://10.176.18.41:3000`

## Troubleshooting Commands

```bash
# Check PM2 logs
pm2 logs --lines 100

# Restart applications
pm2 restart all

# Check disk space
df -h

# Check memory usage
free -h

# Check running processes
ps aux | grep node

# Check Nginx status
sudo nginx -t
sudo systemctl status nginx

# Check MariaDB status
sudo systemctl status mariadb

# Test MariaDB connection
mysql -u tasks_user -p tasks_tracker -e "SHOW TABLES;"
```

## Deployment Checklist

- [ ] Ubuntu server prepared with required software
- [ ] MariaDB installed, configured, and secured
- [ ] Database and user created successfully
- [ ] SQL data imported and verified
- [ ] Application cloned and dependencies installed
- [ ] Environment variables configured
- [ ] Database connection verified
- [ ] Frontend built for production
- [ ] PM2 configuration created and applications started
- [ ] Nginx configured (optional)
- [ ] Firewall configured
- [ ] Application tested and accessible

## Important Notes

1. **Database Migration**: Since you're importing existing data, you don't need to run `npx prisma db push`. Just use `npx prisma db pull` to verify the connection.

2. **Environment Variables**: Make sure to update all the placeholder values in the `.env` file with your actual configuration.

3. **LDAP Configuration**: Update the LDAP settings to match your organization's LDAP server.

4. **Email Configuration**: Configure SMTP settings for email notifications to work properly.

5. **File Permissions**: Ensure proper file permissions for the application directory and logs.

6. **Security**: Change default passwords and use strong JWT secrets.

## Scheduled Tasks

The system includes several scheduled tasks that will run automatically:

- **Daily Progress Reports**: Monday-Friday at 8:00 PM
- **Manager Daily Summaries**: Monday-Friday at 8:00 PM  
- **Weekly Reports**: Wednesday at 9:00 AM
- **Overdue Task Alerts**: Thursday at 4:30 PM
- **Deadline Reminders**: Daily at 9:00 AM
- **Friday Morning Report**: Friday at 9:00 AM (Weekly Status)
- **Friday Afternoon Report**: Friday at 5:20 PM (Weekly Wrap-up + Department Progress)

All scheduled tasks run in Nairobi timezone and include Word document attachments.

---

**Your Tasks Tracker system should now be fully deployed on your Ubuntu server!** 🎉
```

## 🔧 **Key Enhancements Made:**

1. **Detailed MariaDB Installation**: Step-by-step installation with security configuration
2. **Comprehensive SQL Import Process**: Detailed instructions for importing your exported data
3. **Database Verification Steps**: Commands to verify successful import and data integrity
4. **Enhanced Error Handling**: Expected outputs and troubleshooting for each step
5. **Security Best Practices**: Proper user creation, password management, and firewall configuration
6. **Production-Ready Configuration**: Optimized settings for production deployment

This updated guide now provides comprehensive, detailed instructions for deploying your Tasks Tracker system to Ubuntu with MariaDB! 🚀

```markdown
# Ubuntu Server Deployment Guide

This guide will help you deploy the Tasks Tracker system to your Ubuntu server at `10.176.18.41` using MariaDB and PM2.

## Prerequisites

- Ubuntu server at `10.176.18.41`
- Your exported SQL file with tables and initial data
- SSH access to your server
- Basic knowledge of Linux command line

## Step 1: Server Preparation

### 1.1 Update System and Install Basic Tools

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install curl wget git unzip -y
```

### 1.2 Install Node.js (LTS Version)

```bash
# Add NodeSource repository for LTS version
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -

# Install Node.js
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

**Expected Output:**
```

```plaintext

### 1.3 Install PM2 Process Manager

```bash
# Install PM2 globally
sudo npm install -g pm2

# Verify installation
pm2 --version
```

## Step 2: MariaDB Installation and Configuration

### 2.1 Install MariaDB Server

```bash
# Install MariaDB server and client
sudo apt install mariadb-server mariadb-client -y

# Start MariaDB service
sudo systemctl start mariadb

# Enable MariaDB to start on boot
sudo systemctl enable mariadb

# Check MariaDB status
sudo systemctl status mariadb
```

**Expected Output:**
```

```plaintext

### 2.2 Secure MariaDB Installation

```bash
# Run MariaDB security script
sudo mysql_secure_installation
```

**Follow these prompts:**
```

```plaintext

### 2.3 Create Database and User

```bash
# Login to MariaDB as root
sudo mysql -u root -p
```

**In MariaDB console, execute these commands:**

```sql
-- Create the database
CREATE DATABASE tasks_tracker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create a dedicated user (replace 'your_strong_password' with a secure password)
CREATE USER 'tasks_user'@'localhost' IDENTIFIED BY 'your_strong_password';

-- Grant all privileges on the database to the user
GRANT ALL PRIVILEGES ON tasks_tracker.* TO 'tasks_user'@'localhost';

-- Grant additional privileges for better compatibility
GRANT CREATE, ALTER, INDEX, LOCK TABLES, REFERENCES, UPDATE, DELETE, DROP, SELECT, INSERT ON tasks_tracker.* TO 'tasks_user'@'localhost';

-- Flush privileges to apply changes
FLUSH PRIVILEGES;

-- Verify the database was created
SHOW DATABASES;

-- Exit MariaDB
EXIT;
```

**Expected Output:**
```

```plaintext

### 2.4 Test Database Connection

```bash
# Test connection with the new user
mysql -u tasks_user -p tasks_tracker
```

**In MariaDB console:**
```sql
-- Show current database
SELECT DATABASE();

-- Show tables (should be empty initially)
SHOW TABLES;

-- Exit
EXIT;
```

**Expected Output:**
```

```plaintext

## Step 3: Import Your SQL Data

### 3.1 Prepare Your SQL File

```bash
# Create a directory for your SQL file
mkdir -p ~/sql-imports

# Copy your SQL file to the server (use scp from your local machine)
# scp /path/to/your/exported-data.sql user@10.176.18.41:~/sql-imports/

# Or if you have the file locally on the server, move it
# mv /path/to/your/exported-data.sql ~/sql-imports/
```

### 3.2 Import SQL Data

```bash
# Navigate to the SQL file directory
cd ~/sql-imports

# List files to confirm your SQL file is there
ls -la

# Import the SQL file into MariaDB
mysql -u tasks_user -p tasks_tracker < your-exported-data.sql
```

**If the import is successful, you should see no error messages.**

### 3.3 Verify Data Import

```bash
# Connect to MariaDB to verify the import
mysql -u tasks_user -p tasks_tracker
```

**In MariaDB console:**
```sql
-- Show all tables
SHOW TABLES;

-- Check User table (example)
SELECT COUNT(*) as user_count FROM User;

-- Check Task table (example)
SELECT COUNT(*) as task_count FROM Task;

-- Check Department table (example)
SELECT COUNT(*) as department_count FROM Department;

-- Check Notification table (example)
SELECT COUNT(*) as notification_count FROM Notification;

-- Exit
EXIT;
```

**Expected Output (example):**
```

```plaintext

## Step 4: Application Deployment

### 4.1 Create Application Directory

```bash
# Create application directory
sudo mkdir -p /var/www/tasks-tracker

# Change ownership to your user
sudo chown $USER:$USER /var/www/tasks-tracker

# Navigate to the directory
cd /var/www/tasks-tracker
```

### 4.2 Clone Application Repository

```bash
# Clone your repository (replace with your actual repository URL)
git clone https://github.com/yourusername/tasks-tracker.git .

# Or if you're using a private repository
# git clone https://username:token@github.com/yourusername/tasks-tracker.git .
```

### 4.3 Install Dependencies

```bash
# Install all dependencies
npm install

# Verify installation
npm list --depth=0
```

## Step 5: Environment Configuration

### 5.1 Create Production Environment File

```bash
# Create the environment file
nano server/.env
```

**Add this content to `server/.env` (update all placeholder values):**

```env
# Database Configuration
DATABASE_URL="mysql://tasks_user:your_strong_password@localhost:3306/tasks_tracker"

# JWT Configuration (generate a strong secret)
JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters-long"

# LDAP Configuration (update with your LDAP server details)
LDAP_URL="ldap://your-ldap-server:389"
LDAP_BIND_DN="cn=admin,dc=yourdomain,dc=com"
LDAP_BIND_PASSWORD="your-ldap-password"
LDAP_BASE_DN="dc=yourdomain,dc=com"
LDAP_USER_SEARCH_BASE="ou=users,dc=yourdomain,dc=com"

# Email Configuration (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="your-email@gmail.com"

# Server Configuration
PORT="3000"
NODE_ENV="production"
FRONTEND_URL="http://10.176.18.41:5173"
BACKEND_URL="http://10.176.18.41:3000"

# File Upload Configuration
UPLOAD_DIR="/var/www/tasks-tracker/uploads"
MAX_FILE_SIZE="10485760"
```

### 5.2 Generate Prisma Client

```bash
# Navigate to server directory
cd server

# Generate Prisma client
npx prisma generate

# Verify database connection
npx prisma db pull
```

**Expected Output:**
```

```plaintext

## Step 6: Build Frontend

### 6.1 Build Production Frontend

```bash
# Go back to root directory
cd ..

# Build the frontend for production
npm run build
```

**Expected Output:**
```

```plaintext

### 6.2 Configure Vite for Production

```bash
# Update vite.config.ts for production
nano vite.config.ts
```

**Update `vite.config.ts`:**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
  }
})
```

## Step 7: Process Management with PM2

### 7.1 Create PM2 Configuration

```bash
# Create PM2 ecosystem file
nano ecosystem.config.js
```

**Add this content:**
```javascript
module.exports = {
  apps: [
    {
      name: 'tasks-tracker-backend',
      script: 'server/src/index.ts',
      interpreter: 'npx',
      interpreter_args: 'tsx',
      cwd: '/var/www/tasks-tracker',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: '/var/log/pm2/tasks-tracker-backend-error.log',
      out_file: '/var/log/pm2/tasks-tracker-backend-out.log',
      log_file: '/var/log/pm2/tasks-tracker-backend.log'
    },
    {
      name: 'tasks-tracker-frontend',
      script: 'npm',
      args: 'run preview',
      cwd: '/var/www/tasks-tracker',
      env: {
        NODE_ENV: 'production',
        PORT: 5173
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      error_file: '/var/log/pm2/tasks-tracker-frontend-error.log',
      out_file: '/var/log/pm2/tasks-tracker-frontend-out.log',
      log_file: '/var/log/pm2/tasks-tracker-frontend.log'
    }
  ]
}
```

### 7.2 Start Applications with PM2

```bash
# Create log directory
sudo mkdir -p /var/log/pm2
sudo chown $USER:$USER /var/log/pm2

# Start applications
pm2 start ecosystem.config.js

# Check status
pm2 status

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

**Expected Output:**
```

```plaintext

## Step 8: Nginx Configuration (Optional but Recommended)

### 8.1 Install Nginx

```bash
sudo apt install nginx -y
```

### 8.2 Configure Nginx

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/tasks-tracker
```

**Add this content:**
```nginx
server {
    listen 80;
    server_name 10.176.18.41;

    # Frontend
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # SSE endpoint
    location /api/notifications/stream {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Connection '';
        proxy_set_header Cache-Control 'no-cache';
        proxy_buffering off;
        proxy_read_timeout 24h;
    }
}
```

### 8.3 Enable Site and Restart Nginx

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/tasks-tracker /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## Step 9: Firewall Configuration

```bash
# Configure UFW firewall
sudo ufw allow 22    # SSH
sudo ufw allow 80   # HTTP
sudo ufw allow 443  # HTTPS (if using SSL)
sudo ufw allow 3000 # Backend (if accessing directly)
sudo ufw allow 5173 # Frontend (if accessing directly)

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

## Step 10: Final Verification

### 10.1 Test Application Services

```bash
# Check PM2 status
pm2 status

# Check Nginx status
sudo systemctl status nginx

# Check MariaDB status
sudo systemctl status mariadb

# Check system resources
pm2 monit
```

### 10.2 Test Database Connection

```bash
# Test database connection
cd /var/www/tasks-tracker/server
npx prisma db pull
```

### 10.3 Access Application

- **Frontend**: `http://10.176.18.41`
- **Backend API**: `http://10.176.18.41/api`
- **Direct Frontend**: `http://10.176.18.41:5173`
- **Direct Backend**: `http://10.176.18.41:3000`

## Troubleshooting Commands

```bash
# Check PM2 logs
pm2 logs --lines 100

# Restart applications
pm2 restart all

# Check disk space
df -h

# Check memory usage
free -h

# Check running processes
ps aux | grep node

# Check Nginx status
sudo nginx -t
sudo systemctl status nginx

# Check MariaDB status
sudo systemctl status mariadb

# Test MariaDB connection
mysql -u tasks_user -p tasks_tracker -e "SHOW TABLES;"
```

## Deployment Checklist

- [ ] Ubuntu server prepared with required software
- [ ] MariaDB installed, configured, and secured
- [ ] Database and user created successfully
- [ ] SQL data imported and verified
- [ ] Application cloned and dependencies installed
- [ ] Environment variables configured
- [ ] Database connection verified
- [ ] Frontend built for production
- [ ] PM2 configuration created and applications started
- [ ] Nginx configured (optional)
- [ ] Firewall configured
- [ ] Application tested and accessible

## Important Notes

1. **Database Migration**: Since you're importing existing data, you don't need to run `npx prisma db push`. Just use `npx prisma db pull` to verify the connection.

2. **Environment Variables**: Make sure to update all the placeholder values in the `.env` file with your actual configuration.

3. **LDAP Configuration**: Update the LDAP settings to match your organization's LDAP server.

4. **Email Configuration**: Configure SMTP settings for email notifications to work properly.

5. **File Permissions**: Ensure proper file permissions for the application directory and logs.

6. **Security**: Change default passwords and use strong JWT secrets.

## Scheduled Tasks

The system includes several scheduled tasks that will run automatically:

- **Daily Progress Reports**: Monday-Friday at 8:00 PM
- **Manager Daily Summaries**: Monday-Friday at 8:00 PM  
- **Weekly Reports**: Wednesday at 9:00 AM
- **Overdue Task Alerts**: Thursday at 4:30 PM
- **Deadline Reminders**: Daily at 9:00 AM
- **Friday Morning Report**: Friday at 9:00 AM (Weekly Status)
- **Friday Afternoon Report**: Friday at 5:20 PM (Weekly Wrap-up + Department Progress)

All scheduled tasks run in Nairobi timezone and include Word document attachments.

---

**Your Tasks Tracker system should now be fully deployed on your Ubuntu server!** 🎉
```

---

**User**

can ypu create the file for me

---

**Cursor**

I can't directly create files, but I can help you create the comprehensive deployment guide. Let me provide you with the complete content that you can copy and paste into your `docs/Ubuntu-Server-Deployment.md` file.

Here's the complete updated deployment guide:

```markdown
# Ubuntu Server Deployment Guide

This guide will help you deploy the Tasks Tracker system to your Ubuntu server at `10.176.18.41` using MariaDB and PM2.

## Prerequisites

- Ubuntu server at `10.176.18.41`
- Your exported SQL file with tables and initial data
- SSH access to your server
- Basic knowledge of Linux command line

## Step 1: Server Preparation

### 1.1 Update System and Install Basic Tools

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install curl wget git unzip -y
```

### 1.2 Install Node.js (LTS Version)

```bash
# Add NodeSource repository for LTS version
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -

# Install Node.js
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

**Expected Output:**
```
v20.x.x
10.x.x
```

### 1.3 Install PM2 Process Manager

```bash
# Install PM2 globally
sudo npm install -g pm2

# Verify installation
pm2 --version
```

## Step 2: MariaDB Installation and Configuration

### 2.1 Install MariaDB Server

```bash
# Install MariaDB server and client
sudo apt install mariadb-server mariadb-client -y

# Start MariaDB service
sudo systemctl start mariadb

# Enable MariaDB to start on boot
sudo systemctl enable mariadb

# Check MariaDB status
sudo systemctl status mariadb
```

**Expected Output:**
```
● mariadb.service - MariaDB 10.x.x database server
     Loaded: loaded (/lib/systemd/system/mariadb.service; enabled; vendor preset: enabled)
     Active: active (running) since [timestamp]
```

### 2.2 Secure MariaDB Installation

```bash
# Run MariaDB security script
sudo mysql_secure_installation
```

**Follow these prompts:**
```
Enter current password for root (enter for none): [Press Enter]
Set root password? [Y/n]: Y
New password: [Enter strong password]
Re-enter new password: [Confirm password]
Remove anonymous users? [Y/n]: Y
Disallow root login remotely? [Y/n]: Y
Remove test database and access to it? [Y/n]: Y
Reload privilege tables now? [Y/n]: Y
```

### 2.3 Create Database and User

```bash
# Login to MariaDB as root
sudo mysql -u root -p
```

**In MariaDB console, execute these commands:**

```sql
-- Create the database
CREATE DATABASE tasks_tracker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create a dedicated user (replace 'your_strong_password' with a secure password)
CREATE USER 'tasks_user'@'localhost' IDENTIFIED BY 'your_strong_password';

-- Grant all privileges on the database to the user
GRANT ALL PRIVILEGES ON tasks_tracker.* TO 'tasks_user'@'localhost';

-- Grant additional privileges for better compatibility
GRANT CREATE, ALTER, INDEX, LOCK TABLES, REFERENCES, UPDATE, DELETE, DROP, SELECT, INSERT ON tasks_tracker.* TO 'tasks_user'@'localhost';

-- Flush privileges to apply changes
FLUSH PRIVILEGES;

-- Verify the database was created
SHOW DATABASES;

-- Exit MariaDB
EXIT;
```

**Expected Output:**
```
+--------------------+
| Database           |
+--------------------+
| information_schema |
| mysql              |
| performance_schema |
| tasks_tracker      |
+--------------------+
```

### 2.4 Test Database Connection

```bash
# Test connection with the new user
mysql -u tasks_user -p tasks_tracker
```

**In MariaDB console:**
```sql
-- Show current database
SELECT DATABASE();

-- Show tables (should be empty initially)
SHOW TABLES;

-- Exit
EXIT;
```

**Expected Output:**
```
+----------------+
| DATABASE()     |
+----------------+
| tasks_tracker  |
+----------------+
```

## Step 3: Import Your SQL Data

### 3.1 Prepare Your SQL File

```bash
# Create a directory for your SQL file
mkdir -p ~/sql-imports

# Copy your SQL file to the server (use scp from your local machine)
# scp /path/to/your/exported-data.sql user@10.176.18.41:~/sql-imports/

# Or if you have the file locally on the server, move it
# mv /path/to/your/exported-data.sql ~/sql-imports/
```

### 3.2 Import SQL Data

```bash
# Navigate to the SQL file directory
cd ~/sql-imports

# List files to confirm your SQL file is there
ls -la

# Import the SQL file into MariaDB
mysql -u tasks_user -p tasks_tracker < your-exported-data.sql
```

**If the import is successful, you should see no error messages.**

### 3.3 Verify Data Import

```bash
# Connect to MariaDB to verify the import
mysql -u tasks_user -p tasks_tracker
```

**In MariaDB console:**
```sql
-- Show all tables
SHOW TABLES;

-- Check User table (example)
SELECT COUNT(*) as user_count FROM User;

-- Check Task table (example)
SELECT COUNT(*) as task_count FROM Task;

-- Check Department table (example)
SELECT COUNT(*) as department_count FROM Department;

-- Check Notification table (example)
SELECT COUNT(*) as notification_count FROM Notification;

-- Exit
EXIT;
```

**Expected Output (example):**
```
+------------------+
| Tables_in_tasks_tracker |
+------------------+
| Department        |
| Notification      |
| Task              |
| User              |
| _prisma_migrations |
+------------------+

+------------+
| user_count |
+------------+
|          3 |
+------------+

+-------------+
| task_count  |
+-------------+
|         25  |
+-------------+
```

## Step 4: Application Deployment

### 4.1 Create Application Directory

```bash
# Create application directory
sudo mkdir -p /var/www/tasks-tracker

# Change ownership to your user
sudo chown $USER:$USER /var/www/tasks-tracker

# Navigate to the directory
cd /var/www/tasks-tracker
```

### 4.2 Clone Application Repository

```bash
# Clone your repository (replace with your actual repository URL)
git clone https://github.com/yourusername/tasks-tracker.git .

# Or if you're using a private repository
# git clone https://username:token@github.com/yourusername/tasks-tracker.git .
```

### 4.3 Install Dependencies

```bash
# Install all dependencies
npm install

# Verify installation
npm list --depth=0
```

## Step 5: Environment Configuration

### 5.1 Create Production Environment File

```bash
# Create the environment file
nano server/.env
```

**Add this content to `server/.env` (update all placeholder values):**

```env
# Database Configuration
DATABASE_URL="mysql://tasks_user:your_strong_password@localhost:3306/tasks_tracker"

# JWT Configuration (generate a strong secret)
JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters-long"

# LDAP Configuration (update with your LDAP server details)
LDAP_URL="ldap://your-ldap-server:389"
LDAP_BIND_DN="cn=admin,dc=yourdomain,dc=com"
LDAP_BIND_PASSWORD="your-ldap-password"
LDAP_BASE_DN="dc=yourdomain,dc=com"
LDAP_USER_SEARCH_BASE="ou=users,dc=yourdomain,dc=com"

# Email Configuration (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="your-email@gmail.com"

# Server Configuration
PORT="3000"
NODE_ENV="production"
FRONTEND_URL="http://10.176.18.41:5173"
BACKEND_URL="http://10.176.18.41:3000"

# File Upload Configuration
UPLOAD_DIR="/var/www/tasks-tracker/uploads"
MAX_FILE_SIZE="10485760"
```

### 5.2 Generate Prisma Client

```bash
# Navigate to server directory
cd server

# Generate Prisma client
npx prisma generate

# Verify database connection
npx prisma db pull
```

**Expected Output:**
```
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": MySQL database "tasks_tracker", schema "public" at "localhost:3306"

✔ Introspected 5 models and wrote them into prisma/schema.prisma in 2.5s
```

## Step 6: Build Frontend

### 6.1 Build Production Frontend

```bash
# Go back to root directory
cd ..

# Build the frontend for production
npm run build
```

**Expected Output:**
```
vite v5.x.x building for production...
✓ 123 modules transformed.
dist/index.html                   0.45 kB │ gzip:  0.32 kB
dist/assets/index-abc123.js       1.23 MB │ gzip: 0.45 MB
dist/assets/index-def456.css      0.12 MB │ gzip: 0.03 MB
✓ built in 15.23s
```

### 6.2 Configure Vite for Production

```bash
# Update vite.config.ts for production
nano vite.config.ts
```

**Update `vite.config.ts`:**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
  }
})
```

## Step 7: Process Management with PM2

### 7.1 Create PM2 Configuration

```bash
# Create PM2 ecosystem file
nano ecosystem.config.js
```

**Add this content:**
```javascript
module.exports = {
  apps: [
    {
      name: 'tasks-tracker-backend',
      script: 'server/src/index.ts',
      interpreter: 'npx',
      interpreter_args: 'tsx',
      cwd: '/var/www/tasks-tracker',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: '/var/log/pm2/tasks-tracker-backend-error.log',
      out_file: '/var/log/pm2/tasks-tracker-backend-out.log',
      log_file: '/var/log/pm2/tasks-tracker-backend.log'
    },
    {
      name: 'tasks-tracker-frontend',
      script: 'npm',
      args: 'run preview',
      cwd: '/var/www/tasks-tracker',
      env: {
        NODE_ENV: 'production',
        PORT: 5173
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      error_file: '/var/log/pm2/tasks-tracker-frontend-error.log',
      out_file: '/var/log/pm2/tasks-tracker-frontend-out.log',
      log_file: '/var/log/pm2/tasks-tracker-frontend.log'
    }
  ]
}
```

### 7.2 Start Applications with PM2

```bash
# Create log directory
sudo mkdir -p /var/log/pm2
sudo chown $USER:$USER /var/log/pm2

# Start applications
pm2 start ecosystem.config.js

# Check status
pm2 status

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

**Expected Output:**
```
┌─────┬─────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id  │ name                │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├─────┼─────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 0   │ tasks-tracker-backend │ default     │ 1.0.0   │ fork    │ 12345    │ 0s     │ 0    │ online    │ 0%       │ 45.2mb   │ ubuntu   │ disabled │
│ 1   │ tasks-tracker-frontend│ default     │ 1.0.0   │ fork    │ 12346    │ 0s     │ 0    │ online    │ 0%       │ 23.1mb   │ ubuntu   │ disabled │
└─────┴─────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
```

## Step 8: Nginx Configuration (Optional but Recommended)

### 8.1 Install Nginx

```bash
sudo apt install nginx -y
```

### 8.2 Configure Nginx

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/tasks-tracker
```

**Add this content:**
```nginx
server {
    listen 80;
    server_name 10.176.18.41;

    # Frontend
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # SSE endpoint
    location /api/notifications/stream {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Connection '';
        proxy_set_header Cache-Control 'no-cache';
        proxy_buffering off;
        proxy_read_timeout 24h;
    }
}
```

### 8.3 Enable Site and Restart Nginx

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/tasks-tracker /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## Step 9: Firewall Configuration

```bash
# Configure UFW firewall
sudo ufw allow 22    # SSH
sudo ufw allow 80   # HTTP
sudo ufw allow 443  # HTTPS (if using SSL)
sudo ufw allow 3000 # Backend (if accessing directly)
sudo ufw allow 5173 # Frontend (if accessing directly)

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

## Step 10: Final Verification

### 10.1 Test Application Services

```bash
# Check PM2 status
pm2 status

# Check Nginx status
sudo systemctl status nginx

# Check MariaDB status
sudo systemctl status mariadb

# Check system resources
pm2 monit
```

### 10.2 Test Database Connection

```bash
# Test database connection
cd /var/www/tasks-tracker/server
npx prisma db pull
```

### 10.3 Access Application

- **Frontend**: `http://10.176.18.41`
- **Backend API**: `http://10.176.18.41/api`
- **Direct Frontend**: `http://10.176.18.41:5173`
- **Direct Backend**: `http://10.176.18.41:3000`

## Troubleshooting Commands

```bash
# Check PM2 logs
pm2 logs --lines 100

# Restart applications
pm2 restart all

# Check disk space
df -h

# Check memory usage
free -h

# Check running processes
ps aux | grep node

# Check Nginx status
sudo nginx -t
sudo systemctl status nginx

# Check MariaDB status
sudo systemctl status mariadb

# Test MariaDB connection
mysql -u tasks_user -p tasks_tracker -e "SHOW TABLES;"
```

## Deployment Checklist

- [ ] Ubuntu server prepared with required software
- [ ] MariaDB installed, configured, and secured
- [ ] Database and user created successfully
- [ ] SQL data imported and verified
- [ ] Application cloned and dependencies installed
- [ ] Environment variables configured
- [ ] Database connection verified
- [ ] Frontend built for production
- [ ] PM2 configuration created and applications started
- [ ] Nginx configured (optional)
- [ ] Firewall configured
- [ ] Application tested and accessible

## Important Notes

1. **Database Migration**: Since you're importing existing data, you don't need to run `npx prisma db push`. Just use `npx prisma db pull` to verify the connection.

2. **Environment Variables**: Make sure to update all the placeholder values in the `.env` file with your actual configuration.

3. **LDAP Configuration**: Update the LDAP settings to match your organization's LDAP server.

4. **Email Configuration**: Configure SMTP settings for email notifications to work properly.

5. **File Permissions**: Ensure proper file permissions for the application directory and logs.

6. **Security**: Change default passwords and use strong JWT secrets.

## Scheduled Tasks

The system includes several scheduled tasks that will run automatically:

- **Daily Progress Reports**: Monday-Friday at 8:00 PM
- **Manager Daily Summaries**: Monday-Friday at 8:00 PM  
- **Weekly Reports**: Wednesday at 9:00 AM
- **Overdue Task Alerts**: Thursday at 4:30 PM
- **Deadline Reminders**: Daily at 9:00 AM
- **Friday Morning Report**: Friday at 9:00 AM (Weekly Status)
- **Friday Afternoon Report**: Friday at 5:20 PM (Weekly Wrap-up + Department Progress)

All scheduled tasks run in Nairobi timezone and include Word document attachments.

---

**Your Tasks Tracker system should now be fully deployed on your Ubuntu server!** 🎉
```

## 📋 **Instructions:**

1. **Copy the entire content above** (from `# Ubuntu Server Deployment Guide` to the end)
2. **Open your `docs/Ubuntu-Server-Deployment.md` file** in your editor
3. **Replace all existing content** with the copied content
4. **Save the file**

This comprehensive guide now includes:
- ✅ **Detailed MariaDB installation and configuration**
- ✅ **Step-by-step SQL import process**
- ✅ **Database verification commands**
- ✅ **Expected outputs for each step**
- ✅ **Troubleshooting commands**
- ✅ **Complete deployment checklist**

The guide is now ready for your Ubuntu server deployment! 🚀

```markdown
# Ubuntu Server Deployment Guide

This guide will help you deploy the Tasks Tracker system to your Ubuntu server at `10.176.18.41` using MariaDB and PM2.

## Prerequisites

- Ubuntu server at `10.176.18.41`
- Your exported SQL file with tables and initial data
- SSH access to your server
- Basic knowledge of Linux command line

## Step 1: Server Preparation

### 1.1 Update System and Install Basic Tools

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install curl wget git unzip -y
```

### 1.2 Install Node.js (LTS Version)

```bash
# Add NodeSource repository for LTS version
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -

# Install Node.js
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

**Expected Output:**
```

```plaintext

### 1.3 Install PM2 Process Manager

```bash
# Install PM2 globally
sudo npm install -g pm2

# Verify installation
pm2 --version
```

## Step 2: MariaDB Installation and Configuration

### 2.1 Install MariaDB Server

```bash
# Install MariaDB server and client
sudo apt install mariadb-server mariadb-client -y

# Start MariaDB service
sudo systemctl start mariadb

# Enable MariaDB to start on boot
sudo systemctl enable mariadb

# Check MariaDB status
sudo systemctl status mariadb
```

**Expected Output:**
```

```plaintext

### 2.2 Secure MariaDB Installation

```bash
# Run MariaDB security script
sudo mysql_secure_installation
```

**Follow these prompts:**
```

```plaintext

### 2.3 Create Database and User

```bash
# Login to MariaDB as root
sudo mysql -u root -p
```

**In MariaDB console, execute these commands:**

```sql
-- Create the database
CREATE DATABASE tasks_tracker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create a dedicated user (replace 'your_strong_password' with a secure password)
CREATE USER 'tasks_user'@'localhost' IDENTIFIED BY 'your_strong_password';

-- Grant all privileges on the database to the user
GRANT ALL PRIVILEGES ON tasks_tracker.* TO 'tasks_user'@'localhost';

-- Grant additional privileges for better compatibility
GRANT CREATE, ALTER, INDEX, LOCK TABLES, REFERENCES, UPDATE, DELETE, DROP, SELECT, INSERT ON tasks_tracker.* TO 'tasks_user'@'localhost';

-- Flush privileges to apply changes
FLUSH PRIVILEGES;

-- Verify the database was created
SHOW DATABASES;

-- Exit MariaDB
EXIT;
```

**Expected Output:**
```

```plaintext

### 2.4 Test Database Connection

```bash
# Test connection with the new user
mysql -u tasks_user -p tasks_tracker
```

**In MariaDB console:**
```sql
-- Show current database
SELECT DATABASE();

-- Show tables (should be empty initially)
SHOW TABLES;

-- Exit
EXIT;
```

**Expected Output:**
```

```plaintext

## Step 3: Import Your SQL Data

### 3.1 Prepare Your SQL File

```bash
# Create a directory for your SQL file
mkdir -p ~/sql-imports

# Copy your SQL file to the server (use scp from your local machine)
# scp /path/to/your/exported-data.sql user@10.176.18.41:~/sql-imports/

# Or if you have the file locally on the server, move it
# mv /path/to/your/exported-data.sql ~/sql-imports/
```

### 3.2 Import SQL Data

```bash
# Navigate to the SQL file directory
cd ~/sql-imports

# List files to confirm your SQL file is there
ls -la

# Import the SQL file into MariaDB
mysql -u tasks_user -p tasks_tracker < your-exported-data.sql
```

**If the import is successful, you should see no error messages.**

### 3.3 Verify Data Import

```bash
# Connect to MariaDB to verify the import
mysql -u tasks_user -p tasks_tracker
```

**In MariaDB console:**
```sql
-- Show all tables
SHOW TABLES;

-- Check User table (example)
SELECT COUNT(*) as user_count FROM User;

-- Check Task table (example)
SELECT COUNT(*) as task_count FROM Task;

-- Check Department table (example)
SELECT COUNT(*) as department_count FROM Department;

-- Check Notification table (example)
SELECT COUNT(*) as notification_count FROM Notification;

-- Exit
EXIT;
```

**Expected Output (example):**
```

```plaintext

## Step 4: Application Deployment

### 4.1 Create Application Directory

```bash
# Create application directory
sudo mkdir -p /var/www/tasks-tracker

# Change ownership to your user
sudo chown $USER:$USER /var/www/tasks-tracker

# Navigate to the directory
cd /var/www/tasks-tracker
```

### 4.2 Clone Application Repository

```bash
# Clone your repository (replace with your actual repository URL)
git clone https://github.com/yourusername/tasks-tracker.git .

# Or if you're using a private repository
# git clone https://username:token@github.com/yourusername/tasks-tracker.git .
```

### 4.3 Install Dependencies

```bash
# Install all dependencies
npm install

# Verify installation
npm list --depth=0
```

## Step 5: Environment Configuration

### 5.1 Create Production Environment File

```bash
# Create the environment file
nano server/.env
```

**Add this content to `server/.env` (update all placeholder values):**

```env
# Database Configuration
DATABASE_URL="mysql://tasks_user:your_strong_password@localhost:3306/tasks_tracker"

# JWT Configuration (generate a strong secret)
JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters-long"

# LDAP Configuration (update with your LDAP server details)
LDAP_URL="ldap://your-ldap-server:389"
LDAP_BIND_DN="cn=admin,dc=yourdomain,dc=com"
LDAP_BIND_PASSWORD="your-ldap-password"
LDAP_BASE_DN="dc=yourdomain,dc=com"
LDAP_USER_SEARCH_BASE="ou=users,dc=yourdomain,dc=com"

# Email Configuration (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="your-email@gmail.com"

# Server Configuration
PORT="3000"
NODE_ENV="production"
FRONTEND_URL="http://10.176.18.41:5173"
BACKEND_URL="http://10.176.18.41:3000"

# File Upload Configuration
UPLOAD_DIR="/var/www/tasks-tracker/uploads"
MAX_FILE_SIZE="10485760"
```

### 5.2 Generate Prisma Client

```bash
# Navigate to server directory
cd server

# Generate Prisma client
npx prisma generate

# Verify database connection
npx prisma db pull
```

**Expected Output:**
```

```plaintext

## Step 6: Build Frontend

### 6.1 Build Production Frontend

```bash
# Go back to root directory
cd ..

# Build the frontend for production
npm run build
```

**Expected Output:**
```

```plaintext

### 6.2 Configure Vite for Production

```bash
# Update vite.config.ts for production
nano vite.config.ts
```

**Update `vite.config.ts`:**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
  }
})
```

## Step 7: Process Management with PM2

### 7.1 Create PM2 Configuration

```bash
# Create PM2 ecosystem file
nano ecosystem.config.js
```

**Add this content:**
```javascript
module.exports = {
  apps: [
    {
      name: 'tasks-tracker-backend',
      script: 'server/src/index.ts',
      interpreter: 'npx',
      interpreter_args: 'tsx',
      cwd: '/var/www/tasks-tracker',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: '/var/log/pm2/tasks-tracker-backend-error.log',
      out_file: '/var/log/pm2/tasks-tracker-backend-out.log',
      log_file: '/var/log/pm2/tasks-tracker-backend.log'
    },
    {
      name: 'tasks-tracker-frontend',
      script: 'npm',
      args: 'run preview',
      cwd: '/var/www/tasks-tracker',
      env: {
        NODE_ENV: 'production',
        PORT: 5173
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      error_file: '/var/log/pm2/tasks-tracker-frontend-error.log',
      out_file: '/var/log/pm2/tasks-tracker-frontend-out.log',
      log_file: '/var/log/pm2/tasks-tracker-frontend.log'
    }
  ]
}
```

### 7.2 Start Applications with PM2

```bash
# Create log directory
sudo mkdir -p /var/log/pm2
sudo chown $USER:$USER /var/log/pm2

# Start applications
pm2 start ecosystem.config.js

# Check status
pm2 status

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

**Expected Output:**
```

```plaintext

## Step 8: Nginx Configuration (Optional but Recommended)

### 8.1 Install Nginx

```bash
sudo apt install nginx -y
```

### 8.2 Configure Nginx

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/tasks-tracker
```

**Add this content:**
```nginx
server {
    listen 80;
    server_name 10.176.18.41;

    # Frontend
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # SSE endpoint
    location /api/notifications/stream {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Connection '';
        proxy_set_header Cache-Control 'no-cache';
        proxy_buffering off;
        proxy_read_timeout 24h;
    }
}
```

### 8.3 Enable Site and Restart Nginx

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/tasks-tracker /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## Step 9: Firewall Configuration

```bash
# Configure UFW firewall
sudo ufw allow 22    # SSH
sudo ufw allow 80   # HTTP
sudo ufw allow 443  # HTTPS (if using SSL)
sudo ufw allow 3000 # Backend (if accessing directly)
sudo ufw allow 5173 # Frontend (if accessing directly)

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

## Step 10: Final Verification

### 10.1 Test Application Services

```bash
# Check PM2 status
pm2 status

# Check Nginx status
sudo systemctl status nginx

# Check MariaDB status
sudo systemctl status mariadb

# Check system resources
pm2 monit
```

### 10.2 Test Database Connection

```bash
# Test database connection
cd /var/www/tasks-tracker/server
npx prisma db pull
```

### 10.3 Access Application

- **Frontend**: `http://10.176.18.41`
- **Backend API**: `http://10.176.18.41/api`
- **Direct Frontend**: `http://10.176.18.41:5173`
- **Direct Backend**: `http://10.176.18.41:3000`

## Troubleshooting Commands

```bash
# Check PM2 logs
pm2 logs --lines 100

# Restart applications
pm2 restart all

# Check disk space
df -h

# Check memory usage
free -h

# Check running processes
ps aux | grep node

# Check Nginx status
sudo nginx -t
sudo systemctl status nginx

# Check MariaDB status
sudo systemctl status mariadb

# Test MariaDB connection
mysql -u tasks_user -p tasks_tracker -e "SHOW TABLES;"
```

## Deployment Checklist

- [ ] Ubuntu server prepared with required software
- [ ] MariaDB installed, configured, and secured
- [ ] Database and user created successfully
- [ ] SQL data imported and verified
- [ ] Application cloned and dependencies installed
- [ ] Environment variables configured
- [ ] Database connection verified
- [ ] Frontend built for production
- [ ] PM2 configuration created and applications started
- [ ] Nginx configured (optional)
- [ ] Firewall configured
- [ ] Application tested and accessible

## Important Notes

1. **Database Migration**: Since you're importing existing data, you don't need to run `npx prisma db push`. Just use `npx prisma db pull` to verify the connection.

2. **Environment Variables**: Make sure to update all the placeholder values in the `.env` file with your actual configuration.

3. **LDAP Configuration**: Update the LDAP settings to match your organization's LDAP server.

4. **Email Configuration**: Configure SMTP settings for email notifications to work properly.

5. **File Permissions**: Ensure proper file permissions for the application directory and logs.

6. **Security**: Change default passwords and use strong JWT secrets.

## Scheduled Tasks

The system includes several scheduled tasks that will run automatically:

- **Daily Progress Reports**: Monday-Friday at 8:00 PM
- **Manager Daily Summaries**: Monday-Friday at 8:00 PM  
- **Weekly Reports**: Wednesday at 9:00 AM
- **Overdue Task Alerts**: Thursday at 4:30 PM
- **Deadline Reminders**: Daily at 9:00 AM
- **Friday Morning Report**: Friday at 9:00 AM (Weekly Status)
- **Friday Afternoon Report**: Friday at 5:20 PM (Weekly Wrap-up + Department Progress)

All scheduled tasks run in Nairobi timezone and include Word document attachments.

---

**Your Tasks Tracker system should now be fully deployed on your Ubuntu server!** 🎉
```

---

**User**

create it as one full text for me to easily copy

---

**Cursor**

Here's the complete deployment guide as one full text for easy copying:

```markdown
# Ubuntu Server Deployment Guide

This guide will help you deploy the Tasks Tracker system to your Ubuntu server at `10.176.18.41` using MariaDB and PM2.

## Prerequisites

- Ubuntu server at `10.176.18.41`
- Your exported SQL file with tables and initial data
- SSH access to your server
- Basic knowledge of Linux command line

## Step 1: Server Preparation

### 1.1 Update System and Install Basic Tools

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install curl wget git unzip -y
```

### 1.2 Install Node.js (LTS Version)

```bash
# Add NodeSource repository for LTS version
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -

# Install Node.js
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

**Expected Output:**
```
v20.x.x
10.x.x
```

### 1.3 Install PM2 Process Manager

```bash
# Install PM2 globally
sudo npm install -g pm2

# Verify installation
pm2 --version
```

## Step 2: MariaDB Installation and Configuration

### 2.1 Install MariaDB Server

```bash
# Install MariaDB server and client
sudo apt install mariadb-server mariadb-client -y

# Start MariaDB service
sudo systemctl start mariadb

# Enable MariaDB to start on boot
sudo systemctl enable mariadb

# Check MariaDB status
sudo systemctl status mariadb
```

**Expected Output:**
```
● mariadb.service - MariaDB 10.x.x database server
     Loaded: loaded (/lib/systemd/system/mariadb.service; enabled; vendor preset: enabled)
     Active: active (running) since [timestamp]
```

### 2.2 Secure MariaDB Installation

```bash
# Run MariaDB security script
sudo mysql_secure_installation
```

**Follow these prompts:**
```
Enter current password for root (enter for none): [Press Enter]
Set root password? [Y/n]: Y
New password: [Enter strong password]
Re-enter new password: [Confirm password]
Remove anonymous users? [Y/n]: Y
Disallow root login remotely? [Y/n]: Y
Remove test database and access to it? [Y/n]: Y
Reload privilege tables now? [Y/n]: Y
```

### 2.3 Create Database and User

```bash
# Login to MariaDB as root
sudo mysql -u root -p
```

**In MariaDB console, execute these commands:**

```sql
-- Create the database
CREATE DATABASE tasks_tracker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create a dedicated user (replace 'your_strong_password' with a secure password)
CREATE USER 'tasks_user'@'localhost' IDENTIFIED BY 'your_strong_password';

-- Grant all privileges on the database to the user
GRANT ALL PRIVILEGES ON tasks_tracker.* TO 'tasks_user'@'localhost';

-- Grant additional privileges for better compatibility
GRANT CREATE, ALTER, INDEX, LOCK TABLES, REFERENCES, UPDATE, DELETE, DROP, SELECT, INSERT ON tasks_tracker.* TO 'tasks_user'@'localhost';

-- Flush privileges to apply changes
FLUSH PRIVILEGES;

-- Verify the database was created
SHOW DATABASES;

-- Exit MariaDB
EXIT;
```

**Expected Output:**
```
+--------------------+
| Database           |
+--------------------+
| information_schema |
| mysql              |
| performance_schema |
| tasks_tracker      |
+--------------------+
```

### 2.4 Test Database Connection

```bash
# Test connection with the new user
mysql -u tasks_user -p tasks_tracker
```

**In MariaDB console:**
```sql
-- Show current database
SELECT DATABASE();

-- Show tables (should be empty initially)
SHOW TABLES;

-- Exit
EXIT;
```

**Expected Output:**
```
+----------------+
| DATABASE()     |
+----------------+
| tasks_tracker  |
+----------------+
```

## Step 3: Import Your SQL Data

### 3.1 Prepare Your SQL File

```bash
# Create a directory for your SQL file
mkdir -p ~/sql-imports

# Copy your SQL file to the server (use scp from your local machine)
# scp /path/to/your/exported-data.sql user@10.176.18.41:~/sql-imports/

# Or if you have the file locally on the server, move it
# mv /path/to/your/exported-data.sql ~/sql-imports/
```

### 3.2 Import SQL Data

```bash
# Navigate to the SQL file directory
cd ~/sql-imports

# List files to confirm your SQL file is there
ls -la

# Import the SQL file into MariaDB
mysql -u tasks_user -p tasks_tracker < your-exported-data.sql
```

**If the import is successful, you should see no error messages.**

### 3.3 Verify Data Import

```bash
# Connect to MariaDB to verify the import
mysql -u tasks_user -p tasks_tracker
```

**In MariaDB console:**
```sql
-- Show all tables
SHOW TABLES;

-- Check User table (example)
SELECT COUNT(*) as user_count FROM User;

-- Check Task table (example)
SELECT COUNT(*) as task_count FROM Task;

-- Check Department table (example)
SELECT COUNT(*) as department_count FROM Department;

-- Check Notification table (example)
SELECT COUNT(*) as notification_count FROM Notification;

-- Exit
EXIT;
```

**Expected Output (example):**
```
+------------------+
| Tables_in_tasks_tracker |
+------------------+
| Department        |
| Notification      |
| Task              |
| User              |
| _prisma_migrations |
+------------------+

+------------+
| user_count |
+------------+
|          3 |
+------------+

+-------------+
| task_count  |
+-------------+
|         25  |
+-------------+
```

## Step 4: Application Deployment

### 4.1 Create Application Directory

```bash
# Create application directory
sudo mkdir -p /var/www/tasks-tracker

# Change ownership to your user
sudo chown $USER:$USER /var/www/tasks-tracker

# Navigate to the directory
cd /var/www/tasks-tracker
```

### 4.2 Clone Application Repository

```bash
# Clone your repository (replace with your actual repository URL)
git clone https://github.com/yourusername/tasks-tracker.git .

# Or if you're using a private repository
# git clone https://username:token@github.com/yourusername/tasks-tracker.git .
```

### 4.3 Install Dependencies

```bash
# Install all dependencies
npm install

# Verify installation
npm list --depth=0
```

## Step 5: Environment Configuration

### 5.1 Create Production Environment File

```bash
# Create the environment file
nano server/.env
```

**Add this content to `server/.env` (update all placeholder values):**

```env
# Database Configuration
DATABASE_URL="mysql://tasks_user:your_strong_password@localhost:3306/tasks_tracker"

# JWT Configuration (generate a strong secret)
JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters-long"

# LDAP Configuration (update with your LDAP server details)
LDAP_URL="ldap://your-ldap-server:389"
LDAP_BIND_DN="cn=admin,dc=yourdomain,dc=com"
LDAP_BIND_PASSWORD="your-ldap-password"
LDAP_BASE_DN="dc=yourdomain,dc=com"
LDAP_USER_SEARCH_BASE="ou=users,dc=yourdomain,dc=com"

# Email Configuration (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="your-email@gmail.com"

# Server Configuration
PORT="3000"
NODE_ENV="production"
FRONTEND_URL="http://10.176.18.41:5173"
BACKEND_URL="http://10.176.18.41:3000"

# File Upload Configuration
UPLOAD_DIR="/var/www/tasks-tracker/uploads"
MAX_FILE_SIZE="10485760"
```

### 5.2 Generate Prisma Client

```bash
# Navigate to server directory
cd server

# Generate Prisma client
npx prisma generate

# Verify database connection
npx prisma db pull
```

**Expected Output:**
```
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": MySQL database "tasks_tracker", schema "public" at "localhost:3306"

✔ Introspected 5 models and wrote them into prisma/schema.prisma in 2.5s
```

## Step 6: Build Frontend

### 6.1 Build Production Frontend

```bash
# Go back to root directory
cd ..

# Build the frontend for production
npm run build
```

**Expected Output:**
```
vite v5.x.x building for production...
✓ 123 modules transformed.
dist/index.html                   0.45 kB │ gzip:  0.32 kB
dist/assets/index-abc123.js       1.23 MB │ gzip: 0.45 MB
dist/assets/index-def456.css      0.12 MB │ gzip: 0.03 MB
✓ built in 15.23s
```

### 6.2 Configure Vite for Production

```bash
# Update vite.config.ts for production
nano vite.config.ts
```

**Update `vite.config.ts`:**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
  }
})
```

## Step 7: Process Management with PM2

### 7.1 Create PM2 Configuration

```bash
# Create PM2 ecosystem file
nano ecosystem.config.js
```

**Add this content:**
```javascript
module.exports = {
  apps: [
    {
      name: 'tasks-tracker-backend',
      script: 'server/src/index.ts',
      interpreter: 'npx',
      interpreter_args: 'tsx',
      cwd: '/var/www/tasks-tracker',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: '/var/log/pm2/tasks-tracker-backend-error.log',
      out_file: '/var/log/pm2/tasks-tracker-backend-out.log',
      log_file: '/var/log/pm2/tasks-tracker-backend.log'
    },
    {
      name: 'tasks-tracker-frontend',
      script: 'npm',
      args: 'run preview',
      cwd: '/var/www/tasks-tracker',
      env: {
        NODE_ENV: 'production',
        PORT: 5173
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      error_file: '/var/log/pm2/tasks-tracker-frontend-error.log',
      out_file: '/var/log/pm2/tasks-tracker-frontend-out.log',
      log_file: '/var/log/pm2/tasks-tracker-frontend.log'
    }
  ]
}
```

### 7.2 Start Applications with PM2

```bash
# Create log directory
sudo mkdir -p /var/log/pm2
sudo chown $USER:$USER /var/log/pm2

# Start applications
pm2 start ecosystem.config.js

# Check status
pm2 status

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

**Expected Output:**
```
┌─────┬─────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id  │ name                │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├─────┼─────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 0   │ tasks-tracker-backend │ default     │ 1.0.0   │ fork    │ 12345    │ 0s     │ 0    │ online    │ 0%       │ 45.2mb   │ ubuntu   │ disabled │
│ 1   │ tasks-tracker-frontend│ default     │ 1.0.0   │ fork    │ 12346    │ 0s     │ 0    │ online    │ 0%       │ 23.1mb   │ ubuntu   │ disabled │
└─────┴─────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
```

## Step 8: Nginx Configuration (Optional but Recommended)

### 8.1 Install Nginx

```bash
sudo apt install nginx -y
```

### 8.2 Configure Nginx

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/tasks-tracker
```

**Add this content:**
```nginx
server {
    listen 80;
    server_name 10.176.18.41;

    # Frontend
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # SSE endpoint
    location /api/notifications/stream {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Connection '';
        proxy_set_header Cache-Control 'no-cache';
        proxy_buffering off;
        proxy_read_timeout 24h;
    }
}
```

### 8.3 Enable Site and Restart Nginx

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/tasks-tracker /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## Step 9: Firewall Configuration

```bash
# Configure UFW firewall
sudo ufw allow 22    # SSH
sudo ufw allow 80   # HTTP
sudo ufw allow 443  # HTTPS (if using SSL)
sudo ufw allow 3000 # Backend (if accessing directly)
sudo ufw allow 5173 # Frontend (if accessing directly)

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

## Step 10: Final Verification

### 10.1 Test Application Services

```bash
# Check PM2 status
pm2 status

# Check Nginx status
sudo systemctl status nginx

# Check MariaDB status
sudo systemctl status mariadb

# Check system resources
pm2 monit
```

### 10.2 Test Database Connection

```bash
# Test database connection
cd /var/www/tasks-tracker/server
npx prisma db pull
```

### 10.3 Access Application

- **Frontend**: `http://10.176.18.41`
- **Backend API**: `http://10.176.18.41/api`
- **Direct Frontend**: `http://10.176.18.41:5173`
- **Direct Backend**: `http://10.176.18.41:3000`

## Troubleshooting Commands

```bash
# Check PM2 logs
pm2 logs --lines 100

# Restart applications
pm2 restart all

# Check disk space
df -h

# Check memory usage
free -h

# Check running processes
ps aux | grep node

# Check Nginx status
sudo nginx -t
sudo systemctl status nginx

# Check MariaDB status
sudo systemctl status mariadb

# Test MariaDB connection
mysql -u tasks_user -p tasks_tracker -e "SHOW TABLES;"
```

## Deployment Checklist

- [ ] Ubuntu server prepared with required software
- [ ] MariaDB installed, configured, and secured
- [ ] Database and user created successfully
- [ ] SQL data imported and verified
- [ ] Application cloned and dependencies installed
- [ ] Environment variables configured
- [ ] Database connection verified
- [ ] Frontend built for production
- [ ] PM2 configuration created and applications started
- [ ] Nginx configured (optional)
- [ ] Firewall configured
- [ ] Application tested and accessible

## Important Notes

1. **Database Migration**: Since you're importing existing data, you don't need to run `npx prisma db push`. Just use `npx prisma db pull` to verify the connection.

2. **Environment Variables**: Make sure to update all the placeholder values in the `.env` file with your actual configuration.

3. **LDAP Configuration**: Update the LDAP settings to match your organization's LDAP server.

4. **Email Configuration**: Configure SMTP settings for email notifications to work properly.

5. **File Permissions**: Ensure proper file permissions for the application directory and logs.

6. **Security**: Change default passwords and use strong JWT secrets.

## Scheduled Tasks

The system includes several scheduled tasks that will run automatically:

- **Daily Progress Reports**: Monday-Friday at 8:00 PM
- **Manager Daily Summaries**: Monday-Friday at 8:00 PM  
- **Weekly Reports**: Wednesday at 9:00 AM
- **Overdue Task Alerts**: Thursday at 4:30 PM
- **Deadline Reminders**: Daily at 9:00 AM
- **Friday Morning Report**: Friday at 9:00 AM (Weekly Status)
- **Friday Afternoon Report**: Friday at 5:20 PM (Weekly Wrap-up + Department Progress)

All scheduled tasks run in Nairobi timezone and include Word document attachments.

---

**Your Tasks Tracker system should now be fully deployed on your Ubuntu server!** 🎉
```

**Instructions:**
1. **Select all the text above** (from `# Ubuntu Server Deployment Guide` to the end)
2. **Copy it** (Ctrl+C)
3. **Open your `docs/Ubuntu-Server-Deployment.md` file**
4. **Paste the content** (Ctrl+V)
5. **Save the file**

This complete guide includes everything you need for deploying your Tasks Tracker system to Ubuntu with MariaDB! 🚀

```markdown
# Ubuntu Server Deployment Guide

This guide will help you deploy the Tasks Tracker system to your Ubuntu server at `10.176.18.41` using MariaDB and PM2.

## Prerequisites

- Ubuntu server at `10.176.18.41`
- Your exported SQL file with tables and initial data
- SSH access to your server
- Basic knowledge of Linux command line

## Step 1: Server Preparation

### 1.1 Update System and Install Basic Tools

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install curl wget git unzip -y
```

### 1.2 Install Node.js (LTS Version)

```bash
# Add NodeSource repository for LTS version
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -

# Install Node.js
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

**Expected Output:**
```

```plaintext

### 1.3 Install PM2 Process Manager

```bash
# Install PM2 globally
sudo npm install -g pm2

# Verify installation
pm2 --version
```

## Step 2: MariaDB Installation and Configuration

### 2.1 Install MariaDB Server

```bash
# Install MariaDB server and client
sudo apt install mariadb-server mariadb-client -y

# Start MariaDB service
sudo systemctl start mariadb

# Enable MariaDB to start on boot
sudo systemctl enable mariadb

# Check MariaDB status
sudo systemctl status mariadb
```

**Expected Output:**
```

```plaintext

### 2.2 Secure MariaDB Installation

```bash
# Run MariaDB security script
sudo mysql_secure_installation
```

**Follow these prompts:**
```

```plaintext

### 2.3 Create Database and User

```bash
# Login to MariaDB as root
sudo mysql -u root -p
```

**In MariaDB console, execute these commands:**

```sql
-- Create the database
CREATE DATABASE tasks_tracker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create a dedicated user (replace 'your_strong_password' with a secure password)
CREATE USER 'tasks_user'@'localhost' IDENTIFIED BY 'your_strong_password';

-- Grant all privileges on the database to the user
GRANT ALL PRIVILEGES ON tasks_tracker.* TO 'tasks_user'@'localhost';

-- Grant additional privileges for better compatibility
GRANT CREATE, ALTER, INDEX, LOCK TABLES, REFERENCES, UPDATE, DELETE, DROP, SELECT, INSERT ON tasks_tracker.* TO 'tasks_user'@'localhost';

-- Flush privileges to apply changes
FLUSH PRIVILEGES;

-- Verify the database was created
SHOW DATABASES;

-- Exit MariaDB
EXIT;
```

**Expected Output:**
```

```plaintext

### 2.4 Test Database Connection

```bash
# Test connection with the new user
mysql -u tasks_user -p tasks_tracker
```

**In MariaDB console:**
```sql
-- Show current database
SELECT DATABASE();

-- Show tables (should be empty initially)
SHOW TABLES;

-- Exit
EXIT;
```

**Expected Output:**
```

```plaintext

## Step 3: Import Your SQL Data

### 3.1 Prepare Your SQL File

```bash
# Create a directory for your SQL file
mkdir -p ~/sql-imports

# Copy your SQL file to the server (use scp from your local machine)
# scp /path/to/your/exported-data.sql user@10.176.18.41:~/sql-imports/

# Or if you have the file locally on the server, move it
# mv /path/to/your/exported-data.sql ~/sql-imports/
```

### 3.2 Import SQL Data

```bash
# Navigate to the SQL file directory
cd ~/sql-imports

# List files to confirm your SQL file is there
ls -la

# Import the SQL file into MariaDB
mysql -u tasks_user -p tasks_tracker < your-exported-data.sql
```

**If the import is successful, you should see no error messages.**

### 3.3 Verify Data Import

```bash
# Connect to MariaDB to verify the import
mysql -u tasks_user -p tasks_tracker
```

**In MariaDB console:**
```sql
-- Show all tables
SHOW TABLES;

-- Check User table (example)
SELECT COUNT(*) as user_count FROM User;

-- Check Task table (example)
SELECT COUNT(*) as task_count FROM Task;

-- Check Department table (example)
SELECT COUNT(*) as department_count FROM Department;

-- Check Notification table (example)
SELECT COUNT(*) as notification_count FROM Notification;

-- Exit
EXIT;
```

**Expected Output (example):**
```

```plaintext

## Step 4: Application Deployment

### 4.1 Create Application Directory

```bash
# Create application directory
sudo mkdir -p /var/www/tasks-tracker

# Change ownership to your user
sudo chown $USER:$USER /var/www/tasks-tracker

# Navigate to the directory
cd /var/www/tasks-tracker
```

### 4.2 Clone Application Repository

```bash
# Clone your repository (replace with your actual repository URL)
git clone https://github.com/yourusername/tasks-tracker.git .

# Or if you're using a private repository
# git clone https://username:token@github.com/yourusername/tasks-tracker.git .
```

### 4.3 Install Dependencies

```bash
# Install all dependencies
npm install

# Verify installation
npm list --depth=0
```

## Step 5: Environment Configuration

### 5.1 Create Production Environment File

```bash
# Create the environment file
nano server/.env
```

**Add this content to `server/.env` (update all placeholder values):**

```env
# Database Configuration
DATABASE_URL="mysql://tasks_user:your_strong_password@localhost:3306/tasks_tracker"

# JWT Configuration (generate a strong secret)
JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters-long"

# LDAP Configuration (update with your LDAP server details)
LDAP_URL="ldap://your-ldap-server:389"
LDAP_BIND_DN="cn=admin,dc=yourdomain,dc=com"
LDAP_BIND_PASSWORD="your-ldap-password"
LDAP_BASE_DN="dc=yourdomain,dc=com"
LDAP_USER_SEARCH_BASE="ou=users,dc=yourdomain,dc=com"

# Email Configuration (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="your-email@gmail.com"

# Server Configuration
PORT="3000"
NODE_ENV="production"
FRONTEND_URL="http://10.176.18.41:5173"
BACKEND_URL="http://10.176.18.41:3000"

# File Upload Configuration
UPLOAD_DIR="/var/www/tasks-tracker/uploads"
MAX_FILE_SIZE="10485760"
```

### 5.2 Generate Prisma Client

```bash
# Navigate to server directory
cd server

# Generate Prisma client
npx prisma generate

# Verify database connection
npx prisma db pull
```

**Expected Output:**
```

```plaintext

## Step 6: Build Frontend

### 6.1 Build Production Frontend

```bash
# Go back to root directory
cd ..

# Build the frontend for production
npm run build
```

**Expected Output:**
```

```plaintext

### 6.2 Configure Vite for Production

```bash
# Update vite.config.ts for production
nano vite.config.ts
```

**Update `vite.config.ts`:**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
  }
})
```

## Step 7: Process Management with PM2

### 7.1 Create PM2 Configuration

```bash
# Create PM2 ecosystem file
nano ecosystem.config.js
```

**Add this content:**
```javascript
module.exports = {
  apps: [
    {
      name: 'tasks-tracker-backend',
      script: 'server/src/index.ts',
      interpreter: 'npx',
      interpreter_args: 'tsx',
      cwd: '/var/www/tasks-tracker',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: '/var/log/pm2/tasks-tracker-backend-error.log',
      out_file: '/var/log/pm2/tasks-tracker-backend-out.log',
      log_file: '/var/log/pm2/tasks-tracker-backend.log'
    },
    {
      name: 'tasks-tracker-frontend',
      script: 'npm',
      args: 'run preview',
      cwd: '/var/www/tasks-tracker',
      env: {
        NODE_ENV: 'production',
        PORT: 5173
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      error_file: '/var/log/pm2/tasks-tracker-frontend-error.log',
      out_file: '/var/log/pm2/tasks-tracker-frontend-out.log',
      log_file: '/var/log/pm2/tasks-tracker-frontend.log'
    }
  ]
}
```

### 7.2 Start Applications with PM2

```bash
# Create log directory
sudo mkdir -p /var/log/pm2
sudo chown $USER:$USER /var/log/pm2

# Start applications
pm2 start ecosystem.config.js

# Check status
pm2 status

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

**Expected Output:**
```

```plaintext

## Step 8: Nginx Configuration (Optional but Recommended)

### 8.1 Install Nginx

```bash
sudo apt install nginx -y
```

### 8.2 Configure Nginx

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/tasks-tracker
```

**Add this content:**
```nginx
server {
    listen 80;
    server_name 10.176.18.41;

    # Frontend
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # SSE endpoint
    location /api/notifications/stream {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Connection '';
        proxy_set_header Cache-Control 'no-cache';
        proxy_buffering off;
        proxy_read_timeout 24h;
    }
}
```

### 8.3 Enable Site and Restart Nginx

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/tasks-tracker /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## Step 9: Firewall Configuration

```bash
# Configure UFW firewall
sudo ufw allow 22    # SSH
sudo ufw allow 80   # HTTP
sudo ufw allow 443  # HTTPS (if using SSL)
sudo ufw allow 3000 # Backend (if accessing directly)
sudo ufw allow 5173 # Frontend (if accessing directly)

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

## Step 10: Final Verification

### 10.1 Test Application Services

```bash
# Check PM2 status
pm2 status

# Check Nginx status
sudo systemctl status nginx

# Check MariaDB status
sudo systemctl status mariadb

# Check system resources
pm2 monit
```

### 10.2 Test Database Connection

```bash
# Test database connection
cd /var/www/tasks-tracker/server
npx prisma db pull
```

### 10.3 Access Application

- **Frontend**: `http://10.176.18.41`
- **Backend API**: `http://10.176.18.41/api`
- **Direct Frontend**: `http://10.176.18.41:5173`
- **Direct Backend**: `http://10.176.18.41:3000`

## Troubleshooting Commands

```bash
# Check PM2 logs
pm2 logs --lines 100

# Restart applications
pm2 restart all

# Check disk space
df -h

# Check memory usage
free -h

# Check running processes
ps aux | grep node

# Check Nginx status
sudo nginx -t
sudo systemctl status nginx

# Check MariaDB status
sudo systemctl status mariadb

# Test MariaDB connection
mysql -u tasks_user -p tasks_tracker -e "SHOW TABLES;"
```

## Deployment Checklist

- [ ] Ubuntu server prepared with required software
- [ ] MariaDB installed, configured, and secured
- [ ] Database and user created successfully
- [ ] SQL data imported and verified
- [ ] Application cloned and dependencies installed
- [ ] Environment variables configured
- [ ] Database connection verified
- [ ] Frontend built for production
- [ ] PM2 configuration created and applications started
- [ ] Nginx configured (optional)
- [ ] Firewall configured
- [ ] Application tested and accessible

## Important Notes

1. **Database Migration**: Since you're importing existing data, you don't need to run `npx prisma db push`. Just use `npx prisma db pull` to verify the connection.

2. **Environment Variables**: Make sure to update all the placeholder values in the `.env` file with your actual configuration.

3. **LDAP Configuration**: Update the LDAP settings to match your organization's LDAP server.

4. **Email Configuration**: Configure SMTP settings for email notifications to work properly.

5. **File Permissions**: Ensure proper file permissions for the application directory and logs.

6. **Security**: Change default passwords and use strong JWT secrets.

## Scheduled Tasks

The system includes several scheduled tasks that will run automatically:

- **Daily Progress Reports**: Monday-Friday at 8:00 PM
- **Manager Daily Summaries**: Monday-Friday at 8:00 PM  
- **Weekly Reports**: Wednesday at 9:00 AM
- **Overdue Task Alerts**: Thursday at 4:30 PM
- **Deadline Reminders**: Daily at 9:00 AM
- **Friday Morning Report**: Friday at 9:00 AM (Weekly Status)
- **Friday Afternoon Report**: Friday at 5:20 PM (Weekly Wrap-up + Department Progress)

All scheduled tasks run in Nairobi timezone and include Word document attachments.

---

**Your Tasks Tracker system should now be fully deployed on your Ubuntu server!** 🎉
```


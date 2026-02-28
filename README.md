# ShareTracker

An investment portfolio tracker with capital gains reporting. Tracks shares, crypto, gold, bonds, and property. Built with ASP.NET Core 9 and Next.js 14.

## Stack

| Layer | Technology |
|---|---|
| API | ASP.NET Core 9, MediatR, FluentValidation |
| Database | PostgreSQL 16 (Docker) |
| ORM | Entity Framework Core 8 (Npgsql) |
| Auth | Clerk (RS256 JWT) |
| Frontend | Next.js 14, Tailwind CSS |

---

## Prerequisites

Install the following on your Linux server:

```bash
# .NET 9 SDK
wget https://dot.net/v1/dotnet-install.sh -O dotnet-install.sh
chmod +x dotnet-install.sh
./dotnet-install.sh --channel 9.0
echo 'export PATH="$HOME/.dotnet:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Node.js 20+ (via nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20

# Docker + Docker Compose
sudo apt-get update
sudo apt-get install -y docker.io docker-compose-plugin
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
# Log out and back in for the group change to take effect
```

---

## 1. Clone

```bash
git clone <your-repo-url> ShareTracker
cd ShareTracker
```

---

## 2. Environment Variables

### Database password (`/.env`)

```bash
cp .env.example .env   # or create it manually
```

```dotenv
POSTGRES_PASSWORD=your_strong_password_here
```

### API settings (`/src/ShareTracker.API/appsettings.Production.json`)

Create the file (it is gitignored):

```bash
cat > src/ShareTracker.API/appsettings.Production.json <<'EOF'
{
  "Clerk": {
    "Authority": "https://<your-clerk-frontend-api>.clerk.accounts.dev"
  },
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=sharetracker;Username=postgres;Password=your_strong_password_here"
  }
}
EOF
```

### Frontend (`/client/.env.local`)

```bash
cat > client/.env.local <<'EOF'
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/complete-profile
NEXT_PUBLIC_API_URL=https://your-domain.com/api-or-port
EOF
```

> Get your Clerk keys from the [Clerk Dashboard](https://dashboard.clerk.com) → API Keys.

---

## 3. Start PostgreSQL

```bash
docker compose up -d
```

Verify it is running:

```bash
docker ps
```

---

## 4. Apply Database Migrations

```bash
dotnet ef database update \
  --project src/ShareTracker.Infrastructure \
  --startup-project src/ShareTracker.API
```

---

## 5. Run the API

### Development

```bash
dotnet run --project src/ShareTracker.API
# Listens on http://localhost:5000
```

### Production (systemd)

Build a self-contained publish first:

```bash
dotnet publish src/ShareTracker.API \
  --configuration Release \
  --output /opt/sharetracker/api
```

Create the service unit:

```bash
sudo nano /etc/systemd/system/sharetracker-api.service
```

```ini
[Unit]
Description=ShareTracker API
After=network.target

[Service]
WorkingDirectory=/opt/sharetracker/api
ExecStart=/opt/sharetracker/api/ShareTracker.API
Restart=always
RestartSec=5
KillSignal=SIGINT
SyslogIdentifier=sharetracker-api
User=www-data
Environment=ASPNETCORE_ENVIRONMENT=Production
Environment=ASPNETCORE_URLS=http://localhost:5000

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now sharetracker-api
sudo systemctl status sharetracker-api
```

---

## 6. Run the Frontend

### Development

```bash
cd client
npm install
npm run dev
# Listens on http://localhost:3000
```

### Production (PM2)

```bash
npm install -g pm2

cd client
npm install
npm run build

pm2 start npm --name sharetracker-web -- start
pm2 save
pm2 startup   # follow the printed command to enable on boot
```

---

## 7. Reverse Proxy (Nginx)

Install Nginx and configure it to proxy both services:

```bash
sudo apt-get install -y nginx
sudo nano /etc/nginx/sites-available/sharetracker
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend (Next.js)
    location / {
        proxy_pass         http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # API
    location /api/ {
        proxy_pass         http://localhost:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/sharetracker /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### HTTPS (Let's Encrypt)

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## Quick Reference

| Action | Command |
|---|---|
| Start database | `docker compose up -d` |
| Stop database | `docker compose down` |
| View API logs | `sudo journalctl -u sharetracker-api -f` |
| View frontend logs | `pm2 logs sharetracker-web` |
| Restart API | `sudo systemctl restart sharetracker-api` |
| Restart frontend | `pm2 restart sharetracker-web` |
| Add migration | `dotnet ef migrations add <Name> --project src/ShareTracker.Infrastructure --startup-project src/ShareTracker.API` |
| Apply migrations | `dotnet ef database update --project src/ShareTracker.Infrastructure --startup-project src/ShareTracker.API` |

---

## Clerk Configuration

In your [Clerk Dashboard](https://dashboard.clerk.com):

1. **Allowed origins** — add your domain (e.g. `https://your-domain.com`)
2. **Redirect URLs** — add `/sign-in`, `/sign-up`, `/complete-profile`
3. **JWT / JWKS** — the API reads the JWKS automatically from the `Authority` URL — no manual key copying required
4. **Plans** — create an `investor` plan under **Billing → Plans** to enable the capital gains reports feature

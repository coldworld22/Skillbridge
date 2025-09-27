# Installation Guide

This guide walks through the ZIP-based installation workflow for SkillBridge so you can unpack the customer bundle and bring the stack online without cloning the Git repository. Follow these steps when you receive the packaged release from CodeCanyon or the Memonet customer portal.

## 1. Upload the archive

- **Local workstation:** Download the ZIP file and move it into the directory where you want the project to live.
- **Remote server:** Copy the archive to the host with a tool such as `scp` or `rsync`:

  ```bash
  scp Skillbridge-v1.0.0.zip deploy@example.com:/var/www
  ```

Keep a pristine copy of the downloaded ZIP so you can re-upload clean files later if needed.

## 2. Extract and position the project directory

Unzip the package and ensure the project root is named `Skillbridge/` so the helper scripts can find the expected paths:

```bash
unzip Skillbridge-v1.0.0.zip
mv Skillbridge-v1.0.0 Skillbridge
cd Skillbridge
```

The root folder should now contain `install.sh`, `docker-compose.yml`, and the `backend/`, `frontend/`, and `nginx/` directories directly under `Skillbridge/`.

On Linux servers adjust permissions so your deploy user owns the files and the shell scripts remain executable:

```bash
sudo chown -R deploy:deploy Skillbridge
chmod +x install.sh scripts/*.sh
```

## 3. Copy environment templates

Duplicate each `.env.example` file so the backend and frontend can read real configuration values:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp backend/.env.production.example backend/.env.production
cp frontend/.env.local.example frontend/.env.local
```

Edit the resulting files to match your target environment. Use local URLs (for example `http://localhost:5002/api`) and `COOKIE_SECURE=false` for development, then replace them with your public domain, SMTP credentials, and production secrets before going live.

## 4. Run the installer

From the project root execute the installer. It validates prerequisites, prepares environment files when missing, runs database migrations and seeds, and creates the initial admin user:

```bash
./install.sh
```

For unattended production deployments, pass the target mode and domain (for example `./install.sh production yourdomain.com`) and supply `ADMIN_EMAIL` and `ADMIN_PASSWORD` via environment variables if you need non-interactive credentials.

## 5. Start the services

Start the Docker stack after the installer completes:

- **Local development:**

  ```bash
  docker compose up --build
  ```

- **Production host:**

  ```bash
  docker compose up -d --build
  ```

When you manage containers manually, remember to run migrations yourself before serving traffic:

```bash
docker compose run --rm backend npm run migrate
docker compose run --rm backend npm run seed
```

Once the services are running you can sign in with the admin credentials you configured during installation and begin configuring SkillBridge.

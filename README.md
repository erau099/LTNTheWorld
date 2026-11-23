# 🌍 Love Thy Neighbor
https://ltn-the-world.vercel.app/

## 📌 Project Overview
Lighten The World is a completely web based food donation and receiving app, seeking to service Sacramento in providing a platform that easily allows individuals to submit their food donations into a listable, filterable catalog that allows users in need to claim and pickup those donations. 

## 🛠️ Tech Stack
### Frontend
* Programming Language: JavaScript, HTML, CSS
* Framework: REACT
### Backend
* Programming Language: Java 17, PostgreSQL
* Framework: Spring Boot 4


## 🌟 Core Features

### User Authentication
* User signup and login
* Secure authentication
* Role selection (Donor or Recipient)
* User profile management

### Food Sharing
* Upload food listings
* Add food descriptions
* Upload food images
* Set pickup time and date
* Add pickup instructions

### Location Services
* Pickup location selection
* Maps integration
* Nearby food discovery

### Dashboard Features
* Browse available food listings
* Filter by category, location, time
* View listings history
* Add or remove unclaimed listings (listings with incorrect details are removed and reposted to avoid miscommunication)
* Submit moderation reports & leave reviews

## 📝 Jira


## 🧪 Testing

### Backend (JUnit 5 & Mockito)
Navigate to the backend directory and run the Maven wrapper:
```bash
cd lovethyneighbor-backend
./mvnw test       # On macOS/Linux
.\mvnw.cmd test   # On Windows
```

### Frontend (Vitest & React Testing Library)
Run the test runner from the repository root:
```bash
npm run test:run  # Single run
npm test          # Watch mode
```

### Automated CI
Automated testing runs on every push and pull request to `main` and `dev` via GitHub Actions (`.github/workflows/ci.yml`).

## 🚀 Deployment (Single-Dyno Heroku Full-Stack)
The `heroku-deploy` build bundles the Vite React frontend (`dist/`) directly into the Spring Boot JAR (`BOOT-INF/classes/static`) so both frontend and backend run on **one always-on Heroku Basic dyno** (`$7/mo`) + Heroku Postgres Essential-0 (`$5/mo`).

1. **Heroku Buildpacks (in order):**
   * `heroku/nodejs` (runs `npm ci` and `heroku-postbuild` -> `npm run build`)
   * `heroku/java` (builds root `pom.xml` -> embeds `dist/` into `lovethyneighbor-backend/target/lovethyneighbor-0.0.1-SNAPSHOT.jar`)
   * Ensure `NPM_CONFIG_PRODUCTION` is **not** set to `true` so Vite (`devDependencies`) is available during the build.
2. **Required Heroku Config Vars:**
   * `ENCRYPTION_KEY`, `JWT_SECRET` (override dev defaults!)
   * `FRONTEND_URL` (your Heroku app URL, e.g. `https://<app>.herokuapp.com`)
   * `COOKIE_SECURE=true`
   * `MAIL_USERNAME`, `MAIL_PASSWORD`
   * `VITE_FIREBASE_*` keys from `.env.example`
   * Optional initial admin bootstrap: `ADMIN_BOOTSTRAP_EMAIL`, `ADMIN_BOOTSTRAP_PASSWORD`
   * Optional server-side FCM push delivery: `FIREBASE_SERVICE_ACCOUNT_JSON`
3. **Capacity Monitoring:**
   * Admins automatically receive an in-dashboard advisory popup a few seconds after logging in if the 512 MB dyno approaches memory, concurrency, or active listing thresholds, recommending an upgrade to **Heroku Standard-2X (1 GB RAM)**.
4. **Load & Memory Simulation:**
   ```bash
   npm run build
   ./lovethyneighbor-backend/mvnw -f pom.xml -DskipTests clean package
   npm run test:heroku-load
   ```

## 👨‍💻 Developer Instructions

## 👥 Team Members

## 📄 License

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

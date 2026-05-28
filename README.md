# Kaka Life (卡卡生活)

Kaka Life is a comprehensive community platform and lifestyle guide tailored for the Chinese-speaking community in Calgary. It bridges the gap between local resources and the community by providing real-time local news, restaurant discovery, classified ads, and a community forum. 

While the application's user interface is localized in Traditional Chinese to serve its target demographic, the architecture and codebase are built using modern web development standards with a focus on **automation, fault-tolerance, and AI integration**.

## 🌟 Core Features & Architecture

### 1. 🤖 AI-Powered, Fault-Tolerant News Aggregator
- **Multi-Source RSS Scraping**: A custom Node.js pipeline fetches local news from various feeds (CBC Calgary, Global News, Calgary Herald, City of Calgary Events) to provide comprehensive coverage.
- **Auto-Translation via LLMs**: Integrates with the **Google Gemini 2.5 Flash API** to automatically translate news titles and generate concise, engaging summaries in Traditional Chinese.
- **Self-Healing Retry Mechanism**: Designed for resilience. If the Gemini API hits rate limits or fails, the system gracefully falls back to the original English text and flags the record. A dedicated **Retry Worker** can later sweep the database to re-translate failed records, ensuring data consistency without halting the pipeline.

### 2. ⚙️ Automated CI/CD & Background Jobs
- **GitHub Actions Cron Jobs**: Data fetching scripts run autonomously every day via GitHub Actions, keeping the database perfectly up to date without requiring a constantly running backend server.
- **Vercel Serverless Function Integration**: A custom Vercel API endpoint (`/api/trigger-sync`) allows administrators to securely trigger GitHub Action workflows (fetching news, fetching places, or retrying translations) directly from the React Admin Dashboard, bypassing Vercel's strict 10-second timeout limits for heavy background tasks.

### 3. 🍔 Dining & Discovery (Yelp Integration)
- Integrates directly with the Yelp Fusion API to fetch, cache, and display top-rated local restaurants and businesses.

### 4. 🏠 Classified Ads & 💬 Community Forum
- **Classifieds**: A dedicated section for users to post and browse local classifieds (housing, job postings, second-hand marketplace) with full image uploading capabilities.
- **Forum**: A fully functional discussion board supporting categorization, real-time posts, and threaded comments.

### 5. 👤 Secure Authentication & Authorization
- Implements robust user authentication and Role-Based Access Control (RBAC) using Supabase.
- **Row Level Security (RLS)** is strictly enforced at the database level to ensure data integrity and privacy between regular users and administrators.

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, TypeScript
- **Styling**: Tailwind CSS (Material Design 3 aesthetic)
- **Backend/Database**: Supabase (PostgreSQL, Auth, Storage)
- **AI Integration**: Google Generative AI (Gemini 2.5 Flash SDK)
- **Automation**: GitHub Actions, Vercel Serverless Functions
- **External APIs**: Yelp Fusion API, Open-Meteo API (Weather), RSS Feeds

## 🚀 Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create a `.env` file in the root directory and add the following keys. 
*Note: Service keys and GitHub tokens are strictly used for the backend Node scripts and serverless functions, and are never exposed to the Vite frontend.*

```env
# Public keys for the Vite frontend
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Private keys for the backend scraper scripts & API
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
YELP_API_KEY=your_yelp_api_key
GEMINI_API_KEY=your_gemini_api_key
GITHUB_PAT=your_github_personal_access_token # For triggering GitHub Actions via API
```

### 3. Start the Development Server
```bash
npm run dev
```

### 4. Run Backend Scraper Scripts Locally
To manually populate the database with the latest news (translated/summarized via AI) and Yelp places:
```bash
node scripts/fetchNews.js
node scripts/fetchPlaces.js
node scripts/retryTranslation.js
```

## 📦 Deployment

This project is deployed using **Vercel** for the frontend/API and **GitHub Actions** for background tasks.
1. Connect the GitHub repository to Vercel.
2. Add all environment variables (including `GITHUB_PAT` and `SUPABASE_SERVICE_KEY`) to Vercel.
3. Add the production URL to the **Site URL** and **Redirect URLs** in Supabase Authentication settings to ensure OAuth and email logins function correctly.

---
*Developed with ❤️ for the Calgary Community.*

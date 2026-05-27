# Kaka Life (卡卡生活)

Kaka Life is a comprehensive community platform and lifestyle guide tailored for the Chinese-speaking community in Calgary. It bridges the gap between local resources and the community by providing real-time local news, restaurant discovery, classified ads, and a community forum. 

While the application's user interface is localized in Traditional Chinese to serve its target demographic, the architecture and codebase are built using modern web development standards.

## 🌟 Core Features

- **📰 Automated Local News Aggregator**: Features a custom Node.js web scraper that fetches local Calgary news via RSS feeds, automatically translates the content using the Google Translate API, and stores it in the database.
- **🍔 Dining & Discovery (Yelp Integration)**: Integrates directly with the Yelp Fusion API to fetch, cache, and display top-rated local restaurants and businesses.
- **🏠 Classified Ads Marketplace**: A dedicated section for users to post and browse local classifieds (housing, job postings, second-hand marketplace) with image uploading capabilities.
- **💬 Interactive Community Forum**: A fully functional discussion board supporting categorization, real-time posts, and threaded comments.
- **👤 Secure Authentication**: Implements robust user authentication and authorization using Supabase (Row Level Security enabled).
- **📱 Mobile-First Responsive Design**: Highly optimized for mobile devices featuring a custom bottom navigation bar and accessible UI components built with Tailwind CSS.

## 🛠️ Tech Stack

- **Frontend Framework**: React 18 + Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS (Material Design 3 aesthetic)
- **Backend as a Service (BaaS)**: Supabase (PostgreSQL, Authentication, Storage)
- **Routing**: React Router DOM
- **External APIs**: Yelp Fusion API, Open-Meteo API (Weather), RSS Feeds, Google Translate API

## 🚀 Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create a `.env` file in the root directory and add the following keys. 
*Note: The service keys are strictly used for the backend Node scripts and are never exposed to the Vite frontend.*

```env
# Public keys for the Vite frontend
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Private keys for the backend scraper scripts
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
YELP_API_KEY=your_yelp_api_key
```

### 3. Start the Development Server
```bash
npm run dev
```

### 4. Run Backend Scraper Scripts
To populate the database with the latest news and Yelp places (requires the service keys in `.env`):
```bash
node scripts/fetchNews.js
node scripts/fetchPlaces.js
```

## 📦 Deployment

This project is optimized for deployment on platforms like **Vercel** or **Netlify**:
1. Connect your GitHub repository to Vercel.
2. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to the Vercel Environment Variables.
3. Once deployed, add your production URL to the **Site URL** and **Redirect URLs** in your Supabase Authentication settings to ensure OAuth and email logins function correctly.

---
*Developed with ❤️ for the Calgary Community.*

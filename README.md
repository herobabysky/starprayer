# Dua Prayer App 🤲🏼

A beautiful Islamic prayer app where you can send your duas to the heavens and see them become twinkling stars.

## Features

- Send prayers with beautiful rising light animation
- Your duas become twinkling stars in the sky
- Read other anonymous duas by hovering/tapping stars
- Say "Amin" to prayers
- Mobile responsive with touch-friendly interactions
- Animated galaxy background

## Deployment to GitHub Pages

### Step 1: Create a GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the **+** icon → **New repository**
3. Name it `dua-prayer-app` (or your preferred name)
4. Keep it **Public** (required for free GitHub Pages)
5. Click **Create repository**

### Step 2: Update the Base URL

If your repository name is different from `dua-prayer-app`, edit `vite.config.js`:

```js
base: '/your-repo-name/',
```

### Step 3: Push Your Code

Open terminal in this folder and run:

```bash
# Initialize git
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit - Dua Prayer App"

# Add your GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/dua-prayer-app.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 4: Deploy to GitHub Pages

```bash
# Install dependencies
npm install

# Build and deploy
npm run deploy
```

### Step 5: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under "Source", select **Deploy from a branch**
4. Select `gh-pages` branch and `/ (root)` folder
5. Click **Save**

Your app will be live at: `https://YOUR_USERNAME.github.io/dua-prayer-app/`

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Tech Stack

- React 18
- Vite
- Tailwind CSS
- GitHub Pages

---

*"And your Lord says, 'Call upon Me; I will respond to you.'" — Quran 40:60*

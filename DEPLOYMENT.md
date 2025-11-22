# Deployment Guide - Vercel

## Prerequisites
- GitHub account
- Vercel account (sign up at https://vercel.com)

## Step 1: Push to GitHub

1. **Create a new repository on GitHub:**
   - Go to https://github.com/new
   - Repository name: `monopoly-heavenly-kingdom` (or your preferred name)
   - Make it Public or Private
   - **DO NOT** initialize with README (we already have one)
   - Click "Create repository"

2. **Push your local code to GitHub:**
   ```bash
   git remote add origin https://github.com/cheuqar/monopoly-heavenly-kingdom.git
   git branch -M main
   git push -u origin main
   ```
   
   Replace `YOUR_USERNAME` with your actual GitHub username.

## Step 2: Deploy to Vercel

### Option A: Via Vercel Website (Recommended)

1. Go to https://vercel.com
2. Click "Add New Project"
3. Import from GitHub
4. Select your `monopoly-heavenly-kingdom` repository
5. Vercel will auto-detect the configuration
6. Click "Deploy"
7. Wait 2-3 minutes for deployment
8. Visit your live site at the provided URL!

### Option B: Via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel
   ```

4. Follow the prompts (accept defaults)
5. For production deployment:
   ```bash
   vercel --prod
   ```

## Configuration Explained

The `vercel.json` file tells Vercel:
- Build command: `cd app && npm install && npm run build`
- Output directory: `app/dist` (where Vite builds to)
- Framework: Vite
- Rewrites: SPA routing (all routes go to index.html)

## Post-Deployment

### Custom Domain (Optional)
1. In Vercel dashboard, go to your project
2. Click "Settings" → "Domains"
3. Add your custom domain

### Environment Variables (If Needed)
1. Go to project settings
2. Click "Environment Variables"
3. Add any needed variables

## Updates

To deploy updates:
```bash
git add .
git commit -m "Your update message"
git push
```

Vercel will automatically redeploy on every push to main branch!

## Troubleshooting

### Build Failed
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Test build locally: `cd app && npm run build`

### Video Not Loading
- Ensure `opening.mp4` is in `app/public/` directory
- Check file size (Vercel has 100MB limit for Pro, 5MB for free)

### 404 Errors
- The `vercel.json` rewrites should handle this
- Check that all routes are client-side only

## Your Project is Ready! 🚀

Once deployed, share your game URL with friends!

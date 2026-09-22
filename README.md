# QuantumCount • Modern Pro Counter Experience

A high-performance, beautifully designed multi-tab digital counter application built with React, Vite, and `react-icons`.

## 🚀 Features
- **Multi-Counter Management**: Run multiple categorized counters side-by-side (Fitness, Wellness, Productivity, Auditing).
- **Persistent Storage**: All counters, logs, active tabs, settings, and telemetry persist across page refreshes via `localStorage`.
- **Target Milestones & Celebration**: Set goals with visual progress bars and confetti celebration when achieved.
- **Tactile Audio Feedback**: Web Audio API synthesized clicks and fanfares without external audio files.
- **Activity History & Undo**: Step-by-step history log with one-click undo support.
- **Keyboard Navigation**: Space / Arrow keys for fast incrementing and decrementing.
- **Full SEO Optimization**: Open Graph tags, Twitter cards, meta descriptions, and Google Schema.org JSON-LD structured data.

---

## 🌐 Deploying to Vercel

### Option 1: Deploy via GitHub (Recommended)
1. Push this repository to GitHub:
   ```bash
   git remote add origin https://github.com/<your-username>/counter-app.git
   git push -u origin main
   ```
2. Go to [vercel.com](https://vercel.com/) and log in.
3. Click **"Add New..."** > **"Project"**.
4. Import your `counter-app` repository.
5. Vercel will automatically detect:
   - **Framework Preset**: Vite
   - **Build Command**: `vite build`
   - **Output Directory**: `dist`
6. Click **Deploy**.

---

### Option 2: Deploy using Vercel CLI
Run the following command in your terminal from the project directory:
```bash
npx vercel
```
Follow the prompt instructions (default settings will work out of the box). For production deployment:
```bash
npx vercel --prod
```

---

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Start local dev server
npm run dev

# Build production bundle
npm run build

# Preview production build locally
npm run preview
```

# LINE Bot AI - Railway Deployment Guide

## Features
- LINE Bot with AI Chat (Groq)
- Text-to-Speech (Speechify)
- Google Search Integration
- Audio file upload to Cloudinary

## Deploy to Railway

### 1. Prerequisites
- GitHub account
- Railway account (sign up at https://railway.app)
- LINE Bot account
- Groq API key
- Cloudinary account

### 2. Push to GitHub
```bash
cd c:\Users\Kerwin_Chen\Desktop\line-bot-ai
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

### 3. Deploy on Railway

1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway will automatically detect and deploy your Node.js app

### 4. Configure Environment Variables

In Railway dashboard, go to your project → Variables tab and add:

```
LINE_CHANNEL_ACCESS_TOKEN=your_actual_token
LINE_CHANNEL_SECRET=your_actual_secret
GROQ_API_KEY=your_groq_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
SPEECHIFY_API_KEY=your_speechify_key
PORT=3000
```

### 5. Get Your Railway URL

After deployment, Railway will provide a URL like:
`https://your-app.up.railway.app`

### 6. Configure LINE Webhook

1. Go to LINE Developers Console
2. Select your channel
3. Go to Messaging API tab
4. Set Webhook URL to: `https://your-app.up.railway.app/webhook`
5. Enable "Use webhook"
6. Disable "Auto-reply messages" (optional)

### 7. Test Your Bot

Add your bot as a friend in LINE and send a message!

## Commands

- Regular chat - AI powered responses
- `/tts <text>` - Convert text to speech
- `/google <query>` - Search Google
- `/google <query> -n 5` - Search with custom result count

## Troubleshooting

### TTS Not Working
- The app now saves audio files locally first before uploading to Cloudinary
- Make sure Cloudinary credentials are correct
- Check Railway logs for errors

### Bot Not Responding
- Verify all environment variables are set
- Check LINE webhook URL is correct
- Ensure webhook is enabled in LINE console
- View logs in Railway dashboard

## Local Development

```bash
npm install
# Create .env file with your credentials
node index.js
```

## Support

Check Railway logs for debugging:
- Go to your project in Railway
- Click on the deployment
- View "Logs" tab

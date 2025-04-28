# Ilé-MVP Deployment Guide

This guide outlines the steps to deploy the Ilé-MVP ecosystem to Render and Vercel.

## Deployment Strategy

We're using a dual-platform approach:

1. **Frontend (React Miniapp)**: Deployed on Vercel
2. **Backend (Node.js/Express)**: Deployed on Render
3. **ModernBot (C# .NET)**: Deployed on Render as a separate service

To maximize free tier resources, we recommend using two Render accounts - one for the backend and one for the ModernBot.

## 1. Backend Deployment (Render)

### Prerequisites
- A Render account
- MongoDB Atlas account with a database set up

### Steps

1. **Create a Web Service**
   - Log in to Render
   - Click "New +" and select "Web Service"
   - Connect your GitHub repository
   - Select the repository and branch

2. **Configure the Service**
   - Name: `ile-mvp-backend`
   - Root Directory: `backend`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `node index.js`
   - Select the Free plan

3. **Add Environment Variables**
   - Click on "Environment" tab
   - Add the following variables:
     - `MONGODB_URI`: Your MongoDB connection string
     - `BOT_API_KEY`: A secure API key for bot integration
     - `JWT_SECRET`: A secure secret for JWT tokens
     - `NODE_ENV`: Set to `production`
     - Add any other variables from `.env.example`

4. **Deploy**
   - Click "Create Web Service"
   - Wait for the deployment to complete
   - Note the URL (e.g., `https://ile-mvp-backend.onrender.com`)

## 2. ModernBot Deployment (Render)

### Prerequisites
- A second Render account (recommended)
- .NET 9 SDK installed locally

### Steps

1. **Build the Bot Locally**
   - Navigate to `/telegramReferralBot/ModernBot`
   - Run `dotnet publish -c Release`

2. **Create a Web Service**
   - Log in to Render (second account)
   - Click "New +" and select "Web Service"
   - Connect your GitHub repository
   - Select the repository and branch

3. **Configure the Service**
   - Name: `ile-mvp-bot`
   - Root Directory: `telegramReferralBot/ModernBot`
   - Environment: `Docker`
   - Select the Free plan

4. **Add Environment Variables**
   - Click on "Environment" tab
   - Add the following variables:
     - `BACKEND_URL`: URL of your backend (e.g., `https://ile-mvp-backend.onrender.com`)
     - `BOT_API_KEY`: Same API key used in the backend

5. **Add a Persistent Disk**
   - Click on "Disks" tab
   - Add a disk with at least 1GB
   - Mount path: `/app/data`

6. **Deploy**
   - Click "Create Web Service"
   - Wait for the deployment to complete

## 3. Update Frontend Configuration (Vercel)

The frontend is already deployed at `miniapp-kappa-bay.vercel.app`, but you need to update its configuration:

1. **Log in to Vercel**
2. **Navigate to your project**
3. **Update Environment Variables**
   - `VITE_API_URL`: URL of your backend (e.g., `https://ile-mvp-backend.onrender.com`)
4. **Redeploy**
   - Trigger a new deployment

## 4. Testing the Deployment

1. **Test Backend API**
   - Use Postman or curl to test endpoints
   - Example: `curl https://ile-mvp-backend.onrender.com/api/health`

2. **Test ModernBot**
   - Send commands to your Telegram bot
   - Check if it responds correctly
   - Verify integration with backend

3. **Test Frontend**
   - Open the Telegram Mini App
   - Verify authentication works
   - Test referral functionality

## 5. Monitoring and Maintenance

- **Render Dashboard**: Monitor resource usage
- **Logs**: Check for errors and issues
- **Database**: Regularly backup your MongoDB data

## 6. Troubleshooting

### Common Issues

1. **Cold Starts**: Render free tier has cold starts. First request may be slow.
2. **Memory Limits**: Free tier has limited memory. Monitor usage.
3. **Hours Limit**: Free tier has 750 hours/month. Use two accounts if needed.

### Solutions

1. **Keep Services Warm**: Set up a cron job to ping your services
2. **Optimize Code**: Reduce memory usage where possible
3. **Monitor Usage**: Regularly check Render dashboard

## 7. Production Considerations

For a production environment, consider:

1. **Upgrading to Paid Plans**: For better performance and no cold starts
2. **Setting Up CI/CD**: For automated deployments
3. **Adding Monitoring Tools**: Like Sentry for error tracking
4. **Implementing Proper Logging**: For better debugging
5. **Regular Backups**: For data safety

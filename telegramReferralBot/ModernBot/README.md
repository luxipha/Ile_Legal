# IleRefer Bot Deployment Guide

This guide explains how to deploy the IleRefer Telegram bot to Render.

## Prerequisites

- A Render account (free tier is sufficient for testing)
- A GitHub repository containing this code

## Deployment Steps

### Option 1: Deploy via Render Dashboard (Recommended)

1. Log in to your Render account
2. Click "New +" and select "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: ilerefer-bot
   - **Environment**: Docker
   - **Region**: Frankfurt (or your preferred region)
   - **Branch**: main (or your preferred branch)
   - **Plan**: Free

5. Add the following environment variables:
   - `BACKEND_URL`: https://ile-backend.onrender.com

6. Add your configuration file as a Secret File:
   - Go to the "Secrets" tab
   - Click "Add Secret"
   - Select "File"
   - **Key**: config
   - **File contents**: Copy and paste the contents of your local config.conf file
   - The file will be mounted at `/app/config.conf` in your container

7. Click "Create Web Service"

### Option 2: Deploy via render.yaml (Blueprint)

1. Push the code with the `render.yaml` file to your GitHub repository
2. Go to the Render Dashboard
3. Click "New +" and select "Blueprint"
4. Connect your GitHub repository
5. Render will detect the `render.yaml` file and prompt you to configure the service
6. When prompted for secrets, upload your local config.conf file as the "config" secret

## Keeping the Bot Active (Free Tier)

Since Render's free tier puts services to sleep after 15 minutes of inactivity:

1. Set up an external service like UptimeRobot (https://uptimerobot.com)
2. Create a new monitor in UptimeRobot:
   - **Monitor Type**: HTTP(s)
   - **Friendly Name**: IleRefer Bot
   - **URL**: Your Render service URL (e.g., https://ilerefer-bot.onrender.com)
   - **Monitoring Interval**: 5 minutes

This will ping your service every 5 minutes, preventing it from sleeping.

## Troubleshooting

- **Bot not responding**: Check the Render logs to see if the service is running
- **Connection issues**: Verify that the `BACKEND_URL` is correct
- **Configuration errors**: Ensure the Secret File was uploaded correctly

## Upgrading to Paid Tier

If you need more reliability, consider upgrading to Render's "Starter" plan ($7/month) which doesn't sleep and provides better performance.

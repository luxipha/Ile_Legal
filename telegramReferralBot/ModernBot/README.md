# IleRefer Bot Deployment Guide

This guide explains how to deploy the IleRefer Telegram bot to a cloud provider.

## Prerequisites

- A cloud provider account (Render, Digital Ocean, or Google Cloud)
- A GitHub repository containing this code
- A MongoDB database (Atlas or self-hosted)

## MongoDB Integration

The bot now uses the backend's MongoDB for persistent data storage. This ensures that all user data, referrals, and points are preserved across bot restarts and deployments, and stays in sync with the main backend.

### Using the Backend's MongoDB

Instead of creating a separate MongoDB instance, the bot connects directly to the same MongoDB database used by the Ile backend. This provides several advantages:

1. **Data Consistency**: All user data is stored in one place
2. **Simplified Management**: No need to maintain separate databases
3. **Seamless Integration**: User data from the bot is immediately available to the backend

### Configuring the Bot for Backend MongoDB

Add the following to your `config.conf` file:

```
# MongoDB connection string from the backend
mongoDb=mongodb+srv://Ile-admin:password@clusterile.aqtxsry.mongodb.net/ileDB?retryWrites=true&w=majority

# MongoDB database name from the backend (usually ileDB)
mongoDbName=ileDB

# Backend API URL for synchronization
backendUrl=https://ile-backend.onrender.com
```

Replace the connection string with the actual backend MongoDB connection string.

### Data Model Integration

The bot's data models have been aligned with the backend schema:

- **Users**: Stored in the backend's `users` collection with `telegramChatId` field
- **Referrals**: Stored in a `referrals` collection
- **Activities**: Stored in an `activities` collection
- **Referral Links**: Stored in a `reflinks` collection

This integration ensures that all data is preserved and accessible by both the bot and the backend.

## Environment Variables

The following environment variables are required for production deployment:

### Required Variables

```
# MongoDB Connection
MONGODB_CONNECTION_STRING=mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority
MONGODB_DATABASE_NAME=ileDB-prod

# Telegram Bot Configuration
BOT_TOKEN=your_telegram_bot_token
BOT_API_KEY=your_telegram_bot_token

# Backend Integration
BACKEND_URL=https://api.ile.africa

# Admin Configuration
ADMIN_PASSWORD=strong_password_here

# Group and Bot Links
LINK_GROUP=https://telegram.me/your_group_name
LINK_BOT=https://telegram.me/your_bot_name

# Points System Configuration
START_DATE=MM/DD/YYYY  # Format: month/day/year
NUMBER_OF_DAYS=365
MAX_POINTS_PER_DAY=20
THRESHOLD_FOR_MESSAGE_POINT=10
JOIN_REWARD=30
REFERRAL_REWARD=150
STREAK_REWARD=300
LEADERBOARD_REWARD=200
```

### Variable Descriptions

- **MONGODB_CONNECTION_STRING**: Full connection string to your MongoDB database
- **MONGODB_DATABASE_NAME**: Name of the MongoDB database (use ileDB-prod for production)
- **BOT_TOKEN**: Telegram Bot API token obtained from BotFather
- **BOT_API_KEY**: Same as BOT_TOKEN, used for API authentication
- **BACKEND_URL**: URL of the Ile backend API for points synchronization
- **ADMIN_PASSWORD**: Password for admin commands (use a strong password in production)
- **LINK_GROUP**: Invite link to your Telegram group
- **LINK_BOT**: Direct link to your Telegram bot
- **START_DATE**: Start date for the points system (MM/DD/YYYY format)
- **NUMBER_OF_DAYS**: Duration of the points campaign in days
- **MAX_POINTS_PER_DAY**: Maximum points a user can earn per day
- **THRESHOLD_FOR_MESSAGE_POINT**: Number of messages required to earn points
- **JOIN_REWARD**: Points awarded for joining the group
- **REFERRAL_REWARD**: Points awarded for successful referrals
- **STREAK_REWARD**: Points awarded for maintaining a streak
- **LEADERBOARD_REWARD**: Points awarded for leaderboard placement

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

# IleReferBot Deployment Guide

This guide explains how to deploy the latest version of the IleReferBot with all the new features.

## New Features Overview

The latest version includes several important enhancements:

1. **Group Join Reminder System**
   - Tracks users who haven't joined the group or aren't active
   - Sends targeted reminders based on user state
   - Configurable reminder intervals

2. **Daily Streak Counter**
   - Tracks user activity streaks
   - Rewards consistent participation
   - Sends milestone notifications (7 days, 30 days, etc.)

3. **Visual Progress Indicators**
   - Enhanced `/myPoints` command with visual progress bar
   - Shows percentage completion to next stage
   - Displays points needed for next level

4. **Admin Dashboard**
   - Interactive admin interface with categorized functions
   - Secure password authentication
   - User management, group settings, and statistics

## Deployment Steps

### 1. Environment Configuration

Ensure all required environment variables are set in your production environment:

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

### 2. Deployment Options

#### Option A: Deploy via Docker

1. Build the Docker image:
   ```bash
   docker build -t ilereferbot:latest .
   ```

2. Run the container:
   ```bash
   docker run -d --name ilereferbot --env-file .env.production ilereferbot:latest
   ```

#### Option B: Deploy to Render

1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Select the `telegramReferralBot/ModernBot` directory
4. Set the build command: `dotnet publish -c Release`
5. Set the start command: `dotnet TelegramReferralBot.dll`
6. Add all environment variables from the list above
7. Deploy the service

### 3. Post-Deployment Verification

After deployment, verify that all features are working correctly:

1. **Admin Dashboard**: Test `/admin 123456` command
2. **Points Display**: Check `/myPoints` command for visual progress bar
3. **Streak Counter**: Verify streak tracking by being active on consecutive days
4. **Reminder System**: Monitor logs for reminder scheduling and delivery

### 4. Monitoring

Monitor the bot's performance using:

1. Render dashboard (if deployed on Render)
2. MongoDB Atlas monitoring (for database performance)
3. Bot's built-in logging system

### 5. Rollback Plan

If issues are encountered:

1. Revert to the `deployed-version` branch
2. Rebuild and redeploy
3. Restore database from backup if necessary

## Troubleshooting

### Common Issues

1. **MongoDB Connection Failures**
   - Check connection string and network access
   - Verify IP whitelist settings in MongoDB Atlas

2. **Missing Environment Variables**
   - Ensure all required variables are set
   - Check for typos in variable names

3. **Reminder System Not Working**
   - Verify that the ReminderService is properly registered
   - Check logs for timer initialization

4. **Admin Dashboard Not Appearing**
   - Confirm admin password is correctly set
   - Check for errors in the authentication flow

For any other issues, check the application logs for detailed error messages.

## Contact

For assistance with deployment, contact the development team at dev@ile.africa.

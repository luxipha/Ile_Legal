#!/bin/bash
set -e

# Define variables
PROJECT_ID="ile-refer-bot"
REGION="us-central1"
SERVICE_NAME="ilerefer-bot"
IMAGE_NAME="ilerefer-bot"
REPOSITORY="ilerefer-bot-repo"

echo "Building Docker image..."
docker build -t $IMAGE_NAME .

echo "Tagging Docker image..."
docker tag $IMAGE_NAME $REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY/$IMAGE_NAME:latest

echo "Pushing Docker image to Artifact Registry..."
docker push $REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY/$IMAGE_NAME:latest

echo "Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image $REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY/$IMAGE_NAME:latest \
  --platform managed \
  --region $REGION \
  --project $PROJECT_ID \
  --port 8080 \
  --allow-unauthenticated \
  --set-env-vars="DOTNET_ENVIRONMENT=Production" \
  --update-secrets="MONGODB_CONNECTION_STRING=MONGODB_CONNECTION_STRING:latest,MONGODB_DATABASE_NAME=MONGODB_DATABASE_NAME:latest,BOT_TOKEN=BOT_TOKEN:latest,BOT_API_KEY=BOT_API_KEY:latest,BACKEND_URL=BACKEND_URL:latest,ADMIN_PASSWORD=ADMIN_PASSWORD:latest,LINK_GROUP=LINK_GROUP:latest,LINK_BOT=LINK_BOT:latest,START_DATE=START_DATE:latest,NUMBER_OF_DAYS=NUMBER_OF_DAYS:latest,MAX_POINTS_PER_DAY=MAX_POINTS_PER_DAY:latest,THRESHOLD_FOR_MESSAGE_POINT=THRESHOLD_FOR_MESSAGE_POINT:latest,JOIN_REWARD=JOIN_REWARD:latest,REFERRAL_REWARD=REFERRAL_REWARD:latest,STREAK_REWARD=STREAK_REWARD:latest,LEADERBOARD_REWARD=LEADERBOARD_REWARD:latest"

echo "Deployment completed!"

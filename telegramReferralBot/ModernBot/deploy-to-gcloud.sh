#!/bin/bash
set -e

# Configuration
PROJECT_ID="ile-refer-bot"
SERVICE_NAME="ilerefer-bot"
REGION="us-central1"
IMAGE_NAME="ilerefer-bot"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting deployment of IleRefer Bot to Google Cloud Run...${NC}"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Google Cloud SDK (gcloud) is not installed. Please install it first.${NC}"
    echo "Visit: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Please install it first.${NC}"
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Ensure user is logged in to gcloud
echo -e "${YELLOW}Checking Google Cloud authentication...${NC}"
gcloud auth print-access-token &> /dev/null || {
    echo -e "${RED}Not authenticated with Google Cloud.${NC}"
    echo "Please run: gcloud auth login"
    exit 1
}

# Set the project
echo -e "${YELLOW}Setting Google Cloud project to: ${PROJECT_ID}${NC}"
gcloud config set project ${PROJECT_ID} || {
    echo -e "${YELLOW}Project ${PROJECT_ID} doesn't exist. Creating it now...${NC}"
    gcloud projects create ${PROJECT_ID} --name="IleRefer Telegram Bot"
    gcloud config set project ${PROJECT_ID}
    
    # Enable billing (this will open a browser)
    echo -e "${YELLOW}Please enable billing for the project in the browser window that opens...${NC}"
    gcloud billing projects link ${PROJECT_ID} --billing-account=$(gcloud billing accounts list --format="value(ACCOUNT_ID)" | head -1)
}

# Enable required APIs
echo -e "${YELLOW}Enabling required Google Cloud APIs...${NC}"
gcloud services enable artifactregistry.googleapis.com run.googleapis.com cloudbuild.googleapis.com secretmanager.googleapis.com

# Create Artifact Registry repository if it doesn't exist
echo -e "${YELLOW}Setting up Artifact Registry repository...${NC}"
gcloud artifacts repositories describe ${IMAGE_NAME}-repo --location=${REGION} &> /dev/null || {
    echo -e "${YELLOW}Creating Artifact Registry repository: ${IMAGE_NAME}-repo${NC}"
    gcloud artifacts repositories create ${IMAGE_NAME}-repo --repository-format=docker --location=${REGION}
}

# Configure Docker to use Google Artifact Registry
echo -e "${YELLOW}Configuring Docker for Google Artifact Registry...${NC}"
gcloud auth configure-docker ${REGION}-docker.pkg.dev

# Build the Docker image
echo -e "${YELLOW}Building Docker image...${NC}"
IMAGE_URL="${REGION}-docker.pkg.dev/${PROJECT_ID}/${IMAGE_NAME}-repo/${IMAGE_NAME}:latest"
docker build -t ${IMAGE_URL} .

# Push the image to Artifact Registry
echo -e "${YELLOW}Pushing image to Artifact Registry...${NC}"
docker push ${IMAGE_URL}

# Get project number for service account
PROJECT_NUMBER=$(gcloud projects describe ${PROJECT_ID} --format="value(projectNumber)")

# Store environment variables in Secret Manager
echo -e "${YELLOW}Setting up environment variables in Secret Manager...${NC}"
ENV_FILE=".env.production"

# Check if the .env.production file exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}${ENV_FILE} file not found!${NC}"
    exit 1
fi

# Create secrets from .env file
while IFS= read -r line || [[ -n "$line" ]]; do
    # Skip empty lines and comments
    if [[ -z "$line" || "$line" =~ ^# ]]; then
        continue
    fi
    
    # Extract key and value
    key=$(echo "$line" | cut -d '=' -f 1)
    value=$(echo "$line" | cut -d '=' -f 2-)
    
    # Check if secret already exists
    if gcloud secrets describe "${key}" &>/dev/null; then
        echo -e "${YELLOW}Secret ${key} already exists. Updating...${NC}"
        echo -n "$value" | gcloud secrets versions add "${key}" --data-file=-
    else
        # Create new secret
        echo -e "${YELLOW}Creating new secret: ${key}${NC}"
        echo -n "$value" | gcloud secrets create "${key}" --data-file=-
    fi
    
    # Grant access to the Cloud Run service account
    gcloud secrets add-iam-policy-binding "${key}" \
        --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
        --role="roles/secretmanager.secretAccessor"
done < "$ENV_FILE"

# Deploy to Cloud Run
echo -e "${YELLOW}Deploying to Cloud Run...${NC}"
gcloud run deploy ${SERVICE_NAME} \
    --image=${IMAGE_URL} \
    --platform=managed \
    --region=${REGION} \
    --allow-unauthenticated \
    --memory=512Mi \
    --cpu=1 \
    --port=8080 \
    --min-instances=1 \
    --max-instances=10 \
    --set-env-vars="DOTNET_RUNNING_IN_CONTAINER=true"

# Get the service URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --platform=managed --region=${REGION} --format="value(status.url)")

echo -e "${GREEN}Deployment complete!${NC}"
echo -e "${GREEN}Your IleRefer Bot is now running at: ${SERVICE_URL}${NC}"
echo -e "${YELLOW}Note: The bot is running in polling mode, so there's no need to access the URL directly.${NC}"
echo -e "${YELLOW}You can check the logs with: gcloud logs read --project=${PROJECT_ID} --resource=cloud_run_revision --service=${SERVICE_NAME}${NC}"

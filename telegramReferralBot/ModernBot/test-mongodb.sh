#!/bin/bash

echo "Building and running MongoDB test..."

# Navigate to the test project directory
cd /Users/abisoye/Projects/Ile-MVP/MongoDbTest

# Build the project
dotnet build

# Run the test
echo "Running MongoDB connection test..."
dotnet run

# Return to the bot directory
cd /Users/abisoye/Projects/Ile-MVP/telegramReferralBot/ModernBot

# Run the bot's MongoDB test class if it exists
if [ -f "TestMongoDb.cs" ]; then
  echo "Running bot's MongoDB integration test..."
  dotnet test /p:StartupObject=ModernBot.TestMongoDb
fi

echo "MongoDB tests completed."
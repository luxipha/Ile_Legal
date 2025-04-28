#!/bin/bash

# Test script for Telegram Referral Bot
echo "Telegram Referral Bot Test Script"
echo "================================="

# Set path to .NET SDK
export PATH=$HOME/.dotnet:$PATH

# Check if .NET is available
if ! command -v dotnet &> /dev/null; then
    echo "Error: .NET SDK not found in PATH. Make sure it's installed correctly."
    exit 1
fi

# Build the project
echo "Building the project..."
$HOME/.dotnet/dotnet build

# Check if build was successful
if [ $? -ne 0 ]; then
    echo "Build failed. Please fix the errors and try again."
    exit 1
fi

# Copy config.conf to output directory if it doesn't exist
if [ ! -f "./bin/Debug/net9.0/config.conf" ]; then
    echo "Copying config.conf to output directory..."
    cp ./config.conf ./bin/Debug/net9.0/
fi

# Create Output directory if it doesn't exist
mkdir -p ./bin/Debug/net9.0/Output

# Choose test mode
echo ""
echo "Choose test mode:"
echo "1. Run the bot normally"
echo "2. Run automated tests"
echo ""
read -p "Enter your choice (1 or 2): " choice

case $choice in
    1)
        echo "Starting the bot..."
        $HOME/.dotnet/dotnet run
        ;;
    2)
        echo "Running automated tests..."
        $HOME/.dotnet/dotnet run test
        ;;
    *)
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac

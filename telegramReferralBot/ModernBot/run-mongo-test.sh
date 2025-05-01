#!/bin/bash
echo "Running MongoDB Integration Test"

# Navigate to the MongoDbTest project
cd /Users/abisoye/Projects/Ile-MVP/MongoDbTest

# Build and run the test
dotnet build && dotnet run

echo "MongoDB integration test completed!"

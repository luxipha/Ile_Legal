FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /app

# Copy csproj and restore dependencies
COPY TelegramReferralBot.csproj ./
RUN dotnet restore TelegramReferralBot.csproj

# Copy everything else and build
COPY . ./
RUN dotnet publish TelegramReferralBot.csproj -c Release -o out

# Build runtime image
FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=build /app/out .

# Expose port for health check
EXPOSE 8080

# Create a directory for config files
RUN mkdir -p /app/config

# Set environment variables
ENV ASPNETCORE_URLS=http://+:8080
ENV DOTNET_RUNNING_IN_CONTAINER=true

# Copy .env file if it exists
COPY .env* ./

# Command to run the application
ENTRYPOINT ["dotnet", "TelegramReferralBot.dll"]

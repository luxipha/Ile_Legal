FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /app

# Copy csproj and restore as distinct layers
COPY *.csproj ./
RUN dotnet restore

# Copy everything else and build
COPY . ./
RUN dotnet publish -c Release -o out

# Build runtime image
FROM mcr.microsoft.com/dotnet/runtime:9.0
WORKDIR /app
COPY --from=build /app/out .

# Copy config files
COPY config.conf .

# Create directory for data files
RUN mkdir -p /app/data

# Environment variables
ENV BACKEND_URL=https://your-backend-url.onrender.com
ENV BOT_API_KEY=your-secure-api-key-here

# Set the entry point
ENTRYPOINT ["dotnet", "TelegramReferralBot.dll"]

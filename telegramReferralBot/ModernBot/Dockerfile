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

# Create directory for data files
RUN mkdir -p /app/data

# Environment variables
ENV BACKEND_URL=https://ile-backend.onrender.com

# Expose port for health check
EXPOSE 5000

# Set the entry point
ENTRYPOINT ["dotnet", "TelegramReferralBot.dll"]

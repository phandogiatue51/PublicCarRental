# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy from the backend folder in root context
COPY ["backend/PublicCarRental.csproj", "backend/"]
RUN dotnet restore "backend/PublicCarRental.csproj"

# Copy everything from backend
COPY backend/ ./backend/
RUN dotnet build "backend/PublicCarRental.csproj" -c Release -o /app/build

# Publish stage
FROM build AS publish
RUN dotnet publish "backend/PublicCarRental.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .
RUN mkdir -p /app/image
ENTRYPOINT ["dotnet", "PublicCarRental.dll"]
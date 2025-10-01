# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy from backend folder context
COPY ["backend/PublicCarRental.csproj", "backend/"]
RUN dotnet restore "backend/PublicCarRental.csproj"

# Copy everything from backend
COPY backend/ .
RUN dotnet build "backend/PublicCarRental.csproj" -c Release -o /app/build

# Publish stage
FROM build AS publish
RUN dotnet publish "backend/PublicCarRental.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .
RUN mkdir -p /app/image
EXPOSE 8080
EXPOSE 8081
ENTRYPOINT ["dotnet", "PublicCarRental.dll"]


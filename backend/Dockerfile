# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["PublicCarRental.csproj", "."]
RUN dotnet restore "PublicCarRental.csproj"
COPY . .
RUN dotnet build "PublicCarRental.csproj" -c Release -o /app/build

# Publish stage
FROM build AS publish
RUN dotnet publish "PublicCarRental.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .
RUN mkdir -p /app/image
ENTRYPOINT ["dotnet", "PublicCarRental.dll"]
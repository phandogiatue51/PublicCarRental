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

# Create the missing image directory
RUN mkdir -p /app/image

# Expose the port your app uses
EXPOSE 7230
EXPOSE 8080
EXPOSE 8081

ENTRYPOINT ["dotnet", "PublicCarRental.dll"]
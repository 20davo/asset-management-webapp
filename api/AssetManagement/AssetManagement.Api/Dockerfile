# Build stage: uses the full .NET SDK to restore packages and publish the app.
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["AssetManagement.Api.csproj", "./"]
RUN dotnet restore "./AssetManagement.Api.csproj"

COPY . .
RUN dotnet publish "./AssetManagement.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage: uses the smaller ASP.NET runtime image to run the published app.
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "AssetManagement.Api.dll"]

# ── Build ────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy project files first so Docker can cache the restore layer
COPY ShareTracker.sln .
COPY src/ShareTracker.API/ShareTracker.API.csproj                       src/ShareTracker.API/
COPY src/ShareTracker.Application/ShareTracker.Application.csproj       src/ShareTracker.Application/
COPY src/ShareTracker.Domain/ShareTracker.Domain.csproj                 src/ShareTracker.Domain/
COPY src/ShareTracker.Infrastructure/ShareTracker.Infrastructure.csproj src/ShareTracker.Infrastructure/

RUN dotnet restore src/ShareTracker.API/ShareTracker.API.csproj

COPY src/ src/
RUN dotnet publish src/ShareTracker.API/ShareTracker.API.csproj \
    -c Release -o /publish --no-self-contained

# ── Runtime ──────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=build /publish .

EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

ENTRYPOINT ["dotnet", "ShareTracker.API.dll"]

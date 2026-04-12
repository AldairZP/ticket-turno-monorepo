FROM mcr.microsoft.com/dotnet/sdk:8.0.100 AS build
WORKDIR /src

COPY ticket-turno.csproj ./
RUN dotnet restore ./ticket-turno.csproj

COPY . .
RUN dotnet publish ./ticket-turno.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0.0 AS final
WORKDIR /app

COPY --from=build /app/publish .

EXPOSE 8080

ENTRYPOINT ["dotnet", "ticket-turno.dll"]

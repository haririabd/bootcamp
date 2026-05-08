FROM mcr.microsoft.com/dotnet/sdk:10.0 AS builder
WORKDIR /src

# Copy the API and generated contracts
COPY services/api-dotnet/ services/api-dotnet/
COPY contracts/ contracts/

WORKDIR /src/services/api-dotnet
RUN dotnet restore
RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runner
WORKDIR /app
COPY --from=builder /app/publish .

EXPOSE 5010
ENV ASPNETCORE_URLS=http://+:5010

ENTRYPOINT ["dotnet", "api-dotnet.dll"]

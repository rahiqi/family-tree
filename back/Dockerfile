FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["back.csproj", "./"]
RUN dotnet restore "back.csproj"
COPY . .
RUN dotnet build "back.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "back.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .
RUN mkdir -p wwwroot/uploads
ENV ASPNETCORE_URLS=http://+:5263
EXPOSE 5263
ENTRYPOINT ["dotnet", "back.dll"]

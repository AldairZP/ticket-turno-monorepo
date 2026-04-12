using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using QuestPDF.Infrastructure;
using ticket_turno.Data;
using ticket_turno.Endpoints;
using ticket_turno.Services;
using ticket_turno.Services.Auth;
using ticket_turno.Services.Documents;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var adminAuthOptions = builder.Configuration.GetSection("AdminAuth").Get<AdminAuthOptions>() ?? new AdminAuthOptions();
builder.Services.AddSingleton(adminAuthOptions);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<ITicketService, TicketService>();
builder.Services.AddScoped<IDocumentFactory, TicketDocumentFactory>();
builder.Services.AddSingleton<ICaptchaService, CaptchaService>();
builder.Services.AddScoped<IAdminAuthService, AdminAuthService>();

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidateLifetime = true,
            ValidIssuer = adminAuthOptions.JwtIssuer,
            ValidAudience = adminAuthOptions.JwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(adminAuthOptions.JwtKey)),
            ClockSkew = TimeSpan.FromMinutes(1)
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
});

var app = builder.Build();

QuestPDF.Settings.License = LicenseType.Community;

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseAuthentication();
app.UseAuthorization();

await using (var scope = app.Services.CreateAsyncScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await dbContext.Database.EnsureCreatedAsync();
    await DbSeeder.SeedAsync(dbContext);
}

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));
app.MapAuthEndpoints();
app.MapTicketEndpoints();
app.MapTicketAdminEndpoints();
app.MapCatalogEndpoints();

app.Run();

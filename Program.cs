using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using PublicCarRental.Helpers;
using PublicCarRental.Models;
using PublicCarRental.Repository.Acc;
using PublicCarRental.Repository.Bran;
using PublicCarRental.Repository.Cont;
using PublicCarRental.Repository.Fav;
using PublicCarRental.Repository.Inv;
using PublicCarRental.Repository.Model;
using PublicCarRental.Repository.Ren;
using PublicCarRental.Repository.Staf;
using PublicCarRental.Repository.Stat;
using PublicCarRental.Repository.Token;
using PublicCarRental.Repository.Trans;
using PublicCarRental.Repository.Typ;
using PublicCarRental.Repository.Vehi;
using PublicCarRental.Service;
using PublicCarRental.Service.Acc;
using PublicCarRental.Service.Bran;
using PublicCarRental.Service.Cont;
using PublicCarRental.Service.Email;
using PublicCarRental.Service.Fav;
using PublicCarRental.Service.Inv;
using PublicCarRental.Service.Mod;
using PublicCarRental.Service.Ren;
using PublicCarRental.Service.Staf;
using PublicCarRental.Service.Stat;
using PublicCarRental.Service.Trans;
using PublicCarRental.Service.Typ;
using PublicCarRental.Service.Veh;
using System.IdentityModel.Tokens.Jwt;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddRateLimiter(options =>
{
    options.AddPolicy("PaymentPolicy", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString(),
            factory: partition => new FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(1)
            }));
});

builder.Services.AddControllers(options =>
{
    // Enable form binding
    options.SuppressImplicitRequiredAttributeForNonNullableReferenceTypes = true;
})
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    });

// Configure form options for file uploads
builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 10485760; // 10MB limit
    options.ValueLengthLimit = int.MaxValue;
    options.ValueCountLimit = int.MaxValue;
    options.KeyLengthLimit = int.MaxValue;
});

// Configure request size limits
builder.Services.Configure<Microsoft.AspNetCore.Server.Kestrel.Core.KestrelServerOptions>(options =>
{
    options.Limits.MaxRequestBodySize = 10485760; // 10MB
});

// Configure IIS options
builder.Services.Configure<IISServerOptions>(options =>
{
    options.MaxRequestBodySize = 10485760; // 10MB
});

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.SetIsOriginAllowed(origin =>
        {
            // Allow all localhost ports and your Railway domain
            return origin.StartsWith("http://localhost:") ||
                   origin.StartsWith("https://localhost:") ||
                   origin.Contains("publiccarrental-production") ||
                   origin.Contains("railway.app");
        })
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials();
    });
});

builder.Services.AddDbContext<EVRentalDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<IStaffRepository, StaffRepository>();
builder.Services.AddScoped<IStaffService, StaffService>();
builder.Services.AddScoped<IEVRenterRepository, EVRenterRepository>();
builder.Services.AddScoped<IEVRenterService, EVRenterService>();
builder.Services.AddScoped<IAccountRepository, AccountRepository>();
builder.Services.AddScoped<IAccountService, AccountService>();
builder.Services.AddScoped<PasswordHelper>();
builder.Services.AddScoped<IVehicleRepository, VehicleRepository>();
builder.Services.AddScoped<IVehicleService, VehicleService>();
builder.Services.AddScoped<IBrandRepository, BrandRepository>();
builder.Services.AddScoped<IBrandService, BrandService>();
builder.Services.AddScoped<IModelRepository, ModelRepository>();
builder.Services.AddScoped<IModelService, ModelService>();
builder.Services.AddScoped<IInvoiceRepository, InvoiceRepository>();
builder.Services.AddScoped<IInvoiceService, InvoiceService>();
builder.Services.AddScoped<IContractRepository, ContractRepository>();
builder.Services.AddScoped<IContractService, ContractService>();
builder.Services.AddScoped<IStaffRepository, StaffRepository>();
builder.Services.AddScoped<IStaffService, StaffService>();
builder.Services.AddScoped<IStationService, StationService>();
builder.Services.AddScoped<IStationRepository, StationRepository>();
builder.Services.AddScoped<IHelperService, HelperService>();
builder.Services.AddScoped<ITypeRepository, TypeRepository>();
builder.Services.AddScoped<ITypeService, TypeService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<ITokenRepository, TokenRepository>();
builder.Services.AddHostedService<InvoiceCleanupService>();
builder.Services.AddScoped<ITransactionRepository, TransactionRepository>();
builder.Services.AddScoped<ITransactionService,  TransactionService>();
builder.Services.AddScoped<IFavoriteRepository, FavoriteRepository>();
builder.Services.AddScoped<IFavoriteService, FavoriteService>();


var jwtSettings = builder.Configuration.GetSection("Jwt");
var key = jwtSettings["Key"];
var issuer = jwtSettings["Issuer"];
var audiences = jwtSettings["Audiences"];

if (string.IsNullOrEmpty(key))
{
    throw new InvalidOperationException("JWT Key is not configured.");
}

if (string.IsNullOrEmpty(issuer))
{
    throw new InvalidOperationException("JWT Issuer is not configured.");
}

if (string.IsNullOrEmpty(audiences))
{
    throw new InvalidOperationException("JWT Audience is not configured.");
}

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = false,
        ValidateAudience = false,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = false,
        ValidIssuer = issuer,
        ValidAudience = audiences,
        IssuerSigningKey = new SymmetricSecurityKey(Convert.FromBase64String(key)),
        ClockSkew = TimeSpan.Zero
    };
    
    // Ensure proper token extraction
    options.Events = new Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var authHeader = context.Request.Headers["Authorization"].FirstOrDefault();
            Console.WriteLine($"Authorization header: {authHeader}");
            
            if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer "))
            {
                var token = authHeader.Substring("Bearer ".Length).Trim();
                Console.WriteLine($"Extracted token: {token}");
                Console.WriteLine($"Token length: {token.Length}");
                Console.WriteLine($"Token parts count: {token.Split('.').Length}");
                
                // Manual JWT validation test
                try
                {
                    var handler = new JwtSecurityTokenHandler();
                    var jsonToken = handler.ReadJwtToken(token);
                    Console.WriteLine($"Manual JWT validation successful. Issuer: {jsonToken.Issuer}, Audiences: {jsonToken.Audiences}");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Manual JWT validation failed: {ex.Message}");
                }
                
                context.Token = token;
            }
            return Task.CompletedTask;
        },
        OnAuthenticationFailed = context =>
        {
            Console.WriteLine($"JWT Authentication failed: {context.Exception.Message}");
            Console.WriteLine($"Exception type: {context.Exception.GetType().Name}");
            Console.WriteLine($"Stack trace: {context.Exception.StackTrace}");
            return Task.CompletedTask;
        },
        OnTokenValidated = context =>
        {
            Console.WriteLine("JWT Token validated successfully");
            return Task.CompletedTask;
        }
    };
});



builder.Services.AddSwaggerGen(c =>
{
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});


var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();
app.UseHttpsRedirection();

app.UseCors("AllowReactApp");

// Enable static files serving
app.UseStaticFiles();

// Enable static files serving for images
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(
        Path.Combine(Directory.GetCurrentDirectory(), "image")),
    RequestPath = "/image"
});

app.UseAuthentication();
app.UseAuthorization();


app.MapControllers();

app.Run();

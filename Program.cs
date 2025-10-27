using AutoMapper;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using PublicCarRental.Application.Service;
using PublicCarRental.Application.Service.Acc;
using PublicCarRental.Application.Service.Bran;
using PublicCarRental.Application.Service.Cont;
using PublicCarRental.Application.Service.Dashboard;
using PublicCarRental.Application.Service.Email;
using PublicCarRental.Application.Service.Image;
using PublicCarRental.Application.Service.Inv;
using PublicCarRental.Application.Service.Mod;
using PublicCarRental.Application.Service.Pay;
using PublicCarRental.Application.Service.PDF;
using PublicCarRental.Application.Service.Rabbit;
using PublicCarRental.Application.Service.Redis;
using PublicCarRental.Application.Service.Ren;
using PublicCarRental.Application.Service.Staf;
using PublicCarRental.Application.Service.Stat;
using PublicCarRental.Application.Service.Trans;
using PublicCarRental.Application.Service.Typ;
using PublicCarRental.Application.Service.Veh;
using PublicCarRental.Infrastructure.Data.Models;
using PublicCarRental.Infrastructure.Data.Models.Configuration;
using PublicCarRental.Infrastructure.Data.Repository.Acc;
using PublicCarRental.Infrastructure.Data.Repository.Bran;
using PublicCarRental.Infrastructure.Data.Repository.Cont;
using PublicCarRental.Infrastructure.Data.Repository.Fav;
using PublicCarRental.Infrastructure.Data.Repository.Inv;
using PublicCarRental.Infrastructure.Data.Repository.Mod;
using PublicCarRental.Infrastructure.Data.Repository.Ren;
using PublicCarRental.Infrastructure.Data.Repository.Staf;
using PublicCarRental.Infrastructure.Data.Repository.Stat;
using PublicCarRental.Infrastructure.Data.Repository.Token;
using PublicCarRental.Infrastructure.Data.Repository.Trans;
using PublicCarRental.Infrastructure.Data.Repository.Typ;
using PublicCarRental.Infrastructure.Data.Repository.Vehi;
using PublicCarRental.Infrastructure.Helpers;
using PublicCarRental.Infrastructure.Signal;
using QuestPDF;
using QuestPDF.Infrastructure;
using SendGrid.Extensions.DependencyInjection;
using StackExchange.Redis;
using System.IdentityModel.Tokens.Jwt;
using System.Text.Json.Serialization;
using Task = System.Threading.Tasks.Task;


var builder = WebApplication.CreateBuilder(args);

Settings.License = LicenseType.Community;

builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration.GetConnectionString("Redis");
    options.InstanceName = "CarRental_";
});

builder.Services.AddSingleton<IConnectionMultiplexer>(sp =>
{
    var redisConnectionString = builder.Configuration.GetConnectionString("Redis");
    return ConnectionMultiplexer.Connect(redisConnectionString);
});

builder.Services.Configure<RabbitMQSettings>(builder.Configuration.GetSection("RabbitMQ"));
builder.Services.AddSingleton<IRabbitMQConnection>(provider =>
{
    var settings = provider.GetRequiredService<IOptions<RabbitMQSettings>>().Value;
    var logger = provider.GetRequiredService<ILogger<RabbitMQConnection>>();

    return new RabbitMQConnection(settings.ConnectionString, logger);
});

builder.Services.AddControllers(options =>
{
    options.SuppressImplicitRequiredAttributeForNonNullableReferenceTypes = true;
})
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    });

builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 10485760; // 10MB limit
    options.ValueLengthLimit = int.MaxValue;
    options.ValueCountLimit = int.MaxValue;
    options.KeyLengthLimit = int.MaxValue;
});

builder.Services.Configure<Microsoft.AspNetCore.Server.Kestrel.Core.KestrelServerOptions>(options =>
{
    options.Limits.MaxRequestBodySize = 10485760; // 10MB
});

builder.Services.Configure<IISServerOptions>(options =>
{
    options.MaxRequestBodySize = 10485760; // 10MB
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins(
            "https://fortunate-art-production.up.railway.app", 
            "https://publiccarrental-production-b7c5.up.railway.app",
            "http://localhost:3000", 
            "https://localhost:3000",
            "http://localhost:5173", 
            "https://localhost:5173"
        )
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
builder.Services.AddScoped<IStationService, StationService>();
builder.Services.AddScoped<IStationRepository, StationRepository>();
builder.Services.AddScoped<IHelperService, HelperService>();
builder.Services.AddScoped<ITypeRepository, TypeRepository>();
builder.Services.AddScoped<ITypeService, TypeService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<ITokenRepository, TokenRepository>();
builder.Services.AddScoped<ITransactionRepository, TransactionRepository>();
builder.Services.AddScoped<ITransactionService, TransactionService>();
builder.Services.AddScoped<IFavoriteRepository, FavoriteRepository>();
builder.Services.AddScoped<IFavoriteService, FavoriteService>();
builder.Services.AddScoped<IPayOSService, PayOSService>();
builder.Services.AddScoped<GenericCacheDecorator>();
builder.Services.AddScoped<BaseMessageProducer>();
builder.Services.AddScoped<EmailProducerService>();
builder.Services.AddHostedService<EmailConsumerService>();
builder.Services.AddScoped<BookingEventProducerService>();
builder.Services.AddScoped<IContractModificationService, ContractModificationService>();

builder.Services.AddScoped<IImageStorageService, CloudinaryService>();
builder.Services.AddScoped<IDocumentRepository, DocumentRepository>();
builder.Services.AddScoped<IDocumentService,  DocumentService>();
builder.Services.AddScoped<IAccidentRepository, AccidentRepository>();
builder.Services.AddScoped<IAccidentService, AccidentService>();
builder.Services.AddScoped<IRatingRepository, RatingRepository>();
builder.Services.AddScoped<IRatingService, RatingService>();

builder.Services.AddHostedService<AccidentConsumerService>();
builder.Services.AddScoped<AccidentEventProducerService>();
builder.Services.AddHostedService<NotificationConsumerService>();
builder.Services.AddScoped<IDistributedLockService, DistributedLockService>();

builder.Services.AddScoped<IPdfStorageService, PdfStorageService>();
builder.Services.AddScoped<IPdfService, PdfService>();

builder.Services.AddScoped<IBookingService, BookingService>();
builder.Services.AddScoped<IReceiptGenerationProducerService, ReceiptGenerationProducerService>();
builder.Services.AddScoped<IContractGenerationProducerService, ContractGenerationProducerService>();

builder.Services.AddHostedService<ReceiptGenerationConsumerService>();
builder.Services.AddHostedService<ContractGenerationConsumerService>();

builder.Services.AddScoped<IPaymentProcessingService, PaymentProcessingService>();

builder.Services.AddScoped<IStaffDashboardService, StaffDashboardService>();
builder.Services.AddScoped<IAdminDashboardService, AdminDashboardService>();

builder.Services.AddSendGrid(options =>
{
    options.ApiKey = builder.Configuration["EmailSettings:Password"];
});

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

    options.Events = new Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var authHeader = context.Request.Headers["Authorization"].FirstOrDefault();

            if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer "))
            {
                var token = authHeader.Substring("Bearer ".Length).Trim();
                Console.WriteLine($"Extracted token: {token}");
                Console.WriteLine($"Token length: {token.Length}");
                Console.WriteLine($"Token parts count: {token.Split('.').Length}");

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

builder.Services.AddHttpClient();

builder.Services.AddSignalR();

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

app.UseRouting();
app.UseCors("AllowReactApp");

app.UseAuthentication();
app.UseAuthorization();

app.MapHub<NotificationHub>("/notificationHub");

app.MapControllers();

app.UseSwagger();
app.UseSwaggerUI();
app.UseHttpsRedirection();

app.Run();
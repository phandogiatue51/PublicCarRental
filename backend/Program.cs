using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using PublicCarRental.Helpers;
using PublicCarRental.Models;
using PublicCarRental.Repository.Acc;
using PublicCarRental.Repository.Bran;
using PublicCarRental.Repository.Cont;
using PublicCarRental.Repository.Inv;
using PublicCarRental.Repository.Model;
using PublicCarRental.Repository.Renter;
using PublicCarRental.Repository.Staf;
using PublicCarRental.Repository.Stat;
using PublicCarRental.Repository.Vehi;
using PublicCarRental.Service;
using PublicCarRental.Service.Acc;
using PublicCarRental.Service.Bran;
using PublicCarRental.Service.Cont;
using PublicCarRental.Service.Inv;
using PublicCarRental.Service.Mod;
using PublicCarRental.Service.Renter;
using PublicCarRental.Service.Staf;
using PublicCarRental.Service.Stat;
using PublicCarRental.Service.Typ;
using PublicCarRental.Service.Veh;
using PublicCarRental.Service.Typ;
using PublicCarRental.Repository.Typ;
using System.Security.Claims;
using System.Text;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Server.IISIntegration;
using Microsoft.Extensions.FileProviders;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

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

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "https://localhost:3000")
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
builder.Services.AddScoped<IContInvHelperService, ContInvHelperService>();
builder.Services.AddScoped<ITypeRepository, TypeRepository>();
builder.Services.AddScoped<ITypeService, TypeService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// Enable CORS
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

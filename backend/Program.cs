using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using PublicCarRental.Helpers;
using PublicCarRental.Models;
using PublicCarRental.Repository.Acc;
using PublicCarRental.Repository.Bran;
using PublicCarRental.Repository.Model;
using PublicCarRental.Repository.Renter;
using PublicCarRental.Repository.Staf;
using PublicCarRental.Repository.Vehi;
using PublicCarRental.Service.Acc;
using PublicCarRental.Service.Renter;
using PublicCarRental.Service.Staf;
using PublicCarRental.Service.Veh;
using System.Security.Claims;
using System.Text;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    });

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

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
builder.Services.AddScoped<BrandRepository, BrandRepository>();
builder.Services.AddScoped<ModelRepository, ModelRepository>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthentication();   
app.UseAuthorization();


app.MapControllers();

app.Run();

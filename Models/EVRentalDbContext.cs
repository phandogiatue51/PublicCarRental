using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Reflection.Emit;

namespace PublicCarRental.Models
{
    public class EVRentalDbContext : DbContext
    {
        public EVRentalDbContext(DbContextOptions<EVRentalDbContext> options) : base(options) { }

        public DbSet<EVRenter> EVRenters { get; set; }
        public DbSet<Vehicle> Vehicles { get; set; }
        public DbSet<Account> Accounts { get; set; }
        public DbSet<Station> Stations { get; set; }
        public DbSet<RentalContract> RentalContracts { get; set; }
        public DbSet<Staff> Staffs { get; set; }
        public DbSet<Admin> Admins { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Account ↔ Staff (One-to-One)
            modelBuilder.Entity<Account>()
                .HasOne(a => a.Staff)
                .WithOne(s => s.Account)
                .HasForeignKey<Staff>(s => s.AccountId);

            // Account ↔ Admin (One-to-One)
            modelBuilder.Entity<Account>()
                .HasOne(a => a.Admin)
                .WithOne(ad => ad.Account)
                .HasForeignKey<Admin>(ad => ad.AccountId);

            // Account ↔ EVRenter (One-to-One)
            modelBuilder.Entity<Account>()
                .HasOne(a => a.EVRenter)
                .WithOne(ev => ev.Account)
                .HasForeignKey<EVRenter>(ev => ev.AccountId);

            modelBuilder.Entity<Vehicle>()
                .HasOne(v => v.Station)
                .WithMany(s => s.Vehicles)
                .HasForeignKey(v => v.StationId);

            modelBuilder.Entity<RentalContract>()
                .HasOne(rc => rc.EVRenter)
                .WithMany(r => r.RentalContracts)
                .HasForeignKey(rc => rc.EVRenterId);

            modelBuilder.Entity<RentalContract>()
                .HasOne(rc => rc.Vehicle)
                .WithMany(v => v.RentalContracts)
                .HasForeignKey(rc => rc.VehicleId);

            modelBuilder.Entity<RentalContract>()
                .HasOne(rc => rc.Station)
                .WithMany(s => s.RentalContracts)
                .HasForeignKey(rc => rc.StationId);
        }
    }
}

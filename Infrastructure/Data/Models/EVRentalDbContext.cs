using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Reflection.Emit;

namespace PublicCarRental.Infrastructure.Data.Models
{
    public class EVRentalDbContext : DbContext
    {
        public EVRentalDbContext(DbContextOptions<EVRentalDbContext> options) : base(options) { }

        public DbSet<EVRenter> EVRenters { get; set; }
        public DbSet<Vehicle> Vehicles { get; set; }
        public DbSet<Account> Accounts { get; set; }
        public DbSet<Station> Stations { get; set; }
        public DbSet<RentalContract> RentalContracts { get; set; }
        public DbSet<Invoice> Invoices { get; set; }
        public DbSet<Staff> Staffs { get; set; }
        public DbSet<VehicleModel> VehicleModels { get; set; }
        public DbSet<VehicleBrand> VehicleBrands { get; set; }
        public DbSet<VehicleType> VehicleTypes { get; set; }
        public DbSet<Favorite> Favorites { get; set; }
        public DbSet<Transaction> Transactions { get; set; }
        public DbSet<Rating> Ratings { get; set; }
        public DbSet<AccountDocument> AccountDocuments { get; set; }
        public DbSet<AccidentReport> AccidentReports { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Account>()
                .HasIndex(a => a.Email)
                .IsUnique();

            modelBuilder.Entity<Account>()
                .HasIndex(a => a.PhoneNumber)
                .IsUnique();

            modelBuilder.Entity<Account>()
                .HasIndex(a => a.IdentityCardNumber)
                .IsUnique();

            modelBuilder.Entity<Account>()
                .Property(a => a.Role)
                .HasConversion<int>();

            modelBuilder.Entity<Account>()
                .Property(a => a.Status)
                .HasConversion<int>();

            modelBuilder.Entity<EVRenter>()
               .HasOne(r => r.Account)
               .WithOne()
               .HasForeignKey<EVRenter>(r => r.AccountId)
               .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<EVRenter>()
               .HasIndex(a => a.LicenseNumber)
               .IsUnique();

            modelBuilder.Entity<Staff>()
                .HasOne(s => s.Account)
                .WithOne()
                .HasForeignKey<Staff>(s => s.AccountId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Vehicle>()
                .HasOne(v => v.Station)
                .WithMany(s => s.Vehicles)
                .HasForeignKey(v => v.StationId);

            modelBuilder.Entity<Vehicle>()
                  .Property(v => v.Status)
                  .HasConversion<int>();

            modelBuilder.Entity<Vehicle>()
                .HasIndex(s => s.LicensePlate)
                .IsUnique();

            modelBuilder.Entity<Vehicle>()
                .HasOne(v => v.Model)
                .WithMany(m => m.Vehicles)
                .HasForeignKey(v => v.ModelId);

            modelBuilder.Entity<VehicleModel>()
                .HasOne(m => m.Brand)
                .WithMany(b => b.Models)
                .HasForeignKey(m => m.BrandId);

            modelBuilder.Entity<VehicleModel>()
                .HasOne(m => m.Type)
                .WithMany(t => t.Models)
                .HasForeignKey(m => m.TypeId);

            modelBuilder.Entity<RentalContract>()
                .HasOne(rc => rc.EVRenter)
                .WithMany(r => r.RentalContracts)
                .HasForeignKey(rc => rc.EVRenterId);

            modelBuilder.Entity<RentalContract>()
                .Property(r => r.Status)
                .HasConversion<int>()
                ;
            modelBuilder.Entity<RentalContract>()
                .HasOne(rc => rc.Vehicle)
                .WithMany(v => v.RentalContracts)
                .HasForeignKey(rc => rc.VehicleId);

            modelBuilder.Entity<RentalContract>()
                .HasOne(rc => rc.Station)
                .WithMany(s => s.RentalContracts)
                .HasForeignKey(rc => rc.StationId);

            modelBuilder.Entity<RentalContract>()
                .HasOne(rc => rc.Invoice)
                .WithOne(i => i.Contract)
                .HasForeignKey<Invoice>(i => i.ContractId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Invoice>()
                .Property(i => i.Status)
                .HasConversion<int>();

            modelBuilder.Entity<Favorite>()
               .HasOne(f => f.Account)
               .WithMany(a => a.Favorites)
               .HasForeignKey(f => f.AccountId);

            modelBuilder.Entity<Favorite>()
                .HasOne(f => f.VehicleModel)
                .WithMany(vm => vm.FavoritedBy)
                .HasForeignKey(f => f.ModelId);

            modelBuilder.Entity<Transaction>(entity =>
            {
                entity.ToTable("Transactions");

                entity.HasOne(t => t.Contract)
                      .WithMany()
                      .HasForeignKey(t => t.ContractId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.Property(t => t.Amount)
                      .HasColumnType("decimal(15,2)")
                      .IsRequired();

                entity.Property(t => t.Note)
                      .HasMaxLength(1000);
            });

            modelBuilder.Entity<Rating>()
                    .Property(r => r.Stars)
                    .HasConversion<int>();

            modelBuilder.Entity<Rating>()
                    .HasIndex(r => r.ContractId)
                    .IsUnique();

            modelBuilder.Entity<AccountDocument>(entity =>
            {
                entity.HasKey(e => e.DocumentId);

                entity.HasOne(ud => ud.Account)
                      .WithMany(a => a.AccountDocuments) 
                      .HasForeignKey(ud => ud.AccountId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(ud => ud.AccountId);
                entity.HasIndex(ud => new { ud.AccountId, ud.Type });

                entity.Property(ud => ud.Type)
                      .HasConversion<int>();
                entity.Property(ud => ud.Side)
                      .HasConversion<int>();
            });

            modelBuilder.Entity<AccidentReport>(entity =>
            {
                entity.HasKey(e => e.AccidentId);

                entity.HasOne(ar => ar.Vehicle)
                      .WithMany(v => v.AccidentReports) 
                      .HasForeignKey(ar => ar.VehicleId)
                      .OnDelete(DeleteBehavior.Restrict); 

                entity.HasOne(ar => ar.Contract)
                      .WithMany() 
                      .HasForeignKey(ar => ar.ContractId)
                      .OnDelete(DeleteBehavior.SetNull); 

                entity.HasIndex(ar => ar.VehicleId);
                entity.HasIndex(ar => ar.ContractId);
                entity.HasIndex(ar => ar.StaffId);
                entity.HasIndex(ar => ar.Status);
                entity.HasIndex(ar => ar.ReportedAt);

                entity.Property(ar => ar.Status)
                      .HasConversion<int>();
            });
        }
    }
}

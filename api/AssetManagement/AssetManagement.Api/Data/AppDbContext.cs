using AssetManagement.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace AssetManagement.Api.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        { 
        }

        public DbSet<Equipment> Equipments { get; set; }
        public DbSet<Checkout> Checkouts { get; set; }
    }
}

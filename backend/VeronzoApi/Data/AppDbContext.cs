using Microsoft.EntityFrameworkCore;
using VeronzoApi.Models;

namespace VeronzoApi.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<ContactRequest> ContactRequests => Set<ContactRequest>();
}

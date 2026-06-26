using Microsoft.EntityFrameworkCore;
using MongoDB.EntityFrameworkCore.Extensions;
using back.Models;

namespace back.Data;

public class TreelyDbContext : DbContext
{
    public TreelyDbContext(DbContextOptions<TreelyDbContext> options)
        : base(options)
    {
        Database.AutoTransactionBehavior = AutoTransactionBehavior.Never;
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<FamilyTree> FamilyTrees => Set<FamilyTree>();
    public DbSet<PersonProfile> PersonProfiles => Set<PersonProfile>();
    public DbSet<FamilyParty> FamilyParties => Set<FamilyParty>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Map entities to collections
        modelBuilder.Entity<User>().ToCollection("users");
        modelBuilder.Entity<FamilyTree>().ToCollection("family_trees");
        modelBuilder.Entity<PersonProfile>().ToCollection("person_profiles");
        modelBuilder.Entity<FamilyParty>().ToCollection("family_parties");
    }
}

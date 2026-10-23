
using BizBridge.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace BizBridge.Api.Data;

/// <summary>
/// Configures the BizBridge database tables,
/// primary keys, relationships, and constraints.
/// </summary>
public class BizBridgeDbContext : DbContext
{
    public BizBridgeDbContext(
        DbContextOptions<BizBridgeDbContext> options)
        : base(options)
    {
    }

    // Database tables.
    public DbSet<User> Users => Set<User>();
    public DbSet<Business> Businesses => Set<Business>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Transaction> Transactions => Set<Transaction>();
    public DbSet<PaymentAlert> PaymentAlerts => Set<PaymentAlert>();
    public DbSet<ReadinessCheck> ReadinessChecks => Set<ReadinessCheck>();
    public DbSet<BusinessReadiness> BusinessReadiness => Set<BusinessReadiness>();
    public DbSet<Opportunity> Opportunities => Set<Opportunity>();
    public DbSet<OpportunityApplication> OpportunityApplications
        => Set<OpportunityApplication>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // USER
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(u => u.UserID);

            entity.Property(u => u.FullName)
                .HasMaxLength(120)
                .IsRequired();

            entity.Property(u => u.Email)
                .HasMaxLength(255)
                .IsRequired();

            entity.HasIndex(u => u.Email)
                .IsUnique();

            entity.Property(u => u.PasswordHash)
                .IsRequired();

            entity.Property(u => u.Role)
                .HasMaxLength(30)
                .HasDefaultValue("User")
                .IsRequired();

            entity.ToTable(t => t.HasCheckConstraint(
                "CK_Users_Role",
                "\"Role\" IN ('User', 'OpportunityManager', 'Admin')"));
        });

        // BUSINESS
        modelBuilder.Entity<Business>(entity =>
        {
            entity.HasKey(b => b.BusinessID);

            entity.Property(b => b.BusinessName)
                .HasMaxLength(150)
                .IsRequired();

            entity.Property(b => b.Industry)
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(b => b.Location)
                .HasMaxLength(200);

            entity.Property(b => b.Description)
                .HasMaxLength(1000);

            entity.HasOne(b => b.Owner)
                .WithMany()
                .HasForeignKey(b => b.OwnerUserID)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(b => b.OwnerUserID);
            entity.Property(b => b.OpeningBalance)
                .HasPrecision(18, 2)
                .HasDefaultValue(0m)
                .IsRequired();
        });

        // CATEGORY
        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasKey(c => c.CategoryID);

            entity.Property(c => c.Name)
                .HasMaxLength(80)
                .IsRequired();

            entity.Property(c => c.TransactionType)
                .HasMaxLength(10)
                .IsRequired();

            entity.Property(c => c.IsActive)
                .HasDefaultValue(true);

            // A category belongs to a specific business.
            entity.HasOne(c => c.Business)
                .WithMany()
                .HasForeignKey(c => c.BusinessID)
                .OnDelete(DeleteBehavior.Cascade);

            // Prevent duplicate names for the same business
            // and transaction type.
            entity.HasIndex(c => new
                { c.BusinessID, c.Name, c.TransactionType })
                .IsUnique();

            entity.ToTable(t => t.HasCheckConstraint(
                "CK_Categories_TransactionType",
                "\"TransactionType\" IN ('Income', 'Expense')"));
        });


        // TRANSACTION
        modelBuilder.Entity<BizBridge.Api.Models.Transaction>(entity =>
        {
            entity.HasKey(t => t.TransactionID);

            entity.Property(t => t.Amount)
                .HasPrecision(12, 2)
                .IsRequired();

            entity.ToTable(t => t.HasCheckConstraint(
                "CK_Transactions_Amount",
                "\"Amount\" > 0"));

            entity.Property(t => t.Description)
                .HasMaxLength(500);

            entity.Property(t => t.PaymentReference)
                .HasMaxLength(150);

            entity.HasOne(t => t.Business)
                .WithMany()
                .HasForeignKey(t => t.BusinessID)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(t => t.Category)
                .WithMany()
                .HasForeignKey(t => t.CategoryID)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(t => new
                { t.BusinessID, t.TransactionDate });

            entity.HasIndex(t => t.CategoryID);
        });

        // PAYMENT ALERT
        modelBuilder.Entity<PaymentAlert>(entity =>
        {
            entity.HasKey(a => a.AlertID);

            entity.Property(a => a.AlertType)
                .HasMaxLength(80)
                .IsRequired();

            entity.Property(a => a.Message)
                .HasMaxLength(1000)
                .IsRequired();

            entity.Property(a => a.Status)
                .HasMaxLength(20)
                .HasDefaultValue("Open")
                .IsRequired();

            entity.ToTable(t => t.HasCheckConstraint(
                "CK_PaymentAlerts_Status",
                "\"Status\" IN ('Open', 'Reviewed', 'Dismissed')"));

            entity.HasOne(a => a.Transaction)
                .WithMany()
                .HasForeignKey(a => a.TransactionId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(a => new
                { a.TransactionId, a.Status });
        });

        // READINESS CHECK
        modelBuilder.Entity<ReadinessCheck>(entity =>
        {
            entity.HasKey(r => r.CheckID);

            entity.Property(r => r.Title)
                .HasMaxLength(150)
                .IsRequired();

            entity.Property(r => r.Description)
                .HasMaxLength(1000);

            entity.Property(r => r.IsRequired)
                .HasDefaultValue(true);
        });

        // BUSINESS READINESS
        modelBuilder.Entity<BusinessReadiness>(entity =>
        {
            entity.HasKey(br => br.BusinessReadinessID);

            entity.Property(br => br.IsCompleted)
                .HasDefaultValue(false);

            entity.HasOne(br => br.Business)
                .WithMany()
                .HasForeignKey(br => br.BusinessID)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(br => br.Check)
                .WithMany()
                .HasForeignKey(br => br.CheckID)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(br => new
                { br.BusinessID, br.CheckID })
                .IsUnique();
        });

        // OPPORTUNITY
        modelBuilder.Entity<Opportunity>(entity =>
        {
            entity.HasKey(o => o.OpportunityID);

            entity.Property(o => o.Title)
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(o => o.Organisation)
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(o => o.Description)
                .HasMaxLength(2000)
                .IsRequired();

            entity.Property(o => o.Requirements)
                .HasMaxLength(2000);

            entity.Property(o => o.SourceUrl)
                .HasMaxLength(2048);

            entity.Property(o => o.Status)
                .HasMaxLength(20)
                .HasDefaultValue("Draft")
                .IsRequired();

            entity.ToTable(t => t.HasCheckConstraint(
                "CK_Opportunities_Status",
                "\"Status\" IN ('Draft', 'Published', 'Closed')"));

            entity.HasOne(o => o.ManagedByUser)
                .WithMany()
                .HasForeignKey(o => o.ManagedByUserID)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(o => new
                { o.Status, o.Deadline });
        });
        
       


        // OPPORTUNITY APPLICATION
        modelBuilder.Entity<OpportunityApplication>(entity =>
        {
            entity.HasKey(a => a.ApplicationID);

            entity.Property(a => a.Status)
                .HasMaxLength(20)
                .HasDefaultValue("Submitted")
                .IsRequired();

            entity.ToTable(t => t.HasCheckConstraint(
                "CK_OpportunityApplications_Status",
                "\"Status\" IN ('Submitted', 'UnderReview', 'Accepted', 'Rejected', 'Withdrawn')"));

            entity.HasOne(a => a.Business)
                .WithMany()
                .HasForeignKey(a => a.BusinessID)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(a => a.Opportunity)
                .WithMany()
                .HasForeignKey(a => a.OpportunityID)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(a => new
                { a.BusinessID, a.OpportunityID })
                .IsUnique();
        });

        if (Database.ProviderName == "Microsoft.EntityFrameworkCore.Sqlite")
        {
            var dateTimeOffsetConverter =
                new DateTimeOffsetToBinaryConverter();
            foreach (var entityType in modelBuilder.Model.GetEntityTypes())
            {
                foreach (var property in entityType.GetProperties().Where(
                             property =>
                                 property.ClrType == typeof(DateTimeOffset) ||
                                 property.ClrType == typeof(DateTimeOffset?)))
                {
                    modelBuilder.Entity(entityType.ClrType)
                        .Property(property.Name)
                        .HasConversion(dateTimeOffsetConverter);
                }
            }
        }
    }
}

using Microsoft.EntityFrameworkCore;
using ticket_turno.Models;

namespace ticket_turno.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Ticket> Tickets => Set<Ticket>();
    public DbSet<NivelEducativo> NivelesEducativos => Set<NivelEducativo>();
    public DbSet<Municipio> Municipios => Set<Municipio>();
    public DbSet<Asunto> Asuntos => Set<Asunto>();
    public DbSet<OficinaRegional> OficinasRegionales => Set<OficinaRegional>();
    public DbSet<TurnoConsecutivoMunicipio> TurnosConsecutivosMunicipio => Set<TurnoConsecutivoMunicipio>();
    public DbSet<CapacidadAtencionDiaria> CapacidadesAtencionDiaria => Set<CapacidadAtencionDiaria>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Ticket>(entity =>
        {
            entity.Property(x => x.Curp).HasMaxLength(18).IsRequired();
            entity.Property(x => x.Nombre).HasMaxLength(120).IsRequired();
            entity.Property(x => x.Paterno).HasMaxLength(120).IsRequired();
            entity.Property(x => x.Materno).HasMaxLength(120);
            entity.Property(x => x.Telefono).HasMaxLength(20).IsRequired();
            entity.Property(x => x.Celular).HasMaxLength(20).IsRequired();
            entity.Property(x => x.Correo).HasMaxLength(180).IsRequired();
            entity.Property(x => x.FechaAtencion).HasColumnType("datetime2");
            entity.Property(x => x.FechaRegistroUtc).HasColumnType("datetime2");
            entity.Property(x => x.FechaUltimaActualizacionUtc).HasColumnType("datetime2");
            entity.Property(x => x.Estatus)
                .HasConversion<string>()
                .HasMaxLength(20)
                .HasDefaultValue(TicketStatus.Pendiente);

            entity.HasIndex(x => new { x.MunicipioId, x.NumeroTurno })
                .IsUnique();

            entity.HasIndex(x => x.Estatus);

            entity.HasIndex(x => x.DocumentoAutenticacion)
                .IsUnique();
        });

        modelBuilder.Entity<NivelEducativo>(entity =>
        {
            entity.Property(x => x.Nombre).HasMaxLength(120).IsRequired();
            entity.HasIndex(x => x.Nombre).IsUnique();
        });

        modelBuilder.Entity<Asunto>(entity =>
        {
            entity.Property(x => x.Nombre).HasMaxLength(180).IsRequired();
            entity.HasIndex(x => x.Nombre).IsUnique();
        });

        modelBuilder.Entity<OficinaRegional>(entity =>
        {
            entity.Property(x => x.Nombre).HasMaxLength(160).IsRequired();
            entity.HasIndex(x => x.Nombre).IsUnique();
        });

        modelBuilder.Entity<Municipio>(entity =>
        {
            entity.Property(x => x.Nombre).HasMaxLength(120).IsRequired();
            entity.HasIndex(x => new { x.OficinaRegionalId, x.Nombre })
                .IsUnique();

            entity.HasOne(x => x.OficinaRegional)
                .WithMany(x => x.Municipios)
                .HasForeignKey(x => x.OficinaRegionalId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<TurnoConsecutivoMunicipio>(entity =>
        {
            entity.HasKey(x => x.MunicipioId);
            entity.Property(x => x.RowVersion).IsRowVersion();

            entity.HasOne(x => x.Municipio)
                .WithOne(x => x.TurnoConsecutivo)
                .HasForeignKey<TurnoConsecutivoMunicipio>(x => x.MunicipioId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<CapacidadAtencionDiaria>(entity =>
        {
            entity.HasIndex(x => new { x.OficinaRegionalId, x.DiaSemana })
                .IsUnique();

            entity.HasOne(x => x.OficinaRegional)
                .WithMany(x => x.CapacidadesAtencion)
                .HasForeignKey(x => x.OficinaRegionalId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
using ShareTracker.Domain.Entities;

namespace ShareTracker.Application.Portfolios.DTOs;

public record PortfolioDto(Guid Id, string Name, DateTime CreatedAt)
{
    public static PortfolioDto FromDomain(Portfolio portfolio) =>
        new(portfolio.Id, portfolio.Name, portfolio.CreatedAt);
}

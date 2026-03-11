using MediatR;

namespace ShareTracker.Application.Portfolios.Commands.DeletePortfolio;

/// <summary>
/// Deletes a portfolio.
/// If <see cref="ReassignToPortfolioId"/> is provided, all trades in the portfolio are moved to
/// that portfolio before deletion. Otherwise all trades in the portfolio are also deleted.
/// </summary>
public record DeletePortfolioCommand(Guid Id, Guid? ReassignToPortfolioId) : IRequest;

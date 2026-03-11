using MediatR;
using ShareTracker.Application.Portfolios.DTOs;

namespace ShareTracker.Application.Portfolios.Commands.UpdatePortfolio;

public record UpdatePortfolioCommand(Guid Id, string Name) : IRequest<PortfolioDto>;

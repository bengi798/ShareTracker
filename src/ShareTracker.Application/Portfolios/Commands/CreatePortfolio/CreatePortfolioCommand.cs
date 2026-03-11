using MediatR;
using ShareTracker.Application.Portfolios.DTOs;

namespace ShareTracker.Application.Portfolios.Commands.CreatePortfolio;

public record CreatePortfolioCommand(string Name) : IRequest<PortfolioDto>;

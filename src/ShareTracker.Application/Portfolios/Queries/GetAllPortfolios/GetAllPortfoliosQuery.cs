using MediatR;
using ShareTracker.Application.Portfolios.DTOs;

namespace ShareTracker.Application.Portfolios.Queries.GetAllPortfolios;

public record GetAllPortfoliosQuery : IRequest<IReadOnlyList<PortfolioDto>>;

using MediatR;
using ShareTracker.Application.Common.Interfaces;
using ShareTracker.Application.Portfolios.DTOs;
using ShareTracker.Domain.Interfaces.Repositories;

namespace ShareTracker.Application.Portfolios.Queries.GetAllPortfolios;

public class GetAllPortfoliosQueryHandler : IRequestHandler<GetAllPortfoliosQuery, IReadOnlyList<PortfolioDto>>
{
    private readonly IPortfolioRepository _portfolios;
    private readonly ICurrentUserService  _currentUser;

    public GetAllPortfoliosQueryHandler(IPortfolioRepository portfolios, ICurrentUserService currentUser)
    {
        _portfolios  = portfolios;
        _currentUser = currentUser;
    }

    public async Task<IReadOnlyList<PortfolioDto>> Handle(GetAllPortfoliosQuery request, CancellationToken cancellationToken)
    {
        var portfolios = await _portfolios.GetAllByUserIdAsync(_currentUser.UserId, cancellationToken);
        return portfolios
            .OrderBy(p => p.CreatedAt)
            .Select(PortfolioDto.FromDomain)
            .ToList();
    }
}

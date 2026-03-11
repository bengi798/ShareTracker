using MediatR;
using ShareTracker.Application.Common.Interfaces;
using ShareTracker.Application.Portfolios.DTOs;
using ShareTracker.Domain.Entities;
using ShareTracker.Domain.Interfaces.Repositories;

namespace ShareTracker.Application.Portfolios.Commands.CreatePortfolio;

public class CreatePortfolioCommandHandler : IRequestHandler<CreatePortfolioCommand, PortfolioDto>
{
    private readonly IPortfolioRepository _portfolios;
    private readonly IUnitOfWork          _uow;
    private readonly ICurrentUserService  _currentUser;

    public CreatePortfolioCommandHandler(
        IPortfolioRepository portfolios,
        IUnitOfWork uow,
        ICurrentUserService currentUser)
    {
        _portfolios  = portfolios;
        _uow         = uow;
        _currentUser = currentUser;
    }

    public async Task<PortfolioDto> Handle(CreatePortfolioCommand request, CancellationToken cancellationToken)
    {
        var portfolio = Portfolio.Create(_currentUser.UserId, request.Name);
        await _portfolios.AddAsync(portfolio, cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);
        return PortfolioDto.FromDomain(portfolio);
    }
}

using MediatR;
using ShareTracker.Application.Common.Exceptions;
using ShareTracker.Application.Common.Interfaces;
using ShareTracker.Application.Portfolios.DTOs;
using ShareTracker.Domain.Interfaces.Repositories;

namespace ShareTracker.Application.Portfolios.Commands.UpdatePortfolio;

public class UpdatePortfolioCommandHandler : IRequestHandler<UpdatePortfolioCommand, PortfolioDto>
{
    private readonly IPortfolioRepository _portfolios;
    private readonly IUnitOfWork          _uow;
    private readonly ICurrentUserService  _currentUser;

    public UpdatePortfolioCommandHandler(
        IPortfolioRepository portfolios,
        IUnitOfWork uow,
        ICurrentUserService currentUser)
    {
        _portfolios  = portfolios;
        _uow         = uow;
        _currentUser = currentUser;
    }

    public async Task<PortfolioDto> Handle(UpdatePortfolioCommand request, CancellationToken cancellationToken)
    {
        var portfolio = await _portfolios.GetByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException($"Portfolio with ID '{request.Id}' was not found.");

        if (portfolio.UserId != _currentUser.UserId)
            throw new UnauthorizedException("You are not authorised to update this portfolio.");

        portfolio.Update(request.Name);
        await _uow.SaveChangesAsync(cancellationToken);
        return PortfolioDto.FromDomain(portfolio);
    }
}

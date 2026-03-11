using MediatR;
using ShareTracker.Application.Common.Exceptions;
using ShareTracker.Application.Common.Interfaces;
using ShareTracker.Domain.Interfaces.Repositories;

namespace ShareTracker.Application.Portfolios.Commands.DeletePortfolio;

public class DeletePortfolioCommandHandler : IRequestHandler<DeletePortfolioCommand>
{
    private readonly IPortfolioRepository _portfolios;
    private readonly ITradeRepository     _trades;
    private readonly IUnitOfWork          _uow;
    private readonly ICurrentUserService  _currentUser;

    public DeletePortfolioCommandHandler(
        IPortfolioRepository portfolios,
        ITradeRepository trades,
        IUnitOfWork uow,
        ICurrentUserService currentUser)
    {
        _portfolios  = portfolios;
        _trades      = trades;
        _uow         = uow;
        _currentUser = currentUser;
    }

    public async Task Handle(DeletePortfolioCommand request, CancellationToken cancellationToken)
    {
        var portfolio = await _portfolios.GetByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException($"Portfolio with ID '{request.Id}' was not found.");

        if (portfolio.UserId != _currentUser.UserId)
            throw new UnauthorizedException("You are not authorised to delete this portfolio.");

        var portfolioTrades = await _trades.GetByPortfolioIdAsync(request.Id, cancellationToken);

        if (request.ReassignToPortfolioId.HasValue)
        {
            // Verify the target portfolio exists and belongs to the user
            var target = await _portfolios.GetByIdAsync(request.ReassignToPortfolioId.Value, cancellationToken)
                ?? throw new NotFoundException($"Target portfolio with ID '{request.ReassignToPortfolioId}' was not found.");

            if (target.UserId != _currentUser.UserId)
                throw new UnauthorizedException("You are not authorised to reassign trades to this portfolio.");

            foreach (var trade in portfolioTrades)
                trade.SetPortfolio(request.ReassignToPortfolioId.Value);
        }
        else
        {
            // Delete all trades belonging to this portfolio
            foreach (var trade in portfolioTrades)
                _trades.Remove(trade);
        }

        _portfolios.Remove(portfolio);
        await _uow.SaveChangesAsync(cancellationToken);
    }
}

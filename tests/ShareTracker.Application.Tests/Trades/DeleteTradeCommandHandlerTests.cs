using Moq;
using ShareTracker.Application.Common.Exceptions;
using ShareTracker.Application.Common.Interfaces;
using ShareTracker.Application.Trades.Commands.DeleteTrade;
using ShareTracker.Domain.Entities;
using ShareTracker.Domain.Enums;
using ShareTracker.Domain.Interfaces.Repositories;

namespace ShareTracker.Application.Tests.Trades;

public class DeleteTradeCommandHandlerTests
{
    private readonly Mock<ITradeRepository>    _repo        = new();
    private readonly Mock<IUnitOfWork>         _uow         = new();
    private readonly Mock<ICurrentUserService> _currentUser = new();
    private readonly DeleteTradeCommandHandler _handler;
    private readonly string _userId = "user_test123";

    public DeleteTradeCommandHandlerTests()
    {
        _currentUser.Setup(x => x.UserId).Returns(_userId);
        _uow.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);
        _handler = new DeleteTradeCommandHandler(_repo.Object, _uow.Object, _currentUser.Object);
    }

    [Fact]
    public async Task Handle_WhenTradeExistsAndOwnedByUser_DeletesTradeAndSaves()
    {
        var trade = SharesTrade.Create(_userId, 100m, 10m, DateOnly.FromDateTime(DateTime.Today), TradeType.Buy, "AAPL", Exchange.NASDAQ, Currency.USD);
        _repo.Setup(x => x.GetByIdAsync(trade.Id, It.IsAny<CancellationToken>())).ReturnsAsync(trade);

        await _handler.Handle(new DeleteTradeCommand(trade.Id), CancellationToken.None);

        _repo.Verify(x => x.Remove(trade), Times.Once);
        _uow.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenTradeNotFound_ThrowsNotFoundException()
    {
        var unknownId = Guid.NewGuid();
        _repo.Setup(x => x.GetByIdAsync(unknownId, It.IsAny<CancellationToken>())).ReturnsAsync((Trade?)null);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            _handler.Handle(new DeleteTradeCommand(unknownId), CancellationToken.None));
    }

    [Fact]
    public async Task Handle_WhenTradeNotFound_DoesNotCallRemove()
    {
        _repo.Setup(x => x.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync((Trade?)null);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            _handler.Handle(new DeleteTradeCommand(Guid.NewGuid()), CancellationToken.None));

        _repo.Verify(x => x.Remove(It.IsAny<Trade>()), Times.Never);
        _uow.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_WhenTradeOwnedByDifferentUser_ThrowsUnauthorizedException()
    {
        var otherUserId = "user_other456";
        var trade = SharesTrade.Create(otherUserId, 100m, 10m, DateOnly.FromDateTime(DateTime.Today), TradeType.Buy, "AAPL", Exchange.NASDAQ, Currency.USD);
        _repo.Setup(x => x.GetByIdAsync(trade.Id, It.IsAny<CancellationToken>())).ReturnsAsync(trade);

        await Assert.ThrowsAsync<UnauthorizedException>(() =>
            _handler.Handle(new DeleteTradeCommand(trade.Id), CancellationToken.None));
    }

    [Fact]
    public async Task Handle_WhenOwnershipCheckFails_DoesNotRemoveTrade()
    {
        var otherUserId = "user_other456";
        var trade = SharesTrade.Create(otherUserId, 100m, 10m, DateOnly.FromDateTime(DateTime.Today), TradeType.Buy, "AAPL", Exchange.NASDAQ, Currency.USD);
        _repo.Setup(x => x.GetByIdAsync(trade.Id, It.IsAny<CancellationToken>())).ReturnsAsync(trade);

        await Assert.ThrowsAsync<UnauthorizedException>(() =>
            _handler.Handle(new DeleteTradeCommand(trade.Id), CancellationToken.None));

        _repo.Verify(x => x.Remove(It.IsAny<Trade>()), Times.Never);
        _uow.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }
}

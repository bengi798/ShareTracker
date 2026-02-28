using Moq;
using ShareTracker.Application.Common.Exceptions;
using ShareTracker.Application.Common.Interfaces;
using ShareTracker.Application.Trades.DTOs;
using ShareTracker.Application.Trades.Queries.GetTradeById;
using ShareTracker.Domain.Entities;
using ShareTracker.Domain.Enums;
using ShareTracker.Domain.Interfaces.Repositories;

namespace ShareTracker.Application.Tests.Trades;

public class GetTradeByIdQueryHandlerTests
{
    private readonly Mock<ITradeRepository>    _repo        = new();
    private readonly Mock<ICurrentUserService> _currentUser = new();
    private readonly GetTradeByIdQueryHandler  _handler;
    private readonly string _userId = "user_test123";

    public GetTradeByIdQueryHandlerTests()
    {
        _currentUser.Setup(x => x.UserId).Returns(_userId);
        _handler = new GetTradeByIdQueryHandler(_repo.Object, _currentUser.Object);
    }

    [Fact]
    public async Task Handle_WhenTradeExistsAndOwnedByUser_ReturnsTradeDto()
    {
        var trade = SharesTrade.Create(_userId, 195.50m, 10m, new DateOnly(2024, 1, 1), TradeType.Buy, "AAPL", Exchange.NASDAQ, Currency.USD);
        _repo.Setup(x => x.GetByIdAsync(trade.Id, It.IsAny<CancellationToken>())).ReturnsAsync(trade);

        var result = await _handler.Handle(new GetTradeByIdQuery(trade.Id), CancellationToken.None);

        Assert.Equal(trade.Id, result.Id);
        var dto = Assert.IsType<SharesTradeDto>(result);
        Assert.Equal("AAPL", dto.Ticker);
    }

    [Fact]
    public async Task Handle_WhenTradeNotFound_ThrowsNotFoundException()
    {
        var unknownId = Guid.NewGuid();
        _repo.Setup(x => x.GetByIdAsync(unknownId, It.IsAny<CancellationToken>())).ReturnsAsync((Trade?)null);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            _handler.Handle(new GetTradeByIdQuery(unknownId), CancellationToken.None));
    }

    [Fact]
    public async Task Handle_WhenTradeOwnedByDifferentUser_ThrowsUnauthorizedException()
    {
        var otherUserId = "user_other456";
        var trade = SharesTrade.Create(otherUserId, 100m, 10m, new DateOnly(2024, 1, 1), TradeType.Buy, "AAPL", Exchange.NASDAQ, Currency.USD);
        _repo.Setup(x => x.GetByIdAsync(trade.Id, It.IsAny<CancellationToken>())).ReturnsAsync(trade);

        await Assert.ThrowsAsync<UnauthorizedException>(() =>
            _handler.Handle(new GetTradeByIdQuery(trade.Id), CancellationToken.None));
    }
}

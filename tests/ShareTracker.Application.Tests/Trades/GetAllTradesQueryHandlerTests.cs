using Moq;
using ShareTracker.Application.Common.Interfaces;
using ShareTracker.Application.Trades.DTOs;
using ShareTracker.Application.Trades.Queries.GetAllTrades;
using ShareTracker.Domain.Entities;
using ShareTracker.Domain.Enums;
using ShareTracker.Domain.Interfaces.Repositories;

namespace ShareTracker.Application.Tests.Trades;

public class GetAllTradesQueryHandlerTests
{
    private readonly Mock<ITradeRepository>    _repo        = new();
    private readonly Mock<ICurrentUserService> _currentUser = new();
    private readonly GetAllTradesQueryHandler  _handler;
    private readonly string _userId = "user_test123";

    public GetAllTradesQueryHandlerTests()
    {
        _currentUser.Setup(x => x.UserId).Returns(_userId);
        _handler = new GetAllTradesQueryHandler(_repo.Object, _currentUser.Object);
    }

    [Fact]
    public async Task Handle_ReturnsTradeDtosForCurrentUser()
    {
        var trades = new List<Trade>
        {
            SharesTrade.Create(_userId, 195.50m, 10m, new DateOnly(2024, 1, 1), TradeType.Buy,  "AAPL", Exchange.NASDAQ, Currency.USD),
            SharesTrade.Create(_userId, 400.00m, 5m,  new DateOnly(2024, 2, 1), TradeType.Sell, "MSFT", Exchange.NYSE, Currency.USD),
        };
        _repo.Setup(x => x.GetAllByUserIdAsync(_userId, It.IsAny<CancellationToken>()))
             .ReturnsAsync(trades);

        var result = await _handler.Handle(new GetAllTradesQuery(), CancellationToken.None);

        Assert.Equal(2, result.Count);
        Assert.Contains(result, t => t is SharesTradeDto dto && dto.Ticker == "AAPL");
        Assert.Contains(result, t => t is SharesTradeDto dto && dto.Ticker == "MSFT");
    }

    [Fact]
    public async Task Handle_WhenNoTrades_ReturnsEmptyList()
    {
        _repo.Setup(x => x.GetAllByUserIdAsync(_userId, It.IsAny<CancellationToken>()))
             .ReturnsAsync(new List<Trade>());

        var result = await _handler.Handle(new GetAllTradesQuery(), CancellationToken.None);

        Assert.Empty(result);
    }

    [Fact]
    public async Task Handle_QueriesRepositoryWithCurrentUserId()
    {
        _repo.Setup(x => x.GetAllByUserIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
             .ReturnsAsync(new List<Trade>());

        await _handler.Handle(new GetAllTradesQuery(), CancellationToken.None);

        _repo.Verify(x => x.GetAllByUserIdAsync(_userId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_MapsSharesTradeFieldsCorrectlyToDto()
    {
        var dateOfTrade = new DateOnly(2024, 6, 15);
        var trade = SharesTrade.Create(_userId, 195.50m, 10m, dateOfTrade, TradeType.Buy, "AAPL", Exchange.NASDAQ, Currency.USD);
        _repo.Setup(x => x.GetAllByUserIdAsync(_userId, It.IsAny<CancellationToken>()))
             .ReturnsAsync(new List<Trade> { trade });

        var result = await _handler.Handle(new GetAllTradesQuery(), CancellationToken.None);

        var dto = Assert.IsType<SharesTradeDto>(Assert.Single(result));
        Assert.Equal(trade.Id, dto.Id);
        Assert.Equal("AAPL", dto.Ticker);
        Assert.Equal("NASDAQ", dto.Exchange);
        Assert.Equal("Buy", dto.TradeType);
        Assert.Equal(10m, dto.NumberOfUnits);
        Assert.Equal(195.50m, dto.PricePerUnit);
        Assert.Equal(1955.0m, dto.TotalValue);
        Assert.Equal(dateOfTrade, dto.DateOfTrade);
    }
}

using Moq;
using ShareTracker.Application.Common.Exceptions;
using ShareTracker.Application.Common.Interfaces;
using ShareTracker.Application.Trades.Commands.CreateSharesTrade;
using ShareTracker.Application.Trades.DTOs;
using ShareTracker.Domain.Entities;
using ShareTracker.Domain.Enums;
using ShareTracker.Domain.Interfaces.Repositories;

namespace ShareTracker.Application.Tests.Trades;

public class CreateSharesTradeCommandHandlerTests
{
    private readonly Mock<ITradeRepository>    _repo        = new();
    private readonly Mock<IUnitOfWork>         _uow         = new();
    private readonly Mock<ICurrentUserService> _currentUser = new();
    private readonly CreateSharesTradeCommandHandler _handler;
    private readonly string _userId = "user_test123";

    public CreateSharesTradeCommandHandlerTests()
    {
        _currentUser.Setup(x => x.UserId).Returns(_userId);
        _uow.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);
        _handler = new CreateSharesTradeCommandHandler(_repo.Object, _uow.Object, _currentUser.Object);
    }

    // ── Basic buy trade behaviour ─────────────────────────────────────

    [Fact]
    public async Task Handle_WithValidBuyCommand_ReturnsSharesTradeDtoWithCorrectValues()
    {
        var command = new CreateSharesTradeCommand(
            TradeType:     "Buy",
            PricePerUnit:  195.50m,
            NumberOfUnits: 10m,
            DateOfTrade:   new DateOnly(2024, 6, 15),
            Ticker:        "AAPL",
            Exchange:      "NASDAQ",
            Currency:      "USD");

        var result = await _handler.Handle(command, CancellationToken.None);

        var dto = Assert.IsType<SharesTradeDto>(result);
        Assert.Equal("AAPL", dto.Ticker);
        Assert.Equal("NASDAQ", dto.Exchange);
        Assert.Equal("Buy", dto.TradeType);
        Assert.Equal(10m, dto.NumberOfUnits);
        Assert.Equal(195.50m, dto.PricePerUnit);
        Assert.Equal(1955.0m, dto.TotalValue);
        Assert.Equal(new DateOnly(2024, 6, 15), dto.DateOfTrade);
        Assert.NotEqual(Guid.Empty, dto.Id);
    }

    [Fact]
    public async Task Handle_WithValidBuyCommand_AddsTradeToRepositoryAndSaves()
    {
        var command = new CreateSharesTradeCommand("Buy", 400m, 5m, new DateOnly(2024, 1, 1), "MSFT", "NASDAQ", "USD");

        await _handler.Handle(command, CancellationToken.None);

        _repo.Verify(x => x.AddAsync(It.IsAny<Trade>(), It.IsAny<CancellationToken>()), Times.Once);
        _uow.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_AssignsCurrentUserIdToTrade()
    {
        Trade? capturedTrade = null;
        _repo
            .Setup(x => x.AddAsync(It.IsAny<Trade>(), It.IsAny<CancellationToken>()))
            .Callback<Trade, CancellationToken>((t, _) => capturedTrade = t)
            .Returns(Task.CompletedTask);

        var command = new CreateSharesTradeCommand("Buy", 100m, 1m, new DateOnly(2024, 1, 1), "AAPL", "NASDAQ", "USD");
        await _handler.Handle(command, CancellationToken.None);

        Assert.NotNull(capturedTrade);
        Assert.Equal(_userId, capturedTrade.UserId);
    }

    [Theory]
    [InlineData("Buy")]
    [InlineData("buy")]
    [InlineData("BUY")]
    public async Task Handle_WithCaseInsensitiveTradeType_Succeeds(string tradeType)
    {
        var command = new CreateSharesTradeCommand(tradeType, 100m, 1m, new DateOnly(2024, 1, 1), "AAPL", "NASDAQ", "USD");

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.Equal("Buy", result.TradeType);
    }

    // ── Buy trades do not check position ─────────────────────────────

    [Fact]
    public async Task Handle_BuyTrade_DoesNotCheckPosition()
    {
        var command = new CreateSharesTradeCommand("Buy", 100m, 10m, new DateOnly(2024, 1, 1), "AAPL", "NASDAQ", "USD");

        await _handler.Handle(command, CancellationToken.None);

        _repo.Verify(x => x.GetAllByUserIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    // ── Sell trades: sufficient position ─────────────────────────────

    [Fact]
    public async Task Handle_SellWithSufficientPosition_ReturnsSellDto()
    {
        var buy = SharesTrade.Create(_userId, 100m, 50m, new DateOnly(2024, 1, 1), TradeType.Buy, "AAPL", Exchange.NASDAQ, Currency.USD);
        _repo.Setup(x => x.GetAllByUserIdAsync(_userId, It.IsAny<CancellationToken>()))
             .ReturnsAsync(new List<Trade> { buy });

        var command = new CreateSharesTradeCommand("Sell", 200m, 20m, new DateOnly(2024, 6, 1), "AAPL", "NASDAQ", "USD");
        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.Equal("Sell", result.TradeType);
    }

    [Fact]
    public async Task Handle_SellExactAvailableUnits_Succeeds()
    {
        var buy = SharesTrade.Create(_userId, 100m, 50m, new DateOnly(2024, 1, 1), TradeType.Buy, "AAPL", Exchange.NASDAQ, Currency.USD);
        _repo.Setup(x => x.GetAllByUserIdAsync(_userId, It.IsAny<CancellationToken>()))
             .ReturnsAsync(new List<Trade> { buy });

        var command = new CreateSharesTradeCommand("Sell", 200m, 50m, new DateOnly(2024, 6, 1), "AAPL", "NASDAQ", "USD");

        // Should not throw
        await _handler.Handle(command, CancellationToken.None);
    }

    [Fact]
    public async Task Handle_SellAfterMultipleBuys_AccumulatesPosition()
    {
        var buy1 = SharesTrade.Create(_userId, 100m, 30m, new DateOnly(2024, 1, 1), TradeType.Buy, "AAPL", Exchange.NASDAQ, Currency.USD);
        var buy2 = SharesTrade.Create(_userId, 110m, 20m, new DateOnly(2024, 2, 1), TradeType.Buy, "AAPL", Exchange.NASDAQ, Currency.USD);
        _repo.Setup(x => x.GetAllByUserIdAsync(_userId, It.IsAny<CancellationToken>()))
             .ReturnsAsync(new List<Trade> { buy1, buy2 });

        // Net = 50; selling 40 should succeed
        var command = new CreateSharesTradeCommand("Sell", 150m, 40m, new DateOnly(2024, 6, 1), "AAPL", "NASDAQ", "USD");

        await _handler.Handle(command, CancellationToken.None);
    }

    // ── Sell trades: insufficient position ───────────────────────────

    [Fact]
    public async Task Handle_SellWithNoPosition_ThrowsValidationException()
    {
        _repo.Setup(x => x.GetAllByUserIdAsync(_userId, It.IsAny<CancellationToken>()))
             .ReturnsAsync(new List<Trade>());

        var command = new CreateSharesTradeCommand("Sell", 200m, 10m, new DateOnly(2024, 6, 1), "AAPL", "NASDAQ", "USD");

        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            _handler.Handle(command, CancellationToken.None));

        Assert.True(ex.Errors.ContainsKey("NumberOfUnits"));
    }

    [Fact]
    public async Task Handle_SellMoreThanAvailable_ThrowsValidationException()
    {
        var buy = SharesTrade.Create(_userId, 100m, 50m, new DateOnly(2024, 1, 1), TradeType.Buy, "AAPL", Exchange.NASDAQ, Currency.USD);
        _repo.Setup(x => x.GetAllByUserIdAsync(_userId, It.IsAny<CancellationToken>()))
             .ReturnsAsync(new List<Trade> { buy });

        var command = new CreateSharesTradeCommand("Sell", 200m, 60m, new DateOnly(2024, 6, 1), "AAPL", "NASDAQ", "USD");

        await Assert.ThrowsAsync<ValidationException>(() =>
            _handler.Handle(command, CancellationToken.None));
    }

    [Fact]
    public async Task Handle_SellExceedingNetAfterPreviousSells_ThrowsValidationException()
    {
        // Buy 50, previously sold 40, net = 10. Trying to sell 20 → fail.
        var buy      = SharesTrade.Create(_userId, 100m, 50m, new DateOnly(2024, 1, 1), TradeType.Buy,  "AAPL", Exchange.NASDAQ, Currency.USD);
        var prevSell = SharesTrade.Create(_userId, 120m, 40m, new DateOnly(2024, 3, 1), TradeType.Sell, "AAPL", Exchange.NASDAQ, Currency.USD);
        _repo.Setup(x => x.GetAllByUserIdAsync(_userId, It.IsAny<CancellationToken>()))
             .ReturnsAsync(new List<Trade> { buy, prevSell });

        var command = new CreateSharesTradeCommand("Sell", 130m, 20m, new DateOnly(2024, 6, 1), "AAPL", "NASDAQ", "USD");

        await Assert.ThrowsAsync<ValidationException>(() =>
            _handler.Handle(command, CancellationToken.None));
    }

    [Fact]
    public async Task Handle_SellDifferentTicker_DoesNotCountPosition()
    {
        // Have 50 MSFT — selling AAPL should fail (no AAPL position)
        var buy = SharesTrade.Create(_userId, 400m, 50m, new DateOnly(2024, 1, 1), TradeType.Buy, "MSFT", Exchange.NASDAQ, Currency.USD);
        _repo.Setup(x => x.GetAllByUserIdAsync(_userId, It.IsAny<CancellationToken>()))
             .ReturnsAsync(new List<Trade> { buy });

        var command = new CreateSharesTradeCommand("Sell", 200m, 10m, new DateOnly(2024, 6, 1), "AAPL", "NASDAQ", "USD");

        await Assert.ThrowsAsync<ValidationException>(() =>
            _handler.Handle(command, CancellationToken.None));
    }

    [Fact]
    public async Task Handle_SellDifferentExchange_DoesNotCountPosition()
    {
        // Have 50 AAPL on NASDAQ — selling AAPL on NYSE should fail (different exchange)
        var buy = SharesTrade.Create(_userId, 100m, 50m, new DateOnly(2024, 1, 1), TradeType.Buy, "AAPL", Exchange.NASDAQ, Currency.USD);
        _repo.Setup(x => x.GetAllByUserIdAsync(_userId, It.IsAny<CancellationToken>()))
             .ReturnsAsync(new List<Trade> { buy });

        var command = new CreateSharesTradeCommand("Sell", 200m, 10m, new DateOnly(2024, 6, 1), "AAPL", "NYSE", "USD");

        await Assert.ThrowsAsync<ValidationException>(() =>
            _handler.Handle(command, CancellationToken.None));
    }

    [Fact]
    public async Task Handle_SellWithInsufficientPosition_DoesNotAddTradeToRepository()
    {
        _repo.Setup(x => x.GetAllByUserIdAsync(_userId, It.IsAny<CancellationToken>()))
             .ReturnsAsync(new List<Trade>());

        var command = new CreateSharesTradeCommand("Sell", 200m, 10m, new DateOnly(2024, 6, 1), "AAPL", "NASDAQ", "USD");

        await Assert.ThrowsAsync<ValidationException>(() =>
            _handler.Handle(command, CancellationToken.None));

        _repo.Verify(x => x.AddAsync(It.IsAny<Trade>(), It.IsAny<CancellationToken>()), Times.Never);
        _uow.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    // ── FIFO allocation ───────────────────────────────────────────────

    [Fact]
    public async Task Handle_SellAgainstSingleBuy_AllocatesAllUnitsToThatBuy()
    {
        var buy = SharesTrade.Create(_userId, 100m, 50m, new DateOnly(2024, 1, 1), TradeType.Buy, "AAPL", Exchange.NASDAQ, Currency.USD);
        _repo.Setup(x => x.GetAllByUserIdAsync(_userId, It.IsAny<CancellationToken>()))
             .ReturnsAsync(new List<Trade> { buy });

        var command = new CreateSharesTradeCommand("Sell", 200m, 20m, new DateOnly(2024, 6, 1), "AAPL", "NASDAQ", "USD");
        await _handler.Handle(command, CancellationToken.None);

        // The buy's NumberOfUnitsSold should now be 20
        Assert.Equal(20m, buy.NumberOfUnitsSold);
    }

    [Fact]
    public async Task Handle_SellExactAvailableUnits_FullyAllocatesBuy()
    {
        var buy = SharesTrade.Create(_userId, 100m, 50m, new DateOnly(2024, 1, 1), TradeType.Buy, "AAPL", Exchange.NASDAQ, Currency.USD);
        _repo.Setup(x => x.GetAllByUserIdAsync(_userId, It.IsAny<CancellationToken>()))
             .ReturnsAsync(new List<Trade> { buy });

        var command = new CreateSharesTradeCommand("Sell", 200m, 50m, new DateOnly(2024, 6, 1), "AAPL", "NASDAQ", "USD");
        await _handler.Handle(command, CancellationToken.None);

        Assert.Equal(50m, buy.NumberOfUnitsSold);
    }

    [Fact]
    public async Task Handle_SellSpansMultipleBuys_FifoOrderRespected()
    {
        // Oldest buy (30 units) must be filled before newer buy (20 units).
        // Selling 40 should exhaust buy1 (30) and take 10 from buy2.
        var buy1 = SharesTrade.Create(_userId, 100m, 30m, new DateOnly(2024, 1, 1), TradeType.Buy, "AAPL", Exchange.NASDAQ, Currency.USD);
        var buy2 = SharesTrade.Create(_userId, 110m, 20m, new DateOnly(2024, 2, 1), TradeType.Buy, "AAPL", Exchange.NASDAQ, Currency.USD);
        _repo.Setup(x => x.GetAllByUserIdAsync(_userId, It.IsAny<CancellationToken>()))
             .ReturnsAsync(new List<Trade> { buy1, buy2 });

        var command = new CreateSharesTradeCommand("Sell", 150m, 40m, new DateOnly(2024, 6, 1), "AAPL", "NASDAQ", "USD");
        await _handler.Handle(command, CancellationToken.None);

        Assert.Equal(30m, buy1.NumberOfUnitsSold); // fully consumed
        Assert.Equal(10m, buy2.NumberOfUnitsSold); // remainder
    }

    [Fact]
    public async Task Handle_SellOnlyFromOldestBuyWhenItSuffices()
    {
        // buy1 has enough units; buy2 should remain untouched.
        var buy1 = SharesTrade.Create(_userId, 100m, 50m, new DateOnly(2024, 1, 1), TradeType.Buy, "AAPL", Exchange.NASDAQ, Currency.USD);
        var buy2 = SharesTrade.Create(_userId, 110m, 50m, new DateOnly(2024, 2, 1), TradeType.Buy, "AAPL", Exchange.NASDAQ, Currency.USD);
        _repo.Setup(x => x.GetAllByUserIdAsync(_userId, It.IsAny<CancellationToken>()))
             .ReturnsAsync(new List<Trade> { buy1, buy2 });

        var command = new CreateSharesTradeCommand("Sell", 150m, 30m, new DateOnly(2024, 6, 1), "AAPL", "NASDAQ", "USD");
        await _handler.Handle(command, CancellationToken.None);

        Assert.Equal(30m, buy1.NumberOfUnitsSold);
        Assert.Equal(0m,  buy2.NumberOfUnitsSold); // untouched
    }

    [Fact]
    public async Task Handle_BuyTrade_DoesNotAllocateAnyUnits()
    {
        var command = new CreateSharesTradeCommand("Buy", 100m, 10m, new DateOnly(2024, 1, 1), "AAPL", "NASDAQ", "USD");
        var result = await _handler.Handle(command, CancellationToken.None);

        // Buy trades have NumberOfUnitsSold = 0 (not null) on creation
        Assert.Equal(0m, result.NumberOfUnitsSold);
    }

    [Fact]
    public async Task Handle_SellTrade_NumberOfUnitsSoldIsNullOnSellDto()
    {
        var buy = SharesTrade.Create(_userId, 100m, 50m, new DateOnly(2024, 1, 1), TradeType.Buy, "AAPL", Exchange.NASDAQ, Currency.USD);
        _repo.Setup(x => x.GetAllByUserIdAsync(_userId, It.IsAny<CancellationToken>()))
             .ReturnsAsync(new List<Trade> { buy });

        var command = new CreateSharesTradeCommand("Sell", 200m, 20m, new DateOnly(2024, 6, 1), "AAPL", "NASDAQ", "USD");
        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.Null(result.NumberOfUnitsSold);
    }
}

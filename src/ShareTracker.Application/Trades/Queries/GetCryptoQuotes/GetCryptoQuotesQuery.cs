using MediatR;
using ShareTracker.Application.Trades.DTOs;

namespace ShareTracker.Application.Trades.Queries.GetCryptoQuotes;

public record GetCryptoQuotesQuery : IRequest<IReadOnlyList<CryptoQuoteDto>>;

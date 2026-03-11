using MediatR;
using ShareTracker.Application.Trades.DTOs;

namespace ShareTracker.Application.Trades.Queries.GetGoldQuotes;

public record GetGoldQuotesQuery : IRequest<IReadOnlyList<GoldQuoteDto>>;

using MediatR;
using ShareTracker.Application.Trades.DTOs;

namespace ShareTracker.Application.Trades.Queries.GetSharesQuotes;

public record GetSharesQuotesQuery : IRequest<IReadOnlyList<SharesQuoteDto>>;

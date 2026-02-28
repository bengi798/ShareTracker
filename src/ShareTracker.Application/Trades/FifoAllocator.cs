using ShareTracker.Domain.Entities;

namespace ShareTracker.Application.Trades;

/// <summary>
/// Applies FIFO cost-basis allocation: given a list of the user's existing buy trades
/// for one asset (pre-filtered and ordered oldest-first), allocates <paramref name="unitsSold"/>
/// across those buys in order, calling <see cref="Trade.AllocateSoldUnits"/> on each.
/// </summary>
internal static class FifoAllocator
{
    public static void Allocate(IEnumerable<Trade> buyTrades, decimal unitsSold)
    {
        var remaining = unitsSold;
        foreach (var buy in buyTrades)
        {
            if (remaining <= 0) break;

            var available = buy.NumberOfUnits - (buy.NumberOfUnitsSold ?? 0m);
            if (available <= 0) continue;

            var toAllocate = Math.Min(available, remaining);
            buy.AllocateSoldUnits(toAllocate);
            remaining -= toAllocate;
        }
    }
}

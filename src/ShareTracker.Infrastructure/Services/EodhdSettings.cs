namespace ShareTracker.Infrastructure.Services;

public class EodhdSettings
{
    public string ApiToken { get; init; } = string.Empty;
    public string BaseUrl  { get; init; } = "https://eodhd.com/api";
}

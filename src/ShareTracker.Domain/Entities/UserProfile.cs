namespace ShareTracker.Domain.Entities;

public class UserProfile
{
    public string ClerkUserId       { get; set; } = string.Empty;
    public bool   IsForeignResident { get; set; }
    public string HomeCurrency      { get; set; } = "AUD";
    public string ThemePreference   { get; set; } = "system";
}

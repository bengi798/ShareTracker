namespace ShareTracker.Application.Profile.DTOs;

public record UserProfileDto(
    string ClerkUserId,
    bool   IsForeignResident,
    string HomeCurrency,
    string ThemePreference);

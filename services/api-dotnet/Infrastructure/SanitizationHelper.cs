using System.Text.RegularExpressions;

namespace KanbanApi.Infrastructure;

/// <summary>
/// Utility class for sanitizing user input to prevent XSS and other injection attacks.
/// </summary>
public static partial class SanitizationHelper
{
    /// <summary>
    /// Strips HTML tags from input string.
    /// Returns null if input is null.
    /// </summary>
    public static string? StripHtml(string? input)
    {
        if (input is null) return null;
        return HtmlTagRegex().Replace(input, string.Empty).Trim();
    }

    /// <summary>
    /// Strips HTML tags and trims whitespace.
    /// Returns null if input is null or empty after stripping.
    /// </summary>
    public static string? SanitizeAndTrim(string? input)
    {
        if (input is null) return null;
        var stripped = HtmlTagRegex().Replace(input, string.Empty).Trim();
        return string.IsNullOrWhiteSpace(stripped) ? null : stripped;
    }

    [GeneratedRegex("<[^>]*>", RegexOptions.Compiled)]
    private static partial Regex HtmlTagRegex();
}

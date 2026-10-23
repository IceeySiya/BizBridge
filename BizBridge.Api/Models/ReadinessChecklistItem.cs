namespace BizBridge.Api.Models;

public sealed record ReadinessChecklistItem(
    int CheckID,
    string Key,
    string Title,
    string Description,
    bool IsAutomatic,
    string NextStep,
    string? ActionUrl);

public static class ReadinessChecklist
{
    public static IReadOnlyList<ReadinessChecklistItem> Items { get; } =
    [
        new(
            1,
            "business-profile",
            "Complete your business profile",
            "Add your business name and industry to BizBridge.",
            true,
            "Add any missing business profile details.",
            "business-profile.html"),
        new(
            2,
            "financial-records",
            "Record business income or expenses",
            "Add at least one transaction to establish a financial record.",
            true,
            "Record your first income or expense transaction.",
            "transactions.html"),
        new(
            3,
            "business-registration",
            "Capture business registration details",
            "Confirm that registration details are available for your business.",
            false,
            "Gather your registration details and mark this item complete when ready.",
            null),
        new(
            4,
            "tax-records",
            "Prepare your tax records",
            "Keep your tax reference and relevant filings together.",
            false,
            "Collect your tax reference and latest relevant filings.",
            null),
        new(
            5,
            "business-bank-account",
            "Set up a business bank account",
            "Keep business finances separate where possible.",
            false,
            "Gather the account details or statements you use for business.",
            null),
        new(
            6,
            "business-plan",
            "Prepare a business plan or Lean Canvas",
            "Summarise your customers, offer, costs and revenue model.",
            false,
            "Draft a one-page Lean Business Canvas for your business.",
            null)
    ];

    public static IReadOnlyList<ReadinessChecklistItem> ManualItems { get; } =
        Items.Where(item => !item.IsAutomatic).ToArray();
}

import type powerbi from "powerbi-visuals-api";

// Sentinel "no selector" value. persistProperties(...).merge[].selector expects a selector slot,
// and `null` is the intended "no selection" marker the host accepts there. The non-null assertion
// bridges the API declaration, which does not reflect the host's supported null sentinel.
export const NO_SELECTOR: powerbi.visuals.ISelectionId = null!;

import type powerbi from "powerbi-visuals-api";

// Sentinel "no selector" value. persistProperties(...).merge[].selector expects a selector slot,
// and `null` is the intended "no selection" marker the host accepts there. The cast satisfies the
// non-nullable ISelectionId type under strictNullChecks.
export const NO_SELECTOR: powerbi.visuals.ISelectionId = null as unknown as powerbi.visuals.ISelectionId;

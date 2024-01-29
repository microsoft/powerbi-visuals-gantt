export enum GanttRole {
    Legend = "Legend",
    Task = "Task",
    Parent = "Parent",
    StartDate = "StartDate",
    EndDate = "EndDate",
    Duration = "Duration",
    Completion = "Completion",
    Resource = "Resource",
    Milestones = "Milestones",
    // Renaming to "Tooltips" in capabilities.json breaks the report after updating to the newer version
    // Data field named "Tooltips" is reset.
    ExtraInformation = "ExtraInformation",
}

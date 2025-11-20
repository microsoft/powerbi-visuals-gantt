import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import Card = formattingSettings.SimpleCard;
import Slice = formattingSettings.Slice;
import TextInput = formattingSettings.TextInput;
import ToggleSwitch = formattingSettings.ToggleSwitch;

export class TooltipConfigCardSettings extends Card {
    public dateFormat = new TextInput({
        name: "dateFormat",
        displayNameKey: "Visual_TooltipSettings_DateFormat",
        placeholder: "",
        value: ""
    });

    // Toggle switches to show/hide tooltip fields
    public showLegend = new ToggleSwitch({
        name: "showLegend",
        displayNameKey: "Visual_TooltipSettings_ShowLegend",
        value: true
    });

    public showTask = new ToggleSwitch({
        name: "showTask",
        displayNameKey: "Visual_TooltipSettings_ShowTask",
        value: true
    });

    public showStartDate = new ToggleSwitch({
        name: "showStartDate",
        displayNameKey: "Visual_TooltipSettings_ShowStartDate",
        value: true
    });

    public showEndDate = new ToggleSwitch({
        name: "showEndDate",
        displayNameKey: "Visual_TooltipSettings_ShowEndDate",
        value: true
    });

    public showDuration = new ToggleSwitch({
        name: "showDuration",
        displayNameKey: "Visual_TooltipSettings_ShowDuration",
        value: true
    });

    public showCompletion = new ToggleSwitch({
        name: "showCompletion",
        displayNameKey: "Visual_TooltipSettings_ShowCompletion",
        value: true
    });

    public showResource = new ToggleSwitch({
        name: "showResource",
        displayNameKey: "Visual_TooltipSettings_ShowResource",
        value: true
    });

    // Custom display names for tooltip fields
    public legendDisplayName = new TextInput({
        name: "legendDisplayName",
        displayNameKey: "Visual_TooltipSettings_LegendDisplayName",
        placeholder: "Legend",
        value: ""
    });

    public taskDisplayName = new TextInput({
        name: "taskDisplayName",
        displayNameKey: "Visual_TooltipSettings_TaskDisplayName",
        placeholder: "Task",
        value: ""
    });

    public startDateDisplayName = new TextInput({
        name: "startDateDisplayName",
        displayNameKey: "Visual_TooltipSettings_StartDateDisplayName",
        placeholder: "Start Date",
        value: ""
    });

    public endDateDisplayName = new TextInput({
        name: "endDateDisplayName",
        displayNameKey: "Visual_TooltipSettings_EndDateDisplayName",
        placeholder: "End Date",
        value: ""
    });

    public durationDisplayName = new TextInput({
        name: "durationDisplayName",
        displayNameKey: "Visual_TooltipSettings_DurationDisplayName",
        placeholder: "Duration",
        value: ""
    });

    public completionDisplayName = new TextInput({
        name: "completionDisplayName",
        displayNameKey: "Visual_TooltipSettings_CompletionDisplayName",
        placeholder: "% Completion",
        value: ""
    });

    public resourceDisplayName = new TextInput({
        name: "resourceDisplayName",
        displayNameKey: "Visual_TooltipSettings_ResourceDisplayName",
        placeholder: "Resource",
        value: ""
    });

    public name: string = "tooltipConfig";
    public displayNameKey: string = "Visual_TooltipSettings";
    public slices: Slice[] = [
        this.dateFormat,
        this.showLegend,
        this.showTask,
        this.showStartDate,
        this.showEndDate,
        this.showDuration,
        this.showCompletion,
        this.showResource,
        this.legendDisplayName,
        this.taskDisplayName,
        this.startDateDisplayName,
        this.endDateDisplayName,
        this.durationDisplayName,
        this.completionDisplayName,
        this.resourceDisplayName
    ];
}
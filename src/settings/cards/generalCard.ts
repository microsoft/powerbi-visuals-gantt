import powerbi from "powerbi-visuals-api";
import ValidatorType = powerbi.visuals.ValidatorType;

import { formattingSettings, formattingSettingsInterfaces } from "powerbi-visuals-utils-formattingmodel";
import ILocalizedItemMember = formattingSettingsInterfaces.ILocalizedItemMember;
import Card = formattingSettings.SimpleCard;
import Group = formattingSettings.Group;
import CompositeCard = formattingSettings.CompositeCard;
import Slice = formattingSettings.Slice;
import ToggleSwitch = formattingSettings.ToggleSwitch;
import ItemDropdown = formattingSettings.ItemDropdown;
import NumUpDown = formattingSettings.NumUpDown;

import { durationUnitsOptions } from "../enumOptions";

export enum OverlappingLayeringStrategyOptions {
    LayerOverlapping = "layerOverlapping",
    LayerByLegend = "layerByLegend",
    InOneLine = "inOneLine"
}

export const overlappingLayeringStrategyOptions: ILocalizedItemMember[] = [
    { value: OverlappingLayeringStrategyOptions.InOneLine, displayNameKey: "Visual_InOneLine" },
    { value: OverlappingLayeringStrategyOptions.LayerOverlapping, displayNameKey: "Visual_LayerOverlapping" },
    { value: OverlappingLayeringStrategyOptions.LayerByLegend, displayNameKey: "Visual_LayerByLegend" }
];

export class OverlappingTasks extends Card {
    public displayTasks = new ItemDropdown({
        name: "displayTasks",
        displayNameKey: "Visual_DisplayTasks",
        items: overlappingLayeringStrategyOptions,
        value: overlappingLayeringStrategyOptions[0]
    });

    public displayGroupedTaskGridLines = new ToggleSwitch({
        name: "displayGroupedTaskGridLines",
        displayNameKey: "Visual_DisplayTasksGridLines",
        value: true
    });

    public name: string = "overlappingTasksGroup";
    public displayNameKey: string = "Visual_GroupedTasks";
    public slices: Slice[] = [
        this.displayTasks,
        this.displayGroupedTaskGridLines
    ];
}

export class GeneralCardSettings extends CompositeCard {
    public static DefaultDurationMin: number = 1;
    public static MinDurationMin: number = 1;

    public groupTasks = new ToggleSwitch({
        name: "groupTasks",
        displayNameKey: "Visual_GroupTasks",
        value: false
    });

    public scrollToCurrentTime = new ToggleSwitch({
        name: "scrollToCurrentTime",
        displayNameKey: "Visual_ScrollToCurrentTime",
        value: false
    });

    public displayGridLines = new ToggleSwitch({
        name: "displayGridLines",
        displayNameKey: "Visual_DisplayGridLines",
        value: true
    });

    public durationUnit = new ItemDropdown({
        name: "durationUnit",
        displayNameKey: "Visual_DurationUnit",
        items: durationUnitsOptions,
        value: durationUnitsOptions[0]
    });

    public durationMin = new NumUpDown({
        name: "durationMin",
        displayNameKey: "Visual_DurationMinimum",
        value: GeneralCardSettings.DefaultDurationMin,
        options: {
            minValue: {
                type: ValidatorType.Min,
                value: GeneralCardSettings.MinDurationMin,
            }
        }
    });

    public barsRoundedCorners = new ToggleSwitch({
        name: "barsRoundedCorners",
        displayName: "Bars Rounded Corners",
        displayNameKey: "Visual_BarsRoundedCorners",
        value: true
    });

    public generalGroup: Group = new Group({
        name: "generalSettingsGroup",
        displayNameKey: "Visual_Options",
        slices: [
            this.groupTasks,
            this.scrollToCurrentTime,
            this.displayGridLines,
            this.durationUnit,
            this.durationMin,
            this.barsRoundedCorners
        ]
    });

    public overlappingTasksGroup: OverlappingTasks = new OverlappingTasks();
    public name: string = "general";
    public displayNameKey: string = "Visual_General";
    public groups: Group[] = [this.generalGroup, this.overlappingTasksGroup];

    public onPreProcess(): void {
        this.overlappingTasksGroup.disabled = !this.groupTasks.value;
        this.overlappingTasksGroup.disabledReasonKey = "Visual_GroupedTasks_DisabledReason";
    }
}
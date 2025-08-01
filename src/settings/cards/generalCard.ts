import powerbi from "powerbi-visuals-api";
import ValidatorType = powerbi.visuals.ValidatorType;

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import Card = formattingSettings.SimpleCard;
import Slice = formattingSettings.Slice;
import ToggleSwitch = formattingSettings.ToggleSwitch;
import ItemDropdown = formattingSettings.ItemDropdown;
import NumUpDown = formattingSettings.NumUpDown;

import { durationUnitsOptions } from "../enumOptions";

export class GeneralCardSettings extends Card {
    public static DefaultDurationMin: number = 1;
    public static MinDurationMin: number = 1;

    public groupTasks = new ToggleSwitch({
        name: "groupTasks",
        displayNameKey: "Visual_GroupTasks",
        value: false
    });

    public layerOverlappingTasks = new ToggleSwitch({
        name: "layerOverlappingTasks",
        displayNameKey: "Visual_LayerOverlappingTasks",
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

    public name: string = "general";
    public displayNameKey: string = "Visual_General";
    public slices: Slice[] = [this.groupTasks, this.layerOverlappingTasks, this.scrollToCurrentTime, this.displayGridLines, this.durationUnit, this.durationMin, this.barsRoundedCorners];
}
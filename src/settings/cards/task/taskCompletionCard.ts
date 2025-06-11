import powerbi from "powerbi-visuals-api";
import ValidatorType = powerbi.visuals.ValidatorType;

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import Card = formattingSettings.SimpleCard;
import Slice = formattingSettings.Slice;
import ToggleSwitch = formattingSettings.ToggleSwitch;
import NumUpDown = formattingSettings.NumUpDown;

import { Gantt } from "../../../gantt";

export class TaskCompletionCardSettings extends Card {
    public show = new ToggleSwitch({
        name: "show",
        displayNameKey: "Visual_Show",
        value: true
    });

    public maxCompletion = new NumUpDown({
        name: "maxCompletion",
        displayNameKey: "Visual_MaxCompletion",
        value: Gantt.CompletionDefault, 
        options: {
            minValue: {
                type: ValidatorType.Min,
                value: Gantt.CompletionMin,
            },
            maxValue: {
                type: ValidatorType.Max,
                value: Gantt.CompletionMaxInPercent,
            },
        }
    });

    public topLevelSlice = this.show;
    public name: string = "taskCompletion";
    public displayNameKey: string = "Visual_TaskCompletion";
    public slices: Slice[] = [ this.maxCompletion ];

    public parse(){
        if (this.maxCompletion.value < Gantt.CompletionMin || this.maxCompletion.value > Gantt.CompletionMaxInPercent) {
            this.maxCompletion.value = Gantt.CompletionDefault;
        }
    }
}
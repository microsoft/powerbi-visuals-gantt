import powerbi from "powerbi-visuals-api";
import ValidatorType = powerbi.visuals.ValidatorType;

import { ColorHelper } from "powerbi-visuals-utils-colorutils";

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import Card = formattingSettings.SimpleCard;
import ColorPicker = formattingSettings.ColorPicker;
import Slice = formattingSettings.Slice;
import NumUpDown = formattingSettings.NumUpDown;
import { ISetHighContrastMode } from "../interfaces/ISetHighContrastMode";

export class TaskConfigCardSettings extends Card implements ISetHighContrastMode {
    public static DefaultHeight: number = 40;
    public static MinHeight: number = 1;

    public fill = new ColorPicker({
        name: "fill",
        displayNameKey: "Visual_TaskSettings_Color",
        description: "This ONLY takes effect when you have no legend specified",
        descriptionKey: "Visual_Description_TaskSettings_Color",
        value: { value: "#00B099" },
    });

    public height = new NumUpDown({
        name: "height",
        displayNameKey: "Visual_TaskSettings_Height",
        value: TaskConfigCardSettings.DefaultHeight,
        options: {
            minValue: {
                type: ValidatorType.Min,
                value: TaskConfigCardSettings.MinHeight,
            },
        }
    });

    public name: string = "taskConfig";
    public displayNameKey: string = "Visual_TaskSettings";
    public slices: Slice[] = [this.fill, this.height];

    public setHighContrastMode(colorHelper: ColorHelper): void {
        const isHighContrast = colorHelper.isHighContrast;

        this.slices.forEach((slice) => {
            if (slice instanceof ColorPicker) {
                slice.value.value = colorHelper.getHighContrastColor("foreground", slice.value.value);
                slice.visible = !isHighContrast;
            }
        });
    }
}
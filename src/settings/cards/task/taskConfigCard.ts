import powerbi from "powerbi-visuals-api";
import ValidatorType = powerbi.visuals.ValidatorType;

import { ColorHelper } from "powerbi-visuals-utils-colorutils";

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import ConpositeCard = formattingSettings.CompositeCard;
import Card = formattingSettings.SimpleCard;
import Group = formattingSettings.Group;
import ColorPicker = formattingSettings.ColorPicker;
import Slice = formattingSettings.Slice;
import NumUpDown = formattingSettings.NumUpDown;
import { ISetHighContrastMode } from "../interfaces/ISetHighContrastMode";
import { CompositeCard } from "powerbi-visuals-utils-formattingmodel/lib/FormattingSettingsComponents";

class BorderSettings extends Card {
    public width = new NumUpDown({
        name: "borderWidth",
        displayNameKey: "Visual_Width",
        value: 0,
        options: {
            minValue: {
                type: ValidatorType.Min,
                value: 0,
            },
            maxValue: {
                type: ValidatorType.Max,
                value: 5,
            },
        }
    });

    public slices: Slice[] = [this.width];
    public name: string = "border";
    public displayNameKey: string = "Visual_Border";
}

export class TaskConfigCardSettings extends CompositeCard implements ISetHighContrastMode {
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

    public border = new BorderSettings();
    public task = new Group({
        name: "task",
        displayNameKey: "Visual_Task",
        slices: [this.fill, this.height],
    });
    public groups: Group[] = [ this.task, this.border];


    public name: string = "taskConfig";
    public displayNameKey: string = "Visual_TaskSettings";

    public setHighContrastMode(colorHelper: ColorHelper): void {
        const isHighContrast = colorHelper.isHighContrast;

        const slices = this.groups.flatMap(group => group.slices);
        slices.forEach((slice) => {
            if (slice instanceof ColorPicker) {
                slice.value.value = colorHelper.getHighContrastColor("foreground", slice.value.value);
                slice.visible = !isHighContrast;
            }
        });
    }
}
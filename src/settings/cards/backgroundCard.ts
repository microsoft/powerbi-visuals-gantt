import powerbi from "powerbi-visuals-api";
import ValidatorType = powerbi.visuals.ValidatorType;

import { ColorHelper } from "powerbi-visuals-utils-colorutils";

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import Card = formattingSettings.SimpleCard;
import CompositeCard = formattingSettings.CompositeCard;
import Group = formattingSettings.Group;
import ColorPicker = formattingSettings.ColorPicker;
import Slider = formattingSettings.Slider;
import ToggleSwitch = formattingSettings.ToggleSwitch;
import { ISetHighContrastMode } from "./interfaces/ISetHighContrastMode";

export class BaseBackroundSettings extends Card {
    public enable: ToggleSwitch;
    public color: ColorPicker;
    public opacity: Slider;

    constructor(prefix: string, displayNameKey: string) {
        super();

        this.enable = new ToggleSwitch({
            name: `${prefix}BackgroundEnable`,
            displayName: "Enable background",
            displayNameKey: "Visual_Enable_Background",
            value: true,
        });

        this.color = new ColorPicker({
            name: `${prefix}BackgroundColor`,
            displayName: "Color",
            displayNameKey: "Visual_Color",
            value: { value: "#FFFFFF" },
        });

        this.opacity = new Slider({
            name: `${prefix}BackgroundOpacity`,
            displayName: "Opacity",
            displayNameKey: "Visual_Opacity",
            value: 100,
            options: {
                minValue: { value: 0, type: ValidatorType.Min },
                maxValue: { value: 100, type: ValidatorType.Max },
            }
        });

        this.topLevelSlice = this.enable;
        this.slices = [this.color, this.opacity];
        this.name = `${prefix}BackgroundSettings`;
        this.displayNameKey = displayNameKey;
    }
}

class GeneralBackground extends BaseBackroundSettings {
    constructor(prefix: string, displayNameKey: string) {
        super(prefix, displayNameKey);
        this.enable.value = false;
        this.opacity.value = 50;
    }
}

export class BackgroundCardSettings extends CompositeCard implements ISetHighContrastMode {
    public general = new GeneralBackground("general", "Visual_General_Background");
    public categoryLabels = new BaseBackroundSettings("categoryLabels", "Visual_CategoryLabels_Background");
    public dateType = new BaseBackroundSettings("dateType", "Visual_DateType_Background");

    public name: string = "background";
    public displayNameKey: string = "Visual_Background";
    public groups: Group[] = [this.general, this.categoryLabels, this.dateType];

    public setHighContrastMode(colorHelper: ColorHelper): void {
        const isHighContrast = colorHelper.isHighContrast;

        this.groups.forEach((group: BaseBackroundSettings) => {
            group.color.value.value = colorHelper.getHighContrastColor("background", group.color.value.value);
            group.color.visible = !isHighContrast;
        });
    }
}
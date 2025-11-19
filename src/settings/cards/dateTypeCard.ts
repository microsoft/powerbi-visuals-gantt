import powerbi from "powerbi-visuals-api";
import ValidatorType = powerbi.visuals.ValidatorType;

import { ColorHelper } from "powerbi-visuals-utils-colorutils";

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import Group = formattingSettings.Group;
import CompositeCard = formattingSettings.CompositeCard;
import ItemDropdown = formattingSettings.ItemDropdown;
import ColorPicker = formattingSettings.ColorPicker;
import NumUpDown = formattingSettings.NumUpDown;
import ToggleSwitch = formattingSettings.ToggleSwitch;

import { dateTypeOptions } from "../enumOptions";
import { ISetHighContrastMode } from "./interfaces/ISetHighContrastMode";
import { FontSizeSettings } from "./baseFontCard";

export class DateTypeCardSettings extends CompositeCard implements ISetHighContrastMode {
    public type = new ItemDropdown({
        name: "type",
        displayNameKey: "Visual_Type",
        items: dateTypeOptions,
        value: dateTypeOptions[4]
    });

    public showTodayLine = new ToggleSwitch({
        name: "showTodayLine",
        displayNameKey: "Visual_DateType_ShowTodayLine",
        value: true,
    })

    public todayColor = new ColorPicker({
        name: "todayColor",
        displayNameKey: "Visual_DateType_TodayColor",
        value: { value: "#000000" },
    });

    public axisColor = new ColorPicker({
        name: "axisColor",
        displayNameKey: "Visual_DateType_AxisColor",
        value: { value: "#000000" },
    });

    public axisTextColor = new ColorPicker({
        name: "axisTextColor",
        displayNameKey: "Visual_DateType_AxisTextColor",
        value: { value: "#000000" },
    });

    public dateTypeGeneralGroup = new Group({
        name: "dateTypeGeneralGroup",
        displayName: "General",
        displayNameKey: "Visual_General",
        slices: [this.type, this.showTodayLine, this.todayColor, this.axisColor, this.axisTextColor],
    });

    public axisFontSize = new NumUpDown({
        name: "axisFontSize",
        displayName: "Font Size",
        displayNameKey: "Visual_FontSize",
        value: FontSizeSettings.AxisDefaultFontSize,
        options: {
            minValue: { value: FontSizeSettings.MinFontSize, type: ValidatorType.Min },
            maxValue: { value: FontSizeSettings.MaxFontSize, type: ValidatorType.Max },
        },
    });

    public fontGroup = new Group({
        name: "dateTypeFontGroup",
        displayName: "Font",
        displayNameKey: "Visual_Font",
        slices: [this.axisFontSize],
    });


    public name: string = "dateType";
    public displayNameKey: string = "Visual_DateType";
    public groups: Group[] = [this.dateTypeGeneralGroup, this.fontGroup];

    public setHighContrastMode(colorHelper: ColorHelper): void {
        const isHighContrast = colorHelper.isHighContrast;

        this.dateTypeGeneralGroup.slices.forEach(slice => {
            if (slice instanceof ColorPicker) {
                slice.value.value = colorHelper.getHighContrastColor("foreground", slice.value.value);
                slice.visible = !isHighContrast;
            }
        });
    }
}
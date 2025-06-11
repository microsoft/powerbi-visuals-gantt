import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import Card = formattingSettings.SimpleCard;
import Slice = formattingSettings.Slice;
import ToggleSwitch = formattingSettings.ToggleSwitch;
import ItemDropdown = formattingSettings.ItemDropdown;
import ColorPicker = formattingSettings.ColorPicker;

import { ColorHelper } from "powerbi-visuals-utils-colorutils";

import { dayOfWeekOptions } from "../enumOptions";
import { ISetHighContrastMode } from "./interfaces/ISetHighContrastMode";

export class DaysOffCardSettings extends Card implements ISetHighContrastMode {
    public show = new ToggleSwitch({
        name: "show",
        displayNameKey: "Visual_Show",
        value: false
    });

    public fill = new ColorPicker({
        name: "fill",
        displayNameKey: "Visual_Color",
        value: { value: "#00B093" }
    });

    public firstDayOfWeek = new ItemDropdown({
        name: "firstDayOfWeek",
        displayNameKey: "Visual_FirstDayOfWeek",
        items: dayOfWeekOptions,
        value: dayOfWeekOptions[0]
    });

    public topLevelSlice = this.show;
    public name: string = "daysOff";
    public displayNameKey: string = "Visual_DaysOff";
    public slices: Slice[] = [this.fill, this.firstDayOfWeek];

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
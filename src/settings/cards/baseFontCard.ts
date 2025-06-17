import powerbi from "powerbi-visuals-api";
import ValidatorType = powerbi.visuals.ValidatorType;

import { ColorHelper } from "powerbi-visuals-utils-colorutils";

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import Card = formattingSettings.SimpleCard;
import FontControl = formattingSettings.FontControl;
import FontPicker = formattingSettings.FontPicker;
import NumUpDown = formattingSettings.NumUpDown;
import ToggleSwitch = formattingSettings.ToggleSwitch;
import ColorPicker = formattingSettings.ColorPicker;
import { ISetHighContrastMode } from "./interfaces/ISetHighContrastMode";

export class FontSizeSettings {
    public static readonly DefaultFontSize: number = 9;
    public static readonly AxisMinFontSize: number = 7;
    public static readonly MinFontSize: number = 8;
    public static readonly MaxFontSize: number = 60;
}

export class FontSettings extends Card implements ISetHighContrastMode {
    public fontSize: NumUpDown;
    public fontFamily: FontPicker;
    public bold: ToggleSwitch;
    public italic: ToggleSwitch;
    public underline: ToggleSwitch;
    public font: FontControl;
    public fill: ColorPicker;

    constructor(postfix: string = "") {
        super();

        this.fontSize = new NumUpDown({
            name: `fontSize${postfix}`,
            displayNameKey: "Visual_FontSize",
            value: FontSizeSettings.DefaultFontSize,
            options: {
                minValue: { value: FontSizeSettings.MinFontSize, type: ValidatorType.Min },
                maxValue: { value: FontSizeSettings.MaxFontSize, type: ValidatorType.Max }
            },
        });

        this.fontFamily = new FontPicker({
            name: `fontFamily${postfix}`,
            value: "'Roboto', -apple-system, BlinkMacSystemFont, sans-serif"
        });

        this.bold = new ToggleSwitch({
            name: `bold${postfix}`,
            value: false,
        });

        this.italic = new ToggleSwitch({
            name: `italic${postfix}`,
            value: false,
        });

        this.underline = new ToggleSwitch({
            name: `underline${postfix}`,
            value: false,
        });

        this.fill = new ColorPicker({
            name: `fill${postfix}`,
            displayNameKey: "Visual_Color",
            value: { value: "#000000" },
        });

        this.font = new FontControl({
            name: `font${postfix}`,
            displayNameKey: "Visual_Font",
            fontSize: this.fontSize,
            fontFamily: this.fontFamily,
            bold: this.bold,
            italic: this.italic,
            underline: this.underline,
        });
    }

    public setHighContrastMode(colorHelper: ColorHelper): void {
        const isHighContrast = colorHelper.isHighContrast;

        this.slices?.forEach((slice) => {
            if (slice instanceof ColorPicker) {
                slice.value.value = colorHelper.getHighContrastColor("foreground", slice.value.value);
                slice.visible = !isHighContrast;
            }
        });
    }
}
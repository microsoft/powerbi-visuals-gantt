import powerbi from "powerbi-visuals-api";
import ILocalizationManager = powerbi.extensibility.ILocalizationManager;
import DataViewObjectPropertyIdentifier = powerbi.DataViewObjectPropertyIdentifier;

import { ColorHelper } from "powerbi-visuals-utils-colorutils";

import { legendInterfaces } from "powerbi-visuals-utils-chartutils";
import LegendDataPoint = legendInterfaces.LegendDataPoint;

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import Card = formattingSettings.SimpleCard;
import CompositeCard = formattingSettings.CompositeCard;
import Group = formattingSettings.Group;
import Slice = formattingSettings.Slice;
import ToggleSwitch = formattingSettings.ToggleSwitch;
import ColorPicker = formattingSettings.ColorPicker;
import ItemDropdown = formattingSettings.ItemDropdown;
import TextInput = formattingSettings.TextInput;

import { FontSettings, FontSizeSettings } from "./baseFontCard";
import { positionOptions } from "../enumOptions";
import { ISetHighContrastMode } from "./interfaces/ISetHighContrastMode";

export const LegendPropertyIdentifier: DataViewObjectPropertyIdentifier = {
    objectName: "legend",
    propertyName: "fill"
};


export class LegendGeneralGroup extends FontSettings {
    public showTitle = new ToggleSwitch({
        name: "showTitle",
        displayNameKey: "Visual_Title",
        value: true
    });

    public position = new ItemDropdown({
        name: "position",
        displayNameKey: "Visual_Position",
        items: positionOptions,
        value: positionOptions[3]
    });

    public titleText = new TextInput({
        name: "titleText",
        displayNameKey: "Visual_LegendName",
        placeholder: "",
        value: ""
    });

    public labelColor = new ColorPicker({
        name: "labelColor",
        displayNameKey: "Visual_Color",
        value: { value: "#000000" }
    });

    public emptyLabelFallback = new TextInput({
        name: "emptyLabelFallback",
        displayNameKey: "Visual_EmptyLabelFallback",
        placeholder: "",
        value: ""
    });

    public name: string = "legendGeneralGroup";
    public displayNameKey: string = "Visual_General";
    public slices: Slice[] = [this.showTitle, this.position, this.titleText, this.labelColor, this.font, this.emptyLabelFallback];

    constructor() {
        super();
        this.fontFamily.value = "'Segoe UI', wf_segoe-ui_normal, helvetica, arial, sans-serif";
        this.fontSize.value = FontSizeSettings.MinFontSize;
    }
}

export class LegendCardSettings extends CompositeCard implements ISetHighContrastMode {
    public show = new ToggleSwitch({
        name: "show",
        displayNameKey: "Visual_Show",
        value: true
    });

    public topLevelSlice = this.show;

    public general = new LegendGeneralGroup();

    public name: string = "legend";
    public displayNameKey: string = "Visual_Legend";
    public groups: Card[] = [this.general];

    public populateColors(dataPoints: LegendDataPoint[], localizationManager: ILocalizationManager, colorHelper: ColorHelper): void {
        if (!dataPoints || dataPoints.length === 0 || colorHelper.isHighContrast) {
            return;
        }

        const legendColorsGroup = new Group({
            name: "legendColorsGroup",
            displayNameKey: "Visual_Colors",
            slices: []
        });

        this.groups = [this.general, legendColorsGroup];

        for (const dataPoint of dataPoints) {
            legendColorsGroup.slices.push(new ColorPicker({
                name: "fill",
                displayName: dataPoint.label || localizationManager.getDisplayName("Visual_LegendColor"),
                selector: ColorHelper.normalizeSelector(dataPoint.identity.getSelector(), false),
                value: { value: dataPoint.color }
            }));
        }
    }

    public setHighContrastMode(colorHelper: ColorHelper): void {
        const isHighContrast = colorHelper.isHighContrast;

        this.groups.forEach((group) => {
            group.slices.forEach((slice) => {
                if (slice instanceof ColorPicker) {
                    slice.value.value = colorHelper.getHighContrastColor("foreground", slice.value.value);
                    slice.visible = !isHighContrast;
                }
            });
        });
    }

    public disable(): void {
        this.disabled = true;
        this.disabledReasonKey = "Visual_LegendDisabledReason";
    }
}
import powerbi from "powerbi-visuals-api";
import DataViewObjectPropertyIdentifier = powerbi.DataViewObjectPropertyIdentifier;

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import ItemDropdown = formattingSettings.ItemDropdown;
import Slice = formattingSettings.Slice;
import ToggleSwitch = formattingSettings.ToggleSwitch;

import { FontSettings } from "../baseFontCard";
import { resourcePositionOptions } from "../../enumOptions";

export const TaskResourcePropertyIdentifier: DataViewObjectPropertyIdentifier = {
    objectName: "taskResource",
    propertyName: "show"
};

export class TaskResourceCardSettings extends FontSettings {
    public show = new ToggleSwitch({
        name: "show",
        displayNameKey: "Visual_Show",
        value: true
    });

    public matchLegendColors = new ToggleSwitch({
        name: "matchLegendColors",
        displayNameKey: "Visual_MatchLegendColors",
        value: false,
    });

    public position = new ItemDropdown({
        name: "position",
        displayNameKey: "Visual_Position",
        items: resourcePositionOptions,
        value: resourcePositionOptions[3]
    });

    public fullText = new ToggleSwitch({
        name: "fullText",
        displayNameKey: "Visual_FullText",
        value: false
    });

    public widthByTask = new ToggleSwitch({
        name: "widthByTask",
        displayNameKey: "Visual_WidthByTask",
        value: false
    });

    public topLevelSlice = this.show;
    public name: string = "taskResource";
    public displayNameKey: string = "Visual_DataLabels";
    public slices: Slice[] = [this.matchLegendColors, this.fill, this.font, this.position, this.fullText, this.widthByTask];

    constructor(){
        super();
        this.bold.value = true;
    }

    public disable(localizationManager: powerbi.extensibility.ILocalizationManager): void {
        this.disabled = true;
        this.disabledReason = localizationManager.getDisplayName("Visual_ResourceDisabledReason");
    }
}
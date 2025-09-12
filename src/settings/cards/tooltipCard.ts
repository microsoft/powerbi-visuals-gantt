import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import Card = formattingSettings.SimpleCard;
import Slice = formattingSettings.Slice;
import TextInput = formattingSettings.TextInput;

export class TooltipConfigCardSettings extends Card {
    public dateFormat = new TextInput({
        name: "dateFormat",
        displayNameKey: "Visual_TooltipSettings_DateFormat",
        placeholder: "",
        value: ""
    });

    public name: string = "tooltipConfig";
    public displayNameKey: string = "Visual_TooltipSettings";
    public slices: Slice[] = [this.dateFormat];
}
import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import Card = formattingSettings.SimpleCard;
import Slice = formattingSettings.Slice;
import TextInput = formattingSettings.TextInput;

export class CollapsedTasksUpdateIdCardSettings extends Card {
    public value = new TextInput({
        name: "value",
        displayNameKey: "Visual_UpdateId",
        placeholder: "",
        value: ""
    });

    public visible: boolean = false;
    public name: string = "collapsedTasksUpdateId";
    public displayNameKey: string = "Visual_CollapsedTasksUpdateId";
    public slices: Slice[] = [this.value];
}
import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import Card = formattingSettings.SimpleCard;
import Slice = formattingSettings.Slice;
import TextInput = formattingSettings.TextInput;

export class CollapsedTasksCardSettings extends Card {
    public list = new TextInput({
        name: "list",
        displayNameKey: "Visual_List",
        placeholder: "",
        value: "[]"
    });

    public visible: boolean = false;
    public name: string = "collapsedTasks";
    public displayNameKey: string = "Visual_CollapsedTasks";
    public slices: Slice[] = [ this.list ];
}

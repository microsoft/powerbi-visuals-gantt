import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import Card = formattingSettings.SimpleCard;
import Slice = formattingSettings.Slice;
import ToggleSwitch = formattingSettings.ToggleSwitch;

export class SubTasksCardSettings extends Card {
    public inheritParentLegend = new ToggleSwitch({
        name: "inheritParentLegend",
        displayNameKey: "Visual_InheritParentLegend",
        value: true
    });

    public parentDurationByChildren = new ToggleSwitch({
        name: "parentDurationByChildren",
        displayNameKey: "Visual_ParentDurationByChildren",
        value: true
    });

    public parentCompletionByChildren = new ToggleSwitch({
        name: "parentCompletionByChildren",
        displayNameKey: "Visual_ParentCompletionByChildren",
        value: true
    });

    public name: string = "subTasks";
    public displayNameKey: string = "Visual_SubTasks";
    public slices: Slice[] = [this.inheritParentLegend, this.parentDurationByChildren, this.parentCompletionByChildren];
}
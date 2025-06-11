import powerbi from "powerbi-visuals-api";
import ValidatorType = powerbi.visuals.ValidatorType;

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import Card = formattingSettings.SimpleCard;
import Container = formattingSettings.Container;
import ToggleSwitch = formattingSettings.ToggleSwitch;
import NumUpDown = formattingSettings.NumUpDown;

import { FontSettings } from "../baseFontCard";
import { ColorHelper } from "powerbi-visuals-utils-colorutils";

class BaseLabelsItem extends FontSettings {
    constructor(name: string, displayNameKey: string, postfix: string = "") {
        super(postfix);
        this.name = name;
        this.displayNameKey = displayNameKey;        
    }
}

export class ExpandCollapseGroup extends BaseLabelsItem {
    public customizeExpandCollapse = new ToggleSwitch({
        name: "customizeExpandCollapse",
        displayNameKey: "Visual_Customize",
        value: true
    });

    constructor(name: string, displayNameKey: string, postfix: string = "") {
        super(name, displayNameKey, postfix);
        this.fill.value = { value: "rgb(170, 170, 170)" };
        this.slices = [this.customizeExpandCollapse, this.font, this.fill];
    }

    public setVisibility() {
        if (this.customizeExpandCollapse.value) {
            this.slices = [this.customizeExpandCollapse, this.fill, this.font];
        } else {
            this.slices = [this.customizeExpandCollapse];
        }
    }
}

export class NestedLabelsGroup extends BaseLabelsItem {
    public customizeNestedLabel = new ToggleSwitch({
        name: "customizeNestedLabel",
        displayNameKey: "Visual_Customize",
        value: false
    });

    constructor(name: string, displayNameKey: string, postfix: string = "") {
        super(name, displayNameKey, postfix);
        this.italic.value = true;
        this.slices = [this.fill, this.font, this.customizeNestedLabel];
    }

    public setVisibility() {
        if (this.customizeNestedLabel.value) {
            this.slices = [this.customizeNestedLabel, this.fill, this.font];
        } else {
            this.slices = [this.customizeNestedLabel];
        }
    }
}

export class GeneralLabelsGroup extends BaseLabelsItem {
    public width = new NumUpDown({
        name: "width",
        displayNameKey: "Visual_ColumnWidth",
        value: TaskLabelsCardSettings.DefaultWidth,
        options: {
            minValue: {
                type: ValidatorType.Min,
                value: TaskLabelsCardSettings.MinWidth,
            },
        }
    });

    constructor(name: string, displayNameKey: string,){
        super(name, displayNameKey);
        this.slices = [this.fill, this.font, this.width];
    }
}

export class TaskLabelsCardSettings extends Card {
    public static DefaultWidth: number = 110;
    public static MinWidth: number = 45;

    public show = new ToggleSwitch({
        name: "show",
        displayNameKey: "Visual_Show",
        value: true
    });

    public general = new GeneralLabelsGroup("taskLabelsGeneralGroup", "Visual_General");
    public expandCollapse = new ExpandCollapseGroup("expandCollapseGroup", "Visual_ExpandCollapse", "ExpandCollapse");
    public nestedLabels = new NestedLabelsGroup("nestedLabelsGroup", "Visual_NestedLabels", "NestedLabel");

    public container?: Container = new Container({
        displayNameKey: "Visual_Labels",
        containerItems: [
            this.general,
            this.nestedLabels,
            this.expandCollapse,
        ]
    });

    public topLevelSlice = this.show;
    public name: string = "taskLabels";
    public displayNameKey: string = "Visual_CategoryLabels";

    public setHighContrastMode(colorHelper: ColorHelper): void {
        this.container.containerItems.forEach((item: BaseLabelsItem) => {
            item.fill.value.value = colorHelper.getHighContrastColor("foreground", item.fill.value.value);
            item.fill.visible = !colorHelper.isHighContrast;
        });
    }
    public setVisibility() {
        this.expandCollapse.setVisibility();
        this.nestedLabels.setVisibility();
    }
}
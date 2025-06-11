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

class CustomizeLabelsItem extends BaseLabelsItem {
    public customize: ToggleSwitch;

    constructor(name: string, displayNameKey: string, postfix: string = "") {
        super(name, displayNameKey, postfix);
        this.fill.visible = true;
        this.customize = new ToggleSwitch({
            name: `customize${postfix}`,
            displayNameKey: "Visual_Customize",
            value: true
        });
        this.slices = [this.customize, this.fill, this.font];
    }

    public onPreProcess(): void {
        if (this.customize.value) {
            this.slices = [this.customize, this.fill, this.font];
        } else {
            this.slices = [this.customize];
        }
    }
}

export class ExpandCollapseGroup extends CustomizeLabelsItem {
    constructor(name: string, displayNameKey: string, postfix: string = "") {
        super(name, displayNameKey, postfix);
        this.fill.value = { value: "rgb(170, 170, 170)" };
    }
}

export class NestedLabelsGroup extends CustomizeLabelsItem {
    constructor(name: string, displayNameKey: string, postfix: string = "") {
        super(name, displayNameKey, postfix);
        this.customize.value = false;
        this.italic.value = true;
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

    public general = new GeneralLabelsGroup("taskLabelsGeneralGroup", "Visual_CategoryLabels");
    public expandCollapse = new ExpandCollapseGroup("expandCollapseGroup", "Visual_ExpandCollapse", "ExpandCollapse");
    public nestedLabels = new NestedLabelsGroup("nestedLabelsGroup", "Visual_NestedLabels", "NestedLabel");

    public container?: Container = new Container({
        displayNameKey: "Visual_ApplySettingsTo",
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

    public onPreProcess(): void {
        this.container.containerItems?.forEach((item: BaseLabelsItem) => {
            if (item.onPreProcess){
                item.onPreProcess();
            }
        });
    }
}
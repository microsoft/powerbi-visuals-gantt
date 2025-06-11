import powerbi from "powerbi-visuals-api";
import ValidatorType = powerbi.visuals.ValidatorType;
import DataViewObjectPropertyIdentifier = powerbi.DataViewObjectPropertyIdentifier

import { ColorHelper } from "powerbi-visuals-utils-colorutils";

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import Card = formattingSettings.SimpleCard;
import Container = formattingSettings.Container;
import Slice = formattingSettings.Slice;
import ToggleSwitch = formattingSettings.ToggleSwitch;
import ColorPicker = formattingSettings.ColorPicker;
import Slider = formattingSettings.Slider;
import ItemDropdown = formattingSettings.ItemDropdown;

import { milestoneLineTypes, shapesOptions } from "../enumOptions";
import { MilestoneDataPoint } from "../../interfaces";
import { ISetHighContrastMode } from "./interfaces/ISetHighContrastMode";

export const MilestonesPropertyIdentifier: DataViewObjectPropertyIdentifier = {
    objectName: "milestones",
    propertyName: "fill"
};

export class MilestoneContainerItem extends Card {
    public color: ColorPicker;
    public shape: ItemDropdown;

    constructor(milestone: MilestoneDataPoint) {
        super();
        this.color = new ColorPicker({
            name: "fill",
            displayNameKey: `${milestone.name} color`,
            value: { value: milestone.color },
            selector: ColorHelper.normalizeSelector(milestone.identity.getSelector(), false),
        });
        this.shape = new ItemDropdown({
            name: "shapeType",
            displayNameKey: `${milestone.name} shape`,
            items: shapesOptions,
            value: shapesOptions.find(el => el.value === milestone.shapeType),
            selector: ColorHelper.normalizeSelector(milestone.identity.getSelector(), false),
        });

        this.slices = [this.color, this.shape];
        this.name = milestone.name;
        this.displayNameKey = milestone.name;
    }
}

export class LineContainerItem extends Card {
    public showLines = new ToggleSwitch({
        name: "showLines",
        displayNameKey: "Visual_Show",
        value: true
    });

    public lineColor = new ColorPicker({
        name: "lineColor",
        displayNameKey: "Visual_Color",
        value: { value: "#cccccc" }
    });

    public lineOpacity = new Slider({
        name: "lineOpacity",
        displayNameKey: "Visual_Opacity",
        value: 100,
        options: {
            minValue: { value: 0, type: ValidatorType.Min },
            maxValue: { value: 100, type: ValidatorType.Max },
        }
    });

    public lineType = new ItemDropdown({
        name: "lineType",
        displayNameKey: "Visual_Type",
        items: milestoneLineTypes,
        value: milestoneLineTypes[0]
    });

    public name: string = "lineGroup";
    public displayNameKey: string = "Visual_Line";
    public topLevelSlice: ToggleSwitch = this.showLines;
    public slices: Slice[] = [this.lineColor, this.lineOpacity, this.lineType];
}

export class MilestonesCardSettings extends Card implements ISetHighContrastMode {
    public name: string = "milestones";
    public displayNameKey: string = "Visual_Milestones";
    public lineGroup: LineContainerItem = new LineContainerItem();
    public container: Container = new Container({
        displayNameKey: "Visual_Container",
        containerItems: [
            this.lineGroup
        ]
    });

    public populateMilestones(milestones: MilestoneDataPoint[]) {
        if (!milestones || milestones.length === 0) {
            return;
        }

        const milestoneGroups: Card[] = milestones.map(milestone => new MilestoneContainerItem(milestone));
        this.container.containerItems = [this.lineGroup, ...milestoneGroups];
    }


    public setHighContrastMode(colorHelper: ColorHelper): void {
        const isHighContrast = colorHelper.isHighContrast;

        this.container.containerItems.forEach((item) => {
            item.slices.forEach((slice) => {
                if (slice instanceof ColorPicker) {
                    slice.value.value = colorHelper.getHighContrastColor("foreground", slice.value.value);
                    slice.visible = !isHighContrast;
                }
            });
        });
    }
}
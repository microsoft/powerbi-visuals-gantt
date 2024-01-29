import powerbiVisualsApi from "powerbi-visuals-api";
import {formattingSettings} from "powerbi-visuals-utils-formattingmodel";
import {legendInterfaces} from "powerbi-visuals-utils-chartutils";
import {LegendDataPoint} from "powerbi-visuals-utils-chartutils/lib/legend/legendInterfaces";
import {ColorHelper} from "powerbi-visuals-utils-colorutils";
import {MilestoneShape} from "./enums/milestoneShape";
import {DateType} from "./enums/dateType";
import {ResourceLabelPosition} from "./enums/resourceLabelPosition";
import {DurationUnit} from "./enums/durationUnit";
import ISelectionId = powerbiVisualsApi.visuals.ISelectionId;
import LegendPosition = legendInterfaces.LegendPosition;

import ILocalizationManager = powerbi.extensibility.ILocalizationManager;

import Card = formattingSettings.SimpleCard;
import Model = formattingSettings.Model;

import IEnumMember = powerbi.IEnumMember;
import {Day} from "./enums/day";

const durationUnitsOptions : IEnumMember[] = [
    { displayName: "Visual_DurationUnit_Days", value: DurationUnit.Day },
    { displayName: "Visual_DurationUnit_Hours", value: DurationUnit.Hour },
    { displayName: "Visual_DurationUnit_Minutes", value: DurationUnit.Minute },
    { displayName: "Visual_DurationUnit_Seconds", value: DurationUnit.Second }
]

const dayOfWeekOptions : IEnumMember[] = [
    { displayName: "Visual_Day_Sunday", value: Day.Sunday },
    { displayName: "Visual_Day_Monday", value: Day.Monday },
    { displayName: "Visual_Day_Tuesday", value: Day.Tuesday },
    { displayName: "Visual_Day_Wednesday", value: Day.Wednesday },
    { displayName: "Visual_Day_Thursday", value: Day.Thursday },
    { displayName: "Visual_Day_Friday", value: Day.Friday },
    { displayName: "Visual_Day_Saturday", value: Day.Saturday }
]

export const dateTypeOptions : IEnumMember[] = [
    { displayName: "Visual_DateType_Second", value: DateType.Second },
    { displayName: "Visual_DateType_Minute", value: DateType.Minute },
    { displayName: "Visual_DateType_Hour", value: DateType.Hour },
    { displayName: "Visual_DateType_Day", value: DateType.Day },
    { displayName: "Visual_DateType_Week", value: DateType.Week },
    { displayName: "Visual_DateType_Month", value: DateType.Month },
    { displayName: "Visual_DateType_Quarter", value: DateType.Quarter },
    { displayName: "Visual_DateType_Year", value: DateType.Year }
]

const shapesOptions : IEnumMember[] = [
    { displayName: "Visual_Shape_Rhombus", value: MilestoneShape.Rhombus },
    { displayName: "Visual_Shape_Circle", value: MilestoneShape.Circle },
    { displayName: "Visual_Shape_Square", value: MilestoneShape.Square }
]

const positionOptions : IEnumMember[] = [
    { displayName: "Visual_Position_Top", value: LegendPosition[LegendPosition.Top] },
    { displayName: "Visual_Position_Bottom", value: LegendPosition[LegendPosition.Bottom] },
    { displayName: "Visual_Position_Left", value: LegendPosition[LegendPosition.Left] },
    { displayName: "Visual_Position_Right", value: LegendPosition[LegendPosition.Right] },
    { displayName: "Visual_Position_TopCenter", value: LegendPosition[LegendPosition.TopCenter] },
    { displayName: "Visual_Position_BottomCenter", value: LegendPosition[LegendPosition.BottomCenter] },
    { displayName: "Visual_Position_LeftCenter", value: LegendPosition[LegendPosition.LeftCenter] },
    { displayName: "Visual_Position_RightCenter", value: LegendPosition[LegendPosition.RightCenter] },
];

const resourcePositionOptions : IEnumMember[] = [
    { displayName: "Visual_Position_Top", value: ResourceLabelPosition.Top },
    { displayName: "Visual_Position_Right", value: ResourceLabelPosition.Right },
    { displayName: "Visual_Position_Inside", value: ResourceLabelPosition.Inside }
];

class DurationMinSettings {
    public static readonly DefaultDurationMinValue: number = 1;
    public static readonly MinDurationMinValue: number = 1;
}

class FontSizeSettings {
    public static readonly DefaultFontSize: number = 9;
    public static readonly MinFontSize: number = 8;
    public static readonly MaxFontSize: number = 60;
}

class WidthSettings {
    public static readonly DefaultFontSize: number = 110;
    public static readonly MinFontSize: number = 0;
    public static readonly MaxFontSize: number = 200;
}

class HeightSettings {
    public static readonly DefaultFontSize: number = 40;
    public static readonly MinFontSize: number = 1;
    public static readonly MaxFontSize: number = 50;
}

export class GeneralCardSettings extends Card {

    groupTasks = new formattingSettings.ToggleSwitch({
        name: "groupTasks",
        displayNameKey: "Visual_GroupTasks",
        value: false
    });

    scrollToCurrentTime = new formattingSettings.ToggleSwitch({
        name: "scrollToCurrentTime",
        displayNameKey: "Visual_ScrollToCurrentTime",
        value: false
    });

    displayGridLines = new formattingSettings.ToggleSwitch({
        name: "displayGridLines",
        displayNameKey: "Visual_DisplayGridLines",
        value: true
    });

    durationUnit = new formattingSettings.ItemDropdown({
        name: "durationUnit",
        displayNameKey: "Visual_DurationUnit",
        items: durationUnitsOptions,
        value: durationUnitsOptions[0]
    });

    durationMin = new formattingSettings.NumUpDown({
        name: "durationMin",
        displayNameKey: "Visual_DurationMinimum",
        value: DurationMinSettings.DefaultDurationMinValue,
        options: {
            minValue: {
                type: powerbiVisualsApi.visuals.ValidatorType.Min,
                value: DurationMinSettings.MinDurationMinValue,
            }
        }
    });

    name: string = "general";
    displayNameKey: string = "Visual_General";
    slices = [this.groupTasks, this.scrollToCurrentTime, this.displayGridLines, this.durationUnit, this.durationMin];
}

export class SubTasksCardSettings extends Card {

    inheritParentLegend = new formattingSettings.ToggleSwitch({
        name: "inheritParentLegend",
        displayNameKey: "Visual_InheritParentLegend",
        value: true
    });

    parentDurationByChildren = new formattingSettings.ToggleSwitch({
        name: "parentDurationByChildren",
        displayNameKey: "Visual_ParentDurationByChildren",
        value: true
    });
    
    parentCompletionByChildren = new formattingSettings.ToggleSwitch({
        name: "parentCompletionByChildren",
        displayNameKey: "Visual_ParentCompletionByChildren",
        value: true
    });

    name: string = "subTasks";
    displayNameKey: string = "Visual_SubTasks";
    slices = [this.inheritParentLegend, this.parentDurationByChildren, this.parentCompletionByChildren];
}

export class CollapsedTasksCardSettings extends Card {

    list = new formattingSettings.TextInput({
        name: "list",
        displayNameKey: "Visual_List",
        placeholder: "",
        value: "[]"
    });

    name: string = "collapsedTasks";
    displayNameKey: string = "Visual_CollapsedTasks";
    slices = [this.list];
}

export class CollapsedTasksUpdateIdCardSettings extends Card {

    value = new formattingSettings.TextInput({
        name: "value",
        displayNameKey: "Visual_UpdateId",
        placeholder: "",
        value: ""
    });

    name: string = "collapsedTasksUpdateId";
    displayNameKey: string = "Visual_CollapsedTasksUpdateId";
    slices = [this.value];
}

export class DaysOffCardSettings extends Card {

    show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayNameKey: "Visual_Show",
        value: false
    });

    fill = new formattingSettings.ColorPicker({
        name: "fill",
        displayNameKey: "Visual_Fill",
        value: { value: "#00B093" }
    });

    firstDayOfWeek = new formattingSettings.ItemDropdown({
        name: "firstDayOfWeek",
        displayNameKey: "Visual_FirstDayOfWeek",
        items: dayOfWeekOptions,
        value: dayOfWeekOptions[0]
    });

    name: string = "daysOff";
    displayNameKey: string = "Visual_DaysOff";
    slices = [this.fill, this.firstDayOfWeek];
    topLevelSlice?: formattingSettings.SimpleSlice<any> = this.show;
}

export class LegendCardSettings extends Card {

    show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayNameKey: "Visual_Show",
        value: true
    });

    position = new formattingSettings.ItemDropdown({
        name: "position",
        displayNameKey: "Visual_Position",
        items: positionOptions,
        value: positionOptions[3]
    });

    showTitle = new formattingSettings.ToggleSwitch({
        name: "showTitle",
        displayNameKey: "Visual_Title",
        value: true
    });

    titleText = new formattingSettings.TextInput({
        name: "titleText",
        displayNameKey: "Visual_LegendName",
        placeholder: "",
        value: ""
    });

    labelColor = new formattingSettings.ColorPicker({
        name: "labelColor",
        displayNameKey: "Visual_Color",
        value: { value: "#000000" }
    });

    fontSize = new formattingSettings.NumUpDown({
        name: "fontSize",
        displayNameKey: "Visual_TextSize",
        value: FontSizeSettings.MinFontSize,
        options: {
            minValue: {
                type: powerbiVisualsApi.visuals.ValidatorType.Min,
                value: FontSizeSettings.MinFontSize,
            },
            maxValue: {
                type: powerbiVisualsApi.visuals.ValidatorType.Max,
                value: FontSizeSettings.MaxFontSize,
            }
        }
    });

    fill = new formattingSettings.ColorPicker({
        name: "fill",
        displayNameKey: "Visual_LegendColor",
        value: { value: "#000000" }
    });


    name: string = "legend";
    displayNameKey: string = "Visual_Legend";
    slices = [this.position, this.showTitle, this.titleText, this.labelColor, this.fontSize, this.fill];
    topLevelSlice?: formattingSettings.SimpleSlice<any> = this.show;
}

export class MilestonesCardSettings extends Card {

    fill = new formattingSettings.ColorPicker({
        name: "fill",
        displayNameKey: "Visual_Fill",
        value: { value: "#000000" }
    });

    shapeType = new formattingSettings.ItemDropdown({
        name: "shapeType",
        displayNameKey: "Visual_Shape",
        items: shapesOptions,
        value: shapesOptions[0]
    });

    name: string = "milestones";
    displayNameKey: string = "Visual_Milestones";
    slices = [this.fill, this.shapeType];
}

export class TaskLabelsCardSettings extends Card {

    show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayNameKey: "Visual_Show",
        value: true
    });

    fill = new formattingSettings.ColorPicker({
        name: "fill",
        displayNameKey: "Visual_Fill",
        value: { value: "#000000" }
    });

    fontSize = new formattingSettings.NumUpDown({
        name: "fontSize",
        displayNameKey: "Visual_FontSize",
        value: FontSizeSettings.DefaultFontSize,
        options: {
            minValue: {
                type: powerbiVisualsApi.visuals.ValidatorType.Min,
                value: FontSizeSettings.MinFontSize,
            },
            maxValue: {
                type: powerbiVisualsApi.visuals.ValidatorType.Max,
                value: FontSizeSettings.MaxFontSize,
            }
        }
    });

    width = new formattingSettings.NumUpDown({
        name: "width",
        displayNameKey: "Visual_Width",
        value: WidthSettings.DefaultFontSize,
        options: {
            minValue: {
                type: powerbiVisualsApi.visuals.ValidatorType.Min,
                value: WidthSettings.MinFontSize,
            },
            maxValue: {
                type: powerbiVisualsApi.visuals.ValidatorType.Max,
                value: WidthSettings.MaxFontSize,
            }
        }
    });

    name: string = "taskLabels";
    displayNameKey: string = "Visual_CategoryLabels";
    slices = [this.fill, this.fontSize, this.width];
    topLevelSlice?: formattingSettings.SimpleSlice<any> = this.show;
}

export class TaskCompletionCardSettings extends Card {

    show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayNameKey: "Visual_Show",
        value: true
    });

    maxCompletion = new formattingSettings.NumUpDown({
        name: "maxCompletion",
        displayNameKey: "Visual_MaxCompletion",
        value: undefined
    });

    name: string = "taskCompletion";
    displayNameKey: string = "Visual_TaskCompletion";
    slices = [this.maxCompletion];
    topLevelSlice?: formattingSettings.SimpleSlice<any> = this.show;
}

export class TooltipConfigCardSettings extends Card {

    dateFormat = new formattingSettings.TextInput({
        name: "dateFormat",
        displayNameKey: "Visual_TooltipSettings_DateFormat",
        placeholder: "",
        value: ""
    });

    name: string = "tooltipConfig";
    displayNameKey: string = "Visual_TooltipSettings";
    slices = [this.dateFormat];
}

export class TaskConfigCardSettings extends Card {

    fill = new formattingSettings.ColorPicker({
        name: "fill",
        displayNameKey: "Visual_TaskSettings_Color",
        description: "This ONLY takes effect when you have no legend specified",
        descriptionKey: "Visual_Description_TaskSettings_Color",
        value: { value: "#00B099" }
    });

    height = new formattingSettings.NumUpDown({
        name: "height",
        displayNameKey: "Visual_TaskSettings_Height",
        value: HeightSettings.DefaultFontSize,
        options: {
            minValue: {
                type: powerbiVisualsApi.visuals.ValidatorType.Min,
                value: HeightSettings.MinFontSize,
            },
            maxValue: {
                type: powerbiVisualsApi.visuals.ValidatorType.Max,
                value: HeightSettings.MaxFontSize,
            }
        }
    });

    name: string = "taskConfig";
    displayNameKey: string = "Visual_TaskSettings";
    slices = [this.fill, this.height];
}

export class TaskResourceCardSettings extends Card {

    show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayNameKey: "Visual_Show",
        value: true
    });

    fill = new formattingSettings.ColorPicker({
        name: "fill",
        displayNameKey: "Visual_Color",
        value: { value: "#000000" }
    });

    fontSize = new formattingSettings.NumUpDown({
        name: "fontSize",
        displayNameKey: "Visual_FontSize",
        value: FontSizeSettings.DefaultFontSize,
        options: {
            minValue: {
                type: powerbiVisualsApi.visuals.ValidatorType.Min,
                value: FontSizeSettings.MinFontSize,
            },
            maxValue: {
                type: powerbiVisualsApi.visuals.ValidatorType.Max,
                value: FontSizeSettings.MaxFontSize,
            }
        }
    });

    position = new formattingSettings.ItemDropdown({
        name: "position",
        displayNameKey: "Visual_Position",
        items: resourcePositionOptions,
        value: resourcePositionOptions[1]
    });

    fullText = new formattingSettings.ToggleSwitch({
        name: "fullText",
        displayNameKey: "Visual_FullText",
        value: false
    });

    widthByTask = new formattingSettings.ToggleSwitch({
        name: "widthByTask",
        displayNameKey: "Visual_WidthByTask",
        value: false
    });

    name: string = "taskResource";
    displayNameKey: string = "Visual_DataLabels";
    slices = [this.fill, this.fontSize, this.position, this.fullText, this.widthByTask];
    topLevelSlice?: formattingSettings.SimpleSlice<any> = this.show;
}

export class DateTypeCardSettings extends Card {

    type = new formattingSettings.ItemDropdown({
        name: "type",
        displayNameKey: "Visual_Type",
        items: dateTypeOptions,
        value: dateTypeOptions[4]
    });

    todayColor = new formattingSettings.ColorPicker({
        name: "todayColor",
        displayNameKey: "Visual_DateType_TodayColor",
        value: { value: "#000000" }
    });

    axisColor = new formattingSettings.ColorPicker({
        name: "axisColor",
        displayNameKey: "Visual_DateType_AxisColor",
        value: { value: "#000000" }
    });

    axisTextColor = new formattingSettings.ColorPicker({
        name: "axisTextColor",
        displayNameKey: "Visual_DateType_AxisTextColor",
        value: { value: "#000000" }
    });

    name: string = "dateType";
    displayNameKey: string = "Visual_DateType";
    slices = [this.type, this.todayColor, this.axisColor, this.axisTextColor];
}

export class GanttChartSettingsModel extends Model { 
    generalCardSettings = new GeneralCardSettings();
    collapsedTasksCardSettings = new CollapsedTasksCardSettings();
    collapsedTasksUpdateIdCardSettings = new CollapsedTasksUpdateIdCardSettings();
    daysOffCardSettings = new DaysOffCardSettings();
    legendCardSettings = new LegendCardSettings();
    milestonesCardSettings = new MilestonesCardSettings();
    taskLabelsCardSettings = new TaskLabelsCardSettings();
    taskCompletionCardSettings = new TaskCompletionCardSettings();
    tooltipConfigCardSettings = new TooltipConfigCardSettings();
    taskConfigCardSettings = new TaskConfigCardSettings();
    taskResourceCardSettings = new TaskResourceCardSettings();
    dateTypeCardSettings = new DateTypeCardSettings();
    
    cards = [this.generalCardSettings, this.collapsedTasksCardSettings, this.collapsedTasksUpdateIdCardSettings, this.daysOffCardSettings, this.legendCardSettings, 
            this.milestonesCardSettings, this.taskLabelsCardSettings, this.taskCompletionCardSettings, 
            this.tooltipConfigCardSettings, this.taskConfigCardSettings, this.taskResourceCardSettings, this.dateTypeCardSettings];

    
    setLocalizedOptions(localizationManager: ILocalizationManager) {
        this.setLocalizedDisplayName(durationUnitsOptions, localizationManager);
        this.setLocalizedDisplayName(dayOfWeekOptions, localizationManager);
        this.setLocalizedDisplayName(positionOptions, localizationManager);
        this.setLocalizedDisplayName(shapesOptions, localizationManager);
        this.setLocalizedDisplayName(resourcePositionOptions, localizationManager);
        this.setLocalizedDisplayName(dateTypeOptions, localizationManager);
    }       

    enumerateMilestones(milestonesWithoutDublicates) {

        const newSlices = [];

        if (milestonesWithoutDublicates) {
            for (const uniqMilestones in milestonesWithoutDublicates) {
                const milestone = milestonesWithoutDublicates[uniqMilestones];
                newSlices.push(new formattingSettings.ColorPicker({
                    name: this.milestonesCardSettings.fill.name,
                    displayName: `${milestone.name} color`,
                    selector: ColorHelper.normalizeSelector((<ISelectionId>milestone.identity).getSelector(), false),
                    value: { value: milestone.color }
                }));
    
                newSlices.push(new formattingSettings.ItemDropdown({
                    name: this.milestonesCardSettings.shapeType.name,
                    displayName: `${milestone.name} shape`,
                    items: shapesOptions,
                    value: shapesOptions.filter(el => el.value === milestone.shapeType)[0],
                    selector: ColorHelper.normalizeSelector((<ISelectionId>milestone.identity).getSelector(), false),
                }));
            }

            this.milestonesCardSettings.slices = newSlices;
        }

        this.milestonesCardSettings.slices = newSlices;
    }

    enumerateLegend(dataPoints: LegendDataPoint[]) {

        const newSlices = [this.legendCardSettings.show, this.legendCardSettings.position, this.legendCardSettings.showTitle, 
            this.legendCardSettings.titleText, this.legendCardSettings.labelColor, this.legendCardSettings.fontSize, this.legendCardSettings.fill];

        if (dataPoints) {
            newSlices.pop();
            dataPoints.forEach((dataPoint: LegendDataPoint) => {
                newSlices.push(new formattingSettings.ColorPicker({
                    name: "fill",
                    displayName: dataPoint.label,
                    selector: ColorHelper.normalizeSelector((<ISelectionId>dataPoint.identity).getSelector(), false),
                    value: { value: dataPoint.color }
                }));
            });
        }

        this.legendCardSettings.slices = newSlices;
    }

    public setLocalizedDisplayName(options: IEnumMember[], localizationManager: ILocalizationManager) {
        options.forEach(option => {
            option.displayName = localizationManager.getDisplayName(option.displayName.toString())
        });
    }
}

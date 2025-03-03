import powerbiVisualsApi from "powerbi-visuals-api";
import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import { legendInterfaces } from "powerbi-visuals-utils-chartutils";
import { LegendDataPoint } from "powerbi-visuals-utils-chartutils/lib/legend/legendInterfaces";
import { ColorHelper } from "powerbi-visuals-utils-colorutils";
import { MilestoneLineType, MilestoneShape } from "./enums";
import { DateType } from "./enums";
import { ResourceLabelPosition } from "./enums";
import { DurationUnit } from "./enums";
import ValidatorType = powerbiVisualsApi.visuals.ValidatorType;
import ISelectionId = powerbiVisualsApi.visuals.ISelectionId;
import LegendPosition = legendInterfaces.LegendPosition;

import ILocalizationManager = powerbi.extensibility.ILocalizationManager;

import Card = formattingSettings.SimpleCard;
import CompositeCard = formattingSettings.CompositeCard;
import Model = formattingSettings.Model;
import Group = formattingSettings.Group;

import IEnumMember = powerbi.IEnumMember;
import { Day } from "./enums";
import { MilestoneDataPoint } from "./interfaces";

const durationUnitsOptions: IEnumMember[] = [
    { displayName: "Visual_DurationUnit_Days", value: DurationUnit.Day },
    { displayName: "Visual_DurationUnit_Hours", value: DurationUnit.Hour },
    { displayName: "Visual_DurationUnit_Minutes", value: DurationUnit.Minute },
    { displayName: "Visual_DurationUnit_Seconds", value: DurationUnit.Second }
]

const dayOfWeekOptions: IEnumMember[] = [
    { displayName: "Visual_Day_Sunday", value: Day.Sunday },
    { displayName: "Visual_Day_Monday", value: Day.Monday },
    { displayName: "Visual_Day_Tuesday", value: Day.Tuesday },
    { displayName: "Visual_Day_Wednesday", value: Day.Wednesday },
    { displayName: "Visual_Day_Thursday", value: Day.Thursday },
    { displayName: "Visual_Day_Friday", value: Day.Friday },
    { displayName: "Visual_Day_Saturday", value: Day.Saturday }
]

export const dateTypeOptions: IEnumMember[] = [
    { displayName: "Visual_DateType_Second", value: DateType.Second },
    { displayName: "Visual_DateType_Minute", value: DateType.Minute },
    { displayName: "Visual_DateType_Hour", value: DateType.Hour },
    { displayName: "Visual_DateType_Day", value: DateType.Day },
    { displayName: "Visual_DateType_Week", value: DateType.Week },
    { displayName: "Visual_DateType_Month", value: DateType.Month },
    { displayName: "Visual_DateType_Quarter", value: DateType.Quarter },
    { displayName: "Visual_DateType_Year", value: DateType.Year }
]

const shapesOptions: IEnumMember[] = [
    { displayName: "Visual_Shape_Rhombus", value: MilestoneShape.Rhombus },
    { displayName: "Visual_Shape_Circle", value: MilestoneShape.Circle },
    { displayName: "Visual_Shape_Square", value: MilestoneShape.Square }
]

const positionOptions: IEnumMember[] = [
    { displayName: "Visual_Position_Top", value: LegendPosition[LegendPosition.Top] },
    { displayName: "Visual_Position_Bottom", value: LegendPosition[LegendPosition.Bottom] },
    { displayName: "Visual_Position_Left", value: LegendPosition[LegendPosition.Left] },
    { displayName: "Visual_Position_Right", value: LegendPosition[LegendPosition.Right] },
    { displayName: "Visual_Position_TopCenter", value: LegendPosition[LegendPosition.TopCenter] },
    { displayName: "Visual_Position_BottomCenter", value: LegendPosition[LegendPosition.BottomCenter] },
    { displayName: "Visual_Position_LeftCenter", value: LegendPosition[LegendPosition.LeftCenter] },
    { displayName: "Visual_Position_RightCenter", value: LegendPosition[LegendPosition.RightCenter] },
];

const resourcePositionOptions: IEnumMember[] = [
    { displayName: "Visual_Position_Top", value: ResourceLabelPosition.Top },
    { displayName: "Visual_Position_Right", value: ResourceLabelPosition.Right },
    { displayName: "Visual_Position_Inside", value: ResourceLabelPosition.Inside }
];

const milestoneLineTypes: IEnumMember[] = [
    { displayName: "Visual_Milestones_LineType_Dotted", value: MilestoneLineType.Dotted },
    { displayName: "Visual_Milestones_LineType_Solid", value: MilestoneLineType.Solid },
];

class FontSizeSettings {
    public static readonly DefaultTaskLabelFontSize: number = 9;
    public static readonly MinTaskLabelFontSize: number = 8;
    public static readonly LegendDefaultFontSize: number = 8;
    public static readonly LegendMinFontSize: number = 5;
}

export class GeneralCardSettings extends Card {
    private DefaultDurationMin: number = 1;
    private MinDurationMin: number = 1;

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
        value: this.DefaultDurationMin,
        options: {
            minValue: {
                type: ValidatorType.Min,
                value: this.MinDurationMin,
            }
        }
    });

    barsRoundedCorners = new formattingSettings.ToggleSwitch({
        name: "barsRoundedCorners",
        displayName: "Bars Rounded Corners",
        displayNameKey: "Visual_BarsRoundedCorners",
        value: true
    });

    name: string = "general";
    displayNameKey: string = "Visual_General";
    slices = [this.groupTasks, this.scrollToCurrentTime, this.displayGridLines, this.durationUnit, this.durationMin, this.barsRoundedCorners];
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

    visible: boolean = false;
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

    visible: boolean = false;
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
        displayNameKey: "Visual_Color",
        value: { value: "#00B093" }
    });

    firstDayOfWeek = new formattingSettings.ItemDropdown({
        name: "firstDayOfWeek",
        displayNameKey: "Visual_FirstDayOfWeek",
        items: dayOfWeekOptions,
        value: dayOfWeekOptions[0]
    });

    topLevelSlice = this.show;
    name: string = "daysOff";
    displayNameKey: string = "Visual_DaysOff";
    slices = [this.fill, this.firstDayOfWeek];
}

export class LegendCardSettings extends CompositeCard {
    show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayNameKey: "Visual_Show",
        value: true
    });

    showTitle = new formattingSettings.ToggleSwitch({
        name: "showTitle",
        displayNameKey: "Visual_Title",
        value: true
    });

    position = new formattingSettings.ItemDropdown({
        name: "position",
        displayNameKey: "Visual_Position",
        items: positionOptions,
        value: positionOptions[3]
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

    font = new formattingSettings.FontControl({
        name: "font",
        displayNameKey: "Visual_Font",
        fontSize: new formattingSettings.NumUpDown({
            name: "fontSize",
            value: FontSizeSettings.LegendDefaultFontSize,
            options: {
                minValue: { value: FontSizeSettings.LegendMinFontSize, type: ValidatorType.Min },
            },
        }),
        fontFamily: new formattingSettings.FontPicker({
            name: "fontFamily",
            value: "'Segoe UI',wf_segoe-ui_normal,helvetica,arial,sans-serif"
        }),
        bold: new formattingSettings.ToggleSwitch({
            name: "bold",
            value: false,
        }),
        italic: new formattingSettings.ToggleSwitch({
            name: "italic",
            value: false,
        }),
        underline: new formattingSettings.ToggleSwitch({
            name: "underline",
            value: false,
        }),
    });

    legendGeneralGroup = new Group({
        name: "legendGeneralGroup",
        displayNameKey: "Visual_General",
        slices: [
            this.showTitle,
            this.position,
            this.titleText,
            this.labelColor,
            this.font,
        ],
    });

    topLevelSlice = this.show;
    name: string = "legend";
    displayNameKey: string = "Visual_Legend";
    groups = [this.legendGeneralGroup];
}

export class MilestonesCardSettings extends CompositeCard {
    showLines = new formattingSettings.ToggleSwitch({
        name: "showLines",
        displayNameKey: "Visual_Show",
        value: true
    });

    lineColor = new formattingSettings.ColorPicker({
        name: "lineColor",
        displayNameKey: "Visual_Color",
        value: { value: "#cccccc" }
    });

    lineOpacity = new formattingSettings.Slider({
        name: "lineOpacity",
        displayNameKey: "Visual_Opacity",
        value: 100,
        options: {
            minValue: { value: 0, type: ValidatorType.Min },
            maxValue: { value: 100, type: ValidatorType.Max },
        }
    });

    lineType = new formattingSettings.ItemDropdown({
        name: "lineType",
        displayNameKey: "Visual_Type",
        items: milestoneLineTypes,
        value: milestoneLineTypes[0]
    });

    lineGroup = new Group({
        name: "lineGroup",
        displayNameKey: "Visual_Line",
        topLevelSlice: this.showLines,
        slices: [this.lineColor, this.lineOpacity, this.lineType]
    });

    name: string = "milestones";
    displayNameKey: string = "Visual_Milestones";
    groups = [this.lineGroup];
}

export class TaskLabelsCardSettings extends CompositeCard {
    private DefaultWidth: number = 110;
    private MinWidth: number = 0;

    show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayNameKey: "Visual_Show",
        value: true
    });

    fill = new formattingSettings.ColorPicker({
        name: "fill",
        displayNameKey: "Visual_Color",
        value: { value: "#000000" },
    });

    font = new formattingSettings.FontControl({
        name: "font",
        displayNameKey: "Visual_Font",
        fontSize: new formattingSettings.NumUpDown({
            name: "fontSize",
            displayNameKey: "Visual_FontSize",
            value: FontSizeSettings.DefaultTaskLabelFontSize,
            options: {
                minValue: { value: FontSizeSettings.MinTaskLabelFontSize, type: ValidatorType.Min },
            },
        }),
        fontFamily: new formattingSettings.FontPicker({
            name: "fontFamily",
            value: "'Roboto', -apple-system, BlinkMacSystemFont, sans-serif"
        }),
        bold: new formattingSettings.ToggleSwitch({
            name: "bold",
            value: false,
        }),
        italic: new formattingSettings.ToggleSwitch({
            name: "italic",
            value: false,
        }),
        underline: new formattingSettings.ToggleSwitch({
            name: "underline",
            value: false,
        }),
    });

    width = new formattingSettings.NumUpDown({
        name: "width",
        displayNameKey: "Visual_ColumnWidth",
        value: this.DefaultWidth,
        options: {
            minValue: {
                type: ValidatorType.Min,
                value: this.MinWidth,
            },
        }
    });

    taskLabelsGeneralGroup = new Group({
        name: "taskLabelsGeneralGroup",
        displayNameKey: "Visual_General",
        slices: [this.fill, this.font, this.width],
    });

    topLevelSlice = this.show;
    name: string = "taskLabels";
    displayNameKey: string = "Visual_CategoryLabels";
    groups = [this.taskLabelsGeneralGroup];
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

    topLevelSlice = this.show;
    name: string = "taskCompletion";
    displayNameKey: string = "Visual_TaskCompletion";
    slices = [this.maxCompletion];
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
    private DefaultHeight: number = 40;
    private MinHeight: number = 1;

    fill = new formattingSettings.ColorPicker({
        name: "fill",
        displayNameKey: "Visual_TaskSettings_Color",
        description: "This ONLY takes effect when you have no legend specified",
        descriptionKey: "Visual_Description_TaskSettings_Color",
        value: { value: "#00B099" },
    });

    height = new formattingSettings.NumUpDown({
        name: "height",
        displayNameKey: "Visual_TaskSettings_Height",
        value: this.DefaultHeight,
        options: {
            minValue: {
                type: ValidatorType.Min,
                value: this.MinHeight,
            },
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

    matchLegendColors = new formattingSettings.ToggleSwitch({
        name: "matchLegendColors",
        displayNameKey: "Visual_MatchLegendColors",
        value: false,
    });

    fill = new formattingSettings.ColorPicker({
        name: "fill",
        displayNameKey: "Visual_Color",
        value: { value: "#000000" },
    });

    font = new formattingSettings.FontControl({
        name: "font",
        displayNameKey: "Visual_Font",
        fontSize: new formattingSettings.NumUpDown({
            name: "fontSize",
            displayNameKey: "Visual_FontSize",
            value: FontSizeSettings.DefaultTaskLabelFontSize,
            options: {
                minValue: { value: FontSizeSettings.MinTaskLabelFontSize, type: ValidatorType.Min },
            },
        }),
        fontFamily: new formattingSettings.FontPicker({
            name: "fontFamily",
            value: "'Roboto', -apple-system, BlinkMacSystemFont, sans-serif"
        }),
        bold: new formattingSettings.ToggleSwitch({
            name: "bold",
            value: false,
        }),
        italic: new formattingSettings.ToggleSwitch({
            name: "italic",
            value: false,
        }),
        underline: new formattingSettings.ToggleSwitch({
            name: "underline",
            value: false,
        }),
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

    topLevelSlice = this.show;
    name: string = "taskResource";
    displayNameKey: string = "Visual_DataLabels";
    slices = [this.matchLegendColors, this.fill, this.font, this.position, this.fullText, this.widthByTask];
}

export class DateTypeCardSettings extends CompositeCard {
    type = new formattingSettings.ItemDropdown({
        name: "type",
        displayNameKey: "Visual_Type",
        items: dateTypeOptions,
        value: dateTypeOptions[4]
    });

    todayColor = new formattingSettings.ColorPicker({
        name: "todayColor",
        displayNameKey: "Visual_DateType_TodayColor",
        value: { value: "#000000" },
    });

    axisColor = new formattingSettings.ColorPicker({
        name: "axisColor",
        displayNameKey: "Visual_DateType_AxisColor",
        value: { value: "#000000" },
    });

    axisTextColor = new formattingSettings.ColorPicker({
        name: "axisTextColor",
        displayNameKey: "Visual_DateType_AxisTextColor",
        value: { value: "#000000" },
    });

    dateTypeGeneralGroup = new Group({
        name: "dateTypeGeneralGroup",
        displayName: "General",
        displayNameKey: "Visual_General",
        slices: [this.type, this.todayColor, this.axisColor, this.axisTextColor],
    });

    axisFontSize = new formattingSettings.NumUpDown({
        name: "axisFontSize",
        displayName: "Font Size",
        displayNameKey: "Visual_FontSize",
        value: 10,
        options: {
            minValue: { value: 0, type: ValidatorType.Min },
        },
    });

    fontGroup = new Group({
        name: "dateTypeFontGroup",
        displayName: "Font",
        displayNameKey: "Visual_Font",
        slices: [this.axisFontSize],
    });

    name: string = "dateType";
    displayNameKey: string = "Visual_DateType";
    groups = [this.dateTypeGeneralGroup, this.fontGroup];
}

export class BackgroundCardSettings extends CompositeCard {
    generalBackgroundEnable = new formattingSettings.ToggleSwitch({
        name: "generalBackgroundEnable",
        displayName: "Enable background",
        displayNameKey: "Visual_Enable_Background",
        value: false,
    });

    generalBackgroundColor = new formattingSettings.ColorPicker({
        name: "generalBackgroundColor",
        displayName: "Color",
        displayNameKey: "Visual_Color",
        value: { value: "#FFFFFF" },
    });

    generalBackgroundOpacity = new formattingSettings.Slider({
        name: "generalBackgroundOpacity",
        displayName: "Opacity",
        displayNameKey: "Visual_Opacity",
        value: 50,
        options: {
            minValue: { value: 0, type: ValidatorType.Min },
            maxValue: { value: 100, type: ValidatorType.Max },
        }
    });

    generalBackgroundGroup = new Group({
        name: "generalBackgroundGroup",
        displayName: "General background",
        displayNameKey: "Visual_General_Background",
        topLevelSlice: this.generalBackgroundEnable,
        slices: [this.generalBackgroundColor, this.generalBackgroundOpacity],
    });

    categoryLabelsBackgroundEnable = new formattingSettings.ToggleSwitch({
        name: "categoryLabelsBackgroundEnable",
        displayName: "Enable background",
        displayNameKey: "Visual_Enable_Background",
        value: false,
    });

    categoryLabelsBackgroundColor = new formattingSettings.ColorPicker({
        name: "categoryLabelsBackgroundColor",
        displayName: "Color",
        displayNameKey: "Visual_Color",
        value: { value: "#FAFAFA" },
    });

    categoryLabelsBackgroundOpacity = new formattingSettings.Slider({
        name: "categoryLabelsBackgroundOpacity",
        displayName: "Opacity",
        displayNameKey: "Visual_Opacity",
        value: 100,
        options: {
            minValue: { value: 0, type: ValidatorType.Min },
            maxValue: { value: 100, type: ValidatorType.Max },
        }
    });

    categoryLabelsBackgroundGroup = new Group({
        name: "categoryLabelsBackgroundGroup",
        displayName: "Category Labels background",
        displayNameKey: "Visual_CategoryLabels_Background",
        topLevelSlice: this.categoryLabelsBackgroundEnable,
        slices: [this.categoryLabelsBackgroundColor, this.categoryLabelsBackgroundOpacity],
    });

    dateTypeBackgroundEnable = new formattingSettings.ToggleSwitch({
        name: "dateTypeBackgroundEnable",
        displayName: "Enable background",
        displayNameKey: "Visual_Enable_Background",
        value: true,
    });

    dateTypeBackgroundColor = new formattingSettings.ColorPicker({
        name: "dateTypeBackgroundColor",
        displayName: "Color",
        displayNameKey: "Visual_Color",
        value: { value: "#FFFFFF" },
    });

    dateTypeBackgroundOpacity = new formattingSettings.Slider({
        name: "dateTypeBackgroundOpacity",
        displayName: "Opacity",
        displayNameKey: "Visual_Opacity",
        value: 100,
        options: {
            minValue: { value: 0, type: ValidatorType.Min },
            maxValue: { value: 100, type: ValidatorType.Max },
        }
    });

    dateTypeBackgroundGroup = new Group({
        name: "dateTypeBackgroundGroup",
        displayName: "Date type background",
        displayNameKey: "Visual_DateType_Background",
        topLevelSlice: this.dateTypeBackgroundEnable,
        slices: [this.dateTypeBackgroundColor, this.dateTypeBackgroundOpacity],
    });

    name: string = "background";
    displayNameKey: string = "Visual_Background";
    groups = [this.generalBackgroundGroup, this.categoryLabelsBackgroundGroup, this.dateTypeBackgroundGroup];
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
    backgroundCardSettings = new BackgroundCardSettings();

    cards = [
        this.generalCardSettings,
        this.collapsedTasksCardSettings,
        this.collapsedTasksUpdateIdCardSettings,
        this.daysOffCardSettings,
        this.legendCardSettings,
        this.milestonesCardSettings,
        this.taskLabelsCardSettings,
        this.taskCompletionCardSettings,
        this.tooltipConfigCardSettings,
        this.taskConfigCardSettings,
        this.taskResourceCardSettings,
        this.dateTypeCardSettings,
        this.backgroundCardSettings,
    ];


    setLocalizedOptions(localizationManager: ILocalizationManager) {
        this.setLocalizedDisplayName(durationUnitsOptions, localizationManager);
        this.setLocalizedDisplayName(dayOfWeekOptions, localizationManager);
        this.setLocalizedDisplayName(positionOptions, localizationManager);
        this.setLocalizedDisplayName(shapesOptions, localizationManager);
        this.setLocalizedDisplayName(resourcePositionOptions, localizationManager);
        this.setLocalizedDisplayName(dateTypeOptions, localizationManager);
        this.setLocalizedDisplayName(milestoneLineTypes, localizationManager);
    }

    populateMilestones(milestones: {
        [name: string]: MilestoneDataPoint;
    }) {
        if (!milestones) {
            return;
        }

        const updatedGroups: Group[] = [this.milestonesCardSettings.lineGroup];

        for (const milestoneName in milestones) {
            const milestone = milestones[milestoneName];

            if (!milestone) {
                continue;
            }

            const color = new formattingSettings.ColorPicker({
                name: "fill",
                displayNameKey: `${milestone.name} color`,
                value: { value: milestone.color },
                selector: ColorHelper.normalizeSelector(milestone.identity.getSelector(), false),
            });

            const shape = new formattingSettings.ItemDropdown({
                name: "shapeType",
                displayNameKey: `${milestone.name} shape`,
                items: shapesOptions,
                value: shapesOptions.find(el => el.value === milestone.shapeType),
                selector: ColorHelper.normalizeSelector(milestone.identity.getSelector(), false),
            });

            const newGroup = new Group({
                name: milestone.name,
                displayName: milestone.name,
                slices: [color, shape]
            });

            updatedGroups.push(newGroup);
        }

        this.milestonesCardSettings.groups = updatedGroups;
    }

    public populateLegend(dataPoints: LegendDataPoint[], localizationManager: ILocalizationManager) {
        if (!dataPoints || dataPoints.length === 0) {
            return;
        }

        const legendColorsGroup = new Group({
            name: "legendColorsGroup",
            displayNameKey: "Visual_Colors",
            slices: []
        });

        this.legendCardSettings.groups.push(legendColorsGroup);

        for (const dataPoint of dataPoints) {
            legendColorsGroup.slices.push(new formattingSettings.ColorPicker({
                name: "fill",
                displayName: dataPoint.label || localizationManager.getDisplayName("Visual_LegendColor"),
                selector: ColorHelper.normalizeSelector((<ISelectionId>dataPoint.identity).getSelector(), false),
                value: { value: dataPoint.color }
            }));
        }
    }

    public setLocalizedDisplayName(options: IEnumMember[], localizationManager: ILocalizationManager) {
        options.forEach(option => {
            option.displayName = localizationManager.getDisplayName(option.displayName.toString())
        });
    }
}

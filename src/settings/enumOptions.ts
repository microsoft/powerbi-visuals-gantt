import { formattingSettingsInterfaces } from "powerbi-visuals-utils-formattingmodel";
import ILocalizedItemMember = formattingSettingsInterfaces.ILocalizedItemMember;

import { legendInterfaces } from "powerbi-visuals-utils-chartutils";
import LegendPosition = legendInterfaces.LegendPosition;

import { MilestoneLineType, MilestoneShape } from "../enums";
import { DateType } from "../enums";
import { ResourceLabelPosition } from "../enums";
import { DurationUnit } from "../enums";
import { Day } from "../enums";

export const durationUnitsOptions: ILocalizedItemMember[] = [
    { displayNameKey: "Visual_DurationUnit_Days", value: DurationUnit.Day },
    { displayNameKey: "Visual_DurationUnit_Hours", value: DurationUnit.Hour },
    { displayNameKey: "Visual_DurationUnit_Minutes", value: DurationUnit.Minute },
    { displayNameKey: "Visual_DurationUnit_Seconds", value: DurationUnit.Second }
]

export const dayOfWeekOptions: ILocalizedItemMember[] = [
    { displayNameKey: "Visual_Day_Sunday", value: Day.Sunday },
    { displayNameKey: "Visual_Day_Monday", value: Day.Monday },
    { displayNameKey: "Visual_Day_Tuesday", value: Day.Tuesday },
    { displayNameKey: "Visual_Day_Wednesday", value: Day.Wednesday },
    { displayNameKey: "Visual_Day_Thursday", value: Day.Thursday },
    { displayNameKey: "Visual_Day_Friday", value: Day.Friday },
    { displayNameKey: "Visual_Day_Saturday", value: Day.Saturday }
]

export const dateTypeOptions: ILocalizedItemMember[] = [
    { displayNameKey: "Visual_DateType_Second", value: DateType.Second },
    { displayNameKey: "Visual_DateType_Minute", value: DateType.Minute },
    { displayNameKey: "Visual_DateType_Hour", value: DateType.Hour },
    { displayNameKey: "Visual_DateType_Day", value: DateType.Day },
    { displayNameKey: "Visual_DateType_Week", value: DateType.Week },
    { displayNameKey: "Visual_DateType_Month", value: DateType.Month },
    { displayNameKey: "Visual_DateType_Quarter", value: DateType.Quarter },
    { displayNameKey: "Visual_DateType_Year", value: DateType.Year }
]

export const shapesOptions: ILocalizedItemMember[] = [
    { displayNameKey: "Visual_Shape_Rhombus", value: MilestoneShape.Rhombus },
    { displayNameKey: "Visual_Shape_Circle", value: MilestoneShape.Circle },
    { displayNameKey: "Visual_Shape_Square", value: MilestoneShape.Square }
]

export const positionOptions: ILocalizedItemMember[] = [
    { displayNameKey: "Visual_Position_Top", value: LegendPosition[LegendPosition.Top] },
    { displayNameKey: "Visual_Position_Bottom", value: LegendPosition[LegendPosition.Bottom] },
    { displayNameKey: "Visual_Position_Left", value: LegendPosition[LegendPosition.Left] },
    { displayNameKey: "Visual_Position_Right", value: LegendPosition[LegendPosition.Right] },
    { displayNameKey: "Visual_Position_TopCenter", value: LegendPosition[LegendPosition.TopCenter] },
    { displayNameKey: "Visual_Position_BottomCenter", value: LegendPosition[LegendPosition.BottomCenter] },
    { displayNameKey: "Visual_Position_LeftCenter", value: LegendPosition[LegendPosition.LeftCenter] },
    { displayNameKey: "Visual_Position_RightCenter", value: LegendPosition[LegendPosition.RightCenter] },
];

export const resourcePositionOptions: ILocalizedItemMember[] = [
    { displayNameKey: "Visual_Position_Top", value: ResourceLabelPosition.Top },
    { displayNameKey: "Visual_Position_Right", value: ResourceLabelPosition.Right },
    { displayNameKey: "Visual_Position_Inside", value: ResourceLabelPosition.Inside }
];

export const milestoneLineTypes: ILocalizedItemMember[] = [
    { displayNameKey: "Visual_Milestones_LineType_Dotted", value: MilestoneLineType.Dotted },
    { displayNameKey: "Visual_Milestones_LineType_Solid", value: MilestoneLineType.Solid },
];
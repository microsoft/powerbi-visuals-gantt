/*
 *  Power BI Visualizations
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved.
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */
// powerbi.extensibility.utils.dataview
import { dataViewObjectsParser } from "powerbi-visuals-utils-dataviewutils";
import DataViewObjectsParser = dataViewObjectsParser.DataViewObjectsParser;

import { DateTypes, ResourceLabelPositions } from "./gantt";

export class GanttSettings extends DataViewObjectsParser {
    general: GeneralSettings = new GeneralSettings();
    collapsedTasks: CollapsedTasks = new CollapsedTasks();
    daysOff: DaysOffSettings = new DaysOffSettings();
    legend: LegendSettings = new LegendSettings();
    taskLabels: TaskLabelsSettings = new TaskLabelsSettings();
    taskConfig: TaskConfigSettings = new TaskConfigSettings();
    taskCompletion: TaskCompletionSettings = new TaskCompletionSettings();
    taskResource: TaskResourceSettings = new TaskResourceSettings();
    dateType: DateTypeSettings = new DateTypeSettings();
    tooltipConfig: TooltipConfigSettings = new TooltipConfigSettings();
    milestones: MilestonesSettings = new MilestonesSettings();
}

export class GeneralSettings {
    groupTasks: boolean = false;
    scrollToCurrentTime: boolean = false;
    displayGridLines: boolean = true;
    durationUnit: string = "day";
    durationMin: number = 1;
}

export class CollapsedTasks {
    list: string = "[]";
}

export class MilestonesSettings {
    show: boolean = true;
}

export class DaysOffSettings {
    show: boolean = false;
    fill: string = "#00B093";
    firstDayOfWeek: string = "0";
}

export class LegendSettings {
    show: boolean = true;
    position: string = "Right";
    showTitle: boolean = true;
    titleText: string = "";
    labelColor: string = "#000000";
    fontSize: number = 8;
}

export class TaskLabelsSettings {
    show: boolean = true;
    fontColor: string = "#000000";
    fontSize: number = 9;
    width: number = 110;
    sidebarColor: string = "#fafafa";
    sidebarBorderColor: string = "#ccc";
    gridLinesColor: string = "#ccc";
}

export class TaskConfigSettings {
    fill: string = "#00B099";
    height: number = 40;
}

export class TaskCompletionSettings {
    show: boolean = true;
    maxCompletion: number = null;
}

export class TaskResourceSettings {
    show: boolean = true;
    fill: string = "#000000";
    fontSize: number = 9;
    position: ResourceLabelPositions = ResourceLabelPositions.Right;
    fullText: boolean = false;
    widthByTask: boolean = false;
}

export class DateTypeSettings {
    // tslint:disable-next-line:no-reserved-keywords
    type: DateTypes = DateTypes.Week;
    todayColor: string = "#000000";
    axisColor: string = "#000000";
    axisTextColor: string = "#000000";
}

export class TooltipConfigSettings {
    dateFormat: string = null;
}

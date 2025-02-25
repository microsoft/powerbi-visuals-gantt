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

import powerbi from "powerbi-visuals-api";

import DataView = powerbi.DataView;
import IViewport = powerbi.IViewport;
import DataViewCategoryColumn = powerbi.DataViewCategoryColumn;
import DataViewValueColumnGroup = powerbi.DataViewValueColumnGroup;
import VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;

import { valueFormatter as vf } from "powerbi-visuals-utils-formattingutils";
import IValueFormatter = vf.IValueFormatter;

import { legendInterfaces } from "powerbi-visuals-utils-chartutils";
import LegendData = legendInterfaces.LegendData;
import ISelectionId = powerbi.visuals.ISelectionId;

import * as SVGUtil from "powerbi-visuals-utils-svgutils";
import IMargin = SVGUtil.IMargin;

import { GanttChartSettingsModel } from "./ganttChartSettingsModels";
import { SelectableDataPoint } from "./behavior";
import { MilestoneShape } from "./enums";

export type DayOffData = [Date, number];

export interface DaysOffDataForAddition {
    list: DayOffData[];
    amountOfLastDaysOff: number;
}

export interface TaskDaysOff {
    id: number;
    daysOff: DayOffData;
}

export interface ExtraInformation {
    displayName: string;
    value: string;
}

export interface Task extends SelectableDataPoint {
    index: number;
    name: string;
    start: Date;
    duration: number;
    completion: number;
    resource: string;
    end: Date;
    parent: string;
    children: Task[];
    visibility: boolean;
    taskType: string;
    description: string;
    color: string;
    tooltipInfo: VisualTooltipDataItem[];
    extraInformation: ExtraInformation[];
    daysOffList: DayOffData[];
    wasDowngradeDurationUnit: boolean;
    stepDurationTransformation?: number;
    highlight?: boolean;
    Milestones?: Milestone[];
}

export interface GroupedTask {
    index: number;
    name: string;
    tasks: Task[];
}

export interface GanttChartFormatters {
    startDateFormatter: IValueFormatter;
    completionFormatter: IValueFormatter;
}

export interface MilestoneDescriptor {
    type: string;
    color?: string;
    shapeType?: MilestoneShape;
    identity?: ISelectionId;
}

export interface GanttViewModel {
    dataView: DataView;
    settings: GanttChartSettingsModel;
    tasks: Task[];
    legendData: LegendData;
    taskTypes: TaskTypes;
    isDurationFilled: boolean;
    isEndDateFilled: boolean;
    isParentFilled: boolean;
    isResourcesFilled: boolean;
}

export interface TaskTypes { /*TODO: change to more proper name*/
    typeName: string;
    types: TaskTypeMetadata[];
}

export interface TaskTypeMetadata {
    name: string;
    columnGroup: DataViewValueColumnGroup;
    selectionColumn: DataViewCategoryColumn;
}

export interface GanttCalculateScaleAndDomainOptions {
    viewport: IViewport;
    margin: IMargin;
    showCategoryAxisLabel: boolean;
    showValueAxisLabel: boolean;
    forceMerge: boolean;
    categoryAxisScaleType: string;
    valueAxisScaleType: string;
    trimOrdinalDataOnOverflow: boolean;
    forcedTickCount?: number;
    forcedYDomain?: any[];
    forcedXDomain?: any[];
    ensureXDomain?: any;
    ensureYDomain?: any;
    categoryAxisDisplayUnits?: number;
    categoryAxisPrecision?: number;
    valueAxisDisplayUnits?: number;
    valueAxisPrecision?: number;
}

export interface Line {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    tooltipInfo: VisualTooltipDataItem[];
}

export interface LinearStop {
    completion: number;
    color: string;
}

export interface Milestone {
    type: string;
    category?: string;
    start: Date;
    tooltipInfo: VisualTooltipDataItem[];
    color?: string;
    shapeType?: string;
    selectionId?: ISelectionId;
}

export interface MilestonePath extends Milestone {
    taskID: number;
}

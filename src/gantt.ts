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

import "./../style/gantt.less";

import "@babel/polyfill";
import * as d3 from "d3";
import * as _ from "lodash";
import powerbi from "powerbi-visuals-api";

// d3
type Selection<T1, T2 = T1> = d3.Selection<any, T1, any, T2>;
import timeScale = d3.ScaleTime;

// powerbi
import DataView = powerbi.DataView;
import IViewport = powerbi.IViewport;
import SortDirection = powerbi.SortDirection;
import DataViewValueColumn = powerbi.DataViewValueColumn;
import DataViewMetadataColumn = powerbi.DataViewMetadataColumn;
import DataViewValueColumnGroup = powerbi.DataViewValueColumnGroup;
import PrimitiveValue = powerbi.PrimitiveValue;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import DataViewCategoryColumn = powerbi.DataViewCategoryColumn;
import VisualObjectInstanceEnumeration = powerbi.VisualObjectInstanceEnumeration;
import DataViewObjectPropertyIdentifier = powerbi.DataViewObjectPropertyIdentifier;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;
import VisualObjectInstancesToPersist = powerbi.VisualObjectInstancesToPersist;

import IColorPalette = powerbi.extensibility.IColorPalette;
import ILocalizationManager = powerbi.extensibility.ILocalizationManager;
import IVisualEventService = powerbi.extensibility.IVisualEventService;
import VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;

// powerbi.visuals
import ISelectionId = powerbi.visuals.ISelectionId;
import ISelectionIdBuilder = powerbi.visuals.ISelectionIdBuilder;

// powerbi.extensibility.visual
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import IVisual = powerbi.extensibility.visual.IVisual;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;

// powerbi.extensibility.utils.svg
import * as SVGUtil from "powerbi-visuals-utils-svgutils";
import SVGManipulations = SVGUtil.manipulation;
import ClassAndSelector = SVGUtil.CssConstants.ClassAndSelector;
import createClassAndSelector = SVGUtil.CssConstants.createClassAndSelector;
import IMargin = SVGUtil.IMargin;

// powerbi.extensibility.utils.type
import { pixelConverter as PixelConverter, valueType } from "powerbi-visuals-utils-typeutils";
import PrimitiveType = valueType.PrimitiveType;
import ValueType = valueType.ValueType;

// powerbi.extensibility.utils.formatting
import { textMeasurementService as tms, valueFormatter as vf } from "powerbi-visuals-utils-formattingutils";
import ValueFormatter = vf.valueFormatter;
import TextProperties = tms.TextProperties;
import IValueFormatter = vf.IValueFormatter;
import textMeasurementService = tms.textMeasurementService;

// powerbi.extensibility.utils.interactivity
import { interactivityBaseService as interactivityService, interactivitySelectionService } from "powerbi-visuals-utils-interactivityutils";
import appendClearCatcher = interactivityService.appendClearCatcher;
import IInteractiveBehavior = interactivityService.IInteractiveBehavior;
import IInteractivityService = interactivityService.IInteractivityService;
import createInteractivityService = interactivitySelectionService.createInteractivitySelectionService;

// powerbi.extensibility.utils.tooltip
import { createTooltipServiceWrapper, TooltipEventArgs, ITooltipServiceWrapper, TooltipEnabledDataPoint } from "powerbi-visuals-utils-tooltiputils";

// powerbi.extensibility.utils.color
import { ColorHelper } from "powerbi-visuals-utils-colorutils";

// powerbi.extensibility.utils.chart.legend
import { legend as LegendModule, legendInterfaces, OpacityLegendBehavior, axisInterfaces, axisScale, axis as AxisHelper } from "powerbi-visuals-utils-chartutils";
import ILegend = legendInterfaces.ILegend;
import LegendPosition = legendInterfaces.LegendPosition;
import LegendData = legendInterfaces.LegendData;
import createLegend = LegendModule.createLegend;
import LegendDataPoint = legendInterfaces.LegendDataPoint;

// powerbi.extensibility.utils.chart
import IAxisProperties = axisInterfaces.IAxisProperties;

// behavior
import { Behavior, BehaviorOptions } from "./behavior";
import {
    Task,
    Line,
    LinearStop,
    MilestonePath,
    ExtraInformation,
    GanttViewModel,
    DaysOffDataForAddition,
    DayOffData,
    TaskTypeMetadata,
    TaskDaysOff,
    TaskTypes,
    GroupedTask,
    GanttCalculateScaleAndDomainOptions,
    GanttChartFormatters,
    MilestoneData,
    MilestoneDataPoint,
    Milestone
} from "./interfaces";
import { DurationHelper } from "./durationHelper";
import { GanttColumns } from "./columns";
import { GanttSettings, DateTypeSettings } from "./settings";

const PercentFormat: string = "0.00 %;-0.00 %;0.00 %";
const ScrollMargin: number = 100;
const MillisecondsInASecond: number = 1000;
const MillisecondsInAMinute: number = 60 * MillisecondsInASecond;
const MillisecondsInAHour: number = 60 * MillisecondsInAMinute;
const MillisecondsInADay: number = 24 * MillisecondsInAHour;
const MillisecondsInWeek: number = 4 * MillisecondsInADay;
const MillisecondsInAMonth: number = 30 * MillisecondsInADay;
const MillisecondsInAYear: number = 365 * MillisecondsInADay;
const MillisecondsInAQuarter: number = MillisecondsInAYear / 4;
const PaddingTasks: number = 5;
const DaysInAWeekend: number = 2;
const DaysInAWeek: number = 5;
const DefaultChartLineHeight = 40;
const TaskColumnName: string = "Task";
const ParentColumnName: string = "Parent";
const GanttDurationUnitType = [
    "second",
    "minute",
    "hour",
    "day",
];

export enum ResourceLabelPositions {
    Top = <any>"Top",
    Right = <any>"Right",
    Inside = <any>"Inside"
}

export enum DurationUnits {
    Second = <any>"second",
    Minute = <any>"minute",
    Hour = <any>"hour",
    Day = <any>"day",
}

export enum DateTypes {
    Second = <any>"Second",
    Minute = <any>"Minute",
    Hour = <any>"Hour",
    Day = <any>"Day",
    Week = <any>"Week",
    Month = <any>"Month",
    Quarter = <any>"Quarter",
    Year = <any>"Year"
}

export enum LabelsForDateTypes {
    Now = <any>"Now",
    Today = <any>"Today"
}

export enum MilestoneShapeTypes {
    Rhombus = "Rhombus",
    Circle = "Circle",
    Square = "Square"
}

export class SortingOptions {
    isCustomSortingNeeded: boolean;
    sortingDirection: SortDirection;
}

module Selectors {
    export const ClassName: ClassAndSelector = createClassAndSelector("gantt");
    export const Chart: ClassAndSelector = createClassAndSelector("chart");
    export const ChartLine: ClassAndSelector = createClassAndSelector("chart-line");
    export const Body: ClassAndSelector = createClassAndSelector("gantt-body");
    export const AxisGroup: ClassAndSelector = createClassAndSelector("axis");
    export const Domain: ClassAndSelector = createClassAndSelector("domain");
    export const AxisTick: ClassAndSelector = createClassAndSelector("tick");
    export const Tasks: ClassAndSelector = createClassAndSelector("tasks");
    export const TaskGroup: ClassAndSelector = createClassAndSelector("task-group");
    export const SingleTask: ClassAndSelector = createClassAndSelector("task");
    export const TaskRect: ClassAndSelector = createClassAndSelector("task-rect");
    export const TaskMilestone: ClassAndSelector = createClassAndSelector("task-milestone");
    export const TaskProgress: ClassAndSelector = createClassAndSelector("task-progress");
    export const TaskDaysOff: ClassAndSelector = createClassAndSelector("task-days-off");
    export const TaskResource: ClassAndSelector = createClassAndSelector("task-resource");
    export const TaskLabels: ClassAndSelector = createClassAndSelector("task-labels");
    export const TaskLines: ClassAndSelector = createClassAndSelector("task-lines");
    export const LabelLines: ClassAndSelector = createClassAndSelector("label-lines");
    export const TaskLinesRect: ClassAndSelector = createClassAndSelector("task-lines-rect");
    export const TaskTopLine: ClassAndSelector = createClassAndSelector("task-top-line");
    export const CollapseAll: ClassAndSelector = createClassAndSelector("collapse-all");
    export const CollapseAllArrow: ClassAndSelector = createClassAndSelector("collapse-all-arrow");
    export const Label: ClassAndSelector = createClassAndSelector("label");
    export const LegendItems: ClassAndSelector = createClassAndSelector("legendItem");
    export const LegendTitle: ClassAndSelector = createClassAndSelector("legendTitle");
}

module GanttRoles {
    export const Legend: string = "Legend";
    export const Task: string = "Task";
    export const StartDate: string = "StartDate";
    export const EndDate: string = "EndDate";
    export const Duration: string = "Duration";
    export const Completion: string = "Completion";
    export const Resource: string = "Resource";
    export const Tooltips: string = "Tooltips";
    export const Parent: string = "Parent";
    export const Milestones: string = "Milestones";
}

export class Gantt implements IVisual {
    private viewport: IViewport;
    private colors: IColorPalette;
    private colorHelper: ColorHelper;
    private legend: ILegend;

    private textProperties: TextProperties = {
        fontFamily: "wf_segoe-ui_normal",
        fontSize: PixelConverter.toString(9),
    };

    private static LegendPropertyIdentifier: DataViewObjectPropertyIdentifier = {
        objectName: "legend",
        propertyName: "fill"
    };

    private static MilestonesPropertyIdentifier: DataViewObjectPropertyIdentifier = {
        objectName: "milestones",
        propertyName: "fill"
    };

    private static CollapsedTasksPropertyIdentifier: DataViewObjectPropertyIdentifier = {
        objectName: "collapsedTasks",
        propertyName: "list"
    };

    public static DefaultValues = {
        AxisTickSize: 6,
        BarMargin: 2,
        ResourceWidth: 100,
        TaskColor: "#00B099",
        TaskLineColor: "#ccc",
        CollapseAllColor: "#aaa",
        TaskCategoryLabelsRectColor: "#fafafa",
        TaskLineWidth: 15,
        IconMargin: 12,
        IconHeight: 16,
        IconWidth: 15,
        ChildTaskLeftMargin: 25,
        ParentTaskLeftMargin: 0,
        DefaultDateType: "Week",
        DateFormatStrings: {
            Second: "HH:mm:ss",
            Minute: "HH:mm",
            Hour: "HH:mm (dd)",
            Day: "MMM dd",
            Week: "MMM dd",
            Month: "MMM yyyy",
            Quarter: "MMM yyyy",
            Year: "yyyy"
        }
    };

    private static DefaultGraphicWidthPercentage: number = 0.78;
    private static ResourceLabelDefaultDivisionCoefficient: number = 1.5;
    private static DefaultTicksLength: number = 50;
    private static DefaultDuration: number = 250;
    private static TaskLineCoordinateX: number = 15;
    private static AxisLabelClip: number = 40;
    private static AxisLabelStrokeWidth: number = 1;
    private static BarHeightMargin: number = 5;
    private static ChartLineHeightDivider: number = 4;
    private static ResourceWidthPadding: number = 10;
    private static TaskLabelsMarginTop: number = 15;
    private static ComplectionMax: number = 1;
    private static ComplectionMin: number = 0;
    private static ComplectionTotal: number = 100;
    private static MinTasks: number = 1;
    private static ChartLineProportion: number = 1.5;
    private static MilestoneTop: number = 0;
    private static DeviderForCalculatingPadding: number = 4;
    private static LabelTopOffsetForPadding: number = 0.5;
    private static DeviderForCalculatingCenter: number = 2;
    private static SubtasksLeftMargin: number = 10;
    private static NotCompletedTaskOpacity: number = .5;
    private static TaskOpacity: number = 1;
    private static RectRound: number = 7;

    private static get DefaultMargin(): IMargin {
        return {
            top: 50,
            right: 40,
            bottom: 40,
            left: 10
        };
    }

    private margin: IMargin = Gantt.DefaultMargin;

    private body: Selection<any>;
    private ganttSvg: Selection<any>;
    private viewModel: GanttViewModel;
    private timeScale: timeScale<any, any>;
    private collapseAllGroup: Selection<any>;
    private axisGroup: Selection<any>;
    private chartGroup: Selection<any>;
    private taskGroup: Selection<any>;
    private lineGroup: Selection<any>;
    private lineGroupWrapper: Selection<any>;
    private clearCatcher: Selection<any>;
    private ganttDiv: Selection<any>;
    private behavior: Behavior;
    private interactivityService: IInteractivityService<Task | LegendDataPoint>;
    private eventService: IVisualEventService;
    private tooltipServiceWrapper: ITooltipServiceWrapper;
    private host: IVisualHost;
    private localizationManager: ILocalizationManager;
    private isInteractiveChart: boolean = false;
    private groupTasksPrevValue: boolean = false;
    private collapsedTasks: string[] = [];
    private collapseAllImageConsts = {
        minusSvgEncoded: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiA/PjxzdmcgaWQ9IkxheWVyXzEiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDMyIDMyOyIgdmVyc2lvbj0iMS4xIiB2aWV3Qm94PSIwIDAgMzIgMzIiIHhtbDpzcGFjZT0icHJlc2VydmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiPjxnPjxnPjxnPjxwYXRoIGQ9Ik0yMCwxN2gtOGMtMC41NTIyNDYxLDAtMS0wLjQ0NzI2NTYtMS0xczAuNDQ3NzUzOS0xLDEtMWg4YzAuNTUyMjQ2MSwwLDEsMC40NDcyNjU2LDEsMVMyMC41NTIyNDYxLDE3LDIwLDE3eiIvPjwvZz48L2c+PGc+PHBhdGggZD0iTTI0LjcxODc1LDI5SDcuMjgxMjVDNC45MjA0MTAyLDI5LDMsMjcuMDc5MTAxNiwzLDI0LjcxODc1VjcuMjgxMjVDMyw0LjkyMDg5ODQsNC45MjA0MTAyLDMsNy4yODEyNSwzaDE3LjQzNzUgICAgQzI3LjA3OTU4OTgsMywyOSw0LjkyMDg5ODQsMjksNy4yODEyNXYxNy40Mzc1QzI5LDI3LjA3OTEwMTYsMjcuMDc5NTg5OCwyOSwyNC43MTg3NSwyOXogTTcuMjgxMjUsNSAgICBDNi4wMjM0Mzc1LDUsNSw2LjAyMzQzNzUsNSw3LjI4MTI1djE3LjQzNzVDNSwyNS45NzY1NjI1LDYuMDIzNDM3NSwyNyw3LjI4MTI1LDI3aDE3LjQzNzUgICAgQzI1Ljk3NjU2MjUsMjcsMjcsMjUuOTc2NTYyNSwyNywyNC43MTg3NVY3LjI4MTI1QzI3LDYuMDIzNDM3NSwyNS45NzY1NjI1LDUsMjQuNzE4NzUsNUg3LjI4MTI1eiIvPjwvZz48L2c+PC9zdmc+",
        plusSvgEncoded: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiA/PjxzdmcgaWQ9IkxheWVyXzEiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDMyIDMyOyIgdmVyc2lvbj0iMS4xIiB2aWV3Qm94PSIwIDAgMzIgMzIiIHhtbDpzcGFjZT0icHJlc2VydmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiPjxnPjxnPjxnPjxwYXRoIGQ9Ik0xNiwyMWMtMC41NTIyNDYxLDAtMS0wLjQ0NzI2NTYtMS0xdi04YzAtMC41NTI3MzQ0LDAuNDQ3NzUzOS0xLDEtMXMxLDAuNDQ3MjY1NiwxLDF2OCAgICAgQzE3LDIwLjU1MjczNDQsMTYuNTUyMjQ2MSwyMSwxNiwyMXoiLz48L2c+PGc+PHBhdGggZD0iTTIwLDE3aC04Yy0wLjU1MjI0NjEsMC0xLTAuNDQ3MjY1Ni0xLTFzMC40NDc3NTM5LTEsMS0xaDhjMC41NTIyNDYxLDAsMSwwLjQ0NzI2NTYsMSwxUzIwLjU1MjI0NjEsMTcsMjAsMTd6Ii8+PC9nPjwvZz48Zz48cGF0aCBkPSJNMjQuNzE4NzUsMjlINy4yODEyNUM0LjkyMDQxMDIsMjksMywyNy4wNzkxMDE2LDMsMjQuNzE4NzVWNy4yODEyNUMzLDQuOTIwODk4NCw0LjkyMDQxMDIsMyw3LjI4MTI1LDNoMTcuNDM3NSAgICBDMjcuMDc5NTg5OCwzLDI5LDQuOTIwODk4NCwyOSw3LjI4MTI1djE3LjQzNzVDMjksMjcuMDc5MTAxNiwyNy4wNzk1ODk4LDI5LDI0LjcxODc1LDI5eiBNNy4yODEyNSw1ICAgIEM2LjAyMzQzNzUsNSw1LDYuMDIzNDM3NSw1LDcuMjgxMjV2MTcuNDM3NUM1LDI1Ljk3NjU2MjUsNi4wMjM0Mzc1LDI3LDcuMjgxMjUsMjdoMTcuNDM3NSAgICBDMjUuOTc2NTYyNSwyNywyNywyNS45NzY1NjI1LDI3LDI0LjcxODc1VjcuMjgxMjVDMjcsNi4wMjM0Mzc1LDI1Ljk3NjU2MjUsNSwyNC43MTg3NSw1SDcuMjgxMjV6Ii8+PC9nPjwvZz48L3N2Zz4=",
        expandSvgEncoded: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiA/PjxzdmcgaGVpZ2h0PSI0OCIgdmlld0JveD0iMCAwIDQ4IDQ4IiB3aWR0aD0iNDgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTMzLjE3IDE3LjE3bC05LjE3IDkuMTctOS4xNy05LjE3LTIuODMgMi44MyAxMiAxMiAxMi0xMnoiLz48cGF0aCBkPSJNMCAwaDQ4djQ4aC00OHoiIGZpbGw9Im5vbmUiLz48L3N2Zz4=",
        collapseSvgEncoded: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiA/PjxzdmcgaGVpZ2h0PSI0OCIgdmlld0JveD0iMCAwIDQ4IDQ4IiB3aWR0aD0iNDgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTI0IDE2bC0xMiAxMiAyLjgzIDIuODMgOS4xNy05LjE3IDkuMTcgOS4xNyAyLjgzLTIuODN6Ii8+PHBhdGggZD0iTTAgMGg0OHY0OGgtNDh6IiBmaWxsPSJub25lIi8+PC9zdmc+",
        collapseAllFlag: "data-is-collapsed"
    };
    private parentLabelOffset: number = 5;
    private groupLabelSize: number = 25;
    private secondExpandAllIconOffset: number = 7;
    private hasNotNullableDates: boolean = false;

    constructor(options: VisualConstructorOptions) {
        this.init(options);
    }

    private init(options: VisualConstructorOptions): void {
        this.host = options.host;
        this.localizationManager = this.host.createLocalizationManager();
        this.colors = options.host.colorPalette;
        this.colorHelper = new ColorHelper(this.colors);
        this.body = d3.select(options.element);
        this.tooltipServiceWrapper = createTooltipServiceWrapper(this.host.tooltipService, options.element);
        this.behavior = new Behavior();
        this.interactivityService = createInteractivityService(this.host);
        this.eventService = options.host.eventService;

        this.createViewport(options.element);
    }

    /**
     * Create the viewport area of the gantt chart
     */
    private createViewport(element: HTMLElement): void {
        let self = this;
        const axisBackgroundColor: string = this.colorHelper.getThemeColor();
        // create div container to the whole viewport area
        this.ganttDiv = this.body.append("div")
            .classed(Selectors.Body.className, true);

        // create container to the svg area
        this.ganttSvg = this.ganttDiv
            .append("svg")
            .classed(Selectors.ClassName.className, true);

        // create clear catcher
        this.clearCatcher = appendClearCatcher(this.ganttSvg);

        // create chart container
        this.chartGroup = this.ganttSvg
            .append("g")
            .classed(Selectors.Chart.className, true);

        // create tasks container
        this.taskGroup = this.chartGroup
            .append("g")
            .classed(Selectors.Tasks.className, true);

        // create tasks container
        this.taskGroup = this.chartGroup
            .append("g")
            .classed(Selectors.Tasks.className, true);

        // create axis container
        this.axisGroup = this.ganttSvg
            .append("g")
            .classed(Selectors.AxisGroup.className, true);
        this.axisGroup
            .append("rect")
            .attr("width", "100%")
            .attr("y", "-20")
            .attr("height", "40px")
            .attr("fill", axisBackgroundColor);

        // create task lines container
        this.lineGroup = this.ganttSvg
            .append("g")
            .classed(Selectors.TaskLines.className, true);

        this.lineGroupWrapper = this.lineGroup
            .append("rect")
            .classed(Selectors.TaskLinesRect.className, true)
            .attr("height", "100%")
            .attr("width", "0")
            .attr("fill", axisBackgroundColor)
            .attr("y", this.margin.top);

        this.lineGroup
            .append("rect")
            .classed(Selectors.TaskTopLine.className, true)
            .attr("width", "100%")
            .attr("height", 1)
            .attr("y", this.margin.top)
            .attr("fill", Gantt.DefaultValues.TaskLineColor);

        this.collapseAllGroup = this.lineGroup
            .append("g")
            .classed(Selectors.CollapseAll.className, true);

        // create legend container
        const interactiveBehavior: IInteractiveBehavior = this.colorHelper.isHighContrast ? new OpacityLegendBehavior() : null;
        this.legend = createLegend(
            element,
            this.isInteractiveChart,
            this.interactivityService,
            true,
            LegendPosition.Top,
            interactiveBehavior);

        this.ganttDiv.on("scroll", function (evt) {
            if (self.viewModel) {
                const taskLabelsWidth: number = self.viewModel.settings.taskLabels.show
                    ? self.viewModel.settings.taskLabels.width
                    : 0;
                self.axisGroup
                    .attr("transform", SVGManipulations.translate(taskLabelsWidth + self.margin.left + Gantt.SubtasksLeftMargin, Gantt.TaskLabelsMarginTop + this.scrollTop));
                self.lineGroup
                    .attr("transform", SVGManipulations.translate(this.scrollLeft, 0))
                    .attr("height", 20);
            }
        }, false);
    }

    /**
     * Clear the viewport area
     */
    private clearViewport(): void {
        this.ganttDiv
            .style("height", 0)
            .style("width", 0);

        this.body
            .selectAll(Selectors.LegendItems.selectorName)
            .remove();

        this.body
            .selectAll(Selectors.LegendTitle.selectorName)
            .remove();

        this.axisGroup
            .selectAll(Selectors.AxisTick.selectorName)
            .remove();

        this.axisGroup
            .selectAll(Selectors.Domain.selectorName)
            .remove();

        this.collapseAllGroup
            .selectAll(Selectors.CollapseAll.selectorName)
            .remove();

        this.lineGroup
            .selectAll(Selectors.TaskLabels.selectorName)
            .remove();

        this.lineGroup
            .selectAll(Selectors.Label.selectorName)
            .remove();

        this.chartGroup
            .selectAll(Selectors.ChartLine.selectorName)
            .remove();

        this.chartGroup
            .selectAll(Selectors.TaskGroup.selectorName)
            .remove();

        this.chartGroup
            .selectAll(Selectors.SingleTask.selectorName)
            .remove();
    }

    /**
     * Update div container size to the whole viewport area
     */
    private updateChartSize(): void {
        this.ganttDiv
            .style("height", PixelConverter.toString(this.viewport.height))
            .style("width", PixelConverter.toString(this.viewport.width));
    }

    /**
     * Check if dataView has a given role
     * @param column The dataView headers
     * @param name The role to find
     */
    private static hasRole(column: DataViewMetadataColumn, name: string) {
        return column.roles && column.roles[name];
    }

    /**
    * Get the tooltip info (data display names & formated values)
    * @param task All task attributes.
    * @param formatters Formatting options for gantt attributes.
    * @param durationUnit Duration unit option
    */
    public static getTooltipInfo(
        task: Task,
        formatters: GanttChartFormatters,
        durationUnit: string,
        localizationManager: ILocalizationManager,
        isEndDateFillled: boolean): VisualTooltipDataItem[] {

        let tooltipDataArray: VisualTooltipDataItem[] = [];
        if (task.taskType) {
            tooltipDataArray.push({
                displayName: localizationManager.getDisplayName("Role_Legend"),
                value: task.taskType
            });
        }

        tooltipDataArray.push({
            displayName: localizationManager.getDisplayName("Role_Task"),
            value: task.name
        });

        if (task.start && !isNaN(task.start.getDate())) {
            tooltipDataArray.push({
                displayName: localizationManager.getDisplayName("Role_StartDate"),
                value: formatters.startDateFormatter.format(task.start)
            });
        }

        if (_.isEmpty(task.Milestones) && task.end && !isNaN(task.end.getDate())) {
            tooltipDataArray.push({
                displayName: localizationManager.getDisplayName("Role_EndDate"),
                value: formatters.startDateFormatter.format(task.end)
            });
        }

        if (_.isEmpty(task.Milestones) && task.duration && !isEndDateFillled) {
            const durationLabel: string = DurationHelper.generateLabelForDuration(task.duration, durationUnit, localizationManager);
            tooltipDataArray.push({
                displayName: localizationManager.getDisplayName("Role_Duration"),
                value: durationLabel
            });
        }

        if (task.completion) {
            tooltipDataArray.push({
                displayName: localizationManager.getDisplayName("Role_Completion"),
                value: formatters.completionFormatter.format(task.completion)
            });
        }

        if (task.resource) {
            tooltipDataArray.push({
                displayName: localizationManager.getDisplayName("Role_Resource"),
                value: task.resource
            });
        }

        if (task.tooltipInfo && task.tooltipInfo.length) {
            tooltipDataArray.push(...task.tooltipInfo);
        }

        task.extraInformation
            .map(tooltip => {
                if (typeof tooltip.value === "string") {
                    return tooltip;
                }

                const value: any = tooltip.value;

                if (isNaN(Date.parse(value)) || typeof value === "number") {
                    tooltip.value = value.toString();
                } else {
                    tooltip.value = formatters.startDateFormatter.format(value);
                }

                return tooltip;
            })
            .forEach(tooltip => tooltipDataArray.push(tooltip));

        tooltipDataArray
            .filter(x => x.value && typeof x.value !== "string")
            .forEach(tooltip => tooltip.value = tooltip.value.toString());

        return tooltipDataArray;
    }

    /**
    * Check if task has data for task
    * @param dataView
    */
    private static isChartHasTask(dataView: DataView): boolean {
        if (dataView.metadata &&
            dataView.metadata.columns) {
            for (let column of dataView.metadata.columns) {
                if (Gantt.hasRole(column, GanttRoles.Task)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Returns the chart formatters
     * @param dataView The data Model
     * @param cultureSelector The current user culture
     */
    private static getFormatters(
        dataView: DataView,
        settings: GanttSettings,
        cultureSelector: string): GanttChartFormatters {

        if (!dataView ||
            !dataView.metadata ||
            !dataView.metadata.columns) {
            return null;
        }

        let dateFormat: string = "d";
        for (let dvColumn of dataView.metadata.columns) {
            if (Gantt.hasRole(dvColumn, GanttRoles.StartDate)) {
                dateFormat = dvColumn.format;
            }
        }

        // Priority of using date format: Format from dvColumn -> Format by culture selector -> Custom Format
        if (cultureSelector) {
            dateFormat = null;
        }

        if (!settings.tooltipConfig.dateFormat) {
            settings.tooltipConfig.dateFormat = dateFormat;
        }

        if (settings.tooltipConfig.dateFormat &&
            settings.tooltipConfig.dateFormat !== dateFormat) {

            dateFormat = settings.tooltipConfig.dateFormat;
        }

        return <GanttChartFormatters>{
            startDateFormatter: ValueFormatter.create({ format: dateFormat, cultureSelector }),
            completionFormatter: ValueFormatter.create({ format: PercentFormat, value: 1, allowFormatBeautification: true })
        };
    }

    private static createLegend(
        host: IVisualHost,
        colorPalette: IColorPalette,
        settings: GanttSettings,
        taskTypes: TaskTypes,
        useDefaultColor: boolean): LegendData {

        const colorHelper = new ColorHelper(colorPalette, Gantt.LegendPropertyIdentifier);
        const legendData: LegendData = {
            fontSize: settings.legend.fontSize,
            dataPoints: [],
            title: settings.legend.showTitle ? (settings.legend.titleText || taskTypes.typeName) : null,
            labelColor: settings.legend.labelColor
        };

        legendData.dataPoints = taskTypes.types.map(
            (typeMeta: TaskTypeMetadata): LegendDataPoint => {
                let color: string = settings.taskConfig.fill;


                if (!useDefaultColor && !colorHelper.isHighContrast) {
                    color = colorHelper.getColorForMeasure(typeMeta.columnGroup.objects, typeMeta.name);
                }

                return {
                    label: typeMeta.name,
                    color: color,
                    selected: false,
                    identity: host.createSelectionIdBuilder()
                        .withCategory(typeMeta.selectionColumn, 0)
                        .createSelectionId()
                };
            });

        return legendData;
    }

    private static getSortingOptions(dataView: DataView): SortingOptions {
        let sortingOption: SortingOptions = new SortingOptions();

        dataView.metadata.columns.forEach(column => {
            if (column.roles && column.sort && (column.roles[ParentColumnName] || column.roles[TaskColumnName])) {
                sortingOption.isCustomSortingNeeded = true;
                sortingOption.sortingDirection = column.sort;

                return sortingOption;
            }
        });

        return sortingOption;
    }

    private static getMinDurationUnitInMilliseconds(durationUnit: string): number {
        switch (durationUnit) {
            case "hour":
                return MillisecondsInAHour;
            case "minute":
                return MillisecondsInAMinute;
            case "second":
                return MillisecondsInASecond;

            default:
                return MillisecondsInADay;
        }
    }

    private static getUniqueMilestones(milestonesDataPoints: MilestoneDataPoint[]) {
        const milestonesWithoutDublicates = {};
        milestonesDataPoints.forEach((milestone: MilestoneDataPoint) => {
            if (milestone.name) {
                milestonesWithoutDublicates[milestone.name] = milestone;
            }
        });

        return milestonesWithoutDublicates;
    }

    private static createMilestones(
        dataView: DataView,
        host: IVisualHost): MilestoneData {
        let milestonesIndex = -1;
        for (const index in dataView.categorical.categories) {
            const category = dataView.categorical.categories[index];
            if (category.source.roles.Milestones) {
                milestonesIndex = +index;
            }
        }

        let milestoneData: MilestoneData = {
            dataPoints: []
        };
        const milestonesCategory = dataView.categorical.categories[milestonesIndex];
        let milestones: { value: PrimitiveValue, index: number }[] = [];

        if (milestonesCategory && milestonesCategory.values) {
            milestonesCategory.values.forEach((value: PrimitiveValue, index: number) => milestones.push({ value, index }));
            milestones.forEach((milestone) => {
                const milestoneObjects = milestonesCategory.objects && milestonesCategory.objects[milestone.index];
                const selectionBuider: ISelectionIdBuilder = host
                    .createSelectionIdBuilder()
                    .withCategory(milestonesCategory, milestone.index);

                const milestoneDataPoint: MilestoneDataPoint = {
                    name: milestone.value as string,
                    identity: selectionBuider.createSelectionId(),
                    shapeType: milestoneObjects && milestoneObjects.milestones && milestoneObjects.milestones.shapeType ?
                        milestoneObjects.milestones.shapeType as string : MilestoneShapeTypes.Rhombus,
                    color: milestoneObjects && milestoneObjects.milestones && milestoneObjects.milestones.fill ?
                        (milestoneObjects.milestones as any).fill.solid.color : Gantt.DefaultValues.TaskColor
                };
                milestoneData.dataPoints.push(milestoneDataPoint);
            });
        }

        return milestoneData;
    }

    /**
    * Create task objects dataView
    * @param dataView The data Model.
    * @param formatters task attributes represented format.
    * @param taskColor Color of task
    * @param settings settings of visual
    * @param colors colors of groped tasks
    * @param host Host object
    * @param taskTypes
    */
    private static createTasks(
        dataView: DataView,
        taskTypes: TaskTypes,
        host: IVisualHost,
        formatters: GanttChartFormatters,
        colors: IColorPalette,
        settings: GanttSettings,
        taskColor: string,
        localizationManager: ILocalizationManager,
        isEndDateFillled: boolean): Task[] {

        let tasks: Task[] = [],
            addedParents: string[] = [];

        const values: GanttColumns<any> = GanttColumns.getCategoricalValues(dataView);

        if (!values.Task) {
            return tasks;
        }

        const colorHelper: ColorHelper = new ColorHelper(colors, Gantt.LegendPropertyIdentifier);
        const groupValues: GanttColumns<DataViewValueColumn>[] = GanttColumns.getGroupedValueColumns(dataView);
        const sortingOptions: SortingOptions = Gantt.getSortingOptions(dataView);

        let collapsedTasks: string[] = JSON.parse(settings.collapsedTasks.list);
        let durationUnit: string = settings.general.durationUnit;
        let duration: number = settings.general.durationMin;
        let taskProgressShow: boolean = settings.taskCompletion.show;

        let endDate: Date = null;

        values.Task.forEach((categoryValue: PrimitiveValue, index: number) => {
            let color: string = taskColor || Gantt.DefaultValues.TaskColor;
            let completion: number = 0;
            let taskType: TaskTypeMetadata = null;
            let wasDowngradeDurationUnit: boolean = false;
            let tooltips: VisualTooltipDataItem[] = [];
            let stepDurationTransformation: number = 0;

            const selectionBuider: ISelectionIdBuilder = host
                .createSelectionIdBuilder()
                .withCategory(dataView.categorical.categories[0], index);

            if (groupValues) {
                groupValues.forEach((group: GanttColumns<DataViewValueColumn>) => {
                    if (group.Duration && group.Duration.values[index] !== null) {
                        taskType = _.find(taskTypes.types,
                            (typeMeta: TaskTypeMetadata) => typeMeta.name === group.Duration.source.groupName);

                        if (taskType) {
                            selectionBuider.withCategory(taskType.selectionColumn, 0);
                            color = colorHelper.getColorForMeasure(taskType.columnGroup.objects, taskType.name);
                        }

                        duration = group.Duration.values[index] > settings.general.durationMin ? group.Duration.values[index] as number : settings.general.durationMin;

                        if (duration && duration % 1 !== 0) {
                            durationUnit = DurationHelper.downgradeDurationUnit(durationUnit, duration);
                            stepDurationTransformation =
                                GanttDurationUnitType.indexOf(settings.general.durationUnit) - GanttDurationUnitType.indexOf(durationUnit);

                            duration = DurationHelper.transformDuration(duration, durationUnit, stepDurationTransformation);
                            wasDowngradeDurationUnit = true;
                        }

                        completion = ((group.Completion && group.Completion.values[index])
                            && taskProgressShow
                            && Gantt.convertToDecimal(group.Completion.values[index] as number)) || null;

                        if (completion !== null) {
                            if (completion < Gantt.ComplectionMin) {
                                completion = Gantt.ComplectionMin;
                            }

                            if (completion > Gantt.ComplectionMax) {
                                completion = Gantt.ComplectionMax;
                            }
                        }

                    } else if (group.EndDate && group.EndDate.values[index] !== null) {
                        taskType = _.find(taskTypes.types,
                            (typeMeta: TaskTypeMetadata) => typeMeta.name === group.EndDate.source.groupName);

                        if (taskType) {
                            selectionBuider.withCategory(taskType.selectionColumn, 0);
                            color = colorHelper.getColorForMeasure(taskType.columnGroup.objects, taskType.name);
                        }

                        endDate = group.EndDate.values[index] ? group.EndDate.values[index] as Date : null;
                        if (typeof (endDate) === "string" || typeof (endDate) === "number") {
                            endDate = new Date(endDate);
                        }

                        completion = ((group.Completion && group.Completion.values[index])
                            && taskProgressShow
                            && Gantt.convertToDecimal(group.Completion.values[index] as number)) || null;

                        if (completion !== null) {
                            if (completion < Gantt.ComplectionMin) {
                                completion = Gantt.ComplectionMin;
                            }

                            if (completion > Gantt.ComplectionMax) {
                                completion = Gantt.ComplectionMax;
                            }
                        }
                    }
                });
            }

            const selectionId: powerbi.extensibility.ISelectionId = selectionBuider.createSelectionId();
            const extraInformation: ExtraInformation[] = [];
            const resource: string = (values.Resource && values.Resource[index] as string) || "";
            const parent: string = (values.Parent && values.Parent[index] as string) || null;
            const Milestone: string = (values.Milestones && !_.isEmpty(values.Milestones[index]) && values.Milestones[index]) || null;

            const startDate: Date = (values.StartDate && values.StartDate[index]
                && Gantt.isValidDate(new Date(values.StartDate[index])) && new Date(values.StartDate[index]))
                || new Date(Date.now());

            if (values.ExtraInformation) {
                const extraInformationKeys: any[] = Object.keys(values.ExtraInformation);
                for (const key of extraInformationKeys) {
                    const value: string = values.ExtraInformation[key][index];
                    if (value) {
                        extraInformation.push({
                            displayName: key,
                            value: value
                        });
                    }
                }
            }

            const task: Task = {
                color,
                completion,
                resource,
                id: null,
                name: categoryValue as string,
                start: startDate,
                end: endDate,
                parent,
                children: null,
                visibility: true,
                duration,
                taskType: taskType && taskType.name,
                description: categoryValue as string,
                tooltipInfo: tooltips,
                selected: false,
                identity: selectionId,
                extraInformation,
                daysOffList: [],
                wasDowngradeDurationUnit,
                stepDurationTransformation,
                Milestones: Milestone && startDate ? [{ type: Milestone, start: startDate, tooltipInfo: null, category: categoryValue as string }] : []
            };

            if (parent) {
                let parentTask: Task = null;
                if (addedParents.indexOf(parent) === -1) {
                    addedParents.push(parent);

                    parentTask = {
                        id: 0,
                        name: parent,
                        start: null,
                        duration: null,
                        completion: null,
                        resource: null,
                        end: null,
                        parent: null,
                        children: [task],
                        visibility: true,
                        taskType: null,
                        description: null,
                        color: null,
                        tooltipInfo: null,
                        extraInformation: _.includes(collapsedTasks, parent) ? extraInformation : null,
                        daysOffList: null,
                        wasDowngradeDurationUnit: null,
                        selected: null,
                        identity: selectionBuider.createSelectionId(),
                        Milestones: Milestone && startDate ? [{ type: Milestone, start: startDate, tooltipInfo: null, category: categoryValue as string }] : []
                    };

                    tasks.push(parentTask);

                } else {
                    parentTask = tasks.filter(x => x.id === 0 && x.name === parent)[0];

                    parentTask.children.push(task);
                }
            }

            tasks.push(task);
        });

        Gantt.downgradeDurationUnitIfNeeded(tasks, durationUnit);

        if (values.Parent) {
            tasks = Gantt.sortTasksWithParents(tasks, sortingOptions);
        }

        tasks.forEach(task => {
            if (task.children && task.children.length) {
                return;
            }

            if (task.end && task.start) {
                const durationInMilliseconds: number = task.end.getTime() - task.start.getTime(),
                    minDurationUnitInMilliseconds: number = Gantt.getMinDurationUnitInMilliseconds(durationUnit);

                task.end = durationInMilliseconds < minDurationUnitInMilliseconds ? Gantt.getEndDate(durationUnit, task.start, task.duration) : task.end;
            } else {
                task.end = task.end || Gantt.getEndDate(durationUnit, task.start, task.duration);
            }

            if (settings.daysOff.show && duration) {
                let datesDiff: number = 0;
                do {
                    task.daysOffList = Gantt.calculateDaysOff(
                        +settings.daysOff.firstDayOfWeek,
                        new Date(task.start.getTime()),
                        new Date(task.end.getTime())
                    );

                    if (task.daysOffList.length) {
                        let extraDuration = Gantt.calculateExtraDurationDaysOff(task.daysOffList, task.start, task.end, +settings.daysOff.firstDayOfWeek, durationUnit);
                        task.end = Gantt.getEndDate(durationUnit, task.start, task.duration + extraDuration);

                        const lastDayOffListItem = task.daysOffList[task.daysOffList.length - 1];
                        const lastDayOff: Date = lastDayOffListItem[1] === 1 ? lastDayOffListItem[0]
                            : new Date(lastDayOffListItem[0].getFullYear(), lastDayOffListItem[0].getMonth(), lastDayOffListItem[0].getDate() + 1);
                        datesDiff = Math.ceil((task.end.getTime() - lastDayOff.getTime()) / MillisecondsInADay);
                    }
                } while (task.daysOffList.length && datesDiff - DaysInAWeekend > DaysInAWeek);
            }

            if (task.parent) {
                task.visibility = collapsedTasks.indexOf(task.parent) === -1;
            }
        });

        tasks.forEach((task: Task) => {
            if (!task.children || _.includes(collapsedTasks, task.name)) {
                task.tooltipInfo = Gantt.getTooltipInfo(task, formatters, durationUnit, localizationManager, isEndDateFillled);
                if (task.Milestones) {
                    task.Milestones.forEach((milestone) => {
                        const dateFormatted = formatters.startDateFormatter.format(task.start);
                        const dateTypesSettings = settings.dateType;
                        milestone.tooltipInfo = Gantt.getTooltipForMilestoneLine(dateFormatted, localizationManager, dateTypesSettings, [milestone.type], [milestone.category]);

                    });
                }
            }
        });

        return tasks;
    }

    public static sortTasksWithParents(tasks: Task[], sortingOptions: SortingOptions): Task[] {
        const sortingFunction = ((a: Task, b: Task) => {
            if (a.name < b.name) {
                return sortingOptions.sortingDirection === SortDirection.Ascending ? -1 : 1;
            }

            if (a.name > b.name) {
                return sortingOptions.sortingDirection === SortDirection.Ascending ? 1 : -1;
            }

            return 0;
        });

        if (sortingOptions.isCustomSortingNeeded) {
            tasks.sort(sortingFunction);
        }

        let index: number = 0;
        tasks.forEach(task => {
            if (!task.id && !task.parent) {
                task.id = index++;

                if (task.children) {
                    if (sortingOptions.isCustomSortingNeeded) {
                        task.children.sort(sortingFunction);
                    }

                    task.children.forEach(subtask => {
                        subtask.id = subtask.id === null ? index++ : subtask.id;
                    });
                }
            }
        });

        let resultTasks: Task[] = [];

        tasks.forEach((task) => {
            resultTasks[task.id] = task;
        });

        return resultTasks;
    }

    /**
     * Calculate days off
     * @param daysOffDataForAddition Temporary days off data for addition new one
     * @param firstDayOfWeek First day of working week. From settings
     * @param date Date for verifying
     * @param extraCondition Extra condition for handle special case for last date
     */
    private static addNextDaysOff(
        daysOffDataForAddition: DaysOffDataForAddition,
        firstDayOfWeek: number,
        date: Date,
        extraCondition: boolean = false): DaysOffDataForAddition {
        daysOffDataForAddition.amountOfLastDaysOff = 1;
        for (let i = DaysInAWeekend; i > 0; i--) {
            let dateForCheck: Date = new Date(date.getTime() + (i * MillisecondsInADay));
            let alreadyInDaysOffList = false;
            daysOffDataForAddition.list.forEach((item) => {
                const itemDate = item[0];
                if (itemDate.getFullYear() === date.getFullYear() && itemDate.getMonth() === date.getMonth() && itemDate.getDate() === date.getDate()) {
                    alreadyInDaysOffList = true;
                }
            });

            const isFirstDaysOfWeek = dateForCheck.getDay() === +firstDayOfWeek;
            const isFirstDayOff = dateForCheck.getDay() === (+firstDayOfWeek + 5) % 7;
            const isSecondDayOff = dateForCheck.getDay() === (+firstDayOfWeek + 6) % 7;
            const isPartlyUsed = !/00\:00\:00/g.test(dateForCheck.toTimeString());

            if (!alreadyInDaysOffList && isFirstDaysOfWeek && (!extraCondition || (extraCondition && isPartlyUsed))) {
                daysOffDataForAddition.amountOfLastDaysOff = i;
                daysOffDataForAddition.list.push([
                    new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0), i
                ]);
            }

            // Example: some task starts on Saturday 8:30 and ends on Thursday 8:30,
            // so it has extra duration and now will end on next Saturday 8:30
            // --- we need to add days off -- it ends on Monday 8.30
            if (!alreadyInDaysOffList && (isFirstDayOff || isSecondDayOff) && isPartlyUsed) {
                const amount = isFirstDayOff ? 2 : 1;
                daysOffDataForAddition.amountOfLastDaysOff = amount;
                daysOffDataForAddition.list.push([
                    new Date(dateForCheck.getFullYear(), dateForCheck.getMonth(), dateForCheck.getDate(), 0, 0, 0), amount
                ]);
            }
        }

        return daysOffDataForAddition;
    }

    /**
     * Calculates end date from start date and offset for different durationUnits
     * @param durationUnit
     * @param start  Start date
     * @param step An offset
     */
    public static getEndDate(durationUnit: string, start: Date, step: number): Date {
        switch (durationUnit) {
            case DurationUnits.Second.toString():
                return d3.timeSecond.offset(start, step);
            case DurationUnits.Minute.toString():
                return d3.timeMinute.offset(start, step);
            case DurationUnits.Hour.toString():
                return d3.timeHour.offset(start, step);
            default:
                return d3.timeDay.offset(start, step);
        }
    }


    private static isDayOff(date: Date, firstDayOfWeek: number): boolean {
        const isFirstDayOff = date.getDay() === (+firstDayOfWeek + 5) % 7;
        const isSecondDayOff = date.getDay() === (+firstDayOfWeek + 6) % 7;

        return isFirstDayOff || isSecondDayOff;
    }

    private static isOneDay(firstDate: Date, secondDate: Date): boolean {
        return firstDate.getMonth() === secondDate.getMonth() && firstDate.getFullYear() === secondDate.getFullYear()
            && firstDate.getDay() === secondDate.getDay();
    }

    /**
     * Calculate days off
     * @param firstDayOfWeek First day of working week. From settings
     * @param fromDate Start of task
     * @param toDate End of task
     */
    private static calculateDaysOff(
        firstDayOfWeek: number,
        fromDate: Date,
        toDate: Date): DayOffData[] {
        let tempDaysOffData: DaysOffDataForAddition = {
            list: [],
            amountOfLastDaysOff: 0
        };

        if (Gantt.isOneDay(fromDate, toDate)) {
            if (!Gantt.isDayOff(fromDate, +firstDayOfWeek)) {
                return tempDaysOffData.list;
            }
        }

        while (fromDate < toDate) {
            Gantt.addNextDaysOff(tempDaysOffData, firstDayOfWeek, fromDate);
            fromDate.setDate(fromDate.getDate() + tempDaysOffData.amountOfLastDaysOff);
        }

        Gantt.addNextDaysOff(tempDaysOffData, firstDayOfWeek, toDate, true);
        return tempDaysOffData.list;
    }

    private static convertMillisecondsToDuration(milliseconds: number, durationUnit: string): number {
        switch (durationUnit) {
            case DurationUnits.Hour.toString():
                return milliseconds /= MillisecondsInAHour;
            case DurationUnits.Minute.toString():
                return milliseconds /= MillisecondsInAMinute;
            case DurationUnits.Second.toString():
                return milliseconds /= MillisecondsInASecond;

            default:
                return milliseconds /= MillisecondsInADay;
        }
    }

    private static calculateExtraDurationDaysOff(daysOffList: DayOffData[], startDate: Date, endDate: Date, firstDayOfWeek: number, durationUnit: string): number {
        let extraDuration = 0;
        for (let i = 0; i < daysOffList.length; i++) {
            const itemAmount = daysOffList[i][1];
            extraDuration += itemAmount;
            // not to count for neighbour dates
            if (itemAmount === 2 && (i + 1) < daysOffList.length) {
                const itemDate = daysOffList[i][0].getDate();
                const nextDate = daysOffList[i + 1][0].getDate();
                if (itemDate + 1 === nextDate) {
                    i += 2;
                }
            }
        }

        // not to add duration twice
        if (this.isDayOff(startDate, firstDayOfWeek)) {
            let prevDayTimestamp = startDate.getTime();
            let prevDate = new Date(prevDayTimestamp);
            prevDate.setHours(0, 0, 0);

            // in milliseconds
            let alreadyAccountedDuration = startDate.getTime() - prevDate.getTime();
            alreadyAccountedDuration = Gantt.convertMillisecondsToDuration(alreadyAccountedDuration, durationUnit);
            extraDuration = DurationHelper.transformExtraDuration(durationUnit, extraDuration);

            extraDuration -= alreadyAccountedDuration;
        }

        return extraDuration;
    }

    /**
    * Convert the dataView to view model
    * @param dataView The data Model
    * @param host Host object
    * @param colors Color pallete
    */
    public static converter(
        dataView: DataView,
        host: IVisualHost,
        colors: IColorPalette,
        colorHelper: ColorHelper,
        localizationManager: ILocalizationManager): GanttViewModel {

        if (!dataView
            || !dataView.categorical
            || !Gantt.isChartHasTask(dataView)
            || dataView.categorical.categories.length === 0) {
            return null;
        }

        const settings: GanttSettings = this.parseSettings(dataView, colorHelper);
        const taskTypes: TaskTypes = Gantt.getAllTasksTypes(dataView);
        const formatters: GanttChartFormatters = this.getFormatters(dataView, settings, host.locale || null);

        const isDurationFilled: boolean = _.findIndex(dataView.metadata.columns, col => col.roles.hasOwnProperty(GanttRoles.Duration)) !== -1,
            isEndDateFillled: boolean = _.findIndex(dataView.metadata.columns, col => col.roles.hasOwnProperty(GanttRoles.EndDate)) !== -1,
            isParentFilled: boolean = _.findIndex(dataView.metadata.columns, col => col.roles.hasOwnProperty(GanttRoles.Parent)) !== -1;

        const legendData: LegendData = Gantt.createLegend(host, colors, settings, taskTypes, !isDurationFilled && !isEndDateFillled);
        const milestonesData: MilestoneData = Gantt.createMilestones(dataView, host);

        let taskColor: string = (legendData.dataPoints.length <= 1) || !isDurationFilled
            ? settings.taskConfig.fill
            : null;

        const tasks: Task[] = Gantt.createTasks(dataView, taskTypes, host, formatters, colors, settings, taskColor, localizationManager, isEndDateFillled);

        // Remove empty legend if tasks isn't exist
        const types = _.groupBy(tasks, x => x.taskType);
        legendData.dataPoints = legendData.dataPoints.filter(x => types[x.label]);

        return {
            dataView,
            settings,
            taskTypes,
            tasks,
            legendData,
            milestonesData,
            isDurationFilled,
            isEndDateFillled,
            isParentFilled
        };
    }

    public static parseSettings(dataView: DataView, colorHelper: ColorHelper): GanttSettings {
        let settings: GanttSettings = GanttSettings.parse<GanttSettings>(dataView);
        if (!colorHelper) {
            return settings;
        }

        if (colorHelper.isHighContrast) {
            settings.dateType.axisColor = colorHelper.getHighContrastColor("foreground", settings.dateType.axisColor);
            settings.dateType.axisTextColor = colorHelper.getHighContrastColor("foreground", settings.dateType.axisTextColor);
            settings.dateType.todayColor = colorHelper.getHighContrastColor("foreground", settings.dateType.todayColor);

            settings.daysOff.fill = colorHelper.getHighContrastColor("foreground", settings.daysOff.fill);
            settings.taskConfig.fill = colorHelper.getHighContrastColor("foreground", settings.taskConfig.fill);
            settings.taskLabels.fill = colorHelper.getHighContrastColor("foreground", settings.taskLabels.fill);
            settings.taskResource.fill = colorHelper.getHighContrastColor("foreground", settings.taskResource.fill);
            settings.legend.labelColor = colorHelper.getHighContrastColor("foreground", settings.legend.labelColor);
        }

        return settings;
    }

    private static isValidDate(date: Date): boolean {
        if (Object.prototype.toString.call(date) !== "[object Date]") {
            return false;
        }

        return !isNaN(date.getTime());
    }

    private static convertToDecimal(value: number): number {
        if (!((value >= Gantt.ComplectionMin) && (value <= Gantt.ComplectionMax))) {
            return (value / Gantt.ComplectionTotal);
        }

        return value;
    }

    /**
    * Gets all unique types from the tasks array
    * @param dataView The data model.
    */
    private static getAllTasksTypes(dataView: DataView): TaskTypes {
        const taskTypes: TaskTypes = {
            typeName: "",
            types: []
        };
        let index: number = _.findIndex(dataView.metadata.columns, col => col.roles.hasOwnProperty(GanttRoles.Legend));

        if (index !== -1) {
            taskTypes.typeName = dataView.metadata.columns[index].displayName;
            let legendMetaCategoryColumn: DataViewMetadataColumn = dataView.metadata.columns[index];
            let groupValues = dataView.categorical.values.grouped();
            taskTypes.types = groupValues.map((group: DataViewValueColumnGroup): TaskTypeMetadata => {
                let column: DataViewCategoryColumn = {
                    identity: [group.identity],
                    source: {
                        displayName: null,
                        queryName: legendMetaCategoryColumn.queryName
                    },
                    values: null
                };
                return {
                    name: group.name as string,
                    selectionColumn: column,
                    columnGroup: group
                };
            });
        }

        return taskTypes;
    }

    /**
     * Get legend data, calculate position and draw it
     */
    private renderLegend(): void {
        if (!this.viewModel.legendData) {
            return;
        }

        let position: LegendPosition = this.viewModel.settings.legend.show
            ? LegendPosition[this.viewModel.settings.legend.position]
            : LegendPosition.None;

        this.legend.changeOrientation(position);
        this.legend.drawLegend(this.viewModel.legendData, _.clone(this.viewport));
        LegendModule.positionChartArea(this.ganttDiv, this.legend);

        switch (this.legend.getOrientation()) {
            case LegendPosition.Left:
            case LegendPosition.LeftCenter:
            case LegendPosition.Right:
            case LegendPosition.RightCenter:
                this.viewport.width -= this.legend.getMargins().width;
                break;
            case LegendPosition.Top:
            case LegendPosition.TopCenter:
            case LegendPosition.Bottom:
            case LegendPosition.BottomCenter:
                this.viewport.height -= this.legend.getMargins().height;
                break;
        }
    }

    private scaleAxisLength(axisLength: number): number {
        let fullScreenAxisLength: number = Gantt.DefaultGraphicWidthPercentage * this.viewport.width;
        if (axisLength < fullScreenAxisLength) {
            axisLength = fullScreenAxisLength;
        }

        return axisLength;
    }

    /**
    * Called on data change or resizing
    * @param options The visual option that contains the dataview and the viewport
    */
    public update(options: VisualUpdateOptions): void {
        if (!options || !options.dataViews || !options.dataViews[0]) {
            this.clearViewport();
            return;
        }

        this.viewModel = Gantt.converter(options.dataViews[0], this.host, this.colors, this.colorHelper, this.localizationManager);

        // for dublicated milestone types
        if (this.viewModel && this.viewModel.milestonesData) {
            let newMilestoneData: MilestoneData = this.viewModel.milestonesData;
            const milestonesWithoutDublicates = Gantt.getUniqueMilestones(newMilestoneData.dataPoints);

            newMilestoneData.dataPoints.forEach((dataPoint: MilestoneDataPoint) => {
                if (dataPoint.name) {
                    const theSameUniqDataPoint: MilestoneDataPoint = milestonesWithoutDublicates[dataPoint.name];
                    dataPoint.color = theSameUniqDataPoint.color;
                    dataPoint.shapeType = theSameUniqDataPoint.shapeType;
                }
            });

            this.viewModel.milestonesData = newMilestoneData;
        }

        if (!this.viewModel || !this.viewModel.tasks || this.viewModel.tasks.length <= 0) {
            this.clearViewport();
            return;
        }

        this.viewport = _.clone(options.viewport);
        this.margin = Gantt.DefaultMargin;

        this.eventService.renderingStarted(options);
        this.renderLegend();
        this.updateChartSize();

        const visibleTasks = this.viewModel.tasks
            .filter((task: Task) => task.visibility);
        const tasks: Task[] = visibleTasks
            .map((task: Task, i: number) => {
                task.id = i;
                return task;
            });

        if (this.interactivityService) {
            this.interactivityService.applySelectionStateToData(tasks);
        }

        if (tasks.length < Gantt.MinTasks) {
            return;
        }

        let settings = this.viewModel.settings;
        this.collapsedTasks = JSON.parse(settings.collapsedTasks.list);
        let groupedTasks: GroupedTask[] = this.groupTasks(tasks);
        // do smth with task ids
        this.updateCommonTasks(groupedTasks);
        this.updateCommonMilestones(groupedTasks);

        let tasksAfterGrouping: Task[] = [];
        groupedTasks.forEach((t: GroupedTask) => tasksAfterGrouping = tasksAfterGrouping.concat(t.tasks));
        const minDateTask: Task = _.minBy(tasksAfterGrouping, (t) => t.start);
        const maxDateTask: Task = _.maxBy(tasksAfterGrouping, (t) => t.end);
        this.hasNotNullableDates = !!minDateTask && !!maxDateTask;

        let axisLength: number = 0;
        if (this.hasNotNullableDates) {
            let startDate: Date = minDateTask.start;
            let endDate: Date = maxDateTask.end;

            if (startDate.toString() === endDate.toString()) {
                endDate = new Date(endDate.valueOf() + (24 * 60 * 60 * 1000));
            }

            let dateTypeMilliseconds: number = Gantt.getDateType(settings.dateType.type);
            let ticks: number = Math.ceil(Math.round(endDate.valueOf() - startDate.valueOf()) / dateTypeMilliseconds);
            ticks = ticks < 2 ? 2 : ticks;

            axisLength = ticks * Gantt.DefaultTicksLength;
            axisLength = this.scaleAxisLength(axisLength);

            let viewportIn: IViewport = {
                height: this.viewport.height,
                width: axisLength
            };

            let xAxisProperties: IAxisProperties = this.calculateAxes(viewportIn, this.textProperties, startDate, endDate, ticks, false);
            this.timeScale = <timeScale<Date, Date>>xAxisProperties.scale;

            this.renderAxis(xAxisProperties);
        }

        axisLength = this.scaleAxisLength(axisLength);
        this.setDimension(groupedTasks, axisLength, settings);

        this.renderTasks(groupedTasks);
        this.updateTaskLabels(groupedTasks, settings.taskLabels.width);
        this.updateElementsPositions(this.margin);
        this.createMilestoneLine(groupedTasks);

        if (settings.general.scrollToCurrentTime) {
            this.scrollToMilestoneLine(axisLength);
        }

        if (this.interactivityService) {
            const behaviorOptions: BehaviorOptions = {
                clearCatcher: this.clearCatcher,
                taskSelection: this.taskGroup.selectAll(Selectors.SingleTask.selectorName),
                legendSelection: this.body.selectAll(Selectors.LegendItems.selectorName),
                subTasksCollapse: {
                    selection: this.body.selectAll(Selectors.Label.selectorName),
                    callback: this.subTasksCollapseCb.bind(this)
                },
                allSubtasksCollapse: {
                    selection: this.body
                        .selectAll(Selectors.CollapseAllArrow.selectorName),
                    callback: this.subTasksCollapseAll.bind(this)
                },
                interactivityService: this.interactivityService,
                behavior: this.behavior,
                dataPoints: tasks
            };

            this.interactivityService.bind(behaviorOptions);

            this.behavior.renderSelection(false);
        }

        this.eventService.renderingFinished(options);
    }

    private static getDateType(dateType: DateTypes): number {
        switch (dateType) {
            case DateTypes.Second:
                return MillisecondsInASecond;

            case DateTypes.Minute:
                return MillisecondsInAMinute;

            case DateTypes.Hour:
                return MillisecondsInAHour;

            case DateTypes.Day:
                return MillisecondsInADay;

            case DateTypes.Week:
                return MillisecondsInWeek;

            case DateTypes.Month:
                return MillisecondsInAMonth;

            case DateTypes.Quarter:
                return MillisecondsInAQuarter;

            case DateTypes.Year:
                return MillisecondsInAYear;

            default:
                return MillisecondsInWeek;
        }
    }

    private calculateAxes(
        viewportIn: IViewport,
        textProperties: TextProperties,
        startDate: Date,
        endDate: Date,
        ticksCount: number,
        scrollbarVisible: boolean): IAxisProperties {

        let dataTypeDatetime: ValueType = ValueType.fromPrimitiveTypeAndCategory(PrimitiveType.Date);
        let category: DataViewMetadataColumn = {
            displayName: this.localizationManager.getDisplayName("Role_StartDate"),
            queryName: GanttRoles.StartDate,
            type: dataTypeDatetime,
            index: 0
        };

        let visualOptions: GanttCalculateScaleAndDomainOptions = {
            viewport: viewportIn,
            margin: this.margin,
            forcedXDomain: [startDate, endDate],
            forceMerge: false,
            showCategoryAxisLabel: false,
            showValueAxisLabel: false,
            categoryAxisScaleType: axisScale.linear,
            valueAxisScaleType: null,
            valueAxisDisplayUnits: 0,
            categoryAxisDisplayUnits: 0,
            trimOrdinalDataOnOverflow: false,
            forcedTickCount: ticksCount
        };

        const width: number = viewportIn.width;
        let axes: IAxisProperties = this.calculateAxesProperties(viewportIn, visualOptions, category);
        axes.willLabelsFit = AxisHelper.LabelLayoutStrategy.willLabelsFit(
            axes,
            width,
            textMeasurementService.measureSvgTextWidth,
            textProperties);

        // If labels do not fit and we are not scrolling, try word breaking
        axes.willLabelsWordBreak = (!axes.willLabelsFit && !scrollbarVisible) && AxisHelper.LabelLayoutStrategy.willLabelsWordBreak(
            axes, this.margin, width, textMeasurementService.measureSvgTextWidth,
            textMeasurementService.estimateSvgTextHeight, textMeasurementService.getTailoredTextOrDefault,
            textProperties);

        return axes;
    }

    private calculateAxesProperties(
        viewportIn: IViewport,
        options: GanttCalculateScaleAndDomainOptions,
        metaDataColumn: DataViewMetadataColumn): IAxisProperties {

        const dateType: DateTypes = this.viewModel.settings.dateType.type;
        const cultureSelector: string = this.host.locale;
        let xAxisDateFormatter: IValueFormatter = ValueFormatter.create({
            format: Gantt.DefaultValues.DateFormatStrings[dateType],
            cultureSelector
        });
        let xAxisProperties: IAxisProperties = AxisHelper.createAxis({
            pixelSpan: viewportIn.width,
            dataDomain: options.forcedXDomain,
            metaDataColumn: metaDataColumn,
            formatString: Gantt.DefaultValues.DateFormatStrings[dateType],
            outerPadding: 0,
            isScalar: true,
            isVertical: false,
            forcedTickCount: options.forcedTickCount,
            useTickIntervalForDisplayUnits: true,
            isCategoryAxis: true,
            getValueFn: (index) => {
                return xAxisDateFormatter.format(new Date(index));
            },
            scaleType: options.categoryAxisScaleType,
            axisDisplayUnits: options.categoryAxisDisplayUnits,
        });

        xAxisProperties.axisLabel = metaDataColumn.displayName;
        return xAxisProperties;
    }

    private setDimension(
        groupedTasks: GroupedTask[],
        axisLength: number,
        settings: GanttSettings): void {

        const fullResourceLabelMargin = groupedTasks.length * this.getResourceLabelTopMargin();
        const height = PixelConverter.toString(groupedTasks.length * (settings.taskConfig.height || DefaultChartLineHeight) + this.margin.top + fullResourceLabelMargin);
        const width = PixelConverter.toString(this.margin.left + settings.taskLabels.width + axisLength + Gantt.DefaultValues.ResourceWidth);

        this.ganttSvg
            .attr("height", height)
            .attr("width", width);
    }

    private groupTasks(tasks: Task[]): GroupedTask[] {
        if (this.viewModel.settings.general.groupTasks) {
            let groupedTasks: _.Dictionary<Task[]> = _.groupBy(tasks,
                x => (x.parent ? `${x.parent}.${x.name}` : x.name));

            let result: GroupedTask[] = [];
            const taskKeys: string[] = Object.keys(groupedTasks);
            let alreadyReviewedKeys: string[] = [];

            taskKeys.forEach((key: string) => {
                const isKeyAlreadyReviewed = _.includes(alreadyReviewedKeys, key);
                if (!isKeyAlreadyReviewed) {
                    let name: string = key;
                    if (groupedTasks[key][0].parent && key.indexOf(groupedTasks[key][0].parent) !== -1) {
                        name = key.substr(groupedTasks[key][0].parent.length + 1, key.length);
                    }

                    // add current task
                    const taskRecord = <GroupedTask>{
                        name,
                        tasks: groupedTasks[key]
                    };
                    result.push(taskRecord);
                    alreadyReviewedKeys.push(key);

                    // see all the children and add them
                    groupedTasks[key].forEach((task: Task) => {
                        if (task.children && !_.includes(this.collapsedTasks, task.name)) {
                            task.children.forEach((childrenTask: Task) => {
                                const childrenFullName = `${name}.${childrenTask.name}`;
                                const isChildrenKeyAlreadyReviewed = _.includes(alreadyReviewedKeys, childrenFullName);

                                if (!isChildrenKeyAlreadyReviewed) {
                                    const childrenRecord = <GroupedTask>{
                                        name: childrenTask.name,
                                        tasks: groupedTasks[childrenFullName]
                                    };
                                    result.push(childrenRecord);
                                    alreadyReviewedKeys.push(childrenFullName);
                                }
                            });
                        }
                    });
                }
            });

            result.forEach((x, i) => {
                x.tasks.forEach(t => t.id = i);
                x.id = i;
            });

            return result;
        }

        return tasks.map(x => <GroupedTask>{
            name: x.name,
            id: x.id,
            tasks: [x]
        });
    }

    private renderAxis(xAxisProperties: IAxisProperties, duration: number = Gantt.DefaultDuration): void {
        const axisColor: string = this.viewModel.settings.dateType.axisColor;
        const axisTextColor: string = this.viewModel.settings.dateType.axisTextColor;

        let xAxis = xAxisProperties.axis;
        this.axisGroup.call(xAxis.tickSizeOuter(xAxisProperties.outerPadding));

        this.axisGroup
            .transition()
            .duration(duration)
            .call(xAxis);

        this.axisGroup
            .selectAll("path")
            .style("stroke", axisColor);

        this.axisGroup
            .selectAll(".tick line")
            .style("stroke", (timestamp: number) => this.setTickColor(timestamp, axisColor));

        this.axisGroup
            .selectAll(".tick text")
            .style("fill", (timestamp: number) => this.setTickColor(timestamp, axisTextColor));
    }

    private setTickColor(
        timestamp: number,
        defaultColor: string): string {
        const tickTime = new Date(timestamp);
        const firstDayOfWeek: string = this.viewModel.settings.daysOff.firstDayOfWeek;
        const color: string = this.viewModel.settings.daysOff.fill;
        if (this.viewModel.settings.daysOff.show) {
            let dateForCheck: Date = new Date(tickTime.getTime());
            for (let i = 0; i <= DaysInAWeekend; i++) {
                if (dateForCheck.getDay() === +firstDayOfWeek) {
                    return !i
                        ? defaultColor
                        : color;
                }
                dateForCheck.setDate(dateForCheck.getDate() + 1);
            }
        }

        return defaultColor;
    }

    /**
    * Update task labels and add its tooltips
    * @param tasks All tasks array
    * @param width The task label width
    */
    private updateTaskLabels(
        tasks: GroupedTask[],
        width: number): void {

        let axisLabel: Selection<any>;
        let taskLabelsShow: boolean = this.viewModel.settings.taskLabels.show;
        let taskLabelsColor: string = this.viewModel.settings.taskLabels.fill;
        let taskLabelsFontSize: number = this.viewModel.settings.taskLabels.fontSize;
        let taskLabelsWidth: number = this.viewModel.settings.taskLabels.width;
        const categoriesAreaBackgroundColor: string = this.colorHelper.getThemeColor();

        if (taskLabelsShow) {
            this.lineGroupWrapper
                .attr("width", taskLabelsWidth)
                .attr("fill", Gantt.DefaultValues.TaskCategoryLabelsRectColor)
                .attr("stroke", Gantt.DefaultValues.TaskLineColor)
                .attr("stroke-width", 1);

            this.lineGroup
                .selectAll(Selectors.Label.selectorName)
                .remove();

            axisLabel = this.lineGroup
                .selectAll(Selectors.Label.selectorName)
                .data(tasks);

            let axisLabelGroup = axisLabel
                .enter()
                .append("g")
                .merge(axisLabel);

            axisLabelGroup.classed(Selectors.Label.className, true)
                .attr("transform", (task: GroupedTask) => SVGManipulations.translate(0, this.margin.top + this.getTaskLabelCoordinateY(task.id)));

            axisLabelGroup
                .append("text")
                .attr("x", (task: GroupedTask) => (Gantt.TaskLineCoordinateX +
                    (_.every(task.tasks, (task: Task) => !!task.parent)
                        ? Gantt.SubtasksLeftMargin
                        : (task.tasks[0].children && !!task.tasks[0].children.length) ? this.parentLabelOffset : 0)))
                .attr("class", (task: GroupedTask) => task.tasks[0].children ? "parent" : task.tasks[0].parent ? "child" : "normal-node")
                .attr("y", (task: GroupedTask) => (task.id + 0.5) * this.getResourceLabelTopMargin())
                .attr("fill", taskLabelsColor)
                .attr("stroke-width", Gantt.AxisLabelStrokeWidth)
                .style("font-size", PixelConverter.fromPoint(taskLabelsFontSize))
                .text((task: GroupedTask) => task.name)
                .call(AxisHelper.LabelLayoutStrategy.clip, width - Gantt.AxisLabelClip, textMeasurementService.svgEllipsis)
                .append("title")
                .text((task: GroupedTask) => task.name);

            axisLabelGroup
                .filter((task: GroupedTask) => task.tasks[0].children && !!task.tasks[0].children.length)
                .append("image")
                .attr("xlink:href", (task: GroupedTask) => (!task.tasks[0].children[0].visibility ? this.collapseAllImageConsts.plusSvgEncoded : this.collapseAllImageConsts.minusSvgEncoded))
                .attr("width", Gantt.DefaultValues.IconWidth)
                .attr("height", Gantt.DefaultValues.IconHeight)
                .attr("opacity", 0.5)
                .attr("y", (task: GroupedTask) => (task.id + 0.5) * this.getResourceLabelTopMargin() - Gantt.DefaultValues.IconMargin)
                .attr("x", Gantt.DefaultValues.BarMargin);

            let parentTask: string = "";
            let childrenCount = 0;
            let currentChildrenIndex = 0;
            axisLabelGroup
                .append("rect")
                .attr("x", (task: GroupedTask) => {
                    const isGrouped = this.viewModel.settings.general.groupTasks;
                    const drawStandartMargin: boolean = !task.tasks[0].parent || task.tasks[0].parent && task.tasks[0].parent !== parentTask;
                    parentTask = task.tasks[0].parent ? task.tasks[0].parent : task.tasks[0].name;
                    if (task.tasks[0].children) {
                        parentTask = task.tasks[0].name;
                        childrenCount = isGrouped ? _.uniqBy(task.tasks[0].children, "name").length : task.tasks[0].children.length;
                        currentChildrenIndex = 0;
                    }

                    if (task.tasks[0].parent === parentTask) {
                        currentChildrenIndex++;
                    }
                    const isLastChild = childrenCount && childrenCount === currentChildrenIndex;
                    return drawStandartMargin || isLastChild ? Gantt.DefaultValues.ParentTaskLeftMargin : Gantt.DefaultValues.ChildTaskLeftMargin;
                })
                .attr("y", (task: GroupedTask) => Gantt.DefaultValues.TaskLineWidth + (task.id + 1) * this.getResourceLabelTopMargin())
                .attr("width", this.viewport.width)
                .attr("height", 1)
                .attr("fill", Gantt.DefaultValues.TaskLineColor);

            axisLabel
                .exit()
                .remove();

            this.collapseAllGroup
                .selectAll("image")
                .remove();

            this.collapseAllGroup
                .selectAll("rect")
                .remove();

            this.collapseAllGroup
                .selectAll("text")
                .remove();

            if (this.viewModel.isParentFilled) {
                let categoryLabelsWidth: number = this.viewModel.settings.taskLabels.width;
                this.collapseAllGroup
                    .append("rect")
                    .attr("width", categoryLabelsWidth)
                    .attr("height", 2 * Gantt.TaskLabelsMarginTop)
                    .attr("fill", categoriesAreaBackgroundColor);

                this.collapseAllGroup
                    .append("image")
                    .classed(Selectors.CollapseAllArrow.className, true)
                    .attr("xlink:href", (this.collapsedTasks.length ? this.collapseAllImageConsts.expandSvgEncoded : this.collapseAllImageConsts.collapseSvgEncoded))
                    .attr("width", this.groupLabelSize)
                    .attr("height", this.groupLabelSize)
                    .attr("x", 0)
                    .attr("y", this.secondExpandAllIconOffset)
                    .attr(this.collapseAllImageConsts.collapseAllFlag, (this.collapsedTasks.length ? "1" : "0"));

                this.collapseAllGroup
                    .append("text")
                    .attr("x", this.secondExpandAllIconOffset + this.groupLabelSize)
                    .attr("y", this.groupLabelSize)
                    .attr("font-size", "12px")
                    .attr("fill", Gantt.DefaultValues.CollapseAllColor)
                    .text(this.collapsedTasks.length ? "Expand All" : "Collapse All");
            }

        } else {
            this.lineGroupWrapper
                .attr("width", 0)
                .attr("fill", "transparent");

            this.collapseAllGroup
                .selectAll("image")
                .remove();

            this.collapseAllGroup
                .selectAll("rect")
                .remove();

            this.collapseAllGroup
                .selectAll("text")
                .remove();

            this.lineGroup
                .selectAll(Selectors.Label.selectorName)
                .remove();
        }
    }

    /**
     * callback for subtasks click event
     * @param taskClicked Grouped clicked task
     */
    private subTasksCollapseCb(taskClicked: GroupedTask): void {
        const taskIsChild: boolean = taskClicked.tasks[0].parent && !taskClicked.tasks[0].children;
        const taskWithoutParentAndChildren: boolean = !taskClicked.tasks[0].parent && !taskClicked.tasks[0].children;
        if (taskIsChild || taskWithoutParentAndChildren) {
            return;
        }

        const taskClickedParent: string = taskClicked.tasks[0].parent || taskClicked.tasks[0].name;
        this.viewModel.tasks.forEach((task: Task) => {
            if (task.parent === taskClickedParent &&
                task.parent.length >= taskClickedParent.length) {
                const index: number = this.collapsedTasks.indexOf(task.parent);
                if (task.visibility) {
                    this.collapsedTasks.push(task.parent);
                } else {
                    if (taskClickedParent === task.parent) {
                        this.collapsedTasks.splice(index, 1);
                    }
                }
            }
        });

        this.setJsonFiltersValues(this.collapsedTasks);
    }

    /**
     * callback for subtasks collapse all click event
     */
    private subTasksCollapseAll(): void {
        const collapsedAllSelector = this.collapseAllGroup.select(Selectors.CollapseAllArrow.selectorName);
        const isCollapsed: string = collapsedAllSelector.attr(this.collapseAllImageConsts.collapseAllFlag);

        if (isCollapsed === "1") {
            this.collapsedTasks = [];
            collapsedAllSelector.attr(this.collapseAllImageConsts.collapseAllFlag, "0");
            collapsedAllSelector.attr("xlink:href", this.collapseAllImageConsts.collapseSvgEncoded);

        } else {
            collapsedAllSelector.attr(this.collapseAllImageConsts.collapseAllFlag, "1");
            collapsedAllSelector.attr("xlink:href", this.collapseAllImageConsts.expandSvgEncoded);
            this.viewModel.tasks.forEach((task: Task) => {
                if (task.parent) {
                    if (task.visibility) {
                        this.collapsedTasks.push(task.parent);
                    }
                }
            });
        }

        this.setJsonFiltersValues(this.collapsedTasks);
    }

    private setJsonFiltersValues(collapsedValues: string[]) {
        this.host.persistProperties(<VisualObjectInstancesToPersist>{
            merge: [{
                objectName: "collapsedTasks",
                selector: null,
                properties: {
                    list: JSON.stringify(this.collapsedTasks)
                }
            }]
        });
    }


    private drawRoundedRectByPath = (x: number, y: number, width: number, height: number, radius: number) => {
        if (!width || !height) {
            return;
        }
        return "M" + x + "," + y
            + "h" + (width - radius)
            + "a" + radius + "," + radius + " 0 0 1 " + radius + "," + radius
            + "v" + (height - 2 * radius)
            + "a" + radius + "," + radius + " 0 0 1 " + -radius + "," + radius
            + "h" + (2 * radius - width)
            + "a" + radius + "," + radius + " 0 0 1 " + -radius + "," + -radius
            + "v" + (2 * radius - height)
            + "a" + radius + "," + radius + " 0 0 1 " + radius + "," + -radius
            + "z";
    }

    /**
     * Render tasks
     * @param groupedTasks Grouped tasks
     */
    private renderTasks(groupedTasks: GroupedTask[]): void {
        let taskConfigHeight: number = this.viewModel.settings.taskConfig.height || DefaultChartLineHeight;
        let taskGroupSelection: Selection<any> = this.taskGroup
            .selectAll(Selectors.TaskGroup.selectorName)
            .data(groupedTasks);

        taskGroupSelection
            .exit()
            .remove();

        // render task group container
        const taskGroupSelectionMerged = taskGroupSelection
            .enter()
            .append("g")
            .merge(taskGroupSelection);

        taskGroupSelectionMerged.classed(Selectors.TaskGroup.className, true);

        let taskSelection: Selection<Task> = this.taskSelectionRectRender(taskGroupSelectionMerged);
        this.taskMainRectRender(taskSelection, taskConfigHeight);
        this.MilestonesRender(taskSelection, taskConfigHeight);
        this.taskProgressRender(taskSelection);
        this.taskDaysOffRender(taskSelection, taskConfigHeight);
        this.taskResourceRender(taskSelection, taskConfigHeight);

        this.renderTooltip(taskSelection);
    }


    /**
     * Change task structure to be able for
     * Rendering common tasks when all the children of current parent are collapsed
     * used only the Grouping mode is OFF
     * @param groupedTasks Grouped tasks
     */
    private updateCommonTasks(groupedTasks: GroupedTask[]): void {
        if (!this.viewModel.settings.general.groupTasks) {
            groupedTasks.forEach((groupedTask: GroupedTask) => {
                const currentTaskName: string = groupedTask.name;
                if (_.includes(this.collapsedTasks, currentTaskName)) {
                    const firstTask: Task = groupedTask.tasks && groupedTask.tasks[0];
                    const tasks = groupedTask.tasks;
                    tasks.forEach((task: Task) => {
                        if (task.children) {
                            const childrenColors = task.children.map((child: Task) => child.color).filter((color) => color);
                            const minChildDateStart = _.min(task.children.map((child: Task) => child.start).filter((dateStart) => dateStart));
                            const maxChildDateEnd = _.max(task.children.map((child: Task) => child.end).filter((dateStart) => dateStart));
                            firstTask.color = !firstTask.color && task.children ? childrenColors[0] : firstTask.color;
                            firstTask.start = _.min([firstTask.start, minChildDateStart]);
                            firstTask.end = <any>_.max([firstTask.end, maxChildDateEnd]);
                        }
                    });

                    groupedTask.tasks = firstTask && [firstTask] || [];
                }
            });
        }
    }

    /**
     * Change task structure to be able for
     * Rendering common milestone when all the children of current parent are collapsed
     * used only the Grouping mode is OFF
     * @param groupedTasks Grouped tasks
     */
    private updateCommonMilestones(groupedTasks: GroupedTask[]): void {
        groupedTasks.forEach((groupedTask: GroupedTask) => {
            const currentTaskName: string = groupedTask.name;
            if (_.includes(this.collapsedTasks, currentTaskName)) {

                const lastTask: Task = groupedTask.tasks && groupedTask.tasks[groupedTask.tasks.length - 1];
                const tasks = groupedTask.tasks;
                tasks.forEach((task: Task) => {
                    if (task.children) {
                        task.children.map((child: Task) => {
                            if (!_.isEmpty(child.Milestones)) {
                                lastTask.Milestones = lastTask.Milestones.concat(child.Milestones);
                            }
                        });
                    }
                });
            }
        });
    }

    /**
     * Render task progress rect
     * @param taskGroupSelection Task Group Selection
     */
    private taskSelectionRectRender(taskGroupSelection: Selection<any>) {
        let taskSelection: Selection<Task> = taskGroupSelection
            .selectAll(Selectors.SingleTask.selectorName)
            .data((d: GroupedTask) => d.tasks);

        taskSelection
            .exit()
            .remove();

        const taskSelectionMerged = taskSelection
            .enter()
            .append("g")
            .merge(taskSelection);

        taskSelectionMerged.classed(Selectors.SingleTask.className, true);

        return taskSelectionMerged;
    }

    /**
     * @param task
     */
    private getTaskRectWidth(task: Task): number {
        const taskIsCollapsed = _.includes(this.collapsedTasks, task.name);
        return this.hasNotNullableDates && (taskIsCollapsed || _.isEmpty(task.Milestones)) ? this.taskDurationToWidth(task.start, task.end) : 0;
    }

    /**
     *
     * @param task
     * @param taskConfigHeight
     */
    private drawTaskRect(task: Task, taskConfigHeight: number): string {
        const x = this.hasNotNullableDates ? this.timeScale(task.start) : 0,
            y = Gantt.getBarYCoordinate(task.id, taskConfigHeight) + (task.id + 1) * this.getResourceLabelTopMargin(),
            width = this.getTaskRectWidth(task),
            height = Gantt.getBarHeight(taskConfigHeight),
            radius = Gantt.RectRound;

        return this.drawRoundedRectByPath(x, y, width, height, radius);
    }

    /**
     * Render task progress rect
     * @param taskSelection Task Selection
     * @param taskConfigHeight Task heights from settings
     */
    private taskMainRectRender(
        taskSelection: Selection<Task>,
        taskConfigHeight: number): void {
        const highContrastModeTaskRectStroke: number = 1;

        let taskRect: Selection<Task> = taskSelection
            .selectAll(Selectors.TaskRect.selectorName)
            .data((d: Task) => [d]);

        const taskRectMerged = taskRect
            .enter()
            .append("path")
            .merge(taskRect);

        taskRectMerged.classed(Selectors.TaskRect.className, true);

        taskRectMerged
            .attr("d", (task: Task) => this.drawTaskRect(task, taskConfigHeight))
            .attr("width", (task: Task) => this.getTaskRectWidth(task))
            .style("fill", (task: Task) => `url(#task${task.id}-${task.taskType ? task.taskType.toString().replace(/\s+/g, "") : task.taskType})`);

        if (this.colorHelper.isHighContrast) {
            taskRectMerged
                .style("stroke", (task: Task) => this.colorHelper.getHighContrastColor("foreground", task.color))
                .style("stroke-width", highContrastModeTaskRectStroke);
        }

        taskRect
            .exit()
            .remove();
    }

    /**
     *
     * @param milestoneType milestone type
     */
    private getMilestoneColor(milestoneType: string): string {
        const milestone: MilestoneDataPoint = this.viewModel.milestonesData.dataPoints.filter((dataPoint: MilestoneDataPoint) => dataPoint.name === milestoneType)[0];
        if (this.colorHelper.isHighContrast) {
            return this.colorHelper.getHighContrastColor("foreground", milestone.color);
        }

        return milestone.color;
    }

    private static drawRectangle(taskConfigHeight: number): string {
        const startPositions: number = -2;
        return `M ${startPositions} 5 H ${taskConfigHeight / 1.8} V ${taskConfigHeight / 1.5} H ${startPositions} Z`;
    }

    private static drawCircle(taskConfigHeight: number): string {
        const r = taskConfigHeight / 3, cx = taskConfigHeight / 4, cy = taskConfigHeight / 2;
        return `M ${cx} ${cy}  m -${r}, 0 a ${r}, ${r} 0 1,0 ${r * 2},0 a ${r},${r} 0 1,0 -${r * 2},0`;
    }

    private static drawDiamond(taskConfigHeight: number): string {
        return `M ${taskConfigHeight / 4} 0 ${taskConfigHeight / 2} ${taskConfigHeight / 2} ${taskConfigHeight / 4} ${taskConfigHeight} 0 ${taskConfigHeight / 2} Z`;
    }

    private getMilestonePath(milestoneType: string, taskConfigHeight: number): string {
        let shape: string;
        const convertedHeight: number = Gantt.getBarHeight(taskConfigHeight);
        const milestone: MilestoneDataPoint = this.viewModel.milestonesData.dataPoints.filter((dataPoint: MilestoneDataPoint) => dataPoint.name === milestoneType)[0];
        switch (milestone.shapeType) {
            case MilestoneShapeTypes.Rhombus:
                shape = Gantt.drawDiamond(convertedHeight);
                break;
            case MilestoneShapeTypes.Square:
                shape = Gantt.drawRectangle(convertedHeight);
                break;
            case MilestoneShapeTypes.Circle:
                shape = Gantt.drawCircle(convertedHeight);
        }

        return shape;
    }

    /**
     * Render milestones
     * @param taskSelection Task Selection
     * @param taskConfigHeight Task heights from settings
     */
    private MilestonesRender(
        taskSelection: Selection<Task>,
        taskConfigHeight: number): void {
        let taskMilestones: Selection<any> = taskSelection
            .selectAll(Selectors.TaskMilestone.selectorName)
            .data((d: Task) => {
                const nestedByDate = d3.nest().key((d: Milestone) => d.start.toDateString()).entries(d.Milestones);
                let updatedMilestones: MilestonePath[] = nestedByDate.map((nestedObj) => {
                    const oneDateMilestones = nestedObj.values;
                    // if there 2 or more milestones for concrete date => draw only one milestone for concrete date, but with tooltip for all of them
                    let currentMilestone = [...oneDateMilestones].pop();
                    const allTooltipInfo = oneDateMilestones.map((milestone: MilestonePath) => milestone.tooltipInfo);
                    currentMilestone.tooltipInfo = allTooltipInfo.reduce((a, b) => a.concat(b), []);

                    return {
                        type: currentMilestone.type,
                        start: currentMilestone.start,
                        taskID: d.id,
                        tooltipInfo: currentMilestone.tooltipInfo
                    };
                });

                return [{
                    key: d.id, values: <MilestonePath[]>updatedMilestones
                }];
            });


        taskMilestones
            .exit()
            .remove();

        const taskMilestonesAppend = taskMilestones
            .enter()
            .append("g");

        const taskMilestonesMerged = taskMilestonesAppend
            .merge(taskMilestones);

        taskMilestonesMerged.classed(Selectors.TaskMilestone.className, true);

        const transformForMilestone = (id: number, start: Date) => {
            return SVGManipulations.translate(this.timeScale(start) - Gantt.getBarHeight(taskConfigHeight) / 4, Gantt.getBarYCoordinate(id, taskConfigHeight) + (id + 1) * this.getResourceLabelTopMargin());
        };

        let taskMilestonesSelection = taskMilestonesMerged.selectAll("path");
        let taskMilestonesSelectionData = taskMilestonesSelection.data(milestonesData => <MilestonePath[]>milestonesData.values);

        // add milestones: for collapsed task may be several milestones of its children, in usual case - just 1 milestone
        let taskMilestonesSelectionAppend = taskMilestonesSelectionData.enter()
            .append("path");

        taskMilestonesSelectionData
            .exit()
            .remove();

        let taskMilestonesSelectionMerged = taskMilestonesSelectionAppend
            .merge(<any>taskMilestonesSelection);

        taskMilestonesSelectionMerged
            .attr("d", (data: MilestonePath) => this.getMilestonePath(data.type, taskConfigHeight))
            .attr("transform", (data: MilestonePath) => transformForMilestone(data.taskID, data.start))
            .attr("fill", (data: MilestonePath) => this.getMilestoneColor(data.type));

        this.renderTooltip(taskMilestonesSelectionMerged);
    }

    /**
     * Render days off rects
     * @param taskSelection Task Selection
     * @param taskConfigHeight Task heights from settings
     */
    private taskDaysOffRender(
        taskSelection: Selection<Task>,
        taskConfigHeight: number): void {

        const taskDaysOffColor: string = this.viewModel.settings.daysOff.fill;
        const taskDaysOffShow: boolean = this.viewModel.settings.daysOff.show;

        taskSelection
            .selectAll(Selectors.TaskDaysOff.selectorName)
            .remove();

        if (taskDaysOffShow) {
            let tasksDaysOff: Selection<TaskDaysOff, Task> = taskSelection
                .selectAll(Selectors.TaskDaysOff.selectorName)
                .data((d: Task) => {
                    let tasksDaysOff: TaskDaysOff[] = [];

                    if (!d.children && d.daysOffList) {
                        for (let i = 0; i < d.daysOffList.length; i++) {
                            tasksDaysOff.push({
                                id: d.id,
                                daysOff: d.daysOffList[i]
                            });
                        }
                    }

                    return tasksDaysOff;
                });

            const tasksDaysOffMerged = tasksDaysOff
                .enter()
                .append("path")
                .merge(tasksDaysOff);

            tasksDaysOffMerged.classed(Selectors.TaskDaysOff.className, true);

            const getTaskRectDaysOffWidth = (task: TaskDaysOff) => {
                let width = 0;

                if (this.hasNotNullableDates) {
                    const startDate: Date = task.daysOff[0];
                    const startTime: number = startDate.getTime();
                    const endDate: Date = new Date(startTime + (task.daysOff[1] * MillisecondsInADay));

                    width = this.taskDurationToWidth(startDate, endDate);
                }

                return width;
            };

            const drawTaskRectDaysOff = (task: TaskDaysOff) => {

                const x = this.hasNotNullableDates ? this.timeScale(task.daysOff[0]) : 0,
                    y = Gantt.getBarYCoordinate(task.id, taskConfigHeight) + (task.id + 1) * this.getResourceLabelTopMargin(),
                    height = Gantt.getBarHeight(taskConfigHeight),
                    radius = Gantt.RectRound,
                    width = getTaskRectDaysOffWidth(task);

                return this.drawRoundedRectByPath(x, y, width, height, radius);
            };

            tasksDaysOffMerged
                .attr("d", (task: TaskDaysOff) => drawTaskRectDaysOff(task))
                .style("fill", taskDaysOffColor)
                .attr("width", (task: TaskDaysOff) => getTaskRectDaysOffWidth(task));

            tasksDaysOff
                .exit()
                .remove();
        }
    }

    /**
     * Render task progress rect
     * @param taskSelection Task Selection
     */
    private taskProgressRender(
        taskSelection: Selection<Task>): void {
        let taskProgressShow: boolean = this.viewModel.settings.taskCompletion.show;

        let taskProgress: Selection<any> = taskSelection
            .selectAll(Selectors.TaskProgress.selectorName)
            .data((d: Task) => {
                const taskProgressPercentage = this.getDaysOffTaskProgressPercent(d);
                return [{
                    key: `${d.id}-${d.taskType ? d.taskType.toString().replace(/\s+/g, "") : d.taskType}`, values: <LinearStop[]>[
                        { completion: 0, color: d.color },
                        { completion: taskProgressPercentage, color: d.color },
                        { completion: taskProgressPercentage, color: d.color },
                        { completion: 1, color: d.color }
                    ]
                }];
            });

        const taskProgressMerged = taskProgress
            .enter()
            .append("linearGradient")
            .merge(taskProgress);

        taskProgressMerged.classed(Selectors.TaskProgress.className, true);

        taskProgressMerged
            .attr("id", (data) => `task${data.key}`);

        let stopsSelection = taskProgressMerged.selectAll("stop");
        let stopsSelectionData = stopsSelection.data(gradient => <LinearStop[]>gradient.values);

        // draw 4 stops: 1st and 2d stops are for completed rect part; 3d and 4th ones -  for main rect
        stopsSelectionData.enter()
            .append("stop")
            .merge(<any>stopsSelection)
            .attr("offset", (data: LinearStop) => `${data.completion * 100}%`)
            .attr("stop-color", (data: LinearStop) => data.color)
            .attr("stop-opacity", (data: LinearStop, index: number) => (index > 1) && taskProgressShow ? Gantt.NotCompletedTaskOpacity : Gantt.TaskOpacity);

        taskProgress
            .exit()
            .remove();
    }

    /**
     * Render task resource labels
     * @param taskSelection Task Selection
     * @param taskConfigHeight Task heights from settings
     */
    private taskResourceRender(
        taskSelection: Selection<Task>,
        taskConfigHeight: number): void {

        const groupTasks: boolean = this.viewModel.settings.general.groupTasks;
        let newLabelPosition: ResourceLabelPositions | null = null;
        if (groupTasks && !this.groupTasksPrevValue) {
            newLabelPosition = ResourceLabelPositions.Inside;
        }

        if (!groupTasks && this.groupTasksPrevValue) {
            newLabelPosition = ResourceLabelPositions.Right;
        }

        if (newLabelPosition) {
            this.host.persistProperties(<VisualObjectInstancesToPersist>{
                merge: [{
                    objectName: "taskResource",
                    selector: null,
                    properties: { position: newLabelPosition }
                }]
            });

            this.viewModel.settings.taskResource.position = newLabelPosition;
            newLabelPosition = null;
        }

        this.groupTasksPrevValue = groupTasks;

        let taskResourceShow: boolean = this.viewModel.settings.taskResource.show;
        let taskResourceColor: string = this.viewModel.settings.taskResource.fill;
        let taskResourceFontSize: number = this.viewModel.settings.taskResource.fontSize;
        let taskResourcePosition: ResourceLabelPositions = this.viewModel.settings.taskResource.position;
        let taskResourceFullText: boolean = this.viewModel.settings.taskResource.fullText;
        let taskResourceWidthByTask: boolean = this.viewModel.settings.taskResource.widthByTask;
        let isGroupedByTaskName: boolean = this.viewModel.settings.general.groupTasks;

        if (taskResourceShow) {
            let taskResource: Selection<Task> = taskSelection
                .selectAll(Selectors.TaskResource.selectorName)
                .data((d: Task) => [d]);

            const taskResourceMerged = taskResource
                .enter()
                .append("text")
                .merge(taskResource);

            taskResourceMerged.classed(Selectors.TaskResource.className, true);

            taskResourceMerged
                .attr("x", (task: Task) => this.getResourceLabelXCoordinate(task, taskConfigHeight, taskResourceFontSize, taskResourcePosition))
                .attr("y", (task: Task) => Gantt.getBarYCoordinate(task.id, taskConfigHeight)
                    + Gantt.getResourceLabelYOffset(taskConfigHeight, taskResourceFontSize, taskResourcePosition)
                    + (task.id + 1) * this.getResourceLabelTopMargin())
                .text((task: Task) => _.isEmpty(task.Milestones) && task.resource || "")
                .style("fill", taskResourceColor)
                .style("font-size", PixelConverter.fromPoint(taskResourceFontSize));

            let self: Gantt = this;
            let hasNotNullableDates: boolean = this.hasNotNullableDates;
            const defaultWidth: number = Gantt.DefaultValues.ResourceWidth - Gantt.ResourceWidthPadding;

            if (taskResourceWidthByTask) {
                taskResourceMerged
                    .each(function (task: Task, outerIndex: number) {
                        const width: number = hasNotNullableDates ? self.taskDurationToWidth(task.start, task.end) : 0;
                        AxisHelper.LabelLayoutStrategy.clip(d3.select(this), width, textMeasurementService.svgEllipsis);
                    });
            } else if (isGroupedByTaskName) {
                taskResourceMerged
                    .each(function (task: Task, outerIndex: number) {
                        const sameRowNextTaskStart: Date = self.getSameRowNextTaskStartDate(task, outerIndex, taskResourceMerged);

                        if (sameRowNextTaskStart) {
                            let width: number = 0;
                            if (hasNotNullableDates) {
                                const startDate: Date = taskResourcePosition === ResourceLabelPositions.Top ? task.start : task.end;
                                width = self.taskDurationToWidth(startDate, sameRowNextTaskStart);
                            }

                            AxisHelper.LabelLayoutStrategy.clip(d3.select(this), width, textMeasurementService.svgEllipsis);
                        } else {
                            if (!taskResourceFullText) {
                                AxisHelper.LabelLayoutStrategy.clip(d3.select(this), defaultWidth, textMeasurementService.svgEllipsis);
                            }
                        }
                    });
            } else if (!taskResourceFullText) {
                taskResourceMerged
                    .each(function (task: Task, outerIndex: number) {
                        AxisHelper.LabelLayoutStrategy.clip(d3.select(this), defaultWidth, textMeasurementService.svgEllipsis);
                    });
            }

            taskResource
                .exit()
                .remove();
        } else {
            taskSelection
                .selectAll(Selectors.TaskResource.selectorName)
                .remove();
        }
    }

    private getSameRowNextTaskStartDate(task: Task, index: number, selection: Selection<Task>) {
        let sameRowNextTaskStart: Date;

        selection
            .each(function (x: Task, i: number) {
                if (index !== i &&
                    x.id === task.id &&
                    x.start >= task.start &&
                    (!sameRowNextTaskStart || sameRowNextTaskStart < x.start)) {

                    sameRowNextTaskStart = x.start;
                }
            });

        return sameRowNextTaskStart;
    }

    private static getResourceLabelYOffset(
        taskConfigHeight: number,
        taskResourceFontSize: number,
        taskResourcePosition: ResourceLabelPositions): number {
        const barHeight: number = Gantt.getBarHeight(taskConfigHeight);
        switch (taskResourcePosition) {
            case ResourceLabelPositions.Right:
                return (barHeight / Gantt.DeviderForCalculatingCenter) + (taskResourceFontSize / Gantt.DeviderForCalculatingCenter);
            case ResourceLabelPositions.Top:
                return -(taskResourceFontSize / Gantt.DeviderForCalculatingPadding) + Gantt.LabelTopOffsetForPadding;
            case ResourceLabelPositions.Inside:
                return -(taskResourceFontSize / Gantt.DeviderForCalculatingPadding) + Gantt.LabelTopOffsetForPadding + barHeight / Gantt.ResourceLabelDefaultDivisionCoefficient;
        }
    }

    private getResourceLabelXCoordinate(
        task: Task,
        taskConfigHeight: number,
        taskResourceFontSize: number,
        taskResourcePosition: ResourceLabelPositions): number {
        if (!this.hasNotNullableDates) {
            return 0;
        }

        const barHeight: number = Gantt.getBarHeight(taskConfigHeight);
        switch (taskResourcePosition) {
            case ResourceLabelPositions.Right:
                return this.timeScale(task.end) + (taskResourceFontSize / 2) + Gantt.RectRound;
            case ResourceLabelPositions.Top:
                return this.timeScale(task.start) + Gantt.RectRound;
            case ResourceLabelPositions.Inside:
                return this.timeScale(task.start) + barHeight / (2 * Gantt.ResourceLabelDefaultDivisionCoefficient) + Gantt.RectRound;
        }
    }

    /**
     * Returns the matching Y coordinate for a given task index
     * @param taskIndex Task Number
     */
    private getTaskLabelCoordinateY(taskIndex: number): number {
        const settings = this.viewModel.settings;
        const fontSize: number = + settings.taskLabels.fontSize;
        const taskConfigHeight = settings.taskConfig.height || DefaultChartLineHeight;
        const taskYCoordinate = taskConfigHeight * taskIndex;
        const barHeight = Gantt.getBarHeight(taskConfigHeight);
        return taskYCoordinate + (barHeight + Gantt.BarHeightMargin - (taskConfigHeight - fontSize) / Gantt.ChartLineHeightDivider);
    }

    /**
    * Get completion percent when days off feature is on
    * @param task All task attributes
    * @param durationUnit unit Duration unit
    */
    private getDaysOffTaskProgressPercent(task: Task) {
        if (this.viewModel.settings.daysOff.show) {
            if (task.daysOffList && task.daysOffList.length && task.duration && task.completion) {
                let durationUnit: string = this.viewModel.settings.general.durationUnit;
                if (task.wasDowngradeDurationUnit) {
                    durationUnit = DurationHelper.downgradeDurationUnit(durationUnit, task.duration);
                }
                const startTime: number = task.start.getTime();
                const progressLength: number = (task.end.getTime() - startTime) * task.completion;
                const currentProgressTime: number = new Date(startTime + progressLength).getTime();

                let daysOffFiltered: DayOffData[] = task.daysOffList
                    .filter((date) => startTime <= date[0].getTime() && date[0].getTime() <= currentProgressTime);

                let extraDuration = Gantt.calculateExtraDurationDaysOff(daysOffFiltered, task.end, task.start, +this.viewModel.settings.daysOff.firstDayOfWeek, durationUnit);
                const extraDurationPercentage = extraDuration / task.duration;
                return task.completion + extraDurationPercentage;
            }
        }

        return task.completion;
    }

    /**
    * Get bar y coordinate
    * @param lineNumber Line number that represents the task number
    * @param lineHeight Height of task line
    */
    private static getBarYCoordinate(
        lineNumber: number,
        lineHeight: number): number {
        return (lineHeight * lineNumber) + PaddingTasks;
    }

    /**
     * Get bar height
     * @param lineHeight The height of line
     */
    private static getBarHeight(lineHeight: number): number {
        return lineHeight / Gantt.ChartLineProportion;
    }

    /**
     * Get the margin that added to task rects and task category labels
     *
     * depends on resource label position and resource label font size
     */
    private getResourceLabelTopMargin(): number {
        let taskResourceShow: boolean = this.viewModel.settings.taskResource.show;
        let taskResourceFontSize: number = this.viewModel.settings.taskResource.fontSize;
        let taskResourcePosition: ResourceLabelPositions = this.viewModel.settings.taskResource.position;

        let margin: number = 0;
        if (taskResourceShow && taskResourcePosition === ResourceLabelPositions.Top) {
            margin = Number(taskResourceFontSize) + Gantt.LabelTopOffsetForPadding;
        }

        return margin;
    }

    /**
     * convert task duration to width in the time scale
     * @param start The start of task to convert
     * @param end The end of task to convert
     */
    private taskDurationToWidth(
        start: Date,
        end: Date): number {
        return this.timeScale(end) - this.timeScale(start);
    }

    private static getTooltipForMilestoneLine(
        formattedDate: string,
        localizationManager: ILocalizationManager,
        dateTypeSettings: DateTypeSettings,
        milestoneTitle: string[] | LabelsForDateTypes[], milestoneCategoryName?: string[]): VisualTooltipDataItem[] {
        let result: VisualTooltipDataItem[] = [];

        for (let i = 0; i < milestoneTitle.length; i++) {
            if (!milestoneTitle[i]) {
                switch (dateTypeSettings.type) {
                    case DateTypes.Second:
                    case DateTypes.Minute:
                    case DateTypes.Hour:
                        milestoneTitle[i] = localizationManager.getDisplayName("Visual_Label_Now");
                        break;
                    default:
                        milestoneTitle[i] = localizationManager.getDisplayName("Visual_Label_Today");
                }
            }

            if (milestoneCategoryName) {
                result.push({
                    displayName: localizationManager.getDisplayName("Visual_Milestone_Name"),
                    value: milestoneCategoryName[i]
                });
            }

            result.push({
                displayName: <string>milestoneTitle[i],
                value: formattedDate
            });
        }

        return result;
    }

    /**
    * Create vertical dotted line that represent milestone in the time axis (by default it shows not time)
    * @param tasks All tasks array
    * @param milestoneTitle
    * @param timestamp the milestone to be shown in the time axis (default Date.now())
    */
    private createMilestoneLine(
        tasks: GroupedTask[],
        timestamp: number = Date.now(),
        milestoneTitle?: string): void {
        if (!this.hasNotNullableDates) {
            return;
        }

        let todayColor: string = this.viewModel.settings.dateType.todayColor;
        // TODO: add not today milestones color
        let milestoneDates = [new Date(timestamp)];
        tasks.forEach((task: GroupedTask) => {
            const subtasks: Task[] = task.tasks;
            subtasks.forEach((task: Task) => {
                if (!_.isEmpty(task.Milestones)) {
                    task.Milestones.forEach((milestone) => {
                        if (!_.includes(milestoneDates, milestone.start)) {
                            milestoneDates.push(milestone.start);
                        }
                    });
                }
            });
        });

        let line: Line[] = [];
        const dateTypeSettings: DateTypeSettings = this.viewModel.settings.dateType;
        milestoneDates.forEach((date: Date) => {
            const title = date === this.timeScale(timestamp) ? milestoneTitle : "Milestone";
            const lineOptions = {
                x1: this.timeScale(date),
                y1: Gantt.MilestoneTop,
                x2: this.timeScale(date),
                y2: this.getMilestoneLineLength(tasks.length),
                tooltipInfo: Gantt.getTooltipForMilestoneLine(date.toLocaleDateString(), this.localizationManager, dateTypeSettings, [title])
            };
            line.push(lineOptions);
        });

        let chartLineSelection: Selection<Line> = this.chartGroup
            .selectAll(Selectors.ChartLine.selectorName)
            .data(line);

        const chartLineSelectionMerged = chartLineSelection
            .enter()
            .append("line")
            .merge(chartLineSelection);

        chartLineSelectionMerged.classed(Selectors.ChartLine.className, true);

        chartLineSelectionMerged
            .attr("x1", (line: Line) => line.x1)
            .attr("y1", (line: Line) => line.y1)
            .attr("x2", (line: Line) => line.x2)
            .attr("y2", (line: Line) => line.y2)
            .style("stroke", (line: Line) => line.x1 === this.timeScale(timestamp) ? todayColor : "#ccc");

        this.renderTooltip(chartLineSelectionMerged);

        chartLineSelection
            .exit()
            .remove();
    }

    private scrollToMilestoneLine(axisLength: number,
        timestamp: number = Date.now()): void {

        let scrollValue = this.timeScale(new Date(timestamp));
        scrollValue -= scrollValue > ScrollMargin
            ? ScrollMargin
            : 0;

        if (axisLength > scrollValue) {
            (this.body.node() as SVGSVGElement)
                .querySelector(Selectors.Body.selectorName).scrollLeft = scrollValue;
        }
    }

    private renderTooltip(selection: Selection<Line | Task | MilestonePath>): void {
        this.tooltipServiceWrapper.addTooltip(
            selection,
            (tooltipEvent: TooltipEventArgs<TooltipEnabledDataPoint>) => {
                return tooltipEvent.data.tooltipInfo;
            });
    }

    private updateElementsPositions(margin: IMargin): void {
        let settings = this.viewModel.settings;
        const taskLabelsWidth: number = settings.taskLabels.show
            ? settings.taskLabels.width
            : 0;

        let translateXValue = taskLabelsWidth + margin.left + Gantt.SubtasksLeftMargin;
        this.chartGroup
            .attr("transform", SVGManipulations.translate(translateXValue, margin.top));

        let translateYValue = Gantt.TaskLabelsMarginTop + (this.ganttDiv.node() as SVGSVGElement).scrollTop;
        this.axisGroup
            .attr("transform", SVGManipulations.translate(translateXValue, translateYValue));

        translateXValue = (this.ganttDiv.node() as SVGSVGElement).scrollLeft;
        this.lineGroup
            .attr("transform", SVGManipulations.translate(translateXValue, 0));
        this.collapseAllGroup
            .attr("transform", SVGManipulations.translate(0, margin.top / 4));
    }

    private getMilestoneLineLength(numOfTasks: number): number {
        return numOfTasks * (this.viewModel.settings.taskConfig.height || DefaultChartLineHeight);
    }

    public static downgradeDurationUnitIfNeeded(tasks: Task[], durationUnit: string) {
        const downgradedDurationUnitTasks = tasks.filter(t => t.wasDowngradeDurationUnit);

        if (downgradedDurationUnitTasks.length) {
            let maxStepDurationTransformation: number = 0;
            downgradedDurationUnitTasks.forEach(x => maxStepDurationTransformation = x.stepDurationTransformation > maxStepDurationTransformation ? x.stepDurationTransformation : maxStepDurationTransformation);

            tasks.filter(x => x.stepDurationTransformation !== maxStepDurationTransformation).forEach(task => {
                task.duration = DurationHelper.transformDuration(task.duration, durationUnit, maxStepDurationTransformation);
                task.stepDurationTransformation = maxStepDurationTransformation;
                task.wasDowngradeDurationUnit = true;
            });
        }
    }

    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration {
        const settings: GanttSettings = this.viewModel && this.viewModel.settings
            || GanttSettings.getDefault() as GanttSettings;
        const instanceEnumeration: VisualObjectInstanceEnumeration =
            GanttSettings.enumerateObjectInstances(settings, options);

        if (options.objectName === Gantt.MilestonesPropertyIdentifier.objectName) {
            this.enumerateMilestones(instanceEnumeration);
        }

        if (options.objectName === Gantt.LegendPropertyIdentifier.objectName) {
            this.enumerateLegend(instanceEnumeration);
        }

        if (options.objectName === Gantt.CollapsedTasksPropertyIdentifier.objectName) {
            return;
        }

        return (instanceEnumeration as VisualObjectInstanceEnumerationObject).instances || [];
    }

    private enumerateMilestones(instanceEnumeration: VisualObjectInstanceEnumeration): VisualObjectInstance[] {
        if (!this.viewModel.isDurationFilled) {
            return;
        }

        const dataPoints: MilestoneDataPoint[] = this.viewModel && this.viewModel.milestonesData.dataPoints;
        if (!dataPoints || !dataPoints.length) {
            return;
        }

        const milestonesWithoutDublicates = Gantt.getUniqueMilestones(dataPoints);
        for (let uniqMilestones in milestonesWithoutDublicates) {
            const milestone = milestonesWithoutDublicates[uniqMilestones];
            this.addAnInstanceToEnumeration(instanceEnumeration, {
                displayName: `${milestone.name} color`,
                objectName: Gantt.MilestonesPropertyIdentifier.objectName,
                selector: ColorHelper.normalizeSelector((milestone.identity as ISelectionId).getSelector(), false),
                properties: {
                    fill: { solid: { color: milestone.color } }
                }
            });

            this.addAnInstanceToEnumeration(instanceEnumeration, {
                displayName: `${milestone.name} shape`,
                objectName: Gantt.MilestonesPropertyIdentifier.objectName,
                selector: ColorHelper.normalizeSelector((milestone.identity as ISelectionId).getSelector(), false),
                properties: { shapeType: milestone.shapeType }
            });
        }
    }

    private enumerateLegend(instanceEnumeration: VisualObjectInstanceEnumeration): VisualObjectInstance[] {
        if (!this.viewModel.isDurationFilled) {
            return;
        }

        const dataPoints: LegendDataPoint[] = this.viewModel && this.viewModel.legendData.dataPoints;
        if (!dataPoints || !dataPoints.length) {
            return;
        }

        dataPoints.forEach((dataPoint: LegendDataPoint) => {
            this.addAnInstanceToEnumeration(instanceEnumeration, {
                displayName: dataPoint.label,
                objectName: Gantt.LegendPropertyIdentifier.objectName,
                selector: ColorHelper.normalizeSelector((dataPoint.identity as ISelectionId).getSelector(), false),
                properties: {
                    fill: { solid: { color: dataPoint.color } }
                }
            });
        });
    }

    private addAnInstanceToEnumeration(
        instanceEnumeration: VisualObjectInstanceEnumeration,
        instance: VisualObjectInstance): void {

        if ((instanceEnumeration as VisualObjectInstanceEnumerationObject).instances) {
            (instanceEnumeration as VisualObjectInstanceEnumerationObject)
                .instances
                .push(instance);
        } else {
            (instanceEnumeration as VisualObjectInstance[]).push(instance);
        }
    }

}

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

import {select as d3Select, Selection as d3Selection} from "d3-selection";
import {ScaleTime as timeScale} from "d3-scale";
import {
    timeDay as d3TimeDay,
    timeHour as d3TimeHour,
    timeMinute as d3TimeMinute,
    timeSecond as d3TimeSecond
} from "d3-time";
import {nest as d3Nest} from "d3-collection";
import "d3-transition";

//lodash
import lodashIsEmpty from "lodash.isempty";
import lodashMin from "lodash.min";
import lodashMinBy from "lodash.minby";
import lodashMax from "lodash.max";
import lodashMaxBy from "lodash.maxby";
import lodashGroupBy from "lodash.groupby";
import lodashClone from "lodash.clone";
import lodashUniqBy from "lodash.uniqby";
import {Dictionary as lodashDictionary} from "lodash";

import powerbi from "powerbi-visuals-api";

// powerbi.extensibility.utils.svg
import * as SVGUtil from "powerbi-visuals-utils-svgutils";

// powerbi.extensibility.utils.type
import {pixelConverter as PixelConverter, valueType} from "powerbi-visuals-utils-typeutils";

// powerbi.extensibility.utils.formatting
import {textMeasurementService, valueFormatter as ValueFormatter} from "powerbi-visuals-utils-formattingutils";

// powerbi.extensibility.utils.interactivity
import {
    interactivityBaseService as interactivityService,
    interactivitySelectionService
} from "powerbi-visuals-utils-interactivityutils";

// powerbi.extensibility.utils.tooltip
import {
    createTooltipServiceWrapper,
    ITooltipServiceWrapper,
    TooltipEnabledDataPoint
} from "powerbi-visuals-utils-tooltiputils";

// powerbi.extensibility.utils.color
import {ColorHelper} from "powerbi-visuals-utils-colorutils";

// powerbi.extensibility.utils.chart.legend
import {
    axis as AxisHelper,
    axisInterfaces,
    axisScale,
    legend as LegendModule,
    legendInterfaces,
    OpacityLegendBehavior
} from "powerbi-visuals-utils-chartutils";

// behavior
import {Behavior, BehaviorOptions} from "./behavior";
import {
    DayOffData,
    DaysOffDataForAddition,
    ExtraInformation,
    GanttCalculateScaleAndDomainOptions,
    GanttChartFormatters,
    GanttViewModel,
    GroupedTask,
    Line,
    LinearStop,
    Milestone,
    MilestoneData,
    MilestoneDataPoint,
    MilestonePath,
    Task,
    TaskDaysOff,
    TaskTypeMetadata,
    TaskTypes
} from "./interfaces";
import {DurationHelper} from "./durationHelper";
import {GanttColumns} from "./columns";
import {
    drawCircle,
    drawDiamond,
    drawNotRoundedRectByPath,
    drawRectangle,
    drawRoundedRectByPath,
    hashCode,
    isStringNotNullEmptyOrUndefined,
    isValidDate
} from "./utils";
import {drawCollapseButton, drawExpandButton, drawMinusButton, drawPlusButton} from "./drawButtons";
import {TextProperties} from "powerbi-visuals-utils-formattingutils/lib/src/interfaces";

import {FormattingSettingsService} from "powerbi-visuals-utils-formattingmodel";
import {DateTypeCardSettings, GanttChartSettingsModel} from "./ganttChartSettingsModels";
import {DateType, DurationUnit, GanttRole, LabelForDate, MilestoneShape, ResourceLabelPosition} from "./enums";

// d3
type Selection<T1, T2 = T1> = d3Selection<any, T1, any, T2>;

// powerbi
import DataView = powerbi.DataView;
import IViewport = powerbi.IViewport;
import SortDirection = powerbi.SortDirection;
import DataViewValueColumn = powerbi.DataViewValueColumn;
import DataViewValueColumns = powerbi.DataViewValueColumns;
import DataViewMetadataColumn = powerbi.DataViewMetadataColumn;
import DataViewValueColumnGroup = powerbi.DataViewValueColumnGroup;
import PrimitiveValue = powerbi.PrimitiveValue;

import DataViewCategoryColumn = powerbi.DataViewCategoryColumn;

import DataViewObjectPropertyIdentifier = powerbi.DataViewObjectPropertyIdentifier;


import VisualObjectInstancesToPersist = powerbi.VisualObjectInstancesToPersist;

import IColorPalette = powerbi.extensibility.IColorPalette;
import ILocalizationManager = powerbi.extensibility.ILocalizationManager;
import IVisualEventService = powerbi.extensibility.IVisualEventService;
import VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;
import ISelectionManager = powerbi.extensibility.ISelectionManager;

// powerbi.visuals
import ISelectionIdBuilder = powerbi.visuals.ISelectionIdBuilder;

// powerbi.extensibility.visual
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import IVisual = powerbi.extensibility.visual.IVisual;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;

// powerbi.extensibility.utils.svg
import SVGManipulations = SVGUtil.manipulation;
import ClassAndSelector = SVGUtil.CssConstants.ClassAndSelector;
import createClassAndSelector = SVGUtil.CssConstants.createClassAndSelector;
import IMargin = SVGUtil.IMargin;

// powerbi.extensibility.utils.type
import PrimitiveType = valueType.PrimitiveType;
import ValueType = valueType.ValueType;

// powerbi.extensibility.utils.formatting
import IValueFormatter = ValueFormatter.IValueFormatter;

// powerbi.extensibility.utils.interactivity
import appendClearCatcher = interactivityService.appendClearCatcher;
import IInteractiveBehavior = interactivityService.IInteractiveBehavior;
import IInteractivityService = interactivityService.IInteractivityService;
import createInteractivityService = interactivitySelectionService.createInteractivitySelectionService;

// powerbi.extensibility.utils.chart.legend
import ILegend = legendInterfaces.ILegend;
import LegendPosition = legendInterfaces.LegendPosition;
import LegendData = legendInterfaces.LegendData;
import createLegend = LegendModule.createLegend;
import LegendDataPoint = legendInterfaces.LegendDataPoint;

// powerbi.extensibility.utils.chart
import IAxisProperties = axisInterfaces.IAxisProperties;

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
    DurationUnit.Second,
    DurationUnit.Minute,
    DurationUnit.Hour,
    DurationUnit.Day,
];

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
    export const ClickableArea: ClassAndSelector = createClassAndSelector("clickableArea");
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

    private static TaskResourcePropertyIdentifier: DataViewObjectPropertyIdentifier = {
        objectName: "taskResource",
        propertyName: "show"
    };

    private static CollapsedTasksPropertyIdentifier: DataViewObjectPropertyIdentifier = {
        objectName: "collapsedTasks",
        propertyName: "list"
    };

    private static CollapsedTasksUpdateIdPropertyIdentifier: DataViewObjectPropertyIdentifier = {
        objectName: "collapsedTasksUpdateId",
        propertyName: "value"
    };

    public static DefaultValues = {
        AxisTickSize: 6,
        BarMargin: 2,
        ResourceWidth: 100,
        TaskColor: "#00B099",
        TaskLineColor: "#ccc",
        CollapseAllColor: "#000",
        PlusMinusColor: "#5F6B6D",
        CollapseAllTextColor: "#aaa",
        MilestoneLineColor: "#ccc",
        TaskCategoryLabelsRectColor: "#fafafa",
        TaskLineWidth: 15,
        IconMargin: 12,
        IconHeight: 16,
        IconWidth: 15,
        ChildTaskLeftMargin: 25,
        ParentTaskLeftMargin: 0,
        DefaultDateType: DateType.Week,
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
    private static ComplectionDefault: number = null;
    private static ComplectionMax: number = 1;
    private static ComplectionMin: number = 0;
    private static ComplectionMaxInPercent: number = 100;
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

    private static TimeScale: timeScale<any, any>;

    private static get DefaultMargin(): IMargin {
        return {
            top: 50,
            right: 40,
            bottom: 40,
            left: 10
        };
    }

    private formattingSettings: GanttChartSettingsModel;
    private formattingSettingsService: FormattingSettingsService;

    private hasHighlights: boolean;

    private margin: IMargin = Gantt.DefaultMargin;

    private body: Selection<any>;
    private ganttSvg: Selection<any>;
    private viewModel: GanttViewModel;
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
    private selectionManager: ISelectionManager;
    private tooltipServiceWrapper: ITooltipServiceWrapper;
    private host: IVisualHost;
    private localizationManager: ILocalizationManager;
    private isInteractiveChart: boolean = false;
    private groupTasksPrevValue: boolean = false;
    private collapsedTasks: string[] = [];
    private collapseAllFlag: "data-is-collapsed";
    private parentLabelOffset: number = 5;
    private groupLabelSize: number = 25;
    private secondExpandAllIconOffset: number = 7;
    private hasNotNullableDates: boolean = false;

    private collapsedTasksUpdateIDs: string[] = [];

    constructor(options: VisualConstructorOptions) {
        this.init(options);
    }

    private init(options: VisualConstructorOptions): void {
        this.host = options.host;
        this.localizationManager = this.host.createLocalizationManager();
        this.formattingSettingsService = new FormattingSettingsService(this.localizationManager);
        this.colors = options.host.colorPalette;
        this.colorHelper = new ColorHelper(this.colors);
        this.body = d3Select(options.element);
        this.tooltipServiceWrapper = createTooltipServiceWrapper(this.host.tooltipService, options.element);
        this.behavior = new Behavior();
        this.interactivityService = createInteractivityService(this.host);
        this.eventService = options.host.eventService;
        this.selectionManager = options.host.createSelectionManager();

        this.createViewport(options.element);
    }

    /**
     * Create the viewport area of the gantt chart
     */
    private createViewport(element: HTMLElement): void {
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
            .attr("fill", this.colorHelper.getHighContrastColor("foreground", Gantt.DefaultValues.TaskLineColor));

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

        this.ganttDiv.on("scroll", (event) => {
            if (this.viewModel) {
                const taskLabelsWidth: number = this.viewModel.settings.taskLabelsCardSettings.show.value
                    ? this.viewModel.settings.taskLabelsCardSettings.width.value
                    : 0;
                const scrollTop: number = <number>event.target.scrollTop;
                const scrollLeft: number = <number>event.target.scrollLeft;

                this.axisGroup
                    .attr("transform", SVGManipulations.translate(taskLabelsWidth + this.margin.left + Gantt.SubtasksLeftMargin, Gantt.TaskLabelsMarginTop + scrollTop));
                this.lineGroup
                    .attr("transform", SVGManipulations.translate(scrollLeft, 0))
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
     * @param localizationManager powerbi localization manager
     * @param isEndDateFilled
     */
    public static getTooltipInfo(
        task: Task,
        formatters: GanttChartFormatters,
        durationUnit: DurationUnit,
        localizationManager: ILocalizationManager,
        isEndDateFilled: boolean): VisualTooltipDataItem[] {

        const tooltipDataArray: VisualTooltipDataItem[] = [];
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

        if (lodashIsEmpty(task.Milestones) && task.end && !isNaN(task.end.getDate())) {
            tooltipDataArray.push({
                displayName: localizationManager.getDisplayName("Role_EndDate"),
                value: formatters.startDateFormatter.format(task.end)
            });
        }

        if (lodashIsEmpty(task.Milestones) && task.duration && !isEndDateFilled) {
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
        if (dataView?.metadata?.columns) {
            for (const column of dataView.metadata.columns) {
                if (Gantt.hasRole(column, GanttRole.Task)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Returns the chart formatters
     * @param dataView The data Model
     * @param settings visual settings
     * @param cultureSelector The current user culture
     */
    private static getFormatters(
        dataView: DataView,
        settings: GanttChartSettingsModel,
        cultureSelector: string): GanttChartFormatters {

        if (!dataView?.metadata?.columns) {
            return null;
        }

        let dateFormat: string = "d";
        for (const dvColumn of dataView.metadata.columns) {
            if (Gantt.hasRole(dvColumn, GanttRole.StartDate)) {
                dateFormat = dvColumn.format;
            }
        }

        // Priority of using date format: Format from dvColumn -> Format by culture selector -> Custom Format
        if (cultureSelector) {
            dateFormat = null;
        }

        if (!settings.tooltipConfigCardSettings.dateFormat) {
            settings.tooltipConfigCardSettings.dateFormat.value = dateFormat;
        }

        if (settings.tooltipConfigCardSettings.dateFormat &&
            settings.tooltipConfigCardSettings.dateFormat.value !== dateFormat) {

            dateFormat = settings.tooltipConfigCardSettings.dateFormat.value;
        }

        return <GanttChartFormatters>{
            startDateFormatter: ValueFormatter.create({ format: dateFormat, cultureSelector }),
            completionFormatter: ValueFormatter.create({ format: PercentFormat, value: 1, allowFormatBeautification: true })
        };
    }

    private static createLegend(
        host: IVisualHost,
        colorPalette: IColorPalette,
        settings: GanttChartSettingsModel,
        taskTypes: TaskTypes,
        useDefaultColor: boolean): LegendData {

        const colorHelper = new ColorHelper(colorPalette, Gantt.LegendPropertyIdentifier);
        const legendData: LegendData = {
            fontSize: settings.legendCardSettings.fontSize.value,
            dataPoints: [],
            title: settings.legendCardSettings.showTitle.value ? (settings.legendCardSettings.titleText.value || taskTypes?.typeName) : null,
            labelColor: settings.legendCardSettings.labelColor.value.value
        };

        legendData.dataPoints = taskTypes?.types.map(
            (typeMeta: TaskTypeMetadata): LegendDataPoint => {
                let color: string = settings.taskConfigCardSettings.fill.value.value;


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
        const sortingOption: SortingOptions = new SortingOptions();

        dataView.metadata.columns.forEach(column => {
            if (column.roles && column.sort && (column.roles[ParentColumnName] || column.roles[TaskColumnName])) {
                sortingOption.isCustomSortingNeeded = true;
                sortingOption.sortingDirection = column.sort;

                return sortingOption;
            }
        });

        return sortingOption;
    }

    private static getMinDurationUnitInMilliseconds(durationUnit: DurationUnit): number {
        switch (durationUnit) {
            case DurationUnit.Hour:
                return MillisecondsInAHour;
            case DurationUnit.Minute:
                return MillisecondsInAMinute;
            case DurationUnit.Second:
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

        const milestoneData: MilestoneData = {
            dataPoints: []
        };
        const milestonesCategory = dataView.categorical.categories[milestonesIndex];
        const milestones: { value: PrimitiveValue, index: number }[] = [];

        if (milestonesCategory && milestonesCategory.values) {
            milestonesCategory.values.forEach((value: PrimitiveValue, index: number) => milestones.push({ value, index }));
            milestones.forEach((milestone) => {
                const milestoneObjects = milestonesCategory.objects?.[milestone.index];
                const selectionBuilder: ISelectionIdBuilder = host
                    .createSelectionIdBuilder()
                    .withCategory(milestonesCategory, milestone.index);

                const milestoneDataPoint: MilestoneDataPoint = {
                    name: milestone.value as string,
                    identity: selectionBuilder.createSelectionId(),
                    shapeType: milestoneObjects?.milestones?.shapeType ?
                        milestoneObjects.milestones.shapeType as string : MilestoneShape.Rhombus,
                    color: milestoneObjects?.milestones?.fill ?
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
     * @param localizationManager powerbi localization manager
     * @param isEndDateFillled
     * @param hasHighlights if any of the tasks has highlights
     */
    private static createTasks(
        dataView: DataView,
        taskTypes: TaskTypes,
        host: IVisualHost,
        formatters: GanttChartFormatters,
        colors: IColorPalette,
        settings: GanttChartSettingsModel,
        taskColor: string,
        localizationManager: ILocalizationManager,
        isEndDateFillled: boolean,
        hasHighlights: boolean): Task[] {
        const categoricalValues: DataViewValueColumns = dataView?.categorical?.values;

        let tasks: Task[] = [];
        const addedParents: string[] = [];

        const values: GanttColumns<any> = GanttColumns.getCategoricalValues(dataView);

        if (!values.Task) {
            return tasks;
        }

        const colorHelper: ColorHelper = new ColorHelper(colors, Gantt.LegendPropertyIdentifier);
        const groupValues: GanttColumns<DataViewValueColumn>[] = GanttColumns.getGroupedValueColumns(dataView);
        const sortingOptions: SortingOptions = Gantt.getSortingOptions(dataView);

        const collapsedTasks: string[] = JSON.parse(settings.collapsedTasksCardSettings.list.value);
        let durationUnit: DurationUnit = <DurationUnit>settings.generalCardSettings.durationUnit.value.value.toString();
        let duration: number = settings.generalCardSettings.durationMin.value;
        const taskProgressShow: boolean = settings.taskCompletionCardSettings.show.value;

        let endDate: Date = null;

        values.Task.forEach((categoryValue: PrimitiveValue, index: number) => {
            let color: string = taskColor || Gantt.DefaultValues.TaskColor;
            let completion: number = 0;
            let taskType: TaskTypeMetadata = null;
            let wasDowngradeDurationUnit: boolean = false;
            const tooltips: VisualTooltipDataItem[] = [];
            let stepDurationTransformation: number = 0;
            let highlight: number = null;

            const selectionBuilder: ISelectionIdBuilder = host
                .createSelectionIdBuilder()
                .withCategory(dataView.categorical.categories[0], index);

            if (groupValues) {
                groupValues.forEach((group: GanttColumns<DataViewValueColumn>) => {
                    let maxCompletionFromTasks: number = lodashMax(values.Completion);
                    maxCompletionFromTasks = maxCompletionFromTasks > Gantt.ComplectionMax ? Gantt.ComplectionMaxInPercent : Gantt.ComplectionMax;

                    if (group.Duration && group.Duration.values[index] !== null) {
                        taskType =
                            taskTypes.types.find((typeMeta: TaskTypeMetadata) => typeMeta.name === group.Duration.source.groupName);

                        if (taskType) {
                            selectionBuilder.withCategory(taskType.selectionColumn, 0);
                            color = colorHelper.getColorForMeasure(taskType.columnGroup.objects, taskType.name);
                        }

                        duration = (group.Duration.values[index] as number > settings.generalCardSettings.durationMin.value) ? group.Duration.values[index] as number : settings.generalCardSettings.durationMin.value;

                        if (duration && duration % 1 !== 0) {
                            durationUnit = DurationHelper.downgradeDurationUnit(durationUnit, duration);
                            stepDurationTransformation =
                                GanttDurationUnitType.indexOf(<DurationUnit>settings.generalCardSettings.durationUnit.value.value.toString()) - GanttDurationUnitType.indexOf(durationUnit);

                            duration = DurationHelper.transformDuration(duration, durationUnit, stepDurationTransformation);
                            wasDowngradeDurationUnit = true;
                        }

                        completion = ((group.Completion && group.Completion.values[index])
                            && taskProgressShow
                            && Gantt.convertToDecimal(group.Completion.values[index] as number, settings.taskCompletionCardSettings.maxCompletion.value, maxCompletionFromTasks)) || null;

                        if (completion !== null) {
                            if (completion < Gantt.ComplectionMin) {
                                completion = Gantt.ComplectionMin;
                            }

                            if (completion > Gantt.ComplectionMax) {
                                completion = Gantt.ComplectionMax;
                            }
                        }

                    } else if (group.EndDate && group.EndDate.values[index] !== null) {
                        taskType =
                            taskTypes.types.find((typeMeta: TaskTypeMetadata) => typeMeta.name === group.EndDate.source.groupName);

                        if (taskType) {
                            selectionBuilder.withCategory(taskType.selectionColumn, 0);
                            color = colorHelper.getColorForMeasure(taskType.columnGroup.objects, taskType.name);
                        }

                        endDate = group.EndDate.values[index] ? group.EndDate.values[index] as Date : null;
                        if (typeof (endDate) === "string" || typeof (endDate) === "number") {
                            endDate = new Date(endDate);
                        }

                        completion = ((group.Completion && group.Completion.values[index])
                            && taskProgressShow
                            && Gantt.convertToDecimal(group.Completion.values[index] as number, settings.taskCompletionCardSettings.maxCompletion.value, maxCompletionFromTasks)) || null;

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

            const selectionId: powerbi.extensibility.ISelectionId = selectionBuilder.createSelectionId();
            const extraInformation: ExtraInformation[] = [];
            const resource: string = (values.Resource && values.Resource[index] as string) || "";
            const parent: string = (values.Parent && values.Parent[index] as string) || null;
            const Milestone: string = (values.Milestones && !lodashIsEmpty(values.Milestones[index]) && values.Milestones[index]) || null;

            const startDate: Date = (values.StartDate && values.StartDate[index]
                && isValidDate(new Date(values.StartDate[index])) && new Date(values.StartDate[index]))
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

            if (hasHighlights && categoricalValues) {
                const notNullIndex = categoricalValues.findIndex(value => value.highlights && value.values[index] != null);
                if (notNullIndex != -1) highlight = <number>categoricalValues[notNullIndex].highlights[index];
            }

            const task: Task = {
                color,
                completion,
                resource,
                index: null,
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
                Milestones: Milestone && startDate ? [{ type: Milestone, start: startDate, tooltipInfo: null, category: categoryValue as string }] : [],
                highlight: highlight !== null
            };

            if (parent) {
                let parentTask: Task;
                if (addedParents.indexOf(parent) === -1) {
                    addedParents.push(parent);

                    parentTask = {
                        index: 0,
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
                        extraInformation: collapsedTasks.includes(parent) ? extraInformation : null,
                        daysOffList: null,
                        wasDowngradeDurationUnit: null,
                        selected: null,
                        identity: selectionBuilder.createSelectionId(),
                        Milestones: Milestone && startDate ? [{ type: Milestone, start: startDate, tooltipInfo: null, category: categoryValue as string }] : [],
                        highlight: highlight !== null
                    };

                    tasks.push(parentTask);

                } else {
                    parentTask = tasks.filter(x => x.index === 0 && x.name === parent)[0];

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

            if (task.end && task.start && isValidDate(task.end)) {
                const durationInMilliseconds: number = task.end.getTime() - task.start.getTime(),
                    minDurationUnitInMilliseconds: number = Gantt.getMinDurationUnitInMilliseconds(durationUnit);

                task.end = durationInMilliseconds < minDurationUnitInMilliseconds ? Gantt.getEndDate(durationUnit, task.start, task.duration) : task.end;
            } else {
                task.end = isValidDate(task.end) ? task.end : Gantt.getEndDate(durationUnit, task.start, task.duration);
            }

            if (settings.daysOffCardSettings.show.value && duration) {
                let datesDiff: number = 0;
                do {
                    task.daysOffList = Gantt.calculateDaysOff(
                        +settings.daysOffCardSettings.firstDayOfWeek?.value?.value,
                        new Date(task.start.getTime()),
                        new Date(task.end.getTime())
                    );

                    if (task.daysOffList.length) {
                        const isDurationFilled: boolean = dataView.metadata.columns.findIndex(col => Gantt.hasRole(col, GanttRole.Duration)) !== -1;
                        if (isDurationFilled) {
                            const extraDuration = Gantt.calculateExtraDurationDaysOff(task.daysOffList, task.start, task.end, +settings.daysOffCardSettings.firstDayOfWeek.value.value, durationUnit);
                            task.end = Gantt.getEndDate(durationUnit, task.start, task.duration + extraDuration);
                        }

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
            if (!task.children || collapsedTasks.includes(task.name)) {
                task.tooltipInfo = Gantt.getTooltipInfo(task, formatters, durationUnit, localizationManager, isEndDateFillled);
                if (task.Milestones) {
                    task.Milestones.forEach((milestone) => {
                        const dateFormatted = formatters.startDateFormatter.format(task.start);
                        const dateTypesSettings = settings.dateTypeCardSettings;
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
            if (!task.index && !task.parent) {
                task.index = index++;

                if (task.children) {
                    if (sortingOptions.isCustomSortingNeeded) {
                        task.children.sort(sortingFunction);
                    }

                    task.children.forEach(subtask => {
                        subtask.index = subtask.index === null ? index++ : subtask.index;
                    });
                }
            }
        });

        const resultTasks: Task[] = [];

        tasks.forEach((task) => {
            resultTasks[task.index] = task;
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
            const dateForCheck: Date = new Date(date.getTime() + (i * MillisecondsInADay));
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
            const isPartlyUsed = !/00:00:00/g.test(dateForCheck.toTimeString());

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
    public static getEndDate(durationUnit: DurationUnit, start: Date, step: number): Date {
        switch (durationUnit) {
            case DurationUnit.Second:
                return d3TimeSecond.offset(start, step);
            case DurationUnit.Minute:
                return d3TimeMinute.offset(start, step);
            case DurationUnit.Hour:
                return d3TimeHour.offset(start, step);
            default:
                return d3TimeDay.offset(start, step);
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
        const tempDaysOffData: DaysOffDataForAddition = {
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

    private static convertMillisecondsToDuration(milliseconds: number, durationUnit: DurationUnit): number {
        switch (durationUnit) {
            case DurationUnit.Hour:
                return milliseconds /= MillisecondsInAHour;
            case DurationUnit.Minute:
                return milliseconds /= MillisecondsInAMinute;
            case DurationUnit.Second:
                return milliseconds /= MillisecondsInASecond;

            default:
                return milliseconds /= MillisecondsInADay;
        }
    }

    private static calculateExtraDurationDaysOff(daysOffList: DayOffData[], startDate: Date, endDate: Date, firstDayOfWeek: number, durationUnit: DurationUnit): number {
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
            const prevDayTimestamp = startDate.getTime();
            const prevDate = new Date(prevDayTimestamp);
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
     * @param colors Color palette
     * @param colorHelper powerbi color helper
     * @param localizationManager localization manager returns localized strings
     */
    public converter(
        dataView: DataView,
        host: IVisualHost,
        colors: IColorPalette,
        colorHelper: ColorHelper,
        localizationManager: ILocalizationManager): GanttViewModel {

        if (dataView?.categorical?.categories?.length === 0 || !Gantt.isChartHasTask(dataView)) {
            return null;
        }

        const settings: GanttChartSettingsModel = this.parseSettings(dataView, colorHelper);

        const taskTypes: TaskTypes = Gantt.getAllTasksTypes(dataView);

        this.hasHighlights = Gantt.hasHighlights(dataView);

        const formatters: GanttChartFormatters = Gantt.getFormatters(dataView, settings, host.locale || null);

        const isDurationFilled: boolean = dataView.metadata.columns.findIndex(col => Gantt.hasRole(col, GanttRole.Duration)) !== -1,
            isEndDateFillled: boolean = dataView.metadata.columns.findIndex(col => Gantt.hasRole(col, GanttRole.EndDate)) !== -1,
            isParentFilled: boolean = dataView.metadata.columns.findIndex(col => Gantt.hasRole(col, GanttRole.Parent)) !== -1,
            isResourcesFilled: boolean = dataView.metadata.columns.findIndex(col => Gantt.hasRole(col, GanttRole.Resource)) !== -1;

        const legendData: LegendData = Gantt.createLegend(host, colors, settings, taskTypes, !isDurationFilled && !isEndDateFillled);
        const milestonesData: MilestoneData = Gantt.createMilestones(dataView, host);

        const taskColor: string = (legendData.dataPoints?.length <= 1) || !isDurationFilled
            ? settings.taskConfigCardSettings.fill.value.value
            : null;

        const tasks: Task[] = Gantt.createTasks(dataView, taskTypes, host, formatters, colors, settings, taskColor, localizationManager, isEndDateFillled, this.hasHighlights);

        // Remove empty legend if tasks isn't exist
        const types = lodashGroupBy(tasks, x => x.taskType);
        legendData.dataPoints = legendData.dataPoints?.filter(x => types[x.label]);

        return {
            dataView,
            settings,
            taskTypes,
            tasks,
            legendData,
            milestonesData,
            isDurationFilled,
            isEndDateFilled: isEndDateFillled,
            isParentFilled,
            isResourcesFilled
        };
    }

    public parseSettings(dataView: DataView, colorHelper: ColorHelper): GanttChartSettingsModel {

        this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(GanttChartSettingsModel, dataView);
        const settings: GanttChartSettingsModel = this.formattingSettings;

        if (!colorHelper) {
            return settings;
        }

        if (settings.taskCompletionCardSettings.maxCompletion.value < Gantt.ComplectionMin || settings.taskCompletionCardSettings.maxCompletion.value > Gantt.ComplectionMaxInPercent) {
            settings.taskCompletionCardSettings.maxCompletion.value = Gantt.ComplectionDefault;
        }

        if (colorHelper.isHighContrast) {
            settings.dateTypeCardSettings.axisColor.value.value = colorHelper.getHighContrastColor("foreground", settings.dateTypeCardSettings.axisColor.value.value);
            settings.dateTypeCardSettings.axisTextColor.value.value = colorHelper.getHighContrastColor("foreground", settings.dateTypeCardSettings.axisColor.value.value);
            settings.dateTypeCardSettings.todayColor.value.value = colorHelper.getHighContrastColor("foreground", settings.dateTypeCardSettings.todayColor.value.value);

            settings.daysOffCardSettings.fill.value.value = colorHelper.getHighContrastColor("foreground", settings.daysOffCardSettings.fill.value.value);
            settings.taskConfigCardSettings.fill.value.value = colorHelper.getHighContrastColor("foreground", settings.taskConfigCardSettings.fill.value.value);
            settings.taskLabelsCardSettings.fill.value.value = colorHelper.getHighContrastColor("foreground", settings.taskLabelsCardSettings.fill.value.value);
            settings.taskResourceCardSettings.fill.value.value = colorHelper.getHighContrastColor("foreground", settings.taskResourceCardSettings.fill.value.value);
            settings.legendCardSettings.labelColor.value.value = colorHelper.getHighContrastColor("foreground", settings.legendCardSettings.labelColor.value.value);
        }

        return settings;
    }

    private static convertToDecimal(value: number, maxCompletionFromSettings: number, maxCompletionFromTasks: number): number {
        if (maxCompletionFromSettings) {
            return value / maxCompletionFromSettings;
        }
        return value / maxCompletionFromTasks;
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
        const index: number = dataView.metadata.columns.findIndex(col => GanttRole.Legend in col.roles);

        if (index !== -1) {
            taskTypes.typeName = dataView.metadata.columns[index].displayName;
            const legendMetaCategoryColumn: DataViewMetadataColumn = dataView.metadata.columns[index];
            const values = (dataView?.categorical?.values?.length && dataView.categorical.values) || <DataViewValueColumns>[];

            if (values === undefined || values.length === 0) {
                return;
            }

            const groupValues = values.grouped();
            taskTypes.types = groupValues.map((group: DataViewValueColumnGroup): TaskTypeMetadata => {
                const column: DataViewCategoryColumn = {
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

    private static hasHighlights(dataView: DataView): boolean {
        const values = (dataView?.categorical?.values?.length && dataView.categorical.values) || <DataViewValueColumns>[];
        const highlightsExist = values.some(({ highlights }) => highlights?.some(Number.isInteger));
        return !!highlightsExist;
    }

    /**
     * Get legend data, calculate position and draw it
     */
    private renderLegend(): void {
        if (!this.viewModel.legendData?.dataPoints) {
            return;
        }

        const position: string | LegendPosition = this.viewModel.settings.legendCardSettings.show.value
            ? LegendPosition[this.viewModel.settings.legendCardSettings.position.value.value]
            : LegendPosition.None;

        this.legend.changeOrientation(position as LegendPosition);
        this.legend.drawLegend(this.viewModel.legendData, lodashClone(this.viewport));
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
        const fullScreenAxisLength: number = Gantt.DefaultGraphicWidthPercentage * this.viewport.width;
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

        const collapsedTasksUpdateId: any = options.dataViews[0].metadata?.objects?.collapsedTasksUpdateId?.value;

        if (this.collapsedTasksUpdateIDs.includes(collapsedTasksUpdateId)) {
            this.collapsedTasksUpdateIDs = this.collapsedTasksUpdateIDs.filter(id => id !== collapsedTasksUpdateId);
            return;
        }

        this.updateInternal(options);
    }

    private updateInternal(options: VisualUpdateOptions) : void {
        this.viewModel = this.converter(options.dataViews[0], this.host, this.colors, this.colorHelper, this.localizationManager);

        // for dublicated milestone types
        if (this.viewModel && this.viewModel.milestonesData) {
            const newMilestoneData: MilestoneData = this.viewModel.milestonesData;
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

        this.viewport = lodashClone(options.viewport);
        this.margin = Gantt.DefaultMargin;

        this.eventService.renderingStarted(options);

        this.render();

        this.eventService.renderingFinished(options);
    }

    private render(): void {
        const settings = this.viewModel.settings;

        this.renderLegend();
        this.updateChartSize();

        const visibleTasks = this.viewModel.tasks
            .filter((task: Task) => task.visibility);
        const tasks: Task[] = visibleTasks
            .map((task: Task, i: number) => {
                task.index = i;
                return task;
            });

        if (this.interactivityService) {
            this.interactivityService.applySelectionStateToData(tasks);
        }

        if (tasks.length < Gantt.MinTasks) {
            return;
        }

        this.collapsedTasks = JSON.parse(settings.collapsedTasksCardSettings.list.value);
        const groupTasks = this.viewModel.settings.generalCardSettings.groupTasks.value;
        const groupedTasks: GroupedTask[] = Gantt.getGroupTasks(tasks, groupTasks, this.collapsedTasks);
        // do smth with task ids
        this.updateCommonTasks(groupedTasks);
        this.updateCommonMilestones(groupedTasks);

        let tasksAfterGrouping: Task[] = [];
        groupedTasks.forEach((t: GroupedTask) => tasksAfterGrouping = tasksAfterGrouping.concat(t.tasks));
        const minDateTask: Task = lodashMinBy(tasksAfterGrouping, (t) => t && t.start);
        const maxDateTask: Task = lodashMaxBy(tasksAfterGrouping, (t) => t && t.end);
        this.hasNotNullableDates = !!minDateTask && !!maxDateTask;

        let axisLength: number = 0;
        if (this.hasNotNullableDates) {
            const startDate: Date = minDateTask.start;
            let endDate: Date = maxDateTask.end;

            if (startDate.toString() === endDate.toString()) {
                endDate = new Date(endDate.valueOf() + (24 * 60 * 60 * 1000));
            }

            const dateTypeMilliseconds: number = Gantt.getDateType(DateType[settings.dateTypeCardSettings.type.value.value]);
            let ticks: number = Math.ceil(Math.round(endDate.valueOf() - startDate.valueOf()) / dateTypeMilliseconds);
            ticks = ticks < 2 ? 2 : ticks;

            axisLength = ticks * Gantt.DefaultTicksLength;
            axisLength = this.scaleAxisLength(axisLength);

            const viewportIn: IViewport = {
                height: this.viewport.height,
                width: axisLength
            };

            const xAxisProperties: IAxisProperties = this.calculateAxes(viewportIn, this.textProperties, startDate, endDate, ticks, false);
            Gantt.TimeScale = <timeScale<Date, Date>>xAxisProperties.scale;

            this.renderAxis(xAxisProperties);
        }

        axisLength = this.scaleAxisLength(axisLength);

        this.setDimension(groupedTasks, axisLength, settings);

        this.renderTasks(groupedTasks);
        this.updateTaskLabels(groupedTasks, settings.taskLabelsCardSettings.width.value);
        this.updateElementsPositions(this.margin);
        this.createMilestoneLine(groupedTasks);

        if (this.formattingSettings.generalCardSettings.scrollToCurrentTime.value && this.hasNotNullableDates) {
            this.scrollToMilestoneLine(axisLength);
        }

        this.bindInteractivityService(tasks);
    }

    private bindInteractivityService(tasks: Task[]): void {
        if (this.interactivityService) {
            const behaviorOptions: BehaviorOptions = {
                clearCatcher: this.clearCatcher,
                taskSelection: this.taskGroup.selectAll(Selectors.SingleTask.selectorName),
                legendSelection: this.body.selectAll(Selectors.LegendItems.selectorName),
                subTasksCollapse: {
                    selection: this.body.selectAll(Selectors.ClickableArea.selectorName),
                    callback: this.subTasksCollapseCb.bind(this)
                },
                allSubtasksCollapse: {
                    selection: this.body
                        .selectAll(Selectors.CollapseAll.selectorName),
                    callback: this.subTasksCollapseAll.bind(this)
                },
                interactivityService: this.interactivityService,
                behavior: this.behavior,
                dataPoints: tasks
            };

            this.interactivityService.bind(behaviorOptions);

            this.behavior.renderSelection(this.hasHighlights);
        }
    }

    private static getDateType(dateType: DateType): number {
        switch (dateType) {
            case DateType.Second:
                return MillisecondsInASecond;

            case DateType.Minute:
                return MillisecondsInAMinute;

            case DateType.Hour:
                return MillisecondsInAHour;

            case DateType.Day:
                return MillisecondsInADay;

            case DateType.Week:
                return MillisecondsInWeek;

            case DateType.Month:
                return MillisecondsInAMonth;

            case DateType.Quarter:
                return MillisecondsInAQuarter;

            case DateType.Year:
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

        const dataTypeDatetime: ValueType = ValueType.fromPrimitiveTypeAndCategory(PrimitiveType.Date);
        const category: DataViewMetadataColumn = {
            displayName: this.localizationManager.getDisplayName("Role_StartDate"),
            queryName: GanttRole.StartDate,
            type: dataTypeDatetime,
            index: 0
        };

        const visualOptions: GanttCalculateScaleAndDomainOptions = {
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
        const axes: IAxisProperties = this.calculateAxesProperties(viewportIn, visualOptions, category);
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

        const dateType: DateType = DateType[this.viewModel.settings.dateTypeCardSettings.type.value.value];
        const cultureSelector: string = this.host.locale;
        const xAxisDateFormatter: IValueFormatter = ValueFormatter.create({
            format: Gantt.DefaultValues.DateFormatStrings[dateType],
            cultureSelector
        });
        const xAxisProperties: IAxisProperties = AxisHelper.createAxis({
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
        settings: GanttChartSettingsModel): void {

        const fullResourceLabelMargin = groupedTasks.length * this.getResourceLabelTopMargin();
        let widthBeforeConvertion = this.margin.left + settings.taskLabelsCardSettings.width.value + axisLength;

        if (settings.taskResourceCardSettings.show.value && settings.taskResourceCardSettings.position.value.value === ResourceLabelPosition.Right) {
            widthBeforeConvertion += Gantt.DefaultValues.ResourceWidth;
        } else {
            widthBeforeConvertion += Gantt.DefaultValues.ResourceWidth / 2;
        }

        const height = PixelConverter.toString(groupedTasks.length * (settings.taskConfigCardSettings.height.value || DefaultChartLineHeight) + this.margin.top + fullResourceLabelMargin);
        const width = PixelConverter.toString(widthBeforeConvertion);

        this.ganttSvg
            .attr("height", height)
            .attr("width", width);
    }

    private static getGroupTasks(tasks: Task[], groupTasks: boolean, collapsedTasks: string[]): GroupedTask[] {
        if (groupTasks) {
            const groupedTasks: lodashDictionary<Task[]> = lodashGroupBy(tasks,
                x => (x.parent ? `${x.parent}.${x.name}` : x.name));

            const result: GroupedTask[] = [];
            const taskKeys: string[] = Object.keys(groupedTasks);
            const alreadyReviewedKeys: string[] = [];

            taskKeys.forEach((key: string) => {
                const isKeyAlreadyReviewed = alreadyReviewedKeys.includes(key);
                if (!isKeyAlreadyReviewed) {
                    let name: string = key;
                    if (groupedTasks[key] && groupedTasks[key].length && groupedTasks[key][0].parent && key.indexOf(groupedTasks[key][0].parent) !== -1) {
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
                        if (task.children && !collapsedTasks.includes(task.name)) {
                            task.children.forEach((childrenTask: Task) => {
                                const childrenFullName = `${name}.${childrenTask.name}`;
                                const isChildrenKeyAlreadyReviewed = alreadyReviewedKeys.includes(childrenFullName);

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
                x.tasks.forEach(t => t.index = i);
                x.index = i;
            });

            return result;
        }

        return tasks.map(x => <GroupedTask>{
            name: x.name,
            index: x.index,
            tasks: [x]
        });
    }

    private renderAxis(xAxisProperties: IAxisProperties, duration: number = Gantt.DefaultDuration): void {
        const axisColor: string = this.viewModel.settings.dateTypeCardSettings.axisColor.value.value;
        const axisTextColor: string = this.viewModel.settings.dateTypeCardSettings.axisTextColor.value.value;

        const xAxis = xAxisProperties.axis;
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
        const firstDayOfWeek: string = this.viewModel.settings.daysOffCardSettings.firstDayOfWeek?.value?.value.toString();
        const color: string = this.viewModel.settings.daysOffCardSettings.fill.value.value;
        if (this.viewModel.settings.daysOffCardSettings.show.value) {
            const dateForCheck: Date = new Date(tickTime.getTime());
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
    // eslint-disable-next-line max-lines-per-function
    private updateTaskLabels(
        tasks: GroupedTask[],
        width: number): void {

        let axisLabel: Selection<any>;
        const taskLabelsShow: boolean = this.viewModel.settings.taskLabelsCardSettings.show.value;
        const displayGridLines: boolean = this.viewModel.settings.generalCardSettings.displayGridLines.value;
        const taskLabelsColor: string = this.viewModel.settings.taskLabelsCardSettings.fill.value.value;
        const taskLabelsFontSize: number = this.viewModel.settings.taskLabelsCardSettings.fontSize.value;
        const taskLabelsWidth: number = this.viewModel.settings.taskLabelsCardSettings.width.value;
        const taskConfigHeight: number = this.viewModel.settings.taskConfigCardSettings.height.value || DefaultChartLineHeight;
        const categoriesAreaBackgroundColor: string = this.colorHelper.getThemeColor();
        const isHighContrast: boolean = this.colorHelper.isHighContrast;

        if (taskLabelsShow) {
            this.lineGroupWrapper
                .attr("width", taskLabelsWidth)
                .attr("fill", isHighContrast ? categoriesAreaBackgroundColor : Gantt.DefaultValues.TaskCategoryLabelsRectColor)
                .attr("stroke", this.colorHelper.getHighContrastColor("foreground", Gantt.DefaultValues.TaskLineColor))
                .attr("stroke-width", 1);

            this.lineGroup
                .selectAll(Selectors.Label.selectorName)
                .remove();

            axisLabel = this.lineGroup
                .selectAll(Selectors.Label.selectorName)
                .data(tasks);

            const axisLabelGroup = axisLabel
                .enter()
                .append("g")
                .merge(axisLabel);

            axisLabelGroup.classed(Selectors.Label.className, true)
                .attr("transform", (task: GroupedTask) => SVGManipulations.translate(0, this.margin.top + this.getTaskLabelCoordinateY(task.index)));

            const clickableArea = axisLabelGroup
                .append("g")
                .classed(Selectors.ClickableArea.className, true)
                .merge(axisLabelGroup);

            clickableArea
                .append("text")
                .attr("x", (task: GroupedTask) => (Gantt.TaskLineCoordinateX +
                    (task.tasks.every((task: Task) => !!task.parent)
                        ? Gantt.SubtasksLeftMargin
                        : (task.tasks[0].children && !!task.tasks[0].children.length) ? this.parentLabelOffset : 0)))
                .attr("class", (task: GroupedTask) => task.tasks[0].children ? "parent" : task.tasks[0].parent ? "child" : "normal-node")
                .attr("y", (task: GroupedTask) => (task.index + 0.5) * this.getResourceLabelTopMargin())
                .attr("fill", taskLabelsColor)
                .attr("stroke-width", Gantt.AxisLabelStrokeWidth)
                .style("font-size", PixelConverter.fromPoint(taskLabelsFontSize))
                .text((task: GroupedTask) => task.name)
                .call(AxisHelper.LabelLayoutStrategy.clip, width - Gantt.AxisLabelClip, textMeasurementService.svgEllipsis)
                .append("title")
                .text((task: GroupedTask) => task.name);

            const buttonSelection = clickableArea
                .filter((task: GroupedTask) => task.tasks[0].children && !!task.tasks[0].children.length)
                .append("svg")
                .attr("viewBox", "0 0 32 32")
                .attr("width", Gantt.DefaultValues.IconWidth)
                .attr("height", Gantt.DefaultValues.IconHeight)
                .attr("y", (task: GroupedTask) => (task.index + 0.5) * this.getResourceLabelTopMargin() - Gantt.DefaultValues.IconMargin)
                .attr("x", Gantt.DefaultValues.BarMargin);

            clickableArea
                .append("rect")
                .attr("width", 2 * Gantt.DefaultValues.IconWidth)
                .attr("height", 2 * Gantt.DefaultValues.IconWidth)
                .attr("y", (task: GroupedTask) => (task.index + 0.5) * this.getResourceLabelTopMargin() - Gantt.DefaultValues.IconMargin)
                .attr("x", Gantt.DefaultValues.BarMargin)
                .attr("fill", "transparent");

            const buttonPlusMinusColor = this.colorHelper.getHighContrastColor("foreground", Gantt.DefaultValues.PlusMinusColor);
            buttonSelection
                .each(function (task: GroupedTask) {
                    const element = d3Select(this);
                    if (!task.tasks[0].children[0].visibility) {
                        drawPlusButton(element, buttonPlusMinusColor);
                    } else {
                        drawMinusButton(element, buttonPlusMinusColor);
                    }
                });

            let parentTask: string = "";
            let childrenCount = 0;
            let currentChildrenIndex = 0;
            axisLabelGroup
                .append("rect")
                .attr("x", (task: GroupedTask) => {
                    const isGrouped = this.viewModel.settings.generalCardSettings.groupTasks.value;
                    const drawStandartMargin: boolean = !task.tasks[0].parent || task.tasks[0].parent && task.tasks[0].parent !== parentTask;
                    parentTask = task.tasks[0].parent ? task.tasks[0].parent : task.tasks[0].name;
                    if (task.tasks[0].children) {
                        parentTask = task.tasks[0].name;
                        childrenCount = isGrouped ? lodashUniqBy(task.tasks[0].children, "name").length : task.tasks[0].children.length;
                        currentChildrenIndex = 0;
                    }

                    if (task.tasks[0].parent === parentTask) {
                        currentChildrenIndex++;
                    }
                    const isLastChild = childrenCount && childrenCount === currentChildrenIndex;
                    return drawStandartMargin || isLastChild ? Gantt.DefaultValues.ParentTaskLeftMargin : Gantt.DefaultValues.ChildTaskLeftMargin;
                })
                .attr("y", (task: GroupedTask) => (task.index + 1) * this.getResourceLabelTopMargin() + (taskConfigHeight - this.viewModel.settings.taskLabelsCardSettings.fontSize.value) / 2)
                .attr("width", () => displayGridLines ? this.viewport.width : 0)
                .attr("height", 1)
                .attr("fill", this.colorHelper.getHighContrastColor("foreground", Gantt.DefaultValues.TaskLineColor));

            axisLabel
                .exit()
                .remove();

            this.collapseAllGroup
                .selectAll("svg")
                .remove();

            this.collapseAllGroup
                .selectAll("rect")
                .remove();

            this.collapseAllGroup
                .selectAll("text")
                .remove();

            if (this.viewModel.isParentFilled) {
                const categoryLabelsWidth: number = this.viewModel.settings.taskLabelsCardSettings.width.value;
                this.collapseAllGroup
                    .append("rect")
                    .attr("width", categoryLabelsWidth)
                    .attr("height", 2 * Gantt.TaskLabelsMarginTop)
                    .attr("fill", categoriesAreaBackgroundColor);

                const expandCollapseButton = this.collapseAllGroup
                    .append("svg")
                    .classed(Selectors.CollapseAllArrow.className, true)
                    .attr("viewBox", "0 0 48 48")
                    .attr("width", this.groupLabelSize)
                    .attr("height", this.groupLabelSize)
                    .attr("x", 0)
                    .attr("y", this.secondExpandAllIconOffset)
                    .attr(this.collapseAllFlag, (this.collapsedTasks.length ? "1" : "0"));

                expandCollapseButton
                    .append("rect")
                    .attr("width", this.groupLabelSize)
                    .attr("height", this.groupLabelSize)
                    .attr("x", 0)
                    .attr("y", this.secondExpandAllIconOffset)
                    .attr("fill", "transparent");

                const buttonExpandCollapseColor = this.colorHelper.getHighContrastColor("foreground", Gantt.DefaultValues.CollapseAllColor);
                if (this.collapsedTasks.length) {
                    drawExpandButton(expandCollapseButton, buttonExpandCollapseColor);
                } else {
                    drawCollapseButton(expandCollapseButton, buttonExpandCollapseColor);
                }

                this.collapseAllGroup
                    .append("text")
                    .attr("x", this.secondExpandAllIconOffset + this.groupLabelSize)
                    .attr("y", this.groupLabelSize)
                    .attr("font-size", "12px")
                    .attr("fill", this.colorHelper.getHighContrastColor("foreground", Gantt.DefaultValues.CollapseAllTextColor))
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

        // eslint-disable-next-line
        const newId = crypto?.randomUUID() || Math.random().toString();
        this.collapsedTasksUpdateIDs.push(newId);

        this.setJsonFiltersValues(this.collapsedTasks, newId);
    }

    /**
     * callback for subtasks collapse all click event
     */
    private subTasksCollapseAll(): void {
        const collapsedAllSelector = this.collapseAllGroup.select(Selectors.CollapseAllArrow.selectorName);
        const isCollapsed: string = collapsedAllSelector.attr(this.collapseAllFlag);
        const buttonExpandCollapseColor = this.colorHelper.getHighContrastColor("foreground", Gantt.DefaultValues.CollapseAllColor);

        collapsedAllSelector.selectAll("path").remove();
        if (isCollapsed === "1") {
            this.collapsedTasks = [];
            collapsedAllSelector.attr(this.collapseAllFlag, "0");
            drawCollapseButton(collapsedAllSelector, buttonExpandCollapseColor);

        } else {
            collapsedAllSelector.attr(this.collapseAllFlag, "1");
            drawExpandButton(collapsedAllSelector, buttonExpandCollapseColor);
            this.viewModel.tasks.forEach((task: Task) => {
                if (task.parent) {
                    if (task.visibility) {
                        this.collapsedTasks.push(task.parent);
                    }
                }
            });
        }

        // eslint-disable-next-line
        const newId = crypto?.randomUUID() || Math.random().toString();
        this.collapsedTasksUpdateIDs.push(newId);

        this.setJsonFiltersValues(this.collapsedTasks, newId);
    }

    private setJsonFiltersValues(collapsedValues: string[], collapsedTasksUpdateId: string) {
        this.host.persistProperties(<VisualObjectInstancesToPersist>{
            merge: [{
                objectName: "collapsedTasks",
                selector: null,
                properties: {
                    list: JSON.stringify(collapsedValues)
                }
            }, {
                objectName: "collapsedTasksUpdateId",
                selector: null,
                properties: {
                    value: JSON.stringify(collapsedTasksUpdateId)
                }
            }]
        });
    }

    /**
     * Render tasks
     * @param groupedTasks Grouped tasks
     */
    private renderTasks(groupedTasks: GroupedTask[]): void {
        const taskConfigHeight: number = this.viewModel.settings.taskConfigCardSettings.height.value || DefaultChartLineHeight;
        const generalBarsRoundedCorners: boolean = this.viewModel.settings.generalCardSettings.barsRoundedCorners.value;
        const taskGroupSelection: Selection<any> = this.taskGroup
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

        const taskSelection: Selection<Task> = this.taskSelectionRectRender(taskGroupSelectionMerged);
        this.taskMainRectRender(taskSelection, taskConfigHeight, generalBarsRoundedCorners);
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
        if (!this.viewModel.settings.generalCardSettings.groupTasks.value) {
            groupedTasks.forEach((groupedTask: GroupedTask) => {
                const currentTaskName: string = groupedTask.name;
                if (this.collapsedTasks.includes(currentTaskName)) {
                    const firstTask: Task = groupedTask.tasks && groupedTask.tasks[0];
                    const tasks = groupedTask.tasks;
                    tasks.forEach((task: Task) => {
                        if (task.children) {
                            const childrenColors = task.children.map((child: Task) => child.color).filter((color) => color);
                            const minChildDateStart = lodashMin(task.children.map((child: Task) => child.start).filter((dateStart) => dateStart));
                            const maxChildDateEnd = lodashMax(task.children.map((child: Task) => child.end).filter((dateStart) => dateStart));
                            firstTask.color = !firstTask.color && task.children ? childrenColors[0] : firstTask.color;
                            firstTask.start = lodashMin([firstTask.start, minChildDateStart]);
                            firstTask.end = <any>lodashMax([firstTask.end, maxChildDateEnd]);
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
            if (this.collapsedTasks.includes(currentTaskName)) {

                const lastTask: Task = groupedTask.tasks && groupedTask.tasks[groupedTask.tasks.length - 1];
                const tasks = groupedTask.tasks;
                tasks.forEach((task: Task) => {
                    if (task.children) {
                        task.children.map((child: Task) => {
                            if (!lodashIsEmpty(child.Milestones)) {
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
        const taskSelection: Selection<Task> = taskGroupSelection
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
        const taskIsCollapsed = this.collapsedTasks.includes(task.name);
        return this.hasNotNullableDates && (taskIsCollapsed || lodashIsEmpty(task.Milestones)) ? Gantt.taskDurationToWidth(task.start, task.end) : 0;
    }


    /**
     *
     * @param task
     * @param taskConfigHeight
     * @param barsRoundedCorners are bars with rounded corners
     */
    private drawTaskRect(task: Task, taskConfigHeight: number, barsRoundedCorners: boolean): string {
        const x = this.hasNotNullableDates ? Gantt.TimeScale(task.start) : 0,
            y = Gantt.getBarYCoordinate(task.index, taskConfigHeight) + (task.index + 1) * this.getResourceLabelTopMargin(),
            width = this.getTaskRectWidth(task),
            height = Gantt.getBarHeight(taskConfigHeight),
            radius = Gantt.RectRound;

        if (!barsRoundedCorners || width < 2 * radius) {
            return drawNotRoundedRectByPath(x, y, width, height);
        }
        return drawRoundedRectByPath(x, y, width + Gantt.RectRound, height, radius);
    }

    /**
     * Render task progress rect
     * @param taskSelection Task Selection
     * @param taskConfigHeight Task heights from settings
     * @param barsRoundedCorners are bars with rounded corners
     */
    private taskMainRectRender(
        taskSelection: Selection<Task>,
        taskConfigHeight: number,
        barsRoundedCorners: boolean): void {
        const highContrastModeTaskRectStroke: number = 1;

        const taskRect: Selection<Task> = taskSelection
            .selectAll(Selectors.TaskRect.selectorName)
            .data((d: Task) => [d]);

        const taskRectMerged = taskRect
            .enter()
            .append("path")
            .merge(taskRect);

        taskRectMerged.classed(Selectors.TaskRect.className, true);

        let index = 0, groupedTaskIndex = 0;
        taskRectMerged
            .attr("d", (task: Task) => this.drawTaskRect(task, taskConfigHeight, barsRoundedCorners))
            .attr("width", (task: Task) => this.getTaskRectWidth(task))
            .style("fill", (task: Task) => {
                // logic used for grouped tasks, when there are several bars related to one category
                if (index === task.index) {
                    groupedTaskIndex++;
                } else {
                    groupedTaskIndex = 0;
                    index = task.index;
                }

                const url = `${task.index}-${groupedTaskIndex}-${isStringNotNullEmptyOrUndefined(task.taskType) ? task.taskType.toString() : "taskType"}`;
                const encodedUrl = `task${hashCode(url)}`;

                return `url(#${encodedUrl})`;
            });

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

        return this.colorHelper.getHighContrastColor("foreground", milestone.color);
    }

    private getMilestonePath(milestoneType: string, taskConfigHeight: number): string {
        let shape: string;
        const convertedHeight: number = Gantt.getBarHeight(taskConfigHeight);
        const milestone: MilestoneDataPoint = this.viewModel.milestonesData.dataPoints.filter((dataPoint: MilestoneDataPoint) => dataPoint.name === milestoneType)[0];
        switch (milestone.shapeType) {
            case MilestoneShape.Rhombus:
                shape = drawDiamond(convertedHeight);
                break;
            case MilestoneShape.Square:
                shape = drawRectangle(convertedHeight);
                break;
            case MilestoneShape.Circle:
                shape = drawCircle(convertedHeight);
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
            const taskMilestones: Selection<any> = taskSelection
            .selectAll(Selectors.TaskMilestone.selectorName)
            .data((d: Task) => {
                const nestedByDate = d3Nest().key((d: Milestone) => d.start.toDateString()).entries(d.Milestones);
                const updatedMilestones: MilestonePath[] = nestedByDate.map((nestedObj) => {
                    const oneDateMilestones = nestedObj.values;
                    // if there 2 or more milestones for concrete date => draw only one milestone for concrete date, but with tooltip for all of them
                    const currentMilestone = [...oneDateMilestones].pop();
                    const allTooltipInfo = oneDateMilestones.map((milestone: MilestonePath) => milestone.tooltipInfo);
                    currentMilestone.tooltipInfo = allTooltipInfo.reduce((a, b) => a.concat(b), []);

                    return {
                        type: currentMilestone.type,
                        start: currentMilestone.start,
                        taskID: d.index,
                        tooltipInfo: currentMilestone.tooltipInfo
                    };
                });

                return [{
                    key: d.index, values: <MilestonePath[]>updatedMilestones
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
            return SVGManipulations.translate(Gantt.TimeScale(start) - Gantt.getBarHeight(taskConfigHeight) / 4, Gantt.getBarYCoordinate(id, taskConfigHeight) + (id + 1) * this.getResourceLabelTopMargin());
        };

        const taskMilestonesSelection = taskMilestonesMerged.selectAll("path");
        const taskMilestonesSelectionData = taskMilestonesSelection.data(milestonesData => <MilestonePath[]>milestonesData.values);

        // add milestones: for collapsed task may be several milestones of its children, in usual case - just 1 milestone
        const taskMilestonesSelectionAppend = taskMilestonesSelectionData.enter()
            .append("path");

        taskMilestonesSelectionData
            .exit()
            .remove();

        const taskMilestonesSelectionMerged = taskMilestonesSelectionAppend
            .merge(<any>taskMilestonesSelection);

        if (this.hasNotNullableDates) {
            taskMilestonesSelectionMerged
                .attr("d", (data: MilestonePath) => this.getMilestonePath(data.type, taskConfigHeight))
                .attr("transform", (data: MilestonePath) => transformForMilestone(data.taskID, data.start))
                .attr("fill", (data: MilestonePath) => this.getMilestoneColor(data.type));
        }

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

        const taskDaysOffColor: string = this.viewModel.settings.daysOffCardSettings.fill.value.value;
        const taskDaysOffShow: boolean = this.viewModel.settings.daysOffCardSettings.show.value;

        taskSelection
            .selectAll(Selectors.TaskDaysOff.selectorName)
            .remove();

        if (taskDaysOffShow) {
            const tasksDaysOff: Selection<TaskDaysOff, Task> = taskSelection
                .selectAll(Selectors.TaskDaysOff.selectorName)
                .data((d: Task) => {
                    const tasksDaysOff: TaskDaysOff[] = [];

                    if (!d.children && d.daysOffList) {
                        for (let i = 0; i < d.daysOffList.length; i++) {
                            const currentDaysOffItem: DayOffData = d.daysOffList[i];
                            const startOfLastDay: Date = new Date(+d.end);
                            startOfLastDay.setHours(0, 0, 0);
                            if (currentDaysOffItem[0].getTime() < startOfLastDay.getTime()) {
                                tasksDaysOff.push({
                                    id: d.index,
                                    daysOff: d.daysOffList[i]
                                });
                            }
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

                    width = Gantt.taskDurationToWidth(startDate, endDate);
                }

                return width;
            };

            const drawTaskRectDaysOff = (task: TaskDaysOff) => {
                let x = this.hasNotNullableDates ? Gantt.TimeScale(task.daysOff[0]) : 0;
                const y: number = Gantt.getBarYCoordinate(task.id, taskConfigHeight) + (task.id + 1) * this.getResourceLabelTopMargin(),
                    height: number = Gantt.getBarHeight(taskConfigHeight),
                    radius: number = this.viewModel.settings.generalCardSettings.barsRoundedCorners.value ? Gantt.RectRound : 0,
                    width: number = getTaskRectDaysOffWidth(task);

                if (width < radius) {
                    x = x - width / 2;
                }

                if (width < 2 * radius) {
                    return drawNotRoundedRectByPath(x, y, width, height);
                }

                return drawRoundedRectByPath(x, y, width, height, radius);
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
        const taskProgressShow: boolean = this.viewModel.settings.taskCompletionCardSettings.show.value;

        let index = 0, groupedTaskIndex = 0;
        const taskProgress: Selection<any> = taskSelection
            .selectAll(Selectors.TaskProgress.selectorName)
            .data((d: Task) => {
                const taskProgressPercentage = this.getDaysOffTaskProgressPercent(d);
                // logic used for grouped tasks, when there are several bars related to one category
                if (index === d.index) {
                    groupedTaskIndex++;
                } else {
                    groupedTaskIndex = 0;
                    index = d.index;
                }

                const url = `${d.index}-${groupedTaskIndex}-${isStringNotNullEmptyOrUndefined(d.taskType) ? d.taskType.toString() : "taskType"}`;
                const encodedUrl = `task${hashCode(url)}`;

                return [{
                    key: encodedUrl, values: <LinearStop[]>[
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
            .attr("id", (data) => data.key);

        const stopsSelection = taskProgressMerged.selectAll("stop");
        const stopsSelectionData = stopsSelection.data(gradient => <LinearStop[]>gradient.values);

        // draw 4 stops: 1st and 2d stops are for completed rect part; 3d and 4th ones -  for main rect
        stopsSelectionData.enter()
            .append("stop")
            .merge(<any>stopsSelection)
            .attr("offset", (data: LinearStop) => `${data.completion * 100}%`)
            .attr("stop-color", (data: LinearStop) => this.colorHelper.getHighContrastColor("foreground", data.color))
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

        const groupTasks: boolean = this.viewModel.settings.generalCardSettings.groupTasks.value;
        let newLabelPosition: ResourceLabelPosition | null = null;
        if (groupTasks && !this.groupTasksPrevValue) {
            newLabelPosition = ResourceLabelPosition.Inside;
        }

        if (!groupTasks && this.groupTasksPrevValue) {
            newLabelPosition = ResourceLabelPosition.Right;
        }

        if (newLabelPosition) {
            this.host.persistProperties(<VisualObjectInstancesToPersist>{
                merge: [{
                    objectName: "taskResource",
                    selector: null,
                    properties: { position: newLabelPosition }
                }]
            });

            this.viewModel.settings.taskResourceCardSettings.position.value.value = newLabelPosition;
            newLabelPosition = null;
        }

        this.groupTasksPrevValue = groupTasks;

        const isResourcesFilled: boolean = this.viewModel.isResourcesFilled;
        const taskResourceShow: boolean = this.viewModel.settings.taskResourceCardSettings.show.value;
        const taskResourceColor: string = this.viewModel.settings.taskResourceCardSettings.fill.value.value;
        const taskResourceFontSize: number = this.viewModel.settings.taskResourceCardSettings.fontSize.value;
        const taskResourcePosition: ResourceLabelPosition = ResourceLabelPosition[this.viewModel.settings.taskResourceCardSettings.position.value.value];
        const taskResourceFullText: boolean = this.viewModel.settings.taskResourceCardSettings.fullText.value;
        const taskResourceWidthByTask: boolean = this.viewModel.settings.taskResourceCardSettings.widthByTask.value;
        const isGroupedByTaskName: boolean = this.viewModel.settings.generalCardSettings.groupTasks.value;

        if (isResourcesFilled && taskResourceShow) {
            const taskResource: Selection<Task> = taskSelection
                .selectAll(Selectors.TaskResource.selectorName)
                .data((d: Task) => [d]);

            const taskResourceMerged = taskResource
                .enter()
                .append("text")
                .merge(taskResource);

            taskResourceMerged.classed(Selectors.TaskResource.className, true);

            taskResourceMerged
                .attr("x", (task: Task) => this.getResourceLabelXCoordinate(task, taskConfigHeight, taskResourceFontSize, taskResourcePosition))
                .attr("y", (task: Task) => Gantt.getBarYCoordinate(task.index, taskConfigHeight)
                    + Gantt.getResourceLabelYOffset(taskConfigHeight, taskResourceFontSize, taskResourcePosition)
                    + (task.index + 1) * this.getResourceLabelTopMargin())
                .text((task: Task) => lodashIsEmpty(task.Milestones) && task.resource || "")
                .style("fill", taskResourceColor)
                .style("font-size", PixelConverter.fromPoint(taskResourceFontSize));

            const hasNotNullableDates: boolean = this.hasNotNullableDates;
            const defaultWidth: number = Gantt.DefaultValues.ResourceWidth - Gantt.ResourceWidthPadding;

            if (taskResourceWidthByTask) {
                taskResourceMerged
                    .each(function (task: Task) {
                        const width: number = hasNotNullableDates ? Gantt.taskDurationToWidth(task.start, task.end) : 0;
                        AxisHelper.LabelLayoutStrategy.clip(d3Select(this), width, textMeasurementService.svgEllipsis);
                    });
            } else if (isGroupedByTaskName) {
                taskResourceMerged
                    .each(function (task: Task, outerIndex: number) {
                        const sameRowNextTaskStart: Date = Gantt.getSameRowNextTaskStartDate(task, outerIndex, taskResourceMerged);

                        if (sameRowNextTaskStart) {
                            let width: number = 0;
                            if (hasNotNullableDates) {
                                const startDate: Date = taskResourcePosition === ResourceLabelPosition.Top ? task.start : task.end;
                                width = Gantt.taskDurationToWidth(startDate, sameRowNextTaskStart);
                            }

                            AxisHelper.LabelLayoutStrategy.clip(d3Select(this), width, textMeasurementService.svgEllipsis);
                        } else {
                            if (!taskResourceFullText) {
                                AxisHelper.LabelLayoutStrategy.clip(d3Select(this), defaultWidth, textMeasurementService.svgEllipsis);
                            }
                        }
                    });
            } else if (!taskResourceFullText) {
                taskResourceMerged
                    .each(function () {
                        AxisHelper.LabelLayoutStrategy.clip(d3Select(this), defaultWidth, textMeasurementService.svgEllipsis);
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

    private static getSameRowNextTaskStartDate(task: Task, index: number, selection: Selection<Task>) {
        let sameRowNextTaskStart: Date;

        selection
            .each(function (x: Task, i: number) {
                if (index !== i &&
                    x.index === task.index &&
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
        taskResourcePosition: ResourceLabelPosition): number {
        const barHeight: number = Gantt.getBarHeight(taskConfigHeight);
        switch (taskResourcePosition) {
            case ResourceLabelPosition.Right:
                return (barHeight / Gantt.DeviderForCalculatingCenter) + (taskResourceFontSize / Gantt.DeviderForCalculatingCenter);
            case ResourceLabelPosition.Top:
                return -(taskResourceFontSize / Gantt.DeviderForCalculatingPadding) + Gantt.LabelTopOffsetForPadding;
            case ResourceLabelPosition.Inside:
                return -(taskResourceFontSize / Gantt.DeviderForCalculatingPadding) + Gantt.LabelTopOffsetForPadding + barHeight / Gantt.ResourceLabelDefaultDivisionCoefficient;
        }
    }

    private getResourceLabelXCoordinate(
        task: Task,
        taskConfigHeight: number,
        taskResourceFontSize: number,
        taskResourcePosition: ResourceLabelPosition): number {
        if (!this.hasNotNullableDates) {
            return 0;
        }

        const barHeight: number = Gantt.getBarHeight(taskConfigHeight);
        switch (taskResourcePosition) {
            case ResourceLabelPosition.Right:
                return Gantt.TimeScale(task.end) + (taskResourceFontSize / 2) + Gantt.RectRound;
            case ResourceLabelPosition.Top:
                return Gantt.TimeScale(task.start) + Gantt.RectRound;
            case ResourceLabelPosition.Inside:
                return Gantt.TimeScale(task.start) + barHeight / (2 * Gantt.ResourceLabelDefaultDivisionCoefficient) + Gantt.RectRound;
        }
    }

    /**
     * Returns the matching Y coordinate for a given task index
     * @param taskIndex Task Number
     */
    private getTaskLabelCoordinateY(taskIndex: number): number {
        const settings = this.viewModel.settings;
        const fontSize: number = + settings.taskLabelsCardSettings.fontSize.value;
        const taskConfigHeight = settings.taskConfigCardSettings.height.value || DefaultChartLineHeight;
        const taskYCoordinate = taskConfigHeight * taskIndex;
        const barHeight = Gantt.getBarHeight(taskConfigHeight);
        return taskYCoordinate + (barHeight + Gantt.BarHeightMargin - (taskConfigHeight - fontSize) / Gantt.ChartLineHeightDivider);
    }

    /**
    * Get completion percent when days off feature is on
    * @param task All task attributes
    */
    private getDaysOffTaskProgressPercent(task: Task) {
        if (this.viewModel.settings.daysOffCardSettings.show.value) {
            if (task.daysOffList && task.daysOffList.length && task.duration && task.completion) {
                let durationUnit: DurationUnit = <DurationUnit>this.viewModel.settings.generalCardSettings.durationUnit.value.value.toString();
                if (task.wasDowngradeDurationUnit) {
                    durationUnit = DurationHelper.downgradeDurationUnit(durationUnit, task.duration);
                }
                const startTime: number = task.start.getTime();
                const progressLength: number = (task.end.getTime() - startTime) * task.completion;
                const currentProgressTime: number = new Date(startTime + progressLength).getTime();

                const daysOffFiltered: DayOffData[] = task.daysOffList
                    .filter((date) => startTime <= date[0].getTime() && date[0].getTime() <= currentProgressTime);

                const extraDuration: number = Gantt.calculateExtraDurationDaysOff(daysOffFiltered, task.end, task.start, +this.viewModel.settings.daysOffCardSettings.firstDayOfWeek.value.value, durationUnit);
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
        const isResourcesFilled: boolean = this.viewModel.isResourcesFilled;
        const taskResourceShow: boolean = this.viewModel.settings.taskResourceCardSettings.show.value;
        const taskResourceFontSize: number = this.viewModel.settings.taskResourceCardSettings.fontSize.value;
        const taskResourcePosition: ResourceLabelPosition = ResourceLabelPosition[this.viewModel.settings.taskResourceCardSettings.position.value.value];

        let margin: number = 0;
        if (isResourcesFilled && taskResourceShow && taskResourcePosition === ResourceLabelPosition.Top) {
            margin = Number(taskResourceFontSize) + Gantt.LabelTopOffsetForPadding;
        }

        return margin;
    }

    /**
     * convert task duration to width in the time scale
     * @param start The start of task to convert
     * @param end The end of task to convert
     */
    private static taskDurationToWidth(
        start: Date,
        end: Date): number {
        return Gantt.TimeScale(end) - Gantt.TimeScale(start);
    }

    private static getTooltipForMilestoneLine(
        formattedDate: string,
        localizationManager: ILocalizationManager,
        dateTypeSettings: DateTypeCardSettings,
        milestoneTitle: string[] | LabelForDate[], milestoneCategoryName?: string[]): VisualTooltipDataItem[] {
        const result: VisualTooltipDataItem[] = [];

        for (let i = 0; i < milestoneTitle.length; i++) {
            if (!milestoneTitle[i]) {
                switch (dateTypeSettings.type.value.value) {
                    case DateType.Second:
                    case DateType.Minute:
                    case DateType.Hour:
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

        const todayColor: string = this.viewModel.settings.dateTypeCardSettings.todayColor.value.value;
        // TODO: add not today milestones color
        const milestoneDates = [new Date(timestamp)];
        tasks.forEach((task: GroupedTask) => {
            const subtasks: Task[] = task.tasks;
            subtasks.forEach((task: Task) => {
                if (!lodashIsEmpty(task.Milestones)) {
                    task.Milestones.forEach((milestone) => {
                        if (!milestoneDates.includes(milestone.start)) {
                            milestoneDates.push(milestone.start);
                        }
                    });
                }
            });
        });

        const line: Line[] = [];
        const dateTypeSettings: DateTypeCardSettings = this.viewModel.settings.dateTypeCardSettings;
        milestoneDates.forEach((date: Date) => {
            const title = date === Gantt.TimeScale(timestamp) ? milestoneTitle : "Milestone";
            const lineOptions = {
                x1: Gantt.TimeScale(date),
                y1: Gantt.MilestoneTop,
                x2: Gantt.TimeScale(date),
                y2: this.getMilestoneLineLength(tasks.length),
                tooltipInfo: Gantt.getTooltipForMilestoneLine(date.toLocaleDateString(), this.localizationManager, dateTypeSettings, [title])
            };
            line.push(lineOptions);
        });

        const chartLineSelection: Selection<Line> = this.chartGroup
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
            .style("stroke", (line: Line) => {
                const color: string = line.x1 === Gantt.TimeScale(timestamp) ? todayColor : Gantt.DefaultValues.MilestoneLineColor;
                return this.colorHelper.getHighContrastColor("foreground", color);
            });

        this.renderTooltip(chartLineSelectionMerged);

        chartLineSelection
            .exit()
            .remove();
    }

    private scrollToMilestoneLine(axisLength: number,
        timestamp: number = Date.now()): void {

        let scrollValue = Gantt.TimeScale(new Date(timestamp));
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
            (tooltipEvent: TooltipEnabledDataPoint) => tooltipEvent.tooltipInfo);
    }

    private updateElementsPositions(margin: IMargin): void {
        const settings: GanttChartSettingsModel = this.viewModel.settings;
        const taskLabelsWidth: number = settings.taskLabelsCardSettings.show.value
            ? settings.taskLabelsCardSettings.width.value
            : 0;

        let translateXValue: number = taskLabelsWidth + margin.left + Gantt.SubtasksLeftMargin;
        this.chartGroup
            .attr("transform", SVGManipulations.translate(translateXValue, margin.top));

        const translateYValue: number = Gantt.TaskLabelsMarginTop + (this.ganttDiv.node() as SVGSVGElement).scrollTop;
        this.axisGroup
            .attr("transform", SVGManipulations.translate(translateXValue, translateYValue));

        translateXValue = (this.ganttDiv.node() as SVGSVGElement).scrollLeft;
        this.lineGroup
            .attr("transform", SVGManipulations.translate(translateXValue, 0));
        this.collapseAllGroup
            .attr("transform", SVGManipulations.translate(0, margin.top / 4));
    }

    private getMilestoneLineLength(numOfTasks: number): number {
        return numOfTasks * ((this.viewModel.settings.taskConfigCardSettings.height.value || DefaultChartLineHeight) + (1 + numOfTasks) * this.getResourceLabelTopMargin() / 2);
    }

    public static downgradeDurationUnitIfNeeded(tasks: Task[], durationUnit: DurationUnit) {
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

    public getFormattingModel(): powerbi.visuals.FormattingModel {

        this.filterSettingsCards();
        this.formattingSettings.setLocalizedOptions(this.localizationManager);
        return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
    }

    public filterSettingsCards() {
        const settings: GanttChartSettingsModel = this.formattingSettings;

        settings.cards.forEach(element => {
            switch(element.name) {
                case Gantt.MilestonesPropertyIdentifier.objectName: {
                    if (this.viewModel && !this.viewModel.isDurationFilled && !this.viewModel.isEndDateFilled) {
                        return;
                    }

                    const dataPoints: MilestoneDataPoint[] = this.viewModel && this.viewModel.milestonesData.dataPoints;
                    if (!dataPoints || !dataPoints.length) {
                        return;
                    }

                    const milestonesWithoutDublicates = Gantt.getUniqueMilestones(dataPoints);

                    settings.enumerateMilestones(milestonesWithoutDublicates);
                    break;
                }

                case Gantt.LegendPropertyIdentifier.objectName: {
                    if (this.viewModel && !this.viewModel.isDurationFilled && !this.viewModel.isEndDateFilled) {
                        return;
                    }

                    const dataPoints: LegendDataPoint[] = this.viewModel && this.viewModel.legendData.dataPoints;
                    if (!dataPoints || !dataPoints.length) {
                        return;
                    }

                    settings.enumerateLegend(dataPoints);
                    break;
                }

                case Gantt.CollapsedTasksPropertyIdentifier.objectName:
                    settings.collapsedTasksCardSettings.visible = false;
                    break;

                case Gantt.CollapsedTasksUpdateIdPropertyIdentifier.objectName:
                    settings.collapsedTasksUpdateIdCardSettings.visible = false;
                    break;

                case Gantt.TaskResourcePropertyIdentifier.objectName:
                    if (!this.viewModel.isResourcesFilled) {
                        settings.taskResourceCardSettings.visible = false;
                    }
                    break;
            }
        });
    }
}

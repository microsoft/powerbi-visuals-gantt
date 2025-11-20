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

import "d3-transition";
import { BaseType, select as d3Select, Selection as d3Selection } from "d3-selection";
import { ScaleTime as d3TimeScale } from "d3-scale";
import {
    timeDay as d3TimeDay,
    timeHour as d3TimeHour,
    timeMinute as d3TimeMinute,
    timeSecond as d3TimeSecond
} from "d3-time";
import { nest as d3Nest } from "d3-collection";
import { drag as d3Drag, D3DragEvent, SubjectPosition as d3SubjectPosition } from "d3-drag";


//lodash
import lodashIsEmpty from "lodash.isempty";
import lodashMin from "lodash.min";
import lodashMinBy from "lodash.minby";
import lodashMax from "lodash.max";
import lodashMaxBy from "lodash.maxby";
import lodashGroupBy from "lodash.groupby";
import lodashUniqBy from "lodash.uniqby";
import { Dictionary as lodashDictionary } from "lodash";

import powerbi from "powerbi-visuals-api";

// powerbi.extensibility.utils.svg
import * as SVGUtil from "powerbi-visuals-utils-svgutils";

// powerbi.extensibility.utils.type
import { pixelConverter as PixelConverter, valueType } from "powerbi-visuals-utils-typeutils";

// powerbi.extensibility.utils.formatting
import { textMeasurementService, valueFormatter as ValueFormatter } from "powerbi-visuals-utils-formattingutils";

// powerbi.extensibility.utils.tooltip
import {
    createTooltipServiceWrapper,
    ITooltipServiceWrapper,
} from "powerbi-visuals-utils-tooltiputils";

// powerbi.extensibility.utils.color
import { ColorHelper, darken, parseColorString, rgbString } from "powerbi-visuals-utils-colorutils";

// powerbi.extensibility.utils.chart.legend
import {
    axis as AxisHelper,
    axisInterfaces,
    axisScale,
    legend as LegendModule,
    legendInterfaces,
} from "powerbi-visuals-utils-chartutils";

// behavior
import { Behavior, BehaviorOptions } from "./behavior";
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
    LegendGroup,
    LegendType,
    Layer,
    UniqueMilestones
} from "./interfaces";
import { DurationHelper } from "./durationHelper";
import { GanttColumns } from "./columns";
import {
    drawCircle,
    drawDiamond,
    drawNotRoundedRectByPath,
    drawRectangle,
    drawRoundedRectByPath,
    getRandomHexColor,
    getRandomInteger,
    hashCode,
    isStringNotNullEmptyOrUndefined,
    isValidDate
} from "./utils";
import { drawCollapseButton, drawExpandButton, drawMinusButton, drawPlusButton } from "./drawButtons";
import { TextProperties } from "powerbi-visuals-utils-formattingutils/lib/src/interfaces";

import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import { GanttChartSettingsModel } from "./settings/ganttChartSettingsModels";
import { DateType, DurationUnit, GanttRole, LabelForDate, MilestoneLineType, MilestoneShape, ResourceLabelPosition } from "./enums";

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

import VisualObjectInstancesToPersist = powerbi.VisualObjectInstancesToPersist;

import IColorPalette = powerbi.extensibility.IColorPalette;
import ISelectionManager = powerbi.extensibility.ISelectionManager;
import ILocalizationManager = powerbi.extensibility.ILocalizationManager;
import IVisualEventService = powerbi.extensibility.IVisualEventService;
import VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;
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
// powerbi.extensibility.utils.chart.legend
import ILegend = legendInterfaces.ILegend;
import LegendPosition = legendInterfaces.LegendPosition;
import LegendData = legendInterfaces.LegendData;
import createLegend = LegendModule.createLegend;
import LegendDataPoint = legendInterfaces.LegendDataPoint;
// powerbi.extensibility.utils.chart
import IAxisProperties = axisInterfaces.IAxisProperties;
import { LegendPropertyIdentifier } from "./settings/cards/legendCard";
import { DateTypeCardSettings } from "./settings/cards/dateTypeCard";
import { BaseBackroundSettings } from "./settings/cards/backgroundCard";
import { DaysOffCardSettings } from "./settings/cards/daysOffCard";
import { TaskResourceCardSettings } from "./settings/cards/task/taskResourceCard";
import { LineContainerItem } from "./settings/cards/milestonesCard";
import { TaskLabelsCardSettings } from "./settings/cards/task/taskLabelsCard";
import { TaskConfigCardSettings } from "./settings/cards/task/taskConfigCard";
import { OverlappingLayeringStrategyOptions, OverlappingTasks } from "./settings/cards/generalCard";
import { SettingsService } from "./services/settingsService";
import { SettingsState } from "./services/settingsState";

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

interface CreateTaskDto {
    values: GanttColumns<any>;
    index: number;
    hasHighlights: boolean;
    categoricalValues: powerbi.DataViewValueColumns;
    color: string;
    completion: number;
    categoryValue: PrimitiveValue;
    endDate: Date;
    duration: number;
    taskType: LegendGroup;
    selectionBuilder: powerbi.visuals.ISelectionIdBuilder;
    wasDowngradeDurationUnit: boolean;
    stepDurationTransformation: number;
}

interface CreateTasksDto {
    dataView: DataView;
    taskTypes: LegendType;
    formatters: GanttChartFormatters;
    taskColor: string;
    isEndDateFilled: boolean;
    hasHighlights: boolean;
    sortingOptions: SortingOptions;
}

export class Gantt implements IVisual {
    private static ClassName: ClassAndSelector = createClassAndSelector("gantt");
    private static Chart: ClassAndSelector = createClassAndSelector("chart");
    private static ChartLine: ClassAndSelector = createClassAndSelector("chart-line");
    private static Body: ClassAndSelector = createClassAndSelector("gantt-body");
    private static AxisGroup: ClassAndSelector = createClassAndSelector("axis");
    private static AxisBackground: ClassAndSelector = createClassAndSelector("axis-background");
    private static Domain: ClassAndSelector = createClassAndSelector("domain");
    private static AxisTick: ClassAndSelector = createClassAndSelector("tick");
    private static Tasks: ClassAndSelector = createClassAndSelector("tasks");
    private static TaskGroup: ClassAndSelector = createClassAndSelector("task-group");
    private static SingleTask: ClassAndSelector = createClassAndSelector("task");
    private static TaskRect: ClassAndSelector = createClassAndSelector("task-rect");
    private static TaskMilestone: ClassAndSelector = createClassAndSelector("task-milestone");
    private static TaskProgress: ClassAndSelector = createClassAndSelector("task-progress");
    private static TaskDaysOff: ClassAndSelector = createClassAndSelector("task-days-off");
    private static TaskResource: ClassAndSelector = createClassAndSelector("task-resource");
    private static TaskLabels: ClassAndSelector = createClassAndSelector("task-labels");
    private static TaskLines: ClassAndSelector = createClassAndSelector("task-lines");
    private static TaskLinesRect: ClassAndSelector = createClassAndSelector("task-lines-rect");
    private static TaskLinesRectRightLine: ClassAndSelector = createClassAndSelector("task-lines-rect-right-line");
    private static TaskTopLine: ClassAndSelector = createClassAndSelector("task-top-line");
    private static CollapseAll: ClassAndSelector = createClassAndSelector("collapse-all");
    private static CollapseAllArrow: ClassAndSelector = createClassAndSelector("collapse-all-arrow");
    private static CollapseAllBackground: ClassAndSelector = createClassAndSelector("collapse-all-background");
    private static Label: ClassAndSelector = createClassAndSelector("label");
    private static LegendItems: ClassAndSelector = createClassAndSelector("legendItem");
    private static LegendTitle: ClassAndSelector = createClassAndSelector("legendTitle");
    private static ClickableArea: ClassAndSelector = createClassAndSelector("clickableArea");

    private viewport: IViewport;
    private colors: IColorPalette;
    private colorHelper: ColorHelper;
    private legend: ILegend;

    private textProperties: TextProperties = {
        fontFamily: "wf_segoe-ui_normal",
        fontSize: PixelConverter.toString(9),
    };

    public static DefaultValues = {
        AxisTickSize: 6,
        BarMargin: 2,
        ResourceWidth: 100,
        TaskColor: "#00B099",
        TaskLineColor: "#ccc",
        CollapseAllColor: "#000",
        PlusMinusColor: "#5F6B6D",
        CollapseAllTextColor: "#000",
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
    private static AxisBackgroundHeight: number = 40;
    private static AxisBackgroundLeftShift: number = 18;
    private static CollapseAllLeftShift: number = 15;
    private static CollapseAllFontAdditionalSize: number = 3;
    // It' used to hide right border of the task-lines rect
    private static CollapseAllBackgroundWidthPadding: number = 4;
    private static BarHeightMargin: number = 5;
    private static ChartLineHeightDivider: number = 4;
    private static ResourceWidthPadding: number = 10;
    private static TaskLabelsMarginTop: number = 15;
    public static CompletionDefault: number = null;
    private static CompletionMax: number = 1;
    public static CompletionMin: number = 0;
    public static CompletionMaxInPercent: number = 100;
    private static MinTasks: number = 1;
    public static ChartLineProportion: number = 1.5;
    private static MilestoneTop: number = 0;
    private static DividerForCalculatingPadding: number = 4;
    private static LabelTopOffsetForPadding: number = 0.5;
    private static DividerForCalculatingCenter: number = 2;
    private static SubtasksLeftMargin: number = 10;
    private static NotCompletedTaskOpacity: number = .5;
    private static TaskOpacity: number = 1;
    private static GroupLabelSize: number = 25;
    public static RectRound: number = 7;

    private static TimeScale: d3TimeScale<any, any>;
    private xAxisProperties: IAxisProperties;

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

    private viewModel: GanttViewModel;

    private body: d3Selection<HTMLElement, null, null, undefined>;
    private ganttSvg: d3Selection<SVGSVGElement, null, null, undefined>;
    private ganttSvgBackground: d3Selection<SVGRectElement, null, null, undefined>;
    private collapseAllGroup: d3Selection<SVGGElement, null, null, undefined>;
    private collapseAllBackground: d3Selection<SVGRectElement, null, null, undefined>;
    private axisGroup: d3Selection<SVGGElement, null, null, undefined>;
    private axisBackground: d3Selection<SVGRectElement, null, null, undefined>;
    private chartGroup: d3Selection<SVGGElement, null, null, undefined>;
    private taskGroup: d3Selection<SVGGElement, null, null, undefined>;
    private lineGroup: d3Selection<SVGGElement, null, null, undefined>;
    private lineGroupWrapper: d3Selection<SVGRectElement, null, null, undefined>;
    private lineGroupWrapperRightBorder: d3Selection<SVGRectElement, null, null, undefined>;
    private ganttDiv: d3Selection<HTMLDivElement, null, null, undefined>;
    private behavior: Behavior;
    private eventService: IVisualEventService;
    private tooltipServiceWrapper: ITooltipServiceWrapper;
    private host: IVisualHost;
    private selectionManager: ISelectionManager;
    private localizationManager: ILocalizationManager;
    private groupTasksPrevValue: boolean = false;
    private collapsedTasks: string[] = [];
    private collapseAllFlag: "data-is-collapsed";
    private parentLabelOffset: number = 5;
    private secondExpandAllIconOffset: number = 7;
    private hasNotNullableDates: boolean = false;

    private collapsedTasksUpdateIDs: string[] = [];
    private sortingOptions: SortingOptions;
    private settingsService: SettingsService;

    constructor(options: VisualConstructorOptions) {
        this.init(options);
    }

    private init(options: VisualConstructorOptions): void {
        this.host = options.host;
        this.selectionManager = this.host.createSelectionManager();
        this.localizationManager = this.host.createLocalizationManager();
        this.formattingSettingsService = new FormattingSettingsService(this.localizationManager);
        this.colors = options.host.colorPalette;
        this.colorHelper = new ColorHelper(this.colors);
        this.body = d3Select(options.element);
        this.tooltipServiceWrapper = createTooltipServiceWrapper(this.host.tooltipService, options.element);
        this.behavior = new Behavior(this.selectionManager);
        this.eventService = options.host.eventService;
        this.settingsService = new SettingsService(this.host, new SettingsState());

        this.createViewport(options.element);
    }

    /**
     * Create the viewport area of the gantt chart
     */
    private createViewport(element: HTMLElement): void {
        // create div container to the whole viewport area
        this.ganttDiv = this.body
            .append("div")
            .classed(Gantt.Body.className, true);

        // create container to the svg area
        this.ganttSvg = this.ganttDiv
            .append("svg")
            .classed(Gantt.ClassName.className, true)
            .attr("role", "listbox")
            .attr("aria-multiselectable", "true");

        this.ganttSvgBackground = this.ganttSvg
            .append("rect")
            .attr("height", "100%")
            .attr("width", "100%");

        // create chart container
        this.chartGroup = this.ganttSvg
            .append("g")
            .classed(Gantt.Chart.className, true);

        // create task lines container after chart container
        this.lineGroup = this.ganttSvg
            .append("g")
            .classed(Gantt.TaskLines.className, true)
            .attr("height", 20);

        // create tasks container
        this.taskGroup = this.chartGroup
            .append("g")
            .classed(Gantt.Tasks.className, true);

        // create axis container
        this.axisGroup = this.ganttSvg
            .append("g")
            .classed(Gantt.AxisGroup.className, true);

        this.collapseAllGroup = this.ganttSvg
            .append("g")
            .classed(Gantt.CollapseAll.className, true)
            .attr("fill", "none");

        this.axisBackground = this.axisGroup
            .append("rect")
            .classed(Gantt.AxisBackground.className, true)
            .attr("width", "100%")
            .attr("height", Gantt.AxisBackgroundHeight)
            .attr("transform", SVGManipulations.translate(-Gantt.AxisBackgroundLeftShift, -Gantt.TaskLabelsMarginTop));

        this.lineGroupWrapper = this.lineGroup
            .append("rect")
            .classed(Gantt.TaskLinesRect.className, true)
            .attr("height", 0)
            .attr("width", 0)
            .attr("y", this.margin.top)

        // Used to make right border a little thicker and draggable
        this.lineGroupWrapperRightBorder = this.lineGroup
            .append("rect")
            .classed(Gantt.TaskLinesRectRightLine.className, true)
            .attr("height", 0)
            .attr("width", 0)
            .attr("y", this.margin.top)
            .attr("cursor", "ew-resize")
            .attr("fill", "transparent");

        this.handleTaskLabelResize();

        this.lineGroup
            .append("rect")
            .classed(Gantt.TaskTopLine.className, true)
            .attr("width", "100%")
            .attr("height", 1)
            .attr("y", this.margin.top)
            .attr("fill", this.colorHelper.getHighContrastColor("foreground", Gantt.DefaultValues.TaskLineColor));

        // create legend container
        this.legend = createLegend(
            element,
            false,
            LegendPosition.Top);

        this.ganttDiv.on("scroll", (event) => {
            if (this.viewModel) {
                const taskLabelSetting = this.formattingSettings.taskLabels;
                const taskLabelShow: boolean = taskLabelSetting.show.value;
                const taskLabelsWidth: number = taskLabelShow
                    ? taskLabelSetting.general.width.value
                    : 0;

                const scrollTop: number = <number>event.target.scrollTop;
                const scrollLeft: number = <number>event.target.scrollLeft;

                const axisTranslateX: number = taskLabelsWidth + this.margin.left + Gantt.SubtasksLeftMargin + (taskLabelShow ? 0 : Gantt.GroupLabelSize);
                this.axisGroup.attr("transform", SVGManipulations.translate(axisTranslateX, scrollTop + Gantt.TaskLabelsMarginTop));
                this.lineGroup.attr("transform", SVGManipulations.translate(scrollLeft, 0))
                this.collapseAllGroup.attr("transform", SVGManipulations.translate(scrollLeft, scrollTop));
            }
        }, false);
    }

    private handleTaskLabelResize() {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;
        this.lineGroupWrapperRightBorder
            .each(function () {
                d3Select(this).datum({
                    initialX: 0,
                    initialY: 0,
                });
            })
            .call(d3Drag<SVGRectElement, unknown>()
                .on("start", (event: D3DragEvent<SVGRectElement, unknown, d3SubjectPosition>, datum: { initialX: number; initialY: number; }) => {
                    datum.initialX = event.x;
                })
                .on("drag", function (event: D3DragEvent<SVGRectElement, unknown, d3SubjectPosition>, datum: { initialX: number; initialY: number; }) {
                    const initialX = datum.initialX;
                    const dx = event.x - initialX;
                    const currentWidth = self.formattingSettings.taskLabels.general.width.value;
                    const newWidth = Math.max(currentWidth + dx, TaskLabelsCardSettings.MinWidth);

                    const ganttDiv = self.ganttDiv.node();
                    const ganttSVG = self.ganttSvg.node();

                    self.lineGroupWrapper
                        .attr("width", newWidth.toString())
                        .attr("height", (_, i, nodes) => {
                            const element = nodes[i];
                            const y = parseFloat(element.getAttribute("y")) || 0;
                            const newHeight = ganttSVG.clientHeight - y;
                            return newHeight;
                        });

                    // update x
                    d3Select(this).attr("x", newWidth.toString());

                    // Update clipping for collapse/expand all button
                    const collapseLabel = self.collapseAllGroup.select(`text`);
                    const text: string = self.collapsedTasks.length ? self.localizationManager.getDisplayName("Visual_Expand_All") : self.localizationManager.getDisplayName("Visual_Collapse_All");
                    collapseLabel.text(text);
                    collapseLabel.call(AxisHelper.LabelLayoutStrategy.clip, newWidth - Gantt.GroupLabelSize - Gantt.CollapseAllBackgroundWidthPadding, textMeasurementService.svgEllipsis);

                    // Update clipping for task labels
                    const taskLabelTextElements = self.lineGroup.selectAll<SVGTextElement, GroupedTask>(`.${Gantt.Label.className} .${Gantt.ClickableArea.className} text`);
                    taskLabelTextElements.text((task: GroupedTask) => task.name);
                    taskLabelTextElements.call(AxisHelper.LabelLayoutStrategy.clip, newWidth - Gantt.AxisLabelClip, textMeasurementService.svgEllipsis);

                    const translateX: number = newWidth + self.margin.left + Gantt.SubtasksLeftMargin;
                    const scrollTop: number = ganttDiv.scrollTop;
                    self.axisGroup.attr("transform", SVGManipulations.translate(translateX, Gantt.TaskLabelsMarginTop + scrollTop));
                    self.chartGroup.attr("transform", SVGManipulations.translate(translateX, self.margin.top));
                    self.collapseAllBackground.attr("width", newWidth + Gantt.CollapseAllBackgroundWidthPadding);
                })
                .on("end", (event: D3DragEvent<SVGRectElement, unknown, d3SubjectPosition>, datum: { initialX: number; initialY: number; }) => {
                    const dx = event.x - datum.initialX;
                    const currentWidth = this.formattingSettings.taskLabels.general.width.value;
                    const newWidth = Math.max(currentWidth + dx, TaskLabelsCardSettings.MinWidth);

                    this.host.persistProperties({
                        merge: [{
                            objectName: "taskLabels",
                            selector: null,
                            properties: {
                                width: newWidth
                            }
                        }]
                    });
                })
            );
    }

    /**
     * Clear the viewport area
     */
    private clearViewport(): void {
        this.ganttDiv
            .style("height", 0)
            .style("width", 0);

        this.body
            .selectAll(Gantt.LegendItems.selectorName)
            .remove();

        this.body
            .selectAll(Gantt.LegendTitle.selectorName)
            .remove();

        this.axisGroup
            .selectAll(Gantt.AxisTick.selectorName)
            .remove();

        this.axisGroup
            .selectAll(Gantt.Domain.selectorName)
            .remove();

        this.collapseAllGroup
            .selectAll(Gantt.CollapseAll.selectorName)
            .remove();

        this.collapseAllGroup
            .selectAll(Gantt.CollapseAllArrow.selectorName)
            .remove();

        this.lineGroup
            .selectAll(Gantt.TaskLabels.selectorName)
            .remove();

        this.lineGroup
            .selectAll(Gantt.Label.selectorName)
            .remove();

        this.chartGroup
            .selectAll(Gantt.ChartLine.selectorName)
            .remove();

        this.chartGroup
            .selectAll(Gantt.TaskGroup.selectorName)
            .remove();

        this.chartGroup
            .selectAll(Gantt.SingleTask.selectorName)
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
     * Get the tooltip info (data display names & formatted values)
     * @param task All task attributes.
     * @param formatters Formatting options for gantt attributes.
     * @param durationUnit Duration unit option
     * @param localizationManager powerbi localization manager
     * @param isEndDateFilled if end date is filled
     * @param roleLegendText customized legend name
     */
    public static getTooltipInfo({
        task,
        formatters,
        durationUnit,
        localizationManager,
        isEndDateFilled,
        roleLegendText,
        tooltipSettings
    }: {
        task: Task,
        formatters: GanttChartFormatters,
        durationUnit: DurationUnit,
        localizationManager: ILocalizationManager,
        isEndDateFilled: boolean,
        roleLegendText?: string;
        tooltipSettings?: any;
    }): VisualTooltipDataItem[] {

        const tooltipDataArray: VisualTooltipDataItem[] = [];

        // Helper function to get custom display name or default
        const getDisplayName = (customName: string, defaultKey: string): string => {
            return (customName && customName.trim()) || localizationManager.getDisplayName(defaultKey);
        };

        if (task.taskType && (!tooltipSettings || tooltipSettings.showLegend.value)) {
            tooltipDataArray.push({
                displayName: roleLegendText || getDisplayName(
                    tooltipSettings?.legendDisplayName?.value,
                    "Role_Legend"
                ),
                value: task.taskType
            });
        }

        if (!tooltipSettings || tooltipSettings.showTask.value) {
            tooltipDataArray.push({
                displayName: getDisplayName(
                    tooltipSettings?.taskDisplayName?.value,
                    "Role_Task"
                ),
                value: task.name
            });
        }

        if (task.start && !isNaN(task.start.getDate()) && (!tooltipSettings || tooltipSettings.showStartDate.value)) {
            tooltipDataArray.push({
                displayName: getDisplayName(
                    tooltipSettings?.startDateDisplayName?.value,
                    "Role_StartDate"
                ),
                value: formatters.startDateFormatter.format(task.start)
            });
        }

        if (lodashIsEmpty(task.Milestones) && task.end && !isNaN(task.end.getDate()) && (!tooltipSettings || tooltipSettings.showEndDate.value)) {
            tooltipDataArray.push({
                displayName: getDisplayName(
                    tooltipSettings?.endDateDisplayName?.value,
                    "Role_EndDate"
                ),
                value: formatters.startDateFormatter.format(task.end)
            });
        }

        if (lodashIsEmpty(task.Milestones) && task.duration && !isEndDateFilled && (!tooltipSettings || tooltipSettings.showDuration.value)) {
            const durationLabel: string = DurationHelper.generateLabelForDuration(task.duration, durationUnit, localizationManager);
            tooltipDataArray.push({
                displayName: getDisplayName(
                    tooltipSettings?.durationDisplayName?.value,
                    "Role_Duration"
                ),
                value: durationLabel
            });
        }

        if (task.completion && (!tooltipSettings || tooltipSettings.showCompletion.value)) {
            tooltipDataArray.push({
                displayName: getDisplayName(
                    tooltipSettings?.completionDisplayName?.value,
                    "Role_Completion"
                ),
                value: formatters.completionFormatter.format(task.completion)
            });
        }

        if (task.resource && (!tooltipSettings || tooltipSettings.showResource.value)) {
            tooltipDataArray.push({
                displayName: getDisplayName(
                    tooltipSettings?.resourceDisplayName?.value,
                    "Role_Resource"
                ),
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
    private getFormatters(dataView: DataView, cultureSelector: string): GanttChartFormatters {
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

        if (!this.formattingSettings.tooltipConfig.dateFormat) {
            this.formattingSettings.tooltipConfig.dateFormat.value = dateFormat;
        }

        if (this.formattingSettings.tooltipConfig.dateFormat &&
            this.formattingSettings.tooltipConfig.dateFormat.value !== dateFormat) {

            dateFormat = this.formattingSettings.tooltipConfig.dateFormat.value;
        }

        return <GanttChartFormatters>{
            startDateFormatter: ValueFormatter.create({ format: dateFormat, cultureSelector }),
            completionFormatter: ValueFormatter.create({ format: PercentFormat, value: 1, allowFormatBeautification: true })
        };
    }

    private createLegend(
        legendTypes: LegendType,
        useDefaultColor: boolean): LegendData {

        const colorHelper = new ColorHelper(this.colors, LegendPropertyIdentifier);
        const legendSettings = this.formattingSettings.legend.general;
        const legendData: LegendData = {
            fontSize: legendSettings.fontSize.value,
            fontFamily: legendSettings.fontFamily.value,
            fontStyle: legendSettings.italic.value ? "italic" : "normal",
            fontWeight: legendSettings.bold.value ? "bold" : "normal",
            textDecoration: legendSettings.underline.value ? "underline" : "none",
            dataPoints: [],
            title: legendSettings.showTitle.value ? (legendSettings.titleText.value || legendTypes?.legendColumnName) : null,
            labelColor: legendSettings.labelColor.value.value
        };

        legendData.dataPoints = legendTypes?.types.map(
            (typeMeta: LegendGroup): LegendDataPoint => {
                let color: string = this.formattingSettings.taskConfig.fill.value.value;

                if (!useDefaultColor && !colorHelper.isHighContrast) {
                    color = colorHelper.getColorForMeasure(typeMeta.columnGroup.objects, typeMeta.legendName);
                }

                return {
                    label: typeMeta.legendName?.toString(),
                    color: color,
                    selected: false,
                    identity: this.host.createSelectionIdBuilder()
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

    public static GetUniqueMilestones(milestonesDataPoints: MilestoneDataPoint[]): UniqueMilestones {
        const milestonesWithoutDuplicates: UniqueMilestones = {};
        milestonesDataPoints.forEach((milestone: MilestoneDataPoint) => {
            if (milestone.name) {
                milestonesWithoutDuplicates[milestone.name] = milestone;
            }
        });

        return milestonesWithoutDuplicates;
    }


    private static createMilestones(
        dataView: DataView,
        host: IVisualHost,
        viewMode: powerbi.ViewMode,
        settingsState: SettingsState,
        keepSettingsOnFiltering: boolean): MilestoneData {
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
        const shouldUseSettingsFromPersistProps: boolean = viewMode === powerbi.ViewMode.View || keepSettingsOnFiltering;

        const cachedShapes: { [key: string]: MilestoneShape } = {}
        const cachedColors: { [key: string]: string } = {}

        if (milestonesCategory && milestonesCategory.values) {
            milestonesCategory.values.forEach((value: PrimitiveValue, index: number) => milestones.push({ value, index }));
            milestones.forEach((milestone) => {
                const value = milestone.value as string;
                const milestoneObjects = shouldUseSettingsFromPersistProps
                    ? settingsState.getMilestoneSettings(value)
                    : milestonesCategory.objects?.[milestone.index];

                const selectionBuilder: ISelectionIdBuilder = host
                    .createSelectionIdBuilder()
                    .withCategory(milestonesCategory, milestone.index);

                if (!cachedShapes[value]) {
                    const prevShape = settingsState.getMilestoneSettings(value)?.milestones?.shapeType as (MilestoneShape | undefined);
                    cachedShapes[value] = prevShape ?? this.getRandomShape();
                }
                if (!cachedColors[value]) {
                    const prevColor = (settingsState.getMilestoneSettings(value)?.milestones as any)?.fill?.solid?.color;
                    cachedColors[value] = prevColor ?? getRandomHexColor();
                }
                const milestoneDataPoint: MilestoneDataPoint = {
                    name: value,
                    identity: selectionBuilder.createSelectionId(),
                    shapeType: milestoneObjects?.milestones?.shapeType ?
                        milestoneObjects.milestones.shapeType as string : cachedShapes[value],
                    color: milestoneObjects?.milestones?.fill ?
                        (milestoneObjects.milestones as any).fill.solid.color : cachedColors[value],
                };
                milestoneData.dataPoints.push(milestoneDataPoint);
            });

        }
        
        return milestoneData;
    }

    private static getRandomShape(): MilestoneShape {
        const allShapes = [MilestoneShape.Circle, MilestoneShape.Square, MilestoneShape.Rhombus]
        const randomShape = allShapes[Math.floor(getRandomInteger(0, allShapes.length))];
        return randomShape;
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
     * @param isEndDateFilled
     * @param hasHighlights if any of the tasks has highlights
     */
    private createTasks(createTasksDto: CreateTasksDto): Task[] {
        const {
            dataView,
            taskTypes,
            formatters,
            isEndDateFilled,
            hasHighlights,
            sortingOptions
        } = createTasksDto;

        let { taskColor } = createTasksDto

        const categoricalValues: DataViewValueColumns = dataView?.categorical?.values;

        let tasks: Task[] = [];
        const addedParents: string[] = [];
        taskColor = taskColor || Gantt.DefaultValues.TaskColor;

        const values: GanttColumns<any> = GanttColumns.getCategoricalValues(dataView);

        if (!values.Task) {
            return tasks;
        }

        const colorHelper: ColorHelper = new ColorHelper(this.colors, LegendPropertyIdentifier);
        const groupValues: GanttColumns<DataViewValueColumn>[] = GanttColumns.getGroupedValueColumns(dataView);

        const collapsedTasks: string[] = JSON.parse(this.formattingSettings.collapsedTasks.list.value);
        let durationUnit: DurationUnit = <DurationUnit>this.formattingSettings.general.durationUnit.value.value.toString();
        let duration: number = this.formattingSettings.general.durationMin.value;

        let endDate: Date = null;

        const taskCategory = dataView.categorical.categories.find(category => Gantt.hasRole(category.source, GanttRole.Task));

        values.Task.forEach((categoryValue: PrimitiveValue, index: number) => {
            const selectionBuilder: ISelectionIdBuilder = this.host
                .createSelectionIdBuilder()
                .withCategory(taskCategory, index);

            const taskGroupAttributes = this.computeTaskGroupAttributes(taskColor, groupValues, values, index, taskTypes, selectionBuilder, colorHelper, duration, durationUnit);
            const { color, completion, taskType, wasDowngradeDurationUnit, stepDurationTransformation } = taskGroupAttributes;

            duration = taskGroupAttributes.duration;
            durationUnit = taskGroupAttributes.durationUnit;
            endDate = taskGroupAttributes.endDate;

            const taskCreationDetails: CreateTaskDto = {
                values,
                index,
                hasHighlights,
                categoricalValues,
                color,
                completion,
                categoryValue,
                endDate,
                duration,
                taskType,
                selectionBuilder,
                wasDowngradeDurationUnit,
                stepDurationTransformation,
            };

            const {
                taskParentName,
                milestone,
                startDate,
                extraInformation,
                highlight,
                task
            } = this.createTask(taskCreationDetails);

            if (taskParentName) {
                Gantt.addTaskToParentTask(
                    categoryValue,
                    task,
                    tasks,
                    taskParentName,
                    addedParents,
                    collapsedTasks,
                    milestone,
                    startDate,
                    highlight,
                    extraInformation,
                    selectionBuilder,
                );
            }

            tasks.push(task);
        });

        Gantt.downgradeDurationUnitIfNeeded(tasks, durationUnit);

        if (values.Parent) {
            tasks = Gantt.sortTasksWithParents(tasks, sortingOptions);
        }

        this.updateTaskDetails(tasks, durationUnit, duration, dataView, collapsedTasks);
        this.addTooltipInfoForCollapsedTasks(tasks, collapsedTasks, formatters, durationUnit, isEndDateFilled);

        return tasks;
    }

    private updateTaskDetails(tasks: Task[], durationUnit: DurationUnit, duration: number, dataView: powerbi.DataView, collapsedTasks: string[]) {
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

            if (this.formattingSettings.daysOff.show.value && duration) {
                let datesDiff: number = 0;
                do {
                    task.daysOffList = Gantt.calculateDaysOff(
                        +this.formattingSettings.daysOff.firstDayOfWeek?.value?.value,
                        new Date(task.start.getTime()),
                        new Date(task.end.getTime())
                    );

                    if (task.daysOffList.length) {
                        const isDurationFilled: boolean = dataView.metadata.columns.findIndex(col => Gantt.hasRole(col, GanttRole.Duration)) !== -1;
                        if (isDurationFilled) {
                            const extraDuration = Gantt.calculateExtraDurationDaysOff(task.daysOffList, task.start, task.end, +this.formattingSettings.daysOff.firstDayOfWeek.value.value, durationUnit);
                            task.end = Gantt.getEndDate(durationUnit, task.start, task.duration + extraDuration);
                        }

                        const lastDayOffListItem = task.daysOffList[task.daysOffList.length - 1];
                        const lastDayOff: Date = lastDayOffListItem[1] === 1 ? lastDayOffListItem[0]
                            : new Date(lastDayOffListItem[0].getFullYear(), lastDayOffListItem[0].getMonth(), lastDayOffListItem[0].getDate() + 1);
                        datesDiff = Math.ceil((task.end.getTime() - lastDayOff.getTime()) / MillisecondsInADay);
                    }
                } while (task.daysOffList.length && datesDiff - DaysInAWeekend >= DaysInAWeek);
            }

            if (task.parent) {
                task.visibility = collapsedTasks.indexOf(task.parent) === -1;
            }
        });
    }

    private addTooltipInfoForCollapsedTasks(tasks: Task[], collapsedTasks: string[], formatters: GanttChartFormatters, durationUnit: DurationUnit, isEndDateFilled: boolean) {
        tasks.forEach((task: Task) => {
            if (!task.children || collapsedTasks.includes(task.name)) {
                task.tooltipInfo = Gantt.getTooltipInfo({
                    task,
                    formatters,
                    durationUnit,
                    localizationManager: this.localizationManager,
                    isEndDateFilled,
                    roleLegendText: this.formattingSettings.legend.general.titleText.value,
                    tooltipSettings: this.formattingSettings.tooltipConfig
                });
                if (task.Milestones) {
                    task.Milestones.forEach((milestone) => {
                        const dateFormatted = formatters.startDateFormatter.format(task.start);
                        const dateTypesSettings = this.formattingSettings.dateType;
                        milestone.tooltipInfo = this.getTooltipForMilestoneLine(dateFormatted, dateTypesSettings, [milestone.type], [milestone.category]);
                    });
                }
            }
        });
    }

    private createTask(taskCreationDetails: CreateTaskDto) {
        const {
            values,
            index,
            hasHighlights,
            categoricalValues,
            color,
            completion,
            categoryValue,
            endDate,
            duration,
            taskType,
            selectionBuilder,
            wasDowngradeDurationUnit,
            stepDurationTransformation,
        } = taskCreationDetails;

        const resource: string = (values.Resource && values.Resource[index] as string) || "";
        const taskParentName: string = (values.Parent && values.Parent[index] as string) || null;
        const milestoneType: string = (values.Milestones && !lodashIsEmpty(values.Milestones[index]) && values.Milestones[index]) || null;

        const startDate: Date = (values.StartDate && values.StartDate[index]
            && isValidDate(new Date(values.StartDate[index])) && new Date(values.StartDate[index]))
            || new Date(Date.now());

        const extraInformation: ExtraInformation[] = this.getExtraInformationFromValues(values, index);

        let highlight: number = null;
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
            parent: taskParentName,
            children: null,
            visibility: true,
            duration,
            taskType: taskType && taskType.legendName,
            description: categoryValue as string,
            tooltipInfo: [],
            selected: false,
            identity: selectionBuilder.createSelectionId(),
            extraInformation,
            daysOffList: [],
            wasDowngradeDurationUnit,
            stepDurationTransformation,
            Milestones: milestoneType && startDate ? [{
                type: milestoneType,
                start: startDate,
                tooltipInfo: null,
                category: categoryValue as string
            }] : [],
            highlight: highlight !== null
        };

        return { taskParentName, milestone: milestoneType, startDate, extraInformation, highlight, task };
    }

    private computeTaskGroupAttributes(
        taskColor: string,
        groupValues: GanttColumns<powerbi.DataViewValueColumn>[],
        values: GanttColumns<any>,
        index: number,
        taskTypes: LegendType,
        selectionBuilder: powerbi.visuals.ISelectionIdBuilder,
        colorHelper: ColorHelper,
        duration: number,
        durationUnit: DurationUnit) {
        let color: string = taskColor;
        let completion: number = 0;
        let taskType: LegendGroup = null;
        let wasDowngradeDurationUnit: boolean = false;
        let stepDurationTransformation: number = 0;
        let endDate: Date;

        const taskProgressShow: boolean = this.formattingSettings.taskCompletion.show.value;

        if (groupValues) {
            groupValues.forEach((group: GanttColumns<DataViewValueColumn>) => {
                let maxCompletionFromTasks: number = lodashMax(values.Completion);
                maxCompletionFromTasks = maxCompletionFromTasks > Gantt.CompletionMax ? Gantt.CompletionMaxInPercent : Gantt.CompletionMax;

                if (group.Duration && group.Duration.values[index] !== null) {
                    taskType =
                        taskTypes.types.find((typeMeta: LegendGroup) => typeMeta.legendName === group.Duration.source.groupName);

                    if (taskType) {
                        selectionBuilder.withCategory(taskType.selectionColumn, 0);
                        color = colorHelper.getColorForMeasure(taskType.columnGroup.objects, taskType.legendName);
                    }

                    duration = (group.Duration.values[index] as number > this.formattingSettings.general.durationMin.value) ? group.Duration.values[index] as number : this.formattingSettings.general.durationMin.value;

                    if (duration && duration % 1 !== 0) {
                        durationUnit = DurationHelper.downgradeDurationUnit(durationUnit, duration);
                        stepDurationTransformation =
                            GanttDurationUnitType.indexOf(<DurationUnit>this.formattingSettings.general.durationUnit.value.value.toString()) - GanttDurationUnitType.indexOf(durationUnit);

                        duration = DurationHelper.transformDuration(duration, durationUnit, stepDurationTransformation);
                        wasDowngradeDurationUnit = true;
                    }

                    completion = ((group.Completion && group.Completion.values[index])
                        && taskProgressShow
                        && Gantt.convertToDecimal(group.Completion.values[index] as number, this.formattingSettings.taskCompletion.maxCompletion.value, maxCompletionFromTasks)) || null;

                    if (completion !== null) {
                        if (completion < Gantt.CompletionMin) {
                            completion = Gantt.CompletionMin;
                        }

                        if (completion > Gantt.CompletionMax) {
                            completion = Gantt.CompletionMax;
                        }
                    }

                } else if (group.EndDate && group.EndDate.values[index] !== null) {
                    taskType =
                        taskTypes.types.find((typeMeta: LegendGroup) => typeMeta.legendName === group.EndDate.source.groupName);

                    if (taskType) {
                        selectionBuilder.withCategory(taskType.selectionColumn, 0);
                        color = colorHelper.getColorForMeasure(taskType.columnGroup.objects, taskType.legendName);
                    }

                    endDate = group.EndDate.values[index] ? group.EndDate.values[index] as Date : null;
                    if (typeof (endDate) === "string" || typeof (endDate) === "number") {
                        endDate = new Date(endDate);
                    }

                    completion = ((group.Completion && group.Completion.values[index])
                        && taskProgressShow
                        && Gantt.convertToDecimal(group.Completion.values[index] as number, this.formattingSettings.taskCompletion.maxCompletion.value, maxCompletionFromTasks)) || null;

                    if (completion !== null) {
                        if (completion < Gantt.CompletionMin) {
                            completion = Gantt.CompletionMin;
                        }

                        if (completion > Gantt.CompletionMax) {
                            completion = Gantt.CompletionMax;
                        }
                    }
                }
            });
        }

        return {
            duration,
            durationUnit,
            color,
            completion,
            taskType,
            wasDowngradeDurationUnit,
            stepDurationTransformation,
            endDate
        };
    }

    private static addTaskToParentTask(
        categoryValue: PrimitiveValue,
        task: Task,
        tasks: Task[],
        taskParentName: string,
        addedParents: string[],
        collapsedTasks: string[],
        milestone: string,
        startDate: Date,
        highlight: number,
        extraInformation: ExtraInformation[],
        selectionBuilder: ISelectionIdBuilder,
    ) {
        if (addedParents.includes(taskParentName)) {
            const parentTask: Task = tasks.find(x => x.index === 0 && x.name === taskParentName);
            parentTask.children.push(task);
        } else {
            addedParents.push(taskParentName);

            const parentTask: Task = {
                index: 0,
                name: taskParentName,
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
                extraInformation: collapsedTasks.includes(taskParentName) ? extraInformation : null,
                daysOffList: null,
                wasDowngradeDurationUnit: null,
                selected: null,
                identity: selectionBuilder.createSelectionId(),
                Milestones: milestone && startDate ? [{ type: milestone, start: startDate, tooltipInfo: null, category: categoryValue as string }] : [],
                highlight: highlight !== null
            };

            tasks.push(parentTask);
        }
    }

    private getExtraInformationFromValues(values: GanttColumns<any>, taskIndex: number): ExtraInformation[] {
        const extraInformation: ExtraInformation[] = [];

        if (values.ExtraInformation) {
            const extraInformationKeys: any[] = Object.keys(values.ExtraInformation);
            for (const key of extraInformationKeys) {
                const value: string = values.ExtraInformation[key][taskIndex];
                if (value) {
                    extraInformation.push({
                        displayName: key,
                        value: value
                    });
                }
            }
        }

        return extraInformation;
    }

    public static SortTasks(groupedTasks: lodashDictionary<Task[]>): void {
        const taskKeys: string[] = Object.keys(groupedTasks);

        const sortingFunction = (a: Task, b: Task) => {
            if (a.start.getTime() === b.start.getTime()) {
                return b.end.getTime() - a.end.getTime();
            }
            return a.start.getTime() - b.start.getTime();
        };

        taskKeys.forEach((key: string) => {
            const tasks: Task[] = groupedTasks[key];
            if (!tasks[0].children?.length) {
                tasks.sort(sortingFunction);
                return;
            }
            tasks.forEach((task: Task) => {
                if (task.children && task.children.length) {
                    task.children = task.children.sort(sortingFunction);
                }
            });
        });
    }

    public static sortTasksWithParents(tasks: Task[], sortingOptions: SortingOptions): Task[] {
        const sortingFunction = ((a: Task, b: Task) => {
            const sortingDirection = sortingOptions.sortingDirection === SortDirection.Ascending ? 1 : -1;
            return a.name.localeCompare(b.name, undefined, { numeric: true }) * sortingDirection;
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

    private getTaskYCoordinateWithLayer(task: Task, taskConfigHeight: number): number {
        return Gantt.getBarYCoordinate(task.index, taskConfigHeight) +
            (task.index + 1) * this.getResourceLabelTopMargin();
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

    private static isSameDay(firstDate: Date, secondDate: Date): boolean {
        return firstDate.getMonth() === secondDate.getMonth() && firstDate.getFullYear() === secondDate.getFullYear()
            && firstDate.getDate() === secondDate.getDate();
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

        if (Gantt.isSameDay(fromDate, toDate)) {
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
    public converter(dataView: DataView, sortingOptions: SortingOptions, viewMode: powerbi.ViewMode): GanttViewModel {
        if (dataView?.categorical?.categories?.length === 0 || !Gantt.isChartHasTask(dataView)) {
            return null;
        }
        const legendTypes: LegendType = Gantt.getAllLegendTypes(dataView);
        this.hasHighlights = Gantt.hasHighlights(dataView);

        const formatters: GanttChartFormatters = this.getFormatters(dataView, this.host.locale || null);

        const isDurationFilled: boolean = dataView.metadata.columns.findIndex(col => Gantt.hasRole(col, GanttRole.Duration)) !== -1,
            isEndDateFilled: boolean = dataView.metadata.columns.findIndex(col => Gantt.hasRole(col, GanttRole.EndDate)) !== -1,
            isParentFilled: boolean = dataView.metadata.columns.findIndex(col => Gantt.hasRole(col, GanttRole.Parent)) !== -1,
            isResourcesFilled: boolean = dataView.metadata.columns.findIndex(col => Gantt.hasRole(col, GanttRole.Resource)) !== -1;

        const legendData: LegendData = this.createLegend(legendTypes, !isDurationFilled && !isEndDateFilled);
        const milestoneData: MilestoneData = Gantt.createMilestones(dataView, this.host, viewMode, this.settingsService.state, this.formattingSettings.milestones.generalGroup.keepSettingsOnFiltering.value);

        const taskColor: string = (legendData.dataPoints?.length <= 1) || !isDurationFilled
            ? this.formattingSettings.taskConfig.fill.value.value
            : null;

        const tasks: Task[] = this.createTasks({ dataView, taskTypes: legendTypes, formatters, taskColor, isEndDateFilled, hasHighlights: this.hasHighlights, sortingOptions });

        legendData.dataPoints = legendData?.dataPoints?.map((legendItem) => {
            legendItem.label = legendItem.label || this.formattingSettings.legend.general.emptyLabelText.value;
            return legendItem;
        });
        return {
            dataView,
            taskTypes: legendTypes,
            tasks,
            legendData,
            milestoneData,
            isDurationFilled,
            isEndDateFilled: isEndDateFilled,
            isParentFilled,
            isResourcesFilled,
        };
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
    private static getAllLegendTypes(dataView: DataView): LegendType {
        const legendTypes: LegendType = {
            legendColumnName: "",
            types: []
        };
        const index: number = dataView.metadata.columns.findIndex(col => GanttRole.Legend in col.roles);

        if (index !== -1) {
            const legendMetaCategoryColumn: DataViewMetadataColumn = dataView.metadata.columns[index];
            legendTypes.legendColumnName = legendMetaCategoryColumn.displayName;
            const values = (dataView?.categorical?.values?.length && dataView.categorical.values) || <DataViewValueColumns>[];

            if (values === undefined || values.length === 0) {
                return;
            }

            const groupValues = values.grouped();
            legendTypes.types = groupValues.map((group: DataViewValueColumnGroup): LegendGroup => {
                const column: DataViewCategoryColumn = {
                    identity: [group.identity],
                    source: {
                        displayName: null,
                        queryName: legendMetaCategoryColumn.queryName
                    },
                    values: null
                };
                return {
                    legendName: group.name?.toString(),
                    selectionColumn: column,
                    columnGroup: group
                };
            });
        }

        return legendTypes;
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

        const settings = this.formattingSettings.legend.general;
        const position: string | LegendPosition = this.formattingSettings.legend.show.value
            ? LegendPosition[settings.position.value.value]
            : LegendPosition.None;

        this.legend.changeOrientation(position as LegendPosition);
        this.legend.drawLegend(this.viewModel.legendData, structuredClone(this.viewport));

        this.body
            .selectAll(Gantt.LegendItems.selectorName)
            .style("font-size", PixelConverter.fromPoint(settings.fontSize.value))
            .style("font-family", settings.fontFamily.value)
            .style("font-weight", settings.bold.value ? "bold" : "normal")
            .style("font-style", settings.italic.value ? "italic" : "normal")
            .style("text-decoration", settings.underline.value ? "underline" : "none");


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
    * @param options The visual option that contains the dataView and the viewport
    */
    public update(options: VisualUpdateOptions): void {
        try {
            if (!options || !options.dataViews || !options.dataViews[0]) {
                this.clearViewport();
                return;
            }
            console.log('Gantt update called');

            const collapsedTasksUpdateId: any = options.dataViews[0].metadata?.objects?.collapsedTasksUpdateId?.value;

            if (this.collapsedTasksUpdateIDs.includes(collapsedTasksUpdateId)) {
                this.collapsedTasksUpdateIDs = this.collapsedTasksUpdateIDs.filter(id => id !== collapsedTasksUpdateId);
                return;
            }

            this.updateInternal(options);
        } catch (error) {
            console.error(error);
            this.eventService.renderingFailed(options, error);
        }
    }

    private updateInternal(options: VisualUpdateOptions): void {
        this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(GanttChartSettingsModel, options.dataViews[0]);
        this.formattingSettings.setHighContrastColors(this.colorHelper);
        this.formattingSettings.parse();
        this.settingsService.state.parse(this.formattingSettings.milestones.milestoneGroup.persistSettings.value);

        this.sortingOptions = Gantt.getSortingOptions(options.dataViews[0]);
        this.viewModel = this.converter(options.dataViews[0], this.sortingOptions, options.viewMode);


        // for duplicated milestone types
        if (this.viewModel && this.viewModel.milestoneData) {
            const newMilestoneData: MilestoneData = this.viewModel.milestoneData;
            const milestonesWithoutDuplicates = Gantt.GetUniqueMilestones(newMilestoneData.dataPoints);

            this.settingsService.state.setMilestonesSettings(milestonesWithoutDuplicates);

            newMilestoneData.dataPoints.forEach((dataPoint: MilestoneDataPoint) => {
                if (dataPoint.name) {
                    const theSameUniqDataPoint: MilestoneDataPoint = milestonesWithoutDuplicates[dataPoint.name];
                    dataPoint.color = theSameUniqDataPoint.color;
                    dataPoint.shapeType = theSameUniqDataPoint.shapeType;
                }
            });

            this.viewModel.milestoneData = newMilestoneData;
            if (this.settingsService.state.hasBeenUpdated
                && (options.viewMode === powerbi.ViewMode.Edit || options.viewMode === powerbi.ViewMode.InFocusEdit)
            ) {
                // We save state once rendering is done to save current milestones settings because they might be lost after filtering.
                this.settingsService.save();
            }
        }

        if (!this.viewModel || !this.viewModel.tasks || this.viewModel.tasks.length <= 0) {
            this.clearViewport();
            return;
        }

        this.viewport = structuredClone(options.viewport);
        this.margin = Gantt.DefaultMargin;

        this.eventService.renderingStarted(options);

        this.render(options.dataViews[0].metadata.objects);

        this.eventService.renderingFinished(options);
    }

    private render(objects: powerbi.DataViewObjects): void {
        const settings = this.formattingSettings;

        this.renderLegend();
        this.updateChartSize();

        const visibleTasks = this.viewModel.tasks
            .filter((task: Task) => task.visibility);
        const tasks: Task[] = visibleTasks
            .map((task: Task, i: number) => {
                task.index = i;
                return task;
            });

        if (tasks.length < Gantt.MinTasks) {
            return;
        }

        this.collapsedTasks = JSON.parse(settings.collapsedTasks.list.value);
        const groupTasks = settings.general.groupTasks.value;
        const layerOverlappingTasks = settings.general.overlappingTasksGroup;
        const groupedTasks: GroupedTask[] = this.getGroupTasks(tasks, groupTasks, this.collapsedTasks, layerOverlappingTasks);
        // do something with task ids
        this.updateCommonTasks(groupedTasks);
        this.updateCommonMilestones(groupedTasks);

        const tasksAfterGrouping: Task[] = groupedTasks.flatMap(t => t.tasks);
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

            const dateTypeMilliseconds: number = Gantt.getDateType(DateType[settings.dateType.type.value.value]);
            let ticks: number = Math.ceil(Math.round(endDate.valueOf() - startDate.valueOf()) / dateTypeMilliseconds);
            ticks = ticks < 2 ? 2 : ticks;

            axisLength = ticks * Gantt.DefaultTicksLength;
            axisLength = this.scaleAxisLength(axisLength);

            const viewportIn: IViewport = {
                height: this.viewport.height,
                width: axisLength
            };

            const xAxisProperties: IAxisProperties = this.calculateAxes(viewportIn, this.textProperties, startDate, endDate, ticks, false);
            this.xAxisProperties = xAxisProperties;
            Gantt.TimeScale = <d3TimeScale<Date, Date>>xAxisProperties.scale;

            this.renderAxis(xAxisProperties);
        }

        axisLength = this.scaleAxisLength(axisLength);

        this.setDimension(groupedTasks, axisLength, settings);

        this.updateSvgBackgroundColor();
        this.renderTasks(groupedTasks, objects);
        this.updateTaskLabels(groupedTasks, settings.taskLabels.general.width.value);
        this.updateElementsPositions(this.margin);
        this.createMilestoneLine(groupedTasks);

        if (this.formattingSettings.general.scrollToCurrentTime.value && this.hasNotNullableDates) {
            this.scrollToMilestoneLine(axisLength);
        }

        this.bindBehaviorOptions(tasks);
    }

    private bindBehaviorOptions(tasks: Task[]): void {
        const legendItemsSelection: d3Selection<SVGGElement, LegendDataPoint, any, any> = this.body.selectAll(Gantt.LegendItems.selectorName);
        const legendDataPoints = legendItemsSelection.data();
        const behaviorOptions: BehaviorOptions = {
            dataPoints: tasks,
            legendDataPoints: legendDataPoints,
            hasHighlights: this.hasHighlights,
            clearCatcher: this.body,
            taskSelection: this.taskGroup.selectAll(Gantt.SingleTask.selectorName),
            legendSelection: legendItemsSelection,
            subTasksCollapse: {
                selection: this.body.selectAll(Gantt.ClickableArea.selectorName),
                callback: this.subTasksCollapseCb.bind(this)
            },
            allSubTasksCollapse: {
                selection: this.body.select(Gantt.CollapseAll.selectorName),
                arrowSelection: this.body.select(Gantt.CollapseAll.selectorName).select(Gantt.CollapseAllArrow.selectorName),
                callback: this.subTasksCollapseAll.bind(this)
            },
        };

        this.behavior.bindEvents(behaviorOptions);
        this.behavior.renderSelection(this.hasHighlights);
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

        // If labels do not fit, and we are not scrolling, try word breaking
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
        const dateType: DateType = DateType[this.formattingSettings.dateType.type.value.value];
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
            outerPadding: 5,
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

        let totalRows = 0;
        groupedTasks.forEach(group => {
            if (settings.general.groupTasks.value) {
                const maxLayer = Math.max(...group.tasks.map(t => t.layer ?? 0));
                totalRows += maxLayer + 1;
            } else {
                totalRows++;
            }
        });

        const fullResourceLabelMargin = totalRows * this.getResourceLabelTopMargin();
        let widthBeforeConversion = this.margin.left + settings.taskLabels.general.width.value + axisLength;

        if (settings.taskResource.show.value && settings.taskResource.position.value.value === ResourceLabelPosition.Right) {
            widthBeforeConversion += Gantt.DefaultValues.ResourceWidth;
        } else {
            widthBeforeConversion += Gantt.DefaultValues.ResourceWidth / 2;
        }

        const height = PixelConverter.toString(totalRows * (settings.taskConfig.height.value || DefaultChartLineHeight) + this.margin.top + fullResourceLabelMargin);
        const width = PixelConverter.toString(widthBeforeConversion);

        this.ganttSvg
            .attr("height", height)
            .attr("width", width);
    }

    private getGroupTasks(tasks: Task[], groupTasks: boolean, collapsedTasks: string[], overlappingSettings: OverlappingTasks): GroupedTask[] {
        if (groupTasks) {
            const groupedTasks: lodashDictionary<Task[]> = lodashGroupBy(tasks,
                x => (x.parent ? `${x.parent}.${x.name}` : x.name));

            const result: GroupedTask[] = [];
            const taskKeys: string[] = Object.keys(groupedTasks);
            const alreadyReviewedKeys: string[] = [];

            if (this.sortingOptions.isCustomSortingNeeded) {
                const sortingFunction = (a: string, b: string) =>
                    a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }) *
                    (this.sortingOptions.sortingDirection === SortDirection.Ascending ? 1 : -1);
                taskKeys.sort(sortingFunction);
            }

            Gantt.SortTasks(groupedTasks);

            for (const key of taskKeys) {
                const isKeyAlreadyReviewed = alreadyReviewedKeys.includes(key);
                if (isKeyAlreadyReviewed) continue;

                let name: string = key;
                if (groupedTasks[key] && groupedTasks[key].length && groupedTasks[key][0].parent && key.indexOf(groupedTasks[key][0].parent) !== -1) {
                    name = key.substr(groupedTasks[key][0].parent.length + 1, key.length);
                }

                // add current task
                const taskRecord: GroupedTask = {
                    name,
                    tasks: groupedTasks[key],
                    index: null,
                    layers: new Map<number, Task[]>()
                };
                result.push(taskRecord);
                alreadyReviewedKeys.push(key);

                // see all the children and add them

                for (const task of groupedTasks[key]) {
                    if (task.children && !collapsedTasks.includes(task.name)) {
                        for (const childrenTask of task.children) {
                            const childrenFullName = `${name}.${childrenTask.name}`;
                            const isChildrenKeyAlreadyReviewed = alreadyReviewedKeys.includes(childrenFullName);

                            if (!isChildrenKeyAlreadyReviewed) {
                                const childrenRecord: GroupedTask = {
                                    name: childrenTask.name,
                                    tasks: groupedTasks[childrenFullName],
                                    index: null,
                                    layers: new Map<number, Task[]>()
                                };
                                result.push(childrenRecord);
                                alreadyReviewedKeys.push(childrenFullName);
                            }

                        }
                    }

                }
            }

            result.forEach((x, i) => {
                x.tasks.forEach(t => t.index = i);
                x.index = i;
            });

            // Ensure that the tasks with children are displayed first
            // https://dev.azure.com/powerbi/PowerBICustomVisuals/_workitems/edit/1421305
            result.forEach((group: GroupedTask) => {
                group.tasks.sort((a, b) => (b.children?.length || 0) - (a.children?.length || 0));
            });

            const processLayers = (calculateTaskLayers: (groups: GroupedTask[]) => void) => {
                calculateTaskLayers(result);
                this.reassignTaskIndicesWithLayers(result);
                this.assignLayers(result);
            };

            switch (overlappingSettings.displayTasks.value.value) {
                case OverlappingLayeringStrategyOptions.LayerByLegend: {
                    processLayers(this.calculateTaskLayersByLegend.bind(this));
                    break;
                }
                case OverlappingLayeringStrategyOptions.LayerOverlapping: {
                    processLayers(this.calculateTaskLayers.bind(this));
                    break;
                }
            }

            return result;
        }

        return tasks.map(x => ({
            name: x.name,
            index: x.index,
            tasks: [x],
            layers: new Map<number, Task[]>()
        } as GroupedTask));
    }

    private calculateTaskLayers(groupedTasks: GroupedTask[]): void {
        groupedTasks.forEach(groupedTask => {
            const tasks = groupedTask.tasks;
            if (tasks.length <= 1) {
                groupedTask.tasks.forEach(task => task.layer = 0);
                return;
            }

            tasks[0].layer = 0;
            const layerEndTimes: Date[] = [tasks[0].end];

            for (let i = 1; i < tasks.length; i++) {
                const task = tasks[i];
                let assignedLayer = -1;

                for (let layerIndex = 0; layerIndex < layerEndTimes.length; layerIndex++) {
                    if (task.start >= layerEndTimes[layerIndex]) {
                        assignedLayer = layerIndex;
                        layerEndTimes[layerIndex] = task.end;
                        break;
                    }
                }

                if (assignedLayer === -1) {
                    assignedLayer = layerEndTimes.length;
                    layerEndTimes.push(task.end);
                }

                task.layer = assignedLayer;
            }
        });
    }

    private calculateTaskLayersByLegend(groupedTasks: GroupedTask[]): void {
        const legendDataPoints = this.viewModel.legendData.dataPoints;
        const legendLabels = legendDataPoints.map(dp => dp.label);

        groupedTasks.forEach(groupedTask => {
            const tasksByLegend = lodashGroupBy(groupedTask.tasks, 'taskType');
            let totalLayers = 0;

            legendLabels.forEach(label => {
                if (tasksByLegend[label]) {
                    totalLayers += this.assignLayersToTasks(tasksByLegend[label], totalLayers);
                }
            });

            const noLegendTasks = (tasksByLegend['null'] || []).concat(tasksByLegend['undefined'] || []);
            if (noLegendTasks.length > 0) {
                totalLayers += this.assignLayersToTasks(noLegendTasks, totalLayers);
            }
        });
    }

    private assignLayersToTasks(tasks: Task[], layerOffset: number): number {
        if (!tasks || tasks.length === 0) {
            return 0;
        }

        const layerEndTimes: Date[] = [];
        tasks.forEach(task => {
            let assignedLayer = -1;
            for (let i = 0; i < layerEndTimes.length; i++) {
                if (task.start >= layerEndTimes[i]) {
                    assignedLayer = i;
                    layerEndTimes[i] = task.end;
                    break;
                }
            }

            if (assignedLayer === -1) {
                assignedLayer = layerEndTimes.length;
                layerEndTimes.push(task.end);
            }
            task.layer = layerOffset + assignedLayer;
        });

        return layerEndTimes.length;
    }

    private assignLayers(groupedTasks: GroupedTask[]): void {
        groupedTasks.forEach(groupedTask => {
            const tasksByLayer: lodashDictionary<Task[]> = lodashGroupBy(groupedTask.tasks, task => task.layer || 0);
            for (let i = 0; i < Object.keys(tasksByLayer).length; i++) {
                groupedTask.layers.set(i, tasksByLayer[i] || []);
            }
        });
    }

    private reassignTaskIndicesWithLayers(groupedTasks: GroupedTask[]): void {
        let currentIndex = 0;

        groupedTasks.forEach(groupedTask => {
            const maxLayer = Math.max(...groupedTask.tasks.map(t => t.layer || 0));

            groupedTask.index = currentIndex;

            for (let layer = 0; layer <= maxLayer; layer++) {
                const tasksInLayer = groupedTask.tasks.filter(t => (t.layer || 0) === layer);

                if (tasksInLayer.length > 0) {
                    tasksInLayer.forEach(task => {
                        task.index = currentIndex;
                    });
                    currentIndex++;
                }
            }
        });
    }

    private renderAxis(xAxisProperties: IAxisProperties, duration: number = Gantt.DefaultDuration): void {
        const dateTypeSettings: DateTypeCardSettings = this.formattingSettings.dateType;
        const backgroundSettings: BaseBackroundSettings = this.formattingSettings.background.dateType;

        const axisColor: string = dateTypeSettings.axisColor.value.value;
        const axisTextColor: string = dateTypeSettings.axisTextColor.value.value;
        const axisFontSize: number = dateTypeSettings.axisFontSize.value;
        const axisBackgroundEnable: boolean = backgroundSettings.enable.value;
        const axisBackgroundColor: string = backgroundSettings.color.value.value;
        const axisBackgroundOpacity: number = backgroundSettings.opacity.value;

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
            .style("fill", (timestamp: number) => this.setTickColor(timestamp, axisTextColor))
            .style("font-size", axisFontSize);

        this.axisBackground
            .style("fill", axisBackgroundEnable ? axisBackgroundColor : "none")
            .style("fill-opacity", !isNaN(axisBackgroundOpacity) ? axisBackgroundOpacity / 100 : 1);
    }

    private setTickColor(
        timestamp: number,
        defaultColor: string): string {
        const tickTime = new Date(timestamp);
        const daysOffSettings: DaysOffCardSettings = this.formattingSettings.daysOff;
        const firstDayOfWeek: string = daysOffSettings.firstDayOfWeek?.value?.value.toString();
        const color: string = daysOffSettings.fill.value.value;
        if (daysOffSettings.show.value) {
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
    private updateTaskLabels(tasks: GroupedTask[], width: number): void {
        const taskLabelsShow: boolean = this.formattingSettings.taskLabels.show.value;

        this.updateCollapseAllGroup(taskLabelsShow);

        if (taskLabelsShow) {
            this.renderTaskColumnsRightLine();
            this.renderTaskLabels(tasks, width);
        } else {
            this.lineGroupWrapper
                .attr("width", 0)
                .attr("height", 0)
                .attr("fill", "transparent");

            this.lineGroupWrapperRightBorder
                .attr("width", 0)
                .attr("height", 0);

            this.lineGroup
                .selectAll(Gantt.Label.selectorName)
                .remove();
        }
    }

    private renderTaskLabels(tasks: GroupedTask[], width: number) {
        const displayGridLines: boolean = this.formattingSettings.general.displayGridLines.value;
        const taskConfigHeight: number = this.formattingSettings.taskConfig.height.value || DefaultChartLineHeight;

        this.lineGroup
            .selectAll(Gantt.Label.selectorName)
            .remove();

        const axisLabel = this.lineGroup
            .selectAll<SVGGElement, GroupedTask>(Gantt.Label.selectorName)
            .data(tasks);

        const axisLabelGroup = axisLabel
            .enter()
            .append("g")
            .merge(axisLabel);

        axisLabelGroup
            .classed(Gantt.Label.className, true)
            .attr("transform", (task: GroupedTask) => {
                return SVGManipulations.translate(0, this.margin.top + this.getTaskLabelCoordinateY(task.index));
            });

        this.renderClickableAreas(axisLabelGroup, width, taskConfigHeight);

        let parentTask: string = "";
        let childrenCount = 0;
        let currentChildrenIndex = 0;

        axisLabelGroup
            .append("rect")
            .attr("x", (task: GroupedTask) => {
                const isGrouped = this.formattingSettings.general.groupTasks.value;
                const drawStandardMargin: boolean = !task.tasks[0].parent || task.tasks[0].parent && task.tasks[0].parent !== parentTask;
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
                return drawStandardMargin || isLastChild ? Gantt.DefaultValues.ParentTaskLeftMargin : Gantt.DefaultValues.ChildTaskLeftMargin;
            })
            .attr("y", (task: GroupedTask) => {
                const groupHeight = ((task.layers.size || 1) - 1) * taskConfigHeight;
                const res = (task.index + 1) * this.getResourceLabelTopMargin() + (taskConfigHeight - this.formattingSettings.taskLabels.general.fontSize.value) / 2 + groupHeight;

                return res;
            })
            .attr("width", () => displayGridLines ? this.viewport.width : 0)
            .attr("height", 1)
            .attr("fill", this.colorHelper.getHighContrastColor("foreground", Gantt.DefaultValues.TaskLineColor));

        axisLabel
            .exit()
            .remove();
    }

    static wrapText(
        selection: d3Selection<SVGTextElement, GroupedTask, any, any>,
        maxWidth: number,
        maxHeight: number = 2
    ): void {
        selection.each(function (task: GroupedTask) {
            const textElement = d3Select(this);
            const text = task.name;
            const computedStyle = window.getComputedStyle(this);
            const fontSize = parseFloat(computedStyle.fontSize);
            const fontFamily = computedStyle.fontFamily;
            const maxLines = Math.floor(maxHeight * 0.8 / (fontSize * 1.2)) || 1;

            textElement.selectAll('tspan').remove();
            textElement.text('');

            const textProps: TextProperties = {
                fontFamily: fontFamily,
                fontSize: computedStyle.fontSize,
                text: text
            };

            const words = text.split(/\s+/);
            const lineHeight = fontSize * 1.2;
            let line: string[] = [];
            let lineNumber = 0;

            for (let i = 0; i < words.length; i++) {
                line.push(words[i]);
                textProps.text = line.join(' ');
                const lineWidth = textMeasurementService.measureSvgTextWidth(textProps);

                if (lineWidth > maxWidth && line.length > 1) {
                    line.pop();
                    const lineText = line.join(' ');

                    if (lineNumber < maxLines - 1) {
                        textProps.text = lineText;
                        const truncatedText = textMeasurementService.getTailoredTextOrDefault(textProps, maxWidth);
                        textElement.append('tspan')
                            .attr('x', textElement.attr('x'))
                            .attr('dy', lineNumber === 0 ? 0 : lineHeight)
                            .text(truncatedText);

                        line = [words[i]];
                        lineNumber++;
                    } else {
                        textProps.text = lineText + ' ' + words.slice(i).join(' ');
                        const truncatedText = textMeasurementService.getTailoredTextOrDefault(textProps, maxWidth);
                        textElement.append('tspan')
                            .attr('x', textElement.attr('x'))
                            .attr('dy', lineNumber === 0 ? 0 : lineHeight)
                            .text(truncatedText);
                        textElement.selectChild("tspan").attr('dy', -((lineNumber) * lineHeight) / 2);
                        return;
                    }
                }
            }

            if (lineNumber < maxLines && line.length > 0) {
                textProps.text = line.join(' ');
                const finalWidth = textMeasurementService.measureSvgTextWidth(textProps);
                const finalText = finalWidth > maxWidth
                    ? textMeasurementService.getTailoredTextOrDefault(textProps, maxWidth)
                    : textProps.text;
                textElement.append('tspan')
                    .attr('x', textElement.attr('x'))
                    .attr('dy', lineNumber === 0 ? 0 : lineHeight)
                    .text(finalText);
                textElement.selectChild("tspan").attr('dy', -((lineNumber) * lineHeight) / 2);
            }
        });
    }

    private renderClickableAreas(axisLabelGroup: d3Selection<SVGGElement, GroupedTask, any, any>, width: number, taskConfigHeight: number) {
        const clickableArea = axisLabelGroup
            .append("g")
            .classed(Gantt.ClickableArea.className, true)
            .merge(axisLabelGroup);

        const { general, nestedLabels } = this.formattingSettings.taskLabels;
        const useCustom: boolean = nestedLabels.customize.value;
        const height = this.formattingSettings.taskConfig.height.value || DefaultChartLineHeight;

        clickableArea
            .append("text")
            .attr("x", (task: GroupedTask) => (Gantt.TaskLineCoordinateX +
                (task.tasks.every((task: Task) => !!task.parent)
                    ? Gantt.SubtasksLeftMargin
                    : (task.tasks[0].children && !!task.tasks[0].children.length) ? this.parentLabelOffset : 0)))
            .attr("class", (task: GroupedTask) => task.tasks[0].children ? "parent" : task.tasks[0].parent ? "child" : "normal-node")
            .style("font-weight", (task: GroupedTask) => {
                const isParent = !!task.tasks[0].children;
                const isChild = !!task.tasks[0].parent;

                if (isParent) {
                    return general.bold.value ? "900" : "700";
                }

                if (isChild && useCustom) {
                    return nestedLabels.bold.value ? "700" : "400";
                }

                return general.bold.value ? "700" : "400";
            })
            .style("font-size", (task: GroupedTask) => {
                const isChild: boolean = !!task.tasks[0].parent;
                return PixelConverter.fromPoint(isChild && useCustom
                    ? nestedLabels.fontSize.value
                    : general.fontSize.value
                )
            })
            .style("font-family", (task: GroupedTask) => {
                const isChild: boolean = !!task.tasks[0].parent;
                return isChild && useCustom
                    ? nestedLabels.fontFamily.value
                    : general.fontFamily.value;
            })
            .style("font-style", (task: GroupedTask) => {
                const isChild: boolean = !!task.tasks[0].parent;

                if (isChild) {
                    return useCustom
                        ? nestedLabels.italic.value ? "italic" : "normal"
                        : "italic";
                }
                return general.italic.value ? "italic" : "normal";
            })
            .style("text-decoration", (task: GroupedTask) => {
                const isChild: boolean = !!task.tasks[0].parent;
                return isChild && useCustom
                    ? nestedLabels.underline.value ? "underline" : "none"
                    : general.underline.value ? "underline" : "none";
            })
            .attr("stroke-width", Gantt.AxisLabelStrokeWidth)
            .attr("y", (task: GroupedTask) => {
                const groupHeight: number = taskConfigHeight * ((task.layers.size || 1) - 1);
                return (task.index + (task.layers.size || 0) + 0.5) * this.getResourceLabelTopMargin() + groupHeight / 2;
            })
            .attr("fill", (task: GroupedTask) => {
                const isChild: boolean = !!task.tasks[0].parent;

                return isChild && useCustom
                    ? nestedLabels.fill.value.value
                    : general.fill.value.value;
            })
            .text((task: GroupedTask) => task.name)
            .call((selection) => {
                if (this.formattingSettings.general.shouldWrapText.value) {
                    Gantt.wrapText(selection, width - Gantt.AxisLabelClip, height);
                } else {
                    AxisHelper.LabelLayoutStrategy.clip(selection, width - Gantt.AxisLabelClip, textMeasurementService.svgEllipsis);
                }
            })
            .append("title")
            .text((task: GroupedTask) => task.name);

        const buttonSelection = clickableArea
            .filter((task: GroupedTask) => task.tasks[0].children && !!task.tasks[0].children.length)
            .append("svg")
            .attr("viewBox", "0 0 32 32")
            .attr("width", Gantt.DefaultValues.IconWidth)
            .attr("height", Gantt.DefaultValues.IconHeight)
            .attr("y", (task: GroupedTask) => (task.index + 0.5) * this.getResourceLabelTopMargin() - Gantt.DefaultValues.IconMargin)
            .attr("x", Gantt.DefaultValues.BarMargin)
            .attr("focusable", true)
            .attr("tabindex", 1)
            .attr("role", "option")
            .attr("aria-label", (task: GroupedTask) => task.name);

        clickableArea
            .append("rect")
            .attr("width", 2 * Gantt.DefaultValues.IconWidth)
            .attr("height", 2 * Gantt.DefaultValues.IconWidth)
            .attr("y", (task: GroupedTask) => (task.index + 0.5) * this.getResourceLabelTopMargin() - Gantt.DefaultValues.IconMargin)
            .attr("x", Gantt.DefaultValues.BarMargin)
            .attr("fill", "transparent");

        clickableArea.classed("pointerCursor", (task: GroupedTask) => task.tasks[0].children && !!task.tasks[0].children.length);

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
    }

    private renderTaskColumnsRightLine() {
        const taskLabelsWidth: number = this.formattingSettings.taskLabels.general.width.value;
        const backgroundSettings: BaseBackroundSettings = this.formattingSettings.background.categoryLabels;

        const getGanttSVGRectHeight = (element: SVGRectElement): number => {
            const y = parseFloat(element.getAttribute("y")) || 0;
            const ganttDivHeight = this.ganttSvg.node().clientHeight;
            const newHeight = ganttDivHeight - y;
            return newHeight;
        };

        this.lineGroupWrapper
            .attr("width", taskLabelsWidth)
            .attr("height", (_, i, nodes) => {
                const element = nodes[i];
                return getGanttSVGRectHeight(element);
            })
            .attr("stroke", this.colorHelper.getHighContrastColor("foreground", Gantt.DefaultValues.TaskLineColor))
            .attr("stroke-width", 1)
            .attr("fill", backgroundSettings.enable.value
                ? backgroundSettings.color.value?.value
                : "none"
            )
            .attr("fill-opacity", !isNaN(backgroundSettings.opacity.value / 100)
                ? backgroundSettings.opacity.value / 100
                : 1
            );

        this.lineGroupWrapperRightBorder
            .attr("x", taskLabelsWidth - 5)
            .attr("width", 11)
            .attr("height", (_, i, nodes) => {
                const element = nodes[i];
                return getGanttSVGRectHeight(element);
            });
    }

    private updateCollapseAllGroup(taskLabelShow: boolean) {
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
            const categoryLabelsWidth: number = Gantt.CollapseAllBackgroundWidthPadding + (taskLabelShow
                ? this.formattingSettings.taskLabels.general.width.value
                : Gantt.GroupLabelSize);

            const backgroundSettings: BaseBackroundSettings = this.formattingSettings.background.dateType;
            this.collapseAllBackground = this.collapseAllGroup
                .append("rect")
                .classed(Gantt.CollapseAllBackground.className, true)
                .attr("width", categoryLabelsWidth)
                .attr("x", -1)
                .attr("height", Gantt.AxisBackgroundHeight)
                .attr("fill", backgroundSettings.enable.value
                    ? backgroundSettings.color.value.value
                    : "none"
                )
                .attr("fill-opacity", !isNaN(backgroundSettings.opacity.value / 100)
                    ? backgroundSettings.opacity.value / 100
                    : 1
                );

            const expandCollapseButton = this.collapseAllGroup
                .append("svg")
                .classed(Gantt.CollapseAllArrow.className, true)
                .attr("tabindex", 1)
                .attr("role", "option")
                .attr("focusable", true)
                .attr("role", "option")
                .attr("aria-label", this.collapsedTasks.length ? this.localizationManager.getDisplayName("Visual_Expand_All") : this.localizationManager.getDisplayName("Visual_Collapse_All"))
                .attr("viewBox", "0 0 48 48")
                .attr("width", Gantt.GroupLabelSize)
                .attr("height", Gantt.GroupLabelSize)
                .attr("x", 0)
                .attr("y", this.secondExpandAllIconOffset)
                .attr(this.collapseAllFlag, (this.collapsedTasks.length ? "1" : "0"));

            expandCollapseButton
                .append("rect")
                .attr("width", Gantt.GroupLabelSize)
                .attr("height", Gantt.GroupLabelSize)
                .attr("x", 0)
                .attr("y", this.secondExpandAllIconOffset)
                .attr("fill", "transparent");

            const buttonExpandCollapseColor = this.colorHelper.getHighContrastColor("foreground", Gantt.DefaultValues.CollapseAllColor);
            if (this.collapsedTasks.length) {
                drawExpandButton(expandCollapseButton, buttonExpandCollapseColor);
            } else {
                drawCollapseButton(expandCollapseButton, buttonExpandCollapseColor);
            }

            if (taskLabelShow) {
                const settings = this.formattingSettings.taskLabels.expandCollapse.customize.value
                    ? this.formattingSettings.taskLabels.expandCollapse
                    : this.formattingSettings.taskLabels.general;

                const text: string = this.collapsedTasks.length
                    ? this.localizationManager.getDisplayName("Visual_Expand_All")
                    : this.localizationManager.getDisplayName("Visual_Collapse_All");

                this.collapseAllGroup
                    .append("text")
                    .attr("x", Math.ceil(Gantt.GroupLabelSize))
                    .attr("y", Gantt.GroupLabelSize)
                    .style("font-size", settings.fontSize.value + Gantt.CollapseAllFontAdditionalSize)
                    .style("font-family", settings.fontFamily.value)
                    .style("font-style", settings.italic.value ? "italic" : "normal")
                    .style("font-weight", settings.bold.value ? "bold" : "normal")
                    .style("text-decoration", settings.underline.value ? "underline" : "none")
                    .style("fill", this.colorHelper.getHighContrastColor("foreground", settings.fill.value.value))
                    .text(text)
                    .call(AxisHelper.LabelLayoutStrategy.clip, this.formattingSettings.taskLabels.general.width.value - Gantt.GroupLabelSize - Gantt.CollapseAllBackgroundWidthPadding, textMeasurementService.svgEllipsis)
                    .attr("aria-label", this.collapsedTasks.length ? this.localizationManager.getDisplayName("Visual_Expand_All") : this.localizationManager.getDisplayName("Visual_Collapse_All"));
            }
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

        const newId = crypto.randomUUID();
        this.collapsedTasksUpdateIDs.push(newId);

        this.setJsonFiltersValues(this.collapsedTasks, newId);
    }

    /**
     * callback for subtasks collapse all click event
     */
    private subTasksCollapseAll(): void {
        const collapsedAllSelector = this.collapseAllGroup.select(Gantt.CollapseAllArrow.selectorName);
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

        const newId = crypto.randomUUID();
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

    private updateSvgBackgroundColor(): void {
        const background: BaseBackroundSettings = this.formattingSettings.background.general;
        const backgroundEnable = background.enable.value;
        const color = background.color.value.value;
        const opacity = background.opacity.value;

        this.ganttSvgBackground
            .attr("fill", backgroundEnable ? color : "none")
            .attr("fill-opacity", !isNaN(opacity) ? opacity / 100 : 1);
    }

    /**
     * Render tasks
     * @param groupedTasks Grouped tasks
     */
    private renderTasks(groupedTasks: GroupedTask[], objects: powerbi.DataViewObjects): void {
        const taskConfigHeight: number = this.formattingSettings.taskConfig.height.value || DefaultChartLineHeight;
        const shouldRenderLines: boolean = this.formattingSettings.general.overlappingTasksGroup.displayGroupedTaskGridLines.value;
        const generalBarsRoundedCorners: boolean = this.formattingSettings.general.barsRoundedCorners.value;
        const taskGroupSelection = this.taskGroup
            .selectAll<SVGGElement, GroupedTask>(Gantt.TaskGroup.selectorName)
            .data(groupedTasks);

        taskGroupSelection
            .exit()
            .remove();

        // render task group container
        const taskGroupSelectionMerged = taskGroupSelection
            .enter()
            .append("g")
            .merge(taskGroupSelection);

        taskGroupSelectionMerged.classed(Gantt.TaskGroup.className, true);

        const taskSelection = this.taskSelectionRectRender(taskGroupSelectionMerged, shouldRenderLines);
        this.taskMainRectRender(taskSelection, taskConfigHeight, generalBarsRoundedCorners, this.formattingSettings.taskConfig);
        this.MilestonesRender(taskSelection, taskConfigHeight);
        this.taskProgressRender(taskSelection);
        this.taskDaysOffRender(taskSelection, taskConfigHeight);
        this.taskResourceRender(taskSelection, taskConfigHeight, objects);

        this.renderTooltip(taskSelection);
    }


    /**
     * Change task structure to be able for
     * Rendering common tasks when all the children of current parent are collapsed
     * used only the Grouping mode is OFF
     * @param groupedTasks Grouped tasks
     */
    private updateCommonTasks(groupedTasks: GroupedTask[]): void {
        if (!this.formattingSettings.general.groupTasks.value) {
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
    private taskSelectionRectRender(taskGroupSelection: d3Selection<SVGGElement, GroupedTask, SVGGElement, null>, shouldRenderLines: boolean) {
        const taskLineSelection = taskGroupSelection
            .selectAll(".task-line")
            .data((d: GroupedTask) => {
                if (d.layers && d.layers.size > 0) {
                    return Array.from(d.layers.entries()).map(([layerIndex, tasks]) => ({
                        index: layerIndex,
                        tasks
                    } as Layer));
                }
                return [{
                    index: 0,
                    tasks: d.tasks
                }];
            })
            .join("g")
            .classed("task-line", true);

        this.renderGroupedTaskGridLines(taskLineSelection, shouldRenderLines);

        const taskSelection = taskLineSelection
            .selectAll<SVGGElement, Task>(Gantt.SingleTask.selectorName)
            .data((d: Layer) => d.tasks)
            .join("g")
            .classed(Gantt.SingleTask.className, true);

        return taskSelection;
    }

    private renderGroupedTaskGridLines(taskLinesSelection: d3Selection<SVGGElement | BaseType, Layer, SVGGElement, GroupedTask>, shouldRenderLines: boolean) {
        const taskLineRectSelection = taskLinesSelection
            .selectAll(".task-rect")
            .data((d: Layer) => d.index === 0 ? [] : [d])
            .join("rect")
            .classed("task-rect", true)
            .attr("height", shouldRenderLines ? 1 : 0)
            .attr("x", 0)
            .attr("y", (d: Layer) => {
                const firstTask = d.tasks[0];
                const taskConfigHeight: number = this.formattingSettings.taskConfig.height.value || DefaultChartLineHeight;
                const y = this.getTaskYCoordinateWithLayer(firstTask, taskConfigHeight);
                const padding = taskConfigHeight - taskConfigHeight / Gantt.ChartLineProportion;
                return y - padding / 2;
            })
            .attr("width", "100%")
            .attr("fill", "#ccc");

        return taskLineRectSelection;
    }

    /**
     * @param task
     */
    private getTaskRectWidth(task: Task): number {
        const taskIsCollapsed = this.collapsedTasks.includes(task.name);

        if (this.hasNotNullableDates &&
            (taskIsCollapsed || lodashIsEmpty(task.Milestones)) &&
            (task.start != null && task.end != null)
        ) {
            return Gantt.taskDurationToWidth(task.start, task.end);
        }

        return 0;
    }


    /**
     *
     * @param task
     * @param taskConfigHeight
     * @param barsRoundedCorners are bars with rounded corners
     */
    private drawTaskRect(task: Task, taskConfigHeight: number, barsRoundedCorners: boolean): string {
        const x = this.hasNotNullableDates ? Gantt.TimeScale(task.start) : 0,
            y = this.getTaskYCoordinateWithLayer(task, taskConfigHeight),
            width = this.getTaskRectWidth(task),
            height = Gantt.getBarHeight(taskConfigHeight),
            radius = Gantt.RectRound;


        if (barsRoundedCorners && width >= 2 * radius) {
            return drawRoundedRectByPath(x, y, width, height, radius);
        }

        return drawNotRoundedRectByPath(x, y, width, height);
    }

    /**
     * Render task progress rect
     * @param taskSelection Task Selection
     * @param taskConfigHeight Task heights from settings
     * @param barsRoundedCorners are bars with rounded corners
     */
    private taskMainRectRender(
        taskSelection: d3Selection<SVGGElement, Task, SVGGElement | BaseType, Layer>,
        taskConfigHeight: number,
        barsRoundedCorners: boolean,
        taskSettings: TaskConfigCardSettings
    ): void {
        const highContrastModeTaskRectStroke: number = 1;

        const taskRect = taskSelection
            .selectAll<SVGPathElement, Task>(Gantt.TaskRect.selectorName)
            .data((d: Task) => [d]);

        const taskRectMerged = taskRect
            .enter()
            .append("path")
            .merge(taskRect);

        taskRectMerged.classed(Gantt.TaskRect.className, true)

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
            })
            .style("stroke", (task: Task) => {
                if (!task.color) {
                    return task.color
                }

                const parsedColor = parseColorString(task.color);
                const darkenedColor = darken(parsedColor, 50);
                return rgbString(darkenedColor);
            })
            .style("stroke-width", taskSettings.border.width.value);

        if (this.colorHelper.isHighContrast) {
            taskRectMerged
                .style("stroke", (task: Task) => this.colorHelper.getHighContrastColor("background", task.color))
                .style("stroke-width", taskSettings.border.width.value || highContrastModeTaskRectStroke);
        }

        taskRectMerged.each(function (d: Task) {
            const node = d3Select(this);
            const width = Number(node.attr("width"));
            if (isNaN(width) || width === 0) {
                node.attr("focusable", null);
                node.attr("tabindex", null)
                node.attr("role", null);
                node.attr("aria-label", null);
            } else {
                node.attr("focusable", true);
                node.attr("tabindex", 2);
                node.attr("role", "option");
                node.attr("aria-label", d.name);
            }
        });

        taskRect
            .exit()
            .remove();
    }

    /**
     *
     * @param milestoneType milestone type
     */
    private getMilestoneColor(milestoneType: string): string {
        const milestone: MilestoneDataPoint = this.viewModel.milestoneData.dataPoints.find((dataPoint: MilestoneDataPoint) => dataPoint.name === milestoneType);

        return this.colorHelper.getHighContrastColor("foreground", milestone.color);
    }

    private getMilestonePath(milestoneType: string, taskConfigHeight: number): string {
        let shape: string;
        const convertedHeight: number = Gantt.getBarHeight(taskConfigHeight);
        const milestone: MilestoneDataPoint = this.viewModel.milestoneData.dataPoints.find((dataPoint: MilestoneDataPoint) => dataPoint.name === milestoneType);
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
        taskSelection: d3Selection<SVGGElement, Task, SVGGElement | BaseType, Layer>,
        taskConfigHeight: number): void {
        const taskMilestones = taskSelection
            .selectAll<SVGGElement, {
                key: number;
                values: MilestonePath[];
                task: Task;
            }>(Gantt.TaskMilestone.selectorName)
            .data((d: Task) => {
                const nestedByDate: {
                    key: string;
                    values: Milestone[];
                    value: undefined;
                }[] = d3Nest<Milestone>().key((d: Milestone) => d.start.toDateString()).entries(d.Milestones);

                const updatedMilestones: MilestonePath[] = nestedByDate.map((nestedObj) => {
                    const oneDateMilestones: Milestone[] = nestedObj.values;
                    // if there is 2 or more milestones for concrete date => draw only one milestone for concrete date, but with tooltip for all of them
                    const currentMilestone = [...oneDateMilestones].pop();
                    const allTooltipInfo = oneDateMilestones.map((milestone: MilestonePath) => milestone.tooltipInfo);
                    currentMilestone.tooltipInfo = allTooltipInfo.reduce((a, b) => a.concat(b), []);

                    return {
                        taskID: d.index,
                        type: currentMilestone.type,
                        start: currentMilestone.start,
                        tooltipInfo: currentMilestone.tooltipInfo,
                    };
                });

                return [{
                    key: d.index,
                    values: <MilestonePath[]>updatedMilestones,
                    task: d
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

        taskMilestonesMerged.classed(Gantt.TaskMilestone.className, true);

        const transformForMilestone = (task: Task, start: Date) => {
            const yCoordinate = this.getTaskYCoordinateWithLayer(task, taskConfigHeight);
            return SVGManipulations.translate(Gantt.TimeScale(start) - Gantt.getBarHeight(taskConfigHeight) / 4, yCoordinate);
        };

        const taskMilestonesSelection = taskMilestonesMerged.selectAll("path");
        const taskMilestonesSelectionData = taskMilestonesSelection.data(milestonesData => milestonesData.values);

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
                .attr("transform", (data: MilestonePath, i: number, nodes: any[]) => {
                    const parentData = d3Select(nodes[i].parentNode).datum() as { task: Task };
                    return transformForMilestone(parentData.task, data.start);
                })
                .attr("fill", (data: MilestonePath) => this.getMilestoneColor(data.type))
                .attr("focusable", true)
                .attr("tabindex", 2)
                .attr("role", "option")
                .attr("aria-label", (data: MilestonePath) => data.type);
        }

        this.renderTooltip(taskMilestonesSelectionMerged);
    }

    /**
     * Render days off rects
     * @param taskSelection Task Selection
     * @param taskConfigHeight Task heights from settings
     */
    private taskDaysOffRender(
        taskSelection: d3Selection<SVGGElement, Task, SVGGElement | BaseType, Layer>,
        taskConfigHeight: number): void {

        const taskDaysOffColor: string = this.formattingSettings.daysOff.fill.value.value;
        const taskDaysOffShow: boolean = this.formattingSettings.daysOff.show.value;

        taskSelection
            .selectAll(Gantt.TaskDaysOff.selectorName)
            .remove();

        if (taskDaysOffShow) {
            const tasksDaysOff = taskSelection
                .selectAll<SVGPathElement, TaskDaysOff & { parentTask: Task }>(Gantt.TaskDaysOff.selectorName)
                .data((d: Task) => {
                    const tasksDaysOff: (TaskDaysOff & { parentTask: Task })[] = [];

                    if (!d.children && d.daysOffList) {
                        for (let i = 0; i < d.daysOffList.length; i++) {
                            const currentDaysOffItem: DayOffData = d.daysOffList[i];
                            const startOfLastDay: Date = new Date(+d.end);
                            startOfLastDay.setHours(0, 0, 0);
                            if (currentDaysOffItem[0].getTime() < startOfLastDay.getTime()) {
                                tasksDaysOff.push({
                                    id: d.index,
                                    daysOff: d.daysOffList[i],
                                    parentTask: d
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

            tasksDaysOffMerged.classed(Gantt.TaskDaysOff.className, true);

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

            const drawTaskRectDaysOff = (task: TaskDaysOff & { parentTask: Task }) => {
                const x = this.hasNotNullableDates ? Gantt.TimeScale(task.daysOff[0]) : 0;
                const y: number = this.getTaskYCoordinateWithLayer(task.parentTask, taskConfigHeight),
                    height: number = Gantt.getBarHeight(taskConfigHeight),
                    radius: number = this.formattingSettings.general.barsRoundedCorners.value ? Gantt.RectRound : 0,
                    width: number = getTaskRectDaysOffWidth(task);

                if (this.formattingSettings.general.barsRoundedCorners.value && width >= 2 * radius) {
                    return drawRoundedRectByPath(x, y, width, height, radius);
                }

                return drawNotRoundedRectByPath(x, y, width, height);
            };

            tasksDaysOffMerged
                .attr("d", (task: TaskDaysOff & { parentTask: Task }) => drawTaskRectDaysOff(task))
                .style("fill", taskDaysOffColor)
                .attr("width", (task: TaskDaysOff & { parentTask: Task }) => getTaskRectDaysOffWidth(task));

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
        taskSelection: d3Selection<SVGGElement, Task, SVGGElement | BaseType, Layer>
    ): void {
        const taskProgressShow: boolean = this.formattingSettings.taskCompletion.show.value;

        let index = 0, groupedTaskIndex = 0;
        const taskProgress = taskSelection
            .selectAll<SVGLinearGradientElement, { key: string; values: LinearStop[]; }>(Gantt.TaskProgress.selectorName)
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

        taskProgressMerged.classed(Gantt.TaskProgress.className, true);

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
            .attr("stop-opacity", (_: LinearStop, index: number) => (index > 1) && taskProgressShow ? Gantt.NotCompletedTaskOpacity : Gantt.TaskOpacity);

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
        taskSelection: d3Selection<SVGGElement, Task, SVGGElement | BaseType, Layer>,
        taskConfigHeight: number,
        objects: powerbi.DataViewObjects): void {

        const groupTasks: boolean = this.formattingSettings.general.groupTasks.value;
        const positionFromObjects: powerbi.DataViewPropertyValue = objects?.taskResource?.position;

        let newLabelPosition: ResourceLabelPosition | null = null;
        if (groupTasks && !this.groupTasksPrevValue && !positionFromObjects) {
            newLabelPosition = ResourceLabelPosition.Inside;
        }

        if (!groupTasks && this.groupTasksPrevValue && !positionFromObjects) {
            newLabelPosition = ResourceLabelPosition.Right;
        }

        const taskResourceSettings: TaskResourceCardSettings = this.formattingSettings.taskResource;
        if (newLabelPosition) {
            taskResourceSettings.position.setValue(newLabelPosition);
            newLabelPosition = null;
        }

        this.groupTasksPrevValue = groupTasks;

        const isResourcesFilled: boolean = this.viewModel.isResourcesFilled;
        const taskResourceShow: boolean = taskResourceSettings.show.value;
        const taskResourceFontSize: number = taskResourceSettings.fontSize.value;
        const taskResourcePosition: ResourceLabelPosition = <ResourceLabelPosition>taskResourceSettings.position.value.value;
        const taskResourceFullText: boolean = taskResourceSettings.fullText.value;
        const taskResourceWidthByTask: boolean = taskResourceSettings.widthByTask.value;
        const isGroupedByTaskName: boolean = this.formattingSettings.general.groupTasks.value;
        const isInsidePosition: boolean = [ResourceLabelPosition.Inside, ResourceLabelPosition.InsideCenter, ResourceLabelPosition.InsideRight].includes(taskResourcePosition);
        const isTopPosition: boolean = [ResourceLabelPosition.Top, ResourceLabelPosition.TopCenter, ResourceLabelPosition.TopRight].includes(taskResourcePosition);

        taskSelection
            .selectAll(Gantt.TaskResource.selectorName)
            .remove();

        if (isResourcesFilled && taskResourceShow) {
            const taskResource = taskSelection
                .selectAll<SVGTextElement, Task>(Gantt.TaskResource.selectorName)
                .data((d: Task) => [d]);

            const taskResourceMerged = taskResource
                .enter()
                .append("text")
                .merge(taskResource);

            taskResourceMerged.classed(Gantt.TaskResource.className, true);

            taskResourceMerged
                .attr("x", (task: Task) => this.getResourceLabelXCoordinate(task, taskResourceFontSize, taskResourcePosition))
                .attr("y", (task: Task) => this.getTaskYCoordinateWithLayer(task, taskConfigHeight)
                    + Gantt.getResourceLabelYOffset(taskConfigHeight, taskResourceFontSize, taskResourcePosition))
                .text((task: Task) => lodashIsEmpty(task.Milestones) && task.resource || "")
                .style("fill", (task: Task) =>
                    taskResourceSettings.matchLegendColors.value
                        ? this.colorHelper.getHighContrastColor("foreground", task.color)
                        : taskResourceSettings.fill.value.value)
                .style("font-size", PixelConverter.fromPoint(taskResourceFontSize))
                .style("font-family", taskResourceSettings.fontFamily.value)
                .style("font-weight", taskResourceSettings.bold.value ? "bold" : "normal")
                .style("font-style", taskResourceSettings.italic.value ? "italic" : "normal")
                .style("text-decoration", taskResourceSettings.underline.value ? "underline" : "none")
                .style("alignment-baseline", isInsidePosition ? "central" : "auto");

            const hasNotNullableDates: boolean = this.hasNotNullableDates;
            const defaultWidth: number = Gantt.DefaultValues.ResourceWidth - Gantt.ResourceWidthPadding;

            if (taskResourceWidthByTask) {
                taskResourceMerged
                    .each(function (task: Task) {
                        const width: number = hasNotNullableDates ? Gantt.taskDurationToWidth(task.start, task.end) : 0;
                        AxisHelper.LabelLayoutStrategy.clip(d3Select(this), width - Gantt.RectRound * 2, textMeasurementService.svgEllipsis);
                    });
            } else if (isGroupedByTaskName) {
                taskResourceMerged
                    .each(function (task: Task, outerIndex: number) {
                        const sameRowNextTaskStart: Date = Gantt.getSameRowNextTaskStartDate(task, outerIndex, taskResourceMerged);

                        if (sameRowNextTaskStart) {
                            let width: number = 0;
                            if (hasNotNullableDates) {
                                const startDate: Date = isTopPosition ? task.start : task.end;
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
        }
    }

    private static getSameRowNextTaskStartDate(task: Task, index: number, selection: d3Selection<SVGTextElement, Task, SVGGElement, Task>) {
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
                return (barHeight / Gantt.DividerForCalculatingCenter) + (taskResourceFontSize / Gantt.DividerForCalculatingCenter);
            case ResourceLabelPosition.Top:
            case ResourceLabelPosition.TopCenter:
            case ResourceLabelPosition.TopRight:
                return -(taskResourceFontSize / Gantt.DividerForCalculatingPadding) + Gantt.LabelTopOffsetForPadding;
            case ResourceLabelPosition.Inside:
            case ResourceLabelPosition.InsideCenter:
            case ResourceLabelPosition.InsideRight:
                return -(taskResourceFontSize / Gantt.DividerForCalculatingPadding) + Gantt.LabelTopOffsetForPadding + barHeight / Gantt.ResourceLabelDefaultDivisionCoefficient;
        }
    }

    private getResourceLabelXCoordinate(
        task: Task,
        taskResourceFontSize: number,
        taskResourcePosition: ResourceLabelPosition): number {
        if (!this.hasNotNullableDates) {
            return 0;
        }

        const width = this.getTaskRectWidth(task);
        const xStart: number = Gantt.TimeScale(task.start) || 0;
        const xEnd: number = Gantt.TimeScale(task.end) || 0;
        const textWidth: number = textMeasurementService.measureSvgTextWidth({
            text: task.resource || "",
            fontFamily: this.formattingSettings.taskResource.fontFamily.value,
            fontSize: PixelConverter.fromPoint(taskResourceFontSize),
            fontWeight: this.formattingSettings.taskResource.bold.value ? "bold" : "normal",
            fontStyle: this.formattingSettings.taskResource.italic.value ? "italic" : "normal"
        });

        switch (taskResourcePosition) {
            case ResourceLabelPosition.Right:
                return Gantt.RectRound + xEnd;
            case ResourceLabelPosition.Inside:
            case ResourceLabelPosition.Top: {
                return xStart + Gantt.RectRound;
            }
            case ResourceLabelPosition.InsideCenter:
            case ResourceLabelPosition.TopCenter: {
                const result: number = xStart + (width - textWidth) / 2;
                if (result < xStart + Gantt.RectRound) {
                    return xStart + Gantt.RectRound;
                }
                return result;
            }
            case ResourceLabelPosition.InsideRight:
            case ResourceLabelPosition.TopRight: {
                const result: number = xEnd - textWidth - Gantt.RectRound;
                if (result < xStart + Gantt.RectRound) {
                    return xStart + Gantt.RectRound;
                }
                return result;
            }
        }
    }

    /**
     * Returns the matching Y coordinate for a given task index
     * @param taskIndex Task Number
     */
    private getTaskLabelCoordinateY(taskIndex: number): number {
        const settings = this.formattingSettings;
        const fontSize: number = + settings.taskLabels.general.fontSize.value;
        const taskConfigHeight = settings.taskConfig.height.value || DefaultChartLineHeight;
        const taskYCoordinate = taskConfigHeight * taskIndex;
        const barHeight = Gantt.getBarHeight(taskConfigHeight);
        return taskYCoordinate + (barHeight + Gantt.BarHeightMargin - (taskConfigHeight - fontSize) / Gantt.ChartLineHeightDivider);
    }

    /**
    * Get completion percent when days off feature is on
    * @param task All task attributes
    */
    private getDaysOffTaskProgressPercent(task: Task) {
        if (this.formattingSettings.daysOff.show.value) {
            if (task.daysOffList && task.daysOffList.length && task.duration && task.completion) {
                let durationUnit: DurationUnit = <DurationUnit>this.formattingSettings.general.durationUnit.value.value.toString();
                if (task.wasDowngradeDurationUnit) {
                    durationUnit = DurationHelper.downgradeDurationUnit(durationUnit, task.duration);
                }
                const startTime: number = task.start.getTime();
                const progressLength: number = (task.end.getTime() - startTime) * task.completion;
                const currentProgressTime: number = new Date(startTime + progressLength).getTime();

                const daysOffFiltered: DayOffData[] = task.daysOffList
                    .filter((date) => startTime <= date[0].getTime() && date[0].getTime() <= currentProgressTime);

                const extraDuration: number = Gantt.calculateExtraDurationDaysOff(daysOffFiltered, task.end, task.start, +this.formattingSettings.daysOff.firstDayOfWeek.value.value, durationUnit);
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
        const taskResourceSettings: TaskResourceCardSettings = this.formattingSettings.taskResource;
        const taskResourceShow: boolean = taskResourceSettings.show.value;
        const taskResourceFontSize: number = taskResourceSettings.fontSize.value;
        const taskResourcePosition: ResourceLabelPosition = <ResourceLabelPosition>taskResourceSettings.position.value.value;
        const isTopPosition: boolean = [ResourceLabelPosition.Top, ResourceLabelPosition.TopCenter, ResourceLabelPosition.TopRight].includes(taskResourcePosition);

        let margin: number = 0;
        if (isResourcesFilled && taskResourceShow && isTopPosition) {
            margin = Number(taskResourceFontSize) + Gantt.LabelTopOffsetForPadding;
        }

        return margin;
    }

    /**
     * convert task duration to width in the timescale
     * @param start The start of task to convert
     * @param end The end of task to convert
     */
    private static taskDurationToWidth(
        start: Date,
        end: Date): number {
        return Gantt.TimeScale(end) - Gantt.TimeScale(start);
    }

    private getTooltipForMilestoneLine(
        formattedDate: string,
        dateTypeSettings: DateTypeCardSettings,
        milestoneTitle: string[] | LabelForDate[], milestoneCategoryName?: string[]): VisualTooltipDataItem[] {
        const result: VisualTooltipDataItem[] = [];

        for (let i = 0; i < milestoneTitle.length; i++) {
            if (!milestoneTitle[i]) {
                switch (dateTypeSettings.type.value.value) {
                    case DateType.Second:
                    case DateType.Minute:
                    case DateType.Hour:
                        milestoneTitle[i] = this.localizationManager.getDisplayName("Visual_Label_Now");
                        break;
                    default:
                        milestoneTitle[i] = this.localizationManager.getDisplayName("Visual_Label_Today");
                }
            }

            if (milestoneCategoryName) {
                result.push({
                    displayName: this.localizationManager.getDisplayName("Visual_Milestone_Name"),
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

        const dateTypeSettings: DateTypeCardSettings = this.formattingSettings.dateType;
        const todayColor: string = dateTypeSettings.todayColor.value.value;
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

        const lastTaskGroup: GroupedTask = tasks[tasks.length - 1];
        const tasksTotal: number = lastTaskGroup.layers.size
            ? lastTaskGroup.index + lastTaskGroup.layers.size
            : tasks.length;

        const line: Line[] = [];
        milestoneDates.forEach((date: Date) => {
            const title = date === Gantt.TimeScale(timestamp) ? milestoneTitle : "Milestone";
            const lineOptions = {
                x1: Gantt.TimeScale(date),
                y1: Gantt.MilestoneTop,
                x2: Gantt.TimeScale(date),
                y2: this.getMilestoneLineLength(tasksTotal),
                tooltipInfo: this.getTooltipForMilestoneLine(date.toLocaleDateString(), dateTypeSettings, [title])
            };
            line.push(lineOptions);
        });
        this.renderMilestoneDottedLines(line, timestamp, todayColor);
    }

    private renderMilestoneDottedLines(line: Line[], timestamp: number, todayColor: string) {
        const lineSettings: LineContainerItem = this.formattingSettings.milestones.lineGroup;
        const shouldRenderTodayLine: boolean = this.formattingSettings.dateType.showTodayLine.value;
        if (lineSettings.showLines.value) {
            const chartLineSelection = this.chartGroup
                .selectAll<SVGLineElement, Line>(Gantt.ChartLine.selectorName)
                .data(line);

            const chartLineSelectionMerged = chartLineSelection
                .enter()
                .append("line")
                .merge(chartLineSelection);

            chartLineSelectionMerged.classed(Gantt.ChartLine.className, true)


            chartLineSelectionMerged
                .attr("x1", (line: Line) => line.x1)
                .attr("y1", (line: Line) => line.y1)
                .attr("x2", (line: Line) => line.x2)
                .attr("y2", (line: Line) => line.y2)
                .style("stroke", (line: Line) => {
                    const color: string = line.x1 === Gantt.TimeScale(timestamp) ? todayColor : lineSettings.lineColor.value.value;
                    return this.colorHelper.getHighContrastColor("foreground", color);
                })
                .style("stroke-opacity", lineSettings.lineOpacity.value / 100)
                .style("display", (line: Line) => {
                    return line.x1 === Gantt.TimeScale(timestamp) ? shouldRenderTodayLine ? "block" : "none" : "block"
                });

            switch (<MilestoneLineType>lineSettings.lineType.value.value) {
                case MilestoneLineType.Solid:
                    chartLineSelectionMerged.style("stroke-dasharray", "none")
                    break;
                case MilestoneLineType.Dotted:
                default:
                    chartLineSelectionMerged.style("stroke-dasharray", "3,3")
                    break;
            }

            this.renderTooltip(chartLineSelectionMerged);

            chartLineSelection
                .exit()
                .remove();
        } else {
            this.chartGroup
                .selectAll(Gantt.ChartLine.selectorName)
                .remove();
        }
    }

    private scrollToMilestoneLine(axisLength: number,
        timestamp: number = Date.now()): void {

        let scrollValue = Gantt.TimeScale(new Date(timestamp));
        scrollValue -= scrollValue > ScrollMargin
            ? ScrollMargin
            : 0;

        if (axisLength > scrollValue) {
            this.body.node()
                .querySelector(Gantt.Body.selectorName).scrollLeft = scrollValue;
        }
    }

    private renderTooltip(selection: d3Selection<SVGElement, Line | Task | MilestonePath, any, any>): void {
        this.tooltipServiceWrapper.addTooltip(
            selection,
            (task: Task) => task.tooltipInfo,
            (task: Task) => task.identity);
    }

    private updateElementsPositions(margin: IMargin): void {
        const taskSettings: TaskLabelsCardSettings = this.formattingSettings.taskLabels;
        const taskLabelShow: boolean = taskSettings.show.value;
        const taskLabelsWidth: number = taskLabelShow
            ? taskSettings.general.width.value
            : 0;

        const translateX: number = taskLabelsWidth + margin.left + Gantt.SubtasksLeftMargin;
        const shiftX: number = !taskLabelShow && this.viewModel.isParentFilled
            ? Gantt.GroupLabelSize
            : 0;

        this.chartGroup.attr("transform", SVGManipulations.translate(translateX + shiftX, margin.top));

        const ganttDiv = this.ganttDiv.node();
        const translateY: number = Gantt.TaskLabelsMarginTop + ganttDiv.scrollTop;

        this.axisGroup
            .attr("transform", SVGManipulations.translate(translateX + shiftX, translateY));
        this.collapseAllGroup
            .attr("transform", SVGManipulations.translate(ganttDiv.scrollLeft, ganttDiv.scrollTop));
        this.lineGroup
            .attr("transform", SVGManipulations.translate(ganttDiv.scrollLeft, 0));
    }

    private getMilestoneLineLength(numOfTasks: number): number {
        return numOfTasks * ((this.formattingSettings.taskConfig.height.value || DefaultChartLineHeight) + (1 + numOfTasks) * this.getResourceLabelTopMargin() / 2);
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
        this.formattingSettings.populateDynamicDataPoints(this.viewModel, this.localizationManager, this.colorHelper);
        return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
    }
}

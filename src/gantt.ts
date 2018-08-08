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

module powerbi.extensibility.visual {
    // d3
    import Selection = d3.Selection;
    import timeScale = d3.time.Scale;
    import UpdateSelection = d3.selection.Update;

    // powerbi
    import DataView = powerbi.DataView;
    import IViewport = powerbi.IViewport;
    import VisualObjectInstance = powerbi.VisualObjectInstance;
    import DataViewCategoryColumn = powerbi.DataViewCategoryColumn;
    import VisualObjectInstanceEnumeration = powerbi.VisualObjectInstanceEnumeration;
    import DataViewObjectPropertyIdentifier = powerbi.DataViewObjectPropertyIdentifier;
    import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
    import SortDirection = powerbi.SortDirection;

    // powerbi.visuals
    import ISelectionId = powerbi.visuals.ISelectionId;

    // powerbi.extensibility
    import IColorPalette = powerbi.extensibility.IColorPalette;
    import VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;

    // powerbi.extensibility.visual
    import IVisual = powerbi.extensibility.visual.IVisual;
    import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
    import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;

    // powerbi.extensibility.utils.svg
    import SVGUtil = powerbi.extensibility.utils.svg;
    import IMargin = powerbi.extensibility.utils.svg.IMargin;
    import ClassAndSelector = powerbi.extensibility.utils.svg.CssConstants.ClassAndSelector;
    import createClassAndSelector = powerbi.extensibility.utils.svg.CssConstants.createClassAndSelector;

    // powerbi.extensibility.utils.type
    import PixelConverter = powerbi.extensibility.utils.type.PixelConverter;
    import PrimitiveType = powerbi.extensibility.utils.type.PrimitiveType;
    import ValueType = powerbi.extensibility.utils.type.ValueType;

    // powerbi.extensibility.utils.formatting
    import ValueFormatter = powerbi.extensibility.utils.formatting.valueFormatter;
    import TextProperties = powerbi.extensibility.utils.formatting.TextProperties;
    import IValueFormatter = powerbi.extensibility.utils.formatting.IValueFormatter;
    import textMeasurementService = powerbi.extensibility.utils.formatting.textMeasurementService;

    // powerbi.extensibility.utils.interactivity
    import appendClearCatcher = powerbi.extensibility.utils.interactivity.appendClearCatcher;
    import IInteractivityService = powerbi.extensibility.utils.interactivity.IInteractivityService;
    import createInteractivityService = powerbi.extensibility.utils.interactivity.createInteractivityService;
    import IInteractiveBehavior = powerbi.extensibility.utils.interactivity.IInteractiveBehavior;

    // powerbi.extensibility.utils.tooltip
    import TooltipEventArgs = powerbi.extensibility.utils.tooltip.TooltipEventArgs;
    import ITooltipServiceWrapper = powerbi.extensibility.utils.tooltip.ITooltipServiceWrapper;
    import TooltipEnabledDataPoint = powerbi.extensibility.utils.tooltip.TooltipEnabledDataPoint;
    import createTooltipServiceWrapper = powerbi.extensibility.utils.tooltip.createTooltipServiceWrapper;

    // powerbi.extensibility.utils.color
    import ColorHelper = powerbi.extensibility.utils.color.ColorHelper;

    // powerbi.extensibility.utils.chart
    import AxisHelper = powerbi.extensibility.utils.chart.axis;
    import axisScale = powerbi.extensibility.utils.chart.axis.scale;
    import IAxisProperties = powerbi.extensibility.utils.chart.axis.IAxisProperties;
    import OpacityLegendBehavior = powerbi.extensibility.utils.chart.legend.OpacityLegendBehavior;

    // powerbi.extensibility.utils.chart.legend
    import createLegend = powerbi.extensibility.utils.chart.legend.createLegend;
    import ILegend = powerbi.extensibility.utils.chart.legend.ILegend;
    import Legend = powerbi.extensibility.utils.chart.legend;
    import LegendData = powerbi.extensibility.utils.chart.legend.LegendData;
    import LegendDataPoint = powerbi.extensibility.utils.chart.legend.LegendDataPoint;
    import LegendIcon = powerbi.extensibility.utils.chart.legend.LegendIcon;
    import LegendPosition = powerbi.extensibility.utils.chart.legend.LegendPosition;

    // behavior
    import Behavior = behavior.Behavior;
    import BehaviorOptions = behavior.BehaviorOptions;

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
        Right = <any>"Right"
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
        export const TaskProgress: ClassAndSelector = createClassAndSelector("task-progress");
        export const TaskDaysOff: ClassAndSelector = createClassAndSelector("task-days-off");
        export const TaskResource: ClassAndSelector = createClassAndSelector("task-resource");
        export const TaskLabels: ClassAndSelector = createClassAndSelector("task-labels");
        export const TaskLines: ClassAndSelector = createClassAndSelector("task-lines");
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

        private static CollapsedTasksPropertyIdentifier: DataViewObjectPropertyIdentifier = {
            objectName: "collapsedTasks",
            propertyName: "list"
        };

        public static DefaultValues = {
            AxisTickSize: 6,
            ProgressBarHeight: 4,
            ResourceWidth: 100,
            TaskColor: "#00B099",
            TaskLineWidth: 15,
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

        private static DefaultTicksLength: number = 50;
        private static DefaultDuration: number = 250;
        private static TaskLineCoordinateX: number = 15;
        private static AxisLabelClip: number = 20;
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
        private static SubtasksLeftMargin: number = 15;

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
        private interactivityService: IInteractivityService;
        private tooltipServiceWrapper: ITooltipServiceWrapper;
        private host: IVisualHost;
        private localizationManager: ILocalizationManager;
        private isInteractiveChart: boolean = false;
        private groupTasksPrevValue: boolean = false;
        private collapsedTasks: string[] = [];
        private collapseAllImageConsts = {
            plusIconEncoded: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAQAAAC1+jfqAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAAmJLR0QAAKqNIzIAAAAHdElNRQfhCRgNBR9x1hVlAAAAZklEQVQoz6WR3Q2AIAyEP4gJIzFol8JthAXOFw0RSzDx+tS/u+YKCaMiJypGAnObdxhURMZDRtSAgIAPQRxKhfIsjAyvLLJAHygIXXvqQkuG/zdsQ76vJByjGkythvbhWQnjmL/7BMyHUN2Uh8qLAAAALnpUWHRkYXRlOmNyZWF0ZQAAeNozMjA01zWw1DUyCTE0tjIwtTI21DYwsDIwAABB+AUOvqcMLQAAAC56VFh0ZGF0ZTptb2RpZnkAAHjaMzIwNNc1sNQ1MgkxNLYyMLUyNtQ2MLAyMAAAQfgFDpeYpKUAAAAASUVORK5CYII=",
            minusIconEncoded: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAQAAAC1+jfqAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAAmJLR0QAAKqNIzIAAAAHdElNRQfhCQ8HBA+1I96wAAAAZ0lEQVQoz7WRUQqAIBBEn+FNoi/PI57OA0RnEQ8Q3UTWPoIQVCyitz/LMLsMDBgCQm6MEDCKwMJGokZj2UHw9PDIhGpeXyTUxIDvBn1vK3OhH7jXH9xfIR8YcpGjTpg1EQvdsiKjuk9mWyyGmWOVywAAAC56VFh0ZGF0ZTpjcmVhdGUAAHjaMzIwNNc1sNQ1NA0xMLcyMLEyNNU2MLAyMAAAQh8FEgMJQNYAAAAuelRYdGRhdGU6bW9kaWZ5AAB42jMyMDTXNbDUNTQNMTC3MjCxMjTVNjCwMjAAAEIfBRIqNuheAAAAAElFTkSuQmCC",
            collapseAllFlag: "data-is-collapsed",
        };
        private parentLabelOffset: number = 5;
        private groupLabelSize: number = 16;
        private secondExpandAllIconOffset: number = 7;

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

            this.collapseAllGroup = this.ganttSvg
                .append("g")
                .classed(Selectors.CollapseAll.className, true);

            this.collapseAllGroup
                .append("rect")
                .attr("width", 110)
                .attr("fill", axisBackgroundColor);

            // create task lines container
            this.lineGroup = this.ganttSvg
                .append("g")
                .classed(Selectors.TaskLines.className, true);

            this.lineGroupWrapper = this.lineGroup
                .append("rect")
                .attr("height", "100%")
                .attr("fill", axisBackgroundColor);

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
                        .attr("transform", SVGUtil.translate(taskLabelsWidth + self.margin.left, Gantt.TaskLabelsMarginTop + this.scrollTop));
                    self.lineGroup
                        .attr("transform", SVGUtil.translate(this.scrollLeft, self.margin.top))
                        .attr("height", 20);
                }
            }, false);
        }

        /**
         * Clear the viewport area
         */
        private clearViewport(): void {
            this.ganttDiv
                .style({
                    height: 0,
                    width: 0
                });

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
                .style({
                    height: PixelConverter.toString(this.viewport.height),
                    width: PixelConverter.toString(this.viewport.width)
                });
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

            if (task.end && !isNaN(task.end.getDate())) {
                tooltipDataArray.push({
                    displayName: localizationManager.getDisplayName("Role_EndDate"),
                    value: formatters.startDateFormatter.format(task.end)
                });
            }

            if (task.duration && !isEndDateFillled) {
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
                        icon: LegendIcon.Circle,
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

                const startDate: Date = (values.StartDate
                    && Gantt.isValidDate(values.StartDate[index] as Date) && values.StartDate[index] as Date)
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
                    parent: parent,
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
                    stepDurationTransformation
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
                            extraInformation: null,
                            daysOffList: null,
                            wasDowngradeDurationUnit: null,
                            selected: null,
                            identity: selectionBuider.createSelectionId()
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

                    task.end = durationInMilliseconds < minDurationUnitInMilliseconds ? d3.time[durationUnit].offset(task.start, task.duration) : task.end;
                } else {
                    task.end = task.end || d3.time[durationUnit].offset(task.start, task.duration);
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
                            // extra duration calculating in days
                            let extraDuration: number = task.daysOffList
                                .map((item) => item[1])
                                .reduce((prevValue, currentValue) => prevValue + currentValue);

                            extraDuration = DurationHelper.transformExtraDuration(durationUnit, extraDuration);
                            task.end = d3.time[durationUnit].offset(task.start, task.duration + extraDuration);

                            const lastDayOff: Date = task.daysOffList[task.daysOffList.length - 1][0];
                            datesDiff = Math.ceil((task.end.getTime() - lastDayOff.getTime()) / MillisecondsInADay);
                        }
                    } while (task.daysOffList.length && datesDiff - DaysInAWeekend > DaysInAWeek);
                }

                if (task.parent) {
                    task.visibility = collapsedTasks.indexOf(task.parent) === -1;
                }
            });

            tasks.forEach((task: Task) => {
                if (!task.children) {
                    task.tooltipInfo = Gantt.getTooltipInfo(task, formatters, durationUnit, localizationManager, isEndDateFillled);
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
                if (dateForCheck.getDay() === +firstDayOfWeek &&
                    (!extraCondition || (extraCondition && !/00\:00\:00/g.test(dateForCheck.toTimeString())))) {
                    daysOffDataForAddition.amountOfLastDaysOff = i;
                    daysOffDataForAddition.list.push([
                        new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0), i
                    ]);
                }
            }

            return daysOffDataForAddition;
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

            while (fromDate < toDate) {
                Gantt.addNextDaysOff(tempDaysOffData, firstDayOfWeek, fromDate);
                fromDate.setDate(fromDate.getDate() + tempDaysOffData.amountOfLastDaysOff);
            }

            Gantt.addNextDaysOff(tempDaysOffData, firstDayOfWeek, toDate, true);
            return tempDaysOffData.list;
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

            const legendData = Gantt.createLegend(host, colors, settings, taskTypes, !isDurationFilled && !isEndDateFillled);

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
                settings.taskCompletion.fill = colorHelper.getHighContrastColor("foreground", settings.taskCompletion.fill);
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
            Legend.positionChartArea(this.ganttDiv, this.legend);

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
            if (!this.viewModel || !this.viewModel.tasks || this.viewModel.tasks.length <= 0) {
                this.clearViewport();
                return;
            }

            this.viewport = _.clone(options.viewport);
            this.margin = Gantt.DefaultMargin;

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

            let startDate: Date = _.minBy(tasks, (t) => t.start).start;
            let endDate: Date = _.maxBy(tasks, (t) => t.end).end;

            if (startDate.toString() === endDate.toString()) {
                endDate = new Date(endDate.valueOf() + (24 * 60 * 60 * 1000));
            }

            let settings = this.viewModel.settings;

            let dateTypeMilliseconds: number = Gantt.getDateType(settings.dateType.type);
            let ticks: number = Math.ceil(Math.round(endDate.valueOf() - startDate.valueOf()) / dateTypeMilliseconds);
            ticks = ticks < 2 ? 2 : ticks;
            let axisLength: number = ticks * Gantt.DefaultTicksLength;

            let groupedTasks: GroupedTask[] = this.groupTasks(tasks);
            this.setDimension(groupedTasks, axisLength, settings);

            let viewportIn: IViewport = {
                height: this.viewport.height,
                width: axisLength
            };

            let xAxisProperties: IAxisProperties = this.calculateAxes(viewportIn, this.textProperties, startDate, endDate, ticks, false);
            this.timeScale = <timeScale<Date, Date>>xAxisProperties.scale;

            this.collapsedTasks = JSON.parse(settings.collapsedTasks.list);
            this.renderAxis(xAxisProperties);
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
                    interactivityService: this.interactivityService
                };

                this.interactivityService.bind(
                    tasks,
                    this.behavior,
                    behaviorOptions,
                );

                this.behavior.renderSelection(false);
            }
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

            const height = PixelConverter.toString(groupedTasks.length * (settings.taskConfig.height || DefaultChartLineHeight) + this.margin.top);
            const width = PixelConverter.toString(this.margin.left + settings.taskLabels.width + axisLength + Gantt.DefaultValues.ResourceWidth);

            this.ganttSvg
                .attr({ height, width });
        }

        private groupTasks(tasks: Task[]): GroupedTask[] {
            if (this.viewModel.settings.general.groupTasks) {
                let groupedTasks: _.Dictionary<Task[]> = _.groupBy(tasks,
                    x => (x.parent ? `${x.parent}.${x.name}` : x.name));

                let result: GroupedTask[] = _.map(groupedTasks, (x, i) => {
                    let name: string = i;
                    if (groupedTasks[i][0].parent && i.indexOf(groupedTasks[i][0].parent) !== -1) {
                        name = i.substr(groupedTasks[i][0].parent.length + 1, i.length);
                    }
                    return <GroupedTask>{
                        name,
                        tasks: groupedTasks[i]
                    };
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
            let xAxis: d3.svg.Axis = xAxisProperties.axis;
            xAxis.orient("bottom");

            this.axisGroup
                .transition()
                .duration(duration)
                .call(xAxis);

            this.axisGroup
                .selectAll("path")
                .style("stroke", axisColor); // line

            this.axisGroup
                .selectAll(".tick line")
                .style("stroke", (timestamp) => this.setTickColor(timestamp, axisColor)); // ticks

            this.axisGroup
                .selectAll(".tick text")
                .style("fill", (timestamp) => this.setTickColor(timestamp, axisTextColor)); // text
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

            let axisLabel: UpdateSelection<any>;
            let taskLabelsShow: boolean = this.viewModel.settings.taskLabels.show;
            let taskLabelsColor: string = this.viewModel.settings.taskLabels.fill;
            let taskLabelsFontSize: number = this.viewModel.settings.taskLabels.fontSize;
            let taskLabelsWidth: number = this.viewModel.settings.taskLabels.width;
            const categoriesAreaBackgroundColor: string = this.colorHelper.getThemeColor();

            if (taskLabelsShow) {
                this.lineGroupWrapper
                    .attr("width", taskLabelsWidth)
                    .attr("fill", categoriesAreaBackgroundColor);

                this.lineGroup
                    .selectAll(Selectors.Label.selectorName)
                    .remove();

                axisLabel = this.lineGroup
                    .selectAll(Selectors.Label.selectorName)
                    .data(tasks);

                let axisLabelGroup = axisLabel
                    .enter()
                    .append("g")
                    .classed(Selectors.Label.className, true)
                    .attr({
                        transform: (task: GroupedTask) => SVGUtil.translate(0, this.getTaskLabelCoordinateY(task.id))
                    });

                axisLabelGroup
                    .append("text")
                    .attr({
                        x: (task: GroupedTask) => (Gantt.TaskLineCoordinateX +
                            (_.every(task.tasks, (task: Task) => !!task.parent)
                                ? Gantt.SubtasksLeftMargin
                                : (task.tasks[0].children && !!task.tasks[0].children.length) ? this.parentLabelOffset : 0)),
                        fill: taskLabelsColor,
                        "stroke-width": Gantt.AxisLabelStrokeWidth
                    })
                    .style("font-size", PixelConverter.fromPoint(taskLabelsFontSize))
                    .text((task: GroupedTask) => task.name)
                    .call(AxisHelper.LabelLayoutStrategy.clip, width - Gantt.AxisLabelClip, textMeasurementService.svgEllipsis)
                    .append("title")
                    .text((task: GroupedTask) => task.name);

                axisLabelGroup
                    .filter((task: GroupedTask) => task.tasks[0].children && !!task.tasks[0].children.length)
                    .append("image")
                    .attr({
                        "xlink:href": (task: GroupedTask) => (!task.tasks[0].children[0].visibility ? this.collapseAllImageConsts.plusIconEncoded : this.collapseAllImageConsts.minusIconEncoded),
                        width: this.groupLabelSize,
                        height: this.groupLabelSize,
                        y: -12,
                    });

                axisLabel
                    .exit()
                    .remove();

                this.collapseAllGroup
                    .selectAll("image")
                    .remove();

                this.collapseAllGroup
                    .selectAll("rect")
                    .remove();

                if (this.viewModel.isParentFilled) {
                    this.collapseAllGroup
                        .append("image")
                        .classed(Selectors.CollapseAllArrow.className, true)
                        .attr({
                            "xlink:href": (this.collapsedTasks.length ? this.collapseAllImageConsts.plusIconEncoded : this.collapseAllImageConsts.minusIconEncoded),
                            width: this.groupLabelSize,
                            height: this.groupLabelSize
                        })
                        .attr(this.collapseAllImageConsts.collapseAllFlag, (this.collapsedTasks.length ? "1" : "0"));

                    this.collapseAllGroup
                        .append("rect")
                        .attr({
                            width: this.groupLabelSize,
                            height: this.groupLabelSize,
                            x: this.secondExpandAllIconOffset,
                            y: this.secondExpandAllIconOffset,
                            fill: categoriesAreaBackgroundColor
                        });
                    this.collapseAllGroup
                        .append("image")
                        .classed(Selectors.CollapseAllArrow.className, true)
                        .attr({
                            "xlink:href": (this.collapsedTasks.length ? this.collapseAllImageConsts.plusIconEncoded : this.collapseAllImageConsts.minusIconEncoded),
                            width: this.groupLabelSize,
                            height: this.groupLabelSize,
                            x: this.secondExpandAllIconOffset,
                            y: this.secondExpandAllIconOffset
                        })
                        .attr(this.collapseAllImageConsts.collapseAllFlag, (this.collapsedTasks.length ? "1" : "0"));
                }

            } else {
                this.lineGroupWrapper
                    .attr("fill", "transparent");

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
                collapsedAllSelector.attr("xlink:href", this.collapseAllImageConsts.minusIconEncoded);

            } else {
                collapsedAllSelector.attr(this.collapseAllImageConsts.collapseAllFlag, "1");
                collapsedAllSelector.attr("xlink:href", this.collapseAllImageConsts.plusIconEncoded);
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

        /**
         * Render tasks
         * @param groupedTasks Grouped tasks
         */
        private renderTasks(groupedTasks: GroupedTask[]): void {
            let taskConfigHeight: number = this.viewModel.settings.taskConfig.height || DefaultChartLineHeight;
            let taskGroupSelection: UpdateSelection<any> = this.taskGroup
                .selectAll(Selectors.TaskGroup.selectorName)
                .data(groupedTasks);

            // render task group container
            taskGroupSelection
                .enter()
                .append("g")
                .classed(Selectors.TaskGroup.className, true);

            let taskSelection: UpdateSelection<Task> = this.taskSelectionRectRender(taskGroupSelection);
            this.taskMainRectRender(taskSelection, taskConfigHeight);

            this.taskProgressRender(taskSelection, taskConfigHeight);
            this.taskResourceRender(taskSelection, taskConfigHeight);
            this.taskDaysOffRender(taskSelection, taskConfigHeight);

            this.renderTooltip(taskSelection);

            taskSelection
                .exit()
                .remove();

            taskGroupSelection
                .exit()
                .remove();
        }

        /**
         * Remove all by selector
         * @param taskSelection Task Selection
         * @param selector Selector name
         */
        private removeBySelectors(
            taskSelection: UpdateSelection<Task>,
            selector: string
        ): void {

            taskSelection
                .selectAll(Selectors[selector].selector)
                .remove();
        }

        /**
         * Render task progress rect
         * @param taskGroupSelection Task Group Selection
         */
        private taskSelectionRectRender(taskGroupSelection: UpdateSelection<any>) {
            let taskSelection: UpdateSelection<Task> = taskGroupSelection
                .selectAll(Selectors.SingleTask.selectorName)
                .data((d: GroupedTask) => d.tasks);

            taskSelection
                .enter()
                .append("g")
                .classed(Selectors.SingleTask.className, true);

            return taskSelection;
        }

        /**
         * Render task progress rect
         * @param taskSelection Task Selection
         * @param taskConfigHeight Task heights from settings
         */
        private taskMainRectRender(
            taskSelection: UpdateSelection<Task>,
            taskConfigHeight: number): void {
            const highContrastModeTaskRectStroke: number = 1;
            let taskRect: UpdateSelection<Task> = taskSelection
                .selectAll(Selectors.TaskRect.selectorName)
                .data((d: Task) => [d]);

            taskRect
                .enter()
                .append("rect")
                .classed(Selectors.TaskRect.className, true);

            taskRect
                .attr({
                    x: (task: Task) => this.timeScale(task.start),
                    y: (task: Task) => Gantt.getBarYCoordinate(task.id, taskConfigHeight),
                    width: (task: Task) => this.taskDurationToWidth(task.start, task.end),
                    height: () => Gantt.getBarHeight(taskConfigHeight)
                })
                .style("fill", (task: Task) => task.color);

            if (this.colorHelper.isHighContrast) {
                taskRect
                    .style({
                        "stroke": (task: Task) => this.colorHelper.getHighContrastColor("foreground", task.color),
                        "stroke-width": highContrastModeTaskRectStroke
                    });
            }

            taskRect
                .exit()
                .remove();
        }

        /**
         * Render days off rects
         * @param taskSelection Task Selection
         * @param taskConfigHeight Task heights from settings
         */
        private taskDaysOffRender(
            taskSelection: UpdateSelection<Task>,
            taskConfigHeight: number): void {

            const taskDaysOffColor: string = this.viewModel.settings.daysOff.fill;
            const taskDaysOffShow: boolean = this.viewModel.settings.daysOff.show;

            if (taskDaysOffShow) {
                let tasksDaysOff: UpdateSelection<TaskDaysOff> = taskSelection
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

                tasksDaysOff
                    .enter()
                    .append("rect")
                    .classed(Selectors.TaskDaysOff.className, true);

                tasksDaysOff
                    .attr({
                        x: (task: TaskDaysOff) => this.timeScale(task.daysOff[0]),
                        y: (task: TaskDaysOff) => Gantt.getBarYCoordinate(task.id, taskConfigHeight),
                        width: (task: TaskDaysOff) => {
                            const startDate: Date = task.daysOff[0];
                            const startTime: number = startDate.getTime();
                            const endDate: Date = new Date(startTime + (task.daysOff[1] * MillisecondsInADay));

                            return this.taskDurationToWidth(startDate, endDate);
                        },
                        height: Gantt.getBarHeight(taskConfigHeight)
                    })
                    .style("fill", taskDaysOffColor);

                tasksDaysOff
                    .exit()
                    .remove();

            } else {
                this.removeBySelectors(taskSelection, "TaskDaysOff");
            }
        }

        /**
         * Render task progress rect
         * @param taskSelection Task Selection
         * @param taskConfigHeight Task heights from settings
         */
        private taskProgressRender(
            taskSelection: UpdateSelection<Task>,
            taskConfigHeight: number): void {

            let taskProgressColor: string = this.viewModel.settings.taskCompletion.fill;
            let taskProgressShow: boolean = this.viewModel.settings.taskCompletion.show;

            if (taskProgressShow) {
                let taskProgress: UpdateSelection<Task> = taskSelection
                    .selectAll(Selectors.TaskProgress.selectorName)
                    .data((d: Task) => [d]);

                taskProgress
                    .enter()
                    .append("rect")
                    .classed(Selectors.TaskProgress.className, true);

                taskProgress
                    .attr({
                        x: (task: Task) => this.timeScale(task.start),
                        y: (task: Task) => Gantt.getBarYCoordinate(task.id, taskConfigHeight)
                            + Gantt.getBarHeight(taskConfigHeight) / 2 - Gantt.DefaultValues.ProgressBarHeight / 2,
                        width: (task: Task) => this.setTaskProgress(task),
                        height: Gantt.DefaultValues.ProgressBarHeight
                    })
                    .style("fill", taskProgressColor);

                taskProgress
                    .exit()
                    .remove();
            } else {
                this.removeBySelectors(taskSelection, "TaskProgress");
            }
        }

        /**
         * Render task resource labels
         * @param taskSelection Task Selection
         * @param taskConfigHeight Task heights from settings
         */
        private taskResourceRender(
            taskSelection: UpdateSelection<Task>,
            taskConfigHeight: number): void {

            const groupTasks: boolean = this.viewModel.settings.general.groupTasks;
            let newLabelPosition: ResourceLabelPositions | null = null;
            if (groupTasks && !this.groupTasksPrevValue) {
                newLabelPosition = ResourceLabelPositions.Top;
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
                let taskResource: UpdateSelection<Task> = taskSelection
                    .selectAll(Selectors.TaskResource.selectorName)
                    .data((d: Task) => [d]);

                taskResource
                    .enter()
                    .append("text")
                    .classed(Selectors.TaskResource.className, true);

                taskResource
                    .attr({
                        x: (task: Task) => this.getResourceLabelXCoordinate(task, taskResourceFontSize, taskResourcePosition),
                        y: (task: Task) => Gantt.getBarYCoordinate(task.id, taskConfigHeight)
                            + Gantt.getResourceLabelYOffset(taskConfigHeight, taskResourceFontSize, taskResourcePosition)
                    })
                    .text((task: Task) => task.resource)
                    .style({
                        fill: taskResourceColor,
                        "font-size": PixelConverter.fromPoint(taskResourceFontSize)
                    });

                let self: Gantt = this;
                const defaultWidth: number = Gantt.DefaultValues.ResourceWidth - Gantt.ResourceWidthPadding;

                if (taskResourceWidthByTask) {
                    taskResource
                        .each(function (task: Task, index: number, outerIndex: number) {
                            const width: number = self.taskDurationToWidth(task.start, task.end);
                            AxisHelper.LabelLayoutStrategy.clip(d3.select(this), width, textMeasurementService.svgEllipsis);
                        });
                } else if (isGroupedByTaskName) {
                    taskResource
                        .each(function (task: Task, index: number, outerIndex: number) {
                            const sameRowNextTaskStart: Date = self.getSameRowNextTaskStartDate(task, outerIndex, taskResource);

                            if (sameRowNextTaskStart) {
                                const startDate: Date = taskResourcePosition === ResourceLabelPositions.Top ? task.start : task.end,
                                    width: number = self.taskDurationToWidth(startDate, sameRowNextTaskStart);

                                AxisHelper.LabelLayoutStrategy.clip(d3.select(this), width, textMeasurementService.svgEllipsis);
                            } else {
                                if (!taskResourceFullText) {
                                    AxisHelper.LabelLayoutStrategy.clip(d3.select(this), defaultWidth, textMeasurementService.svgEllipsis);
                                }
                            }
                        });
                } else if (!taskResourceFullText) {
                    taskResource
                        .each(function (task: Task, index: number, outerIndex: number) {
                            AxisHelper.LabelLayoutStrategy.clip(d3.select(this), defaultWidth, textMeasurementService.svgEllipsis);
                        });
                }

                taskResource
                    .exit()
                    .remove();
            } else {
                this.removeBySelectors(taskSelection, "TaskResource");
            }
        }

        private getSameRowNextTaskStartDate(task: Task, index: number, selection: UpdateSelection<Task>) {
            let sameRowNextTaskStart: Date;

            selection
                .each(function (x: Task, y: number, i: number) {
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
            }
        }

        private getResourceLabelXCoordinate(
            task: Task,
            taskResourceFontSize: number,
            taskResourcePosition: ResourceLabelPositions): number {
            switch (taskResourcePosition) {
                case ResourceLabelPositions.Right:
                    return this.timeScale(task.end) + (taskResourceFontSize / 2);
                case ResourceLabelPositions.Top:
                    return this.timeScale(task.start);
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
         * Get width of days off rect for progress
         * @param task All task attributes
         * @param durationUnit unit Duration unit
         */
        private getDaysOffWidthForProgress(
            task: Task,
            durationUnit: string): number {
            let daysOffDuration: number = 0;
            let widthOfOneTick: number = 0;

            if (task.daysOffList &&
                task.daysOffList.length) {
                const startTime: number = task.start.getTime();
                const nextTickAfterStart: Date = d3.time[durationUnit].offset(task.start, 1);

                const progressLength: number = (task.end.getTime() - startTime) * task.completion;
                const currentProgressTime: number = new Date(startTime + progressLength).getTime();

                let daysOffFiltered: DayOffData[] = task.daysOffList
                    .filter((date) => startTime <= date[0].getTime() && date[0].getTime() <= currentProgressTime);

                if (daysOffFiltered.length) {
                    daysOffDuration = daysOffFiltered
                        .map(i => i[1])
                        .reduce((i, j) => i + j);
                }

                widthOfOneTick = this.taskDurationToWidth(task.start, nextTickAfterStart);
            }

            return widthOfOneTick * DurationHelper.transformExtraDuration(durationUnit, daysOffDuration);
        }

        /**
         * Set the task progress bar in the gantt
         * @param task All task attributes
         */
        private setTaskProgress(task: Task): number {
            let daysOffWidth: number = 0;
            let end: Date = task.end;
            if (this.viewModel.settings.daysOff.show) {
                let durationUnit: string = this.viewModel.settings.general.durationUnit;
                if (task.wasDowngradeDurationUnit) {
                    durationUnit = DurationHelper.downgradeDurationUnit(durationUnit, task.duration);
                }

                daysOffWidth = this.getDaysOffWidthForProgress(task, durationUnit);
                end = !this.viewModel.isDurationFilled ? task.end : d3.time[durationUnit].offset(task.start, task.duration);
            }

            return (this.taskDurationToWidth(task.start, end) * task.completion) + daysOffWidth;
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
         * convert task duration to width in the time scale
         * @param start The start of task to convert
         * @param end The end of task to convert
         */
        private taskDurationToWidth(
            start: Date,
            end: Date): number {
            return this.timeScale(end) - this.timeScale(start);
        }

        private getTooltipForMilstoneLine(
            timestamp: number,
            milestoneTitle: string | LabelsForDateTypes): VisualTooltipDataItem[] {
            let dateTime: string = new Date(timestamp).toLocaleDateString();

            if (!milestoneTitle) {
                switch (this.viewModel.settings.dateType.type) {
                    case DateTypes.Second:
                    case DateTypes.Minute:
                    case DateTypes.Hour:
                        milestoneTitle = this.localizationManager.getDisplayName("Visual_Label_Now");
                        dateTime = new Date(timestamp).toLocaleString();
                        break;
                    default:
                        milestoneTitle = this.localizationManager.getDisplayName("Visual_Label_Today");
                }
            }

            return [{
                displayName: <string>milestoneTitle,
                value: dateTime
            }];
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

            let todayColor: string = this.viewModel.settings.dateType.todayColor;
            let line: Line[] = [{
                x1: this.timeScale(new Date(timestamp)),
                y1: Gantt.MilestoneTop,
                x2: this.timeScale(new Date(timestamp)),
                y2: this.getMilestoneLineLength(tasks.length),
                tooltipInfo: this.getTooltipForMilstoneLine(timestamp, milestoneTitle)
            }];

            let chartLineSelection: UpdateSelection<Line> = this.chartGroup
                .selectAll(Selectors.ChartLine.selectorName)
                .data(line);

            chartLineSelection
                .enter()
                .append("line")
                .classed(Selectors.ChartLine.className, true);

            chartLineSelection
                .attr({
                    x1: (line: Line) => line.x1,
                    y1: (line: Line) => line.y1,
                    x2: (line: Line) => line.x2,
                    y2: (line: Line) => line.y2
                })
                .style("stroke", todayColor);

            this.renderTooltip(chartLineSelection);

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

        private renderTooltip(selection: Selection<Line | Task>): void {
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

            let translateXValue = taskLabelsWidth + margin.left;
            this.chartGroup
                .attr("transform", SVGUtil.translate(translateXValue, margin.top));

            let translateYValue = Gantt.TaskLabelsMarginTop + (this.ganttDiv.node() as SVGSVGElement).scrollTop;
            this.axisGroup
                .attr("transform", SVGUtil.translate(translateXValue, translateYValue));

            translateXValue = (this.ganttDiv.node() as SVGSVGElement).scrollLeft;
            this.lineGroup
                .attr("transform", SVGUtil.translate(translateXValue, margin.top));
            this.collapseAllGroup
                .attr("transform", SVGUtil.translate(translateXValue, margin.top / 4));
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
            if (options.objectName === Gantt.LegendPropertyIdentifier.objectName) {
                this.enumerateLegend(instanceEnumeration);
            }

            if (options.objectName === Gantt.CollapsedTasksPropertyIdentifier.objectName) {
                return;
            }

            return instanceEnumeration || [];
        }

        private enumerateLegend(instanceEnumeration: VisualObjectInstanceEnumeration): VisualObjectInstance[] {
            if (!this.viewModel.isDurationFilled) {
                return;
            }

            const dataPoints: LegendDataPoint[] = this.viewModel && this.viewModel.legendData.dataPoints;
            if (!dataPoints || !(dataPoints.length > 0)) {
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
}

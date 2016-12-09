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
    import UpdateSelection = d3.selection.Update;

    // powerbi
    import DataView = powerbi.DataView;
    import IViewport = powerbi.IViewport;
    import DataViewObjects = powerbi.DataViewObjects;
    import DataViewValueColumn = powerbi.DataViewValueColumn;
    import VisualObjectInstance = powerbi.VisualObjectInstance;
    import DataViewCategoryColumn = powerbi.DataViewCategoryColumn;
    import VisualObjectInstanceEnumeration = powerbi.VisualObjectInstanceEnumeration;
    import DataViewObjectPropertyIdentifier = powerbi.DataViewObjectPropertyIdentifier;
    import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;

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
    import translate = powerbi.extensibility.utils.svg.translate;
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
    import SelectableDataPoint = powerbi.extensibility.utils.interactivity.SelectableDataPoint;
    import IInteractiveBehavior = powerbi.extensibility.utils.interactivity.IInteractiveBehavior;
    import IInteractivityService = powerbi.extensibility.utils.interactivity.IInteractivityService;
    import createInteractivityService = powerbi.extensibility.utils.interactivity.createInteractivityService;

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

    // powerbi.extensibility.utils.chart.legend
    import createLegend = powerbi.extensibility.utils.chart.legend.createLegend;
    import ILegend = powerbi.extensibility.utils.chart.legend.ILegend;
    import Legend = powerbi.extensibility.utils.chart.legend;
    import LegendData = powerbi.extensibility.utils.chart.legend.LegendData;
    import LegendIcon = powerbi.extensibility.utils.chart.legend.LegendIcon;
    import LegendPosition = powerbi.extensibility.utils.chart.legend.LegendPosition;

    import VisualDataRoleKind = powerbi.VisualDataRoleKind;
    import DataViewMetadataColumn = powerbi.DataViewMetadataColumn;
    import DataViewTableRow = powerbi.DataViewTableRow;
    import IStringResourceProvider = jsCommon.IStringResourceProvider;
    import IEnumType = powerbi.IEnumType;
    import IEnumMember = powerbi.IEnumMember;

    import timeScale = d3.time.Scale;

    const PercentFormat: string = "0.00 %;-0.00 %;0.00 %";
    const MillisecondsInADay: number = 24 * 60 * 60 * 1000;
    const MillisecondsInWeek: number = 4 * MillisecondsInADay;
    const MillisecondsInAMonth: number = 30 * MillisecondsInADay;
    const MillisecondsInAYear: number = 365 * MillisecondsInADay;
    const ChartLineHeight: number = 40;
    const PaddingTasks: number = 5;

    export interface Task extends SelectableDataPoint {
        id: number;
        name: string;
        start: Date;
        duration: number;
        completion: number;
        resource: string;
        end: Date;
        taskType: string;
        description: string;
        color: string;
        tooltipInfo: VisualTooltipDataItem[];
    }

    export interface GroupedTask {
        id: number;
        name: string;
        tasks: Task[];
    }

    export interface GanttChartFormatters {
        startDateFormatter: IValueFormatter;
        completionFormatter: IValueFormatter;
        durationFormatter: IValueFormatter;
    }

    export interface GanttViewModel {
        dataView: DataView;
        settings: IGanttSettings;
        tasks: Task[];
        series: GanttSeries[];
        legendData: LegendData;
        taskTypes: TaskTypes;
    }

    export interface GanttDataPoint extends SelectableDataPoint {
        color: string;
        value: any;
    }

    export interface GanttSeries extends SelectableDataPoint {
        tasks: Task[];
        fill: string;
        name: string;
    }

    export interface TaskTypes { /*TODO: change to more proper name*/
        types: string[];
        typeName: string;
    };

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

    interface Line {
        x1: number;
        y1: number;
        x2: number;
        y2: number;
        tooltipInfo: VisualTooltipDataItem[];
    }

    export interface GanttBehaviorOptions {
        clearCatcher: Selection<any>;
        taskSelection: Selection<any>;
        legendSelection: Selection<any>;
        interactivityService: IInteractivityService;
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
        export const TaskResource: ClassAndSelector = createClassAndSelector("task-resource");
        export const SingleMilestone: ClassAndSelector = createClassAndSelector("milestone");

        export const TaskLabels: ClassAndSelector = createClassAndSelector("task-labels");
        export const TaskLines: ClassAndSelector = createClassAndSelector("task-lines");
        export const SingleTaskLine: ClassAndSelector = createClassAndSelector("task-line");
        export const Label: ClassAndSelector = createClassAndSelector("label");
        export const LegendItems: ClassAndSelector = createClassAndSelector("legendItem");
        export const LegendTitle: ClassAndSelector = createClassAndSelector("legendTitle");
    }

    export class Gantt implements IVisual {
        private viewport: IViewport;
        private colors: IColorPalette;
        private legend: ILegend;

        private textProperties: TextProperties = {
            fontFamily: 'wf_segoe-ui_normal',
            fontSize: PixelConverter.toString(9),
        };

        public static DefaultValues = {
            AxisTickSize: 6,
            MaxTaskOpacity: 1,
            MinTaskOpacity: 0.4,
            ProgressBarHeight: 4,
            ResourceWidth: 100,
            TaskColor: "#00B099",
            TaskLineWidth: 15,
            DefaultDateType: "Week",
            DateFormatStrings: {
                Day: "MMM dd",
                Week: "MMM dd",
                Month: "MMM yyyy",
                Year: "yyyy"
            }
        };

        private static DefaultTicksLength: number = 50;
        private static DefaultDuration: number = 250;
        private static TaskLineCoordinateX: number = 15;
        private static AxisLabelClip: number = 20;
        private static AxisLabelStrokeWidth: number = 1;
        private static TaskResourcePadding: number = 4;
        private static BarHeightMargin: number = 5;
        private static ChartLineHeightDivider: number = 4;
        private static ResourceWidthPadding: number = 10;
        private static TaskLabelsMarginTop: number = 15;

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
        private axisGroup: Selection<any>;

        private chartGroup: Selection<any>;
        private taskGroup: Selection<any>;
        private lineGroup: Selection<any>;

        private clearCatcher: Selection<any>;
        private ganttDiv: Selection<any>;
        private selectionManager: ISelectionManager;
        private behavior: GanttChartBehavior;
        private interactivityService: IInteractivityService;
        private tooltipServiceWrapper: ITooltipServiceWrapper;
        private host: IVisualHost;
        private isInteractiveChart: boolean = false;

        constructor(options: VisualConstructorOptions) {
            this.init(options);
        }

        private init(options: VisualConstructorOptions): void {
            this.host = options.host;
            this.colors = options.host.colorPalette;
            this.selectionManager = options.host.createSelectionManager();
            this.body = d3.select(options.element);

            this.tooltipServiceWrapper = createTooltipServiceWrapper(
                this.host.tooltipService,
                options.element);


            this.behavior = new GanttChartBehavior();
            this.interactivityService = createInteractivityService(this.host);
            this.createViewport($(options.element));
        }

        /**
         * Create the vieport area of the gantt chart
         */
        private createViewport(element: JQuery): void {
            // create div container to the whole viewport area
            this.ganttDiv = this.body.append("div")
                .classed(Selectors.Body.class, true);

            // create container to the svg area
            this.ganttSvg = this.ganttDiv
                .append("svg")
                .classed(Selectors.ClassName.class, true);

            // create clear catcher
            this.clearCatcher = appendClearCatcher(this.ganttSvg);

            // create axis container
            this.axisGroup = this.ganttSvg
                .append("g")
                .classed(Selectors.AxisGroup.class, true);

            // create task lines container
            this.lineGroup = this.ganttSvg
                .append("g")
                .classed(Selectors.TaskLines.class, true);

            // create chart container
            this.chartGroup = this.ganttSvg
                .append("g")
                .classed(Selectors.Chart.class, true);

            // create tasks container
            this.taskGroup = this.chartGroup
                .append("g")
                .classed(Selectors.Tasks.class, true);

            // create legend container
            this.legend = createLegend(element,
                this.isInteractiveChart,
                this.interactivityService,
                true,
                LegendPosition.Top);
        }

        /**
         * Clear the viewport area
         */
        private clearViewport(): void {
            this.body.selectAll(Selectors.LegendItems.selector).remove();
            this.body.selectAll(Selectors.LegendTitle.selector).remove();
            this.axisGroup.selectAll(Selectors.AxisTick.selector).remove();
            this.axisGroup.selectAll(Selectors.Domain.selector).remove();
            this.lineGroup.selectAll("*").remove();
            this.chartGroup.selectAll(Selectors.ChartLine.selector).remove();
            this.chartGroup.selectAll(Selectors.TaskGroup.selector).remove();
            this.chartGroup.selectAll(Selectors.SingleTask.selector).remove();
        }

        /**
         * Update div container size to the whole viewport area
         * @param viewport The vieport to change it size
         */
        private updateChartSize(): void {
            this.ganttDiv.style({
                height: PixelConverter.toString(this.viewport.height),
                width: PixelConverter.toString(this.viewport.width)
            });
        }

        /**
         * Get task property from the data view
         * @param columnSource
         * @param child
         * @param propertyName The property to get
         */
        private static getTaskProperty<T>(columnSource: DataViewMetadataColumn[], child: DataViewTableRow, propertyName: string): T {
            if (!child ||
                !columnSource ||
                !(columnSource.length > 0) ||
                !columnSource[0].roles)
                return null;

            const index = columnSource.indexOf(columnSource.filter(x => x.roles[propertyName])[0]);
            return index !== -1 ? <T><any>child[index] : null;
        }

        /**
         * Check if dataView has a given role
         * @param column The dataView headers
         * @param name The role to find
         */
        private static hasRole(column: DataViewMetadataColumn, name: string) {
            const roles = column.roles;
            return roles && roles[name];
        }

        /**
        * Get the tooltip info (data display names & formated values)
        * @param task All task attributes.
        * @param formatters Formatting options for gantt attributes.
        */
        private static getTooltipInfo(task: Task, formatters: GanttChartFormatters, timeInterval: string = "Days"): VisualTooltipDataItem[] {
            let tooltipDataArray: VisualTooltipDataItem[] = [];

            if (task.taskType) {
                tooltipDataArray.push({ displayName: 'Legend', value: task.taskType });
            }

            tooltipDataArray.push({ displayName: 'Task', value: task.name });
            if (!isNaN(task.start.getDate())) {
                tooltipDataArray.push({ displayName: 'Start Date', value: formatters.startDateFormatter.format(task.start.toLocaleDateString()) });
            }

            tooltipDataArray.push({ displayName: 'Duration', value: formatters.durationFormatter.format(task.duration) + " " + timeInterval });
            tooltipDataArray.push({ displayName: 'Completion', value: formatters.completionFormatter.format(task.completion) });

            if (task.resource) {
                tooltipDataArray.push({ displayName: 'Resource', value: task.resource });
            }

            return tooltipDataArray;
        }

        /**
        * Check if task has data for task
        * @param dataView
        */
        private static isChartHasTask(dataView: DataView): boolean {
            if (dataView.table &&
                dataView.table.columns) {
                for (let column of dataView.table.columns) {
                    if (Gantt.hasRole(column, "Task")) {
                        return true;
                    }
                }
            }
            return false;
        }

        /**
         * Returns the chart formatters
         * @param dataView The data Model
         */
        private static getFormatters(dataView: DataView): GanttChartFormatters {
            if (!dataView ||
                !dataView.metadata ||
                !dataView.metadata.columns) {
                return null;
            }

            let dateFormat = "d";
            const numberFormat = "#";

            for (let dvColumn of dataView.metadata.columns) {
                if (!!dataView.categorical.categories) {
                    for (let dvCategory of dataView.categorical.categories) {
                        if (Gantt.hasRole(dvCategory.source, "StartDate"))
                            dateFormat = dvColumn.format;
                    }
                }
            }

            return <GanttChartFormatters>{
                startDateFormatter: ValueFormatter.create({ format: dateFormat }),
                durationFormatter: ValueFormatter.create({ format: numberFormat }),
                completionFormatter: ValueFormatter.create({ format: PercentFormat, value: 1, allowFormatBeautification: true })
            };
        }

        /**
        * Create task objects dataView
        * @param dataView The data Model.
        * @param formatters task attributes represented format.
        * @param series An array that holds the color data of different task groups.
        */
        private static createTasks(dataView: DataView, host: IVisualHost, formatters: GanttChartFormatters, colors: IColorPalette): Task[] {
            const metadataColumns: GanttColumns<DataViewMetadataColumn> = GanttColumns.getColumnSources(dataView);
            let columns: GanttColumns<GanttCategoricalColumns> = GanttColumns.getCategoricalColumns(dataView);

            const columnSource = dataView.table.columns;
            const colorHelper = new ColorHelper(colors, undefined);

            return dataView.table.rows.map((child: DataViewTableRow, index: number) => {
                let dateString: Date = Gantt.getTaskProperty<Date>(columnSource, child, "StartDate");

                dateString = Gantt.isValidDate(dateString) ? dateString : new Date(Date.now());

                let duration: number = Gantt.getTaskProperty<number>(columnSource, child, "Duration");

                let completionValue: number = Gantt.getTaskProperty<number>(columnSource, child, "Completion");
                let completion: number = Gantt.convertToDecimal(completionValue);
                completion = completion <= 1 ? completion : 1;

                let taskType: string = Gantt.getTaskProperty<string>(columnSource, child, "Legend");
                let tasksTypeColor: string = colorHelper.getColorForMeasure(dataView.metadata.objects, taskType);

                let identityIndex: DataViewScopeIdentity = dataView.categorical.categories[0].identity[index],
                    categoryColumn: DataViewCategoryColumn = {
                        source: {
                            displayName: null,
                            queryName: metadataColumns.Task.queryName
                        },
                        values: null,
                        identity: [identityIndex]
                    };

                const identity: ISelectionId = host.createSelectionIdBuilder()
                    .withCategory(categoryColumn, 0)
                    .withMeasure(taskType)
                    .createSelectionId();

                let task: Task = {
                    id: index,
                    name: Gantt.getTaskProperty<string>(columnSource, child, "Task"),
                    start: dateString ? dateString : new Date(Date.now()),
                    duration: duration > 0 ? duration : 1,
                    end: null,
                    completion: completion > 0 ? completion : 0,
                    resource: Gantt.getTaskProperty<string>(columnSource, child, "Resource"),
                    taskType: taskType,
                    color: tasksTypeColor ? tasksTypeColor : Gantt.DefaultValues.TaskColor, /* get color by task type  */
                    tooltipInfo: null,
                    description: "",
                    identity: identity,
                    selected: false
                };

                task.end = d3.time.day.offset(task.start, task.duration);
                task.tooltipInfo = Gantt.getTooltipInfo(task, formatters);

                return task;
            });
        }

        /**
         * Create the gantt tasks series based on all task types
         * @param taskTypes All unique types from the tasks array.
         */
        private static createSeries(dataView: DataView, host: IVisualHost, tasks: Task[], colors: IColorPalette): GanttSeries[] {
            let colorHelper: ColorHelper = new ColorHelper(colors, undefined);
            let taskGroup: _.Dictionary<Task[]> = _.groupBy(tasks, t => t.taskType);
            let taskTypes = Gantt.getAllTasksTypes(dataView);

            let series: GanttSeries[] = _.map(taskTypes.types, type => {
                return {
                    tasks: taskGroup[type],
                    fill: colorHelper.getColorForMeasure(dataView.metadata.objects, type),
                    name: type,
                    identity: host
                        .createSelectionIdBuilder()
                        .withMeasure(type)
                        .createSelectionId(),
                    selected: false
                };
            });

            return series;
        }

        /**
        * Convert the dataView to view model
        * @param dataView The data Model
        */
        public static converter(dataView: DataView, host: IVisualHost, colors: IColorPalette): GanttViewModel {
            if (!dataView
                || !dataView.categorical
                || !Gantt.isChartHasTask(dataView)
                || dataView.table.rows.length === 0) {
                return null;
            }

            const settings: IGanttSettings = GanttSettings.parse(dataView.metadata.objects, colors);
            const taskTypes: TaskTypes = Gantt.getAllTasksTypes(dataView);

            const legendData: LegendData = {
                fontSize: settings.legend.fontSize,
                dataPoints: [],
                title: settings.legend.showTitle ? (settings.legend.titleText || taskTypes.typeName) : null,
                labelColor: settings.legend.labelColor
            };

            let colorHelper = new ColorHelper(colors, undefined);
            legendData.dataPoints = _.map(taskTypes.types, (type: string) => {
                return {
                    label: type,
                    color: colorHelper.getColorForMeasure(dataView.metadata.objects, type),
                    icon: LegendIcon.Circle,
                    selected: false,
                    identity: host.createSelectionIdBuilder()
                        .withMeasure(type)
                        .createSelectionId()
                };
            });

            const formatters: GanttChartFormatters = this.getFormatters(dataView);

            const tasks: Task[] = Gantt.createTasks(dataView, host, formatters, colors);
            const series: GanttSeries[] = Gantt.createSeries(dataView, host, tasks, colors);

            const viewModel: GanttViewModel = {
                dataView: dataView,
                settings: settings,
                tasks: tasks,
                series: series,
                legendData: legendData,
                taskTypes: taskTypes,
            };

            return viewModel;
        }

        private static isValidDate(date: Date): boolean {
            if (Object.prototype.toString.call(date) !== "[object Date]") {
                return false;
            }
            return !isNaN(date.getTime());
        }

        private static convertToDecimal(value: number): number {
            if (!((value >= 0) && (value <= 1))) {
                return (value / 100);
            }

            return value;
        }

        /**
        * Gets all unique types from the tasks array
        * @param dataView The data model.
        */
        private static getAllTasksTypes(dataView: DataView): TaskTypes {
            let types: string[] = [];
            let groupName: string = "";
            let data: DataViewTableRow[] = dataView.table.rows;
            let index: number = _.findIndex(dataView.table.columns, col => col.roles.hasOwnProperty("Legend"));

            if (index !== -1) {
                groupName = dataView.table.columns[index].displayName;
                types = <string[]>_.uniqBy(data, (d: DataViewTableRow) => d[index]).map((d) => d[index]);
            }

            let taskTypes: TaskTypes = {
                typeName: groupName,
                types: types
            };

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
            if (!options.dataViews || !options.dataViews[0]) {
                this.clearViewport();
                return;
            }

            this.viewModel = Gantt.converter(options.dataViews[0], this.host, this.colors);
            if (!this.viewModel) {
                this.clearViewport();
                return;
            }

            this.viewport = _.clone(options.viewport);
            this.margin = Gantt.DefaultMargin;

            this.renderLegend();
            this.updateChartSize();

            let tasks: Task[] = this.viewModel.tasks;

            if (this.interactivityService) {
                this.interactivityService.applySelectionStateToData(tasks);
                this.interactivityService.applySelectionStateToData(this.viewModel.series);
            }

            if (tasks.length < 1) {
                return;
            }

            let tasksSortedByStartDate: Task[] = _.sortBy(tasks, (t) => t.start);
            let tasksSortedByEndDate: Task[] = _.sortBy(tasks, (t) => t.end);
            let dateTypeMilliseconds: number = Gantt.getDateType(this.viewModel.settings.dateType.type);

            let startDate: Date = tasksSortedByStartDate[0].start,
                endDate: Date = tasksSortedByEndDate[tasks.length - 1].end,
                ticks = Math.ceil(Math.round(endDate.valueOf() - startDate.valueOf()) / dateTypeMilliseconds);

            let groupedTasks: GroupedTask[] = this.groupTasks(tasks);

            ticks = (ticks === 0 || ticks === 1) ? 2 : ticks;
            let axisLength: number = ticks * Gantt.DefaultTicksLength;
            this.ganttSvg
                .attr({
                    height: PixelConverter.toString(groupedTasks.length * ChartLineHeight + this.margin.top),
                    width: PixelConverter.toString(this.margin.left + this.viewModel.settings.taskLabels.width + axisLength + Gantt.DefaultValues.ResourceWidth)
                });

            let viewportIn: IViewport = {
                height: this.viewport.height,
                width: axisLength
            };

            let xAxisProperties: IAxisProperties = this.calculateAxes(viewportIn, this.textProperties, startDate, endDate, axisLength, ticks, false);
            this.timeScale = <timeScale<Date, Date>>xAxisProperties.scale;

            this.renderAxis(xAxisProperties);
            this.renderTasks(groupedTasks);

            this.createMilestoneLine(groupedTasks);
            this.updateTaskLabels(groupedTasks, this.viewModel.settings.taskLabels.width);
            this.updateElementsPositions(this.viewport, this.margin);

            if (this.interactivityService) {
                let behaviorOptions: GanttBehaviorOptions = {
                    clearCatcher: this.clearCatcher,
                    taskSelection: this.taskGroup.selectAll(Selectors.SingleTask.selector),
                    legendSelection: this.body.selectAll(Selectors.LegendItems.selector),
                    interactivityService: this.interactivityService
                };
                this.interactivityService.bind(tasks, this.behavior, behaviorOptions);
            }
        }

        private static getDateType(type: string): number {
            switch (type) {
                case "Day":
                    return MillisecondsInADay;

                case "Week":
                    return MillisecondsInWeek;

                case "Month":
                    return MillisecondsInAMonth;

                case "Year":
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
            axisLength: number,
            ticksCount: number,
            scrollbarVisible: boolean): IAxisProperties {

            let dataTypeDatetime: ValueType = ValueType.fromPrimitiveTypeAndCategory(PrimitiveType.Date);
            let category: DataViewMetadataColumn = {
                displayName: "Start Date",
                queryName: "StartDate",
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
            let axes: IAxisProperties = this.calculateAxesProperties(viewportIn, visualOptions, axisLength, category);
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

        private calculateAxesProperties(viewportIn: IViewport, options: GanttCalculateScaleAndDomainOptions, axisLength: number, metaDataColumn: DataViewMetadataColumn): IAxisProperties {
            let xAxisProperties: IAxisProperties = AxisHelper.createAxis({
                pixelSpan: viewportIn.width,
                dataDomain: options.forcedXDomain,
                metaDataColumn: metaDataColumn,
                formatString: Gantt.DefaultValues.DateFormatStrings[this.viewModel.settings.dateType.type],
                outerPadding: 0,
                isScalar: true,
                isVertical: false,
                forcedTickCount: options.forcedTickCount,
                useTickIntervalForDisplayUnits: true,
                isCategoryAxis: true,
                getValueFn: (index, type) => {
                    return ValueFormatter.format(new Date(index),
                        Gantt.DefaultValues.DateFormatStrings[this.viewModel.settings.dateType.type]);
                },
                scaleType: options.categoryAxisScaleType,
                axisDisplayUnits: options.categoryAxisDisplayUnits,
            });

            xAxisProperties.axisLabel = metaDataColumn.displayName;
            return xAxisProperties;
        }

        private groupTasks(tasks: Task[]): GroupedTask[] {
            if (this.viewModel.settings.general.groupTasks) {
                let groupedTasks: _.Dictionary<Task[]> = _.groupBy(tasks, x => x.name);
                let result: GroupedTask[] = _.map(groupedTasks, (x, i) => <GroupedTask>{
                    name: i,
                    tasks: groupedTasks[i]
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
            let xAxis = xAxisProperties.axis;
            xAxis.orient('bottom');

            this.axisGroup
                .transition()
                .duration(duration)
                .call(xAxis);
        }

        /**
        * Update task labels and add its tooltips
        * @param tasks All tasks array
        * @param width The task label width
        */
        private updateTaskLabels(tasks: GroupedTask[], width: number): void {
            let axisLabel: UpdateSelection<any>;
            let taskLabelsShow: boolean = this.viewModel.settings.taskLabels.show;
            let taskLabelsColor: string = this.viewModel.settings.taskLabels.fill;
            let taskLabelsFontSize: number = this.viewModel.settings.taskLabels.fontSize;

            if (taskLabelsShow) {
                axisLabel = this.lineGroup.selectAll(Selectors.Label.selector).data(tasks);
                axisLabel.enter().append("text").classed(Selectors.Label.class, true);
                axisLabel.attr({
                    x: Gantt.TaskLineCoordinateX,
                    y: (task: GroupedTask, i: number) => this.getTaskLabelCoordinateY(task.id),
                    fill: taskLabelsColor,
                    "stroke-width": Gantt.AxisLabelStrokeWidth
                })
                    .style("font-size", PixelConverter.fromPoint(taskLabelsFontSize))
                    .text((task: GroupedTask) => { return task.name; });

                axisLabel.call(AxisHelper.LabelLayoutStrategy.clip, width - Gantt.AxisLabelClip, textMeasurementService.svgEllipsis);
                axisLabel.append("title").text((task: GroupedTask) => { return task.name; });
                axisLabel.exit().remove();
            }
            else {
                this.lineGroup.selectAll(Selectors.Label.selector).remove();
            }
        }

        private renderTasks(groupedTasks: GroupedTask[]): void {
            let taskGroupSelection: UpdateSelection<any> = this.taskGroup.selectAll(Selectors.TaskGroup.selector).data(groupedTasks);
            let taskProgressColor: string = this.viewModel.settings.taskCompletion.fill;
            let taskProgressShow: boolean = this.viewModel.settings.taskCompletion.show;
            let taskResourceShow: boolean = this.viewModel.settings.taskResource.show;
            let taskResourceColor: string = this.viewModel.settings.taskResource.fill;
            let taskResourceFontSize: number = this.viewModel.settings.taskResource.fontSize;

            // render task group container
            taskGroupSelection.enter().append("g").classed(Selectors.TaskGroup.class, true);

            let taskSelection: UpdateSelection<Task> = taskGroupSelection.selectAll(Selectors.SingleTask.selector).data((d: GroupedTask) => d.tasks);
            taskSelection.enter().append("g").classed(Selectors.SingleTask.class, true);

            // render task main rect
            let taskRect: UpdateSelection<Task> = taskSelection.selectAll(Selectors.TaskRect.selector).data((d: Task) => [d]);
            taskRect
                .enter()
                .append("rect")
                .classed(Selectors.TaskRect.class, true);

            taskRect
                .classed(Selectors.TaskRect.class, true)
                .attr({
                    x: (task: Task) => this.timeScale(task.start),
                    y: (task: Task) => Gantt.getBarYCoordinate(task.id),
                    width: (task: Task) => this.taskDurationToWidth(task),
                    height: () => Gantt.getBarHeight()
                }).style("fill", (task: Task) => task.color);

            taskRect.exit().remove();

            // render task progress rect
            if (taskProgressShow) {
                let taskProgress: UpdateSelection<Task> = taskSelection.selectAll(Selectors.TaskProgress.selector).data((d: Task) => [d]);
                taskProgress
                    .enter()
                    .append("rect")
                    .classed(Selectors.TaskProgress.class, true);

                taskProgress
                    .attr({
                        x: (task: Task) => this.timeScale(task.start),
                        y: (task: Task) => Gantt.getBarYCoordinate(task.id) + Gantt.getBarHeight() / 2 - Gantt.DefaultValues.ProgressBarHeight / 2,
                        width: (task: Task) => this.setTaskProgress(task),
                        height: Gantt.DefaultValues.ProgressBarHeight
                    })
                    .style("fill", taskProgressColor);

                taskProgress.exit().remove();
            }
            else {
                taskSelection.selectAll(Selectors.TaskProgress.selector).remove();
            }

            if (taskResourceShow) {
                // render task resource labels
                let taskResource: UpdateSelection<Task> = taskSelection.selectAll(Selectors.TaskResource.selector).data((d: Task) => [d]);
                taskResource
                    .enter()
                    .append("text")
                    .classed(Selectors.TaskResource.class, true);

                taskResource
                    .attr({
                        x: (task: Task) => this.timeScale(task.end) + Gantt.TaskResourcePadding,
                        y: (task: Task) => (Gantt.getBarYCoordinate(task.id) + (Gantt.getBarHeight() / 2) + Gantt.TaskResourcePadding)
                    })
                    .text((task: Task) => task.resource)
                    .style({
                        fill: taskResourceColor,
                        "font-size": PixelConverter.fromPoint(taskResourceFontSize)
                    }).call(AxisHelper.LabelLayoutStrategy.clip,
                    Gantt.DefaultValues.ResourceWidth - Gantt.ResourceWidthPadding,
                    textMeasurementService.svgEllipsis);

                taskResource.exit().remove();
            }
            else {
                taskSelection.selectAll(Selectors.TaskResource.selector).remove();
            }

            this.renderTooltip(taskSelection);
            taskSelection.exit().remove();
            taskGroupSelection.exit().remove();
        }

        public onClearSelection(): void {
            this.selectionManager.clear();
        }

        /**
         * Returns the matching Y coordinate for a given task index
         * @param taskIndex Task Number
         */
        private getTaskLabelCoordinateY(taskIndex: number): number {
            const fontSize: number = + this.viewModel.settings.taskLabels.fontSize;
            return (ChartLineHeight * taskIndex) + (Gantt.getBarHeight() + Gantt.BarHeightMargin - (ChartLineHeight - fontSize) / Gantt.ChartLineHeightDivider);
        }

        /**
         * Set the task progress bar in the gantt
         * @param task All task attributes
         */
        private setTaskProgress(task: Task): number {
            let fraction: number = task.completion / 1.0,
                progress = (this.timeScale(task.end) - this.timeScale(task.start)) * fraction;

            return progress;
        }

        /**
         * Set the task progress bar in the gantt
         * @param lineNumber Line number that represents the task number
         */
        private static getBarYCoordinate(lineNumber: number): number {
            return (ChartLineHeight * lineNumber) + (PaddingTasks);
        }

        private static getBarHeight(): number {
            return ChartLineHeight / 1.5;
        }

        /**
        * convert task duration to width in the time scale
        * @param task The task to convert
        */
        private taskDurationToWidth(task: Task): number {
            return this.timeScale(task.end) - this.timeScale(task.start);
        }

        private getTooltipForMilstoneLine(timestamp: number, milestoneTitle: string): VisualTooltipDataItem[] {
            let stringDate: string = new Date(timestamp).toDateString();
            let tooltip: VisualTooltipDataItem[] = [{ displayName: milestoneTitle, value: stringDate }];
            return tooltip;
        }

        /**
        * Create vertical dotted line that represent milestone in the time axis (by default it shows not time)
        * @param tasks All tasks array
        * @param timestamp the milestone to be shown in the time axis (default Date.now())
        */
        private createMilestoneLine(tasks: GroupedTask[], milestoneTitle: string = "Today", timestamp: number = Date.now()): void {
            let line: Line[] = [{
                x1: this.timeScale(new Date(timestamp)),
                y1: 0,
                x2: this.timeScale(new Date(timestamp)),
                y2: this.getMilestoneLineLength(tasks.length),
                tooltipInfo: this.getTooltipForMilstoneLine(timestamp, milestoneTitle)
            }];

            let chartLineSelection: UpdateSelection<Line> = this.chartGroup.selectAll(Selectors.ChartLine.selector).data(line);
            chartLineSelection.enter().append("line").classed(Selectors.ChartLine.class, true);
            chartLineSelection.attr({
                x1: (line: Line) => line.x1,
                y1: (line: Line) => line.y1,
                x2: (line: Line) => line.x2,
                y2: (line: Line) => line.y2
                // tooltipInfo: (line: Line) => line.tooltipInfo
            });

            this.renderTooltip(chartLineSelection);
            chartLineSelection.exit().remove();
        }

        private renderTooltip(selection: Selection<Line | Task>): void {
            this.tooltipServiceWrapper.addTooltip(
                selection,
                (tooltipEvent: TooltipEventArgs<TooltipEnabledDataPoint>) => {
                    return tooltipEvent.data.tooltipInfo;
                });
        }

        private updateElementsPositions(viewport: IViewport, margin: IMargin): void {
            const taskLabelsWidth: number = this.viewModel.settings.taskLabels.show ? this.viewModel.settings.taskLabels.width : 0;

            this.axisGroup.attr("transform", SVGUtil.translate(taskLabelsWidth + margin.left, Gantt.TaskLabelsMarginTop));
            this.chartGroup.attr("transform", SVGUtil.translate(taskLabelsWidth + margin.left, margin.top));
            this.lineGroup.attr("transform", SVGUtil.translate(0, margin.top));
        }

        private getMilestoneLineLength(numOfTasks: number): number {
            return numOfTasks * ChartLineHeight;
        }

        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration {
            if (!this.viewModel ||
                !this.viewModel.settings) {
                return [];
            }

            let settings: IGanttSettings = this.viewModel.settings;

            switch (options.objectName) {
                case 'general': {
                    return Gantt.enumerateGeneral(settings);
                }
                case 'legend': {
                    return Gantt.enumerateLegend(settings);
                }
                case 'taskLabels': {
                    return Gantt.enumerateTaskLabels(settings);
                }
                case 'taskCompletion': {
                    return Gantt.enumerateTaskCompletion(settings);
                }
                case 'taskResource': {
                    return Gantt.enumerateTaskResource(settings);
                }
                case 'dateType': {
                    return Gantt.enumerateDateType(settings);
                }
                default: {
                    return [];
                }
            }
        }

        private static enumerateGeneral(settings: IGanttSettings): VisualObjectInstance[] {
            const generalSettings: IGeneralSettings = settings.general,
                instances: VisualObjectInstance[] = [{
                    objectName: 'general',
                    displayName: 'General',
                    selector: null,
                    properties: {
                        groupTasks: generalSettings.groupTasks
                    }
                }];
            return instances;
        }

        private static enumerateLegend(settings: IGanttSettings): VisualObjectInstance[] {
            const legendSettings: ILegendSettings = settings.legend,
                instances: VisualObjectInstance[] = [{
                    objectName: 'legend',
                    displayName: 'Legend',
                    selector: null,
                    properties: {
                        show: legendSettings.show,
                        position: legendSettings.position,
                        showTitle: legendSettings.showTitle,
                        titleText: legendSettings.titleText,
                        labelColor: legendSettings.labelColor,
                        fontSize: legendSettings.fontSize
                    }
                }];
            return instances;
        }

        private static enumerateTaskLabels(settings: IGanttSettings): VisualObjectInstance[] {
            const taskLabelsSettings: ITaskLabelsSettings = settings.taskLabels,
                instances: VisualObjectInstance[] = [{
                    objectName: 'taskLabels',
                    displayName: 'Category Labels',
                    selector: null,
                    properties: {
                        show: taskLabelsSettings.show,
                        fill: taskLabelsSettings.fill,
                        fontSize: taskLabelsSettings.fontSize,
                        width: taskLabelsSettings.width
                    }
                }];
            return instances;
        }

        private static enumerateTaskCompletion(settings: IGanttSettings): VisualObjectInstance[] {
            const taskCompletionSettings: ITaskCompletionSettings = settings.taskCompletion,
                instances: VisualObjectInstance[] = [{
                    objectName: 'taskCompletion',
                    displayName: 'Task Completion',
                    selector: null,
                    properties: {
                        show: taskCompletionSettings.show,
                        fill: taskCompletionSettings.fill
                    }
                }];
            return instances;
        }

        private static enumerateTaskResource(settings: IGanttSettings): VisualObjectInstance[] {
            const taskResourceSettings: ITaskResourceSettings = settings.taskResource,
                instances: VisualObjectInstance[] = [{
                    objectName: 'taskResource',
                    displayName: 'Data Labels',
                    selector: null,
                    properties: {
                        show: taskResourceSettings.show,
                        fill: taskResourceSettings.fill,
                        fontSize: taskResourceSettings.fontSize
                    }
                }];
            return instances;
        }

        private static enumerateDateType(settings: IGanttSettings): VisualObjectInstance[] {
            const dateTypeSettings: IDateTypeSettings = settings.dateType,
                instances: VisualObjectInstance[] = [{
                    objectName: 'dateType',
                    displayName: 'Gantt Date Type',
                    selector: null,
                    properties: {
                        type: dateTypeSettings.type
                    }
                }];
            return instances;
        }

    }
}

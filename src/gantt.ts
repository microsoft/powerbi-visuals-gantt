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
    import IMargin = powerbi.extensibility.utils.svg.IMargin;
    import translate = powerbi.extensibility.utils.svg.translate;
    import ClassAndSelector = powerbi.extensibility.utils.svg.CssConstants.ClassAndSelector;
    import createClassAndSelector = powerbi.extensibility.utils.svg.CssConstants.createClassAndSelector;

    // powerbi.extensibility.utils.type
    import PixelConverter = powerbi.extensibility.utils.type.PixelConverter;

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

    import IStringResourceProvider = jsCommon.IStringResourceProvider;
    import IEnumType = powerbi.IEnumType;
    import IEnumMember = powerbi.IEnumMember;
    import TooltipDataItem = powerbi.visuals.TooltipDataItem;
    import LegendData = powerbi.visuals.LegendData;
    import IDataColorPalette = powerbi.IDataColorPalette;
    import ILegend = powerbi.visuals.ILegend;
    import legendPosition = powerbi.visuals.legendPosition;
    import VisualCapabilities = powerbi.VisualCapabilities;
    import VisualDataRoleKind = powerbi.VisualDataRoleKind;
    import IVisualStyle = powerbi.IVisualStyle;
    import IVisualHostServices = powerbi.IVisualHostServices;
    import VisualInitOptions = powerbi.VisualInitOptions;
    import createLegend = powerbi.visuals.createLegend;
    import LegendPosition = powerbi.visuals.LegendPosition;
    import DataViewMetadataColumn = powerbi.DataViewMetadataColumn;
    import DataViewTableRow = powerbi.DataViewTableRow;
    import SelectionId = powerbi.visuals.SelectionId;
    import LegendIcon = powerbi.visuals.LegendIcon;
    import Legend = powerbi.visuals.Legend;
    import IAxisProperties = powerbi.visuals.IAxisProperties;
    import ValueType = powerbi.ValueType;
    import PrimitiveType = powerbi.PrimitiveType;
    import NumberRange = powerbi.NumberRange;
    import AxisHelper = powerbi.visuals.AxisHelper;
    import TextMeasurementService = powerbi.TextMeasurementService;
    import TooltipManager = powerbi.visuals.TooltipManager;
    import TooltipEvent = powerbi.visuals.TooltipEvent;
    import SVGUtil = powerbi.visuals.SVGUtil;
    import ObjectEnumerationBuilder = powerbi.visuals.ObjectEnumerationBuilder;
    import ISelectionHandler = powerbi.visuals.ISelectionHandler;

    import IVisualErrorMessage = powerbi.IVisualErrorMessage;
    import axisScale = powerbi.visuals.axisScale;

    var PercentFormat: string = "0.00 %;-0.00 %;0.00 %";
    var MillisecondsInADay: number = 86400000;
    var MillisecondsInWeek: number = 604800000;
    var MillisecondsInAMonth: number = 2629746000;
    var MillisecondsInAYear: number = 31556952000;
    var ChartLineHeight: number = 40;
    var PaddingTasks: number = 5;

    export enum GanttDateType {
        Day = <any>"Day",
        Week = <any>"Week",
        Month = <any>"Month",
        Year = <any>"Year"
    }

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
        tooltipInfo: TooltipDataItem[];
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
        settings: GanttSettings;
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
        ensureXDomain?: NumberRange;
        ensureYDomain?: NumberRange;
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
        tooltipInfo: TooltipDataItem[];
    }

    module Selectors {
        export var ClassName: ClassAndSelector = createClassAndSelector("gantt");
        export var Chart: ClassAndSelector = createClassAndSelector("chart");
        export var ChartLine: ClassAndSelector = createClassAndSelector("chart-line");
        export var Body: ClassAndSelector = createClassAndSelector("gantt-body");
        export var AxisGroup: ClassAndSelector = createClassAndSelector("axis");
        export var Domain: ClassAndSelector = createClassAndSelector("domain");
        export var AxisTick: ClassAndSelector = createClassAndSelector("tick");

        export var Tasks: ClassAndSelector = createClassAndSelector("tasks");
        export var TaskGroup: ClassAndSelector = createClassAndSelector("task-group");
        export var SingleTask: ClassAndSelector = createClassAndSelector("task");
        export var TaskRect: ClassAndSelector = createClassAndSelector("task-rect");
        export var TaskProgress: ClassAndSelector = createClassAndSelector("task-progress");
        export var TaskResource: ClassAndSelector = createClassAndSelector("task-resource");
        export var SingleMilestone: ClassAndSelector = createClassAndSelector("milestone");

        export var TaskLabels: ClassAndSelector = createClassAndSelector("task-labels");
        export var TaskLines: ClassAndSelector = createClassAndSelector("task-lines");
        export var SingleTaskLine: ClassAndSelector = createClassAndSelector("task-line");
        export var Label: ClassAndSelector = createClassAndSelector("label");
        export var LegendItems: ClassAndSelector = createClassAndSelector("legendItem");
        export var LegendTitle: ClassAndSelector = createClassAndSelector("legendTitle");
    }

    export class Gantt implements IVisual {
        private viewport: IViewport;
        private colors: IDataColorPalette;
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
            DefaultDateType: <string>(<any>GanttDateType.Week),
            DateFormatStrings: {
                Day: "MMM dd",
                Week: "MMM dd",
                Month: "MMM yyyy",
                Year: "yyyy"
            }
        };

        private static get DefaultMargin(): IMargin {
            return {
                top: 50,
                right: 40,
                bottom: 40,
                left: 10
            };
        }

        private margin: IMargin = Gantt.DefaultMargin;

        private style: IVisualStyle;
        private body: Selection<any>;
        private ganttSvg: Selection<any>;
        private viewModel: GanttViewModel;
        private timeScale: D3.Scale.TimeScale;
        private axisGroup: Selection<any>;

        private chartGroup: Selection<any>;
        private taskGroup: Selection<any>;
        private lineGroup: Selection<any>;

        private clearCatcher: Selection<any>;
        private ganttDiv: Selection<any>;
        private selectionManager: SelectionManager;
        private behavior: GanttChartBehavior;
        private interactivityService: IInteractivityService;
        private hostServices: IVisualHostServices;
        private isInteractiveChart: boolean;

        public init(options: VisualInitOptions): void {
            this.viewport = _.clone(options.viewport);
            this.style = options.style;
            this.body = d3.select(options.element.get(0));

            this.hostServices = options.host;
            this.selectionManager = new SelectionManager({ hostServices: options.host });

            this.isInteractiveChart = options.interactivity && options.interactivity.isInteractiveLegend;
            this.interactivityService = createInteractivityService(this.hostServices);
            this.createViewport(options.element);
            this.updateChartSize();
            this.behavior = new GanttChartBehavior();
            this.colors = options.style.colorPalette.dataColors;
        }

        /**
         * Create the vieport area of the gantt chart
         */
        private createViewport(element: JQuery): void {
            //create div container to the whole viewport area
            this.ganttDiv = this.body.append("div")
                .classed(Selectors.Body.class, true);

            //create container to the svg area
            this.ganttSvg = this.ganttDiv
                .append("svg")
                .classed(Selectors.ClassName.class, true);

            //create clear catcher
            this.clearCatcher = appendClearCatcher(this.ganttSvg);

            //create axis container
            this.axisGroup = this.ganttSvg
                .append("g")
                .classed(Selectors.AxisGroup.class, true);

            //create task lines container
            this.lineGroup = this.ganttSvg
                .append("g")
                .classed(Selectors.TaskLines.class, true);

            //create chart container
            this.chartGroup = this.ganttSvg
                .append("g")
                .classed(Selectors.Chart.class, true);

            //create tasks container
            this.taskGroup = this.chartGroup
                .append("g")
                .classed(Selectors.Tasks.class, true);

            //create legend container
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

            var index = columnSource.indexOf(columnSource.filter(x => x.roles[propertyName])[0]);
            return index !== -1 ? <T><any>child[index] : null;
        }

        /**
         * Check if dataView has a given role
         * @param column The dataView headers
         * @param name The role to find
         */
        private static hasRole(column: DataViewMetadataColumn, name: string) {
            var roles = column.roles;
            return roles && roles[name];
        }

        /**
        * Get the tooltip info (data display names & formated values)
        * @param task All task attributes.
        * @param formatters Formatting options for gantt attributes.
        */
        private static getTooltipInfo(task: Task, formatters: GanttChartFormatters, timeInterval: string = "Days") {
            var tooltipDataArray: TooltipDataItem[] = [];

            if (task.taskType)
                tooltipDataArray.push({ displayName: Gantt.capabilities.dataRoles[0].name, value: task.taskType });

            tooltipDataArray.push({ displayName: Gantt.capabilities.dataRoles[1].name, value: task.name });
            if (!isNaN(task.start.getDate()))
                tooltipDataArray.push({ displayName: Gantt.capabilities.dataRoles[2].name, value: formatters.startDateFormatter.format(task.start.toLocaleDateString()) });

            tooltipDataArray.push({ displayName: Gantt.capabilities.dataRoles[3].name, value: formatters.durationFormatter.format(task.duration) + " " + timeInterval });
            tooltipDataArray.push({ displayName: Gantt.capabilities.dataRoles[4].name, value: formatters.completionFormatter.format(task.completion) });

            if (task.resource)
                tooltipDataArray.push({ displayName: Gantt.capabilities.dataRoles[5].name, value: task.resource });

            return tooltipDataArray;
        }

        /**
        * Check if task has data for task
        * @param dataView
        */
        private static isChartHasTask(dataView: DataView): boolean {
            if (dataView.table &&
                dataView.table.columns) {
                for (var column of dataView.table.columns) {
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
                !dataView.metadata.columns)
                return null;

            var dateFormat = "d";
            var numberFormat = "#";

            for (var dvColumn of dataView.metadata.columns) {
                if (!!dataView.categorical.categories) {
                    for (var dvCategory of dataView.categorical.categories) {
                        if (Gantt.hasRole(dvCategory.source, "StartDate"))
                            dateFormat = dvColumn.format;
                    }
                }
            }

            return <GanttChartFormatters>{
                startDateFormatter: valueFormatter.create({ format: dateFormat }),
                durationFormatter: valueFormatter.create({ format: numberFormat }),
                completionFormatter: valueFormatter.create({ format: PercentFormat, value: 1, allowFormatBeautification: true })
            };
        }

        /**
        * Create task objects dataView
        * @param dataView The data Model.
        * @param formatters task attributes represented format.
        * @param series An array that holds the color data of different task groups.
        */
        private static createTasks(dataView: DataView, formatters: GanttChartFormatters, colors: IDataColorPalette): Task[] {
            var metadataColumns = GanttColumns.getColumnSources(dataView);

            var columnSource = dataView.table.columns;
            var colorHelper = new ColorHelper(colors, undefined);

            return dataView.table.rows.map((child: DataViewTableRow, index: number) => {
                var dateString = Gantt.getTaskProperty<Date>(columnSource, child, "StartDate");

                dateString = Gantt.isValidDate(dateString) ? dateString : new Date(Date.now());

                var duration = Gantt.getTaskProperty<number>(columnSource, child, "Duration");

                var completionValue = Gantt.getTaskProperty<number>(columnSource, child, "Completion");
                var completion = Gantt.convertToDecimal(completionValue);
                completion = completion <= 1 ? completion : 1;

                var taskType = Gantt.getTaskProperty<string>(columnSource, child, "Legend");
                var tasksTypeColor: string = colorHelper.getColorForMeasure(dataView.metadata.objects, taskType);

                var identity =  SelectionId.createWithIdAndMeasureAndCategory(
                    dataView.categorical.categories[0].identity[index],
                    taskType,
                    metadataColumns.Task.queryName);

                var task: Task = {
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
        private static createSeries(objects: DataViewObjects, tasks: Task[], dataView: DataView, colors: IDataColorPalette): GanttSeries[] {
            var colorHelper = new ColorHelper(colors, undefined /*Gantt.Properties.dataPoint.fill*/);
            var taskGroup: _.Dictionary<Task[]> = _.groupBy(tasks, t => t.taskType);
            var taskTypes = Gantt.getAllTasksTypes(dataView);

            var series: GanttSeries[] = _.map(taskTypes.types, type => {
                return {
                    tasks: taskGroup[type],
                    fill: colorHelper.getColorForMeasure(objects, type),
                    name: type,
                    identity: SelectionId.createWithMeasure(type),
                    selected: false
                };
            });

            return series;
        }

        /**
        * Convert the dataView to view model
        * @param dataView The data Model
        */
        public static converter(dataView: DataView, colors: IDataColorPalette): GanttViewModel {
            if (!dataView
                || !dataView.categorical
                || !Gantt.isChartHasTask(dataView)
                || dataView.table.rows.length === 0) {
                return null;
            }

            var settings = Gantt.parseSettings(dataView, colors);
            var taskTypes = Gantt.getAllTasksTypes(dataView);

            var legendData: LegendData = {
                fontSize: settings.legend.fontSize,
                dataPoints: [],
                title: taskTypes.typeName
            };

            var colorHelper = new ColorHelper(colors, undefined /*Gantt.Properties.dataPoint.fill*/);
            legendData.dataPoints = _.map(taskTypes.types, type => {
                return {
                    label: type,
                    color: colorHelper.getColorForMeasure(dataView.metadata.objects, type),
                    icon: LegendIcon.Circle,
                    selected: false,
                    identity: SelectionId.createWithMeasure(type)
                };
            });

            var formatters: GanttChartFormatters = this.getFormatters(dataView);

            var tasks: Task[] = Gantt.createTasks(dataView, formatters, colors);
            var series = Gantt.createSeries(dataView.metadata.objects, tasks, dataView, colors);

            var viewModel: GanttViewModel = {
                dataView: dataView,
                settings: settings,
                tasks: tasks,
                series: series,
                legendData: legendData,
                taskTypes: taskTypes,
            };

            return viewModel;
        }

        private static parseSettings(dataView: DataView, colors: IDataColorPalette): GanttSettings {
            var settings = GanttSettings.parse(dataView, Gantt.capabilities);
            delete settings.taskCompletion.show;
            settings.createOriginalSettings();
            return settings;
        }

        private static isValidDate(date: Date) {
            if (Object.prototype.toString.call(date) !== "[object Date]")
                return false;
            return !isNaN(date.getTime());
        }

        private static convertToDecimal(number) {
            if (!(number >= 0 && number <= 1))
                return (number / 100);
            return number;
        }

        /**
        * Gets all unique types from the tasks array
        * @param dataView The data model.
        */
        private static getAllTasksTypes(dataView: DataView): TaskTypes {
            var types: string[] = [];
            var groupName: string = "";
            var taskTypes: TaskTypes;
            var data = dataView.table.rows;
            var index = _.findIndex(dataView.table.columns, col => col.roles.hasOwnProperty("Legend"));

            if (index !== -1) {
                groupName = dataView.table.columns[index].displayName;
                types = <string[]>_.unique(data, (d) => d[index]).map((d) => d[index]);
            }

            taskTypes = {
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

            LegendData.update(this.viewModel.legendData,
                DataViewObjects.getObject(this.viewModel.dataView.metadata.objects, "legend", {}));

            var position = this.viewModel.settings.legend.show
                ? LegendPosition[<string>this.viewModel.settings.legend.position]
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
        public update(options: VisualUpdateOptions) {
            if (!options.dataViews || !options.dataViews[0]) {
                return;
            }

            this.viewModel = Gantt.converter(options.dataViews[0], this.colors);
            if (!this.viewModel) {
                this.clearViewport();
                return;
            }

            this.viewport = _.clone(options.viewport);
            this.margin = Gantt.DefaultMargin;

            this.renderLegend();
            this.updateChartSize();

            var tasks = this.viewModel.tasks;

            if (this.interactivityService) {
                this.interactivityService.applySelectionStateToData(tasks);
                this.interactivityService.applySelectionStateToData(this.viewModel.series);
            }

            if (tasks.length > 0) {
                var tasksSortedByStartDate: Task[] = _.sortBy(tasks, (t) => t.start);
                var tasksSortedByEndDate: Task[] = _.sortBy(tasks, (t) => t.end);
                var dateTypeMilliseconds = this.getDateType();

                var startDate: Date = tasksSortedByStartDate[0].start,
                    endDate: Date = tasksSortedByEndDate[tasks.length - 1].end,
                    ticks = Math.ceil(Math.round(endDate.valueOf() - startDate.valueOf()) / dateTypeMilliseconds);

                var groupedTasks: GroupedTask[] = this.groupTasks(tasks);

                ticks = ticks === 0 || ticks === 1 ? 2 : ticks;
                var axisLength = ticks * 50;
                this.ganttSvg
                    .attr({
                        height: PixelConverter.toString(groupedTasks.length * ChartLineHeight + this.margin.top),
                        width: PixelConverter.toString(this.margin.left + this.viewModel.settings.taskLabels.width + axisLength + Gantt.DefaultValues.ResourceWidth)
                    });

                var viewportIn: IViewport = {
                    height: this.viewport.height,
                    width: axisLength
                };

                var xAxisProperties = this.calculateAxes(viewportIn, this.textProperties, startDate, endDate, axisLength, ticks, false);
                this.timeScale = <D3.Scale.TimeScale>xAxisProperties.scale;

                this.renderAxis(xAxisProperties, 200);
                this.renderTasks(groupedTasks);

                this.createMilestoneLine(groupedTasks);
                this.updateTaskLabels(groupedTasks, this.viewModel.settings.taskLabels.width);
                this.updateElementsPositions(this.viewport, this.margin);

                if (this.interactivityService) {
                    var behaviorOptions: GanttBehaviorOptions = {
                        clearCatcher: this.clearCatcher,
                        taskSelection: this.taskGroup.selectAll(Selectors.SingleTask.selector),
                        legendSelection: this.body.selectAll(Selectors.LegendItems.selector),
                        interactivityService: this.interactivityService
                    };
                    this.interactivityService.bind(tasks, this.behavior, behaviorOptions);
                }
            }
        }

        private getDateType(): number {
            var milliSeconds: number = MillisecondsInWeek;

            switch (this.viewModel.settings.dateType.type) {
                case GanttDateType.Day:
                    milliSeconds = MillisecondsInADay;
                    break;

                case GanttDateType.Week:
                    milliSeconds = MillisecondsInWeek;
                    break;

                case GanttDateType.Month:
                    milliSeconds = MillisecondsInAMonth;
                    break;

                case GanttDateType.Year:
                    milliSeconds = MillisecondsInAYear;
                    break;
            }

            return milliSeconds;
        }

        private calculateAxes(
            viewportIn: IViewport,
            textProperties: TextProperties,
            startDate: Date,
            endDate: Date,
            axisLength: number,
            ticksCount: number,
            scrollbarVisible: boolean): IAxisProperties {

            var dataTypeDatetime = ValueType.fromPrimitiveTypeAndCategory(PrimitiveType.Date);
            var category: DataViewMetadataColumn = { displayName: "StartDate", queryName: "StartDate", type: dataTypeDatetime, index: 0 };
            var visualOptions: GanttCalculateScaleAndDomainOptions = {
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

            var width = viewportIn.width;
            var axes = this.calculateAxesProperties(viewportIn, visualOptions, axisLength, category);
            axes.willLabelsFit = AxisHelper.LabelLayoutStrategy.willLabelsFit(
                axes,
                width,
                TextMeasurementService.measureSvgTextWidth,
                textProperties);

            // If labels do not fit and we are not scrolling, try word breaking
            axes.willLabelsWordBreak = (!axes.willLabelsFit && !scrollbarVisible) && AxisHelper.LabelLayoutStrategy.willLabelsWordBreak(
                axes, this.margin, width, TextMeasurementService.measureSvgTextWidth,
                TextMeasurementService.estimateSvgTextHeight, TextMeasurementService.getTailoredTextOrDefault,
                textProperties);

            return axes;
        }

        private calculateAxesProperties(viewportIn: IViewport, options: GanttCalculateScaleAndDomainOptions, axisLength: number, metaDataColumn: DataViewMetadataColumn): IAxisProperties {
            var xAxisProperties = AxisHelper.createAxis({
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
                    return valueFormatter.format(new Date(index),
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
                var groupedTasks = _.groupBy(tasks, x => x.name);
                var result: GroupedTask[] = _.map(groupedTasks, (x, i) => <GroupedTask>{
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

        private renderAxis(xAxisProperties: IAxisProperties, duration: number): void {
            var xAxis = xAxisProperties.axis;
            xAxis.orient('bottom');

            this.axisGroup.transition().duration(duration).call(xAxis);
        }
        /**
        * Update task labels and add its tooltips
        * @param tasks All tasks array
        * @param width The task label width
        */
        private updateTaskLabels(tasks: GroupedTask[], width: number): void {
            var axisLabel: UpdateSelection<any>;
            var taskLineCoordinateX: number = 15;
            var taskLabelsShow = this.viewModel ? this.viewModel.settings.taskLabels.show : true;
            var taskLabelsColor = this.viewModel ? this.viewModel.settings.taskLabels.fill : GanttSettings.Default.taskLabels.fill;
            var taskLabelsFontSize = this.viewModel ? this.viewModel.settings.taskLabels.fontSize : GanttSettings.Default.taskLabels.fontSize;

            if (taskLabelsShow) {
                axisLabel = this.lineGroup.selectAll(Selectors.Label.selector).data(tasks);
                axisLabel.enter().append("text").classed(Selectors.Label.class, true);
                axisLabel.attr({
                    x: taskLineCoordinateX,
                    y: (task: GroupedTask, i: number) => this.getTaskLabelCoordinateY(task.id),
                    fill: taskLabelsColor,
                    "stroke-width": 1
                })
                    .style("font-size", PixelConverter.fromPoint(taskLabelsFontSize))
                    .text((task: GroupedTask) => { return task.name; });

                axisLabel.call(AxisHelper.LabelLayoutStrategy.clip, width - 20, TextMeasurementService.svgEllipsis);
                axisLabel.append("title").text((task: GroupedTask) => { return task.name; });
                axisLabel.exit().remove();
            }
            else {
                this.lineGroup.selectAll(Selectors.Label.selector).remove();
            }
        }

        private renderTasks(groupedTasks: GroupedTask[]) {
            var taskGroupSelection: UpdateSelection<any> = this.taskGroup.selectAll(Selectors.TaskGroup.selector).data(groupedTasks);
            var taskProgressColor = this.viewModel ? this.viewModel.settings.taskCompletion.fill : GanttSettings.Default.taskCompletion.fill;
            var taskResourceShow = this.viewModel ? this.viewModel.settings.taskResource.show : true;
            var padding: number = 4;
            var taskResourceColor = this.viewModel ? this.viewModel.settings.taskResource.fill : GanttSettings.Default.taskResource.fill;
            var taskResourceFontSize: number = this.viewModel ? this.viewModel.settings.taskResource.fontSize : GanttSettings.Default.taskResource.fontSize;

            //render task group container
            taskGroupSelection.enter().append("g").classed(Selectors.TaskGroup.class, true);

            var taskSelection = taskGroupSelection.selectAll(Selectors.SingleTask.selector).data((d: GroupedTask) => d.tasks);
            taskSelection.enter().append("g").classed(Selectors.SingleTask.class, true);

            //render task main rect
            var taskRect = taskSelection.selectAll(Selectors.TaskRect.selector).data((d: Task) => [d]);
            taskRect.enter().append("rect").classed(Selectors.TaskRect.class, true);
            taskRect.classed(Selectors.TaskRect.class, true).attr({
                x: (task: Task) => this.timeScale(task.start),
                y: (task: Task) => this.getBarYCoordinate(task.id),
                width: (task: Task) => this.taskDurationToWidth(task),
                height: () => this.getBarHeight()
            }).style("fill", (task: Task) => task.color);
            taskRect.exit().remove();

            //render task progress rect
            var taskProgress = taskSelection.selectAll(Selectors.TaskProgress.selector).data((d: Task) => [d]);
            taskProgress.enter().append("rect").classed(Selectors.TaskProgress.class, true);
            taskProgress.attr({
                x: (task: Task) => this.timeScale(task.start),
                y: (task: Task) => this.getBarYCoordinate(task.id) + this.getBarHeight() / 2 - Gantt.DefaultValues.ProgressBarHeight / 2,
                width: (task: Task) => this.setTaskProgress(task),
                height: Gantt.DefaultValues.ProgressBarHeight
            }).style("fill", taskProgressColor);
            taskProgress.exit().remove();

            if (taskResourceShow) {
                //render task resource labels
                var taskResource = taskSelection.selectAll(Selectors.TaskResource.selector).data((d: Task) => [d]);
                taskResource.enter().append("text").classed(Selectors.TaskResource.class, true);
                taskResource.attr({
                    x: (task: Task) => this.timeScale(task.end) + padding,
                    y: (task: Task) => (this.getBarYCoordinate(task.id) + (this.getBarHeight() / 2) + padding)
                })
                    .text((task: Task) => task.resource)
                    .style({
                        fill: taskResourceColor,
                        "font-size": PixelConverter.fromPoint(taskResourceFontSize)
                    }).call(AxisHelper.LabelLayoutStrategy.clip,
                    Gantt.DefaultValues.ResourceWidth - 10,
                    TextMeasurementService.svgEllipsis);

                taskResource.exit().remove();
            }
            else {
                taskSelection.selectAll(Selectors.TaskResource.selector).remove();
            }

            TooltipManager.addTooltip(taskSelection, (tooltipEvent: TooltipEvent) => (<Task>tooltipEvent.data).tooltipInfo);
            taskSelection.exit().remove();
            taskGroupSelection.exit().remove();
        }

        public onClearSelection() {
            this.selectionManager.clear();
        }

        /**
         * Returns the matching Y coordinate for a given task index
         * @param taskIndex Task Number
         */
        private getTaskLabelCoordinateY(taskIndex: number): number {
            var fontSize: number = + this.viewModel.settings.taskLabels.fontSize;
            return (ChartLineHeight * taskIndex) + (this.getBarHeight() + 5 - (40 - fontSize) / 4);
        }

        /**
         * Set the task progress bar in the gantt
         * @param task All task attributes
         */
        private setTaskProgress(task: Task): number {
            var fraction = task.completion / 1.0,
                y = this.timeScale,
                progress = (y(task.end) - y(task.start)) * fraction;

            return progress;
        }

        /**
         * Set the task progress bar in the gantt
         * @param lineNumber Line number that represents the task number
         */
        private getBarYCoordinate(lineNumber: number): number {
            return (ChartLineHeight * lineNumber) + (PaddingTasks);
        }

        private getBarHeight(): number {
            return ChartLineHeight / 1.5;
        }

        /**
        * convert task duration to width in the time scale
        * @param task The task to convert
        */
        private taskDurationToWidth(task: Task): number {
            return this.timeScale(task.end) - this.timeScale(task.start);
        }

        private getTooltipForMilstoneLine(timestamp: number, milestoneTitle: string): TooltipDataItem[] {
            var stringDate = new Date(timestamp).toDateString();
            var tooltip: TooltipDataItem[] = [{ displayName: milestoneTitle, value: stringDate }];
            return tooltip;
        }

        /**
        * Create vertical dotted line that represent milestone in the time axis (by default it shows not time)
        * @param tasks All tasks array
        * @param timestamp the milestone to be shown in the time axis (default Date.now())
        */
        private createMilestoneLine(tasks: GroupedTask[], milestoneTitle: string = "Today", timestamp: number = Date.now()): void {
            var line: Line[] = [{
                x1: this.timeScale(timestamp),
                y1: 0,
                x2: this.timeScale(timestamp),
                y2: this.getMilestoneLineLength(tasks.length),
                tooltipInfo: this.getTooltipForMilstoneLine(timestamp, milestoneTitle)
            }];

            var chartLineSelection: UpdateSelection<any> = this.chartGroup.selectAll(Selectors.ChartLine.selector).data(line);
            chartLineSelection.enter().append("line").classed(Selectors.ChartLine.class, true);
            chartLineSelection.attr({
                x1: (line: Line) => line.x1,
                y1: (line: Line) => line.y1,
                x2: (line: Line) => line.x2,
                y2: (line: Line) => line.y2,
                tooltipInfo: (line: Line) => line.tooltipInfo
            });

            TooltipManager.addTooltip(chartLineSelection, (tooltipEvent: TooltipEvent) => (<Line>tooltipEvent.data).tooltipInfo);
            chartLineSelection.exit().remove();
        }

        private updateElementsPositions(viewport: IViewport, margin: IMargin): void {
            this.axisGroup.attr("transform", SVGUtil.translate(this.viewModel.settings.taskLabels.width + margin.left, 15));
            this.chartGroup.attr("transform", SVGUtil.translate(this.viewModel.settings.taskLabels.width + margin.left, margin.top));
            this.lineGroup.attr("transform", SVGUtil.translate(0, margin.top));
        }

        private getMilestoneLineLength(numOfTasks: number): number {
            return numOfTasks * ChartLineHeight;
        }

        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration {
            var settings = this.viewModel && this.viewModel.settings;
            if(_.isEmpty(settings)) {
                return [];
            }

            var result = GanttSettings.enumerateObjectInstances(settings.originalSettings, options, Gantt.capabilities);

            switch (options.objectName) {
                case 'general':
                    return [];
            }

            return result.complete();
        }
    }

    export interface GanttBehaviorOptions {
        clearCatcher: Selection<any>;
        taskSelection: Selection<any>;
        legendSelection: Selection<any>;
        interactivityService: IInteractivityService;
    }
}

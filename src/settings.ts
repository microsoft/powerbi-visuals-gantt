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
    import DataViewObjects = powerbi.extensibility.utils.dataview.DataViewObjects;
    import ColorHelper = powerbi.extensibility.utils.color.ColorHelper;
    import LegendPosition = powerbi.extensibility.utils.chart.legend.LegendPosition;

    export type GanttDateType = "Day" | "Week" | "Month" | "Year";

    export interface IGeneralSettings {
        groupTasks: boolean;
    }

    export interface ILegendSettings {
        show: boolean;
        position: number;
        showTitle: boolean;
        titleText: string;
        labelColor: string;
        fontSize: number;
    }

    export interface ITaskLabelsSettings {
        show: boolean;
        fill: string;
        fontSize: number;
        width: number;
    }

    export interface ITaskCompletionSettings {
        show: boolean;
        fill: string;
    }

    export interface ITaskResourceSettings {
        show: boolean;
        fill: string;
        fontSize: number;
    }

    export interface IDateTypeSettings {
        type: GanttDateType;
    }

    export interface IGanttSettings {
        general: IGeneralSettings;
        legend: ILegendSettings;
        taskLabels: ITaskLabelsSettings;
        taskCompletion: ITaskCompletionSettings;
        taskResource: ITaskResourceSettings;
        dateType: IDateTypeSettings;
    }

    export class GanttSettings {
        public static get Default() {
            return new this();
        }

        public static parse(objects: DataViewObjects, colors: IColorPalette): IGanttSettings {
            const properties = ganttProperties;

            return {
                general: this.parseGeneralSettings(objects),
                legend: this.parseLegendSettings(objects, colors),
                taskLabels: this.parseTaskLabelsSettings(objects, colors),
                taskCompletion: this.parseTaskComplectionSettings(objects, colors),
                taskResource: this.parseTaskResourceSettings(objects, colors),
                dateType: this.parseDateTypeSettings(objects)
            };
        }

        private static parseGeneralSettings(objects: DataViewObjects): IGeneralSettings {
            const properties = ganttProperties.general;
            const defaultSettings: IGeneralSettings = this.general;

            return {
                groupTasks: DataViewObjects.getValue<boolean>(objects, properties.groupTasks, defaultSettings.groupTasks)
            };
        }

        private static parseLegendSettings(objects: DataViewObjects, colors: IColorPalette): ILegendSettings {
            const properties = ganttProperties.legend;
            const defaultSettings: ILegendSettings = this.legend;

            return {
                show: DataViewObjects.getValue<boolean>(objects, properties.show, defaultSettings.show),
                position: DataViewObjects.getValue<number>(objects, properties.position, defaultSettings.position),
                showTitle: DataViewObjects.getValue<boolean>(objects, properties.showTitle, defaultSettings.showTitle),
                titleText: DataViewObjects.getValue<string>(objects, properties.titleText, defaultSettings.titleText),
                labelColor: this.getColor(objects, properties.labelColor, defaultSettings.labelColor, colors),
                fontSize: DataViewObjects.getValue<number>(objects, properties.fontSize, defaultSettings.fontSize)
            };
        }

        private static parseTaskLabelsSettings(objects: DataViewObjects, colors: IColorPalette): ITaskLabelsSettings {
            const properties = ganttProperties.taskLabels;
            const defaultSettings: ITaskLabelsSettings = this.taskLabels;

            return {
                show: DataViewObjects.getValue<boolean>(objects, properties.show, defaultSettings.show),
                fill: this.getColor(objects, properties.fill, defaultSettings.fill, colors),
                fontSize: DataViewObjects.getValue<number>(objects, properties.fontSize, defaultSettings.fontSize),
                width: DataViewObjects.getValue<number>(objects, properties.width, defaultSettings.width)
            };
        }

        private static parseTaskComplectionSettings(objects: DataViewObjects, colors: IColorPalette): ITaskCompletionSettings {
            const properties = ganttProperties.taskCompletion;
            const defaultSettings: ITaskCompletionSettings = this.taskCompletion;

            return {
                show: DataViewObjects.getValue<boolean>(objects, properties.show, defaultSettings.show),
                fill: this.getColor(objects, properties.fill, defaultSettings.fill, colors)
            };
        }

        private static parseTaskResourceSettings(objects: DataViewObjects, colors: IColorPalette): ITaskResourceSettings {
            const properties = ganttProperties.taskResource;
            const defaultSettings: ITaskResourceSettings = this.taskResource;

            return {
                show: DataViewObjects.getValue<boolean>(objects, properties.show, defaultSettings.show),
                fill: this.getColor(objects, properties.fill, defaultSettings.fill, colors),
                fontSize: DataViewObjects.getValue<number>(objects, properties.fontSize, defaultSettings.fontSize),
            };
        }

        private static parseDateTypeSettings(objects: DataViewObjects): IDateTypeSettings {
            const properties = ganttProperties.dateType;
            const defaultSettings: IDateTypeSettings = this.dateType;

            return {
                type: DataViewObjects.getValue<GanttDateType>(objects, properties.type, defaultSettings.type)
            };
        }

        private static getColor(objects: DataViewObjects, properties: any, defaultColor: string, colors: IColorPalette): string {
            let colorHelper: ColorHelper = new ColorHelper(colors, properties, defaultColor);
            return colorHelper.getColorForMeasure(objects, '');
        }

        // Default Settings
        private static general: IGeneralSettings = {
            groupTasks: false
        };

        private static legend: ILegendSettings = {
            show: true,
            position: LegendPosition.Right,
            showTitle: true,
            titleText: "",
            labelColor: "#000000",
            fontSize: 8,
        };

        private static taskLabels: ITaskLabelsSettings = {
            show: true,
            fill: "#000000",
            fontSize: 9,
            width: 110,
        };

        private static taskCompletion: ITaskCompletionSettings = {
            show: true,
            fill: "#000000",
        };

        private static taskResource: ITaskResourceSettings = {
            show: true,
            fill: "#000000",
            fontSize: 9,
        };

        private static dateType: IDateTypeSettings = {
            type: "Week"
        };
    }
}

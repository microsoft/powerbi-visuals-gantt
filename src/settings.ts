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
    //import dataLabelUtils = powerbi.extensibility.utils.chart.dataLabel;

    export class GanttSettings {
        public static get Default() {
            return new this();
        }

        public static parse(objects: DataViewObjects, colors: IColorPalette): IGanttSettings {
            let axisSettings: IAxisSettings = this.axis;
            let dataPointSettings: IDataPointSettings = this.dataPoint;
            let labelSettings: ILabelsSettings = this.labels;

            let defaultColor: string = dataPointSettings.defaultColor;
            if (_.has(objects, 'dataPoint') &&
                _.has(objects['dataPoint'], 'defaultColor')) {
                defaultColor = this.getColor(objects, ganttProperties.dataPoint.defaultColor, dataPointSettings.defaultColor, colors);
            }

            return {
                dataPoint: {
                    defaultColor: defaultColor,
                    showAllDataPoints: DataViewObjects.getValue<boolean>(objects, ganttProperties.dataPoint.showAllDataPoints, dataPointSettings.showAllDataPoints),
                },
                axis: {
                    show: DataViewObjects.getValue<boolean>(objects, ganttProperties.axis.show, axisSettings.show),
                },
                labels: {
                    show: DataViewObjects.getValue<boolean>(objects, ganttProperties.labels.show, labelSettings.show),
                    fontSize: DataViewObjects.getValue<number>(objects, ganttProperties.labels.fontSize, labelSettings.fontSize),
                    color: this.getColor(objects, ganttProperties.labels.color, labelSettings.color, colors),
                }
            };
        }

        //Default Settings
        public general = {
            groupTasks: false
        };
        public legend = {
            show: true,
            position: legendPosition.right,
            showTitle: true,
            titleText: "",
            labelColor: "#000000",
            fontSize: 8,
        };
        public taskLabels = {
            show: true,
            fill: "#000000",
            fontSize: 9,
            width: 110,
        };
        public taskCompletion = {
            show: true,
            fill: "#000000",
        };
        public taskResource = {
            show: true,
            fill: "#000000",
            fontSize: 9,
        };
        public dateType = {
            type: GanttDateType.Week
        };
    }
}

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
    // powerbi.extensibility.utils.dataview
    import DataViewObjectsParser = utils.dataview.DataViewObjectsParser;
    export type GanttDateType = "Day" | "Week" | "Month" | "Year";

    export class GanttSettings extends DataViewObjectsParser {
        general: GeneralSettings = new GeneralSettings();
        legend: LegendSettings = new LegendSettings();
        taskLabels: TaskLabelsSettings = new TaskLabelsSettings();
        taskCompletion: TaskCompletionSettings = new TaskCompletionSettings();
        taskResource: TaskResourceSettings = new TaskResourceSettings();
        dateType: DateTypeSettings = new DateTypeSettings();
    }

    export class GeneralSettings {
        groupTasks: boolean = false;
        durationUnit: string = "day";
        durationMin: number = 0;
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
        fill: string = "#000000";
        fontSize: number = 9;
        width: number = 110;
    }

    export class TaskCompletionSettings {
        show: boolean = true;
        fill: string = "#000000";
    }

    export class TaskResourceSettings {
        show: boolean = true;
        fill: string = "#000000";
        fontSize: number = 9;
    }
    export class DateTypeSettings {
        // tslint:disable-next-line:no-reserved-keywords
        type: GanttDateType = "Week";
    }
}

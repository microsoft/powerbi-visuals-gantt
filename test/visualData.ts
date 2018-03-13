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

/// <reference path="_references.ts" />

module powerbi.extensibility.visual.test {
    // powerbi.extensibility.utils.type
    import ValueType = powerbi.extensibility.utils.type.ValueType;

    // powerbi.extensibility.utils.test
    import TestDataViewBuilder = powerbi.extensibility.utils.test.dataViewBuilder.TestDataViewBuilder;
    import getRandomNumber = powerbi.extensibility.utils.test.helpers.getRandomNumber;

    export class GanttData extends TestDataViewBuilder {
        public static ColumnType: string = "Type";
        public static ColumnTask: string = "Task";
        public static ColumnStartDate: string = "StartDate";
        public static ColumnDuration: string = "Duration";
        public static ColumnResource: string = "Resource";
        public static ColumnCompletePrecntege: string = "CompletePrecntege";
        public static ColumnExtraInformation: string = "Description";
        public static ColumnParent: string = "Parent";
        public static ColumnTooltips: string = "Tooltips";

        public valuesTaskTypeResource: string[][] = [
            ["Spec", "MOLAP connectivity", "Mey"],
            ["Design", "Clickthrough", "John"],
            ["Dev", "Tech design", "JohnV"],
            ["Dev", "Front End dev", "Sheng"],
            ["Dev", "ConnectionWithChildren", "Gentiana"],
            ["", "Query Pipeline", "Just", "ConnectionWithChildren"],
            ["", "Gateway", "Darshan", "ConnectionWithChildren"],
            ["Spec", "EGW", "Mini"],
            ["Dev", "Development", "Shay"],
            ["Dev", "Desktop", "Ehren"],
            ["Dev", "Service Fixup", "James"],
            ["Dev", "BugFixing", "Matt"],
            ["Design", "Clickthrough", "John"],
            ["Dev", "Tech design", "JohnV"],
            ["Dev", "Front End dev", "Sheng"],
            ["Dev", "Connection", "Gentiana"],
            ["Dev", "Query Pipeline", "Just"],
            ["Spec", "Gateway", "Darshan"],
            ["Spec", "EGW", "Mini"],
            ["Dev", "Development", "Shay"],
            ["Dev", "Desktop", "Ehren"],
            ["Dev", "Service Fixup", "James"],
            ["Dev", "BugFixing", "Matt"],
            ["Dev", "Connection", "Gentiana"],
            ["Dev", "Query Pipeline", "Just"],
            ["Spec", "Gateway", "Darshan"],
            ["Spec", "EGW", "Mini"],
            ["Dev", "Development", "Shay"],
            ["Dev", "Desktop", "Ehren"],
            ["Dev", "Service Fixup", "James"],
            ["Dev", "BugFixing", "Last Name"]

        ];
        public valuesStartDate = GanttData.getRandomUniqueDates(this.valuesTaskTypeResource.length, new Date(2015, 7, 0), new Date(2017, 7, 0));
        public valuesDuration = GanttData.getRandomUniqueNumbers(this.valuesTaskTypeResource.length, 3, 40);
        public valuesCompletePrecntege = GanttData.getRandomUniqueNumbers(this.valuesTaskTypeResource.length);
        public valuesExtraInformation = GanttData.getTexts(this.valuesTaskTypeResource, "Description");
        public valuesTooltips = GanttData.getTexts(this.valuesTaskTypeResource, "Description");

        public static getTexts(valuesTaskTypeResource: string[][], text: string): string[] {
            return valuesTaskTypeResource.map((item) => {
                return `${text} for ${item[1]} task`;
            });
        }

        public static getRandomUniqueDates(count: number, start: Date, end: Date): Date[] {
            return this.getRandomUniqueNumbers(count, start.getTime(), end.getTime()).map(x => new Date(x));
        }

        public static getRandomUniqueNumbers(count: number, min: number = 0, max: number = 1, needFloor: boolean = true): number[] {
            let result: number[] = [];
            for (let i: number = 0; i < count; i++) {
                let value = getRandomNumber(min, max, result);
                if (needFloor) {
                    value = Math.floor(value);
                }
                result.push(value);
            }

            return result;
        }

        public getDataView(columnNames?: string[]): powerbi.DataView {
            return this.createCategoricalDataViewBuilder([
                {
                    source: {
                        displayName: GanttData.ColumnType,
                        type: ValueType.fromDescriptor({ text: true }),
                        roles: { "Legend": true }
                    },
                    values: this.valuesTaskTypeResource.map(x => x[0])
                },
                {
                    source: {
                        displayName: GanttData.ColumnTask,
                        type: ValueType.fromDescriptor({ text: true }),
                        roles: { "Task": true }
                    },
                    values: this.valuesTaskTypeResource.map(x => x[1])
                },
                {
                    source: {
                        displayName: GanttData.ColumnResource,
                        type: ValueType.fromDescriptor({ text: true }),
                        roles: { "Resource": true }
                    },
                    values: this.valuesTaskTypeResource.map(x => x[2])
                },
                {
                    source: {
                        displayName: GanttData.ColumnStartDate,
                        type: ValueType.fromDescriptor({ dateTime: true }),
                        roles: { "StartDate": true }
                    },
                    values: this.valuesStartDate
                },
                {
                    source: {
                        displayName: GanttData.ColumnExtraInformation,
                        type: ValueType.fromDescriptor({ text: true }),
                        roles: { "ExtraInformation": true }
                    },
                    values: this.valuesExtraInformation
                },
                {
                    source: {
                        displayName: GanttData.ColumnParent,
                        type: ValueType.fromDescriptor({ text: true }),
                        roles: { "Parent": true }
                    },
                    values: this.valuesTaskTypeResource.map(x => x[3] ? x[3] : null)
                }
            ], [
                    {
                        source: {
                            displayName: GanttData.ColumnDuration,
                            type: ValueType.fromDescriptor({ numeric: true }),
                            roles: { "Duration": true }
                        },
                        values: this.valuesDuration
                    },
                    {
                        source: {
                            displayName: GanttData.ColumnCompletePrecntege,
                            type: ValueType.fromDescriptor({ numeric: true }),
                            roles: { "Completion": true }
                        },
                        values: this.valuesCompletePrecntege
                    }
                ], columnNames).build();
        }
    }
}

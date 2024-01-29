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

import powerbi from "powerbi-visuals-api";

import DataView = powerbi.DataView;
import { valueType as vt } from "powerbi-visuals-utils-typeutils";
import ValueType = vt.ValueType;

import { testDataViewBuilder, getRandomNumber, getRandomNumbers } from "powerbi-visuals-utils-testutils";
import TestDataViewBuilder = testDataViewBuilder.TestDataViewBuilder;
import { TestDataViewBuilderColumnOptions, TestDataViewBuilderCategoryColumnOptions } from "powerbi-visuals-utils-testutils/lib/dataViewBuilder/testDataViewBuilder";
import {GanttRole} from "../src/enums/ganttRole";

export class VisualData extends TestDataViewBuilder {
    public static ColumnType: string = "Type";
    public static ColumnTask: string = "Task";
    public static ColumnStartDate: string = "StartDate";
    public static ColumnDuration: string = "Duration";
    public static ColumnResource: string = "Resource";
    public static ColumnCompletePercentage: string = "CompletePercentage";
    public static ColumnExtraInformation: string = "Description";
    public static ColumnParent: string = "Parent";
    public static ColumnExtraInformationDates: string = "DescriptionDates";
    public static ColumnMilestones: string = "Milestone";

    public valuesTaskTypeResource: string[][] = [
        ["Spec", "MOLAP connectivity", "Mey"],
        ["Dev", "Front End dev", "Sheng"],
        ["", "Query Pipeline", "Just", "ConnectionWithChildren"],
        ["", "Gateway", "Darshan", "ConnectionWithChildren"],
        ["Spec", "EGW", "Mini"],
        ["Dev", "Development", "Shay"],
        ["Dev", "Desktop", "Ehren"],
        ["Dev", "Service Fixup", "James"],
        ["Dev", "BugFixing", "Matt"],
        ["Design", "Clickthrough", "John"],
        ["Dev", "Tech design", "JohnV"],
        ["Dev", "Front End dev", "John"],
        ["Dev", "Connection", "Gentiana"],
        ["Dev", "Query Pipeline", "Just"],
        ["Spec", "Gateway", "Darshan"],
        ["Spec", "EGW", "Min"],
        ["Dev", "Development", "Sean"],
        ["Dev", "Desktop", "Iri"],
        ["Dev", "Service Fixup", "Jimmy"],
        ["Dev", "BugFixing", "Tom"],
        ["Dev", "Query Pipeline", "John"],
        ["Spec", "EGW", "Mall"],
        ["Dev", "Development", "Sou"],
        ["Dev", "Service Fixup", "Jamie"],
        ["Dev", "BugFixing", "Last Name"]
    ];
    public valuesStartDate = VisualData.getRandomUniqueDates(this.valuesTaskTypeResource.length, new Date(2015, 7, 0), new Date(2017, 7, 0));
    public valuesDuration = VisualData.getRandomUniqueNumbers(this.valuesTaskTypeResource.length, 3, 40);
    public valuesCompletePrecntege = VisualData.getRandomUniqueNumbers(this.valuesTaskTypeResource.length);
    public valuesExtraInformation = VisualData.getTexts(this.valuesTaskTypeResource, "Description");
    public valuesExtraInformationDates = VisualData.getRandomUniqueDates(this.valuesTaskTypeResource.length, new Date(2015, 7, 0), new Date(2017, 7, 0));

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

    public generateHighLightedValues(length: number, highLightedElementNumber?: number): number[] {
        let array: any[] = [];
        for (let i: number = 0; i < length; i++) {
            array[i] = null;
        }
        if (highLightedElementNumber == undefined)
            return array;

        if (highLightedElementNumber >= length || highLightedElementNumber < 0) {
            array[0] = getRandomNumbers(this.valuesDuration.length, 10, 100)[0];
        } else {
            array[highLightedElementNumber] = getRandomNumbers(this.valuesDuration.length, 10, 100)[0];
        }

        return array;
    }

    public getDataView(columnNames?: string[], withMilestones?: boolean, withHighlights?: boolean): DataView {    
        let highlights: number[] = [];

        if (withHighlights)
        {
            let highLightedElementNumber: number = Math.round(getRandomNumber(0, this.valuesDuration.length - 1));
            let highlightedValuesCount: number = this.valuesDuration.length;
            highlights = this.generateHighLightedValues(highlightedValuesCount, highLightedElementNumber);
        }

        let categoriesColums: TestDataViewBuilderCategoryColumnOptions[] = [
            {
                source: {
                    displayName: VisualData.ColumnType,
                    type: ValueType.fromDescriptor({ text: true }),
                    roles: { [GanttRole.Legend]: true }
                },
                values: this.valuesTaskTypeResource.map(x => x[0])
            },
            {
                source: {
                    displayName: VisualData.ColumnTask,
                    type: ValueType.fromDescriptor({ text: true }),
                    roles: { [GanttRole.Task]: true }
                },
                values: this.valuesTaskTypeResource.map(x => x[1]),
            },
            {
                source: {
                    displayName: VisualData.ColumnResource,
                    type: ValueType.fromDescriptor({ text: true }),
                    roles: { [GanttRole.Resource]: true }
                },
                values: this.valuesTaskTypeResource.map(x => x[2])
            },
            {
                source: {
                    displayName: VisualData.ColumnExtraInformation,
                    type: ValueType.fromDescriptor({ text: true }),
                    roles: { [GanttRole.ExtraInformation]: true }
                },
                values: this.valuesExtraInformation
            },

            {
                source: {
                    displayName: VisualData.ColumnExtraInformationDates,
                    type: ValueType.fromDescriptor({ text: true }),
                    roles: { [GanttRole.ExtraInformation]: true }
                },
                values: this.valuesExtraInformationDates
            },
            {
                source: {
                    displayName: VisualData.ColumnParent,
                    type: ValueType.fromDescriptor({ text: true }),
                    roles: { [GanttRole.Parent]: true }
                },
                values: this.valuesTaskTypeResource.map(x => x[3] ? x[3] : null)
            },
            {
                source: {
                    displayName: VisualData.ColumnStartDate,
                    type: ValueType.fromDescriptor({ dateTime: true }),
                    roles: { [GanttRole.StartDate]: true }
                },
                values: this.valuesStartDate
            }
        ];

        if (withMilestones) {
            let milestoneCategoriesColumn: TestDataViewBuilderColumnOptions = {
                source: {
                    displayName: VisualData.ColumnMilestones,
                    type: ValueType.fromDescriptor({ text: true }),
                    roles: { [GanttRole.Milestones]: true }
                },
                values: this.valuesTaskTypeResource.map(x => x[3] ? x[3] : null),
            };

            categoriesColums.push(milestoneCategoriesColumn);
        }

        return this.createCategoricalDataViewBuilder(
            categoriesColums, [
                {
                    source: {
                        displayName: VisualData.ColumnDuration,
                        type: ValueType.fromDescriptor({ numeric: true }),
                        roles: { [GanttRole.Duration]: true }
                    },
                    values: this.valuesDuration,
                    highlights: highlights.length > 0 ? highlights : undefined
                },
                {
                    source: {
                        displayName: VisualData.ColumnCompletePercentage,
                        type: ValueType.fromDescriptor({ numeric: true }),
                        roles: { [GanttRole.Completion]: true }
                    },
                    values: this.valuesCompletePrecntege,
                    highlights: highlights.length > 0 ? highlights : undefined
                }
            ], columnNames).build();
    }
}

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
import lodashMapValues from "lodash.mapvalues";
import lodashToArray from "lodash.toarray";

import DataView = powerbi.DataView;
import DataViewValueColumn = powerbi.DataViewValueColumn;
import DataViewCategorical = powerbi.DataViewCategorical;
import DataViewValueColumns = powerbi.DataViewValueColumns;
import DataViewValueColumnGroup = powerbi.DataViewValueColumnGroup;
import DataViewCategoricalColumn = powerbi.DataViewCategoricalColumn;
import PrimitiveValue = powerbi.PrimitiveValue;

import { valueFormatter as ValueFormatter } from "powerbi-visuals-utils-formattingutils";

import { converterHelper } from "powerbi-visuals-utils-dataviewutils";
import {GanttRole} from "./enums/ganttRole";


const extraInformationRole = GanttRole.ExtraInformation;

export class GanttColumns<T> {

    public static getGroupedValueColumns(dataView: DataView): GanttColumns<DataViewValueColumn>[] {
        const categorical: DataViewCategorical = dataView?.categorical;
        const values: DataViewValueColumns = categorical?.values;
        const grouped: DataViewValueColumnGroup[] = values?.length && values.grouped();

        if (values === undefined || values.length == 0) {
            return;
        }

        return grouped && grouped.map(g => lodashMapValues(
            new this<DataViewValueColumn>(),
            (n, i) => g.values.filter(v => v.source.roles[i])[0]));
    }

    public static getCategoricalValues(dataView: DataView): GanttColumns<any> {
        const categorical: DataViewCategorical = dataView && dataView.categorical;
        const categories: DataViewCategoricalColumn[] = categorical && categorical.categories || [];
        const values: DataViewValueColumns = categorical && categorical.values || <DataViewValueColumns>[];
        const series: PrimitiveValue[] = categorical && values.source && this.getSeriesValues(dataView);

        return categorical && lodashMapValues(new this<any[]>(), (n, i) => {
            let columns: PrimitiveValue[] | { [x: string]: PrimitiveValue[]; };
            (<DataViewValueColumn[]>lodashToArray(categories))
                .concat(lodashToArray(values))
                .filter(x => x.source.roles && x.source.roles[i])
                .forEach(x => {
                    if (i === extraInformationRole && x.source.roles && x.source.roles[extraInformationRole]) {
                        if (!columns) {
                            columns = {};
                        }

                        if (x.source.format) {
                            const formatter = ValueFormatter.create({ format: x.source.format });
                            columns[x.source.displayName] = x.values.map(v => formatter.format(v));
                        } else {
                            columns[x.source.displayName] = x.values;
                        }
                    } else {
                        columns = x.values;
                    }
                });

            return columns || values.source && values.source.roles && values.source.roles[i] && series;
        });
    }

    public static getSeriesValues(dataView: DataView): PrimitiveValue[] {
        return dataView && dataView.categorical && dataView.categorical.values
            && dataView.categorical.values.map(x => converterHelper.getSeriesName(x.source));
    }

    // Data Roles
    public Legend: T = null;
    public Task: T = null;
    public Parent: T = null;
    public StartDate: T = null;
    public EndDate: T = null;
    public Duration: T = null;
    public Completion: T = null;
    public Resource: T = null;
    public ExtraInformation: T = null;
    public Milestones: T = null;
}

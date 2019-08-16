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
import * as d3 from "d3";
import * as _ from "lodash";

import DataView = powerbi.DataView;
import PrimitiveValue = powerbi.PrimitiveValue;

import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;
import ISelectionId = powerbi.extensibility.ISelectionId;

import { VisualData } from "./visualData";
import { VisualBuilder } from "./visualBuilder";
import { isColorAppliedToElements, getEndDate } from "./helpers/helpers";
import { clickElement, MockISelectionId, assertColorsMatch, MockISelectionIdBuilder, createSelectionId, createVisualHost, getRandomNumber } from "powerbi-visuals-utils-testutils";

import { pixelConverter as PixelConverter } from "powerbi-visuals-utils-typeutils";
import { legendPosition as LegendPosition } from "powerbi-visuals-utils-chartutils";
import { valueFormatter } from "powerbi-visuals-utils-formattingutils";
import IValueFormatter = valueFormatter.IValueFormatter;

import { Task, TaskDaysOff, Milestone } from "../src/interfaces";
import { DurationHelper } from "../src/durationHelper";
import { Gantt as VisualClass } from "../src/gantt";
import { getRandomHexColor, isValidDate } from "../src/utils";

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

export enum Days {
    Sunday = <any>"0",
    Monday = <any>"1",
    Tuesday = <any>"2",
    Wednesday = <any>"3",
    Thursday = <any>"4",
    Friday = <any>"5",
    Saturday = <any>"6"
}

const defaultTaskDuration: number = 1;
const datesAmountForScroll: number = 90;
const millisecondsInADay: number = 24 * 60 * 60 * 1000;

describe("Gantt", () => {
    let visualBuilder: VisualBuilder;
    let defaultDataViewBuilder: VisualData;
    let dataView: DataView;

    beforeEach(() => {
        visualBuilder = new VisualBuilder(1000, 500);

        defaultDataViewBuilder = new VisualData();
        dataView = defaultDataViewBuilder.getDataView();
        fixDataViewDateValuesAggregation(dataView);

    });

    function fixDataViewDateValuesAggregation(dataView) {
        let values = dataView.categorical.values[0].values;

        for (let i = 0; i < values.length; ++i) {
            let stringValue: string = values[i].toString();
            let index: number = stringValue.indexOf(")");

            if (stringValue.length - 1 !== index) {
                values[i] = new Date(stringValue.substring(0, index + 1));
            }
        }
    }

    function getUniqueParentsCount(dataView, parentColumnIndex) {
        let uniqueParents: string[] = [];

        dataView.table.rows.forEach(row => {
            if (row[parentColumnIndex] && uniqueParents.indexOf(row[parentColumnIndex] as string)) {
                uniqueParents.push(row[parentColumnIndex] as string);
            }
        });

        return uniqueParents.length;
    }

    describe("DOM tests", () => {

        // function that uses grep to filter
        function grep(val) {
            return $.grep(val, (e: Element) => e.innerHTML === "" || e.textContent === "");
        }

        it("svg element created", () => {
            expect(visualBuilder.mainElement[0]).toBeInDOM();
        });

        it("update", (done) => {
            visualBuilder.updateRenderTimeout(dataView, () => {
                let countOfTaskLabels = visualBuilder.tasks
                    .children(".task-resource")
                    .length;

                let countOfTaskLines = visualBuilder.mainElement
                    .children("g.task-lines")
                    .children("g.label")
                    .length;
                let countOfTasks = visualBuilder.tasks.length;

                let uniqueParents = getUniqueParentsCount(dataView, 5);
                expect(countOfTaskLabels).toEqual(dataView.table.rows.length + uniqueParents);
                expect(countOfTaskLines).toEqual(dataView.table.rows.length + uniqueParents);
                expect(countOfTasks).toEqual(dataView.table.rows.length + uniqueParents);

                done();
            });
        });

        it("Task Elements are presented in DOM if and only if task name is available (specified)", (done) => {
            dataView = defaultDataViewBuilder.getDataView([
                VisualData.ColumnTask]);

            visualBuilder.updateRenderTimeout(dataView, () => {
                expect(visualBuilder.tasks.length).not.toEqual(0);
                done();
            });
        });

        it("When Task Element is Missing, empty viewport should be created", (done) => {
            dataView = defaultDataViewBuilder.getDataView([
                VisualData.ColumnType,
                VisualData.ColumnStartDate,
                VisualData.ColumnDuration,
                VisualData.ColumnResource,
                VisualData.ColumnCompletePercentage]);

            visualBuilder.updateRenderTimeout(dataView, () => {
                let body = d3.select(visualBuilder.element.get(0));

                expect(body.select(".axis").selectAll("*").nodes().length).toEqual(1);
                expect(body.select(".task-lines").selectAll("task-labels").nodes().length).toEqual(0);
                expect(body.select(".chart .tasks").selectAll("*").nodes().length).toEqual(0);
                done();
            });
        });

        it("When task duration is missing,  it should be set to 1", (done) => {
            dataView = defaultDataViewBuilder.getDataView([
                VisualData.ColumnType,
                VisualData.ColumnTask,
                VisualData.ColumnStartDate,
                VisualData.ColumnResource,
                VisualData.ColumnCompletePercentage]);

            fixDataViewDateValuesAggregation(dataView);

            visualBuilder.updateRenderTimeout(dataView, () => {
                let tasks: Task[] = d3.select(visualBuilder.element.get(0)).selectAll(".task").data() as Task[];

                for (let task of tasks) {
                    expect(task.duration).toEqual(defaultTaskDuration);
                }

                done();
            });
        });

        it("When task duration is 1 or less,  it should be set to 1, not false", (done) => {
            dataView = defaultDataViewBuilder.getDataView([
                VisualData.ColumnType,
                VisualData.ColumnTask,
                VisualData.ColumnDuration,
                VisualData.ColumnStartDate,
                VisualData.ColumnResource,
                VisualData.ColumnCompletePercentage]);

            dataView
                .categorical
                .values
                .filter(x => x.source.roles.Duration)
                .forEach((element, i) => {
                    element.values = element.values.map((v: number, i) => i === 0 ? 1 : 1 / v);
                });

            fixDataViewDateValuesAggregation(dataView);

            visualBuilder.updateRenderTimeout(dataView, () => {
                let tasks: Task[] = d3.select(visualBuilder.element.get(0)).selectAll(".task").data() as Task[];

                for (let task of tasks) {
                    expect(task.duration).toEqual(defaultTaskDuration);
                }

                done();
            });
        });

        it("When task duration is float and duration unit 'second',  it should be round", (done) => {
            defaultDataViewBuilder.valuesDuration = VisualData.getRandomUniqueNumbers(100, 1, 2, false);
            dataView = defaultDataViewBuilder.getDataView([
                VisualData.ColumnType,
                VisualData.ColumnTask,
                VisualData.ColumnStartDate,
                VisualData.ColumnResource,
                VisualData.ColumnCompletePercentage
            ]);

            dataView.metadata.objects = {
                general: {
                    durationUnit: "second"
                }
            };

            fixDataViewDateValuesAggregation(dataView);

            visualBuilder.updateRenderTimeout(dataView, () => {
                let tasks: Task[] = d3.select(visualBuilder.element.get(0)).selectAll(".task").data() as Task[];

                for (let task of tasks) {
                    expect(task.duration).toEqual(defaultTaskDuration);
                }

                done();
            });
        });

        it("When task start time is missing, it should be set to today date", (done) => {
            dataView = defaultDataViewBuilder.getDataView([
                VisualData.ColumnType,
                VisualData.ColumnTask,
                VisualData.ColumnDuration,
                VisualData.ColumnResource,
                VisualData.ColumnCompletePercentage]);

            visualBuilder.updateRenderTimeout(dataView, () => {
                let tasks = d3.select(visualBuilder.element.get(0)).selectAll(".task").data() as Task[];

                for (let task of tasks) {
                    expect(task.start.toDateString()).toEqual(new Date(Date.now()).toDateString());
                }

                done();
            });
        });

        it("Task Resource is Missing, not shown on dom", (done) => {
            dataView = defaultDataViewBuilder.getDataView([
                VisualData.ColumnType,
                VisualData.ColumnTask,
                VisualData.ColumnStartDate,
                VisualData.ColumnDuration,
                VisualData.ColumnCompletePercentage]);

            fixDataViewDateValuesAggregation(dataView);

            visualBuilder.updateRenderTimeout(dataView, () => {
                let resources = d3.select(visualBuilder.element.get(0)).selectAll(".task-resource").nodes();
                let returnResource = grep(resources);

                expect(returnResource.length).toEqual(resources.length);
                done();
            });
        });

        it("Task Completion is Missing, not shown on dom", (done) => {
            dataView = defaultDataViewBuilder.getDataView([
                VisualData.ColumnType,
                VisualData.ColumnTask,
                VisualData.ColumnStartDate,
                VisualData.ColumnDuration,
                VisualData.ColumnResource]);

            fixDataViewDateValuesAggregation(dataView);

            visualBuilder.updateRenderTimeout(dataView, () => {
                let progressOfTasks = d3.select(visualBuilder.element.get(0)).selectAll(".task-progress").nodes();
                let returnTasks = grep(progressOfTasks);

                expect(progressOfTasks.length).toEqual(returnTasks.length);
                done();
            });
        });

        it("Task Completion width is equal task width", (done) => {
            defaultDataViewBuilder.valuesCompletePrecntege = VisualData.getRandomUniqueNumbers(
                defaultDataViewBuilder.valuesTaskTypeResource.length, 0, 100
            );

            defaultDataViewBuilder.valuesCompletePrecntege.forEach((value, index) => {
                defaultDataViewBuilder.valuesCompletePrecntege[index] = value * 0.01;
            });

            dataView = defaultDataViewBuilder.getDataView([
                VisualData.ColumnTask,
                VisualData.ColumnType,
                VisualData.ColumnStartDate,
                VisualData.ColumnDuration,
                VisualData.ColumnCompletePercentage,
                VisualData.ColumnResource]);


            fixDataViewDateValuesAggregation(dataView);

            visualBuilder.updateRenderTimeout(dataView, () => {
                let progressOfTasks = visualBuilder.taskProgress.toArray().map($);

                let skippedParents: number = 0;
                progressOfTasks.forEach((e, i) => {
                    let percent: number = defaultDataViewBuilder.valuesCompletePrecntege[i - skippedParents];
                    let widthOfTask: number = parseFloat($(visualBuilder.taskRect[i - skippedParents]).attr("width"));
                    let widthOfProgressTask: number = parseFloat(e.attr("width"));

                    const widthOfTaskFormatted = Math.floor((widthOfTask * percent)).toFixed(2);
                    const widthOfProgressTaskFormatted = Math.floor(widthOfProgressTask).toFixed(2);
                    expect(widthOfProgressTaskFormatted).toEqual(widthOfTaskFormatted);
                });

                done();
            });
        });

        it("Verify task labels have tooltips", (done) => {
            defaultDataViewBuilder.valuesTaskTypeResource.forEach(x => x[1] = _.repeat(x[1] + " ", 5).trim());
            dataView = defaultDataViewBuilder.getDataView([
                VisualData.ColumnTask,
                VisualData.ColumnStartDate,
                VisualData.ColumnDuration,
            ]);

            fixDataViewDateValuesAggregation(dataView);

            visualBuilder.updateRenderTimeout(dataView, () => {
                let taskLabelsInDom = d3.select(visualBuilder.element.get(0)).selectAll(".label title").nodes();
                let taskLabels = d3.select(visualBuilder.element.get(0)).selectAll(".label").data() as Task[];
                let tasks: PrimitiveValue[] = dataView.categorical.categories[0].values;

                for (let i = 0; i < tasks.length; i++) {
                    expect(taskLabels[i].name).toEqual((taskLabelsInDom[i] as Node).textContent);
                    expect(tasks[i]).toEqual((taskLabelsInDom[i] as Node).textContent);
                }

                done();
            });
        });

        it("Verify case if duration is not integer number", (done) => {
            defaultDataViewBuilder.valuesDuration = VisualData.getRandomUniqueNumbers(
                defaultDataViewBuilder.valuesTaskTypeResource.length, 0, 20, false);
            dataView = defaultDataViewBuilder.getDataView([
                VisualData.ColumnTask,
                VisualData.ColumnStartDate,
                VisualData.ColumnDuration]);

            dataView.metadata.objects = {
                general: {
                    durationUnit: "day"
                }
            };

            fixDataViewDateValuesAggregation(dataView);

            visualBuilder.updateRenderTimeout(dataView, () => {
                let tasks: Task[] = d3.select(visualBuilder.element.get(0)).selectAll(".task").data() as Task[];

                for (let i in tasks) {
                    let newDuration: number = tasks[i].duration;
                    if (tasks[i].duration % 1 !== 0) {
                        newDuration = VisualClass["transformDuration"](
                            defaultDataViewBuilder.valuesDuration[i],
                            "minute",
                            2
                        );
                    }

                    expect(tasks[i].duration).toEqual(newDuration);
                    expect(tasks[i].duration % 1 === 0).toBeTruthy();
                }

                done();
            });
        });

        it("Verify tooltips have extra information", (done) => {
            dataView = defaultDataViewBuilder.getDataView([
                VisualData.ColumnType,
                VisualData.ColumnTask,
                VisualData.ColumnStartDate,
                VisualData.ColumnDuration,
                VisualData.ColumnExtraInformation,
                VisualData.ColumnResource]);

            fixDataViewDateValuesAggregation(dataView);

            visualBuilder.updateRenderTimeout(dataView, () => {
                let tasks = d3.select(visualBuilder.element.get(0)).selectAll(".task").data() as Task[];
                let index = 0;
                for (let task of tasks) {
                    for (let tooltipInfo of task.tooltipInfo) {
                        if (tooltipInfo.displayName === VisualData.ColumnExtraInformation) {
                            let value: string = tooltipInfo.value;

                            expect(value).toEqual(defaultDataViewBuilder.valuesExtraInformation[index++]);
                        }
                    }
                }

                done();
            });
        });

        it("Verify tooltips have extra information (date type)", (done) => {
            let host: IVisualHost = createVisualHost();
            host.locale = host.locale || (<any>window.navigator).userLanguage || window.navigator["language"];
            let dateFormatter: IValueFormatter = valueFormatter.create({ format: null, cultureSelector: host.locale });

            dataView = defaultDataViewBuilder.getDataView([
                VisualData.ColumnType,
                VisualData.ColumnTask,
                VisualData.ColumnStartDate,
                VisualData.ColumnDuration,
                VisualData.ColumnExtraInformationDates]);

            visualBuilder.updateRenderTimeout(dataView, () => {
                let tasks = d3.select(visualBuilder.element.get(0)).selectAll(".task").data() as Task[];
                for (let task of tasks) {
                    for (let tooltipInfo of task.tooltipInfo) {
                        if (tooltipInfo.displayName === VisualData.ColumnExtraInformation) {
                            let value: string = tooltipInfo.value;

                            expect(value).toEqual(dateFormatter.format(task.start));
                        }
                    }
                }

                done();
            });
        });

        it("Verify tooltips have only string values", (done) => {
            const randomNumber = 134223;
            const durationUnit = "day";

            const task: any = {
                taskType: randomNumber,
                name: randomNumber,
                start: new Date(),
                end: new Date(),
                duration: randomNumber,
                completion: randomNumber,
                extraInformation: []
            };

            const formatters = {
                startDateFormatter: jasmine.createSpyObj("startDateFormatter", ["format"]),
                completionFormatter: jasmine.createSpyObj("completionFormatter", ["format"])
            };
            const localizationManager = visualBuilder.visualHost.createLocalizationManager();

            const tooltips = VisualClass.getTooltipInfo(task, formatters, durationUnit, localizationManager, undefined);
            tooltips
                .filter(t => t.value !== null && t.value !== undefined)
                .forEach(t => {
                    expect(typeof t.value).toBe("string");
                });
            done();
        });

        it("Verify sub tasks", (done) => {
            dataView = defaultDataViewBuilder.getDataView([
                VisualData.ColumnType,
                VisualData.ColumnTask,
                VisualData.ColumnStartDate,
                VisualData.ColumnDuration,
                VisualData.ColumnParent,
                VisualData.ColumnResource]);

            fixDataViewDateValuesAggregation(dataView);

            visualBuilder.updateRenderTimeout(dataView, () => {

                let tasks = d3.select(visualBuilder.element.get(0)).selectAll(".task").data(),
                    uniqueParentsCount: number = getUniqueParentsCount(dataView, 3);

                expect(tasks.length).toEqual(defaultDataViewBuilder.valuesTaskTypeResource.length + uniqueParentsCount);

                let parentIndex: number = 4;
                let parentTask = visualBuilder.taskLabelsText.eq(parentIndex);
                clickElement(parentTask);

                let childTaskMarginLeft: number = +visualBuilder.taskLabelsText.eq(++parentIndex).attr("x");
                expect(childTaskMarginLeft).toEqual(VisualClass["DefaultValues"]["TaskLineWidth"]);

                childTaskMarginLeft = +visualBuilder.taskLabelsText.eq(++parentIndex).attr("x");
                expect(childTaskMarginLeft).toEqual(VisualClass["DefaultValues"]["TaskLineWidth"]);

                done();
            });
        });

        it("Show collapse all arrow if parent is added", (done) => {
            dataView = defaultDataViewBuilder.getDataView([
                VisualData.ColumnType,
                VisualData.ColumnTask,
                VisualData.ColumnStartDate,
                VisualData.ColumnDuration,
                VisualData.ColumnResource,
                VisualData.ColumnParent
            ]);

            fixDataViewDateValuesAggregation(dataView);

            visualBuilder.updateRenderTimeout(dataView, () => {
                let collapseArrow = visualBuilder.collapseAllArrow[0];
                expect(collapseArrow).toBeDefined();

                dataView = defaultDataViewBuilder.getDataView([
                    VisualData.ColumnType,
                    VisualData.ColumnTask,
                    VisualData.ColumnStartDate,
                    VisualData.ColumnDuration,
                    VisualData.ColumnResource
                ]);

                visualBuilder.updateRenderTimeout(dataView, () => {

                    let collapseArrow = visualBuilder.collapseAllArrow[0];
                    expect(collapseArrow).not.toBeDefined();
                    done();
                });
            });
        });

        describe("Verify tooltips have no completion info", () => {
            function checkCompletionEqualNull(done: () => void) {
                visualBuilder.updateRenderTimeout(dataView, () => {
                    let tasks = d3.select(visualBuilder.element.get(0)).selectAll(".task").data() as Task[];
                    for (let task of tasks) {
                        for (let tooltipInfo of task.tooltipInfo) {
                            if (tooltipInfo.displayName === VisualData.ColumnCompletePercentage) {
                                expect(tooltipInfo.value).toEqual(null);
                            }
                        }
                    }

                    done();
                });
            }

            it("TaskCompletion setting is switched off", (done) => {
                dataView = defaultDataViewBuilder.getDataView([
                    VisualData.ColumnTask,
                    VisualData.ColumnStartDate,
                    VisualData.ColumnDuration,
                    VisualData.ColumnCompletePercentage]);

                fixDataViewDateValuesAggregation(dataView);

                dataView.metadata.objects = {
                    taskCompletion: {
                        show: false
                    }
                };

                checkCompletionEqualNull(done);
            });

            it("Completion data unavailable", (done) => {
                dataView = defaultDataViewBuilder.getDataView([
                    VisualData.ColumnTask,
                    VisualData.ColumnStartDate,
                    VisualData.ColumnDuration]);

                fixDataViewDateValuesAggregation(dataView);

                checkCompletionEqualNull(done);
            });
        });

        describe("Verify tooltips have info according 'parent' data", () => {
            function checkTasksHaveTooltipInfo(done: () => void) {
                fixDataViewDateValuesAggregation(dataView);
                visualBuilder.updateRenderTimeout(dataView, () => {
                    let tasks = d3.select(visualBuilder.element.get(0)).selectAll(".task").data() as Task[];
                    for (let task of tasks) {
                        if (!task.children) {
                            expect(task.tooltipInfo.length).not.toEqual(0);
                        }
                    }

                    done();
                });
            }

            it("With parent data", (done) => {
                dataView = defaultDataViewBuilder.getDataView([
                    VisualData.ColumnTask,
                    VisualData.ColumnStartDate,
                    VisualData.ColumnDuration,
                    VisualData.ColumnParent]);

                fixDataViewDateValuesAggregation(dataView);

                checkTasksHaveTooltipInfo(done);
            });

            it("Without parent data", (done) => {
                dataView = defaultDataViewBuilder.getDataView([
                    VisualData.ColumnTask,
                    VisualData.ColumnStartDate,
                    VisualData.ColumnDuration]);

                checkTasksHaveTooltipInfo(done);
            });
        });

        it("Verify Font Size set to default", (done) => {
            visualBuilder.updateRenderTimeout(dataView, () => {
                let element = d3.select(visualBuilder.element.get(0));
                let resources = element.selectAll(".task-resource").node();
                let labels = (element.selectAll(".label > .clickableArea").node() as HTMLElement).firstChild;

                expect((resources as SVGTextElement).style["font-size"]).toEqual("12px");
                expect((labels as SVGTextElement).style["font-size"]).toEqual("12px");
                done();
            });
        });

        for (let dateType in DateTypes) {
            it(`Verify date format (${dateType})`, ((dateType) => (done) => {
                switch (dateType) {
                    case "Second":
                    case "Minute":
                    case "Hour":
                        defaultDataViewBuilder.valuesStartDate = VisualData.getRandomUniqueDates(
                            defaultDataViewBuilder.valuesTaskTypeResource.length,
                            new Date(2017, 7, 0),
                            new Date(2017, 7, 1)
                        );
                        dataView = defaultDataViewBuilder.getDataView();
                        break;
                }

                dataView.metadata.objects = { dateType: { type: dateType } };

                let host: IVisualHost = createVisualHost();
                host.locale = host.locale || (<any>window.navigator).userLanguage || window.navigator["language"];

                let xAxisDateFormatter: IValueFormatter = valueFormatter.create({
                    format: VisualClass.DefaultValues.DateFormatStrings[dateType],
                    cultureSelector: host.locale
                });

                visualBuilder.updateRenderTimeout(dataView, () => {
                    visualBuilder.axisTicks.children("text").each((i, e) => {
                        let date: Date = new Date((<any>e).__data__);
                        expect($(e).text()).toEqual(xAxisDateFormatter.format(date));
                    });

                    done();
                });
            })(dateType));
        }

        it(`Verify milestone line is present in dom`, (done) => {
            let startDate: Date = new Date();
            let endDate: Date = new Date();

            startDate.setDate(startDate.getDate() - 30);
            endDate.setDate(endDate.getDate() + 30);

            defaultDataViewBuilder.valuesStartDate = VisualData.getRandomUniqueDates(
                defaultDataViewBuilder.valuesTaskTypeResource.length,
                startDate,
                endDate
            );
            dataView = defaultDataViewBuilder.getDataView();

            visualBuilder.updateRenderTimeout(dataView, () => {
                expect(visualBuilder.chartLine).toBeInDOM();

                done();
            });
        });

        it("Verify date format for culture which user have chosen", (done) => {
            let host: IVisualHost = createVisualHost();
            host.locale = host.locale || (<any>window.navigator).userLanguage || window.navigator["language"];
            let dateFormatter: IValueFormatter = valueFormatter.create({ format: null, cultureSelector: host.locale });

            let formattedDates: string[] = [];
            for (let date of defaultDataViewBuilder.valuesStartDate) {
                formattedDates.push(dateFormatter.format(date));
            }

            dataView = defaultDataViewBuilder.getDataView([
                VisualData.ColumnTask,
                VisualData.ColumnStartDate,
                VisualData.ColumnDuration]);

            fixDataViewDateValuesAggregation(dataView);

            visualBuilder.updateRenderTimeout(dataView, () => {
                let tasks = d3.select(visualBuilder.element.get(0)).selectAll(".task").data() as Task[];
                for (let task of tasks) {
                    for (let tooltipInfo of task.tooltipInfo) {
                        if (tooltipInfo.displayName === "Start Date") {
                            let value: string = tooltipInfo.value;
                            let idx: number = formattedDates.indexOf(value);

                            expect(value).toEqual(formattedDates[idx]);
                            formattedDates.splice(idx, 1);
                        }
                    }
                }

                done();
            });
        });

        it("Verify custom date format inside tooltip", (done) => {
            dataView.metadata.objects = {
                tooltipConfig: {
                    dateFormat: "MMMM dd,yyyy"
                }
            };

            visualBuilder.updateRenderTimeout(dataView, () => {
                let tasks = d3.select(visualBuilder.element.get(0)).selectAll(".task").data() as Task[];

                for (let task of tasks.filter(x => x.tooltipInfo)) {
                    const tooltipInfoArray = task.tooltipInfo;
                    tooltipInfoArray.forEach((tooltipInfo: VisualTooltipDataItem) => {
                        if (tooltipInfo.displayName === "Start Date") {
                            let value: string = tooltipInfo.value;

                            expect(value).toMatch(/([a-z].)\s{1}([0-9]{2}),([0-9]{0,4})/);
                        }
                    });
                }

                done();
            });
        });

        it("Verify end date in tooltip", (done) => {
            let host: IVisualHost = createVisualHost();
            host.locale = host.locale || (<any>window.navigator).userLanguage || window.navigator["language"];
            let dateFormatter: IValueFormatter = valueFormatter.create({ format: null, cultureSelector: host.locale });

            dataView = defaultDataViewBuilder.getDataView([
                VisualData.ColumnTask,
                VisualData.ColumnStartDate,
                VisualData.ColumnDuration]);

            fixDataViewDateValuesAggregation(dataView);

            visualBuilder.updateRenderTimeout(dataView, () => {
                let tasks = d3.select(visualBuilder.element.get(0)).selectAll(".task").data() as Task[];
                for (let task of tasks) {
                    for (let tooltipInfo of task.tooltipInfo) {
                        if (tooltipInfo.displayName === "End Date") {
                            expect(tooltipInfo.value).toBe(dateFormatter.format(task.end));
                        }
                    }
                }

                done();
            });
        });

        it("Verify group tasks enabled", (done) => {
            dataView = defaultDataViewBuilder.getDataView([
                VisualData.ColumnType,
                VisualData.ColumnTask,
                VisualData.ColumnStartDate,
                VisualData.ColumnDuration]);

            dataView.metadata.objects = { general: { groupTasks: true } };

            fixDataViewDateValuesAggregation(dataView);

            visualBuilder.updateRenderTimeout(dataView, () => {
                let taskLinesText: JQuery<any>[] = visualBuilder.taskLabelsText.toArray().map($);
                let values = dataView.categorical.categories[1].values;
                let taskGroups: JQuery<any>[] = visualBuilder.tasksGroups.toArray().map($);
                let tasks: Task[] = d3.select(visualBuilder.element.get(0)).selectAll(".task").data() as Task[];

                expect(values.length).toBeGreaterThan(_.uniq(values).length);
                expect(taskLinesText.length).toEqual(_.uniq(values).length);

                taskGroups.forEach((taskGroup: JQuery<any>, index: number) => {
                    const taskName: string = (taskLinesText[index] as any).children().text();
                    const tasksWithSameName = tasks.filter((task) => task.name === taskName);
                    expect(taskGroup.children().length).toBe(tasksWithSameName.length);
                });
                done();
            });
        });

        it("Verify group tasks enabled and then disabled", (done) => {

            dataView = defaultDataViewBuilder.getDataView([
                VisualData.ColumnType,
                VisualData.ColumnTask,
                VisualData.ColumnStartDate,
                VisualData.ColumnDuration]);

            dataView.metadata.objects = { general: { groupTasks: true } };

            fixDataViewDateValuesAggregation(dataView);

            visualBuilder.updateRenderTimeout(dataView, () => {
                dataView.metadata.objects = { general: { groupTasks: false } };

                visualBuilder.updateRenderTimeout(dataView, () => {
                    let countOfTaskLines = visualBuilder.taskLabelsText.length;
                    let values = dataView.categorical.categories[1].values;
                    let taskGroups: JQuery<any>[] = visualBuilder.tasksGroups.toArray().map($);

                    expect(countOfTaskLines).toEqual(values.length);
                    // in each row only one task - all the task re-rendered right
                    taskGroups.forEach((taskGroup) => {
                        expect(taskGroup.children().length).toBe(1);
                    });
                    done();
                });
            });
        });

        it("Common task bar test with Grouping = OFF", (done) => {
            dataView = defaultDataViewBuilder.getDataView([
                VisualData.ColumnType,
                VisualData.ColumnTask,
                VisualData.ColumnStartDate,
                VisualData.ColumnDuration,
                VisualData.ColumnResource,
                VisualData.ColumnParent
            ]);

            dataView.metadata.objects = { general: { groupTasks: false } };
            fixDataViewDateValuesAggregation(dataView);

            visualBuilder.updateRenderTimeout(dataView, () => {
                let tasks: Task[] = d3.select(visualBuilder.element.get(0)).selectAll(".task").data() as Task[];
                let parentTasks: Task[] = tasks.filter((task: Task) => task.children);

                let parentIndex: number = getRandomNumber(0, parentTasks.length - 1),
                    parentTask = parentTasks[parentIndex],
                    parentTaskLabel = visualBuilder.taskLabelsText.eq(parentTask.id);

                const minChildStart = _.minBy(parentTask.children, (t: Task) => t.start).start;
                const maxChildEnd = _.maxBy(parentTask.children, (t: Task) => t.end).end;
                const color = parentTask.children[0].color;

                clickElement(parentTaskLabel.parent());
                let collapsedTasksList = visualBuilder.instance["collapsedTasks"];
                dataView.metadata.objects = {
                    collapsedTasks: {
                        list: JSON.stringify(collapsedTasksList)
                    },
                    general: { groupTasks: false }
                };

                visualBuilder.updateRenderTimeout(dataView, () => {
                    let taskGroups: JQuery<any>[] = visualBuilder.tasksGroups.toArray().map($);
                    let updatedTasks = d3.select(visualBuilder.element.get(0)).selectAll(".task").data() as Task[];
                    const updatedParentTask = updatedTasks[parentTask.id];

                    expect(updatedTasks.length).toBe(tasks.length - parentTask.children.length);
                    expect(taskGroups.length).toBe(tasks.length - parentTask.children.length);
                    expect(taskGroups[parentTask.id].children().length).toBe(1);

                    expect(updatedParentTask.start).toEqual(minChildStart);
                    expect(updatedParentTask.end).toEqual(maxChildEnd);
                    expect(updatedParentTask.color).toBe(color);
                    done();
                });
            });
        });

        it("Common task bar test with Grouping = ON", (done) => {
            dataView = defaultDataViewBuilder.getDataView([
                VisualData.ColumnType,
                VisualData.ColumnTask,
                VisualData.ColumnStartDate,
                VisualData.ColumnDuration,
                VisualData.ColumnResource,
                VisualData.ColumnParent
            ]);

            dataView.metadata.objects = { general: { groupTasks: true } };
            fixDataViewDateValuesAggregation(dataView);
            visualBuilder.updateRenderTimeout(dataView, () => {
                let tasks: Task[] = d3.select(visualBuilder.element.get(0)).selectAll(".task").data() as Task[];
                let parentTasks: Task[] = tasks.filter((task: Task) => task.children);

                let parentIndex: number = getRandomNumber(0, parentTasks.length - 1),
                    parentTask = parentTasks[parentIndex],
                    parentTaskLabel = visualBuilder.taskLabelsText.eq(parentTask.id);

                const minChildStart = _.minBy(parentTask.children, (t: Task) => t.start).start;
                const maxChildEnd = _.maxBy(parentTask.children, (t: Task) => t.end).end;

                // Collapse
                clickElement(parentTaskLabel.parent());
                let collapsedTasksList = visualBuilder.instance["collapsedTasks"];
                dataView.metadata.objects = {
                    collapsedTasks: {
                        list: JSON.stringify(collapsedTasksList)
                    },
                    general: { groupTasks: true }
                };

                visualBuilder.updateRenderTimeout(dataView, () => {
                    let taskGroups: JQuery<any>[] = visualBuilder.tasksGroups.toArray().map($);
                    let updatedTasks = d3.select(visualBuilder.element.get(0)).selectAll(".task").data() as Task[];
                    const updatedParentTask = updatedTasks[parentTask.id];
                    const tasksWithSameName = updatedTasks.filter((task) => task.name === parentTask.name);

                    // all params are similar because common task is not used with Grouping
                    expect(updatedParentTask.start).not.toBe(minChildStart);
                    expect(updatedParentTask.end).not.toBe(maxChildEnd);
                    expect(updatedParentTask.children).toBe(null);
                    expect(taskGroups[parentTask.id].children().length).toBe(tasksWithSameName.length);
                    done();
                });
            });
        });

        it("Milestone test", (done) => {
            dataView = defaultDataViewBuilder.getDataView([
                VisualData.ColumnType,
                VisualData.ColumnTask,
                VisualData.ColumnStartDate,
                VisualData.ColumnDuration,
                VisualData.ColumnResource,
                VisualData.ColumnParent,
                VisualData.ColumnMilestones
            ], true);

            const milestoneColumnIndex = 5;
            const categoriesColumn = dataView.categorical.categories[milestoneColumnIndex];
            const uniqueMilestoneTypes = _.compact(_.uniq(categoriesColumn.values));

            const randomColors = uniqueMilestoneTypes.map((t) => getRandomHexColor());
            const randomTypes = uniqueMilestoneTypes.map((t) => {
                const types = ["Rhombus", "Circle", "Square"];
                return types[Math.floor(getRandomNumber(0, types.length - 1))];
            });

            if (!dataView.categorical.categories[milestoneColumnIndex].objects) {
                dataView.categorical.categories[milestoneColumnIndex].objects = [];
            }
            categoriesColumn.values.forEach((value: string) => {
                let milestoneSettingsObject = null;
                if (value) {
                    const index = uniqueMilestoneTypes.indexOf(value);
                    milestoneSettingsObject = {
                        milestones: {
                            fill: VisualBuilder.getSolidColorStructuralObject(randomColors[index]),
                            shapeType: randomTypes[index]
                        }
                    };
                }
                dataView.categorical.categories[milestoneColumnIndex].objects.push(milestoneSettingsObject);
            });

            // check for color and figure
            visualBuilder.updateRenderTimeout(dataView, () => {
                let tasks: Task[] = d3.select(visualBuilder.element.get(0)).selectAll(".task").data() as Task[];
                const taskWithMilestones = tasks.filter((task: Task) => task.Milestones.length);
                const milestones: JQuery<any>[] = visualBuilder.milestones.toArray().map($);

                expect(milestones.length).toBe(taskWithMilestones.length);

                // for each unique milestone type must be its own color and shapeType
                taskWithMilestones.forEach((task: Task) => {
                    task.Milestones.forEach((milestone: Milestone) => {
                        const index = uniqueMilestoneTypes.indexOf(milestone.type);
                        const expectedColor = randomColors[index];
                        const actualColor = milestones[index].attr("fill");
                        expect(actualColor).toBe(expectedColor);
                    });
                });

                done();
            });
        });

        it("Common milestone test", (done) => {
            dataView = defaultDataViewBuilder.getDataView([
                VisualData.ColumnType,
                VisualData.ColumnTask,
                VisualData.ColumnStartDate,
                VisualData.ColumnDuration,
                VisualData.ColumnResource,
                VisualData.ColumnParent,
                VisualData.ColumnMilestones
            ], true);
            visualBuilder.updateRenderTimeout(dataView, () => {
                const tasks: Task[] = d3.select(visualBuilder.element.get(0)).selectAll(".task").data() as Task[];
                const parentTasks: Task[] = tasks.filter((task: Task) => task.children);
                const oldMilestones: JQuery<any>[] = visualBuilder.milestones.toArray().map($);

                let parentIndex: number = getRandomNumber(0, parentTasks.length - 1),
                    parentTask = parentTasks[parentIndex],
                    parentTaskLabel = visualBuilder.taskLabelsText.eq(parentTask.id);

                // get uniq by date child milestones for current parent - they should be rendered on parent task bar
                const childMilestones = parentTask.children.map((childTask: Task) => {
                    if (childTask.Milestones.length) {
                        return childTask.Milestones;
                    }
                });
                let mergedMilestone: Milestone[] = parentTask.Milestones;
                childMilestones.forEach((milestoneArr) => {
                    mergedMilestone = mergedMilestone.concat(milestoneArr);
                });

                const uniqDates = _.uniqBy(mergedMilestone, "start");

                // Collapse
                clickElement(parentTaskLabel.parent());
                let collapsedTasksList = visualBuilder.instance["collapsedTasks"];
                dataView.metadata.objects = {
                    collapsedTasks: {
                        list: JSON.stringify(collapsedTasksList)
                    }
                };

                visualBuilder.updateRenderTimeout(dataView, () => {
                    const updatedTasks: Task[] = d3.select(visualBuilder.element.get(0)).selectAll(".task").data() as Task[];
                    const updatedParentTask = updatedTasks[parentTask.id];
                    const milestones: JQuery<any>[] = visualBuilder.milestones.toArray().map($);
                    const updatedTasksWithMilestones = updatedTasks.filter((t: Task) => t.Milestones.length && t.id !== parentTask.id);

                    expect(milestones.length).toBe(oldMilestones.length - (updatedParentTask.Milestones.length - uniqDates.length));
                    expect(updatedParentTask.Milestones.length).toBe(mergedMilestone.length);

                    updatedTasksWithMilestones.forEach((t: Task) => {
                        expect(t.Milestones.length).toBe(1);
                    });

                    done();
                });
            });
        });
    });

    describe("Selection", () => {
        describe("Single selection", () => {
            it("should highlight a proper data point after external filtering", () => {
                const selectionIds: MockISelectionId[] = [];
                let selectionIndex: number = -1;

                const customMockISelectionIdBuilder = new MockISelectionIdBuilder();
                customMockISelectionIdBuilder.createSelectionId = () => {
                    selectionIndex++;

                    if (selectionIds[selectionIndex]) {
                        return selectionIds[selectionIndex];
                    }

                    const selectionId: MockISelectionId = new MockISelectionId(`${selectionIndex}`);

                    selectionIds.push(selectionId);

                    return selectionId;
                };

                visualBuilder.visualHost.createSelectionIdBuilder = () => customMockISelectionIdBuilder;
                visualBuilder.updateFlushAllD3Transitions(dataView);

                // can't use lodash.deepCopy because we need to keep identity references
                const filteredDataView: DataView = {
                    ...dataView,
                    categorical: {
                        ...dataView.categorical,
                        categories: dataView.categorical.categories.map((category) => {
                            return {
                                ...category,
                                values: category.values.slice(0, 2)
                            };
                        })
                    }
                };

                selectionIndex = -1;

                visualBuilder.updateFlushAllD3Transitions(filteredDataView);

                clickElement(visualBuilder.tasks.eq(0));

                const selectedDataPoints: Task[] = getSelectedTasks(visualBuilder);

                selectionIndex = -1;

                visualBuilder.updateFlushAllD3Transitions(dataView);

                const selectedDataPointsAfterUpdateCall: Task[] = getSelectedTasks(visualBuilder);

                expect(selectedDataPoints.length).toBe(selectedDataPointsAfterUpdateCall.length);

                selectedDataPoints.forEach((selectedDataPoint: Task, index: number) => {
                    const selectedDataPointAfterUpdateCall: Task = selectedDataPointsAfterUpdateCall[index];

                    expect(selectedDataPoint.name).toBe(selectedDataPointAfterUpdateCall.name);
                    expect(selectedDataPoint.resource).toBe(selectedDataPointAfterUpdateCall.resource);
                    expect(selectedDataPoint.identity).toBe(selectedDataPointAfterUpdateCall.identity);
                });
            });

            function getSelectedTasks(visualBuilder: VisualBuilder): Task[] {
                return (visualBuilder.instance["interactivityService"]["selectableDataPoints"] as Task[])
                    .filter((task: Task) => task && task.selected);
            }
        });

        describe("Multi selection", () => {
            it("two data points should be selected", () => {
                visualBuilder.updateFlushAllD3Transitions(dataView);

                let firstGroup = visualBuilder.tasks.eq(0);
                let secondGroup = visualBuilder.tasks.eq(1);
                let thirdGroup = visualBuilder.tasks.eq(2);

                clickElement(firstGroup);
                clickElement(secondGroup, true);

                expect(parseFloat(firstGroup.css("opacity"))).toBe(1);
                expect(parseFloat(secondGroup.css("opacity"))).toBe(1);
                expect(parseFloat(thirdGroup.css("opacity"))).toBeLessThan(1);
            });
        });
    });

    describe("Format settings test", () => {
        describe("General", () => {
            it("Scroll to current time", (done) => {
                let todayDate = new Date();
                let startDate = new Date();
                let endDate = new Date();

                startDate.setDate(todayDate.getDate() - datesAmountForScroll);
                endDate.setDate(todayDate.getDate() + datesAmountForScroll);

                defaultDataViewBuilder.valuesStartDate = VisualData.getRandomUniqueDates(
                    defaultDataViewBuilder.valuesTaskTypeResource.length,
                    startDate,
                    endDate
                );
                dataView = defaultDataViewBuilder.getDataView();
                dataView.metadata.objects = {
                    general: {
                        scrollToCurrentTime: true
                    }
                };

                visualBuilder.updateRenderTimeout(dataView, () => {
                    expect(visualBuilder.body.scrollLeft()).not.toEqual(0);
                    done();
                });
            });

            describe("Duration units", () => {

                function checkDurationUnit(durationUnit: string) {
                    const tasks: Task[] = d3
                        .select(visualBuilder.element.get(0))
                        .selectAll(".task")
                        .data() as Task[];

                    tasks.forEach(task => {
                        if (task.duration) {
                            const dates: Date[] = getEndDate(durationUnit, task.start, task.end);
                            expect(dates.length).toEqual(task.duration);
                        }
                    });
                }

                function setDurationUnit(durationUnit) {
                    dataView.metadata.objects = {
                        general: {
                            durationUnit: durationUnit
                        }
                    };
                }

                it("days", (done) => {
                    let durationUnit: string = "day";
                    setDurationUnit(durationUnit);

                    fixDataViewDateValuesAggregation(dataView);

                    visualBuilder.updateRenderTimeout(dataView, () => {
                        checkDurationUnit(durationUnit);
                        done();
                    });
                });

                it("hours", (done) => {
                    let durationUnit: string = "hour";
                    setDurationUnit(durationUnit);

                    fixDataViewDateValuesAggregation(dataView);

                    visualBuilder.updateRenderTimeout(dataView, () => {
                        checkDurationUnit(durationUnit);
                        done();
                    });
                });

                it("minutes", (done) => {
                    let durationUnit: string = "minute";
                    setDurationUnit(durationUnit);

                    fixDataViewDateValuesAggregation(dataView);

                    visualBuilder.updateRenderTimeout(dataView, () => {
                        checkDurationUnit(durationUnit);
                        done();
                    });
                });

                it("seconds", (done) => {
                    let durationUnit: string = "second";
                    setDurationUnit(durationUnit);

                    fixDataViewDateValuesAggregation(dataView);

                    visualBuilder.updateRenderTimeout(dataView, () => {
                        checkDurationUnit(durationUnit);
                        done();
                    });
                });

            });

            describe("Duration units downgrade", () => {
                const firstTaskDuration = 4404;
                const secondTaskDuration = 1;
                const thirdTaskDuration = 1.12;
                const secondInHour = 3600;

                it("hour to second", done => {
                    const tasks = [
                        {
                            wasDowngradeDurationUnit: true,
                            stepDurationTransformation: 2,
                            duration: firstTaskDuration
                        },
                        {
                            wasDowngradeDurationUnit: false,
                            stepDurationTransformation: 0,
                            duration: secondTaskDuration
                        },
                        {
                            wasDowngradeDurationUnit: false,
                            stepDurationTransformation: 0,
                            duration: thirdTaskDuration
                        }
                    ];

                    visualBuilder.downgradeDurationUnit(tasks, "second");
                    expect(tasks[0].duration).toEqual(firstTaskDuration);
                    expect(tasks[1].duration).toEqual(Math.floor(secondTaskDuration * secondInHour));
                    expect(tasks[2].duration).toEqual(Math.floor(thirdTaskDuration * secondInHour));

                    done();
                });
            });
        });

        describe("Days off", () => {
            it("color", (done) => {
                let color: string = getRandomHexColor();
                dataView.metadata.objects = {
                    daysOff: {
                        show: true,
                        fill: VisualBuilder.getSolidColorStructuralObject(color)
                    }
                };

                fixDataViewDateValuesAggregation(dataView);

                visualBuilder.updateRenderTimeout(dataView, () => {
                    visualBuilder.taskDaysOffRect.toArray().map($).forEach(e => {
                        assertColorsMatch(e.css("fill"), color);
                    });

                    done();
                });
            });

            function checkDaysOff(
                dayForCheck: number,
                done: () => void): void {
                visualBuilder.updateRenderTimeout(dataView, () => {
                    visualBuilder.taskDaysOffRect.each((i: number, e: Element) => {
                        const isParentTask: boolean = e.hasChildNodes();
                        let daysOff: TaskDaysOff = e["__data__"].daysOff; // Takes data from an element

                        if (!isParentTask) {
                            const amountOfWeekendDays: number = daysOff[1];

                            const firstDayOfWeek: Date = new Date(
                                daysOff[0].getTime() + (amountOfWeekendDays * millisecondsInADay)
                            );

                            expect(firstDayOfWeek.getDay()).toEqual(dayForCheck);
                        }
                    });
                    done();
                });
            }

            for (let day in Days) {
                it(`Verify day off (${day}) for 'Day' date type`, ((day) => (done) => {
                    dataView = defaultDataViewBuilder.getDataView();

                    dataView.metadata.objects = {
                        daysOff: {
                            show: true,
                            firstDayOfWeek: day
                        }
                    };

                    fixDataViewDateValuesAggregation(dataView);

                    checkDaysOff(+day, done);
                })(day));
            }

            it(`Verify end date of task is weekend date`, (done) => {
                let startDate: Date = new Date(2017, 8, 29); // Its a last day of working week
                let endDate: Date = new Date(2017, 8, 30);

                defaultDataViewBuilder.valuesStartDate = VisualData.getRandomUniqueDates(
                    defaultDataViewBuilder.valuesTaskTypeResource.length,
                    startDate,
                    endDate
                );
                defaultDataViewBuilder.valuesDuration = VisualData.getRandomUniqueNumbers(
                    defaultDataViewBuilder.valuesTaskTypeResource.length, 30, 48);
                dataView = defaultDataViewBuilder.getDataView();

                fixDataViewDateValuesAggregation(dataView);

                dataView.metadata.objects = {
                    general: {
                        durationUnit: "hour"
                    },
                    dateType: {
                        type: "Hour"
                    },
                    daysOff: {
                        show: true,
                        firstDayOfWeek: +Days.Monday
                    }
                };

                checkDaysOff(+Days.Monday, done);
            });
        });

        describe("Sub tasks", () => {
            beforeEach(() => {
                dataView = defaultDataViewBuilder.getDataView([
                    VisualData.ColumnType,
                    VisualData.ColumnTask,
                    VisualData.ColumnStartDate,
                    VisualData.ColumnDuration,
                    VisualData.ColumnParent]);

                fixDataViewDateValuesAggregation(dataView);
            });

            it("inherit parent legend", (done) => {
                dataView.metadata.objects = {
                    subTasks: {
                        inheritParentLegend: true
                    }
                };

                visualBuilder.updateRenderTimeout(dataView, () => {
                    const tasks = d3.select(visualBuilder.element.get(0))
                        .selectAll(".task")
                        .data();

                    tasks.forEach((task: Task) => {
                        if (task.parent) {
                            const parentName = task.parent.substr(0, task.parent.length - task.name.length - 1);
                            const parentTask: Task = _.find(tasks, { name: parentName }) as Task;

                            if (parentTask) {
                                expect(task.taskType).toEqual(parentTask.taskType);
                            }
                        }
                    });

                    done();
                });
            });

            it("parent duration by children", (done) => {
                dataView.metadata.objects = {
                    subTasks: {
                        parentDurationByChildren: true
                    }
                };

                visualBuilder.updateRenderTimeout(dataView, () => {
                    let tasks = d3.select(visualBuilder.element.get(0)).selectAll(".task").data() as Task[];
                    let { parents, children } = getChildrenAndParents(tasks);

                    parents.forEach((parent: Task) => {
                        const start: Date = (_.minBy(children[parent.name],
                            (childTask: Task) => childTask.start)).start;
                        const end: Date = (_.maxBy(children[parent.name],
                            (childTask: Task) => childTask.end)).end;

                        expect(parent.start).toEqual(start);
                        expect(parent.end).toEqual(end);

                        const newDuration: number = d3.timeDay.range(start, end).length;
                        expect(parent.duration).toEqual(newDuration);
                    });

                    done();
                });
            });

            it("parent completion by children", (done) => {
                dataView.metadata.objects = {
                    subTasks: {
                        parentCompletionByChildren: true
                    }
                };

                visualBuilder.updateRenderTimeout(dataView, () => {
                    let tasks = d3.select(visualBuilder.element.get(0)).selectAll(".task").data() as Task[];
                    let { parents, children } = getChildrenAndParents(tasks);

                    parents.forEach((parent: Task) => {
                        const childrenAverageCompletion: number = children[parent.name]
                            .reduce((prevValue, currentTask) => prevValue + currentTask.completion, 0) /
                            children[parent.name].length;

                        expect(parent.completion).toEqual(childrenAverageCompletion);

                    });

                    done();
                });
            });

            it("sorting both parents and subtasks (tasks asc)", (done) => {
                dataView.metadata.columns[1].sort = 1; // 1 - ascending order

                visualBuilder.updateRenderTimeout(dataView, () => {
                    let tasks = d3.select(visualBuilder.element.get(0)).selectAll(".task").data() as Task[];
                    assertSortingOrderAsc(tasks);
                    done();
                });
            });

            it("sorting both parents and subtasks (tasks desc)", (done) => {
                dataView.metadata.columns[1].sort = 2; // 2 - descending order

                visualBuilder.updateRenderTimeout(dataView, () => {
                    let tasks = d3.select(visualBuilder.element.get(0)).selectAll(".task").data() as Task[];
                    assertSortingOrderDesc(tasks);
                    done();
                });
            });

            it("sorting both parents and subtasks (parent asc)", (done) => {

                dataView.metadata.columns[2].sort = 1; // 1 - ascending order

                visualBuilder.updateRenderTimeout(dataView, () => {
                    let tasks = d3.select(visualBuilder.element.get(0)).selectAll(".task").data() as Task[];
                    assertSortingOrderAsc(tasks);
                    done();
                });
            });

            it("sorting both parents and subtasks (parent desc)", (done) => {
                dataView.metadata.columns[2].sort = 2; // 2 - descending order

                visualBuilder.updateRenderTimeout(dataView, () => {
                    let tasks = d3.select(visualBuilder.element.get(0)).selectAll(".task").data() as Task[];
                    assertSortingOrderDesc(tasks);
                    done();
                });
            });

            function assertSortingOrderAsc(tasks: Task[]) {
                let prevIndex: number = 0;

                for (let i = 1; i < tasks.length; ++i) {
                    if (!tasks[i].parent) {
                        expect(tasks[i].name >= tasks[prevIndex].name);
                        prevIndex = i;
                    }
                }
            }

            function assertSortingOrderDesc(tasks: Task[]) {
                let prevIndex: number = 0;

                for (let i = 1; i < tasks.length; ++i) {
                    if (!tasks[i].parent) {
                        expect(tasks[i].name <= tasks[prevIndex].name);
                        prevIndex = i;
                    }
                }
            }

            function getChildrenAndParents(tasks: Task[]) {
                let children: { [key: string]: Task[] } = {};
                let parents: Task[] = [];
                tasks.forEach((task) => {
                    if (task.parent) {
                        const parentName = task.parent.substr(0, task.parent.length - task.name.length - 1);

                        const parentTask: Task = _.find(tasks, { name: parentName });

                        if (parentTask) {
                            if (!_.find(parents, { name: parentTask.name })) {
                                parents.push(parentTask);
                            }

                            if (!children[parentTask.name]) {
                                children[parentTask.name] = [];
                            }

                            children[parentTask.name].push(task);
                        }
                    }
                });

                return { parents, children };
            }
        });

        describe("Data labels", () => {
            beforeEach(() => {
                dataView.metadata.objects = {
                    taskResource: {
                        show: true
                    }
                };

            });

            it("show", (done) => {
                visualBuilder.updateRenderTimeout(dataView, () => {
                    expect(visualBuilder.taskResources).toBeInDOM();

                    done();
                });
            });

            it("hide", (done) => {
                dataView.metadata.objects = {
                    taskResource: {
                        show: false
                    }
                };

                visualBuilder.updateRenderTimeout(dataView, () => {
                    expect(visualBuilder.taskResources).not.toBeInDOM();

                    done();
                });
            });

            it("color", (done) => {
                let color: string = getRandomHexColor();
                dataView.metadata.objects = {
                    taskResource: {
                        fill: VisualBuilder.getSolidColorStructuralObject(color)
                    }
                };

                visualBuilder.updateRenderTimeout(dataView, () => {
                    visualBuilder.taskResources.toArray().map($).forEach(e =>
                        assertColorsMatch(e.css("fill"), color));

                    done();
                });
            });

            it("fontSize", (done) => {
                const fontSize: number = 10;
                dataView.metadata.objects = {
                    taskResource: {
                        fontSize
                    }
                };

                visualBuilder.updateRenderTimeout(dataView, () => {
                    visualBuilder.taskResources.toArray().map($).forEach(e => {
                        let fontSizeEl: string = e.css("font-size");
                        fontSizeEl = fontSizeEl.substr(0, fontSizeEl.length - 2);

                        let fontSizePoint: string = PixelConverter.fromPoint(fontSize);
                        fontSizePoint = (+(fontSizePoint.substr(0, fontSizePoint.length - 2))).toFixed(4);

                        expect(fontSizeEl).toEqual(fontSizePoint);
                    });

                    done();
                });
            });

            it("position", (done) => {
                dataView.metadata.objects = {
                    taskResource: {
                        position: "Top"
                    }
                };

                visualBuilder.updateRenderTimeout(dataView, () => {
                    let taskRects: any[] = visualBuilder.taskRect.toArray().map($);
                    visualBuilder.taskResources.toArray().map($).forEach((e, i) => {
                        const text: string = e.text();
                        const taskResourcesX = +e.attr("x");
                        const taskResourcesY = +e.attr("y");
                        const taskRectX = taskRects[i][0].getBBox().x + VisualClass["RectRound"];
                        const taskRectY = taskRects[i][0].getBBox().y;

                        if (text) {
                            expect(taskResourcesX.toFixed(2)).toBeCloseTo(taskRectX.toFixed(2));
                            expect(taskResourcesY.toFixed(2)).toBeLessThan(taskRectY.toFixed(2));
                        }
                    });

                    done();
                });
            });

            it("fullText", (done) => {
                dataView.metadata.objects = {
                    taskResource: {
                        fullText: true
                    }
                };

                visualBuilder.updateRenderTimeout(dataView, () => {
                    visualBuilder.taskResources.toArray().map($).forEach(e =>
                        expect(e.text().indexOf("...")).toEqual(-1));

                    done();
                });
            });

            it("widthByTask", (done) => {
                dataView.metadata.objects = {
                    taskResource: {
                        position: "Top",
                        fullText: false,
                        widthByTask: true
                    }
                };

                visualBuilder.updateRenderTimeout(dataView, () => {
                    let taskRects: any[] = visualBuilder.taskRect.toArray().map($);
                    visualBuilder.taskResources.toArray().map($).forEach((e, i) => {
                        let labelElRawWidth: string = e.css("width");
                        let labelElWidth: number = +labelElRawWidth.substr(0, labelElRawWidth.length - 2);

                        let taskElRawWidth: string = taskRects[i].css("width");
                        let taskElWidth: number = +taskElRawWidth.substr(0, taskElRawWidth.length - 2);

                        expect(labelElWidth <= taskElWidth).toBeTruthy();
                    });

                    done();
                });
            });
        });

        describe("Task Completion", () => {
            it("opacity", (done) => {
                dataView.metadata.objects = {
                    taskCompletion: {
                        show: true
                    }
                };

                visualBuilder.updateRenderTimeout(dataView, () => {
                    visualBuilder.taskProgress.toArray().map($).forEach(e => {
                        expect(e.css("opacity")).toBe(VisualClass["TaskOpacity"].toString());
                    });
                    done();
                });

                visualBuilder.updateRenderTimeout(dataView, () => {
                    let tasks = d3.select(visualBuilder.element.get(0)).selectAll(".task").data() as Task[];
                    visualBuilder.taskRect.toArray().map($).forEach((e, i) => {
                        // if completion is null (no info about completion) - task expected to be completed
                        const expectedOpacity = tasks[i].completion ? VisualClass["NotCompletedTaskOpacity"].toString() : VisualClass["TaskOpacity"].toString();
                        expect(e.css("opacity")).toBe(expectedOpacity);
                    });
                    done();
                });
            });
        });

        describe("check duration unit downgrade", () => {
            it("check for days downgrading", () => {
                let unitMocks = VisualBuilder.getDowngradeDurationUnitMocks(),
                    data = unitMocks.days.data,
                    expected = unitMocks.days.expected,
                    realResult = data.map((dataItem) => DurationHelper.getNewUnitByFloorDuration(dataItem.unit, dataItem.duration));

                expect(realResult).toEqual(expected);
            });

            it("check for hours downgrading", () => {
                let unitMocks = VisualBuilder.getDowngradeDurationUnitMocks(),
                    data = unitMocks.hours.data,
                    expected = unitMocks.hours.expected,
                    realResult = data.map((dataItem) => DurationHelper.getNewUnitByFloorDuration(dataItem.unit, dataItem.duration));

                expect(realResult).toEqual(expected);
            });

            it("check for minutes downgrading", () => {
                let unitMocks = VisualBuilder.getDowngradeDurationUnitMocks(),
                    data = unitMocks.minutes.data,
                    expected = unitMocks.minutes.expected,
                    realResult = data.map((dataItem) => DurationHelper.getNewUnitByFloorDuration(dataItem.unit, dataItem.duration));

                expect(realResult).toEqual(expected);
            });

            it("check for hours downgrading", () => {
                let unitMocks = VisualBuilder.getDowngradeDurationUnitMocks(),
                    data = unitMocks.seconds.data,
                    expected = unitMocks.seconds.expected,
                    realResult = data.map((dataItem) => DurationHelper.getNewUnitByFloorDuration(dataItem.unit, dataItem.duration));

                expect(realResult).toEqual(expected);
            });
        });

        describe("Task Settings", () => {
            it("color", (done) => {
                dataView = defaultDataViewBuilder.getDataView([
                    VisualData.ColumnTask,
                    VisualData.ColumnStartDate,
                    VisualData.ColumnDuration,
                    VisualData.ColumnResource]);

                fixDataViewDateValuesAggregation(dataView);

                let color: string = getRandomHexColor();
                dataView.metadata.objects = {
                    taskConfig: {
                        fill: VisualBuilder.getSolidColorStructuralObject(color)
                    }
                };

                visualBuilder.updateRenderTimeout(dataView, () => {
                    visualBuilder.taskLine.toArray().map($).forEach(e =>
                        assertColorsMatch(e.css("fill"), color));

                    done();
                });
            });

            it("height", (done) => {
                let height: number = 50;
                dataView.metadata.objects = {
                    taskConfig: {
                        height
                    }
                };

                visualBuilder.updateRenderTimeout(dataView, () => {
                    visualBuilder.taskLine.toArray().map($).forEach(e =>
                        expect(+e.attr("height")).toEqual(height));

                    done();
                });
            });
        });

        describe("Category Labels", () => {
            beforeEach(() => {
                dataView.metadata.objects = {
                    taskLabels: {
                        show: true
                    }
                };

            });

            it("show", (done) => {
                dataView.metadata.objects = {
                    taskLabels: {
                        show: true
                    }
                };

                visualBuilder.updateRenderTimeout(dataView, () => {
                    const taskLabelsWidth: number = 110;
                    expect(visualBuilder.taskLabels).toBeInDOM();
                    expect(visualBuilder.taskLineRect.attr("width")).toEqual(taskLabelsWidth.toString());
                    done();
                });
            });

            it("hide", (done) => {
                dataView.metadata.objects = {
                    taskLabels: {
                        show: false
                    }
                };

                visualBuilder.updateRenderTimeout(dataView, () => {
                    expect(visualBuilder.taskLabels).not.toBeInDOM();
                    expect(visualBuilder.taskLineRect.attr("width")).toEqual("0");
                    done();
                });
            });

            it("color", (done) => {
                let color: string = getRandomHexColor();
                dataView.metadata.objects = {
                    taskLabels: {
                        fill: VisualBuilder.getSolidColorStructuralObject(color)
                    }
                };

                visualBuilder.updateRenderTimeout(dataView, () => {
                    visualBuilder.taskLabelsText.toArray().map($).forEach(e =>
                        assertColorsMatch(e.css("fill"), color));

                    done();
                });
            });
        });

        describe("Legend", () => {
            beforeEach(() => {
                dataView.metadata.objects = {
                    legend: {
                        show: true,
                        position: LegendPosition.right
                    }
                };
            });

            it("show", (done) => {
                dataView.metadata.objects = {
                    legend: {
                        show: true
                    }
                };

                visualBuilder.updateRenderTimeout(dataView, () => {
                    expect(visualBuilder.legendGroup.children()).toBeInDOM();

                    done();
                });
            });

            it("hide", (done) => {
                dataView.metadata.objects = {
                    legend: {
                        show: false
                    }
                };

                visualBuilder.updateRenderTimeout(dataView, () => {
                    expect(visualBuilder.legendGroup.children()).not.toBeInDOM();

                    done();
                });
            });
        });

        describe("Gantt date types", () => {
            it("Today color", (done) => {
                let color: string = getRandomHexColor();
                dataView.metadata.objects = {
                    dateType: {
                        todayColor: VisualBuilder.getSolidColorStructuralObject(color)
                    }
                };

                checkColor(visualBuilder.chartLine, color, "stroke", done);
            });

            it("Axis color", (done) => {
                let color: string = getRandomHexColor();
                dataView.metadata.objects = {
                    dateType: {
                        axisColor: VisualBuilder.getSolidColorStructuralObject(color)
                    }
                };

                checkColor(visualBuilder.axisTicksLine, color, "stroke", done);
            });

            it("Axis text color", (done) => {
                let color: string = getRandomHexColor();
                dataView.metadata.objects = {
                    dateType: {
                        axisTextColor: VisualBuilder.getSolidColorStructuralObject(color)
                    }
                };

                checkColor(visualBuilder.axisTicksText, color, "fill", done);
            });

            function checkColor(
                elements: JQuery,
                color: string,
                cssStyle: string,
                done: () => void
            ): void {
                visualBuilder.updateRenderTimeout(dataView, () => {
                    elements.toArray().map($).forEach(e =>
                        assertColorsMatch(e.css(cssStyle), color));

                    done();
                });
            }
        });
    });

    describe("View Model tests", () => {
        it("Test result from enumeration", done => {
            dataView.metadata.objects = {
                taskResource: {
                    show: true,
                    fill: { solid: { color: "#A3A3A3" } }, fontSize: "14px"
                }
            };

            visualBuilder.updateEnumerateObjectInstancesRenderTimeout(
                dataView,
                { objectName: "taskResource" },
                (result) => {
                    expect(result[0]).toBeDefined();
                    expect(result[0].properties["show"]).toBe(true);
                    expect(result[0].properties["fill"]).toBe("#A3A3A3");
                    expect(result[0].properties["fontSize"]).toBe("14px");
                    done();
                });
        });
    });

    describe("Capabilities tests", () => {
        it("all items having displayName should have displayNameKey property", () => {
            jasmine.getJSONFixtures().fixturesPath = "base";

            let jsonData = getJSONFixture("capabilities.json");

            let objectsChecker: Function = (obj) => {
                for (let property in obj) {
                    let value: any = obj[property];

                    if (value.displayName) {
                        expect(value.displayNameKey).toBeDefined();
                    }

                    if (typeof value === "object") {
                        objectsChecker(value);
                    }
                }
            };

            objectsChecker(jsonData);
        });
    });

    describe("High contrast mode", () => {
        const backgroundColor: string = "#000000";
        const foregroundColor: string = "#ff00ff";

        let taskRect: JQuery<any>[],
            taskLineRect: JQuery<any>[],
            axisTicksText: JQuery<any>[],
            axisTicksLine: JQuery<any>[],
            taskLabels: JQuery<any>[],
            chartLine: JQuery<any>[],
            taskProgress: JQuery<any>[];

        beforeEach(() => {
            visualBuilder.visualHost.colorPalette.isHighContrast = true;

            visualBuilder.visualHost.colorPalette.background = { value: backgroundColor };
            visualBuilder.visualHost.colorPalette.foreground = { value: foregroundColor };

            taskRect = visualBuilder.taskRect.toArray().map($);
            taskProgress = visualBuilder.taskProgress.toArray().map($);
            taskLineRect = visualBuilder.taskLineRect.toArray().map($);

            axisTicksLine = visualBuilder.axisTicksLine.toArray().map($);
            axisTicksText = visualBuilder.axisTicksLine.toArray().map($);
            taskLabels = visualBuilder.taskLabels.toArray().map($);
            chartLine = visualBuilder.chartLine.toArray().map($);

        });

        it("should use high contrast mode colors", (done) => {
            visualBuilder.updateRenderTimeout(dataView, () => {
                expect(isColorAppliedToElements(chartLine, foregroundColor, "fill"));
                expect(isColorAppliedToElements(axisTicksLine, foregroundColor, "stroke"));
                expect(isColorAppliedToElements(axisTicksText, foregroundColor, "fill"));
                expect(isColorAppliedToElements(taskProgress, foregroundColor, "fill"));
                expect(isColorAppliedToElements(taskLabels, foregroundColor, "fill"));
                done();
            });
        });

        it("axis color and categories background should be taken from theme color", (done) => {
            visualBuilder.updateRenderTimeout(dataView, () => {
                expect(isColorAppliedToElements(taskLineRect, backgroundColor, "fill"));
                done();
            });
        });

        it("should not use fill for task rects", (done) => {
            visualBuilder.updateRenderTimeout(dataView, () => {
                expect(isColorAppliedToElements(taskRect, null, "fill"));
                expect(isColorAppliedToElements(taskRect, foregroundColor, "stroke"));
                expect(isColorAppliedToElements(taskRect, backgroundColor, "fill"));
                done();
            });
        });
    });

    describe("IsDateValid test", () => {
        it("test for valid Date", () => {
            let validDate = new Date();
            expect(isValidDate(validDate)).toBeTruthy();

            validDate = new Date(13425);
            expect(isValidDate(validDate)).toBeTruthy();
        });

        it("test for invalid Date", () => {
            const validDate = new Date("Hello");
            expect(isValidDate(validDate)).toBeFalsy();
        });
    });
});

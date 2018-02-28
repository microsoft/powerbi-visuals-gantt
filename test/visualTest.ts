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

/// <reference path="_references.ts"/>

module powerbi.extensibility.visual.test {
    // powerbi
    import DataView = powerbi.DataView;

    // powerbi.extensibility.visual.test
    import GanttData = powerbi.extensibility.visual.test.GanttData;
    import GanttBuilder = powerbi.extensibility.visual.test.GanttBuilder;

    // powerbi.extensibility.visual.Gantt1448688115699
    import VisualClass = powerbi.extensibility.visual.Gantt1448688115699.Gantt;

    // powerbi.extensibility.utils.test
    import clickElement = powerbi.extensibility.utils.test.helpers.clickElement;
    import assertColorsMatch = powerbi.extensibility.utils.test.helpers.color.assertColorsMatch;
    import mocks = powerbi.extensibility.utils.test.mocks;

    // powerbi.extensibility.utils.type
    import PixelConverter = powerbi.extensibility.utils.type.PixelConverter;

    // powerbi.extensibility.utils.formatting
    import valueFormatter = powerbi.extensibility.utils.formatting.valueFormatter;
    import IValueFormatter = powerbi.extensibility.utils.formatting.IValueFormatter;

    import LegendPosition = powerbi.extensibility.utils.chart.legend.LegendPosition;

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
    const millisecondsInADay: number  = 24 * 60 * 60 * 1000;

    describe("Gantt", () => {
        let visualBuilder: GanttBuilder,
            visualInstance: VisualClass,
            defaultDataViewBuilder: GanttData,
            dataView: DataView;

        beforeEach(() => {
            visualBuilder = new GanttBuilder(1000, 500);

            defaultDataViewBuilder = new GanttData();
            dataView = defaultDataViewBuilder.getDataView();

            visualInstance = visualBuilder.instance;
        });
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
                        .children("text")
                        .length;
                    let countOfTasks = visualBuilder.tasks.length;

                    expect(countOfTaskLabels).toEqual(dataView.table.rows.length);
                    expect(countOfTaskLines).toEqual(dataView.table.rows.length);
                    expect(countOfTasks).toEqual(dataView.table.rows.length);

                    done();
                });
            });

            it("Task Elements are presented in DOM if and only if task name is available (specified)", (done) => {
                dataView = defaultDataViewBuilder.getDataView([
                    GanttData.ColumnTask]);

                visualBuilder.updateRenderTimeout(dataView, () => {
                    expect(visualBuilder.tasks.length).not.toEqual(0);
                    done();
                });
            });

            it("When Task Element is Missing, empty viewport should be created", (done) => {
                dataView = defaultDataViewBuilder.getDataView([
                    GanttData.ColumnType,
                    GanttData.ColumnStartDate,
                    GanttData.ColumnDuration,
                    GanttData.ColumnResource,
                    GanttData.ColumnCompletePrecntege]);

                visualBuilder.updateRenderTimeout(dataView, () => {
                    let body = d3.select(visualBuilder.element.get(0));

                    expect(body.select(".axis").selectAll("*")[0].length).toEqual(1);
                    expect(body.select(".task-lines").selectAll("task-labels")[0].length).toEqual(0);
                    expect(body.select(".chart .tasks").selectAll("*")[0].length).toEqual(0);
                    done();
                });
            });

            it("When task duration is missing,  it should be set to 1", (done) => {
                dataView = defaultDataViewBuilder.getDataView([
                    GanttData.ColumnType,
                    GanttData.ColumnTask,
                    GanttData.ColumnStartDate,
                    GanttData.ColumnResource,
                    GanttData.ColumnCompletePrecntege]);

                visualBuilder.updateRenderTimeout(dataView, () => {
                    let tasks: Task[] = d3.select(visualBuilder.element.get(0)).selectAll(".task").data();

                    for (let task of tasks) {
                        expect(task.duration).toEqual(defaultTaskDuration);
                    }

                    done();
                });
            });

            it("When task duration is float and duration unit 'second',  it should be round", (done) => {
                defaultDataViewBuilder.valuesDuration = GanttData.getRandomUniqueNumbers(100, 1, 2, false);
                dataView = defaultDataViewBuilder.getDataView([
                    GanttData.ColumnType,
                    GanttData.ColumnTask,
                    GanttData.ColumnStartDate,
                    GanttData.ColumnResource,
                    GanttData.ColumnCompletePrecntege]);

                dataView.metadata.objects = {
                    general: {
                        durationUnit: "second"
                    }
                };

                visualBuilder.updateRenderTimeout(dataView, () => {
                    let tasks: Task[] = d3.select(visualBuilder.element.get(0)).selectAll(".task").data();

                    for (let task of tasks) {
                        expect(task.duration).toEqual(defaultTaskDuration);
                    }

                    done();
                });
            });

            it("When task start time is missing, it should be set to today date", (done) => {
                dataView = defaultDataViewBuilder.getDataView([
                    GanttData.ColumnType,
                    GanttData.ColumnTask,
                    GanttData.ColumnDuration,
                    GanttData.ColumnResource,
                    GanttData.ColumnCompletePrecntege]);

                visualBuilder.updateRenderTimeout(dataView, () => {
                    let tasks = d3.select(visualBuilder.element.get(0)).selectAll(".task").data();

                    for (let task of tasks) {
                        expect(task.start.toDateString()).toEqual(new Date(Date.now()).toDateString());
                    }

                    done();
                });
            });

            it("Task Resource is Missing, not shown on dom", (done) => {
                dataView = defaultDataViewBuilder.getDataView([
                    GanttData.ColumnType,
                    GanttData.ColumnTask,
                    GanttData.ColumnStartDate,
                    GanttData.ColumnDuration,
                    GanttData.ColumnCompletePrecntege]);

                visualBuilder.updateRenderTimeout(dataView, () => {
                    let resources = d3.select(visualBuilder.element.get(0)).selectAll(".task-resource")[0];
                    let returnResource = grep(resources);

                    expect(returnResource.length).toEqual(resources.length);
                    done();
                });
            });

            it("Task Completion is Missing, not shown on dom", (done) => {
                dataView = defaultDataViewBuilder.getDataView([
                    GanttData.ColumnType,
                    GanttData.ColumnTask,
                    GanttData.ColumnStartDate,
                    GanttData.ColumnDuration,
                    GanttData.ColumnResource]);

                visualBuilder.updateRenderTimeout(dataView, () => {
                    let progressOfTasks = d3.select(visualBuilder.element.get(0)).selectAll(".task-progress")[0];
                    let returnTasks = grep(progressOfTasks);

                    expect(progressOfTasks.length).toEqual(returnTasks.length);
                    done();
                });
            });

            it("Task Completion width is equal task width", (done) => {
                defaultDataViewBuilder.valuesCompletePrecntege = GanttData.getRandomUniqueNumbers(
                    defaultDataViewBuilder.valuesTaskTypeResource.length, 0, 100
                );

                defaultDataViewBuilder.valuesCompletePrecntege.forEach((value, index) => {
                    defaultDataViewBuilder.valuesCompletePrecntege[index] = value * 0.01;
                });

                dataView = defaultDataViewBuilder.getDataView([
                    GanttData.ColumnTask,
                    GanttData.ColumnStartDate,
                    GanttData.ColumnDuration,
                    GanttData.ColumnCompletePrecntege]);

                visualBuilder.updateRenderTimeout(dataView, () => {
                    let progressOfTasks = d3.select(visualBuilder.element.get(0)).selectAll(".task-progress")[0];
                    progressOfTasks.forEach((e, i) => {
                        let percent: number = defaultDataViewBuilder.valuesCompletePrecntege[i];
                        let widthOfTask: number = $(visualBuilder.taskRect[i]).attr("width");
                        let widthOfProgressTask: number = +$(e).attr("width");

                        expect(widthOfProgressTask).toEqual(widthOfTask * percent);
                    });

                    done();
                });
            });

            it("Verify task labels have tooltips", (done) => {
                defaultDataViewBuilder.valuesTaskTypeResource.forEach(x => x[1] = _.repeat(x[1] + " ", 5).trim());
                dataView = defaultDataViewBuilder.getDataView([
                    GanttData.ColumnTask,
                    GanttData.ColumnStartDate,
                    GanttData.ColumnDuration]);

                visualBuilder.updateRenderTimeout(dataView, () => {
                    let taskLabelsInDom = d3.select(visualBuilder.element.get(0)).selectAll(".label title")[0];
                    let taskLabels = d3.select(visualBuilder.element.get(0)).selectAll(".label").data();
                    let tasks: PrimitiveValue[] = dataView.categorical.categories[0].values;

                    for (let i = 0; i < tasks.length; i++) {
                        expect(taskLabels[i].name).toEqual((taskLabelsInDom[i] as Node).textContent);
                        expect(tasks[i]).toEqual((taskLabelsInDom[i] as Node).textContent);
                    }

                    done();
                });
            });

            it("Verify case if duration is not integer number", (done) => {
                defaultDataViewBuilder.valuesDuration = GanttData.getRandomUniqueNumbers(
                    defaultDataViewBuilder.valuesTaskTypeResource.length, 0, 20, false);
                dataView = defaultDataViewBuilder.getDataView([
                    GanttData.ColumnTask,
                    GanttData.ColumnStartDate,
                    GanttData.ColumnDuration]);

                dataView.metadata.objects = {
                    general: {
                        durationUnit: "day"
                    }
                };

                visualBuilder.updateRenderTimeout(dataView, () => {
                    let tasks: Task[] = d3.select(visualBuilder.element.get(0)).selectAll(".task").data();

                    for (let i in tasks) {
                        const newDuration: number = tasks[i].duration;
                        if (tasks[i].duration % 1 !== 0) {
                            newDuration =
                                VisualClass.transformDuration(defaultDataViewBuilder.valuesDuration[i], "minute", 2);
                        }

                        expect(tasks[i].duration).toEqual(newDuration);
                        expect(tasks[i].duration % 1 === 0).toBeTruthy();
                    }

                    done();
                });
            });

            it("Verify tooltips have extra information", (done) => {
                dataView = defaultDataViewBuilder.getDataView([
                    GanttData.ColumnTask,
                    GanttData.ColumnStartDate,
                    GanttData.ColumnDuration,
                    GanttData.ColumnExtraInformation]);

                visualBuilder.updateRenderTimeout(dataView, () => {
                    let tasks = d3.select(visualBuilder.element.get(0)).selectAll(".task").data();
                    let index = 0;
                    for (let task of tasks) {
                        for (let tooltipInfo of task.tooltipInfo) {
                            if (tooltipInfo.displayName === GanttData.ColumnExtraInformation) {
                                let value: VisualTooltipDataItem  = tooltipInfo.value;
                                expect(value).toEqual(defaultDataViewBuilder.valuesExtraInformation[index++]);
                            }
                        }
                    }

                    done();
                });
            });

            it("Verify sub tasks", (done) => {
                dataView = defaultDataViewBuilder.getDataView([
                    GanttData.ColumnTask,
                    GanttData.ColumnStartDate,
                    GanttData.ColumnDuration,
                    GanttData.ColumnParent]);

                visualBuilder.updateRenderTimeout(dataView, () => {
                    let tasks = d3.select(visualBuilder.element.get(0)).selectAll(".task").data();
                    expect(tasks.length).toEqual(defaultDataViewBuilder.valuesTaskTypeResource.length);

                    let parentIndex: number = 4;
                    let parentTask = visualBuilder.taskLabels.eq(parentIndex);
                    clickElement(parentTask);

                    const childTaskMarginLeft: number = +visualBuilder.taskLabels.eq(++parentIndex).attr("x");
                    expect(childTaskMarginLeft).toEqual(VisualClass.SubtasksLeftMargin);

                    childTaskMarginLeft = +visualBuilder.taskLabels.eq(++parentIndex).attr("x");
                    expect(childTaskMarginLeft).toEqual(VisualClass.SubtasksLeftMargin);

                    visualBuilder.updateRenderTimeout(dataView, () => {
                        tasks = d3.select(visualBuilder.element.get(0)).selectAll(".task").data();
                        expect(tasks.length).toEqual(defaultDataViewBuilder.valuesTaskTypeResource.length);
                    });

                    done();
                });
            });

            describe("Verify tooltips have no completion info", () => {
                function checkCompletionEqualNull(done: () => void) {
                    visualBuilder.updateRenderTimeout(dataView, () => {
                        let tasks = d3.select(visualBuilder.element.get(0)).selectAll(".task").data();
                        for (let task of tasks) {
                            for (let tooltipInfo of task.tooltipInfo) {
                                if (tooltipInfo.displayName === GanttData.ColumnCompletePrecntege) {
                                    expect(tooltipInfo.value).toEqual(null);
                                }
                            }
                        }

                        done();
                    });
                }

                it("TaskCompletion setting is switched off", (done) => {
                    dataView = defaultDataViewBuilder.getDataView([
                        GanttData.ColumnTask,
                        GanttData.ColumnStartDate,
                        GanttData.ColumnDuration,
                        GanttData.ColumnCompletePrecntege]);

                    dataView.metadata.objects = {
                        taskCompletion: {
                            show: false
                        }
                    };

                    checkCompletionEqualNull(done);
                });

                it("Completion data unavailable", (done) => {
                    dataView = defaultDataViewBuilder.getDataView([
                        GanttData.ColumnTask,
                        GanttData.ColumnStartDate,
                        GanttData.ColumnDuration]);

                    checkCompletionEqualNull(done);
                });
            });

            describe("Verify tooltips have info according 'parent' data", () => {
                function checkTasksHaveTooltipInfo(done: () => void) {
                    visualBuilder.updateRenderTimeout(dataView, () => {
                        let tasks = d3.select(visualBuilder.element.get(0)).selectAll(".task").data();
                        for (let task of tasks) {
                            expect(task.tooltipInfo.length).not.toEqual(0);
                        }

                        done();
                    });
                }

                it("With parent data", (done) => {
                    dataView = defaultDataViewBuilder.getDataView([
                        GanttData.ColumnTask,
                        GanttData.ColumnStartDate,
                        GanttData.ColumnDuration,
                        GanttData.ColumnParent]);

                    checkTasksHaveTooltipInfo(done);
                });

                it("Without parent data", (done) => {
                    dataView = defaultDataViewBuilder.getDataView([
                        GanttData.ColumnTask,
                        GanttData.ColumnStartDate,
                        GanttData.ColumnDuration]);

                    checkTasksHaveTooltipInfo(done);
                });
            });

            it("Verify Font Size set to default", (done) => {
                visualBuilder.updateRenderTimeout(dataView, () => {
                    let element = d3.select(visualBuilder.element.get(0));
                    let resources = element.selectAll(".task-resource").node();
                    let labels = element.selectAll(".label").node();

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
                            defaultDataViewBuilder.valuesStartDate = GanttData.getRandomUniqueDates(
                                defaultDataViewBuilder.valuesTaskTypeResource.length,
                                new Date(2017, 7, 0),
                                new Date(2017, 7, 1)
                            );
                            dataView = defaultDataViewBuilder.getDataView();
                            break;
                    }

                    dataView.metadata.objects = { dateType: { type: dateType } };

                    let host: IVisualHost = mocks.createVisualHost();
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

                defaultDataViewBuilder.valuesStartDate = GanttData.getRandomUniqueDates(
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
                let host: IVisualHost = mocks.createVisualHost();
                host.locale = host.locale || (<any>window.navigator).userLanguage || window.navigator["language"];
                let dateFormatter: IValueFormatter  = valueFormatter.create({format: null, cultureSelector: host.locale});

                let formattedDates: Date[] = [];
                for (let date of defaultDataViewBuilder.valuesStartDate) {
                    formattedDates.push(dateFormatter.format(date));
                }

                dataView = defaultDataViewBuilder.getDataView([
                    GanttData.ColumnTask,
                    GanttData.ColumnStartDate,
                    GanttData.ColumnDuration]);

                visualBuilder.updateRenderTimeout(dataView, () => {
                    let tasks = d3.select(visualBuilder.element.get(0)).selectAll(".task").data();
                    for (let task of tasks) {
                        for (let tooltipInfo of task.tooltipInfo) {
                            if (tooltipInfo.displayName === "Start Date") {
                                let value: VisualTooltipDataItem  = tooltipInfo.value;
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
                    let tasks = d3.select(visualBuilder.element.get(0)).selectAll(".task").data();
                    for (let task of tasks) {
                        for (let tooltipInfo of task.tooltipInfo) {
                            if (tooltipInfo.displayName === "Start Date") {
                                let value: VisualTooltipDataItem  = tooltipInfo.value;

                                expect(value).toMatch(/([a-z].)\s{1}([0-9]{2}),([0-9]{0,4})/);
                            }
                        }
                    }

                    done();
                });
            });

            it("Verify group tasks enabled", (done) => {
                dataView = defaultDataViewBuilder.getDataView([
                    GanttData.ColumnType,
                    GanttData.ColumnTask,
                    GanttData.ColumnStartDate,
                    GanttData.ColumnDuration]);

                dataView.metadata.objects = { general: { groupTasks: true } };

                visualBuilder.updateRenderTimeout(dataView, () => {
                    let countOfTaskLines = visualBuilder.mainElement
                        .children("g.task-lines")
                        .children("text")
                        .length;
                    let values = dataView.categorical.categories[1].values;

                    expect(values.length).toBeGreaterThan(_.uniq(values).length);
                    expect(countOfTaskLines).toEqual(_.uniq(values).length);

                    done();
                });
            });

            it("multi-selection test", () => {
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

        describe("Format settings test", () => {
            describe("General", () => {
                it("Scroll to current time", (done) => {
                    let todayDate = new Date();
                    let startDate = new Date();
                    let endDate = new Date();

                    startDate.setDate(todayDate.getDate() - datesAmountForScroll);
                    endDate.setDate(todayDate.getDate() + datesAmountForScroll);

                    defaultDataViewBuilder.valuesStartDate = GanttData.getRandomUniqueDates(
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
                            .data();

                        tasks.forEach(task => {
                            const dates: Date[] = d3
                                .time[durationUnit]
                                .range(task.start, task.end);
                            expect(dates.length).toEqual(task.duration);
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

                        visualBuilder.updateRenderTimeout(dataView, () => {
                            checkDurationUnit(durationUnit);
                            done();
                        });
                    });

                    it("hours", (done) => {
                        let durationUnit: string = "hour";
                        setDurationUnit(durationUnit);

                        visualBuilder.updateRenderTimeout(dataView, () => {
                            checkDurationUnit(durationUnit);
                            done();
                        });
                    });

                    it("minutes", (done) => {
                        let durationUnit: string = "minute";
                        setDurationUnit(durationUnit);

                        visualBuilder.updateRenderTimeout(dataView, () => {
                            checkDurationUnit(durationUnit);
                            done();
                        });
                    });

                    it("seconds", (done) => {
                        let durationUnit: string = "second";
                        setDurationUnit(durationUnit);

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
                    let color: string = GanttBuilder.getRandomHexColor();
                    dataView.metadata.objects = {
                        daysOff: {
                            show: true,
                            fill: GanttBuilder.getSolidColorStructuralObject(color)
                        }
                    };

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
                        visualBuilder.taskDaysOffRect.each((i, e) => {
                            let daysOff: TaskDaysOff = e.__data__.daysOff;
                            const amountOfWeekendDays: number = daysOff[1];
                            const firstDayOfWeek: Date =
                                new Date(daysOff[0].getTime() + (amountOfWeekendDays * millisecondsInADay));

                            expect(firstDayOfWeek.getDay()).toEqual(dayForCheck);
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

                        checkDaysOff(+day, done);
                    })(day));
                }

                it(`Verify end date of task is weekend date`, (done) => {
                    let startDate: Date = new Date(2017, 8, 29); // Its a last day of working week
                    let endDate: Date = new Date(2017, 8, 30);

                    defaultDataViewBuilder.valuesStartDate = GanttData.getRandomUniqueDates(
                        defaultDataViewBuilder.valuesTaskTypeResource.length,
                        startDate,
                        endDate
                    );
                    defaultDataViewBuilder.valuesDuration = GanttData.getRandomUniqueNumbers(
                        defaultDataViewBuilder.valuesTaskTypeResource.length, 30, 48);
                    dataView = defaultDataViewBuilder.getDataView();


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
                        GanttData.ColumnType,
                        GanttData.ColumnTask,
                        GanttData.ColumnStartDate,
                        GanttData.ColumnDuration,
                        GanttData.ColumnParent]);
                });

                it("inherit parent legend", (done) => {
                    dataView.metadata.objects = {
                        subTasks: {
                            inheritParentLegend: true
                        }
                    };

                    visualBuilder.updateRenderTimeout(dataView, () => {
                        let tasks = d3.select(visualBuilder.element.get(0)).selectAll(".task").data();
                        tasks.forEach((task) => {
                            if (task.parent) {
                                const parentName = task.parent.substr(0, task.parent.length - task.name.length - 1);
                                const parentTask: string = _.find(tasks, {name: parentName});
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
                        let tasks = d3.select(visualBuilder.element.get(0)).selectAll(".task").data();
                        let {parents, children} = getChildrenAndParents(tasks);

                        parents.forEach((parent: Task) => {
                            const start: Date = (_.minBy(children[parent.name],
                                (childTask: Task) => childTask.start)).start;
                            const end: Date = (_.maxBy(children[parent.name],
                                (childTask: Task) => childTask.end)).end;

                            expect(parent.start).toEqual(start);
                            expect(parent.end).toEqual(end);

                            const newDuration: number = d3.time["day"].range(start, end).length;
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
                        let tasks = d3.select(visualBuilder.element.get(0)).selectAll(".task").data();
                        let {parents, children} = getChildrenAndParents(tasks);

                        parents.forEach((parent: Task) => {
                            const childrenAverageCompletion: number = children[parent.name]
                                .reduce((prevValue, currentTask) => prevValue + currentTask.completion, 0) /
                                children[parent.name].length;

                            expect(parent.completion).toEqual(childrenAverageCompletion);

                        });

                        done();
                    });
                });

                function getChildrenAndParents(tasks: Task[]) {
                    let children: {[key: string]: Task[]} = {};
                    let parents: Task[] = [];
                    tasks.forEach((task) => {
                        if (task.parent) {
                            const parentName = task.parent.substr(0, task.parent.length - task.name.length - 1);
                            const parentTask: string = _.find(tasks, {name: parentName});
                            if (parentTask) {
                                if (!_.find(parents, {name: parentTask.name})) {
                                    parents.push(parentTask);
                                }

                                if (!children[parentTask.name]) {
                                    children[parentTask.name] = [];
                                }

                                children[parentTask.name].push(task);
                            }
                        }
                    });

                    return {parents, children};
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
                    let color: string = GanttBuilder.getRandomHexColor();
                    dataView.metadata.objects = {
                        taskResource: {
                            fill: GanttBuilder.getSolidColorStructuralObject(color)
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
                            expect(+e.attr("x")).toEqual(+taskRects[i].attr("x"));
                            expect(+e.attr("y")).toBeLessThan(+taskRects[i].attr("y"));
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
                it("color", (done) => {
                    let color: string = GanttBuilder.getRandomHexColor();
                    dataView.metadata.objects = {
                        taskCompletion: {
                            show: true,
                            fill: GanttBuilder.getSolidColorStructuralObject(color)
                        }
                    };

                    visualBuilder.updateRenderTimeout(dataView, () => {
                        visualBuilder.taskProgress.toArray().map($).forEach(e =>
                            assertColorsMatch(e.css("fill"), color));

                        done();
                    });
                });
            });

            describe("Task Settings", () => {
                it("color", (done) => {
                    dataView = defaultDataViewBuilder.getDataView([
                        GanttData.ColumnTask,
                        GanttData.ColumnStartDate,
                        GanttData.ColumnDuration,
                        GanttData.ColumnResource]);

                    let color: string = GanttBuilder.getRandomHexColor();
                    dataView.metadata.objects = {
                        taskConfig: {
                            fill: GanttBuilder.getSolidColorStructuralObject(color)
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
                        expect(visualBuilder.taskLabels).toBeInDOM();

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

                        done();
                    });
                });

                it("color", (done) => {
                    let color: string = GanttBuilder.getRandomHexColor();
                    dataView.metadata.objects = {
                        taskLabels: {
                            fill: GanttBuilder.getSolidColorStructuralObject(color)
                        }
                    };

                    visualBuilder.updateRenderTimeout(dataView, () => {
                        visualBuilder.taskLabels.toArray().map($).forEach(e =>
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
                            position: LegendPosition.Right
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
                    let color: string = GanttBuilder.getRandomHexColor();
                    dataView.metadata.objects = {
                        dateType: {
                            todayColor: GanttBuilder.getSolidColorStructuralObject(color)
                        }
                    };

                    checkColor(visualBuilder.chartLine, color, "stroke", done);
                });

                it("Axis color", (done) => {
                    let color: string = GanttBuilder.getRandomHexColor();
                    dataView.metadata.objects = {
                        dateType: {
                            axisColor: GanttBuilder.getSolidColorStructuralObject(color)
                        }
                    };

                    checkColor(visualBuilder.axisTicksLine, color, "stroke", done);
                });

                it("Axis text color", (done) => {
                    let color: string = GanttBuilder.getRandomHexColor();
                    dataView.metadata.objects = {
                        dateType: {
                            axisTextColor: GanttBuilder.getSolidColorStructuralObject(color)
                        }
                    };

                    checkColor(visualBuilder.axisTicksText, color, "fill", done);
                });

                function checkColor(
                    elements: Element[],
                    color: string,
                    cssStyle: string,
                    done: () => void): void {
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
    });
}

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

    // powerbi.extensibility.utils.formatting
    import valueFormatter = powerbi.extensibility.utils.formatting.valueFormatter;
    import IValueFormatter = powerbi.extensibility.utils.formatting.IValueFormatter;

    import LegendPosition = powerbi.extensibility.utils.chart.legend.LegendPosition;

    export enum GanttDateType {
        Day = <any>"Day",
        Week = <any>"Week",
        Month = <any>"Month",
        Year = <any>"Year"
    }

    const defaultTaskDuration: number = 1;

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

            it("Verify task labels have tooltips", (done) => {
                defaultDataViewBuilder.valuesTaskTypeResource.forEach(x => x[1] = _.repeat(x[1] + " ", 5).trim());
                dataView = defaultDataViewBuilder.getDataView();

                visualBuilder.updateRenderTimeout(dataView, () => {
                    let taskLabelsInDom = d3.select(visualBuilder.element.get(0)).selectAll(".label title")[0];
                    let taskLabels = d3.select(visualBuilder.element.get(0)).selectAll(".label").data();
                    let tasks: PrimitiveValue[] = dataView.categorical.categories[1].values;

                    for (let i = 0; i < tasks.length; i++) {
                        expect(taskLabels[i].name).toEqual((taskLabelsInDom[i] as Node).textContent);
                        expect(tasks[i]).toEqual((taskLabelsInDom[i] as Node).textContent);
                    }

                    done();
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

            for (let dateType in GanttDateType) {
                it(`Verify date format (${dateType})`, ((dateType) => (done) => {
                    dataView.metadata.objects = { dateType: { type: dateType } };

                    visualBuilder.updateRenderTimeout(dataView, () => {
                        visualBuilder.axisTicks.children("text").each((i, e) =>
                            expect($(e).text()).toEqual(valueFormatter.format(
                                new Date((<any>e).__data__),
                                VisualClass.DefaultValues.DateFormatStrings[dateType])));
                        done();
                    });
                })(dateType));
            }

            it("Verify date format for culture which user have chosen", (done) => {
                let host: IVisualHost = mocks.createVisualHost();
                host.locale = host.locale || (<any>window.navigator).userLanguage || window.navigator["language"];
                let dateFormatter: IValueFormatter  = valueFormatter.create({format: "d", cultureSelector: host.locale});

                let formattedDates: Date[] = [];
                for (let date of defaultDataViewBuilder.valuesStartDate) {
                    formattedDates.push(dateFormatter.format(date));
                }

                dataView = defaultDataViewBuilder.getDataView([
                    GanttData.ColumnTask,
                    GanttData.ColumnStartDate,
                    GanttData.ColumnDuration]);

                for (let dvColumn of dataView.metadata.columns) {
                    if (dataView.categorical.categories) {
                        for (let dvCategory of dataView.categorical.categories) {
                            if (dvCategory.source.roles && dvCategory.source.roles[GanttData.ColumnStartDate]) {
                                dvColumn.format = "d";
                            }
                        }
                    }
                }

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

            it("Verify group tasks enabled", (done) => {
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
            describe("Data labels", () => {
                beforeEach(() => {
                    dataView.metadata.objects = {
                        taskResource: {
                            show: true
                        }
                    };

                });

                it("show", (done) => {
                    dataView.metadata.objects = {
                        taskResource: {
                            show: true
                        }
                    };

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
            });

            describe("Task Completion", () => {
                beforeEach(() => {
                    dataView.metadata.objects = {
                        taskCompletion: {
                            show: true
                        }
                    };
                });

                it("color", (done) => {
                    let color: string = GanttBuilder.getRandomHexColor();
                    dataView.metadata.objects = {
                        taskCompletion: {
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
    });
}

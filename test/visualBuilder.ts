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

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;

import { VisualBuilderBase } from "powerbi-visuals-utils-testutils";
import { Task } from "../src/interfaces";
import { Gantt as VisualClass } from "../src/gantt";

interface TaskMockParamsInterface {
    id: number;
    name: string;
    parent: string;
    children: string[];
}

export class VisualBuilder extends VisualBuilderBase<VisualClass> {
    constructor(width: number, height: number) {
        super(width, height, "Gantt1448688115699");
    }

    protected build(options: VisualConstructorOptions) {
        return new VisualClass(options);
    }

    public get instance(): VisualClass {
        return this.visual;
    }

    public get body(): HTMLElement {
        return this.element.querySelector("div.gantt-body") as HTMLElement;
    }

    public get mainElement(): HTMLElement {
        return this.body.querySelector("svg.gantt") as HTMLElement;
    }

    public get collapseAllRect(): HTMLElement[] {
        return Array.from(this.mainElement.querySelectorAll("g.task-lines > g.collapse-all"));
    }

    public get collapseAllArrow(): HTMLElement[] {
        const arrows: HTMLElement[] = [];
        this.collapseAllRect.forEach((rect: HTMLElement) => {
            const arrowsNode: NodeListOf<HTMLElement> = rect.querySelectorAll(".collapse-all-arrow");
            arrowsNode.forEach((element: HTMLElement) => {
                arrows.push(element);
            });
          });

        return arrows;
    }

    public get axis(): HTMLElement {
        return this.mainElement.querySelector("g.axis") as HTMLElement;
    }

    public get axisBackgroundRect(): SVGElement {
        return this.axis.querySelector("rect") as SVGElement;
    }

    public get axisTicks(): NodeListOf<HTMLElement> {
        return this.axis.querySelectorAll("g.tick");
    }

    public get axisTicksLine(): SVGElement[] {
        const axisTicksLine: SVGLineElement[] = [];
        this.axisTicks.forEach((element: HTMLElement) => {
            const linesNode: NodeListOf<SVGLineElement> = element.querySelectorAll("line");
            axisTicksLine.forEach((element: SVGLineElement) => {
                axisTicksLine.push(element);
            });
        });

        return axisTicksLine;
    }

    public get axisTicksText(): SVGElement[] {
        const axisTicksText: SVGElement[] = [];
        this.axisTicks.forEach((element: HTMLElement) => {
            const textsNode: NodeListOf<SVGTextElement> = element.querySelectorAll("text");
            textsNode.forEach((element: SVGTextElement) => {
                axisTicksText.push(element);
            });
        });

        return axisTicksText;
    }

    public get chart(): HTMLElement {
        return this.mainElement.querySelector("g.chart") as HTMLElement;
    }

    public get chartLine(): HTMLElement[] {
        return Array.from(this.chart.querySelectorAll("line.chart-line"));
    }

    public get taskLines(): HTMLElement[] {
        return Array.from(this.mainElement.querySelectorAll("g.task-lines"));
    }

    public get taskLabels(): HTMLElement[] {
        const taskLabels: HTMLElement[] = [];
        this.taskLines.forEach((element: HTMLElement) => {
            const taskLabelsNode: NodeListOf<HTMLElement> = element.querySelectorAll("g.label");
            taskLabelsNode.forEach((element: HTMLElement) => {
                taskLabels.push(element);
            });
        });

        return taskLabels;
    }

    public get taskLabelsText(): HTMLElement[]  {
        const taskLabelsText: HTMLElement[] = [];
        this.taskLines.forEach((element: HTMLElement) => {
            const taskLabelsTextNode: NodeListOf<HTMLElement> = element.querySelectorAll("g.label text");
            taskLabelsTextNode.forEach((element: HTMLElement) => {
                taskLabelsText.push(element);
            });
        });

        return taskLabelsText;
    }

    public get taskLineRect(): HTMLElement[] {
        const taskLineRects: HTMLElement[] = [];
        this.taskLines.forEach((element: HTMLElement) => {
            const taskLinesRectNode: NodeListOf<HTMLElement> = element.querySelectorAll("rect.task-lines-rect");
            taskLinesRectNode.forEach((element: HTMLElement) => {
                taskLineRects.push(element);
            });
        });

        return taskLineRects;
    }

    public get tasksGroups(): HTMLElement[] {
        const tasksGroupsNodeList: NodeListOf<HTMLElement> = this.chart.querySelectorAll<HTMLElement>('g.tasks > g.task-group');
        return Array.from(tasksGroupsNodeList);
    }

    public get tasks(): HTMLElement[] {
        const tasks: HTMLElement[] = [];
        this.tasksGroups.forEach((element: HTMLElement) => {
            const tasksNode: NodeListOf<HTMLElement> = element.querySelectorAll("g.task");
            tasksNode.forEach((element: HTMLElement) => {
                tasks.push(element);
            });
        });

        return tasks;
    }

    public get taskLine(): HTMLElement[] {
        const taskLines: HTMLElement[] = [];
        this.tasks.forEach((element: HTMLElement) => {
            const tasksLineNode: NodeListOf<HTMLElement> = element.querySelectorAll("rect.task-lines");
            tasksLineNode.forEach((element: HTMLElement) => {
                taskLines.push(element);
            });
        });

        return taskLines;
    }

    public get taskDaysOffRect(): HTMLElement[] {
        const taskDaysOffRect: HTMLElement[] = [];
        this.tasks.forEach((element: HTMLElement) => {
            const taskDaysOffRectNode: NodeListOf<HTMLElement> = element.querySelectorAll("path.task-days-off");
            taskDaysOffRectNode.forEach((element: HTMLElement) => {
                taskDaysOffRect.push(element);
            });
        });

        return taskDaysOffRect;
    }

    public get milestones(): SVGElement[] {
        const taskMilestones: HTMLElement[] = [];
        this.tasks.forEach((element: HTMLElement) => {
            const taskMilestonesNode: NodeListOf<HTMLElement> = element.querySelectorAll("g.task-milestone");
            taskMilestonesNode.forEach((element: HTMLElement) => {
                taskMilestones.push(element);
            });
        });

        const paths: SVGPathElement[] = [];
        taskMilestones.forEach((element: HTMLElement) => {
            const pathsNode: NodeListOf<SVGPathElement> = element.querySelectorAll("path");
            pathsNode.forEach((element: SVGPathElement) => {
                paths.push(element);
            });
        });

        return paths;
    }

    public get taskRect(): HTMLElement[]  {
        const taskRects: HTMLElement[] = [];
        this.tasks.forEach((element: HTMLElement) => {
            const taskRectsNode: NodeListOf<HTMLElement> = element.querySelectorAll("path.task-rect");
            taskRectsNode.forEach((element: HTMLElement) => {
                taskRects.push(element);
            });
        });

        return taskRects;
    }

    public get taskResources(): HTMLElement[] {
        const taskResources: HTMLElement[] = [];
        this.tasks.forEach((element: HTMLElement) => {
            const taskResourcesNode: NodeListOf<HTMLElement> = element.querySelectorAll("text.task-resource");
            taskResourcesNode.forEach((element: HTMLElement) => {
                taskResources.push(element);
            });
        });

        return taskResources;
    }

    public get taskProgress(): HTMLElement[] {
        const taskProgress: HTMLElement[] = [];
        this.tasks.forEach((element: HTMLElement) => {
            const progressNode: NodeListOf<HTMLElement> = element.querySelectorAll("linearGradient.task-progress");
            progressNode.forEach((element: HTMLElement) => {
                taskProgress.push(element);
            });
        });

        return taskProgress;
    }

    public get legendGroup(): HTMLElement {
        return this.element.querySelector<HTMLElement>('.legend #legendGroup') as HTMLElement;
    }

    public downgradeDurationUnit(tasks: any, durationUnit: string) {
        VisualClass.downgradeDurationUnitIfNeeded(tasks, durationUnit);
    }

    public static getSolidColorStructuralObject(color: string): any {
        return { solid: { color: color } };
    }

    public static getTaskMockData(mockArray: object, mockCaseName: string): Task[] {
        return mockArray[mockCaseName]["data"];
    }

    public static getTaskMockExpected(mockArray: object, mockCaseName: string): Task[] {
        return mockArray[mockCaseName]["expected"];
    }

    private static generateTaskWithDefaultParams(taskMockParams: TaskMockParamsInterface) {
        return {
            id: taskMockParams.id,
            name: taskMockParams.name,
            start: new Date(),
            duration: 1,
            completion: 1,
            resource: "res",
            end: new Date(),
            parent: taskMockParams.parent,
            children: taskMockParams.children,
            visibility: true,
            taskType: "type",
            description: name,
            color: "red",
            tooltipInfo: [],
            extraInformation: [],
            daysOffList: [],
            wasDowngradeDurationUnit: true,
            stepDurationTransformation: 0
        };
    }

    private static generateMocksCase(taskMockParams: TaskMockParamsInterface[]) {
        let result = taskMockParams.map((taskMockParamsItem) => {
            return VisualBuilder.generateTaskWithDefaultParams(taskMockParamsItem);
        });

        return result;
    }

    public static getDowngradeDurationUnitMocks() {
        const GanttDurationUnitType = [
            "second",
            "minute",
            "hour",
            "day",
        ];

        let downgradeDurationUnitMock = {
            days: {
                "data": [
                    { "unit": GanttDurationUnitType.indexOf("day"), "duration": 1.5 },
                    { "unit": GanttDurationUnitType.indexOf("day"), "duration": 0.84 }
                ],
                "expected": [
                    "hour",
                    "second"
                ]
            },
            hours: {
                "data": [
                    { "unit": GanttDurationUnitType.indexOf("hour"), "duration": 0.05 },
                    { "unit": GanttDurationUnitType.indexOf("hour"), "duration": 0.005 }
                ],
                "expected": [
                    "minute",
                    "second"
                ]
            },
            minutes: {
                "data": [
                    { "unit": GanttDurationUnitType.indexOf("minute"), "duration": 0.01 }
                ],
                "expected": [
                    "second"
                ]
            },
            seconds: {
                "data": [
                    { "unit": GanttDurationUnitType.indexOf("second"), "duration": 0.5 }
                ],
                "expected": [
                    "second"
                ]
            }
        };

        return downgradeDurationUnitMock;
    }

    public static getTaskMockCommon() {
        let taskMock = {
            taskWithCorrectParentsMock: {
                "data": VisualBuilder.generateMocksCase([
                    { id: 1, name: "T1", parent: "T1", children: [] },
                    { id: 2, name: "Group C", parent: "Group C", children: ["T2"] },
                    { id: 3, name: "T2", parent: "Group C.T2", children: [] }
                ]),
                "expected": VisualBuilder.generateMocksCase([
                    { id: 1, name: "T1", parent: "", children: [] },
                    { id: 2, name: "Group C", parent: "", children: ["T2"] },
                    { id: 3, name: "T2", parent: "Group C", children: [] }
                ])
            },
            taskWithNotExistentParentsMock: {
                "data": VisualBuilder.generateMocksCase([
                    { id: 1, name: "T1", parent: "T1", children: [] },
                    { id: 2, name: "Group C", parent: "Group C", children: [] },
                    { id: 3, name: "T2", parent: "Group A.T2", children: [] },
                    { id: 4, name: "T3", parent: "Group B.T3", children: [] }
                ]),
                "expected": VisualBuilder.generateMocksCase([
                    { id: 1, name: "T1", parent: "", children: [] },
                    { id: 2, name: "Group C", parent: "", children: [] },
                    { id: 3, name: "T2", parent: "", children: [] },
                    { id: 4, name: "T3", parent: "", children: [] }
                ])
            },
            taskWithNotExistentMiddleParentsMock: {
                "data": VisualBuilder.generateMocksCase([
                    { id: 1, name: "T1", parent: "T1", children: [] },
                    { id: 2, name: "Group C", parent: "Group C", children: ["T2"] },
                    { id: 3, name: "T2", parent: "Group C.Group M.T2", children: [] }
                ]),
                "expected": VisualBuilder.generateMocksCase([
                    { id: 1, name: "T1", parent: "", children: [] },
                    { id: 2, name: "Group C", parent: "", children: ["T2"] },
                    { id: 3, name: "T2", parent: "Group C", children: [] }
                ])
            }
        };

        return taskMock;
    }
}

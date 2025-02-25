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
import { DurationUnit } from "../src/enums";

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

    public get body(): HTMLDivElement | null {
        return this.element.querySelector("div.gantt-body");
    }

    public get mainElement(): SVGSVGElement | null {
        return this.body?.querySelector("svg.gantt") || null;
    }

    public get collapseAllRect(): SVGGElement | null {
        return this.mainElement?.querySelector<SVGGElement>("g.collapse-all") || null;
    }

    public get collapseAllArrow(): SVGSVGElement | null {
        return this.collapseAllRect?.querySelector<SVGSVGElement>("svg.collapse-all-arrow") || null;
    }

    public get axis(): SVGGElement | null {
        return this.mainElement?.querySelector("g.axis") || null;
    }

    public get axisBackgroundRect(): SVGRectElement | null {
        return this.axis?.querySelector("rect") || null;
    }

    public get axisTicks(): SVGGElement[] {
        if (!this.axis) {
            return [];
        }

        return Array.from(this.axis.querySelectorAll("g.tick"));
    }

    public get axisTicksLine(): SVGLineElement[] {
        return this.axisTicks.map((element) => element.querySelector("line")!);
    }

    public get axisTicksText(): SVGTextElement[] {
        return this.axisTicks.map((element) => element.querySelector("text")!);
    }

    public get chart(): SVGGElement | null {
        return this.mainElement?.querySelector("g.chart") || null;
    }

    public get chartLine(): SVGLineElement[] {
        if (!this.chart) {
            return [];
        }
        return Array.from(this.chart.querySelectorAll("line.chart-line"));
    }

    public get taskLines(): SVGGElement | null {
        return this.mainElement?.querySelector("g.task-lines") || null;
    }

    public get taskLabels(): SVGGElement[] {
        if (!this.taskLines) {
            return [];
        }

        return Array.from(this.taskLines.querySelectorAll("g.label"));
    }

    public get taskLabelsText(): SVGTextElement[] {
        return this.taskLabels.map((element) => element.querySelector("text")!);
    }

    public get taskLineRect(): SVGRectElement | null {
        return this.taskLines?.querySelector("rect.task-lines-rect") || null;
    }

    public get tasksGroups(): SVGGElement[] {
        if (!this.chart) return [];

        const tasks = this.chart.querySelector<SVGGElement>("g.tasks");
        if (!tasks) return [];

        const taskGroups = tasks.querySelectorAll<SVGGElement>("g.task-group");
        return Array.from(taskGroups);
    }

    public get tasks(): SVGGElement[] {
        return this.tasksGroups.map((element) => element.querySelector<SVGGElement>("g.task")!);
    }

    public get taskDaysOffRect(): (SVGPathElement | null)[] {
        return this.tasks.map((element) => element.querySelector<SVGPathElement>("path.task-days-off"));
    }

    public get milestones(): (SVGPathElement | null)[] {
        const milestones = this.tasks
            .map((element) => element.querySelector<SVGGElement>("g.task-milestone")?.querySelectorAll("path"))
            .filter((element) => element != null);

        const paths = milestones.reduce((acc: SVGPathElement[], curr: NodeListOf<SVGPathElement>) => acc.concat(Array.from(curr)), []);
        return paths;
    }

    public get taskRect(): (SVGPathElement | null)[] {
        return this.tasks.map((element) => element.querySelector<SVGPathElement>("path.task-rect"));
    }

    public get taskResources(): SVGTextElement[] {
        const resources = this.tasks.map((element) => element.querySelectorAll<SVGTextElement>("text.task-resource"));
        const result = resources.reduce((acc: SVGTextElement[], curr: NodeListOf<SVGTextElement>) => acc.concat(Array.from(curr)), []);
        return result;
    }

    public get taskProgress(): SVGLinearGradientElement[] {
        const gradients = this.tasks.map((element) => element.querySelectorAll<SVGLinearGradientElement>("linearGradient.task-progress"));
        const result = gradients.reduce((acc: SVGLinearGradientElement[], curr: NodeListOf<SVGLinearGradientElement>) => acc.concat(Array.from(curr)), []);
        return result;
    }

    public get legendGroup(): SVGGElement | null {
        return this.element.querySelector('.legend #legendGroup');
    }

    public downgradeDurationUnit(tasks: any, durationUnit: DurationUnit) {
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
        const GanttDurationUnitType: DurationUnit[] = [
            DurationUnit.Second,
            DurationUnit.Minute,
            DurationUnit.Hour,
            DurationUnit.Day,
        ];

        const downgradeDurationUnitMock = {
            days: {
                "data": [
                    { "unit": GanttDurationUnitType.indexOf(DurationUnit.Day), "duration": 1.5 },
                    { "unit": GanttDurationUnitType.indexOf(DurationUnit.Day), "duration": 0.84 }
                ],
                "expected": [
                    DurationUnit.Hour,
                    DurationUnit.Second
                ]
            },
            hours: {
                "data": [
                    { "unit": GanttDurationUnitType.indexOf(DurationUnit.Hour), "duration": 0.05 },
                    { "unit": GanttDurationUnitType.indexOf(DurationUnit.Hour), "duration": 0.005 }
                ],
                "expected": [
                    DurationUnit.Minute,
                    DurationUnit.Second
                ]
            },
            minutes: {
                "data": [
                    { "unit": GanttDurationUnitType.indexOf(DurationUnit.Minute), "duration": 0.01 }
                ],
                "expected": [
                    DurationUnit.Second
                ]
            },
            seconds: {
                "data": [
                    { "unit": GanttDurationUnitType.indexOf(DurationUnit.Second), "duration": 0.5 }
                ],
                "expected": [
                    DurationUnit.Second
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

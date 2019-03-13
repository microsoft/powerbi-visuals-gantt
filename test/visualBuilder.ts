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
import * as _ from "lodash";

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;

import { VisualBuilderBase, getRandomNumber } from "powerbi-visuals-utils-testutils";
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

    public get body() {
        return this.element
            .children("div.gantt-body");
    }

    public get mainElement() {
        return this.body
            .children("svg.gantt");
    }

    public get collapseAllRect() {
        return this.mainElement
            .children("g.task-lines")
            .children("g.collapse-all");
    }

    public get collapseAllArrow() {
        return this.collapseAllRect
            .children(".collapse-all-arrow");
    }

    public get chartLine() {
        return this.chart
            .children("line.chart-line");
    }

    public get axis() {
        return this.mainElement
            .children("g.axis");
    }

    public get axisBackgroundRect() {
        return this.axis
            .children("rect");
    }

    public get axisTicks() {
        return this.axis
            .children("g.tick");
    }

    public get axisTicksLine() {
        return this.axisTicks
            .children("line");
    }

    public get axisTicksText() {
        return this.axisTicks
            .children("text");
    }

    public get chart() {
        return this.mainElement
            .children("g.chart");
    }

    public get taskLine() {
        return this.tasks
            .children("rect.task-lines");
    }

    public get taskLineRect() {
        return this.mainElement
            .children("g.task-lines")
            .children("rect.task-lines-rect");
    }

    public get taskDaysOffRect() {
        return this.tasks
            .children("rect.task-days-off");
    }

    public get taskLabels() {
        return this.mainElement
            .children("g.task-lines")
            .children("g.label");
    }

    public get taskLabelsText() {
        return this.mainElement
            .children("g.task-lines")
            .find("g.label text");
    }

    public get tasksGroups() {
        return this.chart
            .children("g.tasks")
            .children("g.task-group");
    }

    public get tasks() {
        return this.tasksGroups
            .children("g.task");
    }


    public get taskRect() {
        return this.tasks
            .children("rect.task-rect");
    }

    public get taskResources() {
        return this.tasks
            .children("text.task-resource");
    }

    public get taskProgress() {
        return this.tasks
            .children("rect.task-progress");
    }

    public get legendGroup() {
        return this.element
            .children("svg.legend")
            .children("g#legendGroup");
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

    public static getRandomHexColor(): string {
        return VisualBuilder.getHexColorFromNumber(VisualBuilder.getRandomInteger(0, 16777215 + 1));
    }

    public static getHexColorFromNumber(value: number) {
        let hex = value.toString(16).toUpperCase();
        return "#" + (hex.length === 6 ? hex : _.range(0, 6 - hex.length, 0).join("") + hex);
    }

    public static getRandomInteger(min: number, max: number, exceptionList?: number[]): number {
        return getRandomNumber(max, min, exceptionList, Math.floor);
    }
}

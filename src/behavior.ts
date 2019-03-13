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
import * as d3 from "d3";
import * as _ from "lodash";

type Selection<T1, T2 = T1> = d3.Selection<any, T1, any, T2>;

import { interactivityService } from "powerbi-visuals-utils-interactivityutils";
import IInteractiveBehavior = interactivityService.IInteractiveBehavior;
import IInteractivityService = interactivityService.IInteractivityService;
import ISelectionHandler = interactivityService.ISelectionHandler;

import { Task, GroupedTask } from "./interfaces";

export const DimmedOpacity: number = 0.4;
export const DefaultOpacity: number = 1.0;

export function getFillOpacity(
    selected: boolean,
    highlight: boolean,
    hasSelection: boolean,
    hasPartialHighlights: boolean
): number {
    if ((hasPartialHighlights && !highlight) || (hasSelection && !selected)) {
        return DimmedOpacity;
    }

    return DefaultOpacity;
}

export interface BehaviorOptions {
    clearCatcher: Selection<any>;
    taskSelection: Selection<Task>;
    legendSelection: Selection<any>;
    interactivityService: IInteractivityService;
    subTasksCollapse: {
        selection: Selection<any>;
        callback: (groupedTask: GroupedTask) => void;
    };
    allSubtasksCollapse: {
        selection: Selection<any>;
        callback: () => void;
    };
}

export class Behavior implements IInteractiveBehavior {
    private options: BehaviorOptions;

    public bindEvents(options: BehaviorOptions, selectionHandler: ISelectionHandler) {
        this.options = options;

        const {
            clearCatcher,
        } = options;

        options.taskSelection.on("click", (dataPoint: Task) => {
            const event: MouseEvent = d3.event as MouseEvent;
            selectionHandler.handleSelection(dataPoint, event.ctrlKey);

            event.stopPropagation();
        });

        options.legendSelection.on("click", (d: any) => {
            if (!d.selected) {
                selectionHandler.handleSelection(d, true);
                (d3.event as MouseEvent).stopPropagation();

                let selectedType: string = d.tooltip;
                options.taskSelection.each((d: Task) => {
                    if (d.taskType === selectedType && d.parent && !d.selected) {
                        selectionHandler.handleSelection(d, true);
                    }
                });
            } else {
                selectionHandler.handleClearSelection();
            }
        });

        options.subTasksCollapse.selection.on("click", (d: GroupedTask) => {
            if (!_.flatten(d.tasks.map(task => task.children)).length) {
                return;
            }

            (d3.event as MouseEvent).stopPropagation();
            options.subTasksCollapse.callback(d);
        });

        options.allSubtasksCollapse.selection.on("click", () => {
            (d3.event as MouseEvent).stopPropagation();
            options.allSubtasksCollapse.callback();
        });

        clearCatcher.on("click", () => {
            selectionHandler.handleClearSelection();
        });
    }

    public renderSelection(hasSelection: boolean) {
        const {
            taskSelection,
            interactivityService,
        } = this.options;

        const hasHighlights: boolean = interactivityService.hasSelection();

        taskSelection.style("opacity", (dataPoint: Task) => {
            return getFillOpacity(
                dataPoint.selected,
                dataPoint.highlight,
                !dataPoint.highlight && hasSelection,
                !dataPoint.selected && hasHighlights
            );
        });
    }
}

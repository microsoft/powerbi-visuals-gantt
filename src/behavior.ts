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
import { Selection as d3Selection } from 'd3-selection';

import ISelectionId = powerbi.visuals.ISelectionId;
import ISelectionManager = powerbi.extensibility.ISelectionManager;

import { Task, GroupedTask } from "./interfaces";
import { LegendDataPoint } from "powerbi-visuals-utils-chartutils/lib/legend/legendInterfaces";

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

export function getLegendFillOpacity(selected: boolean, hasSelection: boolean): number {
    if ((hasSelection && !selected)) {
        return DimmedOpacity;
    }

    return DefaultOpacity;
}

export interface BaseDataPoint {
    selected: boolean;
}

export interface SelectableDataPoint extends BaseDataPoint {
    identity: ISelectionId;
    specificIdentity?: ISelectionId;
}


export interface BehaviorOptions {
    dataPoints: Task[];
    legendDataPoints: LegendDataPoint[];
    hasHighlights: boolean;
    clearCatcher: d3Selection<HTMLElement, null, null, undefined>;
    taskSelection: d3Selection<SVGGElement, Task, any, any>;
    legendSelection: d3Selection<SVGGElement, LegendDataPoint, any, any>;
    subTasksCollapse: {
        selection: d3Selection<SVGGElement, GroupedTask, any, any>;
        callback: (groupedTask: GroupedTask) => void;
    };
    allSubTasksCollapse: {
        selection: d3Selection<SVGGElement, any, any, any>;
        arrowSelection: d3Selection<SVGRectElement, any, any, any>;
        callback: () => void;
    };
}

export class Behavior {
    private selectionManager: ISelectionManager;
    private options: BehaviorOptions;

    constructor(selectionManager: ISelectionManager) {
        this.selectionManager = selectionManager;
    }

    public get isInitialized(): boolean {
        return !!this.options;
    }

    public bindEvents(options: BehaviorOptions) {
        this.options = options;

        this.applySelectionStateToDataPoints();

        this.handleClickEvents();
        this.handleContextMenuEvents();
        this.handleKeyboardEvents();
    }

    public get hasSelection(): boolean {
        return this.selectionManager.hasSelection();
    }

    private handleClickEvents(): void {
        this.options.taskSelection.on("click", (event: MouseEvent, dataPoint: Task) => {
            event.stopPropagation();
            this.selectDataPoint(dataPoint, event.ctrlKey || event.metaKey || event.shiftKey);
        });

        this.options.legendSelection.on("click", (event: MouseEvent, dataPoint: LegendDataPoint) => {
            event.stopPropagation();
            this.selectDataPoint(dataPoint, event.ctrlKey || event.metaKey || event.shiftKey);
        });

        this.options.subTasksCollapse.selection.on("click", (event: MouseEvent, dataPoint: GroupedTask) => {
            if (!dataPoint.tasks.map(task => task.children).flat().length) {
                return;
            }
            event.stopPropagation();
            this.options.subTasksCollapse.callback(dataPoint);
        });

        this.options.allSubTasksCollapse.selection.on("click", (event: MouseEvent) => {
            event.stopPropagation();
            this.options.allSubTasksCollapse.callback();
        });

        this.options.clearCatcher.on("click", () => {
            this.clear();
        });
    }

    private handleContextMenuEvents(): void {
        this.options.taskSelection.on("contextmenu", (event: MouseEvent, dataPoint: Task) => {
            event.preventDefault();
            event.stopPropagation();
            this.selectionManager.showContextMenu(dataPoint? dataPoint.identity: {}, {
                x: event.clientX,
                y: event.clientY,
            });
        });

        this.options.legendSelection.on("contextmenu", (event: MouseEvent, dataPoint: LegendDataPoint) => {
            event.preventDefault();
            event.stopPropagation();
            this.selectionManager.showContextMenu(dataPoint ? dataPoint.identity: {}, {
                x: event.clientX,
                y: event.clientY,
            });
        });

        this.options.clearCatcher.on("contextmenu", (event: MouseEvent) => {
            event.preventDefault();
            event.stopPropagation();
            this.selectionManager.showContextMenu(null, {
                x: event.clientX,
                y: event.clientY,
            });
        });
    }

    private handleKeyboardEvents(): void {
        this.options.taskSelection.on("keydown", (event: KeyboardEvent, dataPoint: Task) => {
            if (event.code === "Enter" || event.code === "Space") {
                event.preventDefault();
                this.selectDataPoint(dataPoint, event.ctrlKey || event.metaKey || event.shiftKey);
            }
        });

        this.options.subTasksCollapse.selection.on("keydown", (event: KeyboardEvent, dataPoint: GroupedTask) => {
            if (event.code === "Enter" || event.code === "Space") {
                event.stopPropagation();
                event.preventDefault();

                if (!dataPoint.tasks.map(task => task.children).flat().length) {
                    return;
                }
                this.options.subTasksCollapse.callback(dataPoint);
            }
        });

        this.options.allSubTasksCollapse.arrowSelection.on("keydown", (event: KeyboardEvent) => {
                if (event.code === "Enter" || event.code === "Space") {
                    event.stopPropagation();
                    event.preventDefault();
                    this.options.allSubTasksCollapse.callback();
                }
            });
    }

    public renderSelection(hasHighlights?: boolean): void {
        const hasSelection = this.hasSelection;
        const hasHighlightsValue = hasHighlights || this.options.hasHighlights;

        this.options.taskSelection.style("opacity", (dataPoint: Task) => getFillOpacity(
            dataPoint.selected,
            dataPoint.highlight,
            hasSelection,
            hasHighlightsValue,
        ));

        const legendHasSelection = this.options.legendDataPoints.some((dataPoint: LegendDataPoint) => dataPoint.selected);
        this.options.legendSelection.style("opacity", (dataPoint: LegendDataPoint) => getLegendFillOpacity(dataPoint.selected, legendHasSelection));
    }

    private clear(): void {
        this.selectionManager.clear();
        this.onSelectCallback();
    }

    private selectDataPoint(dataPoint: SelectableDataPoint, multiSelect: boolean): void {
        const selectionIdsToSelect: ISelectionId[] = [dataPoint.identity];
        this.selectionManager.select(selectionIdsToSelect, multiSelect);
        this.onSelectCallback();
    }

    private onSelectCallback(selectionIds?: ISelectionId[]): void {
        this.applySelectionStateToDataPoints(selectionIds);
        this.renderSelection();
    }

    private applySelectionStateToDataPoints(selectionIds?: ISelectionId[]): void {
        const selectedIds: ISelectionId[] = selectionIds || <ISelectionId[]>this.selectionManager.getSelectionIds();
        this.setSelectedToDataPoints(this.options.dataPoints, selectedIds);
        this.setSelectedToDataPoints(this.options.legendDataPoints, selectedIds);
    }

    private setSelectedToDataPoints(dataPoints: SelectableDataPoint[] | LegendDataPoint[], ids: ISelectionId[]): void {
        dataPoints.forEach((dataPoint: SelectableDataPoint | LegendDataPoint) => {
            dataPoint.selected = this.isDataPointSelected(dataPoint, ids);
        });
    }

    private isDataPointSelected(dataPoint: SelectableDataPoint | LegendDataPoint, selectedIds: ISelectionId[]): boolean {
        return selectedIds.some((selectedId: ISelectionId) => selectedId.includes(<ISelectionId>dataPoint.identity));
    }
}

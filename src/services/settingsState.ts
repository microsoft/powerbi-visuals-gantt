/**
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

import { MilestoneDataPoint, UniqueMilestones } from "../interfaces";

export interface SettingsToPersist {
    fill: powerbi.Fill;
    shapeType: string;
}

export interface ISettingsState {
    [milestoneName: string]: SettingsToPersist;
}

export class SettingsState {
    private state: ISettingsState = {};
    private tempState: ISettingsState = {};

    public get hasBeenUpdated(): boolean {
        return !this.areStatesEqual(
            this.state,
            { ...this.state, ...this.tempState },
        );
    }

    public setMilestonesSettings(milestones: UniqueMilestones): void {
        if (Object.keys(milestones).length === 0) {
            return;
        }

        Object.values(milestones).forEach((milestone: MilestoneDataPoint) => {
            if (!milestone.name || this.tempState[milestone.name]) {
                return;
            }

            this.tempState[milestone.name] = {
                fill: { solid: { color: milestone.color } },
                shapeType: milestone.shapeType
            };
        });
    }

    public getMilestoneSettings(name: string): powerbi.DataViewObjects {
        if (!name || !this.state[name]) {
            return {};
        }
        const milestone: SettingsToPersist = this.state[name];

        return {
            milestones: {
                fill: milestone?.fill,
                shapeType: milestone?.shapeType
            }
        }
    }

    public reset() {
        this.tempState = {};
        this.state = {};
    }

    public save(): ISettingsState {
        const state: ISettingsState = {
            ...this.state,
            ...this.tempState,
        };

        this.reset();

        return state;
    }

    public parse(settings: string): void {
        this.reset();

        const val = JSON.parse(settings || "{}") as ISettingsState;
        this.state = val || {};
    }

    private areStatesEqual(oldState: ISettingsState, newState: ISettingsState): boolean {
        try {
            return JSON.stringify(oldState) === JSON.stringify(newState);
        } catch (e) {
            console.warn("Error comparing states:", e);
            return false;
        }
    }
}

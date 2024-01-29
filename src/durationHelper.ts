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

import {DurationUnit} from "./enums/durationUnit";
import ILocalizationManager = powerbi.extensibility.ILocalizationManager;

const GanttDurationUnitType = [
    DurationUnit.Second,
    DurationUnit.Minute,
    DurationUnit.Hour,
    DurationUnit.Day,
];

const HoursInADay: number = 24;
const MinutesInAHour: number = 60;
const SecondsInAMinute: number = 60;
const MinutesInADay: number = 24 * MinutesInAHour;
const SecondsInADay: number = 60 * MinutesInADay;
const SecondsInAHour: number = MinutesInAHour * SecondsInAMinute;

export class DurationHelper {

    public static getNewUnitByFloorDuration(durationUnitTypeIndex: number, duration: number): DurationUnit {
        if (!durationUnitTypeIndex)
            return GanttDurationUnitType[0];

        switch (durationUnitTypeIndex) {
            case GanttDurationUnitType.indexOf(DurationUnit.Day):
                duration = duration * HoursInADay;
                break;
            case GanttDurationUnitType.indexOf(DurationUnit.Hour):
                duration = duration * MinutesInAHour;
                break;
            case GanttDurationUnitType.indexOf(DurationUnit.Minute):
                duration = duration * SecondsInAMinute;
                break;
        }

        if ((duration - Math.floor(duration) !== 0) && durationUnitTypeIndex > 1) {
            return DurationHelper.getNewUnitByFloorDuration(durationUnitTypeIndex - 1, duration);
        } else {
            return GanttDurationUnitType[durationUnitTypeIndex - 1];
        }
    }

    public static downgradeDurationUnit(durationUnit: DurationUnit, duration: number): DurationUnit {
        const durationUnitTypeIndex = GanttDurationUnitType.indexOf(durationUnit);
        // if duration == 0.84 day, we need transform duration to minutes in order to get duration without extra loss
        durationUnit = DurationHelper.getNewUnitByFloorDuration(durationUnitTypeIndex, duration);

        return durationUnit;
    }

    public static transformExtraDuration(
        durationUnit: DurationUnit,
        duration: number): number {
        switch (durationUnit) {
            case DurationUnit.Hour:
                return HoursInADay * duration;

            case DurationUnit.Minute:
                return MinutesInADay * duration;

            case DurationUnit.Second:
                return SecondsInADay * duration;

            default:
                return duration;
        }

    }

    public static transformDuration(
        duration: number,
        newDurationUnit: DurationUnit,
        stepDurationTransformation: number): number {

        if (stepDurationTransformation === null || typeof stepDurationTransformation === "undefined") {
            return Math.floor(duration);
        }

        let transformedDuration: number = duration;
        switch (newDurationUnit) {
            case DurationUnit.Hour:
                transformedDuration = duration * HoursInADay;
                break;
            case DurationUnit.Minute:
                transformedDuration = duration * (stepDurationTransformation === 2
                    ? MinutesInADay
                    : MinutesInAHour);
                break;
            case DurationUnit.Second:
                transformedDuration = duration * (stepDurationTransformation === 3 ? SecondsInADay
                    : stepDurationTransformation === 2 ? SecondsInAHour
                        : SecondsInAMinute);
                break;
        }

        return Math.floor(transformedDuration);
    }

    /**
     * Generate 'Duration' label for tooltip
     * @param duration The duration of task
     * @param durationUnit The duration unit for chart
     * @param localizationManager managers which returns localized strings
     */
    public static generateLabelForDuration(
        duration: number,
        durationUnit: DurationUnit,
        localizationManager: ILocalizationManager): string {

        let oneDayDuration: number = HoursInADay;
        let oneHourDuration: number = MinutesInAHour;
        let oneMinuteDuration: number = 1;
        switch (durationUnit) {
            case DurationUnit.Hour:
                oneHourDuration = 1;
                break;
            case DurationUnit.Minute:
                oneDayDuration = MinutesInADay;
                break;
            case DurationUnit.Second:
                oneDayDuration = SecondsInADay;
                oneHourDuration = SecondsInAHour;
                oneMinuteDuration = SecondsInAMinute;
                break;
        }

        let label: string = "";
        const days: number = Math.floor(duration / oneDayDuration);
        label += days ? `${days} ${localizationManager.getDisplayName("Visual_DurationUnit_Days")} ` : ``;
        if (durationUnit === DurationUnit.Day) {
            return `${duration} ${localizationManager.getDisplayName("Visual_DurationUnit_Days")} `;
        }

        let timeDelta: number = days * oneDayDuration;
        const hours: number = Math.floor((duration - timeDelta) / oneHourDuration);
        label += hours ? `${hours} ${localizationManager.getDisplayName("Visual_DurationUnit_Hours")} ` : ``;
        if (durationUnit === DurationUnit.Hour) {
            return duration >= 24
                ? label
                : `${duration} ${localizationManager.getDisplayName("Visual_DurationUnit_Hours")}`;
        }

        timeDelta = (days * oneDayDuration) + (hours * oneHourDuration);
        const minutes: number = Math.floor((duration - timeDelta) / oneMinuteDuration);
        label += minutes ? `${minutes} ${localizationManager.getDisplayName("Visual_DurationUnit_Minutes")} ` : ``;
        if (durationUnit === DurationUnit.Minute) {
            return duration >= 60
                ? label
                : `${duration} ${localizationManager.getDisplayName("Visual_DurationUnit_Minutes")} `;
        }

        timeDelta = (days * oneDayDuration) + (hours * oneHourDuration) + (minutes * oneMinuteDuration);
        const seconds: number = Math.floor(duration - timeDelta);
        label += seconds ? `${seconds} ${localizationManager.getDisplayName("Visual_DurationUnit_Seconds")} ` : ``;
        if (durationUnit === DurationUnit.Second) {
            return duration >= 60
                ? label
                : `${duration} ${localizationManager.getDisplayName("Visual_DurationUnit_Seconds")} `;
        }
    }
}

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
import { timeSecond as d3TimeSecond, timeMinute as d3TimeMinute, timeHour as d3TimeHour, timeDay as d3TimeDay } from "d3-time";

import { RgbColor, parseColorString } from "powerbi-visuals-utils-colorutils";

import {DurationUnit} from "../../src/enums";

export function areColorsEqual(firstColor: string, secondColor: string): boolean {
    const firstConvertedColor: RgbColor = parseColorString(firstColor),
        secondConvertedColor: RgbColor = parseColorString(secondColor);

    return firstConvertedColor.R === secondConvertedColor.R
        && firstConvertedColor.G === secondConvertedColor.G
        && firstConvertedColor.B === secondConvertedColor.B;
}

export function isColorAppliedToElements(
    elements: (SVGElement | null)[],
    color?: string,
    colorStyleName: string = "fill"
): boolean {
    return elements.some((element: SVGElement | null) => {
        if (element == null) {
            return;
        }

        const currentColor: string = element.style.getPropertyValue(colorStyleName);

        if (!currentColor || !color) {
            return currentColor === color;
        }

        return areColorsEqual(currentColor, color);
    });
}

/**
* Calculates date from startDate date till endDate for different durationUnits
*/
export function getEndDate(durationUnit: DurationUnit, startDate: Date, endDate: Date): Date[] {
    switch (durationUnit) {
        case DurationUnit.Second:
            return d3TimeSecond.range(startDate, endDate);
        case DurationUnit.Minute:
            return d3TimeMinute.range(startDate, endDate);
        case DurationUnit.Hour:
            return d3TimeHour.range(startDate, endDate);
        default:
            return d3TimeDay.range(startDate, endDate);
    }
}

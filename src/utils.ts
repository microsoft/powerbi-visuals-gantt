import * as _ from "lodash";
import { getRandomNumber } from "powerbi-visuals-utils-testutils";

export const drawRoundedRectByPath = (x: number, y: number, width: number, height: number, radius: number) => {
    if (!width || !height) {
        return;
    }
    return "M" + x + "," + y
        + "h" + (width - 2 * radius)
        + "a" + radius + "," + radius + " 0 0 1 " + radius + "," + radius
        + "v" + (height - 2 * radius)
        + "a" + radius + "," + radius + " 0 0 1 " + -radius + "," + radius
        + "h" + (2 * radius - width)
        + "a" + radius + "," + radius + " 0 0 1 " + -radius + "," + -radius
        + "v" + (2 * radius - height)
        + "a" + radius + "," + radius + " 0 0 1 " + radius + "," + -radius
        + "z";
};

export const drawNotRoundedRectByPath = (x: number, y: number, width: number, height: number) => {
    if (!width || !height) {
        return;
    }
    return "M" + x + "," + y
        + "h" + width
        + "v" + height
        + "h" + (- width)
        + "v" + (- height)
        + "z";
};

export function drawRectangle(taskConfigHeight: number): string {
    const startPositions: number = -2;
    return `M ${startPositions} 5 H ${taskConfigHeight / 1.8} V ${taskConfigHeight / 1.5} H ${startPositions} Z`;
}

export function drawCircle(taskConfigHeight: number): string {
    const r = taskConfigHeight / 3, cx = taskConfigHeight / 4, cy = taskConfigHeight / 2;
    return `M ${cx} ${cy}  m -${r}, 0 a ${r}, ${r} 0 1,0 ${r * 2},0 a ${r},${r} 0 1,0 -${r * 2},0`;
}

export function drawDiamond(taskConfigHeight: number): string {
    return `M ${taskConfigHeight / 4} 0 ${taskConfigHeight / 2} ${taskConfigHeight / 2} ${taskConfigHeight / 4} ${taskConfigHeight} 0 ${taskConfigHeight / 2} Z`;
}

export function getRandomHexColor(): string {
    return getHexColorFromNumber(getRandomInteger(0, 16777215 + 1));
}

export function getHexColorFromNumber(value: number) {
    let hex = value.toString(16).toUpperCase();
    return "#" + (hex.length === 6 ? hex : _.range(0, 6 - hex.length, 0).join("") + hex);
}

export function getRandomInteger(min: number, max: number, exceptionList?: number[]): number {
    return getRandomNumber(max, min, exceptionList, Math.floor);
}

export function isValidDate(date: Date): boolean {
    if (Object.prototype.toString.call(date) !== "[object Date]") {
        return false;
    }

    return !isNaN(date.getTime());
}

export function isStringNotNullEmptyOrUndefined(str: string) {
    const isReducableType = typeof str === "string" || typeof str === "number" || typeof str === "boolean";
    return str && isReducableType;
}

export function hashCode(s) {
    let h;
    for (let i = 0; i < s.length; i++) {
        h = Math.imul(31, h) + s.charCodeAt(i) | 0;
    }
    return h;
}
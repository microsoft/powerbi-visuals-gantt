import { getRandomNumber } from "powerbi-visuals-utils-testutils";
import lodashRange from "lodash.range";

export const drawRoundedRectByPath = (x: number, y: number, width: number, height: number, radius: number) => {
    if (!width || !height) {
        return undefined;
    }
    const r = radius;

    return `
    M${x},${y}
    h${width - 2 * r}
    a${r},${r} 0 0 1 ${r},${r}
    v${height - 2 * r}
    a${r},${r} 0 0 1 ${-r},${r}
    h${2 * r - width}
    a${r},${r} 0 0 1 ${-r},${-r}
    v${2 * r - height}
    a${r},${r} 0 0 1 ${r},${-r}
    z
    `;
};

export const drawNotRoundedRectByPath = (x: number, y: number, width: number, height: number) => {
    if (!width || !height) {
        return undefined;
    }
    return `
    M${x},${y}
    h${width}
    v${height}
    h${-width}
    v${-height}z
    `;
};

export function drawRectangle(taskConfigHeight: number): string {
    const startPositions: number = -2;
    return `M ${startPositions} 5 H ${taskConfigHeight / 1.8} V ${taskConfigHeight / 1.5} H ${startPositions} Z`;
}

export function drawCircle(taskConfigHeight: number): string {
    const r: number = taskConfigHeight / 3, cx: number = taskConfigHeight / 4, cy: number = taskConfigHeight / 2;
    return `M ${cx} ${cy}  m -${r}, 0 a ${r}, ${r} 0 1,0 ${r * 2},0 a ${r},${r} 0 1,0 -${r * 2},0`;
}

export function drawDiamond(taskConfigHeight: number): string {
    return `M ${taskConfigHeight / 4} 0 ${taskConfigHeight / 2} ${taskConfigHeight / 2} ${taskConfigHeight / 4} ${taskConfigHeight} 0 ${taskConfigHeight / 2} Z`;
}

export function getRandomHexColor(): string {
    return getHexColorFromNumber(getRandomInteger(0, 16777215 + 1));
}

export function getHexColorFromNumber(value: number) {
    const hex: string = value.toString(16).toUpperCase();
    return "#" + (hex.length === 6 ? hex : lodashRange(0, 6 - hex.length, 0).join("") + hex);
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
    const isReducableType: boolean = typeof str === "string" || typeof str === "number" || typeof str === "boolean";
    return str && isReducableType;
}

export function hashCode(s) {
    let h: number;
    for (let i = 0; i < s.length; i++) {
        h = Math.imul(31, h) + s.charCodeAt(i) | 0;
    }
    return h;
}

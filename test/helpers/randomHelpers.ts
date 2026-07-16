import { getRandomNumber } from "powerbi-visuals-utils-testutils";
import lodashRange from "lodash.range";

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

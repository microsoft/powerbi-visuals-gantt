export function isValidDate(date: Date): boolean {
    if (Object.prototype.toString.call(date) !== "[object Date]") {
        return false;
    }

    return !isNaN(date.getTime());
}

export function isDayOff(date: Date, firstDayOfWeek: number): boolean {
    return isFirstDayOff(date, firstDayOfWeek) || isSecondDayOff(date, firstDayOfWeek);
}

export function isFirstDayOff(date: Date, firstDayOfWeek: number): boolean {
    return date.getDay() === (+firstDayOfWeek + 5) % 7;
}

export function isSecondDayOff(date: Date, firstDayOfWeek: number): boolean {
    return date.getDay() === (+firstDayOfWeek + 6) % 7;
}

export function isOneDay(firstDate: Date, secondDate: Date): boolean {
    return firstDate.getMonth() === secondDate.getMonth() && firstDate.getFullYear() === secondDate.getFullYear()
        && firstDate.getDay() === secondDate.getDay();
}
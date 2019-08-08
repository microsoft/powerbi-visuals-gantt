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
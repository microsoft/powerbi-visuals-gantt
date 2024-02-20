import { Selection as d3Selection, BaseType as d3BaseType } from "d3-selection";

export const drawMinusButton = (selection: d3Selection<SVGElement, any, any, any>, color: string) => {
    selection
        .append("g")
        .append("path")
        .attr("d", "M20,17h-8c-0.5522461,0-1-0.4472656-1-1s0.4477539-1,1-1h8c0.5522461,0,1,0.4472656,1,1S20.5522461,17,20,17z")
        .attr("fill", color);
    selection
        .append("g")
        .append("path")
        .attr("d", `M24.71875,29H7.28125C4.9204102,29,3,27.0791016,3,24.71875V7.28125C3,4.9208984,4.9204102,3,7.28125,3h17.4375
    C27.0795898, 3, 29, 4.9208984, 29, 7.28125v17.4375C29, 27.0791016, 27.0795898, 29, 24.71875, 29z M7.28125, 5
        C6.0234375, 5, 5, 6.0234375, 5, 7.28125v17.4375C5, 25.9765625, 6.0234375, 27, 7.28125, 27h17.4375
            C25.9765625, 27, 27, 25.9765625, 27, 24.71875V7.28125C27, 6.0234375, 25.9765625, 5, 24.71875, 5H7.28125z`)
        .attr("fill", color);
};

export const drawPlusButton = (selection: d3Selection<SVGElement, any, any, any>, color: string) => {
    selection
        .append("g")
        .append("path")
        .attr("d", `M24.71875,29H7.28125C4.9204102,29,3,27.0791016,3,24.71875V7.28125C3,4.9208984,4.9204102,3,7.28125,3h17.4375
    C27.0795898,3,29,4.9208984,29,7.28125v17.4375C29,27.0791016,27.0795898,29,24.71875,29z M7.28125,5
        C6.0234375,5,5,6.0234375,5,7.28125v17.4375C5,25.9765625,6.0234375,27,7.28125,27h17.4375
            C25.9765625,27,27,25.9765625,27,24.71875V7.28125C27,6.0234375,25.9765625,5,24.71875,5H7.28125z`)
        .attr("fill", color);

    selection
        .append("g")
        .append("path")
        .attr("d", "M16,21c-0.5522461,0-1-0.4472656-1-1v-8c0-0.5527344,0.4477539-1,1-1s1,0.4472656,1,1v8 C17,20.5527344,16.5522461,21,16,21z")
        .attr("fill", color);
    selection
        .append("g")
        .append("path")
        .attr("d", "M20,17h-8c-0.5522461,0-1-0.4472656-1-1s0.4477539-1,1-1h8c0.5522461,0,1,0.4472656,1,1S20.5522461,17,20,17z")
        .attr("fill", color);
};

export const drawExpandButton = (selection: d3Selection<d3BaseType, any, any, any>, color: string) => {
    selection
        .append("path")
        .attr("d", "M33.17 17.17l-9.17 9.17-9.17-9.17-2.83 2.83 12 12 12-12z")
        .attr("fill", color);

    selection
        .append("path")
        .attr("d", "M0 0h48v48h-48z")
        .attr("fill", "none");
};

export const drawCollapseButton = (selection: d3Selection<d3BaseType, any, any, any>, color: string) => {
    selection
        .append("path")
        .attr("d", "M24 16l-12 12 2.83 2.83 9.17-9.17 9.17 9.17 2.83-2.83z")
        .attr("fill", color);

    selection
        .append("path")
        .attr("d", "M0 0h48v48h-48z")
        .attr("fill", "none");
};
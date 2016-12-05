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

/// <reference path="_references.ts"/>

module powerbi.extensibility.visual.test {
    // powerbi
    import DataView = powerbi.DataView;

    // powerbi.extensibility.visual.test
    import SankeyDiagramData = powerbi.extensibility.visual.test.SankeyDiagramData;
    import SankeyDiagramBuilder = powerbi.extensibility.visual.test.SankeyDiagramBuilder;

    // powerbi.extensibility.visual.SankeyDiagram1446463184954
    import VisualClass = powerbi.extensibility.visual.SankeyDiagram1446463184954.SankeyDiagram;
    import SankeyDiagramNode = powerbi.extensibility.visual.SankeyDiagram1446463184954.SankeyDiagramNode;
    import SankeyDiagramColumn = powerbi.extensibility.visual.SankeyDiagram1446463184954.SankeyDiagramColumn;

    // powerbi.extensibility.utils.test
    import clickElement = powerbi.extensibility.utils.test.helpers.clickElement;
    import renderTimeout = powerbi.extensibility.utils.test.helpers.renderTimeout;
    import getRandomNumbers = powerbi.extensibility.utils.test.helpers.getRandomNumbers;
    import assertColorsMatch = powerbi.extensibility.utils.test.helpers.color.assertColorsMatch;

    interface SankeyDiagramTestsNode {
        x: number;
        inputWeight: number;
        outputWeight: number;
    }

    describe("SankeyDiagram", () => {
        let visualBuilder: SankeyDiagramBuilder,
            visualInstance: VisualClass,
            defaultDataViewBuilder: SankeyDiagramData,
            dataView: DataView;

        beforeEach(() => {
            visualBuilder = new SankeyDiagramBuilder(1000, 500);

            defaultDataViewBuilder = new SankeyDiagramData();
            dataView = defaultDataViewBuilder.getDataView();

            visualInstance = visualBuilder.instance;
        });

        describe("getPositiveNumber", () => {
            it("positive value should be positive value", () => {
                let positiveValue: number = 42;

                expect(visualInstance.getPositiveNumber(positiveValue)).toBe(positiveValue);
            });

            it("negative value should be 0", () => {
                expect(visualInstance.getPositiveNumber(-42)).toBe(0);
            });

            it("Infinity value should be 0", () => {
                expect(visualInstance.getPositiveNumber(Infinity)).toBe(0);
            });

            it("-Infinity should be 0", () => {
                expect(visualInstance.getPositiveNumber(-Infinity)).toBe(0);
            });

            it("NaN should be 0", () => {
                expect(visualInstance.getPositiveNumber(NaN)).toBe(0);
            });

            it("undefined should be 0", () => {
                expect(visualInstance.getPositiveNumber(undefined)).toBe(0);
            });

            it("null should be 0", () => {
                expect(visualInstance.getPositiveNumber(null)).toBe(0);
            });
        });

        describe("sortNodesByX", () => {
            it("nodes should be sorted correctly", () => {
                let xValues: number[],
                    nodes: SankeyDiagramNode[];

                xValues = [42, 13, 52, 182, 1e25, 1, 6, 3, 4];

                nodes = createNodes(xValues);

                xValues.sort((x: number, y: number) => {
                    return x - y;
                });

                visualInstance.sortNodesByX(nodes).forEach((node: SankeyDiagramNode, index: number) => {
                    expect(node.x).toBe(xValues[index]);
                });
            });

            function createNodes(xValues: number[]): SankeyDiagramNode[] {
                return xValues.map((xValue: number) => {
                    return {
                        label: {
                            name: "",
                            formattedName: "",
                            width: 0,
                            height: 0,
                            color: ""
                        },
                        inputWeight: 0,
                        outputWeight: 0,
                        links: [],
                        x: xValue,
                        y: 0,
                        width: 0,
                        height: 0,
                        colour: "",
                        selectionIds: [],
                        tooltipData: []
                    };
                });
            }
        });

        describe("getColumns", () => {
            it("getColumns", () => {
                let testNodes: SankeyDiagramTestsNode[];

                testNodes = [
                    { x: 0, inputWeight: 15, outputWeight: 14 },
                    { x: 1, inputWeight: 10, outputWeight: 5 },
                    { x: 2, inputWeight: 15, outputWeight: 13 },
                    { x: 3, inputWeight: 42, outputWeight: 28 }
                ];

                visualInstance.getColumns(createNodes(testNodes))
                    .forEach((column: SankeyDiagramColumn, index: number) => {
                        expect(column.countOfNodes).toBe(1);

                        expect(column.sumValueOfNodes).toBe(testNodes[index].inputWeight);
                    });
            });

            function createNodes(testNodes: SankeyDiagramTestsNode[]): SankeyDiagramNode[] {
                return testNodes.map((testNode: SankeyDiagramTestsNode) => {
                    return {
                        label: {
                            name: "",
                            formattedName: "",
                            width: 0,
                            height: 0,
                            color: ""
                        },
                        inputWeight: testNode.inputWeight,
                        outputWeight: testNode.outputWeight,
                        links: [],
                        x: testNode.x,
                        y: 0,
                        width: 0,
                        height: 0,
                        colour: "",
                        selectionIds: [],
                        tooltipData: []
                    };
                });
            }
        });

        describe("getMaxColumn", () => {
            it("getMaxColumn should return { sumValueOfNodes: 0, countOfNodes: 0 }", () => {
                let maxColumn: SankeyDiagramColumn;

                maxColumn = visualInstance.getMaxColumn([]);

                expect(maxColumn.countOfNodes).toBe(0);
                expect(maxColumn.sumValueOfNodes).toBe(0);
            });

            it("getMaxColumn should return { sumValueOfNodes: 0, countOfNodes: 0 } when columns are null", () => {
                let maxColumn: SankeyDiagramColumn;

                maxColumn = visualInstance.getMaxColumn([
                    undefined,
                    null
                ]);

                expect(maxColumn.countOfNodes).toBe(0);
                expect(maxColumn.sumValueOfNodes).toBe(0);
            });

            it("getMaxColumn should return max column", () => {
                let maxColumn: SankeyDiagramColumn,
                    columns: SankeyDiagramColumn[];

                maxColumn = { countOfNodes: 35, sumValueOfNodes: 21321 };

                columns = [
                    { countOfNodes: 15, sumValueOfNodes: 500 },
                    { countOfNodes: 25, sumValueOfNodes: 42 },
                    maxColumn
                ];

                expect(visualInstance.getMaxColumn(columns)).toBe(maxColumn);
            });
        });

        describe("DOM tests", () => {
            it("main element created", () => {
                expect(visualBuilder.mainElement[0]).toBeInDOM();
            });

            it("update", (done) => {
                visualBuilder.updateRenderTimeout(dataView, () => {
                    const sourceCategories: PrimitiveValue[] = dataView.categorical.categories[0].values,
                        destinationCategories: PrimitiveValue[] = dataView.categorical.categories[1].values;

                    expect(visualBuilder.linksElement).toBeInDOM();
                    expect(visualBuilder.linkElements.length).toBe(sourceCategories.length);

                    let uniqueCountries: string[] = sourceCategories
                        .concat(destinationCategories)
                        .sort()
                        .filter((value: PrimitiveValue, index: number, array: PrimitiveValue[]) => {
                            return !index || value !== array[index - 1];
                        }) as string[];

                    expect(visualBuilder.nodesElement).toBeInDOM();
                    expect(visualBuilder.nodeElements.length).toEqual(uniqueCountries.length);

                    done();
                });
            });

            it("nodes labels on", (done) => {
                dataView.metadata.objects = {
                    labels: {
                        show: true
                    }
                };

                visualBuilder.updateRenderTimeout(dataView, () => {
                    const display: string = visualBuilder.nodesElement
                        .find("text")
                        .first()
                        .css("display");

                    expect(display).toBe("block");

                    done();
                });
            });

            it("nodes labels off", (done) => {
                dataView.metadata.objects = {
                    labels: {
                        show: false
                    }
                };

                visualBuilder.updateRenderTimeout(dataView, () => {
                    const display: string = visualBuilder.nodesElement
                        .find("text")
                        .first()
                        .css("display");

                    expect(display).toBe("none");

                    done();
                });
            });

            it("nodes labels change color", (done) => {
                const color: string = "#123123";

                dataView.metadata.objects = {
                    labels: {
                        fill: { solid: { color } }
                    }
                };

                visualBuilder.updateRenderTimeout(dataView, () => {
                    const fill: string = visualBuilder.nodesElement
                        .find("text")
                        .first()
                        .css("fill");

                    assertColorsMatch(fill, color);
                    done();
                });
            });

            it("link change color", done => {
                const color: string = "#E0F600";

                dataView.categorical.categories[0].objects = [{
                    links: {
                        fill: { solid: { color } }
                    }
                }];

                visualBuilder.updateRenderTimeout(dataView, () => {
                    const currentColor: string = visualBuilder.linksElement
                        .find(".link")
                        .first()
                        .css("stroke");

                    assertColorsMatch(currentColor, color);

                    done();
                });
            });

            it("nodes labels are not overlapping", done => {

                visualBuilder.updateRenderTimeout(dataView, () => {
                    const textElement: JQuery = visualBuilder.nodesElement.find("text"),
                        firstNode: string = textElement.first().text(),
                        secondNode: string = textElement.last().text(),
                        thirdNode: string = textElement.eq(4).text();

                    expect(firstNode).toBe("Brazil");
                    expect(secondNode).toBe("Morocco");
                    expect(thirdNode).toBe("Portugal");

                    done();
                });
            });

            describe("selection and deselection", () => {
                const selectionSelector: string = ".selected";

                it("nodes", (done) => {
                    visualBuilder.updateRenderTimeout(dataView, () => {
                        const node: JQuery = visualBuilder.nodeElements.first();

                        expect(visualBuilder.nodeElements.filter(selectionSelector)).not.toBeInDOM();
                        clickElement(node);

                        renderTimeout(() => {
                            expect(node.filter(selectionSelector)).not.toBeInDOM();
                            expect(visualBuilder.nodeElements.filter(selectionSelector)).toBeInDOM();

                            clickElement(node);
                            renderTimeout(() => {
                                expect(visualBuilder.nodeElements.filter(selectionSelector)).not.toBeInDOM();

                                done();
                            });
                        });
                    });
                });

                it("links", (done) => {
                    visualBuilder.updateRenderTimeout(dataView, () => {
                        const link: JQuery = visualBuilder.linkElements.first();

                        expect(visualBuilder.linkElements.filter(selectionSelector)).not.toBeInDOM();
                        clickElement(link);

                        renderTimeout(() => {
                            expect(link.filter(selectionSelector)).toBeInDOM();
                            expect(visualBuilder.linkElements.not(link).filter(selectionSelector)).not.toBeInDOM();

                            clickElement(link);
                            renderTimeout(() => {
                                expect(visualBuilder.linkElements.filter(selectionSelector)).not.toBeInDOM();
                                done();
                            });
                        });
                    });
                });

                it("multi-selection test", () => {
                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    let firstGroup: JQuery = visualBuilder.linkElements.eq(0),
                        secondGroup: JQuery = visualBuilder.linkElements.eq(1),
                        thirdGroup: JQuery = visualBuilder.linkElements.eq(2);

                    clickElement(firstGroup);
                    clickElement(secondGroup, true);

                    expect(firstGroup.is(selectionSelector)).toBeTruthy();
                    expect(secondGroup.is(selectionSelector)).toBeTruthy();
                    expect(thirdGroup.is(selectionSelector)).toBeFalsy();
                });
            });

            describe("data rendering", () => {
                it("negative and zero values", done => {
                    let dataLength: number = defaultDataViewBuilder.valuesSourceDestination.length,
                        groupLength = Math.floor(dataLength / 3) - 2,
                        negativeValues = getRandomNumbers(groupLength, -100, 0),
                        zeroValues = _.range(0, groupLength, 0),
                        positiveValues = getRandomNumbers(
                            dataLength - negativeValues.length - zeroValues.length, 1, 100);

                    defaultDataViewBuilder.valuesValue = negativeValues.concat(zeroValues).concat(positiveValues);

                    visualBuilder.updateRenderTimeout([defaultDataViewBuilder.getDataView()], () => {
                        expect(visualBuilder.linkElements.length).toBe(positiveValues.length);

                        done();
                    });
                });
            });
        });
    });
}

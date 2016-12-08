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
    // powerbi.extensibility.utils.test
    import VisualBuilderBase = powerbi.extensibility.utils.test.VisualBuilderBase;

    // Gantt1448688115699
    import VisualClass = powerbi.extensibility.visual.Gantt1448688115699.Gantt;
    import VisualPlugin = powerbi.visuals.plugins.Gantt1448688115699;

    export class GanttBuilder extends VisualBuilderBase<VisualClass> {
        constructor(width: number, height: number) {
            super(width, height, VisualPlugin.name);
        }

        protected build(options: VisualConstructorOptions) {
            return new VisualClass(options);
        }

        public get instance(): VisualClass {
            return this.visual;
        }

        public get mainElement(): JQuery {
            return this.element.children("svg.gantt");
        }

        public get nodesElement(): JQuery {
            return this.mainElement
                .children("g")
                .children("g.nodes");
        }

        public get nodeElements(): JQuery {
            return this.nodesElement.children("g.node");
        }

        public get linksElement(): JQuery {
            return this.mainElement
                .children("g")
                .children("g.links");
        }

        public get linkElements(): JQuery {
            return this.linksElement.children("path.link");
        }
    }
}

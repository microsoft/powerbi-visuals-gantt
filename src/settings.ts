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

module powerbi.extensibility.visual {

    export class GanttSettings {
        public static get Default() {
            return new this();
        }

        public static parse(dataView: DataView, capabilities: VisualCapabilities) {
            var settings = new this();
            if (!dataView || !dataView.metadata || !dataView.metadata.objects) {
                return settings;
            }

            var properties = this.getProperties(capabilities);
            for (var objectKey in capabilities.objects) {
                for (var propKey in capabilities.objects[objectKey].properties) {
                    if (!settings[objectKey] || !_.has(settings[objectKey], propKey)) {
                        continue;
                    }

                    var type = capabilities.objects[objectKey].properties[propKey].type;
                    var getValueFn = this.getValueFnByType(type);
                    settings[objectKey][propKey] = getValueFn(
                        dataView.metadata.objects,
                        properties[objectKey][propKey],
                        settings[objectKey][propKey]);
                }
            }

            return settings;
        }

        public static getProperties(capabilities: VisualCapabilities):
            { [i: string]: { [i: string]: DataViewObjectPropertyIdentifier } } & {
                general: { formatString: DataViewObjectPropertyIdentifier },
                dataPoint: { fill: DataViewObjectPropertyIdentifier }
            } {
            var objects = _.merge({
                general: { properties: { formatString: {} } }
            }, capabilities.objects);
            var properties = <any>{};
            for (var objectKey in objects) {
                properties[objectKey] = {};
                for (var propKey in objects[objectKey].properties) {
                    properties[objectKey][propKey] = <DataViewObjectPropertyIdentifier>{
                        objectName: objectKey,
                        propertyName: propKey
                    };
                }
            }

            return properties;
        }

        public static createEnumTypeFromEnum(type: any): IEnumType {
            var even: any = false;
            return createEnumType(Object.keys(type)
                .filter((key, i) => ((!!(i % 2)) === even && type[key] === key
                    && !void (even = !even)) || (!!(i % 2)) !== even)
                .map(x => <IEnumMember>{ value: x, displayName: x }));
        }

        private static getValueFnByType(type: powerbi.data.DataViewObjectPropertyTypeDescriptor) {
            switch (_.keys(type)[0]) {
                case "fill":
                    return DataViewObjects.getFillColor;
                default:
                    return DataViewObjects.getValue;
            }
        }

        public static enumerateObjectInstances(
            settings = new this(),
            options: EnumerateVisualObjectInstancesOptions,
            capabilities: VisualCapabilities): ObjectEnumerationBuilder {

            var enumeration = new ObjectEnumerationBuilder();
            var object = settings && settings[options.objectName];
            if (!object) {
                return enumeration;
            }

            var instance = <VisualObjectInstance>{
                objectName: options.objectName,
                selector: null,
                properties: {}
            };

            for (var key in object) {
                if (_.has(object, key)) {
                    instance.properties[key] = object[key];
                }
            }

            enumeration.pushInstance(instance);
            return enumeration;
        }

        public originalSettings: GanttSettings;
        public createOriginalSettings(): void {
            this.originalSettings = _.cloneDeep(this);
        }

        //Default Settings
        public general = {
            groupTasks: false
        };
        public legend = {
            show: true,
            position: legendPosition.right,
            showTitle: true,
            titleText: "",
            labelColor: "#000000",
            fontSize: 8,
        };
        public taskLabels = {
            show: true,
            fill: "#000000",
            fontSize: 9,
            width: 110,
        };
        public taskCompletion = {
            show: true,
            fill: "#000000",
        };
        public taskResource = {
            show: true,
            fill: "#000000",
            fontSize: 9,
        };
        public dateType = {
            type: GanttDateType.Week
        };
    }
}

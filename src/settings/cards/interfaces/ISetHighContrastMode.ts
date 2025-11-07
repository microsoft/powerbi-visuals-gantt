import { ColorHelper } from "powerbi-visuals-utils-colorutils";

export interface ISetHighContrastMode {
    /**
     * Sets the high contrast mode for colorPickers.
     * @param colorHelper - A ColorHelper used to set high contrast mode.
     */
    setHighContrastMode(colorHelper: ColorHelper): void;
}
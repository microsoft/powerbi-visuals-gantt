import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import { LegendDataPoint } from "powerbi-visuals-utils-chartutils/lib/legend/legendInterfaces";
import { ColorHelper } from "powerbi-visuals-utils-colorutils";

import ILocalizationManager = powerbi.extensibility.ILocalizationManager;

import Model = formattingSettings.Model;

import { GeneralCardSettings } from "./cards/generalCard";
import { CollapsedTasksCardSettings } from "./cards/task/collapsedTasksCard";
import { CollapsedTasksUpdateIdCardSettings } from "./cards/task/collapsedTasksUpdateIdCard";
import { DaysOffCardSettings } from "./cards/daysOffCard";
import { LegendCardSettings, LegendPropertyIdentifier } from "./cards/legendCard";
import { MilestonesCardSettings, MilestonesPropertyIdentifier } from "./cards/milestonesCard";
import { TaskLabelsCardSettings } from "./cards/task/taskLabelsCard";
import { TaskCompletionCardSettings } from "./cards/task/taskCompletionCard";
import { TooltipConfigCardSettings } from "./cards/tooltipCard";
import { TaskConfigCardSettings } from "./cards/task/taskConfigCard";
import { TaskResourceCardSettings, TaskResourcePropertyIdentifier } from "./cards/task/taskResourceCard";
import { DateTypeCardSettings } from "./cards/dateTypeCard";
import { BackgroundCardSettings } from "./cards/backgroundCard";

import { GanttViewModel, MilestoneDataPoint } from "../interfaces";
import { Gantt } from "../gantt";
import { ISetHighContrastMode } from "./cards/interfaces/ISetHighContrastMode";

export class GanttChartSettingsModel extends Model {
    general = new GeneralCardSettings();
    collapsedTasks = new CollapsedTasksCardSettings();
    collapsedTasksUpdateId = new CollapsedTasksUpdateIdCardSettings();
    daysOff = new DaysOffCardSettings();
    legend = new LegendCardSettings();
    milestones = new MilestonesCardSettings();
    taskLabels = new TaskLabelsCardSettings();
    taskCompletion = new TaskCompletionCardSettings();
    tooltipConfig = new TooltipConfigCardSettings();
    taskConfig = new TaskConfigCardSettings();
    taskResource = new TaskResourceCardSettings();
    dateType = new DateTypeCardSettings();
    background = new BackgroundCardSettings();

    cards = [
        this.general,
        this.collapsedTasks,
        this.collapsedTasksUpdateId,
        this.daysOff,
        this.legend,
        this.milestones,
        this.taskLabels,
        this.taskCompletion,
        this.tooltipConfig,
        this.taskConfig,
        this.taskResource,
        this.dateType,
        this.background,
    ];

    public populateDynamicDataPoints(viewModel: GanttViewModel, localizationManager: ILocalizationManager): void {
        this.cards.forEach(element => {
            switch (element.name) {
                case MilestonesPropertyIdentifier.objectName: {
                    if (viewModel && !viewModel.isDurationFilled && !viewModel.isEndDateFilled) {
                        return;
                    }

                    const dataPoints: MilestoneDataPoint[] = viewModel && viewModel.milestoneData.dataPoints;
                    if (!dataPoints || !dataPoints.length) {
                        this.milestones.visible = false;
                        return;
                    }

                    const uniqueMilestones = Gantt.GetUniqueMilestones(dataPoints);

                    this.milestones.populateMilestones(Object.values(uniqueMilestones));

                    break;
                }

                case LegendPropertyIdentifier.objectName: {
                    if (viewModel && !viewModel.isDurationFilled && !viewModel.isEndDateFilled) {
                        return;
                    }

                    const dataPoints: LegendDataPoint[] = viewModel && viewModel.legendData.dataPoints;
                    if (!dataPoints || !dataPoints.length) {
                        return;
                    }

                    this.legend.populateColors(dataPoints, localizationManager);
                    break;
                }

                case TaskResourcePropertyIdentifier.objectName:
                    this.taskResource.visible = viewModel.isResourcesFilled;

                    if (viewModel.isResourcesFilled && this.taskResource.matchLegendColors.value) {
                        this.taskResource.fill.visible = false;
                    }
                    break;
            }
        });
    }

    public parse() {
        this.taskLabels.setVisibility();
        this.taskCompletion.parse();
    }

    public setHighContrastColors(colorHelper: ColorHelper): void {
        if (!colorHelper) {
            return;
        }

        this.cards.forEach((card) => {
            if ((card as ISetHighContrastMode)?.setHighContrastMode) {
                (card as ISetHighContrastMode).setHighContrastMode(colorHelper);
            }
        });
    }
}

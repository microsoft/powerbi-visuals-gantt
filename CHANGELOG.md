# 3.0.13
* Update API to 5.11.0, tools to 5.5.1 and other packages"
* Add all font settings (italic, bold, etc.) for the "Expand All" button, also make the default value satisfy the contrast ration of 4.6:1

## 3.0.12
* Fix not showing collapse button for parent tasks

## 3.0.11
# Remove restrictions on legend width

## 3.0.10
* Fix small task rendering

## 3.0.9
* Upgrade API to 5.9.0
* Fix axis position compared to tasks position
* Increase axis and tasks padding so axis is visible when "Date type" is set to "Hour"
* Remove magic numbers

## 3.0.8
* Fix bar start position and axis visibility on scroll

## 3.0.7
* Fix issue with showing multiple context menus
* Fix npm vulnerabilities

## 3.0.6
* Rollback shifted task bars in order to have backwards compatibility
* NPM vulnerabilities fixed

## 3.0.5
* Fix issue with disappearing of the task bar
* Fix issue with shifted task bar when `barsRoundedCorners` is enabled

## 3.0.4
* Fix issue when milestones were rendered twice
* Show customized legend name in the tooltips
* Packages update

## 3.0.3
* Render "Collapse all" / "Expand all" even if "Category labels" is disabled

## 3.0.2
* Fix tests
* Fix label name


## 3.0.1
* Upgraded to API 5.8.0
* Fixed bugs related to UI 

## 3.0.0
* Upgraded to API 5.7.0
* Dependencies update
* Major bugs fixes
* Support Highlight feature add
* Eslint support
* Playwright support

## 2.2.5
* Feature to turn on/off rectangle roundness

## 2.2.3
* Completion issue fix

## 2.2.2
* Random task color issue for specific cases fix

## 2.2.1
* Localization stringResources json error fix

## 2.2.0
* High contrast mode support fix
* Black bar fill issue fix
* Telemetry errors fix

## 2.1.0
* Legend usage without Duration filling is allowed (EndDate must be filled)
* An option for displaying grid lines

## 2.0.2
* Following #153 https://github.com/microsoft/powerbi-visuals-gantt/issues/153 made the adjustement that resolves the described issue of the horizontal lines overlapping the bars.
* It now also works while scaling the Task height 

## 2.0.1
* `@babel/polyfill` replacement by `core-js/stable`
* Conditional loading of `core-js/stable` only for sandbox mode

## 2.0.0
* API 2.6.0
* Webpack integration
* IE 11 support
* Azure Pipelines integration
* Milestones feature
* UI improvement
* Fixed bugs related to Grouping option
* Fixed bugs related to expand/collapse
* Fixed bug with Days Off extra duration calculation
* Common task bar and common milestones features


## 1.14.2
* Fixed bug when completion line overlap day off periods in some cases

## 1.14.1
* Fixed bug with wrongly positioned "group expand/collapse" icon when horizontal scrolling is presented and the icon now has fixed horizontal position as for single "expand/collapse" icons
* Fixed bug with broken removing of some important selectors 

## 1.14.0
* High contrast mode
* API 1.13.0

## 1.13.0
* Possibility to collaspse/expand all nodes
* Collaspe/expand arrows were replaced by plus/minus icons and icons now are loacted before labels
* Possibility to set Duration or EndDate

## 1.12.1
* Fixes highlighting issue

## 1.12.0
* Added localization for all supported languages

## 1.11.1
* Fixed issue with not showing values in some cases for day duration unit
* Fixed issue with task name left alignment

## 1.11.0
* Fixed issue with wrong tooltips
* Fixed issue with strange category labels
* Fixed issue with unsynchronized legend and task color

## 1.10.1
* Added 'End date' field to tooltip
* Fixed issue with date in extra information field
* Fixed crush when one field in Task and Extra Information

## 1.10.0
* UPD: powerbi-visuals-tools has been updated to 1.11.0 to support Bookmarks
* UPD: API has been updated to 1.11.0 to support Bookmarks
* UPD: powerbi-visuals-utils-interactivityutils has been updated to 3.1.0 to support Bookmarks
* UPD: powerbi-visuals-utils-testutils has been updated to "1.2.0" to support Bookmarks

## 1.9.4
 * Fixed issue with tooltip duration
 * Fixed issue with invisible task line when duration is 1
 * Renamed "Extra information" field bucket to "Tooltips"

## 1.9.3
 * Fixed issue with tooltip duration
 * Fixed issue with line length with float value and 'second' duration

## 1.9.2
 * Fixed issue with wrong selection of children tasks from legend

## 1.9.1
 * Fixed issue with wrong tooltip data displaying without 'parent' data
 * Fixed issue with wrong duration in the tooltip

## 1.9.0
 * Added ability to use sub tasks

## 1.8.6
 * Added option to data labels which cut them up to the width of the task

## 1.8.5
 * Fixed issue with wrong displaying resources labels

## 1.8.4
 * Fixed behavior when completion values display in tooltip though the
 %Completion doesn't have any field

## 1.8.3
 * Reverted 1.8.2 fix caused selection issue.
 * Fixed viewport clearing if no data in dataView
 * Added ordering feature

## 1.8.2
 * Fixed issue when task type value doesn't matter without duration

## 1.8.1
 * Fixed issue with not integer duration in some browsers

## 1.8.0
 * Fixed wrong behavior when chart didn't render without duration data.
 * Update API to v1.7

## 1.7.5
 * Fixed estimated time incorrect when we use weekend setting

## 1.7.4
 * Fixed X-axis date formatting overlapped for "Hour" date type

## 1.7.3
 * Fixed unexpected error with scroll in some cases
 
## 1.7.2
 * Fixed wrong width calculation of completion line when daysOff setting is switched on

## 1.7.1
 * Fixed wrong date formatting of x-axis. Date formatting didn't use PowerBi language setting

## 1.7.0
 * Added an ability to ignore weekends

## 1.6.0
 * Added ability automatically scroll chart to today date

## 1.5.1
 * Fixed tooltip label and date format of milestone line

## 1.5.0
 * Added ability to use custom date format for tooltip dates
 * Added ability to use extra information in the tooltip

## 1.4.0
 * Added new date types for x-axis(Quarter, Hours, Minutes, Seconds)

## 1.3.0
 * Added colour settings for: Today Bar Color, Axis Color, Axis Text Color
 * Added ability to set colour of Tasks if there is no legend specified.

## 1.2.0
 * Added ability to set minimum of task duration

## 1.1.0
 * Added ability to use hours, minutes and seconds in a 'duration'

## 1.0.2
 * Fixed tooltip date format not respected

## 1.0.1
 * Fixed start date calculation

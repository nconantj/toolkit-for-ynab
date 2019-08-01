The goals of this feature (in no particular order):

- Provide a new left tab for FI exploration. Page one will show all the numbers available to display and graphs of these numbers over time on a monthly basis.
- Provide an FI number and/or FI %, at user discretion, on the budget screen.
- Provide Days to FI, and/or FI date, at user discretion, on the budget screen. This is a bit more complex and needs some additional settings.
- Provide a means to exclude, include, or otherwise override the default rules. Ideally this would be a new configuration section in the settings for this addon to allow selection of what categories to include.

For FI # & %
- FI # will be displayed with up to 4 digits plus a decimal point and text describing the magnitude (thousand, million, billion, etc). The magnitude will be configurable to use "full name," SI-Like Notation (K, M, B, T), SI-Pure (not common) (K, M, G, T), or "M" notation (M, MM, MMM, MMMM). Note: "M" notation is roman numerals, anything over a trillion will be converted to "Mx#" where # is in arabic numerals).
- FI # will be (Sum(expenses) * (12/Count(months))) * 25. An expense is any non-transfer transaction
- FI % will be displayed with a decimal if less than 100%. It will have 3 significant digits such that under 10% has 2 decimals, and 10% to 99.9% will have 1 decimal.
- FI % will be Sum(Assets) / FI #.
- FI % will be displayed as either a percent or a number depending on user defined format selection. There is really no difference except formatting.
- FI number and % will be calculated by using a user defined range similar to the ranges provided for Days of Buffering.
- FI number and % will have an override to adjust the target. This will be a multiplier on the the base calculation. i.e. The number is 1.5, FI # * 1.5 is the actual FI # used.

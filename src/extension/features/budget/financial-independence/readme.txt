The concept behind FI is very similar to Days of Buffering, with a couple key differences:
1) The annual spending is not more than a certain percentage of the sum of all monetary assets. This is generally 4%.
2) The DoB of FI is effectively "Until you die."

Basically, one could stop working forever if they reach their FI number.

The goals of this feature (in no particular order):

- Provide a new left tab for FI exploration. Page one will show all the numbers available to display and graphs of these numbers over time on a monthly basis. - Since this idea is really just a report or two, we'll just create two reports: one forward-looking, and one backward looking.
- Provide an FI number and/or FI %, at user discretion, on the budget screen. - DONE
- Provide Days to FI, and/or FI date, at user discretion, on the budget screen. This is a bit more complex and needs some additional settings. - DONE
- Provide a means to exclude, include, or otherwise override the default rules. Ideally this would be a new configuration section in the settings for this addon to allow selection of what categories to include. - Exclude accounts is implemented with a ':fiexclude:' tag in the account notes.

For FI # & %
- FI # will be displayed with up to 4 digits plus a decimal point and text describing the magnitude (thousand, million, billion, etc). The magnitude will be configurable to use "full name," SI-Like Notation (K, M, B, T), SI-Pure (not common) (K, M, G, T), or "M" notation (M, MM, MMM, MMMM). Note: "M" notation is roman numerals, anything over a quadrillion will be converted to "Mx#" where # is in arabic numerals). - DONE. Caveat: >=quadrillion returns unmodified.
- FI # will be (Sum(expenses) * (12/Count(months))) * 25. An expense is any non-transfer transaction. - DONE.
- FI % will be displayed with a decimal if less than 100%. It will have 3 significant digits such that under 10% has 2 decimals, and 10% to 99.9% will have 1 decimal. - DONE? I think this is what I implemented, but I can't remember.
- FI % will be Sum(Assets) / FI #. - DONE
- FI % will be displayed as either a percent or a number depending on user defined format selection. There is really no difference except formatting. - Percent Implemented, numerical not. - DONE
- FI number and % will be calculated by using a user defined range similar to the ranges provided for Days of Buffering. - DONE
- FI number and % will have an override to adjust the target. This will be a multiplier on the the base calculation. i.e. The number is 1.5, FI # * 1.5 is the actual FI # used. - DONE. Caveat: User must choose from predefined milestones.


TODO:
- Filter out, at a minimum, non-transfer transactions on accounts not included in assets via the ":fiexclude:" tag.

- Check transaction memo for ':fiexclude:' tag and filter those out. Useful for reconciliation adjustments from market fluctuations (unrealized losses). Note: Income and unrealized gains are automatically ignored due to the limitation to outflows only.

- Allow categories to be excluded using the ':fiexclude:' tag. Not needed for categories that only outflow to tracking accounts. We automatically exclude those transactions.

- Add ':fiinclude:' tag for use on categories where the budgeted amount is to be considered a contribution towards the financial independence nest egg.

- Add some default master categories to examine for includsion in the FI nest egg.

- Add reports.

- Calculate to end of previous month.

- Make above optional. If we calculate to-date, then months are 30 days, otherwise they are true length.

- Add option to calculate based on visible month (Budget screen only)

- Calculate based on the visible month. If End of Previous month is selected, this will be the end of the month before the visible month.

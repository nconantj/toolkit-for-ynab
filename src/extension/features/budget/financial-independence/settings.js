module.exports = [
  {
    name: 'FinancialIndependence',
    type: 'checkbox',
    default: false,
    section: 'fi',
    title: 'Financial Independence Metric',
    description:
      'This calculation shows how much money you need to be financially independent. It can display this as the number you need or how close you are to that number.',
  },
  {
    name: 'FinancialIndependenceEndDate',
    type: 'select',
    default: 0,
    section: 'fi',
    title: 'How do you want your number calculated?',
    description:
      'Determines whether the data is representative of the displayed budget month or the overall budget.',
    options: [
      { name: 'Static - End of Month (overall to-date)', value: '0' },
      { name: 'Static - Start of Month (overall ending on the last day of last mont)', value: '1' },
      {
        name: 'Dynamic - End of Month (to the end of the current budget month displayed)',
        value: '2',
      },
      {
        name:
          'Dynamic - Start of Month (to the end of the budget month before the current budget month displayed)',
        value: '3',
      },
    ],
  },
  {
    name: 'FinancialIndependenceIgnoreTracking',
    type: 'select',
    default: 0,
    section: 'fi',
    title: 'Ignore outflows in tracking accounts?',
    description:
      'When enabled, this will ignore all outflows from tracking accounts. If all your non-transfer outflows are market adjustments, then you should turn this on so negative adjustments are ignored.',
    options: [{ name: 'Disabled', value: '0' }, { name: 'Enabled', value: '1' }],
  },
  {
    name: 'FinancialIndependenceHistoryLookup',
    type: 'select',
    default: 0,
    section: 'fi',
    title: 'Financial Independence History Lookup',
    description: 'How old transactions should be used for this calculation.',
    options: [
      { name: 'All', value: '0' },
      { name: '1 year', value: '12' },
      { name: '6 months', value: '6' },
      { name: '3 months', value: '3' },
      { name: '1 month', value: '1' },
    ],
  },
  {
    name: 'FinancialIndependenceWithdrawalRate',
    type: 'select',
    default: 3,
    section: 'fi',
    title: 'Financial Independence Annual Withdrawal Rate',
    description: 'How much you want to withdraw annually.',
    options: [
      { name: '1%', value: '1' },
      { name: '2%', value: '2' },
      { name: '3%', value: '3' },
      { name: '4%', value: '4' },
      { name: '5%', value: '5' },
      { name: '6%', value: '6' },
      { name: '7%', value: '7' },
      { name: '8%', value: '8' },
      { name: '9%', value: '9' },
      { name: '10%', value: '10' },
    ],
  },
  {
    name: 'FinancialIndependenceMilestone',
    type: 'select',
    default: 4,
    section: 'fi',
    title: 'Financial Independence Milestone',
    description:
      'What milestone you are targeting from http://fi180.com/2017/06/26/the-milestones-of-fi/',
    options: [
      { name: 'FU$ (10%)', value: '10' },
      { name: 'Lean FI (30%)', value: '30' },
      { name: 'Half FI (50%)', value: '50' },
      { name: 'Flex FI (80%)', value: '80' },
      { name: 'FI (100%)', value: '100' },
      { name: 'Fat FI (120%)', value: '120' },
      { name: '1.5 FI (150%)', value: '150' },
    ],
  },
  {
    name: 'FinancialIndependenceDisplayValue',
    type: 'select',
    default: 1,
    section: 'fi',
    description: 'What number to display.',
    title: 'Financial Independence Display Value',
    options: [
      { name: 'FI Number', value: '0' },
      { name: 'FI Progress', value: '1' },
      { name: 'FI Status', value: '2' },
      { name: 'FI Time', value: '3' },
    ],
  },
  {
    name: 'FinancialIndependenceProgressFormat',
    type: 'select',
    default: 0,
    section: 'fi',
    description: 'Determines how to display FI progress.',
    title: 'Financial Independence Progress Format',
    options: [
      { name: 'Show as Percent (10%, 100%, 150%)', value: '0' },
      { name: 'Show as Multiplier (0.1 FI, 1 FI 1.5 FI)', value: '1' },
    ],
  },
  {
    name: 'FinancialIndependenceTimeDisplay',
    type: 'select',
    default: 0,
    section: 'fi',
    description: 'Determines how to display the timeframe for achieving FI.',
    title: 'Financial Independence Timeframe Format',
    options: [{ name: 'Time to Target', value: '0' }, { name: 'Date of Target', value: '1' }],
  },
  {
    name: 'FinancialIndependenceAbbreviation',
    type: 'select',
    default: 0,
    section: 'fi',
    description:
      'This affects how your FI Numbers are presented for every power of 1000 (1000, 1000000, etc.)',
    title: 'Financial Independence Abbreviation',
    options: [
      { name: 'None (just puts the number out there formatted normally)', value: '0' },
      { name: 'Spell Out (thousand, million, billion, trillion)', value: '1' },
      { name: 'Abbreviated (thou, mill, bill, trill)', value: '2' },
      { name: 'SI-Like (K, M, B, T)', value: '3' },
      { name: 'Pure SI (K, M, G, T)', value: '4' },
      { name: 'Roman Numeral (M, MM, MMM, MMMM)', value: '5' },
    ],
  },
  {
    name: 'FinancialIndependenceGrowthRate',
    type: 'select',
    default: 7,
    section: 'fi',
    description: 'Expected net growth of assets after taxes.',
    title: 'Financial Independence Asset Growth',
    options: [
      { name: '0%', value: '0' },
      { name: '1%', value: '1' },
      { name: '2%', value: '2' },
      { name: '3%', value: '3' },
      { name: '4%', value: '4' },
      { name: '5%', value: '5' },
      { name: '6%', value: '6' },
      { name: '7%', value: '7' },
      { name: '8%', value: '8' },
      { name: '9%', value: '9' },
      { name: '10%', value: '10' },
    ],
  },
];

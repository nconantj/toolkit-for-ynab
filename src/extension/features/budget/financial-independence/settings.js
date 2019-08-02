module.exports = [
  {
    name: 'FinancialIndependence',
    type: 'checkbox',
    default: false,
    section: 'budget',
    title: 'Financial Independence Metric',
    description:
      'This calculation shows how much money you need to be financially independent. It can display this as the number you need or how close you are to that number.',
  },
  {
    name: 'FinancialIndependenceHistoryLookup',
    type: 'select',
    default: 0,
    section: 'budget',
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
    section: 'budget',
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
    section: 'budget',
    title: 'Financial Independence Milestone',
    description: 'What milestone you are targeting from fi180.com/2017/06/26/the-milestones-of-fi/',
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
    section: 'budget',
    description: 'What number to display.',
    title: 'Financial Independence Display Value',
    options: [
      { name: 'FI·Number', value: '0' },
      { name: 'FI·Progress', value: '1' }
    ],
  },
];

// SDG mapping based on focus bands
export const SDG_MAPPING = {
  E: [ // Environmental
    { value: 'SDG6', label: 'SDG 6 - Clean Water & Sanitation' },
    { value: 'SDG7', label: 'SDG 7 - Affordable & Clean Energy' },
    { value: 'SDG11', label: 'SDG 11 - Sustainable Cities & Communities' },
    { value: 'SDG12', label: 'SDG 12 - Responsible Consumption & Production' },
    { value: 'SDG13', label: 'SDG 13 - Climate Action' },
    { value: 'SDG14', label: 'SDG 14 - Life Below Water' },
    { value: 'SDG15', label: 'SDG 15 - Life on Land' },
  ],
  S: [ // Social
    { value: 'SDG1', label: 'SDG 1 - No Poverty' },
    { value: 'SDG2', label: 'SDG 2 - Zero Hunger' },
    { value: 'SDG3', label: 'SDG 3 - Good Health & Well-Being' },
    { value: 'SDG4', label: 'SDG 4 - Quality Education' },
    { value: 'SDG5', label: 'SDG 5 - Gender Equality' },
    { value: 'SDG8', label: 'SDG 8 - Decent Work & Economic Growth' },
    { value: 'SDG10', label: 'SDG 10 - Reduced Inequalities' },
  ],
  G: [ // Governance
    { value: 'SDG16', label: 'SDG 16 - Peace, Justice & Strong Institutions' },
    { value: 'SDG17', label: 'SDG 17 - Partnerships for the Goals' },
  ],
  SEG_overall: [ // All SDGs
    { value: 'SDG1', label: 'SDG 1 - No Poverty' },
    { value: 'SDG2', label: 'SDG 2 - Zero Hunger' },
    { value: 'SDG3', label: 'SDG 3 - Good Health & Well-Being' },
    { value: 'SDG4', label: 'SDG 4 - Quality Education' },
    { value: 'SDG5', label: 'SDG 5 - Gender Equality' },
    { value: 'SDG6', label: 'SDG 6 - Clean Water & Sanitation' },
    { value: 'SDG7', label: 'SDG 7 - Affordable & Clean Energy' },
    { value: 'SDG8', label: 'SDG 8 - Decent Work & Economic Growth' },
    { value: 'SDG10', label: 'SDG 10 - Reduced Inequalities' },
    { value: 'SDG11', label: 'SDG 11 - Sustainable Cities & Communities' },
    { value: 'SDG12', label: 'SDG 12 - Responsible Consumption & Production' },
    { value: 'SDG13', label: 'SDG 13 - Climate Action' },
    { value: 'SDG14', label: 'SDG 14 - Life Below Water' },
    { value: 'SDG15', label: 'SDG 15 - Life on Land' },
    { value: 'SDG16', label: 'SDG 16 - Peace, Justice & Strong Institutions' },
    { value: 'SDG17', label: 'SDG 17 - Partnerships for the Goals' },
  ],
  all: [ // All SDGs option
    { value: 'SDG1', label: 'SDG 1 - No Poverty' },
    { value: 'SDG2', label: 'SDG 2 - Zero Hunger' },
    { value: 'SDG3', label: 'SDG 3 - Good Health & Well-Being' },
    { value: 'SDG4', label: 'SDG 4 - Quality Education' },
    { value: 'SDG5', label: 'SDG 5 - Gender Equality' },
    { value: 'SDG6', label: 'SDG 6 - Clean Water & Sanitation' },
    { value: 'SDG7', label: 'SDG 7 - Affordable & Clean Energy' },
    { value: 'SDG8', label: 'SDG 8 - Decent Work & Economic Growth' },
    { value: 'SDG10', label: 'SDG 10 - Reduced Inequalities' },
    { value: 'SDG11', label: 'SDG 11 - Sustainable Cities & Communities' },
    { value: 'SDG12', label: 'SDG 12 - Responsible Consumption & Production' },
    { value: 'SDG13', label: 'SDG 13 - Climate Action' },
    { value: 'SDG14', label: 'SDG 14 - Life Below Water' },
    { value: 'SDG15', label: 'SDG 15 - Life on Land' },
    { value: 'SDG16', label: 'SDG 16 - Peace, Justice & Strong Institutions' },
    { value: 'SDG17', label: 'SDG 17 - Partnerships for the Goals' },
  ],
};

export function getSDGOptions(band?: string) {
  if (!band || !SDG_MAPPING[band as keyof typeof SDG_MAPPING]) {
    return SDG_MAPPING.SEG_overall;
  }
  return SDG_MAPPING[band as keyof typeof SDG_MAPPING];
}

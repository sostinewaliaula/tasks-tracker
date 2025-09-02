export const DEPARTMENTS = [
  'IT',
  'Finance',
  'HR',
  'GIS',
  'LMS',
  'FMS',
  'Agencify',
  'Caava AI',
  'Marketing'
] as const;

export type Department = typeof DEPARTMENTS[number];



export const parsePhones = (phones: string | string[]): string[] => {
  if (Array.isArray(phones)) return phones;
  try {
    return JSON.parse(phones);
  } catch {
    return [phones];
  }
};

export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const calculateMasterIncome = (amount: number, percent: number): number => {
  return Math.round((amount * percent) / 100);
};

export const calculateCashDesk = (amount: number, masterIncome: number): number => {
  return amount - masterIncome;
};

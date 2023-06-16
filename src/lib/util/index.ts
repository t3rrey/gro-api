export const convertKjToKcal = (kj: number): number => {
  // Conversion factor: 1 kilocalorie (kcal) = 4.184 kilojoules (kJ)
  const conversionFactor = 4.184;

  // Convert kilojoules to kilocalories
  const kcal = kj / conversionFactor;

  // Round the result to 2 decimal places
  const roundedKcal = Math.round(kcal * 100) / 100;

  return roundedKcal;
};

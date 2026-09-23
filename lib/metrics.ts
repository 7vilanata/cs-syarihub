export function calculateConversionRate({ converted, closed }: { converted: number; closed: number; notALead: number }) {
  const eligibleFinalOutcomes = converted + closed;
  return eligibleFinalOutcomes ? Math.round((converted / eligibleFinalOutcomes) * 100) : 0;
}

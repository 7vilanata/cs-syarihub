export function calculateConversionRate({ converted, closed }: { converted: number; closed: number; notALead: number }) {
  const eligibleFinalOutcomes = converted + closed;
  return eligibleFinalOutcomes ? Math.round((converted / eligibleFinalOutcomes) * 100) : 0;
}

export function isWithinDateRange(value: string, from: string, to: string) {
  const timestamp = new Date(value).getTime();
  return (!from || timestamp >= new Date(`${from}T00:00:00`).getTime()) &&
    (!to || timestamp <= new Date(`${to}T23:59:59.999`).getTime());
}

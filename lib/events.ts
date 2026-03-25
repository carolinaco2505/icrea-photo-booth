export const EVENTS: Record<string, string> = {
  "summit-datacenter-medellin-2026": "Summit Datacenter Medellín 2026",
  "icrea-energia-2026": "ICREA Energía 2026",
};

export function getEventName(eventId: string) {
  return (
    EVENTS[eventId] ||
    eventId
      .replace(/-/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase())
  );
}
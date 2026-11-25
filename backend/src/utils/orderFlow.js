export const orderTransitions = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['IN_PRODUCTION', 'CANCELLED'],
  IN_PRODUCTION: ['READY', 'CANCELLED'],
  READY: ['DELIVERED', 'CANCELLED'],
  DELIVERED: ['INSTALLED'],
  INSTALLED: [],
  CANCELLED: []
};

export function canTransition(from, to) {
  return (orderTransitions[from] || []).includes(to);
}

export function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

export function buildEstimateLines(requested, products) {
  return requested.map((i) => {
    const p = products.find((x) => Number(x.id) === i.productId);
    if (!p) throw new Error(`Product ${i.productId} not found`);
    const unitPrice = Number(p.price);
    return {
      productId: p.id,
      name: p.name,
      quantity: i.quantity,
      unitPrice,
      lineTotal: round2(unitPrice * i.quantity)
    };
  });
}

export function calculateTotals(items, taxRate = 0) {
  const subtotal = round2(items.reduce((s, i) => s + i.quantity * i.unitPrice, 0));
  const taxAmount = round2((subtotal * taxRate) / 100);
  return { subtotal, taxAmount, total: round2(subtotal + taxAmount) };
}

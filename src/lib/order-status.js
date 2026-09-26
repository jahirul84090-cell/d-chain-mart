// Order status changes that affect stock, shared by every admin endpoint.
//
// Stock is taken at checkout. It is returned when an order is cancelled
// (or deleted while still active) and taken again if a cancelled order is
// reopened. Invoicing never touches stock.

export const ORDER_STATUSES = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

export class StockConflictError extends Error {}

// Total quantity per product across all lines (sizes/colours) of an order.
function quantitiesByProduct(items) {
  const map = new Map();
  for (const item of items) {
    map.set(item.productId, (map.get(item.productId) || 0) + item.quantity);
  }
  return map;
}

export async function restockOrder(tx, items) {
  for (const [productId, quantity] of quantitiesByProduct(items)) {
    await tx.product.update({
      where: { id: productId },
      data: {
        stockAmount: { increment: quantity },
        totalSales: { decrement: quantity },
      },
    });
  }
}

export async function reserveOrderStock(tx, items) {
  for (const [productId, quantity] of quantitiesByProduct(items)) {
    const { count } = await tx.product.updateMany({
      where: { id: productId, stockAmount: { gte: quantity } },
      data: {
        stockAmount: { decrement: quantity },
        totalSales: { increment: quantity },
      },
    });
    if (count === 0) {
      throw new StockConflictError(
        "Not enough stock to reopen this order. Update the product stock first."
      );
    }
  }
}

/**
 * Applies the stock side effects of moving an order from one status to
 * another. Call inside a transaction before updating the order.
 */
export async function applyStatusStockChange(tx, order, nextStatus) {
  if (!nextStatus || nextStatus === order.status) return;
  const wasCancelled = order.status === "CANCELLED";
  const willBeCancelled = nextStatus === "CANCELLED";
  if (!wasCancelled && willBeCancelled) await restockOrder(tx, order.items);
  if (wasCancelled && !willBeCancelled) await reserveOrderStock(tx, order.items);
}

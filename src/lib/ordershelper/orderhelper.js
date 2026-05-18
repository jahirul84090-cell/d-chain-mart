const { prisma } = require("../prisma");

export async function getInvoiceWithOrderDetails(invoiceId) {
  try {
    return prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        order: {
          include: {
            user: true,
            shippingAddress: true,
            items: {
              include: { product: true },
            },
          },
        },
      },
    });
  } catch (error) {
    console.error("Error fetching invoice details:", error);
    return null;
  }
}

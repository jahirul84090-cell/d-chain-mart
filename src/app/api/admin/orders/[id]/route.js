import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthenticatedUser } from "@/lib/authCheck";

export async function GET(request, { params }) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }
    const order = await prisma.order.findUnique({
      where: { id: id },
      include: {
        user: { select: { id: true, email: true, name: true } },
        shippingAddress: true,
        paymentMethod: {
          select: {
            id: true,
            name: true,
            accountNumber: true,
            instructions: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
              },
            },
          },
        },
        invoice: { select: { id: true } },
      },
    });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json({ order }, { status: 200 });
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      { error: "Failed to fetch order: " + error.message },
      { status: 500 }
    );
  }
}

async function generateInvoicePdf(order) {
  const invoiceNumber = `INV-${order.id.slice(0, 8)}-${new Date().getTime()}`;
  const mockUrl = `https://your-storage-bucket.com/invoices/${invoiceNumber}.pdf`;
  return { invoiceNumber, url: mockUrl };
}

export async function PATCH(request, { params }) {
  try {
       const authCheck = await requireAuthenticatedUser(request);
  
    if (authCheck) return authCheck;
    const { id: orderId } = params;
    const { status, isPaid, generateInvoice } = await request.json();

    if (!orderId || (!status && isPaid === undefined && !generateInvoice)) {
      return NextResponse.json(
        { error: "Missing orderId or updates" },
        { status: 400 }
      );
    }

    const orderToUpdate = await prisma.order.findUnique({
      where: { id: orderId },
      include: { invoice: true, items: true },
    });

    if (!orderToUpdate) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (status) {
      const validStatuses = [
        "PENDING",
        "PROCESSING",
        "SHIPPED",
        "DELIVERED",
        "CANCELLED",
      ];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
    }

    if (generateInvoice && !orderToUpdate.isInvoiceGenerated) {
      if (orderToUpdate.status !== "PENDING") {
        return NextResponse.json(
          { error: "Invoice can only be generated for PENDING orders." },
          { status: 400 }
        );
      }
    }

    let updatedOrder;
    let newInvoiceData = null;

    await prisma.$transaction(
      async (tx) => {
        const updateData = {};

        if (status) {
          updateData.status = status;
        }

        if (isPaid !== undefined) {
          updateData.isPaid = isPaid;
        }

        if (generateInvoice && !orderToUpdate.isInvoiceGenerated) {
          const productUpdates = orderToUpdate.items.map((item) =>
            tx.product.update({
              where: { id: item.productId },
              data: {
                stockAmount: { decrement: item.quantity },
                totalSales: { increment: item.quantity },
              },
            })
          );

          await Promise.all(productUpdates);

          updateData.isInvoiceGenerated = true;
          updateData.status = "PROCESSING";
        }

        updatedOrder = await tx.order.update({
          where: { id: orderId },
          data: updateData,
          include: {
            user: { select: { id: true, email: true, name: true } },
            shippingAddress: true,
            paymentMethod: true,
            items: {
              include: { product: { select: { id: true, name: true } } },
            },
            invoice: true,
          },
        });
      },
      { timeout: 10000 }
    );

    if (generateInvoice && !orderToUpdate.isInvoiceGenerated) {
      newInvoiceData = await generateInvoicePdf(updatedOrder);
      await prisma.invoice.create({
        data: {
          invoiceNumber: newInvoiceData.invoiceNumber,
          order: { connect: { id: updatedOrder.id } },
          invoiceUrl: newInvoiceData.url,
        },
      });
    }

    return NextResponse.json(
      {
        order: {
          ...updatedOrder,
          invoice: newInvoiceData
            ? { ...newInvoiceData, orderId: updatedOrder.id }
            : updatedOrder.invoice,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update order." },
      { status: 500 }
    );
  }
}

// async function generateInvoicePdf(order) {
//   const invoiceNumber = `INV-${order.id.slice(0, 8)}-${new Date().getTime()}`;
//   const mockUrl = `https://your-storage-bucket.com/invoices/${invoiceNumber}.pdf`;
//   return { invoiceNumber, url: mockUrl };
// }

// export async function PATCH(request, { params }) {
//   try {
//     const { id: orderId } = params;
//     const { status, isPaid, generateInvoice } = await request.json();

//     if (!orderId || (!status && isPaid === undefined && !generateInvoice)) {
//       return NextResponse.json(
//         { error: "Missing orderId or updates" },
//         { status: 400 }
//       );
//     }

//     const orderToUpdate = await prisma.order.findUnique({
//       where: { id: orderId },
//       include: { invoice: true, items: true },
//     });

//     if (!orderToUpdate) {
//       return NextResponse.json({ error: "Order not found" }, { status: 404 });
//     }

//     if (status) {
//       const validStatuses = [
//         "PENDING",
//         "PROCESSING",
//         "SHIPPED",
//         "DELIVERED",
//         "CANCELLED",
//       ];
//       if (!validStatuses.includes(status)) {
//         return NextResponse.json({ error: "Invalid status" }, { status: 400 });
//       }
//     }

//     if (generateInvoice && !orderToUpdate.isInvoiceGenerated) {
//       if (orderToUpdate.status !== "PENDING") {
//         return NextResponse.json(
//           { error: "Invoice can only be generated for PENDING orders." },
//           { status: 400 }
//         );
//       }
//     }

//     const isStatusChanging = status && orderToUpdate.status !== status;
//     const isInvoiceNewlyGenerated = generateInvoice && !orderToUpdate.isInvoiceGenerated;

//     let updatedOrder;
//     let newInvoiceData = null;

//     await prisma.$transaction(
//       async (tx) => {
//         const updateData = {};

//         if (status) {
//           updateData.status = status;
//         }

//         if (isPaid !== undefined) {
//           updateData.isPaid = isPaid;
//         }

//         if (isInvoiceNewlyGenerated) {
//           const productUpdates = orderToUpdate.items.map((item) =>
//             tx.product.update({
//               where: { id: item.productId },
//               data: {
//                 stockAmount: { decrement: item.quantity },
//                 totalSales: { increment: item.quantity },
//               },
//             })
//           );
//           await Promise.all(productUpdates);
//           updateData.isInvoiceGenerated = true;
//           updateData.status = "PROCESSING";
//         }

//         updatedOrder = await tx.order.update({
//           where: { id: orderId },
//           data: updateData,
//           include: {
//             user: { select: { id: true, email: true, name: true } },
//             shippingAddress: true,
//             paymentMethod: true,
//             items: {
//               include: { product: { select: { id: true, name: true } } },
//             },
//             invoice: true,
//           },
//         });
//       },
//       { timeout: 10000 }
//     );

//     if (isInvoiceNewlyGenerated) {
//       newInvoiceData = await generateInvoicePdf(updatedOrder);
//       await prisma.invoice.create({
//         data: {
//           invoiceNumber: newInvoiceData.invoiceNumber,
//           order: { connect: { id: updatedOrder.id } },
//           invoiceUrl: newInvoiceData.url,
//         },
//       });
//     }

//     try {
//       if (isStatusChanging) {
//         await sendEmail({
//           email: updatedOrder.user.email,
//           subject: `Order Status Updated to ${updatedOrder.status}`,
//           html: createOrderStatusEmail(updatedOrder),
//         });
//       }

//       if (isInvoiceNewlyGenerated) {
//         await sendEmail({
//           email: updatedOrder.user.email,
//           subject: `Your Invoice for Order #${updatedOrder.id}`,
//           html: createInvoiceEmail(updatedOrder, newInvoiceData),
//         });
//       }
//     } catch (emailError) {
//       console.error("Failed to send email:", emailError);
//     }

//     return NextResponse.json(
//       {
//         order: {
//           ...updatedOrder,
//           invoice: newInvoiceData
//             ? { ...newInvoiceData, orderId: updatedOrder.id }
//             : updatedOrder.invoice,
//         },
//       },
//       { status: 200 }
//     );
//   } catch (error) {
//     console.error("Error updating order:", error);
//     return NextResponse.json(
//       { error: error.message || "Failed to update order." },
//       { status: 500 }
//     );
//   }
// }

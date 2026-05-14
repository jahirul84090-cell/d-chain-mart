export function createCustomerOrderEmail(order, user) {
  const orderItemsHtml = order.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${
        item.productSnapshot.name
      }</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${
        item.quantity
      }</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${item.pricePaid.toFixed(
        2
      )}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${(
        item.pricePaid * item.quantity
      ).toFixed(2)}</td>
    </tr>
  `
    )
    .join("");

  return `
    <html>
      <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <div style="background-color: #007BFF; color: #ffffff; padding: 25px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">Order Confirmation</h1>
            <p style="margin: 5px 0 0; font-size: 16px;">Thank you for your purchase!</p>
          </div>
          <div style="padding: 25px;">
            <p>Dear ${user.name},</p>
            <p>Your order has been successfully placed. We will notify you once your items have shipped. Below is a summary of your order:</p>

            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px;">
              <p style="margin: 0;"><strong>Order Number:</strong> ${
                order.id
              }</p>
              <p style="margin: 5px 0 0;"><strong>Order Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <thead>
                <tr style="background-color: #f1f1f1;">
                  <th style="padding: 10px; text-align: left;">Item</th>
                  <th style="padding: 10px; text-align: center;">Quantity</th>
                  <th style="padding: 10px; text-align: right;">Price</th>
                  <th style="padding: 10px; text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${orderItemsHtml}
              </tbody>
            </table>

            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <tr>
                <td style="padding: 5px 0; text-align: right;">Subtotal:</td>
                <td style="padding: 5px 0; text-align: right; font-weight: bold;">$${(
                  order.orderTotal - order.deliveryFee
                ).toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; text-align: right;">Delivery Fee:</td>
                <td style="padding: 5px 0; text-align: right; font-weight: bold;">$${order.deliveryFee.toFixed(
                  2
                )}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; text-align: right; font-size: 18px; border-top: 1px solid #ddd;"><strong>Grand Total:</strong></td>
                <td style="padding: 10px 0; text-align: right; font-size: 18px; font-weight: bold; border-top: 1px solid #ddd;">$${order.orderTotal.toFixed(
                  2
                )}</td>
              </tr>
            </table>

            <p style="text-align: center; margin-top: 30px; font-size: 14px; color: #777;">
              If you have any questions, please contact our support team.
            </p>
          </div>
          <div style="background-color: #f1f1f1; padding: 15px; text-align: center; font-size: 12px; color: #888;">
            &copy; ${new Date().getFullYear()} Your Company Name. All rights reserved.
          </div>
        </div>
      </body>
    </html>
  `;
}

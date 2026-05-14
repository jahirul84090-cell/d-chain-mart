export function createAdminOrderEmail(order, user) {
  return `
    <html>
      <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <div style="background-color: #dc3545; color: #ffffff; padding: 25px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">New Order Alert!</h1>
            <p style="margin: 5px 0 0; font-size: 16px;">A new order has been placed on your store.</p>
          </div>
          <div style="padding: 25px;">
            <p style="font-size: 16px;"><strong>Order Details:</strong></p>
            <ul style="list-style-type: none; padding: 0; margin: 0;">
              <li style="margin-bottom: 10px;"><strong>Order ID:</strong> #${
                order.id
              }</li>
              <li style="margin-bottom: 10px;"><strong>Customer Name:</strong> ${
                user.name
              }</li>
              <li style="margin-bottom: 10px;"><strong>Customer Email:</strong> ${
                user.email
              }</li>
              <li style="margin-bottom: 10px;"><strong>Order Total:</strong> $${order.orderTotal.toFixed(
                2
              )}</li>
              <li style="margin-bottom: 10px;"><strong>Payment Method:</strong> ${
                order.paymentMethod.name
              }</li>
            </ul>

            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.BASE_URL}/order/${
    order.id
  }" style="display: inline-block; padding: 12px 24px; background-color: #007BFF; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">
                View Order in Dashboard
              </a>
            </div>
          </div>
          <div style="background-color: #f1f1f1; padding: 15px; text-align: center; font-size: 12px; color: #888;">
            Automated notification from your e-commerce platform.
          </div>
        </div>
      </body>
    </html>
  `;
}

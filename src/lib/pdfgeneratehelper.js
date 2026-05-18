import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

function generateInvoiceHtml(invoice) {
  const order = invoice.order;
  const subtotal = order.orderTotal - (order.deliveryFee || 0);
  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
  // Define a professional primary color
  const primaryColor = "#0056b3"; // Professional Dark Blue

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Invoice #${invoice.invoiceNumber}</title>
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
        <style>
            body { font-family: 'Roboto', 'Noto Sans', sans-serif; margin: 0; padding: 40px; color: #333; line-height: 1.5; font-size: 14px; }
            .container { max-width: 850px; margin: 0 auto; padding: 40px; border: 1px solid #e0e0e0; border-radius: 6px; box-shadow: 0 6px 20px rgba(0,0,0,0.05); }
            
            /* Header Styling */
            .header-section { 
                display: flex; 
                justify-content: space-between; 
                align-items: flex-end; 
                margin-bottom: 50px; 
                border-bottom: 3px solid ${primaryColor}; 
                padding-bottom: 20px; 
            }
            .company-info h1 { 
                margin: 0; 
                font-size: 32px; 
                color: ${primaryColor}; 
                font-weight: 700; 
                letter-spacing: 1px;
            }
            .company-info p { margin: 3px 0; font-size: 13px; color: #666; }
            .invoice-info { text-align: right; }
            .invoice-info h2 { margin: 0; color: #555; font-size: 20px; font-weight: 500; text-transform: uppercase; }
            .invoice-info p { margin: 4px 0; font-size: 14px; }
            
            /* Details Boxes Styling */
            .details { display: flex; justify-content: space-between; margin-bottom: 40px; }
            .details-box { 
                background-color: #f8f8f8; 
                padding: 20px; 
                border-radius: 4px; 
                flex: 1; 
                margin: 0 10px;
                border-left: 4px solid ${primaryColor};
            }
            .details-box:first-child { margin-left: 0; }
            .details-box:last-child { margin-right: 0; }
            .details-box h3 { margin-top: 0; font-size: 15px; color: ${primaryColor}; margin-bottom: 10px; border-bottom: none; padding-bottom: 0; font-weight: 700; }
            .details-box p { margin: 4px 0; font-size: 13px; }
            
            /* Table Styling */
            .table-container { width: 100%; border-collapse: collapse; margin-top: 30px; }
            .table-container th, .table-container td { text-align: left; padding: 15px 12px; border-bottom: 1px solid #f0f0f0; }
            .table-container th { 
                background-color: ${primaryColor}; 
                color: white; 
                font-weight: 500; 
                text-transform: uppercase;
                font-size: 13px;
            }
            .table-container tr:nth-child(even) { background-color: #fafafa; }
            .table-container tr:hover { background-color: #f5f5f5; }
            
            /* Totals Section */
            .total-section { 
                width: 35%; 
                margin-top: 20px; 
                float: right; 
                border: 1px solid #e0e0e0; 
                border-radius: 4px;
            }
            .total-section td { padding: 12px; font-size: 14px; }
            .total-row { border-top: 1px solid #e0e0e0; }
            .total-row td:first-child { font-weight: 700; color: ${primaryColor}; }
            .total-row td:last-child { font-weight: 700; color: ${primaryColor}; font-size: 16px; background-color: #f0f8ff; border-radius: 0 0 4px 0; }
            
            /* Footer Styling */
            .footer-section { 
                clear: both; 
                text-align: center; 
                margin-top: 80px; 
                font-size: 12px; 
                color: #777; 
                border-top: 1px solid #e0e0e0; 
                padding-top: 25px; 
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header-section">
                <div class="company-info">
                    <h1>BD STORE</h1>
                    <p>Dhaka, Bangladesh</p>
                </div>
                <div class="invoice-info">
                    <h2>INVOICE</h2>
                    <p><strong>Invoice No:</strong> ${invoice.invoiceNumber}</p>
                    <p><strong>Order ID:</strong> ${order.id}</p>
                    <p><strong>Date:</strong> ${new Date(
                      order.createdAt
                    ).toLocaleDateString()}</p>
                </div>
            </div>
            
            <div class="details">
                <div class="details-box">
                    <h3>BILL TO</h3>
                    <p><strong>Name:</strong> ${order.user.name || "N/A"}</p>
                    <p><strong>Email:</strong> ${order.user.email}</p>
                </div>
                <div class="details-box">
                    <h3>SHIP TO</h3>
                    <p>${order.shippingAddress.street}</p>
                    <p>${order.shippingAddress.city}, ${
    order.shippingAddress.state
  }, ${order.shippingAddress.zipCode}</p>
                </div>
            </div>
            
            <table class="table-container">
                <thead>
                    <tr>
                        <th style="width: 50%;">Item Description</th>
                        <th style="width: 15%;">Qty</th>
                        <th style="width: 15%;">Unit Price</th>
                        <th style="width: 20%;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${order.items
                      .map(
                        (item) => `
                        <tr>
                            <td>${item.product.name}</td>
                            <td>${item.quantity}</td>
                            <td>৳${item.pricePaid.toLocaleString("en-BD")}</td>
                            <td>৳${(
                              item.quantity * item.pricePaid
                            ).toLocaleString("en-BD")}</td>
                        </tr>`
                      )
                      .join("")}
                </tbody>
            </table>
            
            <table class="total-section">
                <tbody>
                    <tr>
                        <td>Subtotal:</td>
                        <td style="text-align: right;">৳${subtotal.toLocaleString(
                          "en-BD"
                        )}</td>
                    </tr>
                    ${
                      order.deliveryFee > 0
                        ? `
                    <tr>
                        <td>Delivery Fee:</td>
                        <td style="text-align: right;">৳${order.deliveryFee.toLocaleString(
                          "en-BD"
                        )}</td>
                    </tr>`
                        : ""
                    }
                    <tr class="total-row">
                        <td>GRAND TOTAL:</td>
                        <td style="text-align: right;">৳${order.orderTotal.toLocaleString(
                          "en-BD"
                        )}</td>
                    </tr>
                </tbody>
            </table>
            
            <div class="footer-section">
                <p>Thank you for your business! This invoice covers ${totalItems} items in total.</p>
                <p>For any inquiries, please contact us at support@yourcompany.com.</p>
            </div>
        </div>
    </body>
    </html>
    `;
}

export async function generatePdfBuffer(invoice) {
  const htmlContent = generateInvoiceHtml(invoice);

  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
    ignoreHTTPSErrors: true,
  });

  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: "domcontentloaded" });
  const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
  await browser.close();

  return pdfBuffer;
}

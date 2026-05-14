import nodemailer from "nodemailer";

export async function sendOtpEmail({ email, name, otpCode }) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: process.env.EMAIL_SERVER_PORT,
      auth: {
        user: process.env.SMTPEMAIL,
        pass: process.env.SMTPASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"BD STORE" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: "Verify Your Email with OTP",
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin: 20px auto;">
            <tr>
              <td style="padding: 20px; text-align: center; background-color: #007bff; border-radius: 8px 8px 0 0;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Your Blog</h1>
              </td>
            </tr>
            <tr>
              <td style="padding: 30px; text-align: center;">
                <h2 style="color: #333333; font-size: 22px; margin: 0 0 10px;">Verify Your Email</h2>
                <p style="color: #555555; font-size: 16px; margin: 0 0 20px;">Hello ${name},</p>
                <p style="color: #555555; font-size: 16px; margin: 0 0 20px;">Thank you for signing up! Please use the following 6-digit OTP to verify your email address:</p>
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
                  <h3 style="color: #007bff; font-size: 24px; margin: 0; letter-spacing: 2px;">${otpCode}</h3>
                </div>
                <p style="color: #555555; font-size: 16px; margin: 0 0 20px;">Enter this code on the verification page to complete your registration. This OTP expires in 10 minutes.</p>
               
                <p style="color: #555555; font-size: 14px; margin: 20px 0 0;">If you didn’t sign up, please ignore this email.</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 20px; text-align: center; background-color: #f8f9fa; border-radius: 0 0 8px 8px;">
                <p style="color: #777777; font-size: 12px; margin: 0;">© 2025 Your Blog. All rights reserved.</p>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    console.log("sendOtpEmail: OTP email sent", {
      email,
      otpCode,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.log(error);

    throw new Error("Failed to send OTP email");
  }
}

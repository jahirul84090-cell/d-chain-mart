// Content for the store's policy and help pages.
// Review these texts with the business owner before launch; they describe
// how the site works today (COD, 2–5 day delivery, 7-day returns, EMI).

const SITE = process.env.SITE_NAME || "D Chin Mart";
const EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "dchinmart@gmail.com";
const PHONE = process.env.NEXT_PUBLIC_SUPPORT_PHONE_DISPLAY || "+880 1923-363194";
export const POLICY_UPDATED = "26 September 2026";

export const privacyPolicy = {
  title: "Privacy Policy",
  path: "/privacy-policy",
  intro: `This policy explains what personal information ${SITE} collects, why we collect it and how we protect it when you shop with us.`,
  sections: [
    {
      id: "information-we-collect",
      heading: "Information we collect",
      body: [
        "We collect only what we need to run your account and deliver your orders:",
        [
          "Account details: your name, email address and password (stored encrypted).",
          "Delivery details: your addresses and phone number.",
          "Order details: the products you buy, payment method and transaction number (for bKash, Nagad and similar payments).",
          "EMI applications: your national ID number, income, job type, nominee details and the ID photos you upload.",
          "Messages you send us through the Contact page.",
        ],
        "We do not store card numbers or your mobile banking PIN.",
      ],
    },
    {
      id: "how-we-use",
      heading: "How we use your information",
      body: [
        [
          "To process, deliver and support your orders.",
          "To verify payments and prevent fraud.",
          "To review EMI applications and manage installments.",
          "To send order updates, invoices and account emails such as verification codes.",
          "To answer your questions and improve our service.",
        ],
      ],
    },
    {
      id: "sharing",
      heading: "Who we share it with",
      body: [
        "We never sell your personal information. We share only what is needed with:",
        [
          "Delivery partners — your name, phone number and address, to deliver your order.",
          "Payment providers — to confirm your payment.",
          "Service providers that host our website, images and email, under confidentiality obligations.",
          "Authorities, when required by Bangladeshi law.",
        ],
      ],
    },
    {
      id: "security",
      heading: "How we protect it",
      body: [
        "Passwords are encrypted, account pages require login, and EMI documents are stored privately and shown only to you and our authorised staff through time-limited links.",
      ],
    },
    {
      id: "your-rights",
      heading: "Your choices and rights",
      body: [
        "You can update your name, phone number and addresses from your profile at any time. To request a copy of your data or to delete your account, contact us. We keep order records as required for accounting and legal purposes.",
      ],
    },
    {
      id: "cookies",
      heading: "Cookies",
      body: [
        "We use essential cookies to keep you signed in and to remember your cart. We do not use advertising cookies.",
      ],
    },
    {
      id: "contact",
      heading: "Contact",
      body: [`Questions about privacy? Email ${EMAIL} or call ${PHONE}.`],
    },
  ],
};

export const termsAndConditions = {
  title: "Terms & Conditions",
  path: "/terms-and-conditions",
  intro: `By using ${SITE} and placing an order, you agree to these terms. Please read them carefully.`,
  sections: [
    {
      id: "accounts",
      heading: "Your account",
      body: [
        "You must provide accurate information and keep your password safe. You are responsible for orders placed from your account. We may suspend accounts used for fraud or abuse.",
      ],
    },
    {
      id: "products-prices",
      heading: "Products and prices",
      body: [
        "Prices are in Bangladeshi Taka (BDT) and include applicable VAT unless stated otherwise. We try to show products, colours and stock accurately, but occasional errors can happen. If a price or stock error affects your order, we will contact you before processing it and you may cancel for a full refund.",
      ],
    },
    {
      id: "orders",
      heading: "Orders and payment",
      body: [
        "An order is confirmed when we accept it and start processing. We accept cash on delivery and mobile banking (bKash, Nagad). For mobile banking, your order is processed after we verify the transaction number you provide.",
        "We may cancel an order if the product is unavailable, the payment cannot be verified, or the delivery address cannot be reached. Any amount paid will be refunded.",
      ],
    },
    {
      id: "delivery",
      heading: "Delivery",
      body: ["Delivery times and charges are described in our Shipping Policy."],
    },
    {
      id: "returns",
      heading: "Returns and refunds",
      body: ["Returns, replacements and refunds follow our Return Policy."],
    },
    {
      id: "emi",
      heading: "EMI purchases",
      body: [
        "EMI purchases are subject to approval and to our EMI Policy. Missing installments may result in late fees as shown in your EMI agreement.",
      ],
    },
    {
      id: "liability",
      heading: "Liability",
      body: [
        "Products are covered by the manufacturer's or seller's warranty where stated. To the extent allowed by law, our liability for any order is limited to the amount you paid for it.",
      ],
    },
    {
      id: "changes",
      heading: "Changes to these terms",
      body: [
        "We may update these terms. The version shown on this page at the time of your order applies to that order. These terms are governed by the laws of Bangladesh.",
      ],
    },
  ],
};

export const returnPolicy = {
  title: "Return & Refund Policy",
  path: "/return-policy",
  intro: "Not happy with your purchase? You can return eligible products within 7 days of delivery.",
  sections: [
    {
      id: "eligibility",
      heading: "What can be returned",
      body: [
        "You can request a return within 7 days of receiving your order if:",
        [
          "The product is damaged, defective or not working.",
          "You received the wrong product, size or colour.",
          "The product is significantly different from its description.",
        ],
        "The product must be unused (except for testing a fault), with all accessories, boxes, manuals and free gifts.",
      ],
    },
    {
      id: "not-returnable",
      heading: "What cannot be returned",
      body: [
        [
          "Products with physical damage caused after delivery.",
          "Products with a broken seal where the seal is needed for resale (for example, earphones and personal care items), unless faulty.",
          "Change-of-mind returns after the product has been used.",
        ],
      ],
    },
    {
      id: "how-to-return",
      heading: "How to request a return",
      body: [
        "Contact us within 7 days with your order number (for example DCM-1A2B3C4D), photos or a short video of the issue. We will reply within 24 hours with pickup or drop-off instructions.",
      ],
    },
    {
      id: "refunds",
      heading: "Refunds",
      body: [
        "After we receive and check the product, we will offer a replacement or refund. Refunds are sent within 7 working days to your bKash/Nagad number or bank account. Delivery charges are refunded when the return is due to our mistake or a faulty product.",
      ],
    },
    {
      id: "warranty",
      heading: "Warranty claims",
      body: [
        "Problems that appear after 7 days are handled under the product warranty. Contact us and we will help you with the brand's service centre.",
      ],
    },
  ],
};

export const shippingPolicy = {
  title: "Shipping Policy",
  path: "/shipping-policy",
  intro: "We deliver across Bangladesh with cash on delivery available.",
  sections: [
    {
      id: "delivery-time",
      heading: "Delivery time",
      body: [
        [
          "Orders are processed within 1 working day after confirmation.",
          "Delivery usually takes 2–5 working days depending on your location.",
          "Delivery may take longer during public holidays, sales campaigns or bad weather.",
        ],
      ],
    },
    {
      id: "charges",
      heading: "Delivery charges",
      body: [
        "The delivery charge depends on your city and is shown at checkout before you place your order. The same amount is shown on your order confirmation and invoice.",
      ],
    },
    {
      id: "cod",
      heading: "Cash on delivery",
      body: [
        "Pay in cash when you receive your order. Please check the product in front of the delivery person where possible.",
      ],
    },
    {
      id: "failed-delivery",
      heading: "If delivery fails",
      body: [
        "Our delivery partner will call the phone number on your order. If we cannot reach you after several attempts, the order may be cancelled. Please make sure your phone number and address are correct.",
      ],
    },
    {
      id: "tracking",
      heading: "Tracking your order",
      body: ["You can see the status of every order in My Orders after signing in."],
    },
  ],
};

export const emiPolicy = {
  title: "EMI Policy",
  path: "/emi-policy",
  intro: "Buy now and pay in monthly installments. This page explains how EMI works at our store.",
  sections: [
    {
      id: "plans",
      heading: "Plans",
      body: [
        "Choose a 3-month or 6-month plan. The interest rate for each plan is shown before you apply and is fixed for the whole plan (flat rate on the financed amount).",
      ],
    },
    {
      id: "eligibility",
      heading: "Who can apply",
      body: [
        [
          "Bangladeshi citizens aged 18 or above with a valid national ID (NID).",
          "A regular monthly income.",
          "A nominee who can be contacted by phone.",
        ],
      ],
    },
    {
      id: "documents",
      heading: "Documents",
      body: [
        "You will upload photos of the front and back of your NID, a selfie and your nominee's photo. Documents are stored privately and used only to review your application.",
      ],
    },
    {
      id: "down-payment",
      heading: "Down payment",
      body: [
        "A down payment is required. The minimum down payment, if any, is shown on the application form. The product is delivered after the down payment is received and the application is approved.",
      ],
    },
    {
      id: "installments",
      heading: "Installments and late fees",
      body: [
        "Your first installment is due about 30 days after your plan starts. A short grace period applies; after that, a late fee may be added for each overdue installment as shown in your EMI details. You can see every installment and its status in My Loans.",
      ],
    },
    {
      id: "approval",
      heading: "Approval",
      body: [
        "We review applications within 1–2 working days and may call you or your nominee. We may reject an application without giving a reason.",
      ],
    },
  ],
};

export const faq = {
  title: "Frequently Asked Questions",
  path: "/faq",
  intro: "Quick answers to the questions we hear most often.",
  items: [
    ["Is cash on delivery available?", "Yes. You can pay in cash when your order arrives, anywhere we deliver in Bangladesh."],
    ["How long does delivery take?", "Usually 2–5 working days after your order is confirmed."],
    ["How much is the delivery charge?", "It depends on your city and is shown at checkout before you place your order."],
    ["Can I pay with bKash or Nagad?", "Yes. Send the amount to the number shown at checkout, then enter your transaction ID (TrxID) to place the order."],
    ["How do I track my order?", "Sign in and open My Orders to see the status of each order."],
    ["Can I return a product?", "Yes, eligible products can be returned within 7 days of delivery. See our Return Policy for details."],
    ["How does EMI work?", "Choose a 3- or 6-month plan, pay a down payment, upload your NID and nominee details, and pay the rest in monthly installments after approval."],
    ["Are your products genuine?", "Yes. We sell genuine products from trusted brands and suppliers, with warranty where stated."],
    ["How can I contact support?", `Call or WhatsApp ${PHONE}, email ${EMAIL}, or use our Contact page. We're available 10 AM – 10 PM every day.`],
  ],
};

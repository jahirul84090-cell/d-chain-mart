/**
 * File: app/api/admin/accounting/export/route.js
 *
 * GET /api/admin/accounting/export
 *
 * Query:
 *   ?type=monthly&format=excel&year=2026
 *   ?type=monthly&format=pdf&year=2026
 *
 * Supported:
 *   type: monthly
 *   format: excel | pdf
 */

import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

import { getCurrentUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import { isAdminUser, f2 } from "@/lib/loan-utils";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

async function requireAdmin() {
  const current = await getCurrentUser();

  if (!current) {
    return {
      error: NextResponse.json({ error: "Unauthorized." }, { status: 401 }),
    };
  }

  if (!isAdminUser(current)) {
    return {
      error: NextResponse.json({ error: "Forbidden." }, { status: 403 }),
    };
  }

  return { current };
}

function monthRange(year, monthIndex) {
  const start = new Date(year, monthIndex, 1);
  const end = new Date(year, monthIndex + 1, 0);

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

async function getMonthlyReport(year) {
  const monthly = [];

  for (let i = 0; i < 12; i++) {
    const { start, end } = monthRange(year, i);

    const [orders, loans, payments, expenses] = await Promise.all([
      prisma.order.findMany({
        where: {
          status: "DELIVERED",
          isPaid: true,
          createdAt: { gte: start, lte: end },
        },
        include: { items: true },
      }),

      prisma.loanApplication.findMany({
        where: {
          status: {
            in: ["DOWN_PAYMENT_PENDING", "ACTIVE", "COMPLETED"],
          },
          appliedAt: { gte: start, lte: end },
        },
      }),

      prisma.loanPayment.findMany({
        where: {
          status: "SUCCESS",
          paidAt: { gte: start, lte: end },
        },
      }),

      prisma.expense.findMany({
        where: {
          expenseAt: { gte: start, lte: end },
        },
      }),
    ]);

    const directSales = orders.reduce(
      (sum, order) => sum + Number(order.orderTotal || 0),
      0
    );

    const directProfit = orders.reduce((sum, order) => {
      const orderProfit = order.items.reduce((itemSum, item) => {
        if (Number(item.totalProfit || 0) !== 0) {
          return itemSum + Number(item.totalProfit || 0);
        }

        return (
          itemSum +
          Number(item.pricePaid || 0) * Number(item.quantity || 0)
        );
      }, 0);

      return sum + orderProfit;
    }, 0);

    const loanSales = loans.reduce(
      (sum, loan) => sum + Number(loan.productPrice || 0),
      0
    );

    const expectedLoanProfit = loans.reduce(
      (sum, loan) => sum + Number(loan.expectedProfit || 0),
      0
    );

    const downPaymentCollected = payments
      .filter((p) => p.paymentType === "DOWN_PAYMENT")
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const emiCollected = payments
      .filter((p) => p.paymentType === "INSTALLMENT")
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const lateFeeCollected = payments
      .filter((p) => p.paymentType === "LATE_FEE")
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const totalExpense = expenses.reduce(
      (sum, expense) => sum + Number(expense.amount || 0),
      0
    );

    const totalCollection =
      directSales + downPaymentCollected + emiCollected + lateFeeCollected;

    const grossProfit =
      directProfit + expectedLoanProfit + lateFeeCollected;

    const netProfit = grossProfit - totalExpense;

    monthly.push({
      month: MONTHS[i],
      directSales: f2(directSales),
      loanSales: f2(loanSales),
      downPaymentCollected: f2(downPaymentCollected),
      emiCollected: f2(emiCollected),
      lateFeeCollected: f2(lateFeeCollected),
      totalCollection: f2(totalCollection),
      directProfit: f2(directProfit),
      expectedLoanProfit: f2(expectedLoanProfit),
      grossProfit: f2(grossProfit),
      totalExpense: f2(totalExpense),
      netProfit: f2(netProfit),
    });
  }

  return monthly;
}

async function createExcel(monthly, year) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "D Chin Mart";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(`Monthly ${year}`);

  sheet.columns = [
    { header: "Month", key: "month", width: 12 },
    { header: "Direct Sales", key: "directSales", width: 18 },
    { header: "Loan Sales", key: "loanSales", width: 18 },
    { header: "Down Payment", key: "downPaymentCollected", width: 18 },
    { header: "EMI Collected", key: "emiCollected", width: 18 },
    { header: "Late Fee", key: "lateFeeCollected", width: 18 },
    { header: "Total Collection", key: "totalCollection", width: 20 },
    { header: "Direct Profit", key: "directProfit", width: 18 },
    { header: "Loan Profit", key: "expectedLoanProfit", width: 18 },
    { header: "Gross Profit", key: "grossProfit", width: 18 },
    { header: "Expense", key: "totalExpense", width: 18 },
    { header: "Net Profit", key: "netProfit", width: 18 },
  ];

  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" };

  monthly.forEach((row) => sheet.addRow(row));

  sheet.addRow({});
  sheet.addRow({
    month: "TOTAL",
    directSales: monthly.reduce((s, r) => s + r.directSales, 0),
    loanSales: monthly.reduce((s, r) => s + r.loanSales, 0),
    downPaymentCollected: monthly.reduce((s, r) => s + r.downPaymentCollected, 0),
    emiCollected: monthly.reduce((s, r) => s + r.emiCollected, 0),
    lateFeeCollected: monthly.reduce((s, r) => s + r.lateFeeCollected, 0),
    totalCollection: monthly.reduce((s, r) => s + r.totalCollection, 0),
    directProfit: monthly.reduce((s, r) => s + r.directProfit, 0),
    expectedLoanProfit: monthly.reduce((s, r) => s + r.expectedLoanProfit, 0),
    grossProfit: monthly.reduce((s, r) => s + r.grossProfit, 0),
    totalExpense: monthly.reduce((s, r) => s + r.totalExpense, 0),
    netProfit: monthly.reduce((s, r) => s + r.netProfit, 0),
  });

  sheet.lastRow.font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

function createPdf(monthly, year) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margin: 40,
      size: "A4",
      layout: "landscape",
    });

    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(18).text(`D Chin Mart - Monthly Accounting Report ${year}`, {
      align: "center",
    });

    doc.moveDown();

    const headers = [
      "Month",
      "Collection",
      "Gross Profit",
      "Expense",
      "Net Profit",
    ];

    const startX = 40;
    let y = 100;
    const widths = [80, 140, 140, 140, 140];

    doc.fontSize(10).font("Helvetica-Bold");

    headers.forEach((header, i) => {
      doc.text(header, startX + widths.slice(0, i).reduce((a, b) => a + b, 0), y, {
        width: widths[i],
      });
    });

    y += 22;
    doc.font("Helvetica");

    monthly.forEach((row) => {
      const values = [
        row.month,
        String(row.totalCollection),
        String(row.grossProfit),
        String(row.totalExpense),
        String(row.netProfit),
      ];

      values.forEach((value, i) => {
        doc.text(value, startX + widths.slice(0, i).reduce((a, b) => a + b, 0), y, {
          width: widths[i],
        });
      });

      y += 20;
    });

    y += 15;
    doc.font("Helvetica-Bold");

    const totalCollection = monthly.reduce((s, r) => s + r.totalCollection, 0);
    const grossProfit = monthly.reduce((s, r) => s + r.grossProfit, 0);
    const totalExpense = monthly.reduce((s, r) => s + r.totalExpense, 0);
    const netProfit = monthly.reduce((s, r) => s + r.netProfit, 0);

    doc.text(`Total Collection: ${f2(totalCollection)}`, 40, y);
    doc.text(`Gross Profit: ${f2(grossProfit)}`, 240, y);
    doc.text(`Expense: ${f2(totalExpense)}`, 420, y);
    doc.text(`Net Profit: ${f2(netProfit)}`, 580, y);

    doc.end();
  });
}

export async function GET(req) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);

    const type = searchParams.get("type") || "monthly";
    const format = searchParams.get("format") || "excel";
    const year = Number(searchParams.get("year") || new Date().getFullYear());

    if (type !== "monthly") {
      return NextResponse.json(
        { error: "Only monthly export is available now." },
        { status: 400 }
      );
    }

    if (!["excel", "pdf"].includes(format)) {
      return NextResponse.json(
        { error: "format must be excel or pdf." },
        { status: 400 }
      );
    }

    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      return NextResponse.json({ error: "Invalid year." }, { status: 400 });
    }

    const monthly = await getMonthlyReport(year);

    if (format === "excel") {
      const buffer = await createExcel(monthly, year);

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="monthly-accounting-${year}.xlsx"`,
        },
      });
    }

    const buffer = await createPdf(monthly, year);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="monthly-accounting-${year}.pdf"`,
      },
    });
  } catch (err) {
    console.error("[GET /api/admin/accounting/export]", err);

    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
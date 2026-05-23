import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";

const MONTH_NAMES = [
  "",
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function calcEmi(loan, annualPct, months) {
  const monthlyRate = annualPct / 100 / 12;

  if (monthlyRate === 0) {
    return loan / months;
  }

  return (
    (loan * monthlyRate * Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1)
  );
}

export async function GET(req) {
  try {
    const current = await getCurrentUser();

    if (!current) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const yearParam = searchParams.get("year");

    const sales = await prisma.inventorySale.findMany({
      where: {
        ownerId: current.id,
        ...(yearParam ? { year: Number.parseInt(yearParam, 10) } : {}),
      },
      include: {
        product: {
          select: {
            brandName: true,
            model: true,
            variant: true,
          },
        },
      },
      orderBy: [{ year: "asc" }, { month: "asc" }],
    });

    const monthlyMap = {};

    for (const sale of sales) {
      const key = `${sale.year}-${String(sale.month).padStart(2, "0")}`;

      if (!monthlyMap[key]) {
        monthlyMap[key] = {
          year: sale.year,
          month: sale.month,
          monthName: MONTH_NAMES[sale.month],
          sales: [],
          revenue: 0,
          cost: 0,
          profit: 0,
          units: 0,
        };
      }

      monthlyMap[key].revenue += sale.sellPrice * sale.qty;
      monthlyMap[key].cost += sale.buyPrice * sale.qty;
      monthlyMap[key].profit += sale.profit;
      monthlyMap[key].units += sale.qty;

      monthlyMap[key].sales.push({
        ...sale,
        revenue: sale.sellPrice * sale.qty,
        cost: sale.buyPrice * sale.qty,
      });
    }

    const months = Object.values(monthlyMap).map((month) => ({
      ...month,
      revenue: Number(month.revenue.toFixed(2)),
      cost: Number(month.cost.toFixed(2)),
      profit: Number(month.profit.toFixed(2)),
      profitMargin:
        month.cost > 0
          ? Number(((month.profit / month.cost) * 100).toFixed(2))
          : 0,
    }));

    const totals = {
      revenue: Number(months.reduce((sum, month) => sum + month.revenue, 0).toFixed(2)),
      cost: Number(months.reduce((sum, month) => sum + month.cost, 0).toFixed(2)),
      profit: Number(months.reduce((sum, month) => sum + month.profit, 0).toFixed(2)),
      units: months.reduce((sum, month) => sum + month.units, 0),
      monthCount: months.length,
    };

    totals.avgMonthlyProfit = months.length
      ? Number((totals.profit / months.length).toFixed(2))
      : 0;

    totals.avgMonthlyRevenue = months.length
      ? Number((totals.revenue / months.length).toFixed(2))
      : 0;

    totals.profitMargin =
      totals.cost > 0
        ? Number(((totals.profit / totals.cost) * 100).toFixed(2))
        : 0;

    const productStats = {};

    for (const sale of sales) {
      const key = sale.productId;

      if (!productStats[key]) {
        productStats[key] = {
          productId: key,
          name: `${sale.product.brandName} ${sale.product.model}${
            sale.product.variant ? " " + sale.product.variant : ""
          }`,
          unitsSold: 0,
          baseProfit: 0,
          sellPrice: sale.sellPrice,
          buyPrice: sale.buyPrice,
        };
      }

      productStats[key].unitsSold += sale.qty;
      productStats[key].baseProfit += sale.profit;
    }

    const interestScenarios = Object.values(productStats).map((product) => {
      const scenarios = [
        { rate: 10, tenure: 3 },
        { rate: 10, tenure: 6 },
        { rate: 20, tenure: 3 },
        { rate: 20, tenure: 6 },
      ].map(({ rate, tenure }) => {
        const emi = calcEmi(product.sellPrice, rate, tenure);
        const totalPay = Number((emi * tenure).toFixed(2));
        const interest = Number((totalPay - product.sellPrice).toFixed(2));

        const baseProfitPerUnit =
          product.unitsSold > 0 ? product.baseProfit / product.unitsSold : 0;

        const profitPerUnit = Number((baseProfitPerUnit + interest).toFixed(2));

        return {
          rate,
          tenure,
          emi: Number(emi.toFixed(2)),
          totalPay,
          interest,
          profitPerUnit,
        };
      });

      return {
        ...product,
        baseProfit: Number(product.baseProfit.toFixed(2)),
        scenarios,
      };
    });

    return NextResponse.json({
      months,
      totals,
      interestScenarios,
    });
  } catch (error) {
    console.error("[GET /api/admin/inventory/reports/monthly]", error);

    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
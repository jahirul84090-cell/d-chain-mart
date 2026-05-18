/**
 * File: app/api/admin/loans/route.js
 *
 * GET /api/admin/loans
 *
 * Paginated, filterable list of all loan applications.
 * Includes per-loan totalCollected and global KPI stats.
 *
 * Query params:
 *   status    — LoanStatus enum value or "ALL" (default "ALL")
 *   search    — searches user name, email, NID number, product name
 *   page      — page number, default 1
 *   limit     — results per page, default 20, max 50
 *   sortBy    — field name, default "appliedAt"
 *   sortOrder — "asc" | "desc", default "desc"
 *
 * Response shape:
 *   {
 *     loans:      LoanApplication[] (each with totalCollected attached),
 *     pagination: { total, page, limit, totalPages },
 *     stats: {
 *       [LoanStatus]: { count, totalLoanAmount, totalPayable },
 *       _global: { totalCollected, totalOutstanding, totalDisbursed }
 *     }
 *   }
 */

import { NextResponse }   from "next/server";
import { getCurrentUser } from "@/lib/user";
import { prisma }         from "@/lib/prisma";
import { isAdminUser }    from "@/lib/loan-utils";

// ─── GET /api/admin/loans ─────────────────────────────────────────────────────

export async function GET(req) {
  try {
    // ── Auth ──
    const current = await getCurrentUser();
    if (!isAdminUser(current))
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const status    = searchParams.get("status")    || "ALL";
    const search    = searchParams.get("search")    || "";
    const page      = Math.max(1, parseInt(searchParams.get("page")  || "1"));
    const limit     = Math.min(50, parseInt(searchParams.get("limit") || "20"));
    const sortBy    = searchParams.get("sortBy")    || "appliedAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const skip      = (page - 1) * limit;

    // ── Where clause ──
    const where = {
      ...(status && status !== "ALL" ? { status } : {}),
      ...(search.trim()
        ? {
            OR: [
              { user:    { name:  { contains: search } } },
              { user:    { email: { contains: search } } },
              { nidNumber:         { contains: search } },
              { product: { name:   { contains: search } } },
            ],
          }
        : {}),
    };

    // ── Parallel queries ──
    const [loans, total, rawStats, globalPayments] = await Promise.all([
      // Paginated loan list
      prisma.loanApplication.findMany({
        where,
        skip,
        take:    limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          user:    { select: { id: true, name: true, email: true, image: true } },
          product: { select: { id: true, name: true, mainImage: true, slug: true } },
          installments: {
            select: {
              id: true, status: true, amount: true,
              paidAmount: true, remainingAmount: true, lateFee: true,
            },
          },
          payments: {
            where:  { status: "SUCCESS" },
            select: { amount: true },
          },
          _count: { select: { payments: true, documents: true } },
        },
      }),

      // Total count for pagination
      prisma.loanApplication.count({ where }),

      // Per-status KPI stats (always unfiltered for global overview)
      prisma.loanApplication.groupBy({
        by:    ["status"],
        _count: { id: true },
        _sum:   { loanAmount: true, totalPayable: true },
      }),

      // Global total collected from all SUCCESS payments
      prisma.loanPayment.aggregate({
        where:  { status: "SUCCESS" },
        _sum:   { amount: true },
      }),
    ]);

    // ── Attach totalCollected to each loan ──
    const loansWithCollected = loans.map((l) => {
      const totalCollected = (l.payments || []).reduce((sum, p) => sum + p.amount, 0);
      const totalOutstanding = (l.installments || []).reduce(
        (sum, i) => sum + (i.remainingAmount || 0),
        0
      );
      // Remove raw payments array from response (already aggregated)
      const { payments: _p, ...rest } = l;
      return {
        ...rest,
        totalCollected:   parseFloat(totalCollected.toFixed(2)),
        totalOutstanding: parseFloat(totalOutstanding.toFixed(2)),
      };
    });

    // ── Build per-status stat map ──
    const stats = {};
    for (const s of rawStats) {
      stats[s.status] = {
        count:           s._count.id,
        totalLoanAmount: parseFloat((s._sum.loanAmount  || 0).toFixed(2)),
        totalPayable:    parseFloat((s._sum.totalPayable || 0).toFixed(2)),
      };
    }

    // ── Global financial summary ──
    const totalDisbursed  = rawStats.reduce((a, s) => a + (s._sum.loanAmount || 0), 0);
    const totalCollectedGlobal = globalPayments._sum.amount || 0;

    stats._global = {
      totalDisbursed:   parseFloat(totalDisbursed.toFixed(2)),
      totalCollected:   parseFloat(totalCollectedGlobal.toFixed(2)),
    };

    return NextResponse.json({
      loans:      loansWithCollected,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      stats,
    });
  } catch (err) {
    console.error("[GET /api/admin/loans]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
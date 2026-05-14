"use client";

import { useState, useEffect } from "react";
import { TrendingUp, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button"; // Button is not used anymore
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// A helper function to aggregate data for the chart
const processOrdersForChart = (orders) => {
  const dailyData = {};
  orders.forEach((order) => {
    const date = format(parseISO(order.createdAt), "yyyy-MM-dd");
    if (!dailyData[date]) {
      dailyData[date] = { date, orders: 0 };
    }
    dailyData[date].orders += 1;
  });
  return Object.values(dailyData).sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );
};

export default function OrdersChart() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("week");
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const fetchChartData = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/admin/dashboard/orders/charts?period=${period}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch chart data.");
        }
        const data = await response.json();
        const processedData = processOrdersForChart(data.orders);
        setChartData(processedData);
      } catch (error) {
        console.error("Failed to fetch chart data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, [period]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-10 w-10 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-center">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" /> Sales & Order Trends
        </CardTitle>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Last 24 Hours</SelectItem>
            <SelectItem value="week">Last 7 Days</SelectItem>
            <SelectItem value="month">Last 30 Days</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#ccc"
            />
            <XAxis
              dataKey="date"
              tickFormatter={(str) => format(parseISO(str), "MMM d")}
              tickLine={false}
              axisLine={false}
              className="text-xs"
            />
            <YAxis tickLine={false} axisLine={false} className="text-xs" />
            <Tooltip
              labelFormatter={(value) =>
                `Date: ${format(parseISO(value), "MMM d, yyyy")}`
              }
              formatter={(value) => [`${value} Orders`, ""]}
            />
            <Line
              type="monotone"
              dataKey="orders"
              stroke="#06B6D4"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

import OrdersChart from "@/components/Admin/Dashboard/Dashboard-Main/OrdersChart";
import Summary from "@/components/Admin/Dashboard/Dashboard-Main/Summary";
import React from "react";

const page = () => {
  return (
    <>
      <div className="p-6 space-y-8">
        <Summary />
        <OrdersChart />
      </div>
    </>
  );
};

export default page;

// app/order/pending/page.jsx
export default function OrderPendingPage() {
  return (
    <div className="container mx-auto p-6 text-center">
      <h1 className="text-3xl font-bold mb-4">Order Pending</h1>
      <p className="text-gray-600">
        Your payment was successful, but the order is still being processed.
        Please wait a moment and refresh this page.
      </p>
    </div>
  );
}

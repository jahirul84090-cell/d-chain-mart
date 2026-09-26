import { redirect } from "next/navigation";

// Editing happens on the order details page (status, payment, invoice).
export default async function EditOrderRedirect({ params }) {
  const { id } = await params;
  redirect(`/dashboard/order/${encodeURIComponent(id)}`);
}

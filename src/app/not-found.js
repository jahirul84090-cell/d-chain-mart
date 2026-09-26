import NotFoundContent from "@/components/others/NotFoundContent";

export const metadata = {
  title: "Page Not Found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main className="min-h-screen bg-background">
      <NotFoundContent />
    </main>
  );
}

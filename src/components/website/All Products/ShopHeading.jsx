// Heading shared by the server-rendered shop fallback and the interactive
// catalogue, so the page looks the same before and after JavaScript loads.
export default function ShopHeading() {
  return (
    <div className="relative overflow-hidden bg-primary text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] mb-1.5 text-white/80">Our store</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Shop all products</h1>
        <p className="mt-2 text-sm max-w-md leading-relaxed text-white/90">
          Mobiles, laptops, smart watches and accessories with cash on delivery and EMI across Bangladesh.
        </p>
      </div>
    </div>
  );
}

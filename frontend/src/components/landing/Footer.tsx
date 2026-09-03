import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-background pt-20 pb-10 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
        
        <div className="col-span-2 md:col-span-1">
          <Link href="/" className="inline-block mb-6">
            <span className="text-2xl font-black tracking-[0.2em] text-white">
              GIGLY
            </span>
          </Link>
          <p className="text-white/40 text-sm leading-relaxed max-w-xs">
            The next generation of freelance escrow. Built on Polygon, powered by Account Abstraction.
          </p>
        </div>

        <div>
          <h4 className="text-white font-bold mb-6">Products</h4>
          <ul className="space-y-4">
            <li><Link href="/login" className="text-white/50 hover:text-white transition-colors text-sm">For Clients</Link></li>
            <li><Link href="/login" className="text-white/50 hover:text-white transition-colors text-sm">For Freelancers</Link></li>
            <li><Link href="#" className="text-white/50 hover:text-white transition-colors text-sm">Escrow Contracts</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-6">Developers</h4>
          <ul className="space-y-4">
            <li><Link href="#" className="text-white/50 hover:text-white transition-colors text-sm">Documentation</Link></li>
            <li><Link href="#" className="text-white/50 hover:text-white transition-colors text-sm">Smart Contracts</Link></li>
            <li><Link href="#" className="text-white/50 hover:text-white transition-colors text-sm">GitHub</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-6">Company</h4>
          <ul className="space-y-4">
            <li><Link href="#" className="text-white/50 hover:text-white transition-colors text-sm">About Us</Link></li>
            <li><Link href="#" className="text-white/50 hover:text-white transition-colors text-sm">Terms of Service</Link></li>
            <li><Link href="#" className="text-white/50 hover:text-white transition-colors text-sm">Privacy Policy</Link></li>
          </ul>
        </div>

      </div>
      
      <div className="max-w-7xl mx-auto border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center">
        <div className="text-white/30 text-sm mb-4 md:mb-0">
          © 2026 Gigly Escrow. All rights reserved.
        </div>
        <div className="flex items-center gap-6">
          <Link href="#" className="text-white/30 hover:text-white text-sm transition-colors">Twitter</Link>
          <Link href="#" className="text-white/30 hover:text-white text-sm transition-colors">Discord</Link>
          <Link href="#" className="text-white/30 hover:text-white text-sm transition-colors">Telegram</Link>
        </div>
      </div>
    </footer>
  );
}

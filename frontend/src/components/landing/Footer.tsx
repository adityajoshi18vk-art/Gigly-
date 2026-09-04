import Link from "next/link";

export function Footer() {
  return (
    <footer className="relative border-t border-[#E2E8F0] bg-white/90 pt-20 pb-10 px-6">
      {/* Subtle glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-[#0DA5F0]/5 blur-[80px] rounded-full pointer-events-none" />
      
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12 mb-16 relative z-10">
        
        <div className="col-span-2 md:col-span-1">
          <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
            <span className="flex w-2.5 h-2.5 rounded-full bg-[#0DA5F0] shadow-[0_0_8px_rgba(13,165,240,0.6)]" />
            <span className="font-display text-2xl font-bold tracking-[0.15em] text-[#071014]">
              GIGLY
            </span>
          </Link>
          <p className="text-[#64748B] text-sm leading-relaxed max-w-xs">
            The next generation of freelance escrow. Built on Ethereum, powered by Account Abstraction.
          </p>
        </div>

        <div>
          <h4 className="text-[#071014] font-semibold mb-6 text-sm uppercase font-mono tracking-wider">Products</h4>
          <ul className="space-y-4">
            <li><Link href="/#for-clients" className="text-[#64748B] hover:text-[#0DA5F0] transition-colors text-sm">For Clients</Link></li>
            <li><Link href="/#for-freelancers" className="text-[#64748B] hover:text-[#0DA5F0] transition-colors text-sm">For Freelancers</Link></li>
            <li><Link href="/contracts" className="text-[#64748B] hover:text-[#0DA5F0] transition-colors text-sm">Escrow Contracts</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-[#071014] font-bold mb-6 text-sm uppercase font-mono tracking-wider">Developers</h4>
          <ul className="space-y-4">
            <li><Link href="/docs" className="text-[#334155] font-medium hover:text-[#0DA5F0] transition-colors text-sm">Documentation</Link></li>
            <li><Link href="/contracts" className="text-[#334155] font-medium hover:text-[#0DA5F0] transition-colors text-sm">Smart Contracts</Link></li>
            <li><a href="https://github.com/adityajoshi18vk-art/Gigly-" target="_blank" rel="noopener noreferrer" className="text-[#334155] font-medium hover:text-[#0DA5F0] transition-colors text-sm">GitHub</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-[#071014] font-bold mb-6 text-sm uppercase font-mono tracking-wider">Company</h4>
          <ul className="space-y-4">
            <li><Link href="/about" className="text-[#334155] font-medium hover:text-[#0DA5F0] transition-colors text-sm">About Us</Link></li>
            <li><Link href="/terms" className="text-[#334155] font-medium hover:text-[#0DA5F0] transition-colors text-sm">Terms of Service</Link></li>
            <li><Link href="/privacy" className="text-[#334155] font-medium hover:text-[#0DA5F0] transition-colors text-sm">Privacy Policy</Link></li>
          </ul>
        </div>

      </div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="section-divider mb-8" />
        <div className="text-center text-[#475569] font-medium text-sm">
          © 2026 Gigly Escrow. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

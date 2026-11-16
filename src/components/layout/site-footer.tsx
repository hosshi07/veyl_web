import Link from "next/link";
import { navigation } from "@/lib/navigation";
import { GateMark, Arrow } from "@/components/ui/icon";
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <Link href="/" className="brand" aria-label="VEYL トップページ">
          <GateMark />
          <span>VEYL</span>
        </Link>
        <p>BEYOND THE VEIL. INTO THE UNKNOWN.</p>
        <a href="#top" className="back-top">
          BACK TO TOP <Arrow diagonal />
        </a>
      </div>
      <div className="footer-bottom">
        <small>© {new Date().getFullYear()} VEYL PROJECT</small>
        <nav aria-label="フッターナビゲーション">
          {navigation.map((item) => (
            <Link href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <span className="development-label">IN DEVELOPMENT</span>
      </div>
    </footer>
  );
}

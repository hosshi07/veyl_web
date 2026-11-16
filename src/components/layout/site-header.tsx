"use client";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { navigation } from "@/lib/navigation";
import { Arrow, GateMark } from "@/components/ui/icon";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        toggle.current?.focus();
      }
      if (event.key === "Tab") {
        const links = panel.current?.querySelectorAll<HTMLAnchorElement>("a");
        const last = links?.[links.length - 1];
        if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          toggle.current?.focus();
        }
        if (event.shiftKey && document.activeElement === toggle.current) {
          event.preventDefault();
          last?.focus();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);
  return (
    <header className="site-header">
      <Link href="/" className="brand" aria-label="VEYL トップページ">
        <GateMark />
        <span>
          VEYL<span className="brand-sub">OFFICIAL WEBSITE</span>
        </span>
      </Link>
      <nav className="desktop-nav" aria-label="メインナビゲーション">
        {navigation.map((item) => (
          <Link key={item.href} href={item.href}>
            {item.label}
          </Link>
        ))}
      </nav>
      <Link className="header-cta" href="/#download">
        DOWNLOAD <Arrow diagonal />
      </Link>
      <button
        ref={toggle}
        className="menu-toggle"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "メニューを閉じる" : "メニューを開く"}
        onClick={() => setOpen(!open)}
      >
        <span>{open ? "CLOSE" : "MENU"}</span>
        <span className={open ? "menu-lines is-open" : "menu-lines"}>
          <i />
          <i />
        </span>
      </button>
      <nav
        ref={panel}
        id="mobile-menu"
        className="mobile-nav"
        hidden={!open}
        aria-label="モバイルナビゲーション"
      >
        {navigation.map((item, index) => (
          <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
            <small>
              0{index + 1} / {item.en}
            </small>
            {item.label}
            <Arrow />
          </Link>
        ))}
        <Link href="/#download" onClick={() => setOpen(false)}>
          <small>05 / ACCESS</small>ダウンロード
          <Arrow />
        </Link>
      </nav>
    </header>
  );
}

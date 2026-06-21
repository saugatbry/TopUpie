"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

import Container from "./container";
import { Separator } from "./ui/separator";

import { nightTokyo } from "@/utils/fonts";
import { ROUTES } from "@/constants/routes";
import React, { ReactNode, useRef, useState } from "react";

import SearchBar from "./search-bar";
import { ChevronDown, MenuIcon, SearchIcon, X } from "lucide-react";
import useScrollPosition from "@/hooks/use-scroll-position";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "./ui/sheet";
import LoginPopoverButton from "./login-popover-button";
import { useAuthStore } from "@/store/auth-store";
import NavbarAvatar from "./navbar-avatar";

const menuItems: Array<{ title: string; href?: string; children?: Array<{ title: string; href: string }> }> = [
  {
    title: "Anime",
    href: ROUTES.SEARCH,
    children: [
      { title: "Trending", href: "/anime/trending" },
      { title: "Top Anime", href: "/anime/top" },
      { title: "Movies", href: "/anime/movies" },
      { title: "Schedule", href: "/schedule" },
      { title: "Discover", href: "/discover" },
      { title: "A-Z List", href: "/anime/az-list/a" },
      { title: "Characters", href: "/characters" },
      { title: "People / Staff", href: "/people" },
    ],
  },
  {
    title: "Manga",
    href: ROUTES.MANGA,
  },
];

const NavBar = () => {
  const auth = useAuthStore();
  const { y } = useScrollPosition();
  const isHeaderSticky = y > 0;
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  return (
    <nav
      className={cn([
        "h-fit w-full",
        "sticky top-0 z-[100]",
        "bg-slate-950/80 backdrop-blur-xl border-b border-white/5",
        isHeaderSticky ? "shadow-lg shadow-black/20" : "",
      ])}
      aria-label="Main navigation"
    >
      <Container className="flex items-center justify-between py-2 gap-4 md:gap-10 lg:gap-20 ">
        <Link
          href={ROUTES.HOME}
          className="flex items-center gap-1 cursor-pointer shrink-0"
          aria-label="TopUpie Anime - Home"
        >
          <Image src="https://i.ibb.co/kCDz26G/image-removebg-preview.png" alt="TopUpie Anime logo" width={50} height={50} className="md:w-[70px] md:h-[70px]" />
          <span
            className={cn([
              nightTokyo.className,
              "text-lg md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-pink-600 tracking-widest",
            ])}
          >
            TopUpie Anime
          </span>
        </Link>

        <div className="hidden lg:flex items-center gap-6 ml-20">
          {menuItems.map((menu, idx) =>
            menu.children ? (
              <NavDropdown key={idx} menu={menu} />
            ) : (
              <Link href={menu.href || "#"} key={idx}>
                {menu.title}
              </Link>
            )
          )}
        </div>
        <div className="w-1/3 hidden lg:flex items-center gap-5">
          <SearchBar />
          {auth.auth ? <NavbarAvatar auth={auth} /> : <LoginPopoverButton />}
        </div>
        <div className="lg:hidden flex items-center gap-2">
          <button onClick={() => setMobileSearchOpen(!mobileSearchOpen)} aria-label={mobileSearchOpen ? "Close search" : "Open search"} aria-expanded={mobileSearchOpen}>
            <SearchIcon suppressHydrationWarning className="h-5 w-5" />
          </button>
          <MobileMenuSheet trigger={<MenuIcon suppressHydrationWarning aria-label="Open menu" />} />
          {auth.auth ? <NavbarAvatar auth={auth} /> : <LoginPopoverButton />}
        </div>
      </Container>
      {mobileSearchOpen && (
        <div className="lg:hidden px-4 pb-3">
          <SearchBar onAnimeClick={() => setMobileSearchOpen(false)} />
        </div>
      )}
    </nav>
  );
};

const NavDropdown = ({ menu }: { menu: typeof menuItems[0] }) => {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  return (
    <div
      className="relative"
      onMouseEnter={() => { clearTimeout(timeoutRef.current); setOpen(true); }}
      onMouseLeave={() => { timeoutRef.current = setTimeout(() => setOpen(false), 150); }}
    >
      <button className="flex items-center gap-1 cursor-default">
        {menu.title}
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div
          className="absolute top-full left-0 mt-2 w-48 rounded-xl bg-slate-900 border border-slate-800 shadow-xl py-2 z-50"
          onMouseEnter={() => { clearTimeout(timeoutRef.current); setOpen(true); }}
          onMouseLeave={() => { timeoutRef.current = setTimeout(() => setOpen(false), 150); }}
        >
          {menu.children?.map((child, i) => (
            <Link
              key={i}
              href={child.href}
              className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-slate-800 transition-colors"
              onClick={() => setOpen(false)}
            >
              {child.title}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

const MobileMenuSheet = ({ trigger }: { trigger: ReactNode }) => {
  const [open, setOpen] = useState<boolean>(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger>{trigger}</SheetTrigger>
      <SheetContent
        className="flex flex-col w-[80vw] z-[150]"
        hideCloseButton
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <div className="w-full h-full relative">
          <SheetClose className="absolute top-0 right-0" aria-label="Close menu">
            <X />
          </SheetClose>
          <div className="flex flex-col gap-2 mt-10">
            {menuItems.map((menu, idx) => (
              <div key={idx}>
                {menu.children ? (
                  <>
                    <button
                      onClick={() => setExpanded(expanded === menu.title ? null : menu.title)}
                      className="flex items-center justify-between w-full py-2 text-left"
                    >
                      {menu.title}
                      <ChevronDown className={`h-4 w-4 transition-transform ${expanded === menu.title ? "rotate-180" : ""}`} />
                    </button>
                    {expanded === menu.title && menu.children.map((child, ci) => (
                      <Link
                        key={ci}
                        href={child.href}
                        className="block py-2 pl-4 text-sm text-gray-400"
                        onClick={() => setOpen(false)}
                      >
                        {child.title}
                      </Link>
                    ))}
                  </>
                ) : (
                  <Link
                    href={menu.href || "#"}
                    onClick={() => setOpen(false)}
                    className="block py-2"
                  >
                    {menu.title}
                  </Link>
                )}
              </div>
            ))}
            <Separator />
            <SearchBar onAnimeClick={() => setOpen(false)} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default NavBar;

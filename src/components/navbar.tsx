"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

import Container from "./container";
import { Separator } from "./ui/separator";

import { nightTokyo } from "@/utils/fonts";
import { ROUTES } from "@/constants/routes";
import React, { ReactNode, useState } from "react";

import SearchBar from "./search-bar";
import { MenuIcon, SearchIcon, X } from "lucide-react";
import useScrollPosition from "@/hooks/use-scroll-position";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "./ui/sheet";
import LoginPopoverButton from "./login-popover-button";
import { useAuthStore } from "@/store/auth-store";
import NavbarAvatar from "./navbar-avatar";

const menuItems: Array<{ title: string; href?: string }> = [
  // {
  //   title: "Home",
  //   href: ROUTES.HOME,
  // },
  // {
  //   title: "Catalog",
  // },
  // {
  //   title: "News",
  // },
  // {
  //   title: "Collection",
  // },
];

const NavBar = () => {
  const auth = useAuthStore();
  const { y } = useScrollPosition();
  const isHeaderSticky = y > 0;
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  return (
    <div
      className={cn([
        "h-fit w-full",
        "sticky top-0 z-[100] duration-300",
        "bg-gradient-to-b from-slate-700",
        isHeaderSticky
          ? "bg-clip-padding backdrop-filter backdrop-blur-md bg-opacity-10 bg-slate-900"
          : "",
      ])}
    >
      <Container className="flex items-center justify-between py-2 gap-4 md:gap-10 lg:gap-20 ">
        <Link
          href={ROUTES.HOME}
          className="flex items-center gap-1 cursor-pointer shrink-0"
        >
          <Image src="https://i.ibb.co/kCDz26G/image-removebg-preview.png" alt="logo" width={50} height={50} className="md:w-[70px] md:h-[70px]" unoptimized />
          <h1
            className={cn([
              nightTokyo.className,
              "text-lg md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-pink-600 tracking-widest",
            ])}
          >
            TopUpie Anime
          </h1>
        </Link>

        <div className="hidden lg:flex items-center gap-10 ml-20">
          {menuItems.map((menu, idx) => (
            <Link href={menu.href || "#"} key={idx}>
              {menu.title}
            </Link>
          ))}
        </div>
        <div className="w-1/3 hidden lg:flex items-center gap-5">
          <SearchBar />
          {auth.auth ? <NavbarAvatar auth={auth} /> : <LoginPopoverButton />}
        </div>
        <div className="lg:hidden flex items-center gap-2">
          <button onClick={() => setMobileSearchOpen(!mobileSearchOpen)}>
            <SearchIcon suppressHydrationWarning className="h-5 w-5" />
          </button>
          <MobileMenuSheet trigger={<MenuIcon suppressHydrationWarning />} />
          {auth.auth ? <NavbarAvatar auth={auth} /> : <LoginPopoverButton />}
        </div>
      </Container>
      {mobileSearchOpen && (
        <div className="lg:hidden px-4 pb-3">
          <SearchBar onAnimeClick={() => setMobileSearchOpen(false)} />
        </div>
      )}
    </div>
  );
};

const MobileMenuSheet = ({ trigger }: { trigger: ReactNode }) => {
  const [open, setOpen] = useState<boolean>(false);
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
          <SheetClose className="absolute top-0 right-0">
            <X />
          </SheetClose>
          <div className="flex flex-col gap-5 mt-10">
            {menuItems.map((menu, idx) => (
              <Link
                href={menu.href || "#"}
                key={idx}
                onClick={() => setOpen(false)}
              >
                {menu.title}
              </Link>
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

import { Outlet } from "react-router";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { MobileNav } from "./components/MobileNav";

export function Root() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#f4f6fb" }}>
      <Navbar />
      <main className="flex-1 pb-20 md:pb-0">
        <Outlet />
      </main>
      <Footer />
      <MobileNav />
    </div>
  );
}

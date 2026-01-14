/**
 * ProcessesLayout - Shared layout for process pages
 */

import NavBar from "@/components/NavBar";

export default function ProcessesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      {children}
    </div>
  );
}

/**
 * EventsLayout - Shared layout for event pages
 */

import NavBar from "@/components/NavBar";

export default function EventsLayout({
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

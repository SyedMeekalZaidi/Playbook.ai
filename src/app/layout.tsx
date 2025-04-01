// src/app/layout.tsx
import type { Metadata } from "next";
import "../styles/globals.css"; // Your Tailwind styles
// Load BPMN core styles globally (these are required for the modeler to render)
// import "/bpmn-modeler/assets/bpmn-js/diagram-js.css";
// import "/bpmn-modeler/assets/bpmn-js/bpmn-js.css";
// import "/bpmn-modeler/assets/bpmn-js/bpmn-font/css/bpmn-embedded.css";

export const metadata: Metadata = {
  title: "Process Mapping Tool",
  description: "A tool for mapping processes with BPMN",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
import AuthDebugComponent from './auth-debug';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* This component helps with debugging auth issues */}
      <AuthDebugComponent />
      
      {/* Your existing layout content */}
      {children}
    </>
  );
}

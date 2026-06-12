import { AppChrome } from "@/components/layout/app-chrome";

export default function StaticLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppChrome>{children}</AppChrome>;
}

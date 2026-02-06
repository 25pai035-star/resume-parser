import "./globals.css";

export const metadata = {
  title: "Resume Parser",
  description: "AI Resume Parser",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

import "./globals.css";

export const metadata = {
  title: "Smart Resume Parser",
  description: "AI-powered resume screening"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

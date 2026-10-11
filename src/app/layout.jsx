import "./globals.css";

export const metadata = {
  title: "Core Forge ClientOS",
  description: "Enterprise operating system for internal operations.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-white antialiased">
        {children}
      </body>
    </html>
  );
}
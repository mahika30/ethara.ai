import "./globals.css";

export const metadata = {
  title: "Ethare Team Task Manager",
  description: "A premium collaborative platform for project planning, team communication, role-based access control, and real-time task status tracking.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}

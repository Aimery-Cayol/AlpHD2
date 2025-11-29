import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import { Amplify } from 'aws-amplify';
import outputs from '../../amplify_outputs.json';
import { AppProvider } from '../contexts/AppContext';

Amplify.configure(outputs);

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AlpHD - Visualisation 3D HD",
  description:
    "Application de visualisation de données LiDAR haute définition pour l'analyse de terrains montagneux",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <AppProvider>
          <div className="min-h-screen bg-gray-50">
            <Header />
            <main className="flex-1">{children}</main>
          </div>
        </AppProvider>
      </body>
    </html>
  );
}
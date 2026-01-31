import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import DisableMiddleMouseScroll from "../components/DisableMiddleMouseScroll";
import { Amplify } from 'aws-amplify';
import { AppProvider } from '../contexts/AppContext';

// Configure Amplify : DEUX LIGNES A COMMENTER LORS DE L'UTILISATION par FORK
import outputs from '../../amplify_outputs.json';
Amplify.configure(outputs);

// Ancien test pour environnement sandbox : à garder commenté tant qu'on n'y revient pas :
// import sandboxOutputs from '../../amplify_outputs.sandbox.json';
// const isSandbox = process.env.NEXT_PUBLIC_ENV === 'sandbox';
// Amplify.configure(isSandbox ? sandboxOutputs : outputs);

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
        <DisableMiddleMouseScroll />
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
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./Providers";
import "@rainbow-me/rainbowkit/styles.css";
import { AppWrapper } from "./components/context";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: 'Artifex',
  description: 'Your NFT Analytics Platform',
  
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
       
      >
        <AppWrapper>
          <Providers>
          
            {children}
           
          </Providers>
        </AppWrapper>
      </body>
    </html>
  );
}

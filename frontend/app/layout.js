import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./Providers";
import "@rainbow-me/rainbowkit/styles.css";
import { AppWrapper } from "../components/context";
import { WebSocketProvider } from "@/context/WebSocketContext";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppWrapper>
          <WebSocketProvider>
            <Providers>{children}</Providers>
          </WebSocketProvider>
        </AppWrapper>
      </body>
    </html>
  );
}

import ConnectWalletButton from "./components/ConnectWalletButton";
import LandingPage from "./components/LandingPage";
import { Maven_Pro } from "next/font/google";


export const MavenPro = Maven_Pro({
  weights: [200, 300, 400, 500, 600, 700],
  display: "swap",
  subsets: ["latin"],
})

export default function Home() {
    return (
        <>
        
    <main className={MavenPro.className}>
      <LandingPage />
    </main>
        </>
     
  );
}

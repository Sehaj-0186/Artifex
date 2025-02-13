import ChatInterface from "./components/ChatInterface";
import ConnectWalletButton from "../components/ConnectWalletButton";

export default function Home() {
    return (
        <>
          <div>
    <ConnectWalletButton />
  </div>
    <main>
      <ChatInterface />
    </main>
        </>
     
  );
}

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import AFA_ABI from "./abi/AFA.json";
import { CONTRACT_ADDRESS, CHAIN_ID, TOKEN_DECIMALS } from "./config";

function App() {
  const [wallet, setWallet] = useState("");
  const [contract, setContract] = useState(null);
  const [afaBalance, setAfaBalance] = useState(0);
  const [clicks, setClicks] = useState(0);
  const [loading, setLoading] = useState(false);

  const connectWallet = async () => {
    if (!window.ethereum) return alert("Install MetaMask dulu bro!");
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    setWallet(accounts[0]);

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const afa = new ethers.Contract(CONTRACT_ADDRESS, AFA_ABI, signer);
    setContract(afa);
  };

  const loadData = async () => {
    if (!contract || !wallet) return;
    const rawBalance = await contract.balanceOf(wallet);
    const rawClicks = await contract.clicks(wallet);
    setAfaBalance(Number(ethers.formatUnits(rawBalance, TOKEN_DECIMALS)));
    setClicks(Number(rawClicks));
  };

  const claim = async () => {
    try {
      setLoading(true);
      const tx = await contract.claimReward();
      await tx.wait();
      alert("Berhasil klaim 1 AFA 🎉");
      loadData();
    } catch (err) {
      alert("Gagal klaim: " + (err.reason || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    connectWallet();
  }, []);

  useEffect(() => {
    if (contract && wallet) {
      loadData();
    }
  }, [contract, wallet]);

  return (
    <div style={{ textAlign: "center", marginTop: 50 }}>
      <h1>🎁 Airdrop For All</h1>
      <p>Wallet: {wallet}</p>
      <p>Saldo AFA: {afaBalance}</p>
      <p>Klaim: {clicks} / 1000</p>

      <button onClick={claim} disabled={loading || clicks >= 1000}>
        {loading ? "Claiming..." : "Klik untuk Klaim 1 AFA"}
      </button>
    </div>
  );
}

export default App;

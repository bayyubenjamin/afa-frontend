import { useEffect, useState } from "react";
import { ethers } from "ethers";
import AFA_ABI from "./abi/AFA.json";
import { CONTRACT_ADDRESS, TOKEN_DECIMALS } from "./config";

const MATCHAIN_PARAMS = {
  chainId: "0x2BA", // 698
  chainName: "Matchain",
  rpcUrls: ["https://rpc.matchain.io"],
  nativeCurrency: {
    name: "BNB",
    symbol: "BNB",
    decimals: 18,
  },
  blockExplorerUrls: ["https://matchscan.io"],
};

function App() {
  const [wallet, setWallet] = useState("");
  const [contract, setContract] = useState(null);
  const [afaBalance, setAfaBalance] = useState(0);
  const [clicks, setClicks] = useState(0);
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState("");

  const connectWallet = async () => {
    if (!window.ethereum) return alert("Install MetaMask dulu bro!");
    try {
      // Cek dan switch ke Matchain
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: MATCHAIN_PARAMS.chainId }],
      });
    } catch (error) {
      if (error.code === 4902) {
        // Kalau chain belum ada, tambahkan dulu
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [MATCHAIN_PARAMS],
        });
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: MATCHAIN_PARAMS.chainId }],
        });
      } else {
        return alert("Gagal switch ke Matchain: " + error.message);
      }
    }

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
      setTxHash("");
      const tx = await contract.claimReward();
      const receipt = await tx.wait();
      setTxHash(receipt.hash);
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

      {txHash && (
        <p>
          TX:{" "}
          <a
            href={`https://matchscan.io/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Lihat di Matchscan
          </a>
        </p>
      )}

      {wallet && (
        <p>
          Smart Contract AFA:{" "}
          <a
            href={`https://matchscan.io/address/${CONTRACT_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {CONTRACT_ADDRESS}
          </a>
        </p>
      )}
    </div>
  );
}

export default App;

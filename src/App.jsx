import { useEffect, useState } from "react";
import { ethers } from "ethers";
import AFA_ABI from "./abi/AFA.json";
import { CONTRACT_ADDRESS, TOKEN_DECIMALS } from "./config";

const MATCHAIN_PARAMS = {
  chainId: "0x2BA", // 698 in hexadecimal
  chainName: "Matchain",
  nativeCurrency: {
    name: "BNB",
    symbol: "BNB",
    decimals: 18,
  },
  rpcUrls: ["https://rpc.matchain.io"],
  blockExplorerUrls: ["https://matchscan.io"],
};

function App() {
  const [wallet, setWallet] = useState("");
  const [contract, setContract] = useState(null);
  const [afaBalance, setAfaBalance] = useState(0);
  const [clicks, setClicks] = useState(0);
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState("");

  // Fungsi connect wallet khusus untuk switch ke jaringan Matchain
  const connectWallet = async () => {
    if (!window.ethereum) {
      return alert("Install MetaMask dulu bro!");
    }

    try {
      // Coba switch ke Matchain
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: MATCHAIN_PARAMS.chainId }],
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        // Chain belum ada, tambahkan
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [MATCHAIN_PARAMS],
          });
        } catch (addError) {
          console.error("Gagal add chain:", addError);
          return alert(
            "Gagal menambahkan jaringan Matchain ke MetaMask:\n" +
              addError.message
          );
        }
      } else {
        console.error("Gagal switch chain:", switchError);
        return alert(
          "Gagal switch jaringan ke Matchain:\n" + switchError.message
        );
      }
    }

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setWallet(accounts[0]);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const afa = new ethers.Contract(CONTRACT_ADDRESS, AFA_ABI, signer);
      setContract(afa);
    } catch (err) {
      console.error("Gagal connect wallet:", err);
      alert("Gagal menghubungkan wallet:\n" + err.message);
    }
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
      setTxHash(tx.hash);
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
    if (contract && wallet) loadData();
  }, [contract, wallet]);

  return (
    <div className="bg-[#0B0B1E] min-h-screen flex flex-col text-white font-inter">
      <header className="flex items-center justify-between bg-[#0B0B1E] px-5 py-4 border-b border-[#1A1A2E]">
        <div className="flex items-center space-x-3">
          <img
            src="https://i.imghippo.com/files/bSxL2407Lw.jpeg"
            alt="Airdrop For All Logo"
            className="w-10 h-10"
          />
          <span className="font-extrabold text-lg select-none">
            Airdrop For All
          </span>
        </div>
        <button
          className="text-white text-3xl focus:outline-none"
          aria-label="Open menu"
        >
          <i className="fas fa-bars"></i>
        </button>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center px-6 text-center relative overflow-hidden">
        <div className="relative w-28 h-28 mb-8">
          <img
            src="https://i.imghippo.com/files/bSxL2407Lw.jpeg"
            alt="AFA glowing logo"
            className="w-28 h-28 mx-auto rounded-full"
          />
          <div className="absolute inset-0 rounded-full border border-[#6C63FF] opacity-50" />
        </div>

        <h1 className="text-[#B9B9F9] font-extrabold text-2xl leading-tight max-w-xs mx-auto">
          FREE $AFA ON MATCHAIN
        </h1>
        <p className="text-[#C7C7E9] text-base max-w-md mt-4 mb-10">
          Follow Telegram channel First!
          <br />
          <a
            href="https://t.me/airdrop4ll"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#B9B9F9] font-semibold underline"
          >
            Airdrop For All
          </a>
        </p>

        <p className="mb-3">
          Wallet: <span className="font-mono">{wallet || "Belum terkoneksi"}</span>
        </p>
        <p className="mb-3">
          Balance AFA: <span className="font-mono">{afaBalance}</span>
        </p>
        <p className="mb-5">
          Claim: <span className="font-mono">{clicks} / 1000</span>
        </p>

        <button
          onClick={claim}
          disabled={loading || clicks >= 1000}
          className="flex items-center justify-center space-x-3 bg-gradient-to-r from-[#5A5AFD] to-[#9B59B6] text-white text-lg font-medium rounded-xl py-4 px-8 w-full max-w-md disabled:opacity-50"
        >
          <i className="fas fa-gift text-xl"></i>
          <span>{loading ? "Claiming..." : "Claim 1 $AFA Token"}</span>
          <i className="fas fa-arrow-right text-xl"></i>
        </button>

        {txHash && (
          <div className="mt-6 text-sm max-w-md break-words">
            Transaksi berhasil!
            <a
              href={`https://matchscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#6C63FF] underline ml-1"
            >
              Lihat di Matchscan
            </a>
            <p className="mt-2">
              Contract:{" "}
              <a
                href={`https://matchscan.io/address/${CONTRACT_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#6C63FF] underline"
              >
                {CONTRACT_ADDRESS}
              </a>
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;


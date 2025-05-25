import React, { useState } from "react";
import { ethers } from "ethers";

const MATCHAIN_CHAIN_ID_HEX = "0x2BA"; // 698 decimal
const MATCHAIN_RPC_URL = "https://rpc.matchain.io";
const MATCHAIN_NAME = "Matchain";
const MATCHAIN_SYMBOL = "BNB";
const MATCHAIN_EXPLORER = "https://matchscan.io";

const TOKEN_CONTRACT_ADDRESS = "0x83DA931DCf4ec72E8E80a97e199D2B8d37803305";

export default function MatchainDapp() {
  const [account, setAccount] = useState(null);
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);

  async function connectWallet() {
    try {
      if (!window.ethereum) {
        alert("Please install MetaMask or compatible wallet!");
        return;
      }
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const address = await signer.getAddress();

      // Switch to Matchain network
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: MATCHAIN_CHAIN_ID_HEX }],
        });
      } catch (switchError) {
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: MATCHAIN_CHAIN_ID_HEX,
                chainName: MATCHAIN_NAME,
                rpcUrls: [MATCHAIN_RPC_URL],
                nativeCurrency: {
                  name: MATCHAIN_SYMBOL,
                  symbol: MATCHAIN_SYMBOL,
                  decimals: 18,
                },
                blockExplorerUrls: [MATCHAIN_EXPLORER],
              },
            ],
          });
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: MATCHAIN_CHAIN_ID_HEX }],
          });
        } else {
          throw switchError;
        }
      }

      setAccount(address);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to connect wallet");
    }
  }

  async function claimReward() {
    setTxHash(null);
    setError(null);
    try {
      if (!window.ethereum) throw new Error("Wallet not connected");
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      const tokenAbi = [
        "function claimReward() external",
        "event Transfer(address indexed from, address indexed to, uint256 value)",
      ];

      const contract = new ethers.Contract(
        TOKEN_CONTRACT_ADDRESS,
        tokenAbi,
        signer
      );

      const tx = await contract.claimReward();
      const receipt = await tx.wait(1);

      setTxHash(receipt.transactionHash);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to claim reward");
    }
  }

  return (
    <div style={{ maxWidth: 500, margin: "auto", padding: 20 }}>
      <h2>Matchain AirdropForAll DApp</h2>

      {!account ? (
        <button onClick={connectWallet}>Connect Wallet</button>
      ) : (
        <>
          <p>
            Connected account: <b>{account}</b>
          </p>
          <button onClick={claimReward}>Claim Reward</button>
        </>
      )}

      {txHash && (
        <p>
          Transaction success!{" "}
          <a
            href={`${MATCHAIN_EXPLORER}/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            View on Matchscan
          </a>
        </p>
      )}

      {account && (
        <p>
          Token contract AFA:{" "}
          <a
            href={`${MATCHAIN_EXPLORER}/address/${TOKEN_CONTRACT_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {TOKEN_CONTRACT_ADDRESS}
          </a>
        </p>
      )}

      {error && <p style={{ color: "red" }}>Error: {error}</p>}
    </div>
  );
}

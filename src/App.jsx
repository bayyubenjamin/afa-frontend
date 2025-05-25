import { useState } from 'react'
import { ethers } from 'ethers'
import { CONTRACT_ADDRESS } from './config'
import './App.css'

function App() {
  const [walletAddress, setWalletAddress] = useState('')
  const [status, setStatus] = useState('')

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
        setWalletAddress(accounts[0])
        setStatus('Wallet connected!')
      } catch (err) {
        setStatus('Wallet connection failed.')
      }
    } else {
      setStatus('Install MetaMask dulu!')
    }
  }

  const claimReward = async () => {
    if (!window.ethereum) {
      setStatus('Wallet tidak ditemukan')
      return
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, [
        'function claimReward() public',
      ], signer)

      const tx = await contract.claimReward()
      setStatus('Transaction sent. Waiting...')
      await tx.wait()
      setStatus('✅ Reward claimed successfully!')
    } catch (err) {
      console.error(err)
      setStatus('❌ Claim failed: ' + (err.reason || err.message))
    }
  }

  return (
    <div className="card">
      <h1>$AFA Token DApp</h1>
      <p>Wallet: {walletAddress || 'Not Connected'}</p>
      <button onClick={connectWallet}>
        {walletAddress ? 'Connected' : 'Connect Wallet'}
      </button>
      <br /><br />
      <button onClick={claimReward} disabled={!walletAddress}>
        🎁 Claim Reward
      </button>
      <p>{status}</p>
    </div>
  )
}

export default App


import { ethers } from "./ethers-5.6.esm.min.js"
import { abi, contractAddress } from "./constants.js"

const connectButton = document.getElementById("connectButton")
const withdrawButton = document.getElementById("withdrawButton")
const fundButton = document.getElementById("fundButton")
const balanceButton = document.getElementById("balanceButton")
const display = document.getElementById('display')
connectButton.onclick = connect
withdrawButton.onclick = withdraw
fundButton.onclick = fund
balanceButton.onclick = getBalance

getBalance()

async function connect() {
  if (typeof window.ethereum !== "undefined") {
    try {
      await ethereum.request({ method: "eth_requestAccounts" })
    } catch (error) {
      console.log(error)
    }
    connectButton.innerHTML = "Connected"
    connectButton.classList.remove('btn-primary')
    connectButton.classList.add('btn-success')
    const accounts = await ethereum.request({ method: "eth_accounts" })
    console.log(accounts)
  } else {
    connectButton.innerHTML = "Please install MetaMask"
  }
}

async function withdraw() {
  console.log(`Withdrawing...`)
  if (typeof window.ethereum !== "undefined") {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    await provider.send('eth_requestAccounts', [])
    const signer = provider.getSigner()
    const contract = new ethers.Contract(contractAddress, abi, signer)
    try {
      const transactionResponse = await contract.withdraw()

      withdrawButton.innerHTML = "Withdrawing..."
      withdrawButton.classList.add('disabled')

      await listenForTransactionMine(transactionResponse, provider)

      withdrawButton.classList.remove('disabled')
      withdrawButton.innerHTML = "Withdraw"
      getBalance()
      // await transactionResponse.wait(1)
    } catch (error) {
      console.log(error)
      if(String(error).includes("execution reverted"))
        alert("Only owner of this page can withdraw!")
    }
  } else {
    withdrawButton.innerHTML = "Please install MetaMask"
  }
}

async function fund() {
  const ethAmount = document.getElementById("ethAmount").value
  console.log(`Funding with ${ethAmount}...`)
  if (typeof window.ethereum !== "undefined") {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const signer = provider.getSigner()
    const contract = new ethers.Contract(contractAddress, abi, signer)
    try {
      const transactionResponse = await contract.fund({
        value: ethers.utils.parseEther(ethAmount),
      })
      fundButton.innerHTML = "Funding..."
      fundButton.classList.add('disabled')
      fundButton.classList.add('btn-warning')

      await listenForTransactionMine(transactionResponse, provider)
      fundButton.innerHTML = "Funded"

      setTimeout(() => {
        fundButton.classList.remove('disabled')
        fundButton.classList.remove('btn-warning')
        fundButton.innerHTML = "Fund"
      }, 3000)
      getBalance()
    } catch (error) {
      console.log(error)
    }
  } else {
    fundButton.innerHTML = "Please install MetaMask"
  }
}

async function getBalance() {
  if (typeof window.ethereum !== "undefined") {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    try {
      const balance = await provider.getBalance(contractAddress)
      let bal = ethers.utils.formatEther(balance)
      console.log(bal)
      display.innerHTML = `${bal} ETH`
    } catch (error) {
      console.log(error)
    }
  } else {
    balanceButton.innerHTML = "Please install MetaMask"
  }
}

function listenForTransactionMine(transactionResponse, provider) {
  console.log(`Mining ${transactionResponse.hash}`)
  return new Promise((resolve, reject) => {
    try {
      provider.once(transactionResponse.hash, (transactionReceipt) => {
        console.log(
          `Completed with ${transactionReceipt.confirmations} confirmations. `
        )
        resolve()
      })
    } catch (error) {
      reject(error)
    }
  })
}

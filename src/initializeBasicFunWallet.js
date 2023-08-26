import "./styles.css";
import {
  convertToValidUserId,
  useConnector,
  useCreateFun,
  configureNewFunStore,
  MetamaskConnector,
  Goerli,
  usePrimaryAuth,
} from "@fun-xyz/react";
import { useEffect, useState } from "react";
import { fundWallet, Token } from "@fun-xyz/core";
//Step 1: Initialize the FunStore. This action configures your environment based on your ApiKey, chain, and the authentication methods of your choosing. 
const DEFAULT_FUN_WALLET_CONFIG = {
  apiKey: "hnHevQR0y394nBprGrvNx4HgoZHUwMet5mXTOBhf",
  chain: Goerli,
  gasSponsor: {
    sponsorAddress: "0xCB5D0b4569A39C217c243a436AC3feEe5dFeb9Ad",
  }
};

const DEFAULT_CONNECTORS = [
  MetamaskConnector(),
];

configureNewFunStore({
  config: DEFAULT_FUN_WALLET_CONFIG,
  connectors: DEFAULT_CONNECTORS,
});

//Step 2: Use the connector button to connect your authentication method, in this case metamask. 
const ConnectorButton = ({ index }) => {
  const { active, activate, deactivate, connectorName, connector } = useConnector({ index });

  return (<button
    onClick={() => {
      if (active) {
        deactivate(connector)
        return
      }
      activate(connector)
    }
    }>{active ? ("Unconnect") : ("Connect")} {connectorName} </button>)
}
const tokens = ["ETH", "USDC"]

export default function App() {
  const [txIds, setTxIds] = useState({})
  const [loadings, setLoadings] = useState({})
  const [balance, setBalance] = useState({})


  const { account: connectorAccount, active } = useConnector({ index: 0, autoConnect: true });

  //Step 3: Use the initializeFunAccount method to create your funWallet object
  const { account, initializeFunAccount, funWallet } = useCreateFun()

  useEffect(() => {
    const getBalance = async () => {
      if (funWallet) {
        const walletAddr = await funWallet.getAddress()
        let out = { ...balance }
        await Promise.all(tokens.map(async (token) => {
          out[token] = await Token.getBalance(token, walletAddr)
        }))
        setBalance(out)
      }
    }
    getBalance()
  }, [txIds, funWallet])


  //Step 4: Use the auth and funWallet to perform actions (ie: swap, transfer, etc.)
  const [auth] = usePrimaryAuth()

  const initializeSingleAuthFunAccount = async () => {
    // if (!connectorAccount) {
    //   console.log(await activate())
    //   return
    // }
    initializeFunAccount({
      users: [{ userId: convertToValidUserId(connectorAccount) }],
      index: 214
    }).catch()
  }


  const swapEth = async () => {
    // Add your custom action code here!
    setLoadings({ ...loadings, swap: true })
    const op = await funWallet.swap(auth, await auth.getUserId(), { tokenIn: "eth", tokenOut: "usdc", amount: 0.001 })
    const receipt = await funWallet.executeOperation(auth, op)
    setTxIds({ ...txIds, swap: receipt.txId })
    setLoadings({ ...loadings, swap: false })

    // FINAL STEP: Add your custom action logic here (swap, transfer, etc)
  }


  const transferEth = async () => {
    // Add your custom action code here!
    setLoadings({ ...loadings, transfer: true })
    const op = await funWallet.transfer(auth, await auth.getUserId(), { token: "eth", to: await auth.getAddress(), amount: 0.001 })
    const receipt = await funWallet.executeOperation(auth, op)
    setTxIds({ ...txIds, transfer: receipt.txId })
    setLoadings({ ...loadings, transfer: false })
  }

  const stakeEth = async () => {
    // Add your custom action code here!
    setLoadings({ ...loadings, stakeEth: true })
    const op = await funWallet.stake(auth, await auth.getUserId(), { amount: 0.001 })
    const receipt = await funWallet.executeOperation(auth, op)
    setTxIds({ ...txIds, stakeEth: receipt.txId })
    setLoadings({ ...loadings, stakeEth: false })
  }




  const transferUSDC = async () => {
    setLoadings({ ...loadings, transferUSDC: true })
    const op = await funWallet.transfer(auth, await auth.getUserId(), { token: "usdc", to: await auth.getAddress(), amount: 1 })
    const receipt = await funWallet.executeOperation(auth, op)
    setTxIds({ ...txIds, transferUSDC: receipt.txId })
    setLoadings({ ...loadings, transferUSDC: false })
  }


  const approveUSDC = async () => {
    setLoadings({ ...loadings, approveUSDC: true })
    const op = await funWallet.tokenApprove(auth, await auth.getUserId(), { token: "usdc", spender: await auth.getAddress(), amount: 1 })
    const receipt = await funWallet.executeOperation(auth, op)
    setTxIds({ ...txIds, approveUSDC: receipt.txId })
    setLoadings({ ...loadings, approveUSDC: false })
  }

  const prefundFunWallet = async () => {
    // Add your custom action code here!
    setLoadings({ ...loadings, prefund: true })
    const { transactionHash } = await fundWallet(auth, funWallet, 0.001)
    setTxIds({ ...txIds, prefund: transactionHash })
    setLoadings({ ...loadings, prefund: false })
    // FINAL STEP: Add your custom action logic here (swap, transfer, etc)
  }

  return (
    <div className="App">
      <h1>First Class Actions with a FunWallet</h1>
      1. Connect Metamask.
      <ConnectorButton key={0} index={0} ></ConnectorButton>
      {
        active ?
          <div>
            Success! Metamask Connected!
          </div>
          : <></>
      }
      <br></br>
      <br></br>

      2. Initialize the FunWallet and Auth object.
      <button onClick={initializeSingleAuthFunAccount}>Initialize FunWallet</button>
      {account ?
        <div>
          Success! FunWallet Address: {account}
        </div>
        : <></>
      }
      <br></br>
      <br></br>

      3. Fund the FunWallet onchain.
      <button onClick={prefundFunWallet} >Fund FunWallet</button>
      {loadings.prefund ?
        <div>
          Loading...
        </div>
        : <></>
      }
      {txIds.prefund ?
        <div>
          Success! View on <a href={`https://goerli.etherscan.io/tx/${txIds.prefund}`} target="_blank" rel="noreferrer"> block explorer. </a>
        </div>
        : <></>
      }
      <br></br>
      <br></br>

      4.Execute Action
      <br></br>
      <br></br>
      <ul>
        {/**Displaying the wallet balance */}
        <li>Wallet balance: {tokens.map(token => (<div key={token}>&emsp;{balance[token] ?? 0} {token} < br /></div>))}</li>
        <br></br>
        <br></br>
        <li>Swap 0.001 ETH to USDC with a FunWallet.<button onClick={swapEth} >Swap</button></li>
        {loadings.swap ?
          <div>
            Loading...
          </div>
          : <></>
        }
        {txIds.swap ?
          <div>
            Success! View on <a href={`https://goerli.etherscan.io/tx/${txIds.swap}`} target="_blank" rel="noreferrer"> block explorer. </a>
          </div>
          : <></>
        }
        <br></br>
        <br></br>

        <li>Transfer 0.001 ETH with a FunWallet.<button onClick={transferEth} >Transfer </button></li>
        {loadings.transfer ?
          <div>
            Loading...
          </div>
          : <></>
        }
        {txIds.transfer ?
          <div>
            Success! View on <a href={`https://goerli.etherscan.io/tx/${txIds.transfer}`} target="_blank" rel="noreferrer"> block explorer. </a>
          </div>
          : <></>
        }
        <br></br>
        <br></br>


        <li> Transfer 1 USDC with a FunWallet.<button onClick={transferUSDC} >Transfer </button></li>
        {loadings.transferUSDC ?
          <div>
            Loading...
          </div>
          : <></>
        }
        {txIds.transferUSDC ?
          <div>
            Success! View on <a href={`https://goerli.etherscan.io/tx/${txIds.transferUSDC}`} target="_blank" rel="noreferrer"> block explorer. </a>
          </div>
          : <></>
        }
        <br></br>
        <br></br>


        <li> Approve 1 USDC with a FunWallet.<button onClick={approveUSDC} >Approve </button></li>
        {loadings.approveUSDC ?
          <div>
            Loading...
          </div>
          : <></>
        }
        {txIds.approveUSDC ?
          <div>
            Success! View on <a href={`https://goerli.etherscan.io/tx/${txIds.approveUSDC}`} target="_blank" rel="noreferrer"> block explorer. </a>
          </div>
          : <></>
        }
        <br></br>
        <br></br>



        <li> Stake 0.001 ETH to Lido with a FunWallet.<button onClick={stakeEth} >Stake </button></li>
        {loadings.stakeEth ?
          <div>
            Loading...
          </div>
          : <></>
        }
        {txIds.stakeEth ?
          <div>
            Success! View on <a href={`https://goerli.etherscan.io/tx/${txIds.stakeEth}`} target="_blank" rel="noreferrer"> block explorer. </a>
          </div>
          : <></>
        }
        <br></br>
        <br></br>


      </ul>
    </div >
  );


}
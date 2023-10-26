"use client"; // All React hooks need to be used in a client context
import {
  FunContextProvider,
  Goerli,
  useMetamaskAuth,
  useFunWallet,
  useAction,
  ActionType,
  ExecutionReceipt,
} from "@funkit/react";
import { sendGetRequest, Token } from "@funkit/core";
import React, { Fragment, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AsyncButton from "./components/AsyncButton";
import ChecklistItems from "./components/ChecklistItems";
import SuccessTxLink from "./components/SuccessTxLink";

/* ========*
 * CONSTS
 * ========*/
export const GOERLI_ETHERSCAN_BASE_URL = "https://goerli.etherscan.io";
enum TokenTickers {
  ETH = "eth",
  USDC = "usdc",
  STETH = "stETH",
}
// Our list of tokens
const TOKEN_LIST = [TokenTickers.ETH, TokenTickers.USDC, TokenTickers.STETH];
const API_BASE_URL = "https://api.fun.xyz";

/* ======================================================================== *
 *                      STEP 0: DEFINE CONFIGS / ENVS
 * =========================================================================*/
const YOUR_PRIVY_APP_ID = "clnatprpv00sfmi0fv3qc185b";
const DEFAULT_FUN_WALLET_CONFIG = {
  apiKey: "hnHevQR0y394nBprGrvNx4HgoZHUwMet5mXTOBhf",
  chain: Goerli,
  gasSponsor: {
    sponsorAddress:
      "0xCB5D0b4569A39C217c243a436AC3feEe5dFeb9Ad" as `0x${string}`, //Gasless payments on Goerli. Please switch to another gas sponsor method, or prefund your wallet on mainnet!
  },
};

function App() {
  const [step, setStep] = useState<number>(0);
  const [txIds, setTxIds] = useState({
    prefund: null,
    swap: null,
    transfer: null,
    stake: null,
  });

  /* ======================================================================== *
   *                      STEP 1: CONNECT METAMASK
   * =========================================================================*/

  const {
    auth: metaMaskAuth,
    active,
    login: connectMetamask,
    authAddr: metamaskAddress,
  } = useMetamaskAuth();

  async function step1ConnectMetaMask() {
    await connectMetamask();
    setStep(1);
  }

  /* ======================================================================== *
   *                      STEP 2: INITIALIZE A FUNWALLET
   * =========================================================================*/

  const { wallet: funWallet, address, createFunWallet } = useFunWallet();

  async function step2InitializeWallet() {
    if (!active || !metaMaskAuth) {
      alert("MetaMask not connected. Please follow the steps in order.");
      return;
    }
    await createFunWallet(metaMaskAuth).catch();
    setStep(2);
  }

  // Optional: Keep track of fun wallet's token balance
  // const [funWalletBalance, setFunWalletBalance] = useState(
  //   TOKEN_LIST.reduce((acc: any, cur: string) => {
  //     acc[cur] = 0;
  //     return acc;
  //   }, {})
  // );
  // useEffect(() => {
  //   async function getBalance() {
  //     if (funWallet) {
  //       let newWalletBalance = { ...funWalletBalance }; // new obj reference for react lifecycle to detect update
  //       await Promise.all(
  //         TOKEN_LIST.map((tokenSymbol) => {
  //           newWalletBalance[tokenSymbol] = Token.getBalance(
  //             tokenSymbol,
  //             address as `0x${string}`
  //           );
  //         })
  //       );
  //       setFunWalletBalance(newWalletBalance);
  //     }
  //   }
  //   getBalance();
  // }, [txIds, funWallet]);

  /* ======================================================================== *
   *                      STEP 3: FUND THE FUNWALLET
   * =========================================================================*/
  const step3PrefundFunWallet = async () => {
    if (!funWallet) {
      alert("FunWallet not initialized. Please follow the steps in order.");
      return;
    }
    const { txHash } = await sendGetRequest(
      API_BASE_URL,
      `demo-faucet/get-faucet?token=eth&testnet=goerli&addr=${await funWallet.getAddress()}`,
      DEFAULT_FUN_WALLET_CONFIG.apiKey
    );
    setStep(3);
    setTxIds({ ...txIds, prefund: txHash });
  };

  /* ======================================================================== *
   *                      STEP 4: SWAP ETH FOR USDC
   * =========================================================================*/

  // Make use of useAction hook to execute any supported funWallet operation
  const { executeOperation: executeSwapOperation, ready: actionSwapReady } =
    useAction({
      action: ActionType.Swap,
      params: {
        tokenIn: TokenTickers.ETH,
        tokenOut: TokenTickers.USDC,
        inAmount: 0.001,
      },
    });

  async function step4SwapEth() {
    if (!actionSwapReady || !funWallet) {
      alert("FunWallet not initialized. Please follow the steps in order.");
      return;
    }
    const receipt: ExecutionReceipt = await executeSwapOperation();
    setStep(4);
    setTxIds({ ...txIds, swap: receipt.txId });
  }

  /* ======================================================================== *
   *            STEP 5: TRANSFER ETH FROM FUNWALLET TO MM ADDRESS
   * =========================================================================*/

  const {
    executeOperation: executeTransferOperation,
    ready: actionTransferReady,
  } = useAction({
    action: ActionType.Transfer,
    params: {
      token: TokenTickers.ETH,
      to: metamaskAddress,
      amount: 0.001,
    },
  });

  async function step5TransferEth() {
    if (!actionTransferReady || !funWallet) {
      alert("FunWallet not initialized. Please follow the steps in order.");
      return;
    }
    const receipt: ExecutionReceipt = await executeTransferOperation();
    setStep(5);
    setTxIds({ ...txIds, transfer: receipt.txId });
  }

  /* ======================================================================== *
   *            STEP 6: STAKE ETH FROM FUNWALLET TO LIDO
   * =========================================================================*/

  const { executeOperation: executeStakeOperation, ready: actionStakeReady } =
    useAction({
      action: ActionType.Stake,
      params: {
        amount: 0.001,
      },
    });

  async function step6StakeEth() {
    if (!actionStakeReady || !funWallet) {
      alert("FunWallet not initialized. Please follow the steps in order.");
      return;
    }
    const receipt: ExecutionReceipt = await executeStakeOperation();
    setStep(6);
    setTxIds({ ...txIds, stake: receipt.txId });
  }

  // Build the step items
  const stepItems = useMemo(() => {
    return [
      {
        title: "Connect MetaMask",
        actionTitle: "Connect",
        actionOnClick: step1ConnectMetaMask,
        switchCondition: !!active,
        completeContent: <p>Connected! You are now ready to use FunWallet</p>,
      },
      {
        title: "Initialize FunWallet",
        actionTitle: "Initialize",
        actionOnClick: step2InitializeWallet,
        switchCondition: !!address,
        completeContent: (
          <Fragment>
            <p>
              Success! FunWallet Address:
              <Link
                href={`${GOERLI_ETHERSCAN_BASE_URL}/address/${address}`}
                target="_blank"
              >
                &nbsp;{address}.
              </Link>
            </p>
            {/* Optional: Keep track of fun wallet's token balance */}
            {/* <div className="pt-2">
              <p>Wallet balance: </p>
              {TOKEN_LIST.map((token) => (
                <p key={token}>
                  &emsp;{funWalletBalance[token] ?? 0} {token} <br />
                </p>
              ))}{" "}
            </div> */}
          </Fragment>
        ),
      },
      {
        title: "Add test ETH to FunWallet",
        actionTitle: "Prefund",
        actionOnClick: step3PrefundFunWallet,
        switchCondition: !!txIds.prefund,
        completeContent: <SuccessTxLink txHash={txIds.prefund} />,
      },
      {
        title: "Swap 0.001 ETH to USDC with a FunWallet",
        actionTitle: "Swap",
        actionOnClick: step4SwapEth,
        switchCondition: !!txIds.swap,
        completeContent: <SuccessTxLink txHash={txIds.swap} />,
      },
      {
        title: "Transfer 0.001 ETH with a FunWallet",
        actionTitle: "Transfer",
        actionOnClick: step5TransferEth,
        switchCondition: !!txIds.transfer,
        completeContent: <SuccessTxLink txHash={txIds.transfer} />,
      },
      {
        title: "Stake 0.001 ETH to Lido with a FunWallet",
        actionTitle: "Stake",
        actionOnClick: step6StakeEth,
        switchCondition: !!txIds.stake,
        completeContent: <SuccessTxLink txHash={txIds.stake} />,
      },
    ];
  }, [
    active,
    step,
    address,
    txIds,
    // funWalletBalance,
    step1ConnectMetaMask,
    step2InitializeWallet,
    step3PrefundFunWallet,
    step4SwapEth,
    step5TransferEth,
    step6StakeEth,
  ]);

  return (
    <div className="App p-6 mt-8 ml-4 flex justify-center items-start">
      <div className="w-[600px]">
        <h1 className="pb-4 font-bold">
          Swap, Transfer, and Stake with a FunWallet
        </h1>
        <ChecklistItems stepNumber={step}>
          {stepItems.map((stepItem, idx) => (
            <div id={stepItem.title} key={stepItem.title}>
              <h3>{stepItem.title}</h3>
              {stepItem.switchCondition ? (
                stepItem.completeContent
              ) : (
                <AsyncButton
                  onClick={() => stepItem.actionOnClick?.()}
                  disabled={step < idx}
                  title={stepItem.actionTitle}
                />
              )}
            </div>
          ))}
        </ChecklistItems>
      </div>
    </div>
  );
}

export default function AppWrapper() {
  return (
    <FunContextProvider options={DEFAULT_FUN_WALLET_CONFIG} privyAppId={YOUR_PRIVY_APP_ID}>
      <App />
    </FunContextProvider>
  );
}

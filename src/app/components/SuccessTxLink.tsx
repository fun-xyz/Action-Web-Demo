import Link from "next/link";
import { GOERLI_ETHERSCAN_BASE_URL } from "../page";

export default function SuccessTxLink({ txHash }: { txHash: null | string }) {
  return txHash ? (
    <p>
      Success! View on
      <Link
        href={`${GOERLI_ETHERSCAN_BASE_URL}/tx/${txHash}`}
        target="_blank"
      >
        {" "}
        block explorer.
      </Link>
    </p>
  ) : null;
}

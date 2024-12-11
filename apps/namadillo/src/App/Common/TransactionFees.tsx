import { shortenAddress } from "@namada/utils";
import { chainAssetsMapAtom } from "atoms/chain/atoms";
import { useAtomValue } from "jotai";
import { useState } from "react";
import { GasConfig } from "types";
import { GasUsageModal } from "./GasUsageModal";
import { TextLink } from "./TextLink";
import { TokenCurrency } from "./TokenCurrency";

type TransactionFeesProps = {
  gasConfig: GasConfig;
};

export const TransactionFees = ({
  gasConfig,
}: TransactionFeesProps): JSX.Element => {
  const [modalOpen, setModalOpen] = useState(false);
  const chainAssetsMap = useAtomValue(chainAssetsMapAtom);

  const symbol =
    chainAssetsMap[gasConfig.gasToken]?.symbol ??
    shortenAddress(gasConfig.gasToken);

  const fee = gasConfig.gasPrice.times(gasConfig.gasLimit);

  return (
    <>
      <button
        type="button"
        className="text-white text-sm"
        onClick={() => setModalOpen(true)}
      >
        <TextLink>Transaction fee:</TextLink>{" "}
        <TokenCurrency symbol={symbol} amount={fee} className="font-medium" />
      </button>
      {modalOpen && (
        <GasUsageModal
          gasConfig={gasConfig}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
};

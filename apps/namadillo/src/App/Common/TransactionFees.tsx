import { useState } from "react";
import { twMerge } from "tailwind-merge";
import { GasConfig } from "types";
import { GasUsageModal } from "./GasUsageModal";
import { NamCurrency } from "./NamCurrency";
import { TextLink } from "./TextLink";

type TransactionFeesProps = {
  gasConfig: GasConfig;
  className?: string;
};

export const TransactionFees = ({
  gasConfig,
  className,
}: TransactionFeesProps): JSX.Element => {
  const [modalOpen, setModalOpen] = useState(false);
  const fee = gasConfig.gasPrice.times(gasConfig.gasLimit);

  return (
    <>
      <button
        type="button"
        className={twMerge("text-white text-sm", className)}
        onClick={() => setModalOpen(true)}
      >
        <TextLink>Transaction fee:</TextLink>{" "}
        <NamCurrency className="font-medium" amount={fee} />
      </button>
      {modalOpen && <GasUsageModal onClose={() => setModalOpen(false)} />}
    </>
  );
};

import { Modal } from "@namada/components";
import { gasDollarMapAtom, gasTokenOptionsAtom } from "atoms/fees/atoms";
import { preferableGasTokenAtom } from "atoms/settings/atoms";
import BigNumber from "bignumber.js";
import { useAtom, useAtomValue } from "jotai";
import { IoClose } from "react-icons/io5";
import { twMerge } from "tailwind-merge";
import { GasConfig } from "types";
import { FiatCurrency } from "./FiatCurrency";
import { TokenCurrency } from "./TokenCurrency";

export const GasUsageModal = ({
  gasConfig,
  onClose,
}: {
  gasConfig: GasConfig;
  onClose: () => void;
}): JSX.Element => {
  const [preferableGasToken, setPreferableGasToken] = useAtom(
    preferableGasTokenAtom
  );
  const gasTokenOptions = useAtomValue(gasTokenOptionsAtom);
  const gasDollarMap = useAtomValue(gasDollarMapAtom);

  const list = Object.values(gasTokenOptions.data ?? {}).map((item) => {
    const gasPrice = BigNumber(item.amount);
    const amount = gasPrice.multipliedBy(gasConfig.gasLimit);
    const price = gasDollarMap.data?.[item.originalAddress];
    const dollar = price ? amount.multipliedBy(price) : undefined;
    return {
      ...item,
      amount,
      dollar,
    };
  });

  return (
    <Modal onClose={onClose}>
      <div
        className={twMerge(
          "fixed min-w-[550px] top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2",
          "px-6 py-7 bg-rblack border border-neutral-500 rounded-md"
        )}
      >
        <i
          className={twMerge(
            "cursor-pointer text-white absolute right-3 top-3 text-xl",
            "hover:text-yellow transition-colors"
          )}
          onClick={onClose}
        >
          <IoClose />
        </i>
        <div className="text-center">
          <h2 className="font-medium">Select Gas Token</h2>
          <div className="text-sm mt-1">
            Gas fees deducted from your Namada accounts
          </div>
        </div>
        <div className="flex flex-col mt-4 max-h-[60vh] overflow-auto">
          {list.map((item) => (
            <button
              key={item.originalAddress}
              className={twMerge(
                "flex justify-between items-center",
                "bg-rblack px-5 py-2 rounded-sm",
                "hover:text-yellow hover:border-yellow transition-colors duration-300",
                item.originalAddress === preferableGasToken ?
                  "border border-white"
                : "m-px"
              )}
              type="button"
              onClick={() => {
                setPreferableGasToken(item.originalAddress);
                onClose();
              }}
            >
              <div>{item.asset.symbol}</div>
              <div className="text-right">
                {item.dollar !== undefined && (
                  <FiatCurrency amount={item.dollar} />
                )}
                <div className="text-xs">
                  <TokenCurrency
                    amount={item.amount}
                    symbol={item.asset.symbol}
                  />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
};

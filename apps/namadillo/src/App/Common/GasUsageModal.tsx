import { Currency, Modal, Stack } from "@namada/components";
import { gasPriceForAllTokensAtom } from "atoms/fees/atoms";
import { preferableGasTokenAtom } from "atoms/settings";
import BigNumber from "bignumber.js";
import { useAtom, useAtomValue } from "jotai";
import { twMerge } from "tailwind-merge";
import { GasConfig } from "types";
import { FiatCurrency } from "./FiatCurrency";

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
  const gasPriceForAllTokens = useAtomValue(gasPriceForAllTokensAtom);

  const list = gasPriceForAllTokens.data?.map((item) => {
    const gasPrice = BigNumber(item.minDenomAmount);
    return {
      token: item.token,
      amount: gasPrice.multipliedBy(gasConfig.gasLimit),
    };
  });

  // TODO
  const amount = gasConfig.gasPrice;
  const price = 2;
  const dollar = amount.multipliedBy(price);
  const symbol = preferableGasToken ?? "?";

  return (
    <Modal onClose={onClose}>
      <div
        className={twMerge(
          "fixed bg-black min-w-[550px] top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2",
          "px-6 py-7 bg-neutral-800 rounded-md"
        )}
      >
        <h2 className="text-sm mb-4">Fee</h2>
        <Stack gap={4}>
          <div>
            <label>
              <div
                className={twMerge(
                  "flex flex-col py-5 text-center font-medium leading-4 cursor-pointer",
                  "bg-rblack transition-colors duration-150 ease-out-quad",
                  "select-none hover:bg-neutral-700"
                )}
              >
                {dollar && (
                  <div className="text-xs text-neutral-500 mt-1">
                    <FiatCurrency amount={dollar} />
                  </div>
                )}
                <div className="mt-2">
                  <Currency
                    amount={amount}
                    currency={{ symbol }}
                    currencyPosition="right"
                    spaceAroundSymbol
                  />
                </div>
              </div>
            </label>
          </div>
          <select
            value={symbol}
            onChange={(e) => setPreferableGasToken(e.target.value)}
            className="text-black"
          >
            {list?.map((item) => (
              <option key={item.token} value={item.token}>
                {item.amount.toString()} - {item.token}
              </option>
            ))}
          </select>
        </Stack>
      </div>
    </Modal>
  );
};

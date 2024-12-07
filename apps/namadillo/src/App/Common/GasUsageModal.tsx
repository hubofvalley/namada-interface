import { Currency, Modal, Stack } from "@namada/components";
import { tokenPricesAtom } from "atoms/balance";
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
  const tokenPrices = useAtomValue(tokenPricesAtom);

  const list = gasPriceForAllTokens.data?.map(({ token, minDenomAmount }) => {
    const gasPrice = BigNumber(minDenomAmount);
    const amount = gasPrice.multipliedBy(gasConfig.gasLimit);
    const price = tokenPrices.data?.[token];
    const dollar = price ? amount.multipliedBy(price) : undefined;
    return {
      token,
      amount,
      dollar,
    };
  });

  return (
    <Modal onClose={onClose}>
      <div
        className={twMerge(
          "fixed bg-black min-w-[550px] top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2",
          "px-6 py-7 bg-neutral-800 rounded-md"
        )}
      >
        <h2 className="text-sm mb-4">Fee</h2>
        <div>preferableGasToken: {preferableGasToken}</div>
        <Stack gap={4}>
          {list?.map((item) => (
            <button
              key={item.token}
              className={twMerge(
                "bg-rblack p-5",
                "hover:text-yellow transition-colors duration-300"
              )}
              onClick={() => setPreferableGasToken(item.token)}
            >
              <div className="mt-2">
                <Currency
                  amount={item.amount}
                  currency={{ symbol: item.token }}
                  currencyPosition="right"
                  spaceAroundSymbol
                />
              </div>
              {item.dollar && (
                <div className="text-xs text-neutral-500">
                  <FiatCurrency amount={item.dollar} />
                </div>
              )}
            </button>
          ))}
        </Stack>
      </div>
    </Modal>
  );
};

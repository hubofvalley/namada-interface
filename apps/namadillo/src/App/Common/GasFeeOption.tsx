import BigNumber from "bignumber.js";
import { twMerge } from "tailwind-merge";
import { FiatCurrency } from "./FiatCurrency";
import { NamCurrency } from "./NamCurrency";

type GasFeeOptionProps = {
  title: string;
  priceInNam: BigNumber;
} & React.ComponentPropsWithoutRef<"input">;

export const GasFeeOption = ({
  title,
  priceInNam,
  ...props
}: GasFeeOptionProps): JSX.Element => {
  return (
    <label>
      <input
        type="radio"
        name="gas-fee"
        className={twMerge(
          "absolute invisible pointer-events-none",
          "[&:checked+span]:bg-yellow [&:checked+span]:text-black",
          "[&:checked+span>small]:text-black"
        )}
        {...props}
      />
      <span
        className={twMerge(
          "flex flex-col text-center py-5 leading-4 cursor-pointer",
          "bg-neutral-800 transition-colors duration-150 ease-out-quad",
          "select-none hover:bg-neutral-700"
        )}
      >
        <strong className="font-medium">{title}</strong>
        <small className="text-xs text-neutral-500 font-medium mb-1">
          <FiatCurrency amount={priceInNam} />
        </small>
        <span className="font-medium">
          <NamCurrency amount={priceInNam} />
        </span>
      </span>
    </label>
  );
};

import { GasPriceTableInner } from "@namada/indexer-client";
import { defaultAccountAtom } from "atoms/accounts";
import { indexerApiAtom } from "atoms/api";
import {
  fetchTokenPrices,
  mapNamadaAddressesToAssets,
} from "atoms/balance/functions";
import {
  chainAssetsMapAtom,
  chainParametersAtom,
  chainTokensAtom,
  nativeTokenAddressAtom,
} from "atoms/chain";
import { queryDependentFn } from "atoms/utils";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import { atom, getDefaultStore } from "jotai";
import { atomWithQuery } from "jotai-tanstack-query";
import { atomFamily, atomWithStorage, RESET } from "jotai/utils";
import { isPublicKeyRevealed } from "lib/query";
import {
  Address,
  AddressWithAssetAndAmountMap,
  GasConfig,
  GasTable,
} from "types";
import { TxKind } from "types/txKind";
import { toDisplayAmount } from "utils";
import {
  fetchGasLimit,
  fetchGasPriceForAllTokens,
  fetchMinimumGasPrice,
} from "./services";

export const storageGasTokenAtom = atomWithStorage<string | undefined>(
  "namadillo:gasToken",
  undefined
);

export const gasTokenAtom = atom<Address | undefined>((get) => {
  const storageGasToken = get(storageGasTokenAtom);
  const nativeTokenQuery = get(nativeTokenAddressAtom);
  return storageGasToken ?? nativeTokenQuery.data;
});

export const gasCostTxKindAtom = atom<TxKind | undefined>(undefined);

export const gasLimitsAtom = atomWithQuery<GasTable>((get) => {
  const api = get(indexerApiAtom);
  return {
    queryKey: ["minimum-gas-limits"],
    queryFn: async () => fetchGasLimit(api),
  };
});

export const minimumGasPriceAtom = atomWithQuery<BigNumber>((get) => {
  const api = get(indexerApiAtom);
  const gasToken = get(gasTokenAtom);
  const chainAssetsMap = get(chainAssetsMapAtom);

  return {
    queryKey: ["minimum-gas-price", gasToken, Object.keys(chainAssetsMap)],
    queryFn: async () => {
      invariant(gasToken, "Cannot query minimum gas for undefined token");

      const tokenCost = await fetchMinimumGasPrice(api, gasToken);
      if (!tokenCost) {
        // if we cannot query the token cost, reset the storage so we can use the default token
        const { set } = getDefaultStore();
        set(storageGasTokenAtom, RESET);
      }
      invariant(tokenCost, "Error querying minimum gas price");

      const asset = chainAssetsMap[gasToken];
      invariant(asset, "Missing asset for gas price");

      const asBigNumber = toDisplayAmount(
        asset,
        BigNumber(tokenCost.minDenomAmount)
      );
      invariant(
        !asBigNumber.isNaN(),
        "Error converting minimum gas price to BigNumber"
      );
      return asBigNumber;
    },
  };
});

export const defaultGasConfigFamily = atomFamily(
  (txKinds: TxKind[]) =>
    atomWithQuery<GasConfig>((get) => {
      const defaultAccount = get(defaultAccountAtom);
      const minimumGasPrice = get(minimumGasPriceAtom);
      const gasLimitsTable = get(gasLimitsAtom);
      const gasToken = get(gasTokenAtom);

      return {
        queryKey: [
          "default-gas-config",
          defaultAccount.data?.address,
          minimumGasPrice.data,
          gasLimitsTable.data,
          gasToken,
        ],
        ...queryDependentFn(async () => {
          invariant(
            gasLimitsTable.data,
            "Cannot create a gas config without a price"
          );
          invariant(
            minimumGasPrice.data,
            "Cannot create a gas config without a price"
          );
          invariant(gasToken, "Cannot create a gas config without a token");

          const publicKeyRevealed =
            defaultAccount.data?.address ?
              await isPublicKeyRevealed(defaultAccount.data.address)
            : false;

          const txKindsWithRevealPk =
            publicKeyRevealed ? txKinds : ["RevealPk" as const, ...txKinds];

          const gasLimit = txKindsWithRevealPk.reduce(
            (total, kind) => total.plus(gasLimitsTable.data[kind].native),
            BigNumber(0)
          );

          invariant(gasToken, "Cannot create a gas config without a token");

          return {
            gasLimit,
            gasPrice: minimumGasPrice.data,
            gasToken,
          };
        }, [defaultAccount, minimumGasPrice, gasLimitsTable]),
      };
    }),
  // Hacky way to compare two objects
  (a, b) => JSON.stringify(a) === JSON.stringify(b)
);

export const gasPriceForAllTokensAtom = atomWithQuery<GasPriceTableInner[]>(
  (get) => {
    const api = get(indexerApiAtom);
    return {
      queryKey: ["gas-price-for-all-tokens"],
      queryFn: () => fetchGasPriceForAllTokens(api),
    };
  }
);

export const gasDollarMapAtom = atomWithQuery<Record<Address, BigNumber>>(
  (get) => {
    const gasPriceForAllTokens = get(gasPriceForAllTokensAtom);
    const tokenAddressesQuery = get(chainTokensAtom);

    const addresses = gasPriceForAllTokens.data?.map((item) => item.token);
    const tokens = tokenAddressesQuery.data;

    return {
      queryKey: ["gas-dollar-map", addresses, tokens],
      queryFn: () => fetchTokenPrices(addresses ?? [], tokens ?? []),
    };
  }
);

export const gasTokenOptionsAtom = atomWithQuery<AddressWithAssetAndAmountMap>(
  (get) => {
    const gasPriceForAllTokens = get(gasPriceForAllTokensAtom);
    const tokenAddresses = get(chainTokensAtom);
    const chainParameters = get(chainParametersAtom);

    return {
      queryKey: [
        "namada-transparent-assets",
        gasPriceForAllTokens.data,
        tokenAddresses.data,
        chainParameters.data?.chainId,
      ],
      ...queryDependentFn(async () => {
        if (
          !gasPriceForAllTokens.data ||
          !tokenAddresses.data ||
          !chainParameters.data
        ) {
          return {};
        }
        const formattedData = gasPriceForAllTokens.data.map((item) => ({
          address: item.token,
          minDenomAmount: new BigNumber(item.minDenomAmount),
        }));
        return mapNamadaAddressesToAssets(
          formattedData,
          tokenAddresses.data,
          chainParameters.data.chainId
        );
      }, [gasPriceForAllTokens, tokenAddresses, chainParameters]),
    };
  }
);

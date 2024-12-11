import { DefaultApi, GasPriceTableInner } from "@namada/indexer-client";
import { mapUndefined } from "@namada/utils";
import BigNumber from "bignumber.js";
import { Address, GasTable } from "types";
import { txKinds } from "types/txKind";
import { txKindToIndexer } from "./functions";

export const fetchGasLimit = async (api: DefaultApi): Promise<GasTable> => {
  const gasTableResponse = await api.apiV1GasGet();

  return txKinds.reduce((acc, txKind) => {
    const indexerTxKind = txKindToIndexer(txKind);
    const gasLimit = gasTableResponse.data.find(
      (entry) => entry.txKind === indexerTxKind
    )?.gasLimit;
    const maybeBigNumber = mapUndefined(BigNumber, gasLimit);

    if (typeof maybeBigNumber === "undefined" || maybeBigNumber.isNaN()) {
      throw new Error("Couldn't decode gas table");
    } else {
      return { ...acc, [txKind]: { native: maybeBigNumber } };
    }
  }, {} as GasTable);
};

const uatomMock = {
  token: "tnam1p5nnjnasjtfwen2kzg78fumwfs0eycqpecuc2jwz",
  minDenomAmount: "0.02",
};

const uosmoMock = {
  token: "tnam1p5z8ruwyu7ha8urhq2l0dhpk2f5dv3ts7uyf2n75",
  minDenomAmount: "3",
};

export const fetchMinimumGasPrice = async (
  api: DefaultApi,
  tokenAddress: Address
): Promise<GasPriceTableInner | undefined> => {
  const response = await api.apiV1GasPriceTokenGet(tokenAddress);
  return (
    response.data[0] ??
    // TODO remove mock
    { [uatomMock.token]: uatomMock, [uosmoMock.token]: uosmoMock }[tokenAddress]
  );
};

export const fetchGasPriceForAllTokens = async (
  api: DefaultApi
): Promise<GasPriceTableInner[]> => {
  return [
    ...(await api.apiV1GasPriceGet()).data,
    // TODO remove mock
    uatomMock,
    uosmoMock,
  ];
};

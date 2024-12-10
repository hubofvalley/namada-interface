import {
  DefaultApi,
  IbcToken,
  NativeToken,
  Parameters,
} from "@namada/indexer-client";

export const fetchRpcUrlFromIndexer = async (
  api: DefaultApi
): Promise<string> => {
  const rpcUrl = await api.apiV1ChainRpcUrlGet();
  return rpcUrl.data.url;
};

export const fetchChainParameters = async (
  api: DefaultApi
): Promise<Parameters> => {
  const parametersResponse = await api.apiV1ChainParametersGet();
  return parametersResponse.data;
};

export const fetchChainTokens = async (
  api: DefaultApi
): Promise<(NativeToken | IbcToken)[]> => {
  return [
    ...(await api.apiV1ChainTokenGet()).data,
    // TODO remove mock
    { address: "tnam1atom", trace: "channel-0/uatom" },
    { address: "tnam1osmo", trace: "channel-0/uosmo" },
  ];
};

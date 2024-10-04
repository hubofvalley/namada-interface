import { Coin } from "@cosmjs/launchpad";
import { coin, coins } from "@cosmjs/proto-signing";
import {
  QueryClient,
  SigningStargateClient,
  StargateClient,
  setupIbcExtension,
} from "@cosmjs/stargate";
import { Tendermint34Client } from "@cosmjs/tendermint-rpc";
import { Window as KeplrWindow } from "@keplr-wallet/types";
import { Panel } from "@namada/components";
import { DerivedAccount, WindowWithNamada } from "@namada/types";
import { TransferModule } from "App/Transfer/TransferModule";
import { wallets } from "integrations";
import { useEffect, useMemo, useState } from "react";
import { WalletProvider } from "types";

const namada = (window as WindowWithNamada).namada!;
const keplr = (window as KeplrWindow).keplr!;

import { chain as celestia } from "chain-registry/mainnet/celestia";
import { chain as cosmos } from "chain-registry/mainnet/cosmoshub";
import { chain as dydx } from "chain-registry/mainnet/dydx";
import { chain as osmosis } from "chain-registry/mainnet/osmosis";
import { chain as stargaze } from "chain-registry/mainnet/stargaze";
import { chain as stride } from "chain-registry/mainnet/stride";

import { useIntegration } from "@namada/integrations";
import { selectedIBCChainAtom } from "atoms/integrations";
import { chain as celestiaTestnet } from "chain-registry/testnet/celestiatestnet3";
import { chain as cosmosTestnet } from "chain-registry/testnet/cosmoshubtestnet";
import { chain as dydxTestnet } from "chain-registry/testnet/dydxtestnet";
import { chain as osmosisTestnet } from "chain-registry/testnet/osmosistestnet4";
import { chain as stargazeTestnet } from "chain-registry/testnet/stargazetestnet";
import { chain as strideTestnet } from "chain-registry/testnet/stridetestnet";
import { useAtom } from "jotai";

const availableChains =
  import.meta.env.PROD ?
    [celestia, cosmos, dydx, osmosis, stargaze, stride]
  : [
      celestiaTestnet,
      cosmosTestnet,
      osmosisTestnet,
      stargazeTestnet,
      strideTestnet,
      dydxTestnet,
    ];

const availableChainIds = availableChains.map((chain) => chain.chain_id);

export const IbcTransfer: React.FC = () => {
  const [error, setError] = useState("");
  const [address, setAddress] = useState("");
  const [alias, setAlias] = useState("");
  const [balances, setBalances] = useState<Coin[] | undefined>();
  const [namadaAccounts, setNamadaAccounts] = useState<DerivedAccount[]>();
  const [token, setToken] = useState("");
  const [target, setTarget] = useState("");
  const [amount, setAmount] = useState("");
  const [channelId, setChannelId] = useState("");
  const [wallet, setWallet] = useState<WalletProvider | undefined>();
  const [chainId, setChainId] = useAtom(selectedIBCChainAtom);
  const keplr = useIntegration("keplr");

  const buttonStyles = "bg-white my-2 p-2 block";

  useEffect(() => {
    onConnectKeplrWallet();
  }, [chainId]);

  const chain = useMemo(() => {
    return availableChains.find((chain) => chain.chain_id === chainId);
  }, [chainId]);

  const onConnectKeplrWallet = async (): Promise<void> => {
    if (keplr.detect() && chainId) {
      await keplr.instance?.enable(chainId);
      const address = await fetchWalletAddress();
      if (address) {
        setAddress(address);

        if (chain && chain.apis?.rpc && chain.apis.rpc.length > 0) {
          const balances = await queryBalances(
            address,
            chain.apis?.rpc[0].address
          );
          console.log("balances >> ", balances);
        }
      }
      // if (accounts && accounts.length > 0) {
      //   setAddress(accounts[0]);
      // }
    }
  };

  const withErrorReporting =
    (fn: () => Promise<void>): (() => Promise<void>) =>
    async () => {
      try {
        await fn();
        setError("");
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log(e);
        setError(e instanceof Error ? e.message : "unknown error");
      }
    };

  const fetchWalletAddress = async (): Promise<string> => {
    if (chainId) {
      const key = await keplr.instance?.getKey(chainId);
      return key?.bech32Address || "";
    }
    return "";
  };

  const onChangeWallet = (): void => {};

  const getBalances = withErrorReporting(async () => {
    // setBalances(undefined);
    // const balances = await queryBalances(address);
    // setBalances(balances);
  });

  const getNamadaAccounts = withErrorReporting(async () => {
    const accounts = await namada.accounts();
    setNamadaAccounts(accounts);
  });

  const submitIbcTransfer = withErrorReporting(
    async () => {
      /* submitBridgeTransfer(rpc, chain, address, target, token, amount, channelId)*/
      return;
    }
    // submitBridgeTransfer(rpc, chain, address, target, token, amount, channelId)
  );

  return (
    <>
      <Panel>
        <header className="text-center mb-4">
          <h2>IBC Transfer to Namada</h2>
        </header>
        <TransferModule
          source={{
            availableChains,
            wallet: wallets.keplr,
            walletAddress: address,
            onChangeChain: (chain) => {
              setChainId(chain.chain_id);
              fetchWalletAddress();
            },
            onChangeWallet,
            chain:
              chainId ?
                availableChains.find((chain) => chain.chain_id === chainId)
              : undefined,
          }}
          destination={{ availableWallets: [] }}
          onSubmitTransfer={() => {}}
        />
      </Panel>

      <Panel title="IBC" className="mb-2 bg-[#999999] text-black">
        {/* Error */}
        <p className="text-[#ff0000]">{error}</p>

        {/* Balances */}
        <h3>Balances</h3>
        <button className={buttonStyles} onClick={getBalances}>
          get balances
        </button>
        {balances?.map(({ denom, amount }) => (
          <div key={denom}>
            <label>
              <input
                type="radio"
                name="token"
                value={denom}
                checked={token === denom}
                onChange={(e) => setToken(e.target.value)}
              />
              {denom} {amount}
            </label>
          </div>
        ))}

        <hr />

        {/* Namada accounts */}
        <h3>Namada accounts</h3>
        <button className={buttonStyles} onClick={getNamadaAccounts}>
          get namada accounts
        </button>

        {namadaAccounts?.map(({ alias, address }) => (
          <div key={address}>
            <label>
              <input
                type="radio"
                name="target"
                value={address}
                checked={target === address}
                onChange={(e) => setTarget(e.target.value)}
              />
              {alias} {address}
            </label>
          </div>
        ))}

        <hr />

        {/* Amount to send */}
        <h3>Amount to send</h3>
        <input value={amount} onChange={(e) => setAmount(e.target.value)} />

        <hr />

        {/* Channel ID */}
        <h3>Channel ID</h3>
        <input
          value={channelId}
          onChange={(e) => setChannelId(e.target.value)}
        />

        <hr />

        {/* Submit IBC transfer */}
        <h3>Submit IBC transfer</h3>
        <button className={buttonStyles} onClick={submitIbcTransfer}>
          submit IBC transfer
        </button>
      </Panel>
    </>
  );
};

const queryBalances = async (owner: string, rpc: string): Promise<Coin[]> => {
  const client = await StargateClient.connect(rpc);
  const balances = (await client.getAllBalances(owner)) || [];

  await Promise.all(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    balances.map(async (coin: any) => {
      // any becuse of annoying readonly
      if (coin.denom.startsWith("ibc/")) {
        coin.denom = await ibcAddressToDenom(coin.denom);
      }
    })
  );

  return [...balances];
};

const ibcAddressToDenom = async (address: string): Promise<string> => {
  const tmClient = await Tendermint34Client.connect(rpc);
  const queryClient = new QueryClient(tmClient);
  const ibcExtension = setupIbcExtension(queryClient);

  const ibcHash = address.replace("ibc/", "");
  const { denomTrace } = await ibcExtension.ibc.transfer.denomTrace(ibcHash);
  const baseDenom = denomTrace?.baseDenom;

  if (typeof baseDenom === "undefined") {
    throw new Error("couldn't get denom from ibc address");
  }

  return baseDenom;
};

const submitBridgeTransfer = async (
  rpc: string,
  sourceChainId: string,
  source: string,
  target: string,
  token: string,
  amount: string,
  channelId: string
): Promise<void> => {
  const client = await SigningStargateClient.connectWithSigner(
    rpc,
    keplr.getOfflineSigner(sourceChainId),
    {
      broadcastPollIntervalMs: 300,
      broadcastTimeoutMs: 8_000,
    }
  );

  const fee = {
    amount: coins("0", token),
    gas: "222000",
  };

  const response = await client.sendIbcTokens(
    source,
    target,
    coin(amount, token),
    "transfer",
    channelId,
    undefined, // timeout height
    Math.floor(Date.now() / 1000) + 60, // timeout timestamp
    fee,
    `${sourceChainId}->Namada`
  );

  if (response.code !== 0) {
    throw new Error(response.code + " " + response.rawLog);
  }
};

import { useEffect, useState, useCallback } from "react";

import "./styles.css";

interface RequestArguments {
  method: string;
  params?: unknown[] | object;
}
type ExodusEvent = "accountsChanged" | "connect" | "disconnect";

interface EthereumProvider {
  isConnected: boolean | null;
  request: (args: RequestArguments) => Promise<unknown>;
  on: (event: ExodusEvent, handler: (args: any) => void) => void;
  addListener: (event: ExodusEvent, handler: (args: any) => void) => void;
  removeListener: (event: ExodusEvent) => void;
  enable: () => string[];
}

const getProvider = (): EthereumProvider | undefined => {
  if ("exodus" in window) {
    const anyWindow: any = window;
    return anyWindow.exodus.ethereum;
  }

  window.open("https://exodus.com", "_blank");
};

export default function App() {
  const [provider, setProvider] = useState<EthereumProvider | undefined>();
  const [, setConnected] = useState<boolean>(false);
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const addLog = useCallback((log: string) => {
    console.log(log);
    setLogs((logs) => [...logs, "> " + log]);
  }, []);

  useEffect(() => {
    addLog("[sandbox] Welcome to ethereum sandbox");
    const ethProvider = getProvider();
    setProvider(ethProvider);
  }, []);

  useEffect(() => {
    connectHandler();
  }, [provider]);

  const connectHandler = async () => {
    if (!provider) return;
    const accounts = (await provider?.request({
      method: "eth_requestAccounts",
      params: [],
    })) as Array<string>;

    if (accounts.length) {
      setAddress(accounts[0]);
      setConnected(true);
      addLog("[connect] " + accounts[0]);
    }

    const chainId = (await provider?.request({
      method: "eth_chainId",
      params: [],
    })) as string;
    if (chainId) {
      setChainId(chainId);
      addLog("[chainId] " + chainId);
    }
  };

  const legacyConnectHandler = async () => {
    if (!provider) return;
    const accounts = await provider?.enable();

    if (accounts.length) {
      setAddress(accounts[0]);
      setConnected(true);
      addLog("[connect] " + accounts[0]);
    }
  };

  const disconnectHandler = async () => {
    setConnected(false);
    setAddress(null);
    addLog("[disconnect] 👋");
  };

  const signTransaction = async () => {
    const gasPrice = await provider?.request({
      method: "eth_gasPrice",
      params: [],
    });

    const nonce = await provider?.request({
      method: "eth_getTransactionCount",
      params: [address, "latest"],
    });

    const transactionObj = {
      from: address,
      to: address,
      gas: "0x76c0",
      gasPrice,
      nonce,

      value: "0x9184e72a",
      data:
        "0xd46e8dd67c5d32be8d46e8dd67c5d32be8058bb8eb970870f072445675058bb8eb970870f072445675",
    };
    try {
      const txHash = await provider?.request({
        method: "eth_signTransaction",
        params: [transactionObj],
      });
      addLog("signTransaction: " + JSON.stringify(txHash));
    } catch (err) {
      addLog("[error] signTransaction: " + JSON.stringify(err));
    }
  };

  const sendTransaction = async () => {
    try {
      const gasPrice = await provider?.request({
        method: "eth_gasPrice",
        params: [],
      });

      const nonce = await provider?.request({
        method: "eth_getTransactionCount",
        params: [address, "latest"],
      });

      const transactionObj = {
        from: address,
        to: address,
        value: "0x0", // 0.00 ETH
        gas: "0x5208", //21000
        gasPrice,
        nonce,
        data: "0x",
      };

      const txHash = await provider?.request({
        method: "eth_sendTransaction",
        params: [transactionObj],
      });

      addLog("sendTransaction: " + JSON.stringify(txHash));
    } catch (err) {
      addLog("[error] sendTransaction: " + JSON.stringify(err));
    }
  };

  const signMessage = async () => {
    const message = "0x" + Buffer.from("Hello Wrold", "utf8").toString("hex");
    // const message = "Hello Wrold";
    console.log({ message });
    try {
      const signedMessage = await provider?.request({
        method: "eth_sign",
        params: [address, message],
      });
      addLog("signMessage: " + JSON.stringify(signedMessage));
    } catch (err) {
      addLog("[error] signMessage: " + JSON.stringify(err));
    }
  };

  const signTypedData = async () => {
    const typedData = {
      types: {
        EIP712Domain: [],
      },
      primaryType: "EIP712Domain",
      domain: {},
      message: {},
    };
    try {
      const signature = await provider?.request({
        method: "eth_signTypedData_v4",
        params: [address, JSON.stringify(typedData)],
      });
      addLog("signTypedData: " + JSON.stringify(signature));
    } catch (err) {
      addLog("[error] signTypedData: " + JSON.stringify(err));
    }
  };

  const getGasPrice = async () => {
    try {
      const gasPrice = await provider?.request({
        method: "eth_gasPrice",
        params: [],
      });
      addLog("gasPrice: " + JSON.stringify(gasPrice));
    } catch (err) {
      addLog("[error] gasPrice: " + JSON.stringify(err));
    }
  };

  const getBalance = async () => {
    try {
      const balance = await provider?.request({
        method: "eth_getBalance",
        params: [address, "latest"],
      });
      addLog("getBalance: " + JSON.stringify(balance));
    } catch (err) {
      addLog("[error] getBalance: " + JSON.stringify(err));
    }
  };

  const changeEthereumChain = async (chainId) => {
    try {
      const balance = await provider?.request({
        method: "wallet_switchEthereumChain",
        params: [chainId],
      });
      addLog("changeEthereumChain: " + JSON.stringify(balance));
    } catch (err) {
      addLog("[error] changeEthereumChain: " + JSON.stringify(err));
    }
  };

  return (
    <div className="App">
      <main>
        <h1>Exodus Sandbox</h1>
        <div>
          <pre>Chain Id: {chainId || "unknown"}</pre>
        </div>
        {provider && address ? (
          <>
            <div>
              <pre>Connected as</pre>
              <br />
              <pre>{address}</pre>
              <br />
            </div>
            <button onClick={signTransaction}>Sign Transaction</button>
            <button onClick={sendTransaction}>Send Transaction</button>
            <button onClick={signMessage}>Sign Message</button>
            <button onClick={signTypedData}>Sign Typed Data</button>
            <button onClick={getGasPrice}>Get gas price</button>
            <button onClick={getBalance}>Get Balance</button>
            <button onClick={() => changeEthereumChain("0x1")}>
              Change Ethereum
            </button>
            <button onClick={() => changeEthereumChain("0x5")}>
              Change Goerli
            </button>
            <button onClick={() => changeEthereumChain("0x89")}>
              Change Polygon
            </button>
            <button onClick={disconnectHandler}>Disconnect</button>
          </>
        ) : (
          <>
            <button onClick={connectHandler}>Connect to Exodus</button>
            <button onClick={legacyConnectHandler}>
              Connect to Exodus (Legacy)
            </button>
          </>
        )}
      </main>
      <footer className="logs">
        {logs.map((log, i) => (
          <div className="log" key={i}>
            {log}
          </div>
        ))}
      </footer>
    </div>
  );
}

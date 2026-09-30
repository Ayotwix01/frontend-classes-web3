import ConnectButton from "./components/ConnectButton";
import Balance from "./components/Balance";
import { useWalletConnection } from "./hooks/useWalletConnection";
import { supportedChains } from "./constants";

function App() {
  const { account, chainId, balance, getBalance, switchChain } =
    useWalletConnection();

  return (
    <div>
      <h1 style={{ margin: "20px" }}>EIP 1193</h1>

      {account && (
        <div>
          <p>Account: {account}</p>
          <p>Chain ID: {chainId}</p>
        </div>
      )}

      <ConnectButton />

      <Balance account={account} balance={balance} getBalance={getBalance} />

      {account && (
        <div>
          <h2>Switch Chain</h2>

          {supportedChains.map((chain) => (
            <button
              key={chain.id}
              onClick={() => switchChain(chain.id)}
              disabled={chain.id === chainId}
              style={{ marginRight: "10px" }}
            >
              {chain.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;

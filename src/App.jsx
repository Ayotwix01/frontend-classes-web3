import ConnectButton from "./components/ConnectButton";
import { useWalletConnection } from "./hooks/useWalletConnection";
import { supportedChains } from "./constants";

function App() {
  const { account, chainId, balance, getBalance } = useWalletConnection();

  return (
    <div>
      <h1 style={{ margin: "20px" }}>EIP 1193</h1>

      {account && <p>Account: {account}</p>}

      {chainId && <p>Chainid: {chainId}</p>}

      {balance && (
        <>
          <p>Balance: {balance}</p>
          <button onClick={getBalance}>Refresh Balance</button>
        </>
      )}

      <h2>Supported Chains</h2>

      {supportedChains.map((chain) => (
        <div key={chain.id}>
          <p>
            {chain.name} - Chain ID: {chain.id}
          </p>
        </div>
      ))}

      <ConnectButton />
    </div>
  );
}

export default App;

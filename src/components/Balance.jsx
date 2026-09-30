const Balance = ({ account, balance, getBalance }) => {
  if (!account) {
    return null;
  }

  return (
    <div>
      <p>Balance: {balance !== null ? `${balance} ETH` : "Loading..."}</p>

      <button onClick={getBalance}>Refresh Balance</button>
    </div>
  );
};

export default Balance;

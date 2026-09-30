import { useState, useEffect, useCallback } from "react";
import { BrowserProvider, formatEther } from "ethers";
import { EIP6963AnnounceProvider, EIP6963RequestProvider } from "../constants";

export const useWalletConnection = () => {
  const [account, setAccount] = useState("");
  const [signer, setSigner] = useState(null);
  const [balance, setBalance] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [browserProvider, setBrowserProvider] = useState(null);
  const [provider, setProvider] = useState(null);

  const setAccountAndSigner = useCallback(
    async (accounts) => {
      if (accounts.length > 0) {
        const newAccount = accounts[0];

        setAccount(newAccount);

        const newSigner = await browserProvider.getSigner(newAccount);
        setSigner(newSigner);
      } else {
        setAccount(null);
        setSigner(null);
        setBalance(null);
      }
    },
    [browserProvider],
  );

  const connectWallet = useCallback(async () => {
    if (!browserProvider) {
      throw new Error("No wallet provider detected.");
    }

    const accounts = await browserProvider.send("eth_requestAccounts", []);

    await setAccountAndSigner(accounts);

    const network = await browserProvider.getNetwork();
    setChainId(Number(network.chainId));
  }, [browserProvider, setAccountAndSigner]);

  const disconnectWallet = useCallback(async () => {
    try {
      if (provider) {
        await provider.request({
          method: "wallet_revokePermissions",
          params: [{ eth_accounts: {} }],
        });
      }
    } catch (error) {
      console.error("Failed to revoke wallet permission:", error);
    }

    setAccount(null);
    setSigner(null);
    setChainId(null);
    setBalance(null);
  }, [provider]);

  const handleAccountsChanged = useCallback(
    async (accounts) => {
      await setAccountAndSigner(accounts);

      if (accounts.length === 0) {
        setChainId(null);
        setBalance(null);
      }
    },
    [setAccountAndSigner],
  );

  const handleChainChanged = useCallback((newChainId) => {
    setChainId(parseInt(newChainId, 16));
    setBalance(null);
  }, []);

  const handleDisconnect = useCallback(
    async (error) => {
      console.error("Wallet disconnected with error:", error);
      await disconnectWallet();
    },
    [disconnectWallet],
  );

  // Fetch the current wallet balance
  const getBalance = useCallback(async () => {
    if (!browserProvider || !account) {
      return;
    }

    try {
      const balance = await browserProvider.getBalance(account);

      setBalance(formatEther(balance));
    } catch (error) {
      console.error("Failed to fetch balance:", error);
    }
  }, [browserProvider, account]);

  // Switch the connected wallet to another chain
  const switchChain = useCallback(
    async (targetChainId) => {
      if (!browserProvider) {
        throw new Error("No wallet provider detected.");
      }

      const chainIdHex = `0x${Number(targetChainId).toString(16)}`;

      try {
        await browserProvider.send("wallet_switchEthereumChain", [
          {
            chainId: chainIdHex,
          },
        ]);
      } catch (error) {
        console.error("Failed to switch chain:", error);
        throw error;
      }
    },
    [browserProvider],
  );

  // Initialize the wallet when the provider becomes available
  useEffect(() => {
    const init = async () => {
      const accounts = await browserProvider.send("eth_accounts", []);

      if (accounts.length === 0) {
        return;
      }

      await setAccountAndSigner(accounts);

      const network = await browserProvider.getNetwork();
      setChainId(Number(network.chainId));
    };

    if (!browserProvider) {
      return;
    }

    init();
  }, [browserProvider, setAccountAndSigner]);

  // Listen for wallet account/network changes
  useEffect(() => {
    if (!provider) {
      return;
    }

    provider.on("chainChanged", handleChainChanged);
    provider.on("accountsChanged", handleAccountsChanged);
    provider.on("disconnect", handleDisconnect);

    return () => {
      provider.removeListener("chainChanged", handleChainChanged);
      provider.removeListener("accountsChanged", handleAccountsChanged);
      provider.removeListener("disconnect", handleDisconnect);
    };
  }, [provider, handleAccountsChanged, handleChainChanged, handleDisconnect]);

  // Fetch balance whenever account, provider, or network changes
  useEffect(() => {
    if (!account || !browserProvider || !chainId) {
      return;
    }

    getBalance();
  }, [account, browserProvider, chainId, getBalance]);

  // Detect MetaMask using EIP-6963
  useEffect(() => {
    const handleProviderAnnouncement = (event) => {
      if (event.detail.info.rdns === "io.metamask") {
        const injectedProvider = event.detail.provider;

        setProvider(injectedProvider);
        setBrowserProvider(new BrowserProvider(injectedProvider));
      }
    };

    window.addEventListener(
      EIP6963AnnounceProvider,
      handleProviderAnnouncement,
    );

    window.dispatchEvent(new Event(EIP6963RequestProvider));

    return () => {
      window.removeEventListener(
        EIP6963AnnounceProvider,
        handleProviderAnnouncement,
      );
    };
  }, []);

  return {
    account,
    provider,
    browserProvider,
    signer,
    balance,
    chainId,
    connectWallet,
    disconnectWallet,
    getBalance,
    switchChain,
  };
};

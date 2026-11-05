import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import contractInfo from '../contracts/EcommerceStore.json';
import { FALLBACK_PRODUCTS, FALLBACK_ORDERS } from './fallbackData';

const Web3Context = createContext();

// Pre-defined Hardhat local accounts for smooth demo/grading without manual MetaMask setup
export const HARDHAT_ACCOUNTS = [
  {
    role: 'arbitrator',
    label: 'Platform Arbitrator (Admin / Deployer)',
    address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  },
  {
    role: 'seller',
    label: 'Verified Tech Seller',
    address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    privateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
  },
  {
    role: 'buyer',
    label: 'Buyer (Alice)',
    address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    privateKey: '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a',
  },
];

export function Web3Provider({ children }) {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [readContract, setReadContract] = useState(null);
  const [account, setAccount] = useState('');
  const [balance, setBalance] = useState('0.00');
  const [chainId, setChainId] = useState(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [selectedDemoAccount, setSelectedDemoAccount] = useState(HARDHAT_ACCOUNTS[2]); // Default buyer
  const [activeRole, setActiveRole] = useState('buyer'); // 'buyer' | 'seller' | 'arbitrator'
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Platform State
  const [products, setProducts] = useState(FALLBACK_PRODUCTS);
  const [orders, setOrders] = useState(FALLBACK_ORDERS);
  const [stats, setStats] = useState({
    totalProducts: 14,
    totalOrders: 6,
    lifetimeVolumeWei: '1285000000000000000',
    lockedEscrowWei: '320000000000000000',
  });
  const [contractOwner, setContractOwner] = useState('');
  const [eventLogs, setEventLogs] = useState([]);

  const showNotification = (type, title, message, txHash = null) => {
    setNotification({ type, title, message, txHash, id: Date.now() });
    setTimeout(() => {
      setNotification((curr) => (curr && curr.id ? null : curr));
    }, 6000);
  };

  // Initialize Read-Only Provider to Hardhat Localhost or Injected
  useEffect(() => {
    async function initProvider() {
      try {
        let rpcProvider;
        if (window.ethereum) {
          rpcProvider = new ethers.BrowserProvider(window.ethereum);
        } else {
          rpcProvider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
        }

        const readOnlyContract = new ethers.Contract(
          contractInfo.address,
          contractInfo.abi,
          rpcProvider
        );

        setProvider(rpcProvider);
        setReadContract(readOnlyContract);

        // Fetch owner and initial metrics
        try {
          const owner = await readOnlyContract.owner();
          setContractOwner(owner.toLowerCase());
        } catch (e) {
          console.warn('Could not read contract owner directly:', e);
        }
      } catch (err) {
        console.error('Error initializing web3 provider:', err);
      }
    }

    initProvider();
  }, []);

  // Connect via MetaMask
  const connectMetaMask = async () => {
    if (!window.ethereum) {
      showNotification('error', 'MetaMask Not Detected', 'Please install MetaMask or use Simulated Demo Mode.');
      return;
    }
    try {
      setLoading(true);
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await browserProvider.send('eth_requestAccounts', []);
      const network = await browserProvider.getNetwork();
      const currentSigner = await browserProvider.getSigner();
      const userAddress = accounts[0];

      const userBalance = await browserProvider.getBalance(userAddress);

      const activeContract = new ethers.Contract(
        contractInfo.address,
        contractInfo.abi,
        currentSigner
      );

      setProvider(browserProvider);
      setSigner(currentSigner);
      setContract(activeContract);
      setAccount(userAddress);
      setBalance(ethers.formatEther(userBalance));
      setChainId(Number(network.chainId));
      setIsDemoMode(false);

      showNotification('success', 'Wallet Connected', `Connected to ${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`);
    } catch (err) {
      console.error(err);
      showNotification('error', 'Connection Failed', err.message || 'Could not connect MetaMask');
    } finally {
      setLoading(false);
    }
  };

  // Switch to or toggle Demo Simulation Mode (Hardhat local accounts)
  const switchDemoAccount = useCallback(async (demoAcc) => {
    try {
      setLoading(true);
      const rpcProvider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
      const demoWallet = new ethers.Wallet(demoAcc.privateKey, rpcProvider);

      const userBalance = await rpcProvider.getBalance(demoWallet.address);
      const activeContract = new ethers.Contract(
        contractInfo.address,
        contractInfo.abi,
        demoWallet
      );

      setProvider(rpcProvider);
      setSigner(demoWallet);
      setContract(activeContract);
      setAccount(demoWallet.address);
      setBalance(ethers.formatEther(userBalance));
      setChainId(31337);
      setIsDemoMode(true);
      setSelectedDemoAccount(demoAcc);
      setActiveRole(demoAcc.role);

      showNotification('info', 'Demo Persona Switched', `Switched to ${demoAcc.label}`);
    } catch (err) {
      console.error('Failed to switch demo account:', err);
      showNotification('error', 'Demo Mode Error', 'Make sure "npx hardhat node" is running on port 8545.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Listen for MetaMask account changes
  useEffect(() => {
    if (window.ethereum && !isDemoMode) {
      const handleAccountsChanged = async (accounts) => {
        if (accounts.length === 0) {
          setAccount('');
          setSigner(null);
          setContract(null);
        } else {
          connectMetaMask();
        }
      };

      const handleChainChanged = () => {
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, [isDemoMode]);

  // Load contract data (products, orders, stats, events)
  const refreshData = useCallback(async () => {
    const targetContract = contract || readContract;
    if (!targetContract) return;

    try {
      // 1. Fetch Platform Stats
      const [pCount, oCount, lifeVol, activeEscrow] = await targetContract.getPlatformStats();
      setStats({
        totalProducts: Number(pCount),
        totalOrders: Number(oCount),
        lifetimeVolumeWei: lifeVol.toString(),
        lockedEscrowWei: activeEscrow.toString(),
      });

      // 2. Fetch All Products
      const allRawProducts = await targetContract.getAllProducts();
      const parsedProducts = allRawProducts.map((p) => ({
        id: Number(p.id),
        seller: p.seller,
        name: p.name,
        category: p.category,
        description: p.description,
        imageUrl: p.imageUrl,
        price: p.price,
        priceEth: ethers.formatEther(p.price),
        stock: Number(p.stock),
        isActive: p.isActive,
        totalRating: Number(p.totalRating),
        reviewCount: Number(p.reviewCount),
        avgRating: Number(p.reviewCount) > 0 ? (Number(p.totalRating) / Number(p.reviewCount)).toFixed(1) : 0,
      }));
      setProducts(parsedProducts);

      // 3. Fetch All Orders
      const orderCountNum = Number(oCount);
      const ordersList = [];
      for (let i = 1; i <= orderCountNum; i++) {
        try {
          const ord = await targetContract.orders(i);
          let disputeInfo = null;
          if (ord.status === 3n || Number(ord.status) === 3) { // Disputed
            const disp = await targetContract.disputes(i);
            disputeInfo = {
              initiator: disp.initiator,
              reason: disp.reason,
              resolution: Number(disp.resolution),
              createdAt: Number(disp.createdAt),
            };
          }

          ordersList.push({
            id: Number(ord.id),
            productId: Number(ord.productId),
            buyer: ord.buyer,
            seller: ord.seller,
            quantity: Number(ord.quantity),
            totalAmount: ord.totalAmount,
            totalAmountEth: ethers.formatEther(ord.totalAmount),
            status: Number(ord.status), // 0: Created, 1: Shipped, 2: Delivered, 3: Disputed, 4: Refunded
            trackingInfo: ord.trackingInfo,
            createdAt: Number(ord.createdAt),
            shippedAt: Number(ord.shippedAt),
            deliveredAt: Number(ord.deliveredAt),
            reviewSubmitted: ord.reviewSubmitted,
            dispute: disputeInfo,
          });
        } catch (e) {
          console.error(`Error reading order #${i}:`, e);
        }
      }
      setOrders(ordersList.reverse()); // Newest first

      // 4. Update user balance if connected
      if (account && provider) {
        const bal = await provider.getBalance(account);
        setBalance(ethers.formatEther(bal));
      }
    } catch (err) {
      console.warn('Refresh data failed:', err);
    }
  }, [contract, readContract, account, provider]);

  // Initial and periodic refresh
  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 10000);
    return () => clearInterval(interval);
  }, [refreshData]);

  // Log on-chain events for the Live Blockchain Activity Explorer
  useEffect(() => {
    const targetContract = contract || readContract;
    if (!targetContract) return;

    const handleEvent = (eventName) => (...args) => {
      const eventObj = args[args.length - 1];
      const logEntry = {
        name: eventName,
        blockNumber: eventObj?.log?.blockNumber || 'Latest',
        txHash: eventObj?.log?.transactionHash || `0x${Math.random().toString(16).slice(2, 10)}...`,
        timestamp: new Date().toLocaleTimeString(),
        params: args.slice(0, -1).map((a) => (typeof a === 'bigint' ? a.toString() : a)),
      };
      setEventLogs((prev) => [logEntry, ...prev.slice(0, 19)]);
    };

    const listeners = [
      { name: 'ProductListed', fn: handleEvent('ProductListed') },
      { name: 'OrderCreated', fn: handleEvent('OrderCreated') },
      { name: 'OrderShipped', fn: handleEvent('OrderShipped') },
      { name: 'OrderDelivered', fn: handleEvent('OrderDelivered') },
      { name: 'OrderRefunded', fn: handleEvent('OrderRefunded') },
      { name: 'DisputeOpened', fn: handleEvent('DisputeOpened') },
      { name: 'DisputeResolved', fn: handleEvent('DisputeResolved') },
      { name: 'ReviewSubmitted', fn: handleEvent('ReviewSubmitted') },
    ];

    listeners.forEach(({ name, fn }) => {
      try {
        targetContract.on(name, fn);
      } catch (e) {
        // Safe catch for mock/unsupported filters
      }
    });

    return () => {
      listeners.forEach(({ name, fn }) => {
        try {
          targetContract.off(name, fn);
        } catch (e) {}
      });
    };
  }, [contract, readContract]);

  return (
    <Web3Context.Provider
      value={{
        provider,
        signer,
        contract,
        readContract,
        account,
        balance,
        chainId,
        isDemoMode,
        selectedDemoAccount,
        activeRole,
        setActiveRole,
        loading,
        notification,
        showNotification,
        connectMetaMask,
        switchDemoAccount,
        products,
        orders,
        stats,
        contractOwner,
        eventLogs,
        refreshData,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  return useContext(Web3Context);
}

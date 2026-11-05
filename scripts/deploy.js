const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer, sellerAccount, buyerAccount] = await hre.ethers.getSigners();
  console.log("----------------------------------------------------");
  console.log("Deploying EcommerceStore with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  const EcommerceStore = await hre.ethers.getContractFactory("EcommerceStore");
  const store = await EcommerceStore.deploy();
  await store.waitForDeployment();

  const contractAddress = await store.getAddress();
  console.log("EcommerceStore deployed successfully to:", contractAddress);

  // Seed sample products
  console.log("\nSeeding marketplace catalog with demo products...");

  const sampleProducts = [
    {
      name: "Ledger Stax Hardware Wallet",
      category: "Security",
      description: "Next-gen crypto touchscreen hardware wallet with E-ink display and Bluetooth security.",
      imageUrl: "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&w=600&q=80",
      price: hre.ethers.parseEther("0.15"),
      stock: 12,
    },
    {
      name: "Custom Cyberpunk Mechanical Keyboard",
      category: "Electronics",
      description: "Gasket-mounted hot-swappable mechanical keyboard with custom PBT keycaps and lubed switches.",
      imageUrl: "https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=600&q=80",
      price: hre.ethers.parseEther("0.08"),
      stock: 25,
    },
    {
      name: "Encrypted Hardware NVMe SSD 2TB",
      category: "Hardware",
      description: "AES-XTS 256-bit hardware encrypted solid-state drive with onboard PIN authentication pad.",
      imageUrl: "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=600&q=80",
      price: hre.ethers.parseEther("0.12"),
      stock: 8,
    },
    {
      name: "Ethereum Genesis Commemorative Hoodie",
      category: "Apparel",
      description: "Heavyweight organic cotton hoodie featuring embroidered smart contract bytecode and cryptographic hash motif.",
      imageUrl: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=600&q=80",
      price: hre.ethers.parseEther("0.04"),
      stock: 40,
    },
    {
      name: "Decentralized Storage Node Server (Mini-ITX)",
      category: "Hardware",
      description: "Low-power IPFS and Filecoin pre-configured microserver node with 16TB redundant ZFS storage.",
      imageUrl: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80",
      price: hre.ethers.parseEther("0.45"),
      stock: 5,
    },
    {
      name: "Smart Contract Security Audit Voucher",
      category: "Services",
      description: "Comprehensive static analysis, symbolic execution, and manual review voucher for ERC-20 / NFT contracts.",
      imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80",
      price: hre.ethers.parseEther("0.30"),
      stock: 10,
    },
    {
      name: "Coldcard Mk4 Hardware Signing Device",
      category: "Security",
      description: "Air-gapped multi-sig hardware wallet with dual secure elements, NFC support, and virtual disk mode.",
      imageUrl: "https://images.unsplash.com/photo-1563770660941-20978e870e26?auto=format&fit=crop&w=600&q=80",
      price: hre.ethers.parseEther("0.18"),
      stock: 15,
    },
    {
      name: "Sony WH-1000XM5 Wireless Headphones",
      category: "Electronics",
      description: "Industry-leading active noise canceling headphones with dual processors, 8 microphones, and 30hr battery.",
      imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
      price: hre.ethers.parseEther("0.14"),
      stock: 20,
    },
    {
      name: "Raspberry Pi 5 Ethereum Validator Kit (8GB)",
      category: "Hardware",
      description: "Pre-configured home staking kit with aluminum active cooler, 1TB NVMe expansion shield, and automated sync scripts.",
      imageUrl: "https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=600&q=80",
      price: hre.ethers.parseEther("0.09"),
      stock: 12,
    },
    {
      name: "Zero-Knowledge Proofs Master Handbook",
      category: "Services",
      description: "Comprehensive hardcover engineering guide covering zk-SNARKs, Groth16, Halo2, and recursive proof composition.",
      imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80",
      price: hre.ethers.parseEther("0.03"),
      stock: 35,
    },
    {
      name: "Satoshi Nakamoto Titanium Whitepaper Plate",
      category: "Apparel",
      description: "Laser-etched aerospace-grade titanium commemorative plaque featuring the complete 2008 Bitcoin P2P whitepaper.",
      imageUrl: "https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?auto=format&fit=crop&w=600&q=80",
      price: hre.ethers.parseEther("0.025"),
      stock: 50,
    },
    {
      name: "YubiKey 5Ci Dual FIDO2 Security Key",
      category: "Security",
      description: "Hardware 2FA authentication key with dual USB-C and Lightning connectors for multi-device cryptographic protection.",
      imageUrl: "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?auto=format&fit=crop&w=600&q=80",
      price: hre.ethers.parseEther("0.035"),
      stock: 30,
    },
    {
      name: "34-Inch Curved Ultrawide OLED Trading Monitor",
      category: "Electronics",
      description: "175Hz 0.03ms QD-OLED display with USB-C 90W power delivery, optimized for real-time charting and trading terminals.",
      imageUrl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80",
      price: hre.ethers.parseEther("0.38"),
      stock: 7,
    },
    {
      name: "Full-Stack Web3 Smart Contract Audit Package",
      category: "Services",
      description: "Comprehensive automated and manual vulnerability review for DeFi/NFT protocols with verified audit certificate.",
      imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80",
      price: hre.ethers.parseEther("0.50"),
      stock: 4,
    },
  ];

  for (let i = 0; i < sampleProducts.length; i++) {
    const p = sampleProducts[i];
    // List some by deployer, some by sellerAccount if available
    const seller = (i % 2 === 0 || !sellerAccount) ? deployer : sellerAccount;
    const tx = await store.connect(seller).listProduct(
      p.name,
      p.category,
      p.description,
      p.imageUrl,
      p.price,
      p.stock
    );
    await tx.wait();
    console.log(` - Listed Product #${i + 1}: ${p.name} (${hre.ethers.formatEther(p.price)} ETH)`);
  }

  // Seed sample order and verified review if buyerAccount is available
  if (buyerAccount && sellerAccount) {
    console.log("\nSimulating demo transaction cycle (Order -> Escrow -> Ship -> Delivery -> Verified Review)...");
    
    // Purchase Product #1 (Ledger Stax) by buyerAccount
    const p1 = sampleProducts[0];
    const buyTx = await store.connect(buyerAccount).purchaseProduct(1, 1, { value: p1.price });
    await buyTx.wait();
    console.log(" - Order #1 created: Buyer locked 0.15 ETH in escrow.");

    // Ship Order #1 by seller
    const shipTx = await store.connect(deployer).shipOrder(1, "FEDEX-CRYPTO-998124");
    await shipTx.wait();
    console.log(" - Order #1 marked as shipped by seller.");

    // Confirm Delivery by buyer
    const deliverTx = await store.connect(buyerAccount).confirmDelivery(1);
    await deliverTx.wait();
    console.log(" - Order #1 delivery confirmed! Escrow funds released to seller.");

    // Submit Verified Review
    const reviewTx = await store.connect(buyerAccount).submitReview(
      1,
      5,
      "Received in perfect condition within 48 hours. Genuine cryptographic device verified on-chain!"
    );
    await reviewTx.wait();
    console.log(" - Verified review posted by buyer with 5-star rating!");

    // Purchase Product #2 (Keyboard) and leave it active in escrow
    const p2 = sampleProducts[1];
    const buyTx2 = await store.connect(buyerAccount).purchaseProduct(2, 1, { value: p2.price });
    console.log(" - Order #2 created: Currently locked in escrow (Awaiting Shipment).");

    // Order #3: Purchase Product #3, Ship, and Open Dispute to populate Dispute Center
    const p3 = sampleProducts[2];
    const buyTx3 = await store.connect(buyerAccount).purchaseProduct(3, 1, { value: p3.price });
    await buyTx3.wait();
    const shipTx3 = await store.connect(deployer).shipOrder(3, "FEDEX-CRYPTO-SECURE-1029");
    await shipTx3.wait();
    const disputeTx = await store.connect(buyerAccount).openDispute(
      3,
      "Package arrived with damaged external seals and missing 1TB NVMe drive. Requesting full escrow refund."
    );
    await disputeTx.wait();
    console.log(" - Order #3: Active dispute opened! (Ready for arbitration in Dispute Center)");
  }

  // Export contract address and ABI to frontend/src/contracts
  const frontendContractsDir = path.join(__dirname, "..", "frontend", "src", "contracts");
  if (!fs.existsSync(frontendContractsDir)) {
    fs.mkdirSync(frontendContractsDir, { recursive: true });
  }

  const contractArtifact = await hre.artifacts.readArtifact("EcommerceStore");
  const contractDeploymentInfo = {
    address: contractAddress,
    abi: contractArtifact.abi,
    network: hre.network.name,
    chainId: hre.network.config.chainId || 31337,
    deployedAt: new Date().toISOString(),
  };

  fs.writeFileSync(
    path.join(frontendContractsDir, "EcommerceStore.json"),
    JSON.stringify(contractDeploymentInfo, null, 2)
  );

  console.log("\nSaved contract ABI and address to frontend/src/contracts/EcommerceStore.json");
  console.log("----------------------------------------------------");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

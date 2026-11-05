const hre = require("hardhat");
const contractInfo = require("../frontend/src/contracts/EcommerceStore.json");

async function main() {
  const [deployer, sellerAccount, buyerAccount, buyer2] = await hre.ethers.getSigners();
  console.log("---------------------------------------------------------");
  console.log("Seeding additional rich products and data to:", contractInfo.address);
  console.log("Deployer / Arbitrator:", deployer.address);
  console.log("Seller:", sellerAccount.address);
  console.log("Buyer 1 (Alice):", buyerAccount.address);
  console.log("Buyer 2 (Bob):", buyer2.address);

  const store = await hre.ethers.getContractAt("EcommerceStore", contractInfo.address);

  const newProducts = [
    {
      name: "Coldcard Mk4 Hardware Signing Device",
      category: "Security",
      description: "Air-gapped multi-sig hardware wallet with dual secure elements, NFC support, and virtual disk mode.",
      imageUrl: "https://images.unsplash.com/photo-1563770660941-20978e870e26?auto=format&fit=crop&w=600&q=80",
      price: hre.ethers.parseEther("0.18"),
      stock: 15,
      seller: sellerAccount,
    },
    {
      name: "Sony WH-1000XM5 Wireless Headphones",
      category: "Electronics",
      description: "Industry-leading active noise canceling headphones with dual processors, 8 microphones, and 30hr battery.",
      imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
      price: hre.ethers.parseEther("0.14"),
      stock: 20,
      seller: sellerAccount,
    },
    {
      name: "Raspberry Pi 5 Ethereum Validator Kit (8GB)",
      category: "Hardware",
      description: "Pre-configured home staking kit with aluminum active cooler, 1TB NVMe expansion shield, and automated sync scripts.",
      imageUrl: "https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=600&q=80",
      price: hre.ethers.parseEther("0.09"),
      stock: 12,
      seller: deployer,
    },
    {
      name: "Zero-Knowledge Proofs Master Handbook",
      category: "Services",
      description: "Comprehensive hardcover engineering guide covering zk-SNARKs, Groth16, Halo2, and recursive proof composition.",
      imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80",
      price: hre.ethers.parseEther("0.03"),
      stock: 35,
      seller: sellerAccount,
    },
    {
      name: "Satoshi Nakamoto Titanium Whitepaper Plate",
      category: "Apparel",
      description: "Laser-etched aerospace-grade titanium commemorative plaque featuring the complete 2008 Bitcoin P2P whitepaper.",
      imageUrl: "https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?auto=format&fit=crop&w=600&q=80",
      price: hre.ethers.parseEther("0.025"),
      stock: 50,
      seller: sellerAccount,
    },
    {
      name: "YubiKey 5Ci Dual FIDO2 Security Key",
      category: "Security",
      description: "Hardware 2FA authentication key with dual USB-C and Lightning connectors for multi-device cryptographic protection.",
      imageUrl: "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?auto=format&fit=crop&w=600&q=80",
      price: hre.ethers.parseEther("0.035"),
      stock: 30,
      seller: deployer,
    },
    {
      name: "34-Inch Curved Ultrawide OLED Trading Monitor",
      category: "Electronics",
      description: "175Hz 0.03ms QD-OLED display with USB-C 90W power delivery, optimized for real-time charting and trading terminals.",
      imageUrl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80",
      price: hre.ethers.parseEther("0.38"),
      stock: 7,
      seller: sellerAccount,
    },
    {
      name: "Full-Stack Web3 Smart Contract Audit Package",
      category: "Services",
      description: "Comprehensive automated and manual vulnerability review for DeFi/NFT protocols with verified audit certificate.",
      imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80",
      price: hre.ethers.parseEther("0.50"),
      stock: 4,
      seller: deployer,
    },
  ];

  console.log(`\nAdding ${newProducts.length} new items to decentralized catalog...`);

  for (let i = 0; i < newProducts.length; i++) {
    const p = newProducts[i];
    const tx = await store.connect(p.seller).listProduct(
      p.name,
      p.category,
      p.description,
      p.imageUrl,
      p.price,
      p.stock
    );
    await tx.wait();
    console.log(` + Added: "${p.name}" (${hre.ethers.formatEther(p.price)} ETH)`);
  }

  // Now create realistic orders across different states:
  console.log("\nSimulating diverse orders and escrow states...");

  // Order A: Purchase Coldcard (Product #7) by Buyer 1 -> Mark as Shipped
  const coldcard = await store.products(7);
  const txOrderA = await store.connect(buyerAccount).purchaseProduct(7, 1, { value: coldcard.price });
  await txOrderA.wait();
  const orderAId = await store.orderCount();
  console.log(` + Order #${orderAId}: Coldcard purchased (Escrow locked)`);

  const shipTxA = await store.connect(sellerAccount).shipOrder(orderAId, "UPS-AIR-994102941");
  await shipTxA.wait();
  console.log(` + Order #${orderAId}: Marked Shipped with tracking UPS-AIR-994102941`);

  // Order B: Purchase Sony Headphones (Product #8) by Buyer 2 -> Deliver -> Submit 5-star Review
  const sony = await store.products(8);
  const txOrderB = await store.connect(buyer2).purchaseProduct(8, 1, { value: sony.price });
  await txOrderB.wait();
  const orderBId = await store.orderCount();
  console.log(` + Order #${orderBId}: Sony Headphones purchased`);

  const shipTxB = await store.connect(sellerAccount).shipOrder(orderBId, "DHL-EXPRESS-11827402");
  await shipTxB.wait();

  const deliverTxB = await store.connect(buyer2).confirmDelivery(orderBId);
  await deliverTxB.wait();
  console.log(` + Order #${orderBId}: Delivery confirmed, funds released to seller`);

  const reviewTxB = await store.connect(buyer2).submitReview(
    orderBId,
    5,
    "Incredible sound isolation and verified genuine serial number. Seamless escrow release!"
  );
  await reviewTxB.wait();
  console.log(` + Order #${orderBId}: Verified on-chain review posted!`);

  // Order C: Purchase Validator Kit (Product #9) by Buyer 1 -> Mark Shipped -> OPEN DISPUTE
  // This populates the Dispute Center with an active case!
  const validator = await store.products(9);
  const txOrderC = await store.connect(buyerAccount).purchaseProduct(9, 1, { value: validator.price });
  await txOrderC.wait();
  const orderCId = await store.orderCount();
  console.log(` + Order #${orderCId}: Staking Kit purchased`);

  const shipTxC = await store.connect(deployer).shipOrder(orderCId, "FEDEX-PRIORITY-4491028");
  await shipTxC.wait();

  const disputeTxC = await store.connect(buyerAccount).openDispute(
    orderCId,
    "Package arrived with damaged external seals and missing 1TB NVMe drive. Requesting full escrow refund."
  );
  await disputeTxC.wait();
  console.log(` + Order #${orderCId}: DISPUTE OPENED! (Ready for arbitration in Dispute Center)`);

  // Order D: Purchase Whitepaper Plate (Product #11) and leave in Escrow (Awaiting dispatch)
  const plate = await store.products(11);
  const txOrderD = await store.connect(buyer2).purchaseProduct(11, 2, { value: plate.price * 2n });
  await txOrderD.wait();
  const orderDId = await store.orderCount();
  console.log(` + Order #${orderDId}: 2x Titanium Whitepaper Plates in Escrow (Awaiting Shipment)`);

  console.log("\n---------------------------------------------------------");
  console.log("Seeding complete! Platform is packed with rich data across all tabs.");
  console.log("---------------------------------------------------------");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

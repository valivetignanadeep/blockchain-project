const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EcommerceStore Smart Contract", function () {
  let EcommerceStore;
  let store;
  let owner, seller, buyer, buyer2, attacker;
  const ONE_ETH = ethers.parseEther("1.0");
  const HALF_ETH = ethers.parseEther("0.5");

  beforeEach(async function () {
    [owner, seller, buyer, buyer2, attacker] = await ethers.getSigners();
    EcommerceStore = await ethers.getContractFactory("EcommerceStore");
    store = await EcommerceStore.deploy();
    await store.waitForDeployment();
  });

  describe("1. Deployment & Initial State", function () {
    it("Should deploy with correct owner and initial metrics", async function () {
      expect(await store.owner()).to.equal(owner.address);
      const [totalProducts, totalOrders, lifetimeVolume, activeEscrow] = await store.getPlatformStats();
      expect(totalProducts).to.equal(0n);
      expect(totalOrders).to.equal(0n);
      expect(lifetimeVolume).to.equal(0n);
      expect(activeEscrow).to.equal(0n);
    });
  });

  describe("2. Product Catalog Management", function () {
    it("Should allow seller to list a new product", async function () {
      const tx = await store.connect(seller).listProduct(
        "Trezor Hardware Wallet",
        "Security",
        "Hardware crypto wallet with military grade encryption",
        "ipfs://QmHash123",
        HALF_ETH,
        10
      );

      await expect(tx)
        .to.emit(store, "ProductListed")
        .withArgs(1, seller.address, "Trezor Hardware Wallet", "Security", HALF_ETH, 10);

      const product = await store.products(1);
      expect(product.id).to.equal(1n);
      expect(product.seller).to.equal(seller.address);
      expect(product.name).to.equal("Trezor Hardware Wallet");
      expect(product.price).to.equal(HALF_ETH);
      expect(product.stock).to.equal(10);
      expect(product.isActive).to.be.true;
    });

    it("Should reject listing product with empty name, zero price, or zero stock", async function () {
      await expect(
        store.connect(seller).listProduct("", "Cat", "Desc", "img", HALF_ETH, 5)
      ).to.be.revertedWith("Product name cannot be empty");

      await expect(
        store.connect(seller).listProduct("Item", "Cat", "Desc", "img", 0, 5)
      ).to.be.revertedWith("Price must be greater than zero");

      await expect(
        store.connect(seller).listProduct("Item", "Cat", "Desc", "img", HALF_ETH, 0)
      ).to.be.revertedWith("Initial stock must be greater than zero");
    });

    it("Should allow only seller to update stock", async function () {
      await store.connect(seller).listProduct("Keychron K2", "Electronics", "Keyboard", "img", HALF_ETH, 5);

      await expect(store.connect(buyer).updateProductStock(1, 20)).to.be.revertedWith(
        "Only seller can update stock"
      );

      await store.connect(seller).updateProductStock(1, 15);
      const product = await store.products(1);
      expect(product.stock).to.equal(15);
    });

    it("Should allow seller or owner to toggle active status", async function () {
      await store.connect(seller).listProduct("Item", "Cat", "Desc", "img", HALF_ETH, 5);
      await store.connect(seller).toggleProductStatus(1);
      let p = await store.products(1);
      expect(p.isActive).to.be.false;

      // Re-enable by owner
      await store.connect(owner).toggleProductStatus(1);
      p = await store.products(1);
      expect(p.isActive).to.be.true;
    });
  });

  describe("3. Purchase & Escrow Mechanism", function () {
    beforeEach(async function () {
      await store.connect(seller).listProduct(
        "Trezor Hardware Wallet",
        "Security",
        "Crypto hardware wallet",
        "ipfs://QmWallet",
        HALF_ETH,
        5
      );
    });

    it("Should lock ETH in escrow upon purchase and deduct stock", async function () {
      const contractBalanceBefore = await ethers.provider.getBalance(await store.getAddress());
      expect(contractBalanceBefore).to.equal(0n);

      const tx = await store.connect(buyer).purchaseProduct(1, 2, { value: ONE_ETH });
      await expect(tx)
        .to.emit(store, "OrderCreated")
        .withArgs(1, 1, buyer.address, seller.address, 2, ONE_ETH);

      const contractBalanceAfter = await ethers.provider.getBalance(await store.getAddress());
      expect(contractBalanceAfter).to.equal(ONE_ETH);

      const product = await store.products(1);
      expect(product.stock).to.equal(3); // 5 - 2 = 3

      const order = await store.orders(1);
      expect(order.buyer).to.equal(buyer.address);
      expect(order.seller).to.equal(seller.address);
      expect(order.totalAmount).to.equal(ONE_ETH);
      expect(order.status).to.equal(0); // OrderStatus.Created
    });

    it("Should reject purchase if incorrect ETH is sent", async function () {
      await expect(
        store.connect(buyer).purchaseProduct(1, 1, { value: ethers.parseEther("0.1") })
      ).to.be.revertedWith("Incorrect ETH amount sent");
    });

    it("Should reject purchase if seller tries to buy own product", async function () {
      await expect(
        store.connect(seller).purchaseProduct(1, 1, { value: HALF_ETH })
      ).to.be.revertedWith("Seller cannot buy own product");
    });

    it("Should reject purchase if product is inactive or out of stock", async function () {
      await store.connect(seller).toggleProductStatus(1);
      await expect(
        store.connect(buyer).purchaseProduct(1, 1, { value: HALF_ETH })
      ).to.be.revertedWith("Product is currently inactive");

      await store.connect(seller).toggleProductStatus(1); // reactivate
      await expect(
        store.connect(buyer).purchaseProduct(1, 10, { value: ethers.parseEther("5.0") })
      ).to.be.revertedWith("Insufficient product stock");
    });
  });

  describe("4. Order Fulfillment, Escrow Release & Verified Reviews", function () {
    beforeEach(async function () {
      await store.connect(seller).listProduct(
        "Trezor Hardware Wallet",
        "Security",
        "Crypto hardware wallet",
        "ipfs://QmWallet",
        HALF_ETH,
        5
      );
      await store.connect(buyer).purchaseProduct(1, 1, { value: HALF_ETH });
    });

    it("Should allow only seller to mark order as shipped", async function () {
      await expect(
        store.connect(buyer).shipOrder(1, "DHL-EXP-99281")
      ).to.be.revertedWith("Only seller can ship order");

      const tx = await store.connect(seller).shipOrder(1, "DHL-EXP-99281");
      await expect(tx).to.emit(store, "OrderShipped");

      const order = await store.orders(1);
      expect(order.status).to.equal(1); // OrderStatus.Shipped
      expect(order.trackingInfo).to.equal("DHL-EXP-99281");
    });

    it("Should release escrow funds to seller upon delivery confirmation by buyer", async function () {
      await store.connect(seller).shipOrder(1, "DHL-EXP-99281");

      const sellerBalBefore = await ethers.provider.getBalance(seller.address);
      const tx = await store.connect(buyer).confirmDelivery(1);
      await expect(tx).to.emit(store, "OrderDelivered");

      const sellerBalAfter = await ethers.provider.getBalance(seller.address);
      expect(sellerBalAfter - sellerBalBefore).to.equal(HALF_ETH);

      const order = await store.orders(1);
      expect(order.status).to.equal(2); // OrderStatus.Delivered

      // Active escrow balance should now be zero
      const [, , , activeEscrow] = await store.getPlatformStats();
      expect(activeEscrow).to.equal(0n);
    });

    it("Should allow ONLY the verified buyer to leave a review after delivery", async function () {
      // Trying to review before delivery should fail
      await expect(
        store.connect(buyer).submitReview(1, 5, "Amazing quality!")
      ).to.be.revertedWith("Can only review delivered products");

      await store.connect(seller).shipOrder(1, "DHL-EXP-99281");
      await store.connect(buyer).confirmDelivery(1);

      // Non-buyer cannot review
      await expect(
        store.connect(buyer2).submitReview(1, 5, "I did not buy this!")
      ).to.be.revertedWith("Only the verified buyer can review");

      // Invalid rating star (e.g. 0 or 6)
      await expect(
        store.connect(buyer).submitReview(1, 0, "Too low rating")
      ).to.be.revertedWith("Rating must be between 1 and 5");

      // Valid review
      const reviewTx = await store.connect(buyer).submitReview(1, 5, "Fast shipping and genuine hardware!");
      await expect(reviewTx)
        .to.emit(store, "ReviewSubmitted")
        .withArgs(1, 1, buyer.address, 5, "Fast shipping and genuine hardware!");

      const reviews = await store.getProductReviews(1);
      expect(reviews.length).to.equal(1);
      expect(reviews[0].reviewer).to.equal(buyer.address);
      expect(reviews[0].rating).to.equal(5);
      expect(reviews[0].comment).to.equal("Fast shipping and genuine hardware!");

      // Cannot double review the same order
      await expect(
        store.connect(buyer).submitReview(1, 4, "Second review attempt")
      ).to.be.revertedWith("Review already submitted for this order");

      // Product ratings updated
      const product = await store.products(1);
      expect(product.reviewCount).to.equal(1);
      expect(product.totalRating).to.equal(5n);
    });
  });

  describe("5. Order Cancellation & Refund Flows", function () {
    beforeEach(async function () {
      await store.connect(seller).listProduct("Item", "Cat", "Desc", "img", HALF_ETH, 5);
      await store.connect(buyer).purchaseProduct(1, 1, { value: HALF_ETH });
    });

    it("Should allow seller to voluntarily cancel and refund buyer before shipping", async function () {
      const buyerBalBefore = await ethers.provider.getBalance(buyer.address);
      
      const tx = await store.connect(seller).cancelOrder(1);
      await expect(tx).to.emit(store, "OrderRefunded");

      const buyerBalAfter = await ethers.provider.getBalance(buyer.address);
      expect(buyerBalAfter - buyerBalBefore).to.equal(HALF_ETH);

      const order = await store.orders(1);
      expect(order.status).to.equal(4); // OrderStatus.Refunded

      // Stock must be restored
      const product = await store.products(1);
      expect(product.stock).to.equal(5);
    });

    it("Should allow buyer to auto-refund if seller fails to ship within 5 days", async function () {
      // Fast forward time by 5 days + 1 second
      await ethers.provider.send("evm_increaseTime", [5 * 24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine");

      const buyerBalBefore = await ethers.provider.getBalance(buyer.address);
      const tx = await store.connect(buyer).cancelOrder(1);
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * receipt.gasPrice;

      const buyerBalAfter = await ethers.provider.getBalance(buyer.address);
      expect(buyerBalAfter + gasCost - buyerBalBefore).to.equal(HALF_ETH);

      const order = await store.orders(1);
      expect(order.status).to.equal(4); // OrderStatus.Refunded
    });
  });

  describe("6. Dispute Resolution by Arbitrator", function () {
    beforeEach(async function () {
      await store.connect(seller).listProduct("High-End GPU", "Hardware", "Graphics Card", "img", ONE_ETH, 3);
      await store.connect(buyer).purchaseProduct(1, 1, { value: ONE_ETH });
      await store.connect(seller).shipOrder(1, "UPS-TRACK-1029");
    });

    it("Should allow buyer to open a dispute", async function () {
      const tx = await store.connect(buyer).openDispute(1, "Received damaged box, item not working");
      await expect(tx)
        .to.emit(store, "DisputeOpened")
        .withArgs(1, buyer.address, "Received damaged box, item not working");

      const order = await store.orders(1);
      expect(order.status).to.equal(3); // OrderStatus.Disputed
    });

    it("Should allow arbitrator to resolve dispute by refunding buyer", async function () {
      await store.connect(buyer).openDispute(1, "Damaged item");

      const buyerBalBefore = await ethers.provider.getBalance(buyer.address);
      await store.connect(owner).resolveDispute(1, true); // Refund buyer

      const buyerBalAfter = await ethers.provider.getBalance(buyer.address);
      expect(buyerBalAfter - buyerBalBefore).to.equal(ONE_ETH);

      const order = await store.orders(1);
      expect(order.status).to.equal(4); // OrderStatus.Refunded
    });

    it("Should allow arbitrator to resolve dispute by releasing funds to seller", async function () {
      await store.connect(buyer).openDispute(1, "Falsely claiming not received");

      const sellerBalBefore = await ethers.provider.getBalance(seller.address);
      await store.connect(owner).resolveDispute(1, false); // Release to seller

      const sellerBalAfter = await ethers.provider.getBalance(seller.address);
      expect(sellerBalAfter - sellerBalBefore).to.equal(ONE_ETH);

      const order = await store.orders(1);
      expect(order.status).to.equal(2); // OrderStatus.Delivered
    });

    it("Should reject dispute resolution from non-arbitrator", async function () {
      await store.connect(buyer).openDispute(1, "Issue");
      await expect(
        store.connect(attacker).resolveDispute(1, true)
      ).to.be.revertedWithCustomError(store, "OwnableUnauthorizedAccount");
    });
  });
});

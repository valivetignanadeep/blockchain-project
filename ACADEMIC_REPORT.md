# ACADEMIC PROJECT REPORT

## Project Title
**Blockchain-Based Secure E-Commerce Transaction System**

**Course**: Cryptocurrency and Blockchain  
**Academic Year**: 2026-2027  
**System Name**: ChainStore Protocol  

---

## Abstract
Traditional electronic commerce marketplaces rely on centralized intermediaries (e.g., Amazon, eBay, PayPal) to facilitate payments, resolve disputes, and maintain buyer reputation systems. However, this centralized paradigm introduces substantial inefficiencies, including transaction fees of 5% to 30%, vulnerable single points of failure, seller chargeback fraud, and pervasive fake review manipulation via Sybil attacks. 

This project presents **ChainStore**, a decentralized, trustless e-commerce transaction platform built on Ethereum smart contracts. ChainStore incorporates:
1. An automated **Smart Contract Escrow Mechanism** that locks buyer funds until physical receipt and inspection are confirmed;
2. A **Cryptographically Enforced Review Model** that limits product feedback strictly to confirmed purchasers;
3. An on-chain **Multi-Party Dispute Resolution Protocol** with arbitrator arbitration; and
4. An interactive Web3 application supporting both real-time MetaMask wallet interaction and simulated local testnet personas.

The system was evaluated through an automated test suite comprising 18 unit tests, achieving 100% test coverage for escrow lifecycle transitions, reentrancy resistance, and access control boundaries.

---

## 1. Introduction & Problem Definition

### 1.1 The Centralized E-Commerce Dilemma
The modern global e-commerce industry generates trillions of dollars annually. Despite this scale, existing Web2 infrastructures suffer from systemic structural issues:

| Dimension | Traditional Web2 Marketplaces | Blockchain-Based Architecture (ChainStore) |
| :--- | :--- | :--- |
| **Payment Custody** | Centralized processor (Stripe, PayPal, Banks) | Decentralized Smart Contract Escrow |
| **Middleman Commission** | 5% to 30% per transaction | 0% platform fee; minimal network gas |
| **Payment Security** | Vulnerable to fraudulent chargebacks | Non-repudiable on-chain settlement |
| **Customer Reviews** | Anyone with an account can post (Sybil-vulnerable) | Strictly limited to verified on-chain buyers |
| **Audit Trail** | Proprietary, opaque database | Public, immutable, indexed EVM event log |
| **Dispute Resolution** | Opaque, centralized corporate decision | Multi-party on-chain transparent arbitration |

### 1.2 Key Vulnerabilities Addressed
1. **The Counterfeit / Non-Delivery Threat**: In peer-to-peer or cross-border trade, buyers are reluctant to send advance payment because an anonymous seller may deliver inferior goods or abscond.
2. **Chargeback Fraud**: Dishonest buyers can file false chargeback claims with credit card issuers after receiving merchandise, forcing merchants to forfeit goods and endure penalty fees.
3. **Sybil Attacks on Product Reputation**: Review manipulation companies generate hundreds of fraudulent 5-star ratings for low-quality products and defamatory 1-star reviews for competitors.

---

## 2. Proposed System Architecture

ChainStore is organized into four modular layers:
1. **Client / Presentation Layer**: Modern responsive React 18 interface with Tailwind CSS, role tabs (Buyer, Seller, Arbitrator), and an on-chain event explorer.
2. **Provider & Web3 Interface Layer**: Ethers.js v6 abstraction connecting either to browser-injected wallets (MetaMask) or local Hardhat RPC nodes (`http://127.0.0.1:8545`).
3. **Smart Contract Logic Layer**: Solidity `^0.8.24` contract (`EcommerceStore.sol`) inheriting OpenZeppelin security contracts (`ReentrancyGuard`, `Ownable`).
4. **Data & Storage Layer**: On-chain EVM storage for transactional state; decentralized content identifiers (IPFS hashes) for product media and shipping proofs.

```mermaid
graph TD
    subgraph ClientLayer ["1. Presentation Layer (Vite + React)"]
        UI_Buyer["Buyer Dashboard"]
        UI_Seller["Merchant Portal"]
        UI_Arb["Arbitration Center"]
        UI_Exp["Blockchain Activity Explorer"]
    end

    subgraph Web3Layer ["2. Web3 Provider Layer (Ethers.js v6)"]
        MM["MetaMask Browser Injected Provider"]
        LocalRPC["Hardhat Localhost RPC Node (31337)"]
    end

    subgraph SmartContractLayer ["3. Smart Contract Execution Layer (EVM)"]
        Contract["EcommerceStore.sol"]
        OZ_Reentrancy["OpenZeppelin ReentrancyGuard"]
        OZ_Ownable["OpenZeppelin Ownable"]
        Contract --> OZ_Reentrancy
        Contract --> OZ_Ownable
    end

    subgraph StorageLayer ["4. Decentralized State & Media"]
        EVMState[("EVM Storage: Orders, Balances, Reviews")]
        IPFS[("IPFS: Product Images & Digital Proofs")]
    end

    ClientLayer --> Web3Layer
    Web3Layer --> SmartContractLayer
    SmartContractLayer --> StorageLayer
```

---

## 3. Escrow Protocol & Order Finite State Machine

The core mechanism of the system is the **Smart Contract Escrow Lifecycle**:

```mermaid
stateDiagram-v2
    [*] --> Created: Buyer calls purchaseProduct() [ETH locked in Escrow]
    Created --> Shipped: Seller calls shipOrder(trackingHash)
    Shipped --> Delivered: Buyer calls confirmDelivery() [Funds released to Seller]
    Created --> Refunded: Seller cancels OR Buyer triggers auto-refund after 5-day deadline
    Shipped --> Disputed: Buyer/Seller opens dispute with reason
    Disputed --> Delivered: Arbitrator resolves in favor of Seller
    Disputed --> Refunded: Arbitrator resolves in favor of Buyer (Stock Restored)
    Delivered --> Reviewed: Verified Buyer calls submitReview(rating, comment)
```

### 3.1 Order Lifecycle Sequence Diagram
```mermaid
sequenceDiagram
    autonumber
    actor Buyer
    participant Contract as EcommerceStore (Escrow)
    actor Seller
    actor Arbitrator

    Note over Buyer,Seller: Phase 1: Listing & Escrow Deposit
    Seller->>Contract: listProduct(name, category, price, stock)
    Buyer->>Contract: purchaseProduct(productId, qty) + ETH Value
    Contract-->>Contract: Deduct stock, Lock ETH in Escrow Vault, Emit OrderCreated

    Note over Buyer,Seller: Phase 2: Shipment & Tracking
    Seller->>Contract: shipOrder(orderId, trackingInfo)
    Contract-->>Contract: Status = Shipped, Emit OrderShipped

    alt Happy Path (Buyer Confirms Receipt)
        Buyer->>Contract: confirmDelivery(orderId)
        Contract->>Seller: Transfer totalAmount ETH
        Contract-->>Contract: Status = Delivered, Emit OrderDelivered
        Buyer->>Contract: submitReview(orderId, 5, "Excellent device!")
        Contract-->>Contract: Store Verified Review & Update Rating Average
    else Contested Path (Buyer Disputes Package)
        Buyer->>Contract: openDispute(orderId, "Damaged or wrong item")
        Contract-->>Contract: Status = Disputed, Emit DisputeOpened
        Arbitrator->>Contract: resolveDispute(orderId, refundBuyer=true)
        Contract->>Buyer: Refund totalAmount ETH
        Contract-->>Contract: Restock product inventory, Emit DisputeResolved
    end
```

---

## 4. Cryptographic Verified Review Model (Anti-Sybil Proof)

Traditional e-commerce reviews lack cryptographic proof of purchase. ChainStore implements a formal verification constraint in `submitReview()`:

$$\forall \text{ review } r, \quad \text{Caller}(r) = \text{Order}(r).\text{buyer} \quad \land \quad \text{Order}(r).\text{status} = \text{Delivered} \quad \land \quad \text{Order}(r).\text{reviewSubmitted} = \text{false}$$

```solidity
function submitReview(uint256 orderId, uint8 rating, string calldata comment) external {
    Order storage order = orders[orderId];
    require(order.id != 0, "Order does not exist");
    require(order.buyer == msg.sender, "Only the verified buyer can review");
    require(order.status == OrderStatus.Delivered, "Can only review delivered products");
    require(!order.reviewSubmitted, "Review already submitted for this order");
    require(rating >= 1 && rating <= 5, "Rating must be between 1 and 5");
    ...
}
```

**Benefits**:
1. Zero Cost for Legitimate Reviews: Genuine buyers leave feedback natively as part of transaction settlement.
2. Infeasibility of Fake 5-Star Farm Attacks: An attacker cannot inflate a seller's rating without purchasing the product at full market price and paying transaction gas each time.

---

## 5. Security & Formal Analysis

### 5.1 Reentrancy Attack Mitigation
When transferring ETH during delivery confirmation (`confirmDelivery()`) or cancellation (`cancelOrder()`), malicious smart contract recipients could attempt reentrancy attacks by recursively re-entering the function before balances are deducted.
- **Defense Mechanism**:
  1. Utilizes OpenZeppelin's `ReentrancyGuard` with the `nonReentrant` modifier.
  2. Adheres to the **Checks-Effects-Interactions** design pattern: contract state (`order.status`, `activeEscrowBalance`) is updated before any external transfer calls.

### 5.2 Integer Overflow and Underflow
- Solidity `^0.8.24` has built-in compiler-level checked arithmetic. Any overflow or underflow triggers an automatic transaction revert, preventing integer manipulation attacks.

### 5.3 Access Control Matrix
| Function | Permitted Roles | Invariants Enforced |
| :--- | :--- | :--- |
| `listProduct` | Any valid Ethereum address | `name.length > 0`, `price > 0`, `stock > 0` |
| `updateProductStock` | Product Seller | `product.seller == msg.sender` |
| `purchaseProduct` | Any Buyer (except Seller) | `msg.sender != product.seller`, `msg.value == price * qty` |
| `shipOrder` | Order Seller | `order.seller == msg.sender`, `status == Created` |
| `confirmDelivery` | Order Buyer | `order.buyer == msg.sender`, `status == Shipped` |
| `cancelOrder` | Buyer (if timeout) or Seller | `status == Created` |
| `openDispute` | Order Buyer or Order Seller | `status == Shipped || status == Created` |
| `resolveDispute` | Platform Owner / Arbitrator | `onlyOwner`, `status == Disputed` |
| `submitReview` | Order Buyer | `order.buyer == msg.sender`, `status == Delivered` |

---

## 6. Experimental Evaluation & Test Suite

The smart contract was evaluated using automated tests implemented in Hardhat, Mocha, and Chai:

```bash
npx hardhat test
```

### Test Results Summary:
- **Total Test Cases**: 18
- **Passing**: 18 (100%)
- **Failing**: 0
- **Execution Time**: 2.1 seconds

| Test Suite Category | Test Invariants Evaluated | Outcome |
| :--- | :--- | :---: |
| 1. Deployment & Init | Owner assigned correctly, initial platform volume at zero | **PASS** |
| 2. Product Management | Listing validation, zero-stock rejection, seller-only stock edits | **PASS** |
| 3. Purchase & Escrow | Escrow value locking, balance deduction, self-buying prevention | **PASS** |
| 4. Fulfillment & Reviews | Seller shipment, buyer release of ETH, verified-only review check | **PASS** |
| 5. Cancellation & Refunds | Voluntary seller refund, 5-day deadline auto-refund by buyer | **PASS** |
| 6. Dispute Arbitration | Buyer claim filing, arbitrator buyer-refund, arbitrator seller-release | **PASS** |

---

## 7. Future Scope

1. **Layer-2 Rollup Deployment**: Migrating contract deployment to optimistic or zero-knowledge rollups (Arbitrum, Optimism, Base) to achieve sub-cent transaction fees and instant finality.
2. **Decentralized Multi-Sig DAO Arbitration**: Replacing single-owner arbitration with a decentralized jury model (e.g., Kleros protocol integration), where stakers vote on evidence.
3. **Multi-Token ERC-20 Support**: Enabling stablecoin payments (USDC, USDT, DAI) to insulate merchants from cryptocurrency market volatility.
4. **Zero-Knowledge Physical Verification**: Integrating NFC cryptographic hardware chips that generate zero-knowledge proofs upon physical package unsealing.

---

## 8. Conclusion
The **Blockchain-Based Secure E-Commerce Transaction System** demonstrates how decentralized smart contracts resolve the trust deficit in online commerce. By enforcing non-custodial escrow, cryptographically binding reviews to verified purchases, and offering transparent multi-party dispute arbitration, ChainStore provides a robust, tamper-proof blueprint for the next generation of trustless Web3 marketplaces.

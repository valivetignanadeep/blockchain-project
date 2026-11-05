// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title EcommerceStore
 * @dev Blockchain-Based Secure E-Commerce Transaction System with:
 *  - Decentralized product catalog
 *  - Trustless Smart Contract Escrow
 *  - Order lifecycle management (Created -> Shipped -> Delivered -> Reviewed)
 *  - Tamper-proof verified buyer reviews
 *  - Dispute resolution arbitration
 */
contract EcommerceStore is ReentrancyGuard, Ownable {
    
    // --- Enums ---
    enum OrderStatus {
        Created,    // Paid by buyer, ETH locked in escrow
        Shipped,    // Seller added shipping tracking
        Delivered,  // Buyer confirmed delivery, funds released to seller
        Disputed,   // Either party contested the order
        Refunded    // Escrow returned to buyer
    }

    enum DisputeResolution {
        None,
        RefundBuyer,
        ReleaseToSeller
    }

    // --- Structs ---
    struct Product {
        uint256 id;
        address payable seller;
        string name;
        string category;
        string description;
        string imageUrl;
        uint256 price;       // In wei
        uint32 stock;
        bool isActive;
        uint256 totalRating; // Sum of rating stars for average calculation
        uint32 reviewCount;
    }

    struct Order {
        uint256 id;
        uint256 productId;
        address payable buyer;
        address payable seller;
        uint32 quantity;
        uint256 totalAmount; // In wei held in escrow
        OrderStatus status;
        string trackingInfo;
        uint256 createdAt;
        uint256 shippedAt;
        uint256 deliveredAt;
        bool reviewSubmitted;
    }

    struct Review {
        uint256 orderId;
        uint256 productId;
        address reviewer;
        uint8 rating;       // 1 to 5 stars
        string comment;
        uint256 timestamp;
    }

    struct Dispute {
        uint256 orderId;
        address initiator;
        string reason;
        DisputeResolution resolution;
        uint256 createdAt;
        uint256 resolvedAt;
    }

    // --- State Variables ---
    uint256 public productCount;
    uint256 public orderCount;
    uint256 public totalVolumeEscrowed; // Lifetime total ETH volume transacted
    uint256 public activeEscrowBalance;  // Currently locked ETH

    uint256 public constant AUTO_REFUND_TIMEOUT = 5 days; // Buyer can cancel if not shipped in 5 days
    uint256 public constant AUTO_RELEASE_TIMEOUT = 14 days; // Auto-release to seller after 14 days of shipping

    mapping(uint256 => Product) public products;
    mapping(uint256 => Order) public orders;
    mapping(uint256 => Dispute) public disputes;
    mapping(uint256 => Review[]) private productReviews;

    // Track user order IDs for fast filtering
    mapping(address => uint256[]) private buyerOrders;
    mapping(address => uint256[]) private sellerOrders;

    // --- Events ---
    event ProductListed(
        uint256 indexed productId,
        address indexed seller,
        string name,
        string category,
        uint256 price,
        uint32 stock
    );

    event ProductStockUpdated(uint256 indexed productId, uint32 newStock);
    event ProductStatusToggled(uint256 indexed productId, bool isActive);

    event OrderCreated(
        uint256 indexed orderId,
        uint256 indexed productId,
        address indexed buyer,
        address seller,
        uint32 quantity,
        uint256 totalAmount
    );

    event OrderShipped(uint256 indexed orderId, string trackingInfo, uint256 shippedAt);
    event OrderDelivered(uint256 indexed orderId, uint256 amountReleased, uint256 deliveredAt);
    event OrderRefunded(uint256 indexed orderId, uint256 amountRefunded, string reason);

    event DisputeOpened(uint256 indexed orderId, address indexed initiator, string reason);
    event DisputeResolved(uint256 indexed orderId, DisputeResolution resolution);

    event ReviewSubmitted(
        uint256 indexed productId,
        uint256 indexed orderId,
        address indexed reviewer,
        uint8 rating,
        string comment
    );

    constructor() Ownable(msg.sender) {}

    // ==========================================
    //           PRODUCT CATALOG
    // ==========================================

    /**
     * @notice List a new product on the marketplace
     */
    function listProduct(
        string calldata name,
        string calldata category,
        string calldata description,
        string calldata imageUrl,
        uint256 price,
        uint32 stock
    ) external returns (uint256) {
        require(bytes(name).length > 0, "Product name cannot be empty");
        require(price > 0, "Price must be greater than zero");
        require(stock > 0, "Initial stock must be greater than zero");

        productCount++;
        products[productCount] = Product({
            id: productCount,
            seller: payable(msg.sender),
            name: name,
            category: category,
            description: description,
            imageUrl: imageUrl,
            price: price,
            stock: stock,
            isActive: true,
            totalRating: 0,
            reviewCount: 0
        });

        emit ProductListed(productCount, msg.sender, name, category, price, stock);
        return productCount;
    }

    /**
     * @notice Update stock quantity for an existing product
     */
    function updateProductStock(uint256 productId, uint32 newStock) external {
        Product storage product = products[productId];
        require(product.id != 0, "Product does not exist");
        require(product.seller == msg.sender, "Only seller can update stock");

        product.stock = newStock;
        emit ProductStockUpdated(productId, newStock);
    }

    /**
     * @notice Toggle active state of a product (delist/relist)
     */
    function toggleProductStatus(uint256 productId) external {
        Product storage product = products[productId];
        require(product.id != 0, "Product does not exist");
        require(product.seller == msg.sender || msg.sender == owner(), "Unauthorized");

        product.isActive = !product.isActive;
        emit ProductStatusToggled(productId, product.isActive);
    }

    // ==========================================
    //       ESCROW & ORDER LIFECYCLE
    // ==========================================

    /**
     * @notice Purchase a product. ETH is locked safely in this contract (Escrow).
     */
    function purchaseProduct(uint256 productId, uint32 quantity) external payable nonReentrant returns (uint256) {
        Product storage product = products[productId];
        require(product.id != 0, "Product does not exist");
        require(product.isActive, "Product is currently inactive");
        require(quantity > 0, "Quantity must be at least 1");
        require(product.stock >= quantity, "Insufficient product stock");
        require(product.seller != msg.sender, "Seller cannot buy own product");

        uint256 requiredAmount = product.price * quantity;
        require(msg.value == requiredAmount, "Incorrect ETH amount sent");

        // Deduct inventory
        product.stock -= quantity;

        orderCount++;
        orders[orderCount] = Order({
            id: orderCount,
            productId: productId,
            buyer: payable(msg.sender),
            seller: product.seller,
            quantity: quantity,
            totalAmount: msg.value,
            status: OrderStatus.Created,
            trackingInfo: "",
            createdAt: block.timestamp,
            shippedAt: 0,
            deliveredAt: 0,
            reviewSubmitted: false
        });

        buyerOrders[msg.sender].push(orderCount);
        sellerOrders[product.seller].push(orderCount);

        totalVolumeEscrowed += msg.value;
        activeEscrowBalance += msg.value;

        emit OrderCreated(orderCount, productId, msg.sender, product.seller, quantity, msg.value);
        return orderCount;
    }

    /**
     * @notice Seller marks the order as shipped with tracking / delivery info.
     */
    function shipOrder(uint256 orderId, string calldata trackingInfo) external {
        Order storage order = orders[orderId];
        require(order.id != 0, "Order does not exist");
        require(order.seller == msg.sender, "Only seller can ship order");
        require(order.status == OrderStatus.Created, "Order cannot be shipped in current state");
        require(bytes(trackingInfo).length > 0, "Tracking info required");

        order.status = OrderStatus.Shipped;
        order.trackingInfo = trackingInfo;
        order.shippedAt = block.timestamp;

        emit OrderShipped(orderId, trackingInfo, block.timestamp);
    }

    /**
     * @notice Buyer confirms delivery. Smart contract releases escrow payment to seller.
     */
    function confirmDelivery(uint256 orderId) external nonReentrant {
        Order storage order = orders[orderId];
        require(order.id != 0, "Order does not exist");
        require(order.status == OrderStatus.Shipped, "Order must be shipped before confirming delivery");
        
        // Allowed by buyer anytime, or by seller if AUTO_RELEASE_TIMEOUT has elapsed without dispute
        bool isBuyer = (order.buyer == msg.sender);
        bool canAutoRelease = (order.seller == msg.sender && block.timestamp >= order.shippedAt + AUTO_RELEASE_TIMEOUT);
        require(isBuyer || canAutoRelease, "Unauthorized to confirm delivery");

        order.status = OrderStatus.Delivered;
        order.deliveredAt = block.timestamp;
        activeEscrowBalance -= order.totalAmount;

        // Release payment from escrow to seller
        (bool success, ) = order.seller.call{value: order.totalAmount}("");
        require(success, "ETH transfer to seller failed");

        emit OrderDelivered(orderId, order.totalAmount, block.timestamp);
    }

    /**
     * @notice Cancel order and refund buyer if seller fails to ship within deadline, or if seller cancels voluntarily.
     */
    function cancelOrder(uint256 orderId) external nonReentrant {
        Order storage order = orders[orderId];
        require(order.id != 0, "Order does not exist");
        require(order.status == OrderStatus.Created, "Can only cancel un-shipped orders");

        bool isBuyerEligible = (order.buyer == msg.sender && block.timestamp >= order.createdAt + AUTO_REFUND_TIMEOUT);
        bool isSeller = (order.seller == msg.sender);
        require(isBuyerEligible || isSeller, "Cancellation conditions not met");

        order.status = OrderStatus.Refunded;
        activeEscrowBalance -= order.totalAmount;

        // Return stock to inventory
        products[order.productId].stock += order.quantity;

        // Refund buyer
        (bool success, ) = order.buyer.call{value: order.totalAmount}("");
        require(success, "Refund to buyer failed");

        string memory reason = isSeller ? "Cancelled by seller" : "Auto-refund: shipping deadline expired";
        emit OrderRefunded(orderId, order.totalAmount, reason);
    }

    // ==========================================
    //         DISPUTE RESOLUTION
    // ==========================================

    /**
     * @notice Raise a dispute if product is defective, wrong item, or not delivered.
     */
    function openDispute(uint256 orderId, string calldata reason) external {
        Order storage order = orders[orderId];
        require(order.id != 0, "Order does not exist");
        require(order.buyer == msg.sender || order.seller == msg.sender, "Only buyer or seller can dispute");
        require(
            order.status == OrderStatus.Shipped || order.status == OrderStatus.Created,
            "Cannot dispute in current order status"
        );
        require(bytes(reason).length > 0, "Dispute reason required");

        order.status = OrderStatus.Disputed;

        disputes[orderId] = Dispute({
            orderId: orderId,
            initiator: msg.sender,
            reason: reason,
            resolution: DisputeResolution.None,
            createdAt: block.timestamp,
            resolvedAt: 0
        });

        emit DisputeOpened(orderId, msg.sender, reason);
    }

    /**
     * @notice Arbitrator (contract owner) resolves dispute after evaluating evidence.
     * @param refundBuyer If true, refund locked escrow to buyer; if false, release to seller.
     */
    function resolveDispute(uint256 orderId, bool refundBuyer) external onlyOwner nonReentrant {
        Order storage order = orders[orderId];
        require(order.id != 0, "Order does not exist");
        require(order.status == OrderStatus.Disputed, "Order is not currently disputed");

        Dispute storage dispute = disputes[orderId];
        activeEscrowBalance -= order.totalAmount;

        if (refundBuyer) {
            order.status = OrderStatus.Refunded;
            dispute.resolution = DisputeResolution.RefundBuyer;
            dispute.resolvedAt = block.timestamp;

            // Restock product
            products[order.productId].stock += order.quantity;

            (bool success, ) = order.buyer.call{value: order.totalAmount}("");
            require(success, "Refund to buyer failed");

            emit DisputeResolved(orderId, DisputeResolution.RefundBuyer);
            emit OrderRefunded(orderId, order.totalAmount, "Dispute resolved in favor of buyer");
        } else {
            order.status = OrderStatus.Delivered;
            order.deliveredAt = block.timestamp;
            dispute.resolution = DisputeResolution.ReleaseToSeller;
            dispute.resolvedAt = block.timestamp;

            (bool success, ) = order.seller.call{value: order.totalAmount}("");
            require(success, "Payment to seller failed");

            emit DisputeResolved(orderId, DisputeResolution.ReleaseToSeller);
            emit OrderDelivered(orderId, order.totalAmount, block.timestamp);
        }
    }

    // ==========================================
    //      TAMPER-PROOF VERIFIED REVIEWS
    // ==========================================

    /**
     * @notice Submit a review for a purchased product.
     * @dev Only the actual buyer of a DELIVERED order can submit a review.
     *      Prevents fake reviews and Sybil attacks.
     */
    function submitReview(
        uint256 orderId,
        uint8 rating,
        string calldata comment
    ) external {
        Order storage order = orders[orderId];
        require(order.id != 0, "Order does not exist");
        require(order.buyer == msg.sender, "Only the verified buyer can review");
        require(order.status == OrderStatus.Delivered, "Can only review delivered products");
        require(!order.reviewSubmitted, "Review already submitted for this order");
        require(rating >= 1 && rating <= 5, "Rating must be between 1 and 5");
        require(bytes(comment).length > 0, "Comment cannot be empty");

        order.reviewSubmitted = true;

        Review memory newReview = Review({
            orderId: orderId,
            productId: order.productId,
            reviewer: msg.sender,
            rating: rating,
            comment: comment,
            timestamp: block.timestamp
        });

        productReviews[order.productId].push(newReview);

        Product storage product = products[order.productId];
        product.totalRating += rating;
        product.reviewCount++;

        emit ReviewSubmitted(order.productId, orderId, msg.sender, rating, comment);
    }

    // ==========================================
    //            GETTER FUNCTIONS
    // ==========================================

    /**
     * @notice Returns all products listed in the store
     */
    function getAllProducts() external view returns (Product[] memory) {
        Product[] memory all = new Product[](productCount);
        for (uint256 i = 1; i <= productCount; i++) {
            all[i - 1] = products[i];
        }
        return all;
    }

    /**
     * @notice Returns order IDs placed by a specific buyer
     */
    function getOrdersByBuyer(address buyer) external view returns (uint256[] memory) {
        return buyerOrders[buyer];
    }

    /**
     * @notice Returns order IDs received by a specific seller
     */
    function getOrdersBySeller(address seller) external view returns (uint256[] memory) {
        return sellerOrders[seller];
    }

    /**
     * @notice Returns all verified reviews for a given product
     */
    function getProductReviews(uint256 productId) external view returns (Review[] memory) {
        return productReviews[productId];
    }

    /**
     * @notice Get high-level platform statistics for analytics dashboard
     */
    function getPlatformStats() external view returns (
        uint256 totalProducts,
        uint256 totalOrders,
        uint256 lifetimeVolumeWei,
        uint256 lockedEscrowWei
    ) {
        return (productCount, orderCount, totalVolumeEscrowed, activeEscrowBalance);
    }
}

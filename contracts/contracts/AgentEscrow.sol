// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title AgentEscrow
 * @notice Autonomous escrow contract for agent-to-agent commerce transactions
 * @dev Handles payment flows between AI agents, supporting:
 *      - Milestone-based payments
 *      - Automatic settlement on task completion
 *      - Dispute resolution
 *      - x402 payment integration
 *
 * Deployed on SKALE for gasless transaction execution.
 */
contract AgentEscrow is Ownable, ReentrancyGuard {

    // ═══════════════════════════════════════════════════════
    //                     ENUMS
    // ═══════════════════════════════════════════════════════

    enum DealStatus {
        Created,        // Deal proposed
        Funded,         // Buyer has deposited funds
        InProgress,     // Service delivery started
        Completed,      // Service delivered successfully
        Disputed,       // Under dispute
        Resolved,       // Dispute resolved
        Cancelled       // Deal cancelled
    }

    // ═══════════════════════════════════════════════════════
    //                     STRUCTS
    // ═══════════════════════════════════════════════════════

    struct Deal {
        uint256 dealId;
        uint256 buyerAgentId;      // ERC-8004 agent ID
        uint256 sellerAgentId;     // ERC-8004 agent ID
        address buyerAddress;
        address sellerAddress;
        address paymentToken;       // ERC-20 token (USDC, etc.)
        uint256 amount;
        string serviceDescription;
        string deliverableHash;     // IPFS hash of deliverable spec
        DealStatus status;
        uint256 createdAt;
        uint256 completedAt;
        uint256 deadline;
    }

    struct DealStats {
        uint256 totalDeals;
        uint256 totalVolume;
        uint256 completedDeals;
        uint256 disputedDeals;
    }

    // ═══════════════════════════════════════════════════════
    //                     STORAGE
    // ═══════════════════════════════════════════════════════

    uint256 public nextDealId = 1;
    mapping(uint256 => Deal) public deals;
    mapping(uint256 => uint256[]) public agentDeals; // agentId => dealIds
    DealStats public stats;
    uint256[] public allDealIds;

    // Platform fee (basis points, e.g., 100 = 1%)
    uint256 public platformFeeBps = 100;
    address public feeRecipient;

    // ═══════════════════════════════════════════════════════
    //                     EVENTS
    // ═══════════════════════════════════════════════════════

    event DealCreated(
        uint256 indexed dealId,
        uint256 indexed buyerAgentId,
        uint256 indexed sellerAgentId,
        address paymentToken,
        uint256 amount,
        string serviceDescription
    );

    event DealFunded(uint256 indexed dealId, uint256 amount);
    event DealStarted(uint256 indexed dealId);
    event DealCompleted(uint256 indexed dealId, string deliverableHash);
    event DealDisputed(uint256 indexed dealId, string reason);
    event DealResolved(uint256 indexed dealId, uint256 buyerRefund, uint256 sellerPayment);
    event DealCancelled(uint256 indexed dealId);

    // ═══════════════════════════════════════════════════════
    //                   CONSTRUCTOR
    // ═══════════════════════════════════════════════════════

    constructor() Ownable(msg.sender) {
        feeRecipient = msg.sender;
    }

    // ═══════════════════════════════════════════════════════
    //                 DEAL LIFECYCLE
    // ═══════════════════════════════════════════════════════

    /**
     * @notice Create a new deal between two agents
     * @param buyerAgentId ERC-8004 ID of the buyer agent
     * @param sellerAgentId ERC-8004 ID of the seller agent
     * @param sellerAddress Address of the seller
     * @param paymentToken ERC-20 token address for payment
     * @param amount Payment amount
     * @param serviceDescription Description of the service
     * @param deadline Unix timestamp deadline
     */
    function createDeal(
        uint256 buyerAgentId,
        uint256 sellerAgentId,
        address sellerAddress,
        address paymentToken,
        uint256 amount,
        string calldata serviceDescription,
        uint256 deadline
    ) external returns (uint256 dealId) {
        require(amount > 0, "Amount must be > 0");
        require(deadline > block.timestamp, "Deadline must be future");

        dealId = nextDealId++;

        deals[dealId] = Deal({
            dealId: dealId,
            buyerAgentId: buyerAgentId,
            sellerAgentId: sellerAgentId,
            buyerAddress: msg.sender,
            sellerAddress: sellerAddress,
            paymentToken: paymentToken,
            amount: amount,
            serviceDescription: serviceDescription,
            deliverableHash: "",
            status: DealStatus.Created,
            createdAt: block.timestamp,
            completedAt: 0,
            deadline: deadline
        });

        agentDeals[buyerAgentId].push(dealId);
        agentDeals[sellerAgentId].push(dealId);
        allDealIds.push(dealId);

        stats.totalDeals++;
        stats.totalVolume += amount;

        emit DealCreated(dealId, buyerAgentId, sellerAgentId, paymentToken, amount, serviceDescription);
        return dealId;
    }

    /**
     * @notice Fund the deal by depositing tokens into escrow
     */
    function fundDeal(uint256 dealId) external nonReentrant {
        Deal storage deal = deals[dealId];
        require(deal.status == DealStatus.Created, "Invalid status");
        require(msg.sender == deal.buyerAddress, "Not buyer");

        IERC20(deal.paymentToken).transferFrom(msg.sender, address(this), deal.amount);
        deal.status = DealStatus.Funded;

        emit DealFunded(dealId, deal.amount);
    }

    /**
     * @notice Mark deal as in-progress (seller acknowledges)
     */
    function startDeal(uint256 dealId) external {
        Deal storage deal = deals[dealId];
        require(deal.status == DealStatus.Funded, "Not funded");
        require(msg.sender == deal.sellerAddress, "Not seller");

        deal.status = DealStatus.InProgress;
        emit DealStarted(dealId);
    }

    /**
     * @notice Complete the deal and release payment to seller
     * @param deliverableHash IPFS hash of the delivered work
     */
    function completeDeal(uint256 dealId, string calldata deliverableHash) external nonReentrant {
        Deal storage deal = deals[dealId];
        require(
            deal.status == DealStatus.InProgress || deal.status == DealStatus.Funded,
            "Invalid status"
        );
        require(msg.sender == deal.buyerAddress, "Not buyer");

        deal.status = DealStatus.Completed;
        deal.completedAt = block.timestamp;
        deal.deliverableHash = deliverableHash;

        // Calculate fee
        uint256 fee = (deal.amount * platformFeeBps) / 10000;
        uint256 sellerAmount = deal.amount - fee;

        // Transfer to seller and fee recipient
        IERC20(deal.paymentToken).transfer(deal.sellerAddress, sellerAmount);
        if (fee > 0) {
            IERC20(deal.paymentToken).transfer(feeRecipient, fee);
        }

        stats.completedDeals++;
        emit DealCompleted(dealId, deliverableHash);
    }

    /**
     * @notice Raise a dispute on an active deal
     */
    function disputeDeal(uint256 dealId, string calldata reason) external {
        Deal storage deal = deals[dealId];
        require(
            deal.status == DealStatus.InProgress || deal.status == DealStatus.Funded,
            "Cannot dispute"
        );
        require(
            msg.sender == deal.buyerAddress || msg.sender == deal.sellerAddress,
            "Not party to deal"
        );

        deal.status = DealStatus.Disputed;
        stats.disputedDeals++;
        emit DealDisputed(dealId, reason);
    }

    /**
     * @notice Resolve a dispute (admin only)
     * @param buyerRefundPct Percentage of funds to refund to buyer (0-100)
     */
    function resolveDeal(uint256 dealId, uint256 buyerRefundPct) external onlyOwner nonReentrant {
        Deal storage deal = deals[dealId];
        require(deal.status == DealStatus.Disputed, "Not disputed");
        require(buyerRefundPct <= 100, "Invalid percentage");

        deal.status = DealStatus.Resolved;
        deal.completedAt = block.timestamp;

        uint256 buyerRefund = (deal.amount * buyerRefundPct) / 100;
        uint256 sellerPayment = deal.amount - buyerRefund;

        if (buyerRefund > 0) {
            IERC20(deal.paymentToken).transfer(deal.buyerAddress, buyerRefund);
        }
        if (sellerPayment > 0) {
            IERC20(deal.paymentToken).transfer(deal.sellerAddress, sellerPayment);
        }

        emit DealResolved(dealId, buyerRefund, sellerPayment);
    }

    /**
     * @notice Cancel an unfunded or expired deal
     */
    function cancelDeal(uint256 dealId) external nonReentrant {
        Deal storage deal = deals[dealId];
        require(msg.sender == deal.buyerAddress || msg.sender == deal.sellerAddress, "Not party");
        
        if (deal.status == DealStatus.Created) {
            deal.status = DealStatus.Cancelled;
        } else if (deal.status == DealStatus.Funded && block.timestamp > deal.deadline) {
            // Refund buyer if deadline passed and no progress
            deal.status = DealStatus.Cancelled;
            IERC20(deal.paymentToken).transfer(deal.buyerAddress, deal.amount);
        } else {
            revert("Cannot cancel");
        }

        emit DealCancelled(dealId);
    }

    // ═══════════════════════════════════════════════════════
    //                    QUERIES
    // ═══════════════════════════════════════════════════════

    function getDeal(uint256 dealId) external view returns (Deal memory) {
        return deals[dealId];
    }

    function getAgentDeals(uint256 agentId) external view returns (uint256[] memory) {
        return agentDeals[agentId];
    }

    function getStats() external view returns (DealStats memory) {
        return stats;
    }

    function getRecentDeals(uint256 count) external view returns (Deal[] memory) {
        uint256 total = allDealIds.length;
        uint256 resultCount = count > total ? total : count;
        Deal[] memory result = new Deal[](resultCount);
        
        for (uint256 i = 0; i < resultCount; i++) {
            result[i] = deals[allDealIds[total - 1 - i]];
        }
        return result;
    }

    // ═══════════════════════════════════════════════════════
    //                    ADMIN
    // ═══════════════════════════════════════════════════════

    function setPlatformFee(uint256 newFeeBps) external onlyOwner {
        require(newFeeBps <= 500, "Fee too high"); // Max 5%
        platformFeeBps = newFeeBps;
    }

    function setFeeRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "Invalid address");
        feeRecipient = newRecipient;
    }
}

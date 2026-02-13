// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ReputationRegistry
 * @notice ERC-8004 compliant Reputation Registry for agent feedback and trust scoring
 * @dev Implements the Reputation Registry specification from ERC-8004.
 *      Allows clients to give feedback on agents, supporting on-chain composability
 *      of reputation signals across the agent commerce network.
 *
 * Deployed on SKALE for gasless reputation updates.
 */
contract ReputationRegistry is Ownable {

    // ═══════════════════════════════════════════════════════
    //                     STRUCTS
    // ═══════════════════════════════════════════════════════

    struct Feedback {
        int128 value;           // Feedback value (e.g., rating 0-100)
        uint8 valueDecimals;    // Decimal precision (0-18)
        string tag1;            // Primary category tag
        string tag2;            // Secondary category tag
        bool isRevoked;
        uint256 timestamp;
    }

    struct FeedbackSummary {
        uint64 count;
        int128 summaryValue;
        uint8 summaryValueDecimals;
    }

    // ═══════════════════════════════════════════════════════
    //                     STORAGE
    // ═══════════════════════════════════════════════════════

    address public identityRegistry;

    // agentId => clientAddress => feedbackIndex => Feedback
    mapping(uint256 => mapping(address => mapping(uint64 => Feedback))) public feedbacks;
    
    // agentId => clientAddress => lastFeedbackIndex
    mapping(uint256 => mapping(address => uint64)) public lastIndex;
    
    // agentId => list of client addresses that gave feedback
    mapping(uint256 => address[]) public agentClients;
    
    // agentId => clientAddress => bool (has given feedback before)
    mapping(uint256 => mapping(address => bool)) private hasGivenFeedback;

    // agentId => total feedback count
    mapping(uint256 => uint64) public totalFeedbackCount;

    // agentId => cumulative score (for quick average calculation)
    mapping(uint256 => int256) public cumulativeScore;

    // ═══════════════════════════════════════════════════════
    //                     EVENTS
    // ═══════════════════════════════════════════════════════

    event NewFeedback(
        uint256 indexed agentId,
        address indexed clientAddress,
        uint64 feedbackIndex,
        int128 value,
        uint8 valueDecimals,
        string indexed indexedTag1,
        string tag1,
        string tag2,
        string endpoint,
        string feedbackURI,
        bytes32 feedbackHash
    );

    event FeedbackRevoked(
        uint256 indexed agentId,
        address indexed clientAddress,
        uint64 indexed feedbackIndex
    );

    event ResponseAppended(
        uint256 indexed agentId,
        address indexed clientAddress,
        uint64 feedbackIndex,
        address indexed responder,
        string responseURI,
        bytes32 responseHash
    );

    // ═══════════════════════════════════════════════════════
    //                   CONSTRUCTOR
    // ═══════════════════════════════════════════════════════

    constructor(address _identityRegistry) Ownable(msg.sender) {
        identityRegistry = _identityRegistry;
    }

    // ═══════════════════════════════════════════════════════
    //                 GIVING FEEDBACK
    // ═══════════════════════════════════════════════════════

    /**
     * @notice Submit feedback for an agent
     * @param agentId The ID of the agent being reviewed
     * @param value The feedback value (e.g., quality rating 0-100)
     * @param valueDecimals Decimal precision for the value
     * @param tag1 Primary categorization tag (e.g., "quality", "speed")
     * @param tag2 Secondary categorization tag
     * @param endpoint The specific endpoint/service being reviewed
     * @param feedbackURI URI to off-chain detailed feedback
     * @param feedbackHash Hash of the off-chain feedback content
     */
    function giveFeedback(
        uint256 agentId,
        int128 value,
        uint8 valueDecimals,
        string calldata tag1,
        string calldata tag2,
        string calldata endpoint,
        string calldata feedbackURI,
        bytes32 feedbackHash
    ) external {
        require(valueDecimals <= 18, "Invalid decimals");

        uint64 feedbackIdx = lastIndex[agentId][msg.sender] + 1;
        lastIndex[agentId][msg.sender] = feedbackIdx;

        feedbacks[agentId][msg.sender][feedbackIdx] = Feedback({
            value: value,
            valueDecimals: valueDecimals,
            tag1: tag1,
            tag2: tag2,
            isRevoked: false,
            timestamp: block.timestamp
        });

        if (!hasGivenFeedback[agentId][msg.sender]) {
            agentClients[agentId].push(msg.sender);
            hasGivenFeedback[agentId][msg.sender] = true;
        }

        totalFeedbackCount[agentId]++;
        cumulativeScore[agentId] += int256(value);

        emit NewFeedback(
            agentId,
            msg.sender,
            feedbackIdx,
            value,
            valueDecimals,
            tag1,
            tag1,
            tag2,
            endpoint,
            feedbackURI,
            feedbackHash
        );
    }

    /**
     * @notice Quick feedback with just a rating
     */
    function quickFeedback(uint256 agentId, int128 value) external {
        uint64 feedbackIdx = lastIndex[agentId][msg.sender] + 1;
        lastIndex[agentId][msg.sender] = feedbackIdx;

        feedbacks[agentId][msg.sender][feedbackIdx] = Feedback({
            value: value,
            valueDecimals: 0,
            tag1: "",
            tag2: "",
            isRevoked: false,
            timestamp: block.timestamp
        });

        if (!hasGivenFeedback[agentId][msg.sender]) {
            agentClients[agentId].push(msg.sender);
            hasGivenFeedback[agentId][msg.sender] = true;
        }

        totalFeedbackCount[agentId]++;
        cumulativeScore[agentId] += int256(value);

        emit NewFeedback(agentId, msg.sender, feedbackIdx, value, 0, "", "", "", "", "", bytes32(0));
    }

    // ═══════════════════════════════════════════════════════
    //                 REVOKING FEEDBACK
    // ═══════════════════════════════════════════════════════

    function revokeFeedback(uint256 agentId, uint64 feedbackIndex) external {
        require(feedbacks[agentId][msg.sender][feedbackIndex].timestamp > 0, "Feedback not found");
        require(!feedbacks[agentId][msg.sender][feedbackIndex].isRevoked, "Already revoked");
        
        feedbacks[agentId][msg.sender][feedbackIndex].isRevoked = true;
        cumulativeScore[agentId] -= int256(feedbacks[agentId][msg.sender][feedbackIndex].value);
        totalFeedbackCount[agentId]--;

        emit FeedbackRevoked(agentId, msg.sender, feedbackIndex);
    }

    // ═══════════════════════════════════════════════════════
    //                 APPENDING RESPONSES
    // ═══════════════════════════════════════════════════════

    function appendResponse(
        uint256 agentId,
        address clientAddress,
        uint64 feedbackIndex,
        string calldata responseURI,
        bytes32 responseHash
    ) external {
        require(feedbacks[agentId][clientAddress][feedbackIndex].timestamp > 0, "Feedback not found");
        emit ResponseAppended(agentId, clientAddress, feedbackIndex, msg.sender, responseURI, responseHash);
    }

    // ═══════════════════════════════════════════════════════
    //                    READ FUNCTIONS
    // ═══════════════════════════════════════════════════════

    function readFeedback(
        uint256 agentId,
        address clientAddress,
        uint64 feedbackIndex
    ) external view returns (
        int128 value,
        uint8 valueDecimals,
        string memory tag1,
        string memory tag2,
        bool isRevoked
    ) {
        Feedback memory fb = feedbacks[agentId][clientAddress][feedbackIndex];
        return (fb.value, fb.valueDecimals, fb.tag1, fb.tag2, fb.isRevoked);
    }

    function getSummary(uint256 agentId) external view returns (
        uint64 count,
        int256 totalScore,
        int256 averageScore
    ) {
        count = totalFeedbackCount[agentId];
        totalScore = cumulativeScore[agentId];
        averageScore = count > 0 ? totalScore / int256(uint256(count)) : int256(0);
    }

    function getClients(uint256 agentId) external view returns (address[] memory) {
        return agentClients[agentId];
    }

    function getLastIndex(uint256 agentId, address clientAddress) external view returns (uint64) {
        return lastIndex[agentId][clientAddress];
    }

    function getIdentityRegistry() external view returns (address) {
        return identityRegistry;
    }
}

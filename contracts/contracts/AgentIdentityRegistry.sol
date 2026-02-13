// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AgentIdentityRegistry
 * @notice ERC-8004 compliant Identity Registry for autonomous AI agents
 * @dev Implements the Identity Registry specification from ERC-8004.
 *      Each agent is an ERC-721 NFT with a URI pointing to the agent's
 *      registration file (capabilities, A2A endpoints, x402 support, etc.)
 *
 * Deployed on SKALE for gasless agent registration and management.
 */
contract AgentIdentityRegistry is ERC721URIStorage, Ownable {
    uint256 private _agentIdCounter;

    // ═══════════════════════════════════════════════════════
    //                     STRUCTS
    // ═══════════════════════════════════════════════════════

    struct AgentInfo {
        string name;
        string agentURI;          // Points to agent registration file (JSON)
        address agentWallet;       // Address for receiving payments
        bool active;
        uint256 registeredAt;
        string[] capabilities;     // Service capabilities
    }

    struct MetadataEntry {
        string metadataKey;
        bytes metadataValue;
    }

    // ═══════════════════════════════════════════════════════
    //                     STORAGE
    // ═══════════════════════════════════════════════════════

    mapping(uint256 => AgentInfo) public agents;
    mapping(uint256 => mapping(string => bytes)) public agentMetadata;
    mapping(address => uint256[]) public ownerAgents;
    
    uint256[] public allAgentIds;

    // ═══════════════════════════════════════════════════════
    //                     EVENTS
    // ═══════════════════════════════════════════════════════

    event AgentRegistered(
        uint256 indexed agentId,
        string name,
        string agentURI,
        address indexed owner,
        string[] capabilities
    );
    
    event AgentURIUpdated(
        uint256 indexed agentId,
        string newURI,
        address indexed updatedBy
    );
    
    event AgentWalletUpdated(
        uint256 indexed agentId,
        address newWallet
    );
    
    event AgentDeactivated(uint256 indexed agentId);
    event AgentActivated(uint256 indexed agentId);
    
    event MetadataSet(
        uint256 indexed agentId,
        string indexed indexedMetadataKey,
        string metadataKey,
        bytes metadataValue
    );

    // ═══════════════════════════════════════════════════════
    //                   CONSTRUCTOR
    // ═══════════════════════════════════════════════════════

    constructor() ERC721("NEXUS Agent Identity", "NEXUS-AGENT") Ownable(msg.sender) {}

    // ═══════════════════════════════════════════════════════
    //                 REGISTRATION
    // ═══════════════════════════════════════════════════════

    /**
     * @notice Register a new agent with full metadata
     * @param name Human-readable agent name
     * @param agentURI URI pointing to the agent registration JSON file
     * @param capabilities Array of capability strings (e.g., "data-analysis", "content-writing")
     * @param metadata Additional key-value metadata entries
     * @return agentId The unique ID of the newly registered agent
     */
    function register(
        string calldata name,
        string calldata agentURI,
        string[] calldata capabilities,
        MetadataEntry[] calldata metadata
    ) external returns (uint256 agentId) {
        _agentIdCounter++;
        agentId = _agentIdCounter;

        _safeMint(msg.sender, agentId);
        _setTokenURI(agentId, agentURI);

        agents[agentId] = AgentInfo({
            name: name,
            agentURI: agentURI,
            agentWallet: msg.sender,
            active: true,
            registeredAt: block.timestamp,
            capabilities: capabilities
        });

        ownerAgents[msg.sender].push(agentId);
        allAgentIds.push(agentId);

        // Set additional metadata
        for (uint256 i = 0; i < metadata.length; i++) {
            agentMetadata[agentId][metadata[i].metadataKey] = metadata[i].metadataValue;
            emit MetadataSet(agentId, metadata[i].metadataKey, metadata[i].metadataKey, metadata[i].metadataValue);
        }

        emit AgentRegistered(agentId, name, agentURI, msg.sender, capabilities);
        return agentId;
    }

    /**
     * @notice Register a minimal agent (URI only)
     */
    function registerMinimal(string calldata agentURI) external returns (uint256 agentId) {
        _agentIdCounter++;
        agentId = _agentIdCounter;

        _safeMint(msg.sender, agentId);
        _setTokenURI(agentId, agentURI);

        string[] memory emptyCaps = new string[](0);
        agents[agentId] = AgentInfo({
            name: "",
            agentURI: agentURI,
            agentWallet: msg.sender,
            active: true,
            registeredAt: block.timestamp,
            capabilities: emptyCaps
        });

        ownerAgents[msg.sender].push(agentId);
        allAgentIds.push(agentId);

        emit AgentRegistered(agentId, "", agentURI, msg.sender, emptyCaps);
        return agentId;
    }

    // ═══════════════════════════════════════════════════════
    //                   MANAGEMENT
    // ═══════════════════════════════════════════════════════

    function setAgentURI(uint256 agentId, string calldata newURI) external {
        require(ownerOf(agentId) == msg.sender, "Not agent owner");
        agents[agentId].agentURI = newURI;
        _setTokenURI(agentId, newURI);
        emit AgentURIUpdated(agentId, newURI, msg.sender);
    }

    function setAgentWallet(uint256 agentId, address newWallet) external {
        require(ownerOf(agentId) == msg.sender, "Not agent owner");
        require(newWallet != address(0), "Invalid wallet");
        agents[agentId].agentWallet = newWallet;
        emit AgentWalletUpdated(agentId, newWallet);
    }

    function setMetadata(uint256 agentId, string calldata key, bytes calldata value) external {
        require(ownerOf(agentId) == msg.sender, "Not agent owner");
        require(keccak256(bytes(key)) != keccak256(bytes("agentWallet")), "Use setAgentWallet");
        agentMetadata[agentId][key] = value;
        emit MetadataSet(agentId, key, key, value);
    }

    function deactivateAgent(uint256 agentId) external {
        require(ownerOf(agentId) == msg.sender, "Not agent owner");
        agents[agentId].active = false;
        emit AgentDeactivated(agentId);
    }

    function activateAgent(uint256 agentId) external {
        require(ownerOf(agentId) == msg.sender, "Not agent owner");
        agents[agentId].active = true;
        emit AgentActivated(agentId);
    }

    // ═══════════════════════════════════════════════════════
    //                    QUERIES
    // ═══════════════════════════════════════════════════════

    function getAgent(uint256 agentId) external view returns (AgentInfo memory) {
        require(_exists(agentId), "Agent does not exist");
        return agents[agentId];
    }

    function getAgentWallet(uint256 agentId) external view returns (address) {
        require(_exists(agentId), "Agent does not exist");
        return agents[agentId].agentWallet;
    }

    function getAgentsByOwner(address owner) external view returns (uint256[] memory) {
        return ownerAgents[owner];
    }

    function getActiveAgents() external view returns (uint256[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < allAgentIds.length; i++) {
            if (agents[allAgentIds[i]].active) count++;
        }
        
        uint256[] memory activeIds = new uint256[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < allAgentIds.length; i++) {
            if (agents[allAgentIds[i]].active) {
                activeIds[idx++] = allAgentIds[i];
            }
        }
        return activeIds;
    }

    function totalAgents() external view returns (uint256) {
        return _agentIdCounter;
    }

    function getMetadata(uint256 agentId, string calldata key) external view returns (bytes memory) {
        return agentMetadata[agentId][key];
    }

    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }
}

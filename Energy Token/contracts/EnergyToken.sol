// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title EnergyToken
 * @notice Tokenized solar energy production shares with automated credit distribution
 * @dev Each token represents a fractional ownership in a solar installation's production
 */
contract EnergyToken is ERC1155, AccessControl, ReentrancyGuard, Pausable {
    
    // Role definitions
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    bytes32 public constant PROJECT_MANAGER_ROLE = keccak256("PROJECT_MANAGER_ROLE");
    
    // Project status enum
    enum ProjectStatus { Pending, Active, Completed, Suspended }
    
    // Project creation parameters struct
    struct ProjectParams {
        string name;
        string location;
        string projectType;
        string projectSubtype;
        uint256 installationSizeKw;
        uint256 estimatedAnnualKwh;
        uint256 totalShares;
        uint256 pricePerShare;
        uint256 projectDuration;
        address projectWallet;
        string documentIPFS;
    }
    
    // Energy project structure (optimized to reduce stack depth)
    struct EnergyProject {
        string name;
        string location;
        uint256 installationSizeKw;       // Installation size in kW
        uint256 estimatedAnnualKwh;       // Estimated annual production
        uint256 totalShares;              // Total number of shares (tokens)
        uint256 sharesSold;               // Shares sold to investors
        uint256 pricePerShare;            // Price in wei per share
        uint256 projectStartDate;         // Unix timestamp
        ProjectStatus status;
        address projectWallet;            // Wallet to receive investment funds
        bool transfersEnabled;            // Allow secondary market transfers
    }
    
    // Additional project metadata (stored separately to avoid stack depth issues)
    struct ProjectMetadata {
        string projectType;               // e.g., "Solar", "Wind", "Hydro", "Geothermal"
        string projectSubtype;            // e.g., "Photovoltaic", "Molten Salt", "Offshore Wind"
        string documentIPFS;              // IPFS hash of binding legal document
        uint256 projectDuration;          // Duration in seconds (e.g., 25 years)
    }
    
    // Production tracking
    struct ProductionRecord {
        uint256 timestamp;
        uint256 kwhProduced;
        uint256 cumulativeKwh;
        string dataSource;                // e.g., "Enphase API", "SolarEdge"
    }
    
    // User investment tracking
    struct Investment {
        uint256 sharesPurchased;
        uint256 totalInvested;
        uint256 purchaseDate;
        uint256 lifetimeKwhEarned;
        uint256 lifetimeCreditsIssued;
    }
    
    // Storage
    mapping(uint256 => EnergyProject) public projects;
    mapping(uint256 => ProjectMetadata) public projectMetadata;
    mapping(uint256 => ProductionRecord[]) public productionHistory;
    mapping(uint256 => uint256) public totalProductionByProject;
    mapping(uint256 => mapping(address => Investment)) public investments;
    mapping(uint256 => mapping(address => uint256)) public claimableCredits;
    mapping(uint256 => string[]) public projectDocuments; // Additional IPFS documents
    
    uint256 public nextProjectId = 1;
    uint256 public platformFeePercent = 250; // 2.5% (basis points)
    address public platformWallet;
    
    // Events
    event ProjectCreated(
        uint256 indexed projectId,
        string name,
        uint256 totalShares,
        uint256 pricePerShare
    );
    
    event SharesPurchased(
        uint256 indexed projectId,
        address indexed investor,
        uint256 shares,
        uint256 totalCost
    );
    
    event ProductionRecorded(
        uint256 indexed projectId,
        uint256 kwhProduced,
        uint256 timestamp,
        string dataSource
    );
    
    event CreditsDistributed(
        uint256 indexed projectId,
        uint256 totalKwh,
        uint256 investorCount
    );
    
    event CreditsClaimed(
        uint256 indexed projectId,
        address indexed investor,
        uint256 kwhAmount
    );
    
    event ProjectStatusChanged(
        uint256 indexed projectId,
        ProjectStatus newStatus
    );
    
    event DocumentUpdated(
        uint256 indexed projectId,
        string documentIPFS,
        string documentType
    );
    
    // Modifiers
    modifier projectExists(uint256 projectId) {
        require(projectId < nextProjectId, "Project does not exist");
        _;
    }
    
    modifier projectActive(uint256 projectId) {
        require(projects[projectId].status == ProjectStatus.Active, "Project not active");
        _;
    }
    
    constructor(address _platformWallet) ERC1155("https://api.greenshare.io/metadata/{id}.json") {
        require(_platformWallet != address(0), "Invalid platform wallet");
        
        platformWallet = _platformWallet;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PROJECT_MANAGER_ROLE, msg.sender);
        _grantRole(ORACLE_ROLE, msg.sender);
    }
    
    /**
     * @notice Create a new energy project
     * @param params Project creation parameters (ProjectParams struct)
     */
    function createProject(ProjectParams calldata params) 
        external 
        onlyRole(PROJECT_MANAGER_ROLE) 
        returns (uint256) 
    {
        require(params.totalShares > 0, "Total shares must be > 0");
        require(params.pricePerShare > 0, "Price must be > 0");
        require(params.projectWallet != address(0), "Invalid project wallet");
        require(bytes(params.projectType).length > 0, "Project type required");
        require(bytes(params.projectSubtype).length > 0, "Project subtype required");
        
        uint256 projectId = nextProjectId++;
        
        // Store core project data
        projects[projectId] = EnergyProject({
            name: params.name,
            location: params.location,
            installationSizeKw: params.installationSizeKw,
            estimatedAnnualKwh: params.estimatedAnnualKwh,
            totalShares: params.totalShares,
            sharesSold: 0,
            pricePerShare: params.pricePerShare,
            projectStartDate: block.timestamp,
            status: ProjectStatus.Active,
            projectWallet: params.projectWallet,
            transfersEnabled: true
        });
        
        // Store metadata separately
        projectMetadata[projectId] = ProjectMetadata({
            projectType: params.projectType,
            projectSubtype: params.projectSubtype,
            documentIPFS: params.documentIPFS,
            projectDuration: params.projectDuration
        });
        
        emit ProjectCreated(projectId, params.name, params.totalShares, params.pricePerShare);
        
        return projectId;
    }
    
    /**
     * @notice Purchase shares in an energy project
     * @param projectId The project to invest in
     * @param shares Number of shares to purchase
     */
    function purchaseShares(uint256 projectId, uint256 shares) 
        external 
        payable 
        nonReentrant
        whenNotPaused
        projectExists(projectId)
        projectActive(projectId)
    {
        EnergyProject storage project = projects[projectId];
        
        require(shares > 0, "Must purchase at least 1 share");
        require(
            project.sharesSold + shares <= project.totalShares,
            "Exceeds available shares"
        );
        
        uint256 totalCost = project.pricePerShare * shares;
        require(msg.value == totalCost, "Incorrect payment amount");
        
        // Calculate platform fee
        uint256 platformFee = (totalCost * platformFeePercent) / 10000;
        uint256 projectAmount = totalCost - platformFee;
        
        // Transfer funds
        (bool successPlatform, ) = platformWallet.call{value: platformFee}("");
        require(successPlatform, "Platform fee transfer failed");
        
        (bool successProject, ) = project.projectWallet.call{value: projectAmount}("");
        require(successProject, "Project payment failed");
        
        // Mint tokens
        _mint(msg.sender, projectId, shares, "");
        
        // Update tracking
        project.sharesSold += shares;
        
        Investment storage inv = investments[projectId][msg.sender];
        inv.sharesPurchased += shares;
        inv.totalInvested += totalCost;
        if (inv.purchaseDate == 0) {
            inv.purchaseDate = block.timestamp;
        }
        
        emit SharesPurchased(projectId, msg.sender, shares, totalCost);
    }
    
    /**
     * @notice Record production data (oracle only)
     * @param projectId The project ID
     * @param kwhProduced Amount of kWh produced
     * @param dataSource Source of the data (e.g., "Enphase API")
     */
    function recordProduction(
        uint256 projectId,
        uint256 kwhProduced,
        string calldata dataSource
    ) 
        external 
        onlyRole(ORACLE_ROLE)
        projectExists(projectId)
    {
        require(kwhProduced > 0, "Production must be > 0");
        
        EnergyProject storage project = projects[projectId];
        require(project.status == ProjectStatus.Active, "Project not active");
        
        totalProductionByProject[projectId] += kwhProduced;
        
        productionHistory[projectId].push(ProductionRecord({
            timestamp: block.timestamp,
            kwhProduced: kwhProduced,
            cumulativeKwh: totalProductionByProject[projectId],
            dataSource: dataSource
        }));
        
        // Distribute credits proportionally
        _distributeCredits(projectId, kwhProduced);
        
        emit ProductionRecorded(projectId, kwhProduced, block.timestamp, dataSource);
    }
    
    /**
     * @notice Internal function to distribute credits to all shareholders
     */
    function _distributeCredits(uint256 projectId, uint256 kwhProduced) internal {
        // Credits are calculated on-demand in getClaimableCredits()
        // This just emits an event for transparency
        emit CreditsDistributed(projectId, kwhProduced, 0);
    }
    
    /**
     * @notice Calculate claimable energy credits for an investor
     * @param projectId The project ID
     * @param investor The investor address
     * @return kwhAvailable Available kWh credits
     */
    function getClaimableCredits(uint256 projectId, address investor) 
        public 
        view 
        projectExists(projectId)
        returns (uint256 kwhAvailable) 
    {
        Investment memory inv = investments[projectId][investor];
        if (inv.sharesPurchased == 0) return 0;
        
        EnergyProject memory project = projects[projectId];
        uint256 totalProduction = totalProductionByProject[projectId];
        
        // Calculate investor's proportional share
        uint256 investorShare = (totalProduction * inv.sharesPurchased) / project.sharesSold;
        
        // Subtract already claimed
        uint256 alreadyClaimed = inv.lifetimeKwhEarned;
        
        if (investorShare > alreadyClaimed) {
            kwhAvailable = investorShare - alreadyClaimed;
        }
        
        return kwhAvailable;
    }
    
    /**
     * @notice Claim available energy credits
     * @param projectId The project ID
     * @dev In production, this would trigger utility bill credit application
     */
    function claimCredits(uint256 projectId) 
        external 
        nonReentrant
        projectExists(projectId)
    {
        uint256 available = getClaimableCredits(projectId, msg.sender);
        require(available > 0, "No credits available");
        
        Investment storage inv = investments[projectId][msg.sender];
        inv.lifetimeKwhEarned += available;
        inv.lifetimeCreditsIssued += available;
        
        emit CreditsClaimed(projectId, msg.sender, available);
        
        // TODO: In production, integrate with utility billing API
    }
    
    /**
     * @notice Get investor's position details
     */
    function getInvestorPosition(uint256 projectId, address investor)
        external
        view
        returns (
            uint256 shares,
            uint256 totalInvested,
            uint256 lifetimeKwh,
            uint256 claimableKwh,
            uint256 estimatedAnnualKwh
        )
    {
        Investment memory inv = investments[projectId][investor];
        EnergyProject memory project = projects[projectId];
        
        shares = inv.sharesPurchased;
        totalInvested = inv.totalInvested;
        lifetimeKwh = inv.lifetimeKwhEarned;
        claimableKwh = getClaimableCredits(projectId, investor);
        estimatedAnnualKwh = (project.estimatedAnnualKwh * shares) / project.totalShares;
    }
    
    /**
     * @notice Get project production statistics
     */
    function getProjectStats(uint256 projectId)
        external
        view
        projectExists(projectId)
        returns (
            uint256 totalProduction,
            uint256 recordCount,
            uint256 averageDaily,
            uint256 lastRecordedTimestamp
        )
    {
        totalProduction = totalProductionByProject[projectId];
        ProductionRecord[] memory records = productionHistory[projectId];
        recordCount = records.length;
        
        if (recordCount > 0) {
            lastRecordedTimestamp = records[recordCount - 1].timestamp;
            
            uint256 projectAge = block.timestamp - projects[projectId].projectStartDate;
            if (projectAge > 0) {
                averageDaily = (totalProduction * 1 days) / projectAge;
            }
        }
    }
    
    /**
     * @notice Update project status
     */
    function updateProjectStatus(uint256 projectId, ProjectStatus newStatus)
        external
        onlyRole(PROJECT_MANAGER_ROLE)
        projectExists(projectId)
    {
        projects[projectId].status = newStatus;
        emit ProjectStatusChanged(projectId, newStatus);
    }
    
    /**
     * @notice Enable/disable secondary market transfers
     */
    function setTransfersEnabled(uint256 projectId, bool enabled)
        external
        onlyRole(PROJECT_MANAGER_ROLE)
        projectExists(projectId)
    {
        projects[projectId].transfersEnabled = enabled;
    }
    
    /**
     * @notice Override transfer to enforce project-specific rules
     */
    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 value,
        bytes memory data
    ) public override {
        require(projects[id].transfersEnabled, "Transfers disabled for this project");
        super.safeTransferFrom(from, to, id, value, data);
        
        // Update investment tracking for new owner
        Investment storage fromInv = investments[id][from];
        Investment storage toInv = investments[id][to];
        
        fromInv.sharesPurchased -= value;
        toInv.sharesPurchased += value;
    }
    
    /**
     * @notice Emergency pause
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }
    
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
    
    /**
     * @notice Update platform fee (max 10%)
     */
    function setPlatformFee(uint256 newFeePercent) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newFeePercent <= 1000, "Fee cannot exceed 10%");
        platformFeePercent = newFeePercent;
    }
    
    /**
     * @notice Update platform wallet
     */
    function setPlatformWallet(address newWallet) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newWallet != address(0), "Invalid wallet address");
        platformWallet = newWallet;
    }
    
    /**
     * @notice Update the primary IPFS document for a project
     * @param projectId The project ID
     * @param documentIPFS New IPFS hash
     */
    function updateProjectDocument(
        uint256 projectId,
        string calldata documentIPFS
    )
        external
        onlyRole(PROJECT_MANAGER_ROLE)
        projectExists(projectId)
    {
        require(bytes(documentIPFS).length > 0, "Invalid IPFS hash");
        projectMetadata[projectId].documentIPFS = documentIPFS;
        emit DocumentUpdated(projectId, documentIPFS, "primary");
    }
    
    /**
     * @notice Add additional IPFS document to project
     * @param projectId The project ID
     * @param documentIPFS IPFS hash of additional document
     */
    function addProjectDocument(
        uint256 projectId,
        string calldata documentIPFS
    )
        external
        onlyRole(PROJECT_MANAGER_ROLE)
        projectExists(projectId)
    {
        require(bytes(documentIPFS).length > 0, "Invalid IPFS hash");
        projectDocuments[projectId].push(documentIPFS);
        emit DocumentUpdated(projectId, documentIPFS, "additional");
    }
    
    /**
     * @notice Get all additional documents for a project
     * @param projectId The project ID
     * @return Array of IPFS hashes
     */
    function getProjectDocuments(uint256 projectId)
        external
        view
        projectExists(projectId)
        returns (string[] memory)
    {
        return projectDocuments[projectId];
    }
    
    /**
     * @notice Get project document URI (primary IPFS document)
     * @param projectId The project ID
     * @return Full IPFS URI
     */
    function getProjectDocumentURI(uint256 projectId)
        external
        view
        projectExists(projectId)
        returns (string memory)
    {
        string memory ipfsHash = projectMetadata[projectId].documentIPFS;
        if (bytes(ipfsHash).length == 0) {
            return "";
        }
        return string(abi.encodePacked("ipfs://", ipfsHash));
    }
    
    // Required overrides
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

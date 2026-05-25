// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract FreelanceEscrow is ReentrancyGuard {
    enum ProjectState { Created, Bidding, Active, InReview, Disputed, Resolved, Completed, Refunded }

    struct Project {
        uint256 id;
        address buyer;
        address seller;
        uint256 budget;
        ProjectState state;
        string projectHash; // IPFS/DB reference for project details
        string evidenceHash; // IPFS/DB reference for submitted work
    }

    address public admin;
    uint256 public projectCount;
    mapping(uint256 => Project) public projects;
    
    // Configurable timeout
    uint256 public constant ANTI_STALL_TIMEOUT = 7 days;
    mapping(uint256 => uint256) public submissionTimestamps;

    event ProjectCreated(uint256 indexed projectId, address indexed buyer, uint256 budget, string projectHash);
    event SellerAssigned(uint256 indexed projectId, address indexed seller);
    event EscrowFunded(uint256 indexed projectId);
    event WorkSubmitted(uint256 indexed projectId, string evidenceHash);
    event ProjectApproved(uint256 indexed projectId);
    event DisputeRaised(uint256 indexed projectId, address indexed raisedBy);
    event DisputeResolved(uint256 indexed projectId, address indexed winner);

    constructor() {
        admin = msg.sender;
    }

    modifier onlyBuyer(uint256 _projectId) {
        require(msg.sender == projects[_projectId].buyer, "Only buyer can call this");
        _;
    }

    modifier onlySeller(uint256 _projectId) {
        require(msg.sender == projects[_projectId].seller, "Only seller can call this");
        _;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this");
        _;
    }

    function createProject(string memory _projectHash, address _seller) external payable {
        require(msg.value > 0, "Budget must be greater than 0");
        
        projectCount++;
        uint256 projectId = projectCount;

        projects[projectId] = Project({
            id: projectId,
            buyer: msg.sender,
            seller: _seller,
            budget: msg.value,
            state: ProjectState.Active,
            projectHash: _projectHash,
            evidenceHash: ""
        });

        emit ProjectCreated(projectId, msg.sender, msg.value, _projectHash);
        if (_seller != address(0)) {
            emit SellerAssigned(projectId, _seller);
        }
        emit EscrowFunded(projectId);
    }

    function submitWork(uint256 _projectId, string memory _evidenceHash) external onlySeller(_projectId) {
        Project storage project = projects[_projectId];
        require(project.state == ProjectState.Active, "Project is not active");

        project.state = ProjectState.InReview;
        project.evidenceHash = _evidenceHash;
        submissionTimestamps[_projectId] = block.timestamp;

        emit WorkSubmitted(_projectId, _evidenceHash);
    }

    function approveWork(uint256 _projectId) external onlyBuyer(_projectId) nonReentrant {
        Project storage project = projects[_projectId];
        require(project.state == ProjectState.InReview, "Project is not in review");

        project.state = ProjectState.Completed;
        
        // Pull payment pattern is generally better, but for MVP direct transfer is ok if protected by reentrancy guard
        (bool success, ) = payable(project.seller).call{value: project.budget}("");
        require(success, "Transfer to seller failed");

        emit ProjectApproved(_projectId);
    }

    function raiseDispute(uint256 _projectId) external {
        Project storage project = projects[_projectId];
        require(
            msg.sender == project.buyer || msg.sender == project.seller,
            "Only buyer or seller can dispute"
        );
        require(project.state == ProjectState.InReview, "Can only dispute when in review");

        project.state = ProjectState.Disputed;
        emit DisputeRaised(_projectId, msg.sender);
    }

    function triggerAntiStall(uint256 _projectId) external onlySeller(_projectId) {
        Project storage project = projects[_projectId];
        require(project.state == ProjectState.InReview, "Not in review");
        require(block.timestamp > submissionTimestamps[_projectId] + ANTI_STALL_TIMEOUT, "Timeout not reached");

        // Automatically escalate to disputed if buyer ignores
        project.state = ProjectState.Disputed;
        emit DisputeRaised(_projectId, msg.sender);
    }

    function resolveDispute(uint256 _projectId, bool _sellerWins) external onlyAdmin nonReentrant {
        Project storage project = projects[_projectId];
        require(project.state == ProjectState.Disputed, "Project not disputed");

        project.state = ProjectState.Resolved;

        if (_sellerWins) {
            (bool success, ) = payable(project.seller).call{value: project.budget}("");
            require(success, "Transfer to seller failed");
            emit DisputeResolved(_projectId, project.seller);
        } else {
            (bool success, ) = payable(project.buyer).call{value: project.budget}("");
            require(success, "Refund to buyer failed");
            emit DisputeResolved(_projectId, project.buyer);
        }
    }
}

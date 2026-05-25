const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FreelanceEscrow", function () {
  let Escrow;
  let escrow;
  let admin, buyer, seller, other;
  
  beforeEach(async function () {
    [admin, buyer, seller, other] = await ethers.getSigners();
    Escrow = await ethers.getContractFactory("FreelanceEscrow");
    escrow = await Escrow.deploy();
  });

  describe("Core Escrow Flow", function () {
    it("Should create a project and lock funds", async function () {
      const budget = ethers.parseEther("1.0");
      
      await expect(escrow.connect(buyer).createProject("ipfs://project_desc", seller.address, { value: budget }))
        .to.emit(escrow, "ProjectCreated")
        .withArgs(1, buyer.address, budget, "ipfs://project_desc")
        .to.emit(escrow, "EscrowFunded")
        .withArgs(1);

      const project = await escrow.projects(1);
      expect(project.buyer).to.equal(buyer.address);
      expect(project.seller).to.equal(seller.address);
      expect(project.budget).to.equal(budget);
      expect(project.state).to.equal(2); // Active
    });

    it("Should allow seller to submit work", async function () {
      const budget = ethers.parseEther("1.0");
      await escrow.connect(buyer).createProject("ipfs://desc", seller.address, { value: budget });

      await expect(escrow.connect(seller).submitWork(1, "ipfs://evidence"))
        .to.emit(escrow, "WorkSubmitted")
        .withArgs(1, "ipfs://evidence");

      const project = await escrow.projects(1);
      expect(project.state).to.equal(3); // InReview
      expect(project.evidenceHash).to.equal("ipfs://evidence");
    });

    it("Should allow buyer to approve work and release funds", async function () {
      const budget = ethers.parseEther("1.0");
      await escrow.connect(buyer).createProject("ipfs://desc", seller.address, { value: budget });
      await escrow.connect(seller).submitWork(1, "ipfs://evidence");

      const initialBalance = await ethers.provider.getBalance(seller.address);

      await expect(escrow.connect(buyer).approveWork(1))
        .to.emit(escrow, "ProjectApproved")
        .withArgs(1);

      const project = await escrow.projects(1);
      expect(project.state).to.equal(6); // Completed

      const finalBalance = await ethers.provider.getBalance(seller.address);
      expect(finalBalance - initialBalance).to.equal(budget);
    });

    it("Should allow admin to resolve dispute in favor of seller", async function () {
      const budget = ethers.parseEther("1.0");
      await escrow.connect(buyer).createProject("ipfs://desc", seller.address, { value: budget });
      await escrow.connect(seller).submitWork(1, "ipfs://evidence");
      
      // Raise dispute
      await escrow.connect(buyer).raiseDispute(1);

      const initialBalance = await ethers.provider.getBalance(seller.address);

      // Resolve in favor of seller
      await expect(escrow.connect(admin).resolveDispute(1, true))
        .to.emit(escrow, "DisputeResolved")
        .withArgs(1, seller.address);

      const finalBalance = await ethers.provider.getBalance(seller.address);
      expect(finalBalance - initialBalance).to.equal(budget);
    });
  });
});

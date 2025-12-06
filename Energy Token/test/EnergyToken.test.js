const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("EnergyToken", function () {
  // Fixture to deploy contract and set up test environment
  async function deployEnergyTokenFixture() {
    const [owner, platformWallet, projectWallet, investor1, investor2, oracle] =
      await ethers.getSigners();

    const EnergyToken = await ethers.getContractFactory("EnergyToken");
    const energyToken = await EnergyToken.deploy(platformWallet.address);

    // Grant oracle role
    const ORACLE_ROLE = await energyToken.ORACLE_ROLE();
    await energyToken.grantRole(ORACLE_ROLE, oracle.address);

    return {
      energyToken,
      owner,
      platformWallet,
      projectWallet,
      investor1,
      investor2,
      oracle,
      ORACLE_ROLE,
    };
  }

  describe("Deployment", function () {
    it("Should set the correct platform wallet", async function () {
      const { energyToken, platformWallet } = await loadFixture(
        deployEnergyTokenFixture
      );
      expect(await energyToken.platformWallet()).to.equal(
        platformWallet.address
      );
    });

    it("Should grant admin roles to deployer", async function () {
      const { energyToken, owner } = await loadFixture(
        deployEnergyTokenFixture
      );
      const DEFAULT_ADMIN_ROLE = await energyToken.DEFAULT_ADMIN_ROLE();
      const PROJECT_MANAGER_ROLE = await energyToken.PROJECT_MANAGER_ROLE();

      expect(await energyToken.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be
        .true;
      expect(await energyToken.hasRole(PROJECT_MANAGER_ROLE, owner.address)).to
        .be.true;
    });

    it("Should set platform fee to 2.5%", async function () {
      const { energyToken } = await loadFixture(deployEnergyTokenFixture);
      expect(await energyToken.platformFeePercent()).to.equal(250);
    });
  });

  describe("Project Creation", function () {
    it("Should create a project successfully", async function () {
      const { energyToken, projectWallet } = await loadFixture(
        deployEnergyTokenFixture
      );

      await expect(
        energyToken.createProject({
          name: "Austin Solar Farm",
          location: "Austin, TX",
          projectType: "Solar",
          projectSubtype: "Photovoltaic",
          installationSizeKw: 500,
          estimatedAnnualKwh: 650000,
          totalShares: 10000,
          pricePerShare: ethers.parseEther("0.01"),
          projectDuration: 788400000,
          projectWallet: projectWallet.address,
          documentIPFS: "QmTest123",
        })
      )
        .to.emit(energyToken, "ProjectCreated")
        .withArgs(1, "Austin Solar Farm", 10000, ethers.parseEther("0.01"));

      const project = await energyToken.projects(1);
      const metadata = await energyToken.projectMetadata(1);
      expect(project.name).to.equal("Austin Solar Farm");
      expect(project.location).to.equal("Austin, TX");
      expect(project.totalShares).to.equal(10000);
      expect(project.sharesSold).to.equal(0);
      expect(metadata.projectType).to.equal("Solar");
      expect(metadata.projectSubtype).to.equal("Photovoltaic");
    });

    it("Should increment project ID", async function () {
      const { energyToken, projectWallet } = await loadFixture(
        deployEnergyTokenFixture
      );

      expect(await energyToken.nextProjectId()).to.equal(1);

      await energyToken.createProject({
        name: "Project 2",
        location: "Location 2",
        projectType: "Wind",
        projectSubtype: "Offshore",
        installationSizeKw: 100,
        estimatedAnnualKwh: 100000,
        totalShares: 1000,
        pricePerShare: ethers.parseEther("0.01"),
        projectDuration: 788400000,
        projectWallet: projectWallet.address,
        documentIPFS: "QmTest456",
      });

      expect(await energyToken.nextProjectId()).to.equal(2);

      await energyToken.createProject({
        name: "Project 3",
        location: "Location 3",
        projectType: "Hydro",
        projectSubtype: "Tidal",
        installationSizeKw: 200,
        estimatedAnnualKwh: 200000,
        totalShares: 2000,
        pricePerShare: ethers.parseEther("0.02"),
        projectDuration: 788400000,
        projectWallet: projectWallet.address,
        documentIPFS: "QmTest789",
      });

      expect(await energyToken.nextProjectId()).to.equal(3);
    });

    it("Should reject creation with invalid parameters", async function () {
      const { energyToken, projectWallet } = await loadFixture(
        deployEnergyTokenFixture
      );

      await expect(
        energyToken.createProject({
          name: "Test",
          location: "Location",
          projectType: "Solar",
          projectSubtype: "Photovoltaic",
          installationSizeKw: 100,
          estimatedAnnualKwh: 100000,
          totalShares: 0,
          pricePerShare: ethers.parseEther("0.01"),
          projectDuration: 788400000,
          projectWallet: projectWallet.address,
          documentIPFS: "QmTest",
        })
      ).to.be.revertedWith("Total shares must be > 0");

      await expect(
        energyToken.createProject({
          name: "Test",
          location: "Location",
          projectType: "Solar",
          projectSubtype: "Photovoltaic",
          installationSizeKw: 100,
          estimatedAnnualKwh: 100000,
          totalShares: 1000,
          pricePerShare: 0,
          projectDuration: 788400000,
          projectWallet: projectWallet.address,
          documentIPFS: "QmTest",
        })
      ).to.be.revertedWith("Price must be > 0");

      await expect(
        energyToken.createProject({
          name: "Test",
          location: "Location",
          projectType: "Solar",
          projectSubtype: "Photovoltaic",
          installationSizeKw: 100,
          estimatedAnnualKwh: 100000,
          totalShares: 1000,
          pricePerShare: ethers.parseEther("0.01"),
          projectDuration: 788400000,
          projectWallet: ethers.ZeroAddress,
          documentIPFS: "QmTest",
        })
      ).to.be.revertedWith("Invalid project wallet");
    });

    it("Should only allow project managers to create projects", async function () {
      const { energyToken, investor1, projectWallet } = await loadFixture(
        deployEnergyTokenFixture
      );

      await expect(
        energyToken.connect(investor1).createProject({
          name: "Test",
          location: "Location",
          projectType: "Solar",
          projectSubtype: "Photovoltaic",
          installationSizeKw: 100,
          estimatedAnnualKwh: 100000,
          totalShares: 1000,
          pricePerShare: ethers.parseEther("0.01"),
          projectDuration: 788400000,
          projectWallet: projectWallet.address,
          documentIPFS: "QmTest",
        })
      ).to.be.reverted;
    });
  });

  describe("Share Purchase", function () {
    async function createProjectFixture() {
      const fixture = await loadFixture(deployEnergyTokenFixture);

      await fixture.energyToken.createProject({
        name: "Test Project",
        location: "Test Location",
        projectType: "Solar",
        projectSubtype: "Photovoltaic",
        installationSizeKw: 500,
        estimatedAnnualKwh: 650000,
        totalShares: 10000,
        pricePerShare: ethers.parseEther("0.01"),
        projectDuration: 788400000,
        projectWallet: fixture.projectWallet.address,
        documentIPFS: "QmTest123",
      });

      return fixture;
    }

    it("Should allow purchasing shares", async function () {
      const { energyToken, investor1, projectWallet, platformWallet } =
        await createProjectFixture();

      const sharePrice = ethers.parseEther("0.01");
      const shares = 100n;
      const totalCost = sharePrice * shares;

      const platformBalanceBefore = await ethers.provider.getBalance(
        platformWallet.address
      );
      const projectBalanceBefore = await ethers.provider.getBalance(
        projectWallet.address
      );

      await expect(
        energyToken
          .connect(investor1)
          .purchaseShares(1, shares, { value: totalCost })
      )
        .to.emit(energyToken, "SharesPurchased")
        .withArgs(1, investor1.address, shares, totalCost);

      // Log token viewing information
      const contractAddress = await energyToken.getAddress();
      console.log("\n🎉 Token successfully purchased on LOCAL TEST NETWORK!");
      console.log(
        "⚠️  This is a temporary test blockchain - tokens will disappear after tests"
      );
      console.log("\n📍 To view REAL tokens on Dione Testnet:");
      console.log(
        "   1. Deploy: npx hardhat run scripts/deploy.js --network dione_testnet"
      );
      console.log(
        "   2. Then visit: https://testnet-explorer.dioneprotocol.com/address/[CONTRACT_ADDRESS]"
      );
      console.log(`\nTest Details:`);
      console.log(`   Local Contract: ${contractAddress}`);
      console.log(`   Token ID: 1`);
      console.log(`   Owner: ${investor1.address}`);
      console.log(`   Balance: ${shares} shares\n`);

      // Verify token balance
      expect(await energyToken.balanceOf(investor1.address, 1)).to.equal(
        shares
      );

      // Verify shares sold updated
      const project = await energyToken.projects(1);
      expect(project.sharesSold).to.equal(shares);

      // Verify platform fee (2.5%)
      const expectedFee = (totalCost * 250n) / 10000n;
      const expectedProject = totalCost - expectedFee;

      const platformBalanceAfter = await ethers.provider.getBalance(
        platformWallet.address
      );
      const projectBalanceAfter = await ethers.provider.getBalance(
        projectWallet.address
      );

      expect(platformBalanceAfter - platformBalanceBefore).to.equal(
        expectedFee
      );
      expect(projectBalanceAfter - projectBalanceBefore).to.equal(
        expectedProject
      );
    });

    it("Should track investment details", async function () {
      const { energyToken, investor1 } = await createProjectFixture();

      const sharePrice = ethers.parseEther("0.01");
      const shares = 100n;
      const totalCost = sharePrice * shares;

      await energyToken
        .connect(investor1)
        .purchaseShares(1, shares, { value: totalCost });

      const investment = await energyToken.investments(1, investor1.address);
      expect(investment.sharesPurchased).to.equal(shares);
      expect(investment.totalInvested).to.equal(totalCost);
      expect(investment.purchaseDate).to.be.greaterThan(0);
    });

    it("Should reject incorrect payment", async function () {
      const { energyToken, investor1 } = await createProjectFixture();

      await expect(
        energyToken.connect(investor1).purchaseShares(1, 100, {
          value: ethers.parseEther("0.5"), // Wrong amount
        })
      ).to.be.revertedWith("Incorrect payment amount");
    });

    it("Should reject exceeding available shares", async function () {
      const { energyToken, investor1 } = await createProjectFixture();

      const sharePrice = ethers.parseEther("0.01");
      const shares = 15000n; // More than 10000 total

      await expect(
        energyToken.connect(investor1).purchaseShares(1, shares, {
          value: sharePrice * shares,
        })
      ).to.be.revertedWith("Exceeds available shares");
    });

    it("Should support multiple investors", async function () {
      const { energyToken, investor1, investor2 } =
        await createProjectFixture();

      const sharePrice = ethers.parseEther("0.01");

      await energyToken
        .connect(investor1)
        .purchaseShares(1, 100, { value: sharePrice * 100n });
      await energyToken
        .connect(investor2)
        .purchaseShares(1, 200, { value: sharePrice * 200n });

      expect(await energyToken.balanceOf(investor1.address, 1)).to.equal(100);
      expect(await energyToken.balanceOf(investor2.address, 1)).to.equal(200);

      const project = await energyToken.projects(1);
      expect(project.sharesSold).to.equal(300);
    });
  });

  describe("Production Recording", function () {
    async function projectWithInvestorsFixture() {
      const fixture = await loadFixture(deployEnergyTokenFixture);

      await fixture.energyToken.createProject({
        name: "Test Project",
        location: "Location",
        projectType: "Solar",
        projectSubtype: "Photovoltaic",
        installationSizeKw: 500,
        estimatedAnnualKwh: 650000,
        totalShares: 10000,
        pricePerShare: ethers.parseEther("0.01"),
        projectDuration: 788400000,
        projectWallet: fixture.projectWallet.address,
        documentIPFS: "QmTest123",
      });

      const sharePrice = ethers.parseEther("0.01");
      await fixture.energyToken
        .connect(fixture.investor1)
        .purchaseShares(1, 100, { value: sharePrice * 100n });
      await fixture.energyToken
        .connect(fixture.investor2)
        .purchaseShares(1, 100, { value: sharePrice * 100n });

      return fixture;
    }

    it("Should record production data", async function () {
      const { energyToken, oracle } = await projectWithInvestorsFixture();

      await expect(
        energyToken.connect(oracle).recordProduction(1, 500, "Enphase API")
      )
        .to.emit(energyToken, "ProductionRecorded")
        .withArgs(
          1,
          500,
          await ethers.provider.getBlock("latest").then((b) => b.timestamp + 1),
          "Enphase API"
        );

      expect(await energyToken.totalProductionByProject(1)).to.equal(500);
    });

    it("Should accumulate production over time", async function () {
      const { energyToken, oracle } = await projectWithInvestorsFixture();

      await energyToken.connect(oracle).recordProduction(1, 500, "Day 1");
      await energyToken.connect(oracle).recordProduction(1, 600, "Day 2");
      await energyToken.connect(oracle).recordProduction(1, 450, "Day 3");

      expect(await energyToken.totalProductionByProject(1)).to.equal(1550);
    });

    it("Should only allow oracle to record production", async function () {
      const { energyToken, investor1 } = await projectWithInvestorsFixture();

      await expect(
        energyToken.connect(investor1).recordProduction(1, 500, "Fake")
      ).to.be.reverted;
    });

    it("Should reject zero production", async function () {
      const { energyToken, oracle } = await projectWithInvestorsFixture();

      await expect(
        energyToken.connect(oracle).recordProduction(1, 0, "Test")
      ).to.be.revertedWith("Production must be > 0");
    });
  });

  describe("Credit Distribution", function () {
    async function projectWithProductionFixture() {
      const fixture = await loadFixture(deployEnergyTokenFixture);

      await fixture.energyToken.createProject({
        name: "Test Project",
        location: "Location",
        projectType: "Solar",
        projectSubtype: "Photovoltaic",
        installationSizeKw: 500,
        estimatedAnnualKwh: 650000,
        totalShares: 10000,
        pricePerShare: ethers.parseEther("0.01"),
        projectDuration: 788400000,
        projectWallet: fixture.projectWallet.address,
        documentIPFS: "QmTest123",
      });

      const sharePrice = ethers.parseEther("0.01");
      await fixture.energyToken
        .connect(fixture.investor1)
        .purchaseShares(1, 100, { value: sharePrice * 100n });
      await fixture.energyToken
        .connect(fixture.investor2)
        .purchaseShares(1, 100, { value: sharePrice * 100n });

      await fixture.energyToken
        .connect(fixture.oracle)
        .recordProduction(1, 1000, "Test");

      return fixture;
    }

    it("Should calculate claimable credits correctly", async function () {
      const { energyToken, investor1, investor2 } =
        await projectWithProductionFixture();

      // Both investors have 100 shares each (200 total)
      // Total production: 1000 kWh
      // Each should get 500 kWh
      expect(
        await energyToken.getClaimableCredits(1, investor1.address)
      ).to.equal(500);
      expect(
        await energyToken.getClaimableCredits(1, investor2.address)
      ).to.equal(500);
    });

    it("Should allow claiming credits", async function () {
      const { energyToken, investor1 } = await projectWithProductionFixture();

      await expect(energyToken.connect(investor1).claimCredits(1))
        .to.emit(energyToken, "CreditsClaimed")
        .withArgs(1, investor1.address, 500);

      const investment = await energyToken.investments(1, investor1.address);
      expect(investment.lifetimeKwhEarned).to.equal(500);
    });

    it("Should prevent double claiming", async function () {
      const { energyToken, investor1 } = await projectWithProductionFixture();

      await energyToken.connect(investor1).claimCredits(1);

      // No new production, so no credits available
      await expect(
        energyToken.connect(investor1).claimCredits(1)
      ).to.be.revertedWith("No credits available");
    });

    it("Should distribute new production correctly after claim", async function () {
      const { energyToken, investor1, oracle } =
        await projectWithProductionFixture();

      await energyToken.connect(investor1).claimCredits(1);

      // Record more production
      await energyToken
        .connect(oracle)
        .recordProduction(1, 2000, "New production");

      // Investor1 should have 1000 new kWh (half of 2000)
      expect(
        await energyToken.getClaimableCredits(1, investor1.address)
      ).to.equal(1000);
    });

    it("Should handle proportional distribution with unequal shares", async function () {
      const fixture = await loadFixture(deployEnergyTokenFixture);

      await fixture.energyToken.createProject({
        name: "Test Project",
        location: "Location",
        projectType: "Solar",
        projectSubtype: "Photovoltaic",
        installationSizeKw: 500,
        estimatedAnnualKwh: 650000,
        totalShares: 10000,
        pricePerShare: ethers.parseEther("0.01"),
        projectDuration: 788400000,
        projectWallet: fixture.projectWallet.address,
        documentIPFS: "QmTest123",
      });

      const sharePrice = ethers.parseEther("0.01");
      await fixture.energyToken
        .connect(fixture.investor1)
        .purchaseShares(1, 300, { value: sharePrice * 300n });
      await fixture.energyToken
        .connect(fixture.investor2)
        .purchaseShares(1, 100, { value: sharePrice * 100n });

      await fixture.energyToken
        .connect(fixture.oracle)
        .recordProduction(1, 4000, "Test");

      // investor1: 300/400 = 75% = 3000 kWh
      // investor2: 100/400 = 25% = 1000 kWh
      expect(
        await fixture.energyToken.getClaimableCredits(
          1,
          fixture.investor1.address
        )
      ).to.equal(3000);
      expect(
        await fixture.energyToken.getClaimableCredits(
          1,
          fixture.investor2.address
        )
      ).to.equal(1000);
    });
  });

  describe("Investor Position", function () {
    async function investorPositionFixture() {
      const fixture = await loadFixture(deployEnergyTokenFixture);

      await fixture.energyToken.createProject({
        name: "Test Project",
        location: "Location",
        projectType: "Solar",
        projectSubtype: "Photovoltaic",
        installationSizeKw: 500,
        estimatedAnnualKwh: 650000,
        totalShares: 10000,
        pricePerShare: ethers.parseEther("0.01"),
        projectDuration: 788400000,
        projectWallet: fixture.projectWallet.address,
        documentIPFS: "QmTest123",
      });

      const sharePrice = ethers.parseEther("0.01");
      await fixture.energyToken
        .connect(fixture.investor1)
        .purchaseShares(1, 100, { value: sharePrice * 100n });
      await fixture.energyToken
        .connect(fixture.oracle)
        .recordProduction(1, 1000, "Test");

      return fixture;
    }

    it("Should return correct investor position", async function () {
      const { energyToken, investor1 } = await investorPositionFixture();

      const position = await energyToken.getInvestorPosition(
        1,
        investor1.address
      );

      expect(position.shares).to.equal(100);
      expect(position.totalInvested).to.equal(ethers.parseEther("1"));
      expect(position.lifetimeKwh).to.equal(0); // Not claimed yet
      expect(position.claimableKwh).to.equal(1000);
      expect(position.estimatedAnnualKwh).to.equal(6500); // 65 kWh/share * 100 shares
    });
  });

  describe("Project Stats", function () {
    it("Should return accurate project statistics", async function () {
      const fixture = await loadFixture(deployEnergyTokenFixture);

      await fixture.energyToken.createProject({
        name: "Test Project",
        location: "Location",
        projectType: "Solar",
        projectSubtype: "Photovoltaic",
        installationSizeKw: 500,
        estimatedAnnualKwh: 650000,
        totalShares: 10000,
        pricePerShare: ethers.parseEther("0.01"),
        projectDuration: 788400000,
        projectWallet: fixture.projectWallet.address,
        documentIPFS: "QmTest123",
      });

      await fixture.energyToken
        .connect(fixture.oracle)
        .recordProduction(1, 500, "Day 1");
      await fixture.energyToken
        .connect(fixture.oracle)
        .recordProduction(1, 600, "Day 2");

      const stats = await fixture.energyToken.getProjectStats(1);

      expect(stats.totalProduction).to.equal(1100);
      expect(stats.recordCount).to.equal(2);
      expect(stats.lastRecordedTimestamp).to.be.greaterThan(0);
    });
  });

  describe("Admin Functions", function () {
    it("Should allow admin to update platform fee", async function () {
      const { energyToken, owner } = await loadFixture(
        deployEnergyTokenFixture
      );

      await energyToken.connect(owner).setPlatformFee(500); // 5%
      expect(await energyToken.platformFeePercent()).to.equal(500);
    });

    it("Should reject platform fee above 10%", async function () {
      const { energyToken, owner } = await loadFixture(
        deployEnergyTokenFixture
      );

      await expect(
        energyToken.connect(owner).setPlatformFee(1001)
      ).to.be.revertedWith("Fee cannot exceed 10%");
    });

    it("Should allow pausing and unpausing", async function () {
      const { energyToken, owner, investor1 } = await loadFixture(
        deployEnergyTokenFixture
      );

      await energyToken.createProject({
        name: "Test Project",
        location: "Location",
        projectType: "Solar",
        projectSubtype: "Photovoltaic",
        installationSizeKw: 500,
        estimatedAnnualKwh: 650000,
        totalShares: 10000,
        pricePerShare: ethers.parseEther("0.01"),
        projectDuration: 788400000,
        projectWallet: owner.address,
        documentIPFS: "QmTest123",
      });

      await energyToken.connect(owner).pause();

      await expect(
        energyToken.connect(investor1).purchaseShares(1, 100, {
          value: ethers.parseEther("1"),
        })
      ).to.be.reverted;

      await energyToken.connect(owner).unpause();

      await energyToken.connect(investor1).purchaseShares(1, 100, {
        value: ethers.parseEther("1"),
      });

      expect(await energyToken.balanceOf(investor1.address, 1)).to.equal(100);
    });
  });
});

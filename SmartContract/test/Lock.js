const { expect } = require("chai");
const { ethers } = require("hardhat");
const hre = require("hardhat");

describe("Projects", function () {

  let Projects;
  let TokenDistribution;
  let accounts;
  let changes;

  const changeProposalName = "changeProposalOne"
  const ProjectName = "ProjectOne"

  beforeEach(async function () {
    changes = hre.ethers.deployContract("Changes")
    const changes = m.contract("ChangesLibrary", []);
    const token = m.contract("ProjectsToken", []);

    const tokenDistribution = m.contract("TokenDistribution", [token], {
      libraries: {
        ChangesLibrary: changes
      }
    });
    accounts = await ethers.getSigners();
  });

  it("should create a new project without errors", async () => {
    await Projects.createProject("BaseChange", ProjectName, { from: accounts[0].address });
    const resultChanges = await Projects.getChangesOrProposals(ProjectName, true);
    console.log(resultChanges)
  });

  it("should make a change proposal without errors", async () => {
    await Projects.MakeChangeProposal(changeProposalName, ProjectName, { from: accounts[0].address });
  });

  it("should get an error already voted for change proposal", async () => {
    await expect(
      Projects.voteForChangeProposal(changeProposalName, ProjectName, { from: accounts[0].address })
    ).to.be.revertedWith("Already voted");
  });

  it("should make a change proposal from other account and vote for it from the main account with no errors", async () => {
    await Projects.MakeChangeProposal(changeProposalName + "1", ProjectName, { from: accounts[1].address });
    await Projects.voteForChangeProposal(changeProposalName + "1", ProjectName, { from: accounts[0].address });
  });

  it("should accept the last change proposal with no errors", async () => {
    await Projects.acceptChangeProposal(changeProposalName + "1", ProjectName, { from: accounts[1].address });
  });

  it("should get project changes with no errors", async () => {
    await Projects.createProject("BaseChange", ProjectName, { from: accounts[0].address });
    const resultChanges = await Projects.getChangesOrProposals(ProjectName, true);
    const resultChangeProposals = await Projects.getChangesOrProposals(ProjectName, false);
    console.log(resultChanges);
    console.log(resultChangeProposals);
    expect(resultChanges.length).to.equal(2);
    expect(resultChangeProposals.length).to.equal(1);
  });
});

describe("Distribution", function () {

  let Projects;
  let TokenDistribution;
  let accounts;

  const ProjectName = "ProjectOne"
  const changeProposalName = "changeProposalOne"

  beforeEach(async function () {
    TokenDistribution = await ethers.getContractFactory("TokenDistribution");
    Projects = await TokenDistribution.deploy();
    await Projects.deployed();
    accounts = await ethers.getSigners();
  });

  it("should start new project", async () => {
    await Projects.createProject("BaseChange", ProjectName, { from: accounts[0].address });
  });

  it("should get distribution balance with no errors", async () => {
    await Projects.getDistributionBalanceOf(accounts[0].address, ProjectName);
  });

  it("should make distribution to two users with no errors", async () => {
    await Projects.MakeChangeProposal(changeProposalName + "1", ProjectName, { from: accounts[1].address });
    await Projects.voteForChangeProposal(changeProposalName + "1", ProjectName, { from: accounts[0].address });
    await Projects.acceptChangeProposal(changeProposalName + "1", ProjectName, { from: accounts[1].address });
    await Projects.distribute([accounts[1].address, accounts[0].address], [30, 10], ProjectName, { from: accounts[0].address });
  });

  it("should claim tokens after distribution ends", async () => {
    await Projects.createProject("BaseChange", ProjectName, { from: accounts[0].address });
    await Projects.startDistribution(ProjectName);
    await Projects.claimPendingTokens(ProjectName, { from: accounts[1].address });
    await Projects.claimPendingTokens(ProjectName, { from: accounts[2].address });

    const one = await Projects.getDistributionBalanceOf(accounts[1].address, ProjectName);
    const two = await Projects.getDistributionBalanceOf(accounts[0].address, ProjectName);
    const three = await Projects.getDistributionBalanceOf(accounts[2].address, ProjectName);

    const one_1 = await Projects.getBalance(accounts[1].address, ProjectName);
    const two_1 = await Projects.getBalance(accounts[0].address, ProjectName);
    const three_1 = await Projects.getBalance(accounts[2].address, ProjectName);

    console.log(one.toNumber(), two.toNumber(), three.toNumber())
    console.log(one_1.toNumber(), two_1.toNumber(), three_1.toNumber())
  });
});

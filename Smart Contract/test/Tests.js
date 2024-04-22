const Projects = artifacts.require("./Projects.sol");
const TokenDistribution = artifacts.require("./TokenDistribution.sol");
const { expectRevert, time } = require("@openzeppelin/test-helpers");

contract("Projects", accounts => {

  const changeProposalName = "changeProposalOne"
  const ProjectName = "ProjectOne"

  it("should create a new project without errors", async () => {
    const Projects = await TokenDistribution.deployed();
    await Projects.createProject("BaseChange", ProjectName, { from: accounts[0] });
    const resultChanges = await Projects.getChangesOrProposals(ProjectName, true , { from: accounts[0] });
    console.log(resultChanges)
  });

  it("should make a change proposal without errors", async () => {
    const Projects = await TokenDistribution.deployed();
    await Projects.MakeChangeProposal(changeProposalName, ProjectName, { from: accounts[0] });
  });

  it("should get an error already voted for change proposal", async () => {
    const Projects = await TokenDistribution.deployed();
    await expectRevert(
      Projects.voteForChangeProposal(changeProposalName, ProjectName, { from: accounts[0] }),
      "Already voted"
    )
  });

  it("should make a change proposal from other account and vote for it from the main account with no errors", async () => {
    const Projects = await TokenDistribution.deployed();
    await Projects.MakeChangeProposal(changeProposalName + "1", ProjectName, { from: accounts[1] });
    await Projects.voteForChangeProposal(changeProposalName + "1", ProjectName, { from: accounts[0] });
  });

  it("should accept the last change proposal with no errors", async () => {
    const Projects = await TokenDistribution.deployed();
    await Projects.acceptChangeProposal(changeProposalName + "1", ProjectName, { from: accounts[1] });
  });

  it("should get project changes with no errors", async () => {
    const Projects = await TokenDistribution.deployed();
    const resultChanges = await Projects.getChangesOrProposals(ProjectName, true , { from: accounts[0] });
    const resultChangeProposals = await Projects.getChangesOrProposals(ProjectName, false  , { from: accounts[0] });
    console.log(resultChanges);
    console.log(resultChangeProposals);
    assert.lengthOf(resultChanges, 2, "Project changes length should be two (base change) and the one we just accepted");
    assert.lengthOf(resultChangeProposals, 1, "Project change proposals length should be zero");
  });

})

contract("Distribution", accounts => {
  const ProjectName = "ProjectOne"
  const changeProposalName = "changeProposalOne"

  it("should start new project", async () => {
    const Projects = await TokenDistribution.deployed();
    await Projects.createProject("BaseChange", ProjectName, { from: accounts[0] });
  });

  it("should get distribution balance with no errors", async () => {
    const Projects = await TokenDistribution.deployed();
    await Projects.getDistributionBalanceOf(accounts[0], ProjectName);
    
  });

  it("should make distribution to two users with no errors", async () => {
    const Projects = await TokenDistribution.deployed();
    await Projects.MakeChangeProposal(changeProposalName + "1", ProjectName, { from: accounts[1] });
    await Projects.voteForChangeProposal(changeProposalName + "1", ProjectName, { from: accounts[0] });
    await Projects.acceptChangeProposal(changeProposalName + "1", ProjectName, { from: accounts[1] });
    await Projects.distribute([accounts[1], accounts[0]], [30, 10], ProjectName, { from: accounts[0] });
    
  });

  it("should claim tokens after distribution ends", async () => {
    const Projects = await TokenDistribution.deployed();
    await time.increase(time.duration.minutes(10));
    await Projects.claimPendingTokens(ProjectName, { from: accounts[1] });
    await Projects.claimPendingTokens(ProjectName, { from: accounts[2] });
    await Projects.startDistribution(ProjectName);  
    
    const one = await Projects.getDistributionBalanceOf(accounts[1], ProjectName)
    const two = await Projects.getDistributionBalanceOf(accounts[0], ProjectName)
    const three = await Projects.getDistributionBalanceOf(accounts[2], ProjectName)

    const one_1 = await Projects.getBalance(accounts[1], ProjectName)
    const two_1 = await Projects.getBalance(accounts[0], ProjectName)
    const three_1 = await Projects.getBalance(accounts[2], ProjectName)

    console.log(one.toNumber(), two.toNumber(), three.toNumber())
    console.log(one_1.toNumber(), two_1.toNumber(), three_1.toNumber())
    
  });
  
});

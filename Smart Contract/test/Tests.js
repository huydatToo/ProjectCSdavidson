const Steps = artifacts.require("./Steps.sol");
const { expectRevert, time } = require("@openzeppelin/test-helpers");

contract("Steps", accounts => {

  const changeProposalName = "changeProposalOne"
  const ProjectName = "ProjectOne"

  it("should create a new project without errors", async () => {
    const StepsInstance = await Steps.deployed();
    await StepsInstance.createProject("BaseChange", ProjectName, { from: accounts[0] });
  });

  it("should make a change proposal without errors", async () => {
    const StepsInstance = await Steps.deployed();
    await StepsInstance.MakeChangeProposal(changeProposalName, ProjectName, { from: accounts[0] });
  });

  it("should get an error already voted for change proposal", async () => {
    const StepsInstance = await Steps.deployed();
    await expectRevert(
      StepsInstance.voteForChangeProposal(changeProposalName, ProjectName, { from: accounts[0] }),
      "Already voted"
    )
  });

  it("should make a change proposal from other account and vote for it from the main account with no errors", async () => {
    const StepsInstance = await Steps.deployed();
    await StepsInstance.MakeChangeProposal(changeProposalName + "1", ProjectName, { from: accounts[1] });
    await StepsInstance.voteForChangeProposal(changeProposalName + "1", ProjectName, { from: accounts[0] });
  });

  it("should accept the last change proposal with no errors", async () => {
    const StepsInstance = await Steps.deployed();
    await StepsInstance.acceptChangeProposal(changeProposalName + "1", ProjectName, { from: accounts[0] });
  });

  it("should get project changes with no errors", async () => {
    const StepsInstance = await Steps.deployed();
    const resultChanges = await StepsInstance.getProjectChangesOrchangeProposals(ProjectName, true , { from: accounts[0] });
    const resultChangeProposals = await StepsInstance.getProjectChangesOrchangeProposals(ProjectName, false  , { from: accounts[0] });
    console.log(resultChangeProposals, resultChanges)
    assert.lengthOf(resultChanges, 2, "Project changes length should be two (base change) and the one we just accepted");
    assert.lengthOf(resultChangeProposals, 1, "Project change proposals length should be zero");
  });

  it("should run a token distribution a week later two times", async () => {
    const StepsInstance = await Steps.deployed();
    await time.increase(time.duration.days(31));
    await StepsInstance.distributeTokens(ProjectName);
    await time.increase(time.duration.days(31));
    await StepsInstance.distributeTokens(ProjectName);

  });

});

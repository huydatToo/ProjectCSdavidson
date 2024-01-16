const Steps = artifacts.require("./Steps.sol");
const { expectRevert } = require("@openzeppelin/test-helpers");

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
    const result = await StepsInstance.getProjectChanges(ProjectName, { from: accounts[0] });
    assert.lengthOf(result, 2, "Project changes length should be two (base change) and the one we just accepted");
  });

});

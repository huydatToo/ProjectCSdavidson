const Steps = artifacts.require("./Steps.sol");

const projectName = "itamar";

contract("Steps", accounts => {
  it("Create a project and make a proposal", async () => {
    const StepsInstance = await Steps.deployed();
    await StepsInstance.createProject("CID", projectName, { from: accounts[0] })
    await StepsInstance.changeProposal("CIDchange", projectName, { from: accounts[0] })
  });
});

contract("Steps", accounts => {
  it("Create a project and make a proposal and accept it", async () => {
    const StepsInstance = await Steps.deployed();
    await StepsInstance.createProject("CID", projectName, { from: accounts[0] })
    await StepsInstance.changeProposal("CIDchange", projectName, { from: accounts[0] })
    await StepsInstance.accept("CIDchange", projectName, { from: accounts[0] })
    console.log(await StepsInstance.getLastProjects({ from: accounts[0] }))
  });
});

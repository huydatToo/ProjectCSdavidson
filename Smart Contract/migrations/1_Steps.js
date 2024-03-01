const ChangesLibrary = artifacts.require("ChangesLibrary");
const Steps = artifacts.require("Steps");
const Token = artifacts.require("ProjectsToken");

module.exports = async function (deployer) {
  await deployer.deploy(Token);
  const TokenInstance = await Token.deployed();
  await deployer.deploy(Steps, TokenInstance.address);
  await deployer.link(ChangesLibrary, Steps);
  await deployer.deploy(ChangesLibrary);

};

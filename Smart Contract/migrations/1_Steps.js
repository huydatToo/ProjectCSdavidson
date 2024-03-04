const ChangesLibrary = artifacts.require("ChangesLibrary");
const Steps = artifacts.require("Steps");
const Token = artifacts.require("ProjectsToken");

module.exports = async function (deployer) {
  await deployer.deploy(ChangesLibrary);
  await deployer.deploy(Token);
  const TokenInstance = await Token.deployed();
  await deployer.link(ChangesLibrary, Steps);
  await deployer.deploy(Steps, TokenInstance.address);

};

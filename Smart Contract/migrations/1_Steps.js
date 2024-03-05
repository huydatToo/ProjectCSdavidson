const ChangesLibrary = artifacts.require("ChangesLibrary");
const Projects = artifacts.require("Projects");
const Token = artifacts.require("ProjectsToken");
const TokenDistribution = artifacts.require("TokenDistribution");

module.exports = async function (deployer) {
  await deployer.deploy(ChangesLibrary);
  await deployer.deploy(Token);
  const TokenInstance = await Token.deployed();
  
  await deployer.link(ChangesLibrary, Projects);
  await deployer.link(ChangesLibrary, TokenDistribution);

  await deployer.deploy(Projects, TokenInstance.address);
  await deployer.deploy(TokenDistribution, TokenInstance.address)

};

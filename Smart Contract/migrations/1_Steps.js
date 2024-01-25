const ChangesLibrary = artifacts.require("ChangesLibrary");
const Steps = artifacts.require("Steps");

module.exports = async function (deployer) {
  await deployer.deploy(ChangesLibrary);
  await deployer.link(ChangesLibrary, Steps);
  await deployer.deploy(Steps);

};
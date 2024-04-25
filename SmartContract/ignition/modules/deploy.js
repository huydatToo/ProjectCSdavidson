const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");


module.exports = buildModule("TokenDistribution", (m) => {
  const changes = m.contract("ChangesLibrary", []);
  const token = m.contract("ProjectsToken", []);

  const tokenDistribution = m.contract("TokenDistribution", [token], {
    libraries: {
      ChangesLibrary: changes
    }
  });

  return { tokenDistribution };
});

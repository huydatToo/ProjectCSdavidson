// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;
import "./Steps.sol";

// each user has an array of his mints, and every new mint you check how much time left and how many he spent from his calculated amount
contract TokenDistribution {
    Steps projectsContract;

    struct payTokens {
        address recipient;
        uint256 amount;
    }

    constructor(address _projectsContract) {
        projectsContract = Steps(_projectsContract);
    } 

    function getDistributionBalanceOf(address usr, string calldata projectName) public view returns (uint) {
        // calculate the proportion of tokens you have
        uint projectIDX = projectsContract.NameToID(projectName);
        uint tokens = projectIDX;
        return tokens; 
    }

    function distribute(payTokens[] memory recipients, string calldata projectName) public {
        for (uint i=0; i<usrs.length; i++) {
            projectsContract.set 
        }
    }

    function startDistribution() public {

    }

    function claimPendingTokens() external {

    }

}

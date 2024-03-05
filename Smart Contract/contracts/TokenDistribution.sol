// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;
import "./Projects.sol";
import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";

// each user has an array of his mints, and every new mint you check how much time left and how many he spent from his calculated amount
contract TokenDistribution is Projects, Ownable {

    struct payTokens {
        address recipient;
        uint amount;
    }

    constructor(address _tokenAddress) Projects(_tokenAddress) {} 

    function sum(payTokens[] memory _tokens) internal pure returns(uint _sum) {
		for (uint i = 0; i < _tokens.length; i++)
			_sum += _tokens[i].amount;
	}

    function getDistributionBalanceOf(
        address usr, 
        string calldata projectName
    ) public view ProjectExist(projectName) returns (uint) {
        // calculate the proportion of tokens you have
        uint projectIDX = NameToID[projectName];
        uint lastDistributionTime = publicProjects[projectIDX].lastDistributionTime;
        uint tokens = publicProjects[projectIDX].TokensSpent[usr][lastDistributionTime];
        return tokens;
    }

    function distribute(
        payTokens[] memory recipients, 
        string calldata projectName
    ) external onlyOwner ProjectExist(projectName) {
        uint projectIDX = NameToID[projectName];
        uint tokensSpent = sum(recipients);

        require(publicProjects[projectIDX].lastDistributionTime + TimeLockInterval > block.timestamp, "not distribution time");
        require(tokensSpent <= getDistributionBalanceOf(msg.sender, projectName), "Unsufficent amount of tokens");
        
        uint lastDistributionTime = publicProjects[projectIDX].lastDistributionTime;

        for (uint i=0; i<recipients.length; i++) {
            publicProjects[projectIDX].pendingTokens[recipients[i].recipient] += recipients[i].amount;
        }
        publicProjects[projectIDX].TokensSpent[msg.sender][lastDistributionTime] += tokensSpent;
    }

    function startDistribution(
        string calldata projectName
    ) external ProjectExist(projectName) {
        uint projectIDX = NameToID[projectName];
        require(block.timestamp > publicProjects[projectIDX].lastDistributionTime + TimeLockInterval, "not distribution time");

        publicProjects[projectIDX].lastDistributionTime = block.timestamp;
    }

    function claimPendingTokens(
        string calldata projectName
    ) external {
        uint projectIDX = NameToID[projectName];
        token.mint(msg.sender, projectIDX, publicProjects[projectIDX].pendingTokens[msg.sender]);
        publicProjects[projectIDX].pendingTokens[msg.sender] = 0;
    }

}

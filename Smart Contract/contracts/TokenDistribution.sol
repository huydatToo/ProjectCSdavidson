// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;
import "./Projects.sol";
import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";

contract TokenDistribution is Projects, Ownable {

    constructor(address _tokenAddress) Projects(_tokenAddress) {} 


    function sum(uint[] memory _tokens) internal pure returns(uint _sum) {
		for (uint i = 0; i < _tokens.length; i++)
			_sum += _tokens[i];
	}


    function getDistributionBalanceOf(
        address usr, 
        string calldata projectName
    ) public view ProjectExist(projectName) returns (uint) {
        uint projectIDX = NameToID[projectName];
        uint endDistributionTime = publicProjects[projectIDX].DistributionTime;
        uint balanceOf = token.balanceOf(usr, projectIDX);

        // calculate the proportion of tokens you have
        uint tokens = (balanceOf * 100) / token.totalSupply(projectIDX);
        if (tokens == 0) {
            return 0;
        }

        tokens = (publicProjects[projectIDX].newTokens * tokens) / 100;
        tokens -= publicProjects[projectIDX].TokensSpent[usr][endDistributionTime];
        return tokens;
    }


    function distribute(
        address[] memory recipients,
        uint[] memory amounts,
        string calldata projectName
    ) external ProjectExist(projectName) {
        uint projectIDX = NameToID[projectName];
        uint tokensToSpend = sum(amounts);

        require(recipients.length == amounts.length, "not same amounts as a recepients");
        require(publicProjects[projectIDX].DistributionTime > block.timestamp, "not distribution time");
        require(tokensToSpend <= getDistributionBalanceOf(msg.sender, projectName), "Unsufficent amount of tokens");
        
        uint endDistributionTime = publicProjects[projectIDX].DistributionTime;

        for (uint i=0; i<recipients.length; i++) {
            publicProjects[projectIDX].pendingTokens[recipients[i]] += amounts[i];
        }

        publicProjects[projectIDX].TokensSpent[msg.sender][endDistributionTime] += tokensToSpend;
    }


    function startDistribution(
        string calldata projectName
    ) external ProjectExist(projectName) {
        uint projectIDX = NameToID[projectName];
        require(block.timestamp >= publicProjects[projectIDX].DistributionTime + ClaimingInterval, "not starting distribution time");

        publicProjects[projectIDX].newTokens = 100;
        publicProjects[projectIDX].DistributionTime = block.timestamp + TimeLockInterval;
    }

    function claimPendingTokens(
        string calldata projectName
    ) external ProjectExist(projectName) {
        uint projectIDX = NameToID[projectName];
        require(block.timestamp >= publicProjects[projectIDX].DistributionTime, "not claiming time");
        token.mint(msg.sender, projectIDX, publicProjects[projectIDX].pendingTokens[msg.sender]);
        delete publicProjects[projectIDX].pendingTokens[msg.sender];
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;
import "./Projects.sol";
import "../node_modules/@openzeppelin/contracts/utils/structs/EnumerableSet.sol";


contract TokenDistribution is Projects {
    using EnumerableSet for EnumerableSet.AddressSet;

    constructor(address _tokenAddress) Projects(_tokenAddress) {} 


    function sum(uint[] memory _tokens) internal pure returns(uint _sum) {
		for (uint i = 0; i < _tokens.length; i++)
			_sum += _tokens[i];
	}


    function getDistributionBalanceOf(
        address usr, 
        string calldata projectName
    ) public view ProjectExist(projectName) returns (uint) {
        uint projectID = NameToID[projectName];
        uint endDistributionTime = publicProjects[projectID].DistributionTime;
        uint balanceOf = token.balanceOf(usr, projectID);

        // calculate the proportion of tokens you have
        uint tokens = (balanceOf * 100) / token.totalSupply(projectID);
        if (tokens == 0) {
            return 0;
        }

        tokens = (publicProjects[projectID].newTokens * tokens) / 100;
        tokens -= publicProjects[projectID].participant[usr].TokensSpent[endDistributionTime];
        return tokens;
    }


    function distribute(
        address[] memory recipients,
        uint[] memory amounts,
        string calldata projectName
    ) external ProjectExist(projectName) {
        uint projectID = NameToID[projectName];
        uint tokensToSpend = sum(amounts);

        require(recipients.length == amounts.length, "not same amounts as a recepients");
        require(publicProjects[projectID].DistributionTime > block.timestamp, "not distribution time");
        require(tokensToSpend <= getDistributionBalanceOf(msg.sender, projectName), "Unsufficent amount of tokens");
        
        for (uint i=0; i<recipients.length; i++) {
            if (publicProjects[projectID].participants.contains(recipients[i]) == false) {
                revert("Not a Project Participant");
            }
        }

        uint endDistributionTime = publicProjects[projectID].DistributionTime;

        for (uint i=0; i<recipients.length; i++) {
            publicProjects[projectID].participant[recipients[i]].pendingTokens += amounts[i];
        }

        publicProjects[projectID].participant[msg.sender].TokensSpent[endDistributionTime] += tokensToSpend;
    }


    function startDistribution(
        string calldata projectName
    ) external ProjectExist(projectName) {
        uint projectID = NameToID[projectName];
        require(block.timestamp >= publicProjects[projectID].DistributionTime + ClaimingInterval, "not starting distribution time");

        publicProjects[projectID].newTokens = 100;
        publicProjects[projectID].DistributionTime = block.timestamp + TimeLockInterval;
    }
    

    function claimPendingTokens(
        string calldata projectName
    ) public ProjectExist(projectName) {
        uint projectID = NameToID[projectName];
        require(block.timestamp >= publicProjects[projectID].DistributionTime, "not claiming time");
        token.mint(msg.sender, projectID, publicProjects[projectID].participant[msg.sender].pendingTokens);
        delete publicProjects[projectID].participant[msg.sender].pendingTokens;
    }


    function getLastDistriubtionTime(string calldata projectName) external view ProjectExist(projectName) returns (uint)  {
        uint projectID = NameToID[projectName];
        return publicProjects[projectID].DistributionTime;
    }


    function getPendingTokens(address usr, string calldata projectName) ProjectExist(projectName) external view returns (uint) {
        uint projectID = NameToID[projectName];
        return publicProjects[projectID].participant[usr].pendingTokens;
    }

}

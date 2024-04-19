// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "../node_modules/@openzeppelin/contracts/utils/Counters.sol";
import "../node_modules/@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "./Changes.sol";
import "./ProjectsToken.sol";


contract Projects {
    // initiate all the data structures and constants saved on the smart contract
    uint public constant TimeLockInterval = 4 minutes;
    uint public constant ClaimingInterval = 2 minutes;

    using EnumerableSet for EnumerableSet.AddressSet;
    using Counters for Counters.Counter;
    using ChangesLibrary for ChangesLibrary.changesMap;

    
    // -------------------------------------------------------- Mappings
    mapping(string => uint) public NameToID;    

    // -------------------------------------------------------- Structs

    struct goBack {
        string changeCID;
        address goBackMaker;
        uint votes;
    }


    struct Vote {
        bool voted;
        bool removeVoted;
    }


    struct Project {
        string name;
        ChangesLibrary.changesMap changes;
        EnumerableSet.AddressSet participants;

        // time lock
        uint DistributionTime;

        // - ChangeCID => Voter address => Voted?
        mapping(string => mapping(address => Vote)) Voted;

        // distribution
        uint newTokens;
        mapping(address => uint) pendingTokens;
        mapping(address => mapping(uint => uint)) TokensSpent; // user => time => tokens spent

    }


    // -------------------------------------------------------- Lists
    Project[] publicProjects;

    // -------------------------------------------------------- Token
    ProjectsToken public token;

    // -------------------------------------------------------- Events
    event NewProjectCreated(string message, string name, uint value);
    event NewChangeProposalCreated(string message, string Name, string CID, uint indexValue);
    event NewVoteForChangeProposal(string message, string projectName, string changeProposalCID, address voter);
    event NewChangeIsMadeToProject(string message, string projectName, string changeCID); // Message, Project CID, Message, ChangeCID
    event ProjectWentBack(string message, string changeCID, string ProjectName);
    event TokensDisributed(string message, uint lastDistributionTime);

    // -------------------------------------------------------- Modifiers
    modifier ProjectExist(string memory _Name) {
        uint idx = NameToID[_Name];
        require(token.exists(idx), "Project do not exist");
        _;
    }


    // -------------------------------------------------------- Constructor
    constructor(address tokenAddress) {
        token = ProjectsToken(tokenAddress);
    } 

    // -------------------------------------------------------- Functions

    // the function create a new project with an inital change
    function createProject(string memory _CID, string memory projectName) public {
        uint newProjectID = publicProjects.length;
        NameToID[projectName] = newProjectID;
        token.mint(msg.sender, newProjectID, 100);
        
        Project storage newProject = publicProjects.push();
        newProject.name = projectName;
        newProject.changes.initialize(_CID);
        newProject.newTokens = 100;
        newProject.DistributionTime = block.timestamp + TimeLockInterval; 
        newProject.participants.add(msg.sender);

        emit NewProjectCreated("New project created with ID:", projectName, newProjectID);
    }


    // the functions create a change proposal
    function MakeChangeProposal(
        string memory _changeCID, 
        string calldata projectName
    ) ProjectExist(projectName) external {
        uint projectID = NameToID[projectName];
        publicProjects[projectID].changes.createChangeProposal(_changeCID);
        publicProjects[projectID].Voted[_changeCID][msg.sender].voted = true;
        emit NewChangeProposalCreated("New change proposal to the Project with the name and following ID and CID:", projectName, _changeCID, projectID);
    }

    
    function isVoted(
        address addr,
        string calldata changeProposalCID,
        string calldata projectName
    ) ProjectExist(projectName) view external returns (bool) {
        uint projectID = NameToID[projectName];
        return publicProjects[projectID].Voted[changeProposalCID][addr].voted;
    }


    // the function make a go Back 
    function acceptRemoval(
        string calldata projectName, 
        string memory changeCID
    ) ProjectExist(projectName) external {
        uint projectID = NameToID[projectName];
        publicProjects[projectID].changes.removeChange(changeCID);

        address participant;
        for (uint index = 0; index < publicProjects[projectID].participants.length(); index++) {
            participant = publicProjects[projectID].participants.at(index);
            delete publicProjects[projectID].Voted[changeCID][participant];
        }
        
        emit ProjectWentBack("Project changed to change: ", changeCID, projectName);
    }


    // the functions accept a change proposal and add it to the list
    function acceptChangeProposal(
        string calldata _proposedChangeCID,
        string calldata projectName
    ) ProjectExist(projectName) external {
        uint projectID = NameToID[projectName];
        require(publicProjects[projectID].changes.getChangeMaker(_proposedChangeCID) == msg.sender, "only the change proposal creator can accept");
        require(getChangeVotes(_proposedChangeCID, projectName)*2 > token.totalSupply(projectID));

        publicProjects[projectID].changes.acceptChangeProposal(_proposedChangeCID);

        emit NewChangeIsMadeToProject("A new change has been made to the project: ", projectName, _proposedChangeCID);
    }


    // the function allow user to vote in favor of a change proposal
    function voteForChangeProposal(
        string memory _changeProposalCID, 
        string calldata projectName
    ) ProjectExist(projectName) external {
        uint projectID = NameToID[projectName];

        require(publicProjects[projectID].Voted[_changeProposalCID][msg.sender].voted == false, "Already voted");

        uint votingPower = token.balanceOf(msg.sender, projectID);
        if (votingPower <= 0) {
            revert("Voting power is insufficient");
        }

        publicProjects[projectID].Voted[_changeProposalCID][msg.sender].voted = true;
        
        emit NewVoteForChangeProposal(
            "New vote for change proposal:",
            projectName,
            _changeProposalCID,
            msg.sender
        );
    }

 
    function addParticipant(
        address addr,
        string calldata projectName
    ) ProjectExist(projectName) internal returns (bool) {
        uint projectID = NameToID[projectName];
        return publicProjects[projectID].participants.add(addr);
    }


    function getChangeVotes(
        string calldata changeCID,
        string calldata projectName
    ) ProjectExist(projectName) public view returns (uint) {
        uint projectID = NameToID[projectName];
        uint votes = 0;
        address participant;
        for (uint index = 0; index < publicProjects[projectID].participants.length(); index++) {
            participant = publicProjects[projectID].participants.at(index);
            if (publicProjects[projectID].Voted[changeCID][participant].voted) {
                votes += token.balanceOf(participant, projectID);
            }
        }

        return votes;
    }


    function getChangeRemovalVotes(
        string calldata changeCID,
        string calldata projectName
    ) ProjectExist(projectName) public view returns (uint) {
        uint projectID = NameToID[projectName];
        uint votes = 0;
        address participant;
        for (uint index = 0; index < publicProjects[projectID].participants.length(); index++) {
            participant = publicProjects[projectID].participants.at(index);
            if (publicProjects[projectID].Voted[changeCID][participant].removeVoted) {
                votes += token.balanceOf(participant, projectID);
            }
        }

        return votes;
    }


    function getBalance(
        address UserAddress,
        string calldata projectName
    ) ProjectExist(projectName) external view returns (uint) {
        return token.balanceOf(UserAddress, NameToID[projectName]);
    }


    function getTotalTokens(
        string calldata projectName
    ) ProjectExist(projectName) external view returns (uint) {
        return token.totalSupply(NameToID[projectName]);
    }


    // the functions returns the changes/change proposals
    function getChangesOrProposals(
        string calldata projectName, 
        bool changesOrChangeProposals
    ) ProjectExist(projectName) external view returns (string[] memory) {
        uint projectID = NameToID[projectName];
        return publicProjects[projectID].changes.getChangesOrChangeProposals(changesOrChangeProposals); // true for changes and false for change proposals
    }


    function getAddresses(
        string calldata projectName
    ) ProjectExist(projectName) external view returns (address[] memory) {
        uint projectID = NameToID[projectName];
        return publicProjects[projectID].participants.values(); 
    }


    function getChangeMaker(
        string calldata projectName,
        string calldata change
    ) ProjectExist(projectName) external view returns (address) {
        uint projectID = NameToID[projectName];
        return publicProjects[projectID].changes.getChangeMaker(change);
    }


    // TEMP
    function getLastProjects() external view returns (string[] memory) {
        uint arr_length = publicProjects.length;
        uint arr_index = publicProjects.length;
        if (arr_length > 10) {
            arr_length = 10;
        }

        string[] memory lastProjects = new string[](arr_length);
        if (publicProjects.length > 0) {
        for (uint256 i = arr_index - arr_length; i < arr_index; i++) {
            lastProjects[arr_index - 1 - i] = publicProjects[i].name; 
        }}
        return lastProjects;
    }
}

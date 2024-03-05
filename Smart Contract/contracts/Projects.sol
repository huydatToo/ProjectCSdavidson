// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "../node_modules/@openzeppelin/contracts/utils/Counters.sol";
import "./Changes.sol";
import "./ProjectsToken.sol";


contract Projects {
    // initiate all the data structures and constants saved on the smart contract
    uint public immutable TimeLockInterval = 30 days;
    using Counters for Counters.Counter;
    using ChangesLibrary for ChangesLibrary.ChangesStorage;

    
    // -------------------------------------------------------- Mappings
    mapping(string => uint) public NameToID;    

    // -------------------------------------------------------- Structs

    struct goBack {
        string changeCID;
        address goBackMaker;
        uint votes;
    }

    struct Project {
        string name;
        ChangesLibrary.ChangesStorage changes;
        goBack[] goBackProposals;

        // time lock
        uint lastDistributionTime;

        // distribution
        mapping(address => uint) pendingTokens;
        mapping(address => mapping(uint => uint)) TokensSpent; // user => time => tokens spent

        // - ChangeCID => Voter address => Voted?
        mapping(string => mapping(address => bool)) Voted;

    }


    // -------------------------------------------------------- Lists
    Project[] publicProjects;

    // -------------------------------------------------------- Token
    ProjectsToken public token;

    // -------------------------------------------------------- Events
    event NewProjectCreated(string message, string name, uint value);
    event NewChangeProposalCreated(string message, string Name, string CID, uint indexValue);
    event NewVoteForChangeProposal(string message, string projectName, string changeProposalCID, address voter, uint votes);
    event NewChangeIsMadeToProject(string message, string projectName, string changeCID); // Message, Project CID, Message, ChangeCID
    event ProjectWentBack(string message, string changeCID, string ProjectName);
    event TokensDisributed(string message, uint lastDistributionTime);

    // -------------------------------------------------------- Modifiers
    modifier ProjectExist(string memory _Name) {
        uint id = NameToID[_Name];
        if (id == 0) {
            require(keccak256(abi.encodePacked(publicProjects[id].name)) == keccak256(abi.encodePacked(_Name)), "Project do not exist");
        } else {
            require(id < publicProjects.length, "Project do not exist");
        }
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
        token.mint(msg.sender, newProjectID, 10);
        
        Project storage newProject = publicProjects.push();
        newProject.name = projectName;
        newProject.changes.initialize(_CID);
        newProject.lastDistributionTime = block.timestamp;

        emit NewProjectCreated("New project created with ID:", projectName, newProjectID);
    }

    // the functions create a change proposal
    function MakeChangeProposal(
        string memory _changeCID, 
        string calldata _projectName
    ) ProjectExist(_projectName) external {
        uint projectIDX = NameToID[_projectName];
        publicProjects[projectIDX].changes.createChangeProposal(_changeCID, token.balanceOf(msg.sender, NameToID[_projectName]));
        publicProjects[projectIDX].Voted[_changeCID][msg.sender] = true;
        emit NewChangeProposalCreated("New change proposal to the Project with the name and following ID and CID:", _projectName, _changeCID, projectIDX);
    }

    // the functions make a go back proposal
    function MakeGoBackProposal(
        string memory _changeCID, 
        string calldata _projectName
    ) external {
        uint projectID = NameToID[_projectName];
        publicProjects[projectID].goBackProposals.push(goBack(_changeCID, msg.sender, token.balanceOf(msg.sender, NameToID[_projectName])));
    }

    // the function make a go Back 
    function acceptGoBack(
        string calldata _projectName, 
        string memory _changeCID
    ) ProjectExist(_projectName) external {
        uint projectIDX = NameToID[_projectName];
        publicProjects[projectIDX].changes.goBack(_changeCID);
        
        emit ProjectWentBack("Project changed to change: ", _changeCID, _projectName);
    }

    // the functions accept a change proposal and add it to the list
    function acceptChangeProposal(
        string memory _proposedChangeCID, 
        string calldata _projectName
    ) ProjectExist(_projectName) external {
        uint projectID = NameToID[_projectName];
        publicProjects[projectID].changes.acceptChangeProposal(_proposedChangeCID);
        emit NewChangeIsMadeToProject("A new change has been made to the project: ", _projectName, _proposedChangeCID);
    }

    // the function returns the voting power of a user in a certain project
    function getBalance(
        string calldata _projectName, 
        address _UserAddress
    ) ProjectExist(_projectName) external view returns (uint) {
        return token.balanceOf(_UserAddress, NameToID[_projectName]);
    }

    // the function allow user to vote in favor of a change proposal
    function voteForChangeProposal(
        string memory _changeProposalCID, 
        string calldata _projectName
    ) ProjectExist(_projectName) external {
        uint projectID = NameToID[_projectName];

        require(publicProjects[projectID].Voted[_changeProposalCID][msg.sender] == false, "Already voted");

        uint votingPower = token.balanceOf(msg.sender, projectID);
        
        if (votingPower <= 0) {
            revert("Voting power is insufficient");
        }

        publicProjects[projectID].changes.voteForChangeProposal(_changeProposalCID, votingPower);
        publicProjects[projectID].Voted[_changeProposalCID][msg.sender] = true;
        
        emit NewVoteForChangeProposal(
            "New vote for change proposal:",
            _projectName,
            _changeProposalCID,
            msg.sender,
            publicProjects[projectID].changes.getChangeProposalVotes(_changeProposalCID)
        );
    }

    // the functions returns the changes/change proposals
    function getChangesOrProposals(
        string calldata _projectName, 
        bool changesOrChangeProposals
    ) ProjectExist(_projectName) external view returns (string[] memory) {
        uint projectID = NameToID[_projectName];
        return publicProjects[projectID].changes.getChangesOrChangeProposals(changesOrChangeProposals); // true for changes and false for change proposals
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

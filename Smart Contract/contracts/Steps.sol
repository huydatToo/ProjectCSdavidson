// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "../node_modules/@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";
import "../node_modules/@openzeppelin/contracts/utils/Counters.sol";
import "../node_modules/@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "./Changes.sol";


contract Steps is ERC1155, Ownable, ERC1155Supply {
    uint public immutable TimeLockInterval = 60 * 60 * 24 * 30; // One Week
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

        // - ChangeCID => Voter address => Voted?
        mapping(string => mapping(address => bool)) Voted;

    }


    // -------------------------------------------------------- Lists
    Project[] publicProjects;

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
    constructor() ERC1155("URI") {

    } // change URI to the website's one

    // -------------------------------------------------------- Functions
    function _beforeTokenTransfer(address operator, address from, address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data) internal override(ERC1155, ERC1155Supply) {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }

    function createProject(string memory _CID, string memory projectName) public {
        uint newProjectID = publicProjects.length;
        NameToID[projectName] = newProjectID;
        _mint(msg.sender, newProjectID, 10, "");
        
        Project storage newProject = publicProjects.push();
        newProject.name = projectName;
        newProject.changes.initialize(_CID);
        newProject.lastDistributionTime = block.timestamp;

        emit NewProjectCreated("New project created with ID:", projectName, newProjectID);
    }


    function MakeChangeProposal(string memory _changeCID, string memory _projectName) ProjectExist(_projectName) external {
        uint projectIDX = NameToID[_projectName];
        publicProjects[projectIDX].changes.createChangeProposal(_changeCID, balanceOf(msg.sender, NameToID[_projectName]));
        publicProjects[projectIDX].Voted[_changeCID][msg.sender] = true;
        emit NewChangeProposalCreated("New change proposal to the Project with the name and following ID and CID:", _projectName, _changeCID, projectIDX);
    }


    function MakeGoBackProposal(string memory _changeCID, string memory _projectName) external {
        uint projectID = NameToID[_projectName];
        publicProjects[projectID].goBackProposals.push(goBack(_changeCID, msg.sender, balanceOf(msg.sender, NameToID[_projectName])));
    }

    function acceptGoBack(string memory _projectName, string memory _changeCID) ProjectExist(_projectName) external {
        uint projectIDX = NameToID[_projectName];
        publicProjects[projectIDX].changes.goBack(_changeCID);
        
        emit ProjectWentBack("Project changed to change: ", _changeCID, _projectName);
    }

    function acceptChangeProposal(string memory _proposedChangeCID, string memory _projectName) ProjectExist(_projectName) external {
        uint projectID = NameToID[_projectName];
        publicProjects[projectID].changes.acceptChangeProposal(_proposedChangeCID);
        emit NewChangeIsMadeToProject("A new change has been made to the project: ", _projectName, _proposedChangeCID);
    }

    function getBalance(string memory _projectName) ProjectExist(_projectName) external view returns (uint) {
        return balanceOf(msg.sender, NameToID[_projectName]);
    }

    function voteForChangeProposal(string memory _changeProposalCID, string memory _projectName) ProjectExist(_projectName) external {
        uint projectID = NameToID[_projectName];

        require(publicProjects[projectID].Voted[_changeProposalCID][msg.sender] == false, "Already voted");

        uint votingPower = balanceOf(msg.sender, projectID);
        
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

    function getProjectChangesOrchangeProposals(string memory _projectName, bool changesOrChangeProposals) ProjectExist(_projectName) external view returns (string[] memory) {
        uint projectID = NameToID[_projectName];
        return publicProjects[projectID].changes.getChangesOrChangeProposals(changesOrChangeProposals); // true for changes and false for change proposals
    }

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

    function distributeTokens(string memory _projectName) ProjectExist(_projectName) external {
        uint projectID = NameToID[_projectName];
                
        require(block.timestamp >= publicProjects[projectID].lastDistributionTime + TimeLockInterval, "There is still time until the next distribution");

        // <token distribution>
        // ...
        // <token distribution/>

        publicProjects[projectID].lastDistributionTime = block.timestamp;

        emit TokensDisributed(
            "Tokens distributed",
            publicProjects[projectID].lastDistributionTime
        );
    }

}

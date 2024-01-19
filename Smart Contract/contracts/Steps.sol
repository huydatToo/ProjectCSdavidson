// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "../node_modules/@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";
import "../node_modules/@openzeppelin/contracts/utils/Counters.sol";
import "../node_modules/@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";


contract Steps is ERC1155, Ownable, ERC1155Supply {
    uint public immutable TimeLockInterval = 60 * 60 * 24 * 7; // One Week
    using Counters for Counters.Counter;

    // -------------------------------------------------------- Mappings
    mapping(string => uint) public NameToID;    

    // -------------------------------------------------------- Structs
    struct Change {
        string changeCID;
        address changeMaker;
        uint votes;
    }

    struct goBack {
        string changeCID;
        address goBackMaker;
        uint votes;
    }

    struct Project {
        string name;
        Change[] changes;
        Change[] changeProposals;
        goBack[] goBackProposals;

        // time lock
        uint lastDistributionTime;

        uint lastDistributionTimeIndexChanges;
        uint lastDistributionTimeIndexChangeProposals;

        // - ChangeCID => Voter address => Voted?
        mapping(string => mapping(address => bool)) Voted;

        // - delegate address => delegation power
        // mapping(address => address[]) delegate;
    }


    // -------------------------------------------------------- Lists
    Project[] publicProjects;

    // -------------------------------------------------------- Events
    event NewProjectCreated(string message, string name, uint value);
    event NewChangeProposalCreated(string message, string Name, string CID, uint indexValue);
    event NewVoteForChangeProposal(string message, string projectName, string changeProposalCID, address voter, uint votes);
    event NewChangeIsMadeToProject(string message, string projectName, string changeCID); // Message, Project CID, Message, ChangeCID
    event ProjectWentBack(string message, string changeCID, string ProjectName);
    event TokensDisributed(string message, uint lastDistributionTime , uint newLastDistributionTimeIndexChanges, uint newLastDistributionTimeIndexChangeProposals);

    // -------------------------------------------------------- Modifiers
    modifier ProjectExist(string memory _Name) {
        uint id = NameToID[_Name];
        require(id < publicProjects.length, "Project do not exist");
        _;
    }

    // -------------------------------------------------------- Constructor
    constructor() ERC1155("URI") {
        publicProjects.push();
    } // change URI to the website's one

    // -------------------------------------------------------- Functions
    function _beforeTokenTransfer(address operator, address from, address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data) internal override(ERC1155, ERC1155Supply) {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }

    function createProject(string memory _CID, string memory projectName) public {
        // Create Project's Token and Mint
        uint newProjectID = publicProjects.length;
        NameToID[projectName] = newProjectID;
        _mint(msg.sender, newProjectID, 10, "");
        
        // Create New Project
        Project storage newProject = publicProjects.push();
        newProject.name = projectName;
        Change memory newChange = Change(_CID, msg.sender, 1);
        newProject.changes.push(newChange);
        newProject.lastDistributionTime = block.timestamp;

        emit NewProjectCreated("New project created with ID:", projectName, newProjectID);
    }


    function MakeChangeProposal(string memory _changeCID, string memory _projectName) ProjectExist(_projectName) external {
        uint projectIDX = NameToID[_projectName];
        publicProjects[projectIDX].changeProposals.push(Change(_changeCID, msg.sender, balanceOf(msg.sender, NameToID[_projectName])));
        publicProjects[projectIDX].Voted[_changeCID][msg.sender] = true;
        emit NewChangeProposalCreated("New change proposal to the Project with the name and following ID and CID:", _projectName, _changeCID, projectIDX);
    }

    function getChangeProposalIndex(string memory _ChangeCID, string memory _projectName) internal view returns (uint)  {
        uint _proposedChangeIdx;
        bool found;

        uint idx = NameToID[_projectName];
        for (uint index = publicProjects[idx].changeProposals.length - 1; index >= 0; index--) {
            string memory changeCIDcheck = publicProjects[idx].changeProposals[index].changeCID;
            if (keccak256(abi.encodePacked(changeCIDcheck)) == keccak256(abi.encodePacked(_ChangeCID))) {
                _proposedChangeIdx = index;
                found = true;
                break;
            }
        }

        require(found == true, "Proposed change doesn't exist");
        return _proposedChangeIdx;
    }

    function MakeGoBackProposal(string memory _changeCID, string memory _projectName) external {
        uint projectID = NameToID[_projectName];
        publicProjects[projectID].goBackProposals.push(goBack(_changeCID, msg.sender, 0));
    }

    function acceptGoBack(string memory _projectName, string memory _changeCID) ProjectExist(_projectName) external {
        uint projectIDX = NameToID[_projectName];
        uint _proposedChangeIdx = getChangeProposalIndex(_changeCID, _projectName);
        for (uint index = publicProjects[projectIDX].changes.length; index > _proposedChangeIdx; index--) {
            publicProjects[projectIDX].changeProposals.push(publicProjects[projectIDX].changes[index - 1]);
            publicProjects[projectIDX].changes.pop();
        }

        emit ProjectWentBack("Project changed to change: ", _changeCID, _projectName);
    }

    function acceptChangeProposal(string memory _proposedChangeCID, string memory _projectName) ProjectExist(_projectName) external {
        uint _proposedChangeIdx = getChangeProposalIndex(_proposedChangeCID, _projectName);
        uint projectID = NameToID[_projectName];

        Change memory proposedChange = publicProjects[projectID].changeProposals[_proposedChangeIdx];
        Change memory LastProposedChange = publicProjects[projectID].changeProposals[publicProjects[projectID].changeProposals.length - 1];
        publicProjects[projectID].changeProposals[publicProjects[projectID].changeProposals.length - 1] = proposedChange;
        publicProjects[projectID].changeProposals[_proposedChangeIdx] = LastProposedChange;
        publicProjects[projectID].changeProposals.pop();

        publicProjects[projectID].changes.push(Change(proposedChange.changeCID, proposedChange.changeMaker, proposedChange.votes));

        emit NewChangeIsMadeToProject("A new change has been made to the project: ", _projectName, _proposedChangeCID);
    }

    function getBalance(string memory _projectName) ProjectExist(_projectName) external view returns (uint) {
        return balanceOf(msg.sender, NameToID[_projectName]);
    }

    // function getDelegationVotingPower(string memory _changeProposalCID, string memory _projectName) ProjectExist(_projectName) public returns (uint) {
    //     uint projectID = NameToID[_projectName];
    //     uint votingPower;
    //     for (uint i = 0; i < publicProjects[projectID].delegate[msg.sender].length; i++) {
    //         address delegated = publicProjects[projectID].delegate[msg.sender][i];
    //         if (!publicProjects[projectID].Voted[_changeProposalCID][delegated]) {
    //             votingPower += balanceOf(delegated, projectID);
    //             publicProjects[projectID].Voted[_changeProposalCID][delegated] = true;
    //         }
    //     }

    //     return votingPower;
    // }

    function voteForChangeProposal(string memory _changeProposalCID, string memory _projectName) ProjectExist(_projectName) external {
        uint projectID = NameToID[_projectName];

        require(publicProjects[projectID].Voted[_changeProposalCID][msg.sender] == false, "Already voted");

        uint _proposedChangeIdx = getChangeProposalIndex(_changeProposalCID, _projectName);
        uint votingPower = balanceOf(msg.sender, projectID); // + getDelegationVotingPower(_changeProposalCID, _projectName);
        
        if (votingPower <= 0) {
            revert("Voting power is insufficient");
        }

        publicProjects[projectID].changeProposals[_proposedChangeIdx].votes += votingPower;
        publicProjects[projectID].Voted[_changeProposalCID][msg.sender] = true;
        
        // New vote for change proposal: project name, changeCID, sender, votes
        emit NewVoteForChangeProposal(
            "New vote for change proposal:",
            _projectName,
            _changeProposalCID,
            msg.sender,
            publicProjects[projectID].changeProposals[_proposedChangeIdx].votes
        );
    }

    function getProjectChanges(string memory _projectName) ProjectExist(_projectName) external view returns (string[] memory) {
        uint projectID = NameToID[_projectName];
        uint arr_length = publicProjects[projectID].changes.length;
        string[] memory allChanges = new string[](arr_length);

        for (uint256 i = 0; i < arr_length; i++) {
            allChanges[i] = publicProjects[projectID].changes[i].changeCID;
        }

        return allChanges;
    }

    function getProjectChangeProposals(string memory _projectName) ProjectExist(_projectName) external view returns (string[] memory) {
        uint projectID = NameToID[_projectName];
        uint arr_length = publicProjects[projectID].changeProposals.length;
        string[] memory allChanges = new string[](arr_length);

        for (uint256 i = 0; i < arr_length; i++) {
            allChanges[i] = publicProjects[projectID].changeProposals[i].changeCID;
        }

        return allChanges;
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
        
        publicProjects[projectID].lastDistributionTimeIndexChanges = publicProjects[projectID].changes.length - 1;
        publicProjects[projectID].lastDistributionTimeIndexChangeProposals = publicProjects[projectID].changeProposals.length - 1;
        
        require(block.timestamp >= publicProjects[projectID].lastDistributionTime + TimeLockInterval, "There is still time until the next distribution");

        // <token distribution>
        // ...
        // <token distribution/>

        publicProjects[projectID].lastDistributionTime = block.timestamp;

        emit TokensDisributed(
            "Tokens distributed",
            publicProjects[projectID].lastDistributionTime,
            publicProjects[projectID].lastDistributionTimeIndexChanges,
            publicProjects[projectID].lastDistributionTimeIndexChangeProposals
        );
    }

}

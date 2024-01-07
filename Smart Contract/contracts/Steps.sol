// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "../node_modules/@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";
import "../node_modules/@openzeppelin/contracts/utils/Counters.sol";
import "../node_modules/@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";

contract Steps is ERC1155, Ownable, ERC1155Supply {
    using Counters for Counters.Counter;

    // -------------------------------------------------------- Mappings
    mapping(string => uint) public NameToID;

    // -------------------------------------------------------- Structs
    struct Change {
        string changeCID;
        address changeMaker;
        uint votes;
    }

    struct Project {
        string name;
        Change[] changes;
        Change[] changeProposals;
    }


    // -------------------------------------------------------- Lists
    Project[] publicProjects;

    // -------------------------------------------------------- Events
    event NewProjectCreated(string message, string name, uint value);
    event NewChangeProposalCreated(string message, string Name, string CID, uint indexValue);
    event NewVoteForChangeProposal(string message, uint projectCID, string proposedChangeCID, address voter, uint votes);
    event NewChangeIsMadeToProject(string message, uint projectCID, string changeCID); // Message, Project CID, Message, ChangeCID
    event ProjectGoBack(string message, uint step, string changeCID);

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

    } // change URI to the website

    // -------------------------------------------------------- Functions
    function _beforeTokenTransfer(address operator, address from, address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data) internal override(ERC1155, ERC1155Supply) {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }

    function createProject(string memory _CID, string memory projectName) public {
        // Create Project's Token and Mint
        uint newProjectID = publicProjects.length;
        NameToID[projectName] = newProjectID;
        _mint(msg.sender, newProjectID, 1000000, "");
        
        // Create New Project
        Project storage newProject = publicProjects.push();
        newProject.name = projectName;
        Change memory newChange = Change(_CID, msg.sender, 1);
        newProject.changes.push(newChange);
        emit NewProjectCreated("New project created with ID:", projectName, newProjectID);
    }


    function changeProposal(string memory _changeCID, string memory _ProjectName) ProjectExist(_ProjectName) public {
        uint projectIDX = NameToID[_ProjectName];
        publicProjects[projectIDX].changeProposals.push(Change(_changeCID, msg.sender, balanceOf(msg.sender, NameToID[_ProjectName])));
        emit NewChangeProposalCreated("New change proposal to the Project with the name and following ID and CID:", _ProjectName, _changeCID, projectIDX);
    }


    function goBack(string memory _ProjectName, uint _step) ProjectExist(_ProjectName) public {
        uint projectIDX = NameToID[_ProjectName];
        for (uint index = publicProjects[projectIDX].changes.length; index > _step; index--) {
            publicProjects[projectIDX].changeProposals.push(publicProjects[projectIDX].changes[index - 1]);
            publicProjects[projectIDX].changes.pop();
        }

        emit ProjectGoBack("Project changed to step: ", _step, publicProjects[projectIDX].changes[publicProjects[projectIDX].changes.length - 1].changeCID);
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

    function accept(string memory _proposedChangeCID, string memory _projectName) ProjectExist(_projectName) public {
        uint _proposedChangeIdx = getChangeProposalIndex(_proposedChangeCID, _projectName);
        uint projectID = NameToID[_projectName];

        Change memory proposedChange = publicProjects[projectID].changeProposals[_proposedChangeIdx];
        Change memory LastProposedChange = publicProjects[projectID].changeProposals[publicProjects[projectID].changeProposals.length - 1];
        publicProjects[projectID].changeProposals[publicProjects[projectID].changeProposals.length - 1] = proposedChange;
        publicProjects[projectID].changeProposals[_proposedChangeIdx] = LastProposedChange;
        publicProjects[projectID].changeProposals.pop();
        
        publicProjects[projectID].changes.push(Change(proposedChange.changeCID, proposedChange.changeMaker, proposedChange.votes));

        emit NewChangeIsMadeToProject("A new change has been made to project with ID: ", projectID, _proposedChangeCID);
    }

    function getBalance(address _address, string memory _projectName) ProjectExist(_projectName) external view returns (uint) {
        return balanceOf(_address, NameToID[_projectName]);
    }

    function voteToProposedChange(string memory _projectName, string memory _proposedChangeCID) ProjectExist(_projectName) public {
        uint projectID = NameToID[_projectName];
        uint votingPower = balanceOf(msg.sender, projectID);
        require(votingPower > 0, "You don't have enough unused tokens");
        uint _proposedChangeIdx = getChangeProposalIndex(_proposedChangeCID, _projectName);

        publicProjects[projectID].changeProposals[_proposedChangeIdx].votes += votingPower;
        
        emit NewVoteForChangeProposal(
            "New vote for proposal change:",
            projectID,
            _proposedChangeCID,
            msg.sender,
            publicProjects[projectID].changeProposals[_proposedChangeIdx].votes
        );
    }

    function getProjectChanges(string memory _projectName) ProjectExist(_projectName) external view returns (string[] memory) {
        uint projectIDX = NameToID[_projectName];
        uint arr_length = publicProjects[projectIDX].changes.length;
        string[] memory allChanges = new string[](arr_length);

        for (uint256 i = 0; i < arr_length; i++) {
            allChanges[i] = publicProjects[projectIDX].changes[i].changeCID;
        }

        return allChanges;
    }

    function getProjectChangeProposals(string memory _projectName) ProjectExist(_projectName) external view returns (string[] memory) {
        uint projectIDX = NameToID[_projectName];
        uint arr_length = publicProjects[projectIDX].changeProposals.length;
        string[] memory allChanges = new string[](arr_length);

        for (uint256 i = 0; i < arr_length; i++) {
            allChanges[i] = publicProjects[projectIDX].changeProposals[i].changeCID;
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
}

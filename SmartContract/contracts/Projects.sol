// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;
import "@openzeppelin/contracts/utils/structs/EnumerableMap.sol";
import "./Changes.sol";
import "./ProjectsToken.sol";


contract Projects {
    // initiate all the data structures and constants saved on the smart contract
    uint public constant TimeLockInterval = 4 minutes;
    uint public constant ClaimingInterval = 2 minutes;

    using EnumerableSet for EnumerableSet.AddressSet;
    using ChangesLibrary for ChangesLibrary.changesMap;

    
    // -------------------------------------------------------- Mappings
    mapping(string => uint) public NameToID;    

    // -------------------------------------------------------- Structs
    struct Vote {
        bool VotedToChangeProposal;
        bool VotedToChangeRemoval;
    }

    struct Participant {
        mapping(string => Vote) voted;
        mapping(uint => uint) TokensSpent;
        uint pendingTokens;
    }

    struct Project {
        string name;
        ChangesLibrary.changesMap changes;
        uint DistributionTime;
        uint newTokens;
        EnumerableSet.AddressSet participants;
        mapping(address => Participant) participant;
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
    function createProject(
        string memory changeCID, 
        string memory projectName
    ) public {
        uint newProjectID = publicProjects.length;
        NameToID[projectName] = newProjectID;
        token.mint(msg.sender, newProjectID, 100, "");
        
        Project storage newProject = publicProjects.push();
        newProject.name = projectName;
        newProject.changes.initialize(changeCID);
        newProject.newTokens = 100;
        newProject.DistributionTime = block.timestamp + TimeLockInterval; 
        newProject.participants.add(msg.sender);

        emit NewProjectCreated("New project ", projectName, newProjectID);
    }


    // the functions create a change proposal
    function uploadChangeProposal(
        string memory changeCID, 
        string calldata projectName
    ) ProjectExist(projectName) external {
        uint projectID = NameToID[projectName];
        publicProjects[projectID].changes.createChangeProposal(changeCID);
        publicProjects[projectID].participant[msg.sender].voted[changeCID].VotedToChangeProposal = true;
        emit NewChangeProposalCreated("New change proposal ", projectName, changeCID, projectID);
    }

    
    function isVoted(
        address addr,
        string calldata changeProposalCID,
        bool isChange,
        string calldata projectName
    ) ProjectExist(projectName) view external returns (bool) {
        uint projectID = NameToID[projectName];
        return isChange ? publicProjects[projectID].participant[addr].voted[changeProposalCID].VotedToChangeProposal
                        : publicProjects[projectID].participant[addr].voted[changeProposalCID].VotedToChangeRemoval;
    }


    // the function make a go Back 
    function acceptRemoval(
        string calldata changeCID,
        string calldata projectName 
    ) ProjectExist(projectName) external {
        uint projectID = NameToID[projectName];
        require(getChangeVotes(changeCID, false, projectName)*2 > token.totalSupply(projectID));

        address participant;
        for (uint index = 0; index < publicProjects[projectID].participants.length(); index++) {
            participant = publicProjects[projectID].participants.at(index);
            delete publicProjects[projectID].participant[participant].voted[changeCID];
        }
        
        publicProjects[projectID].changes.removeChange(changeCID);
        emit ProjectWentBack("Removal Accepted ", changeCID, projectName);
    }


    // the functions accept a change proposal and add it to the list
    function acceptChangeProposal(
        string calldata changeProposalCID,
        string calldata projectName
    ) ProjectExist(projectName) external {
        uint projectID = NameToID[projectName];
        require(publicProjects[projectID].changes.getChangeMaker(changeProposalCID) == msg.sender, "only the change proposal creator can accept");
        require(getChangeVotes(changeProposalCID, true, projectName)*2 > token.totalSupply(projectID));
        publicProjects[projectID].participants.add(msg.sender);
        publicProjects[projectID].changes.acceptChangeProposal(changeProposalCID);

        emit NewChangeIsMadeToProject("new change", projectName, changeProposalCID);
    }


    // the function allow user to vote in favor of a change proposal
    function voteForChangeProposal(
        string memory changeProposalCID, 
        bool isChange,
        string calldata projectName
    ) ProjectExist(projectName) external {
        uint projectID = NameToID[projectName];
        if (isChange) {
            require(!publicProjects[projectID].participant[msg.sender].voted[changeProposalCID].VotedToChangeProposal, "Already voted");
        } else {
            require(!publicProjects[projectID].participant[msg.sender].voted[changeProposalCID].VotedToChangeRemoval, "Already voted");
        }

        uint votingPower = token.balanceOf(msg.sender, projectID);
        require(votingPower >= 0, "insufficient tokens");

        if (isChange) {
            publicProjects[projectID].participant[msg.sender].voted[changeProposalCID].VotedToChangeProposal = true;
        } else {
            publicProjects[projectID].participant[msg.sender].voted[changeProposalCID].VotedToChangeRemoval = true;
        }
        emit NewVoteForChangeProposal(
            "New vote for change proposal:",
            projectName,
            changeProposalCID,
            msg.sender
        );
    }

    function getChangeVotes(
    string calldata changeCID,
    bool isChange,
    string calldata projectName
    ) ProjectExist(projectName) public view returns (uint) {
        uint projectID = NameToID[projectName];
        uint votes = 0;
        address participant;
        for (uint index = 0; index < publicProjects[projectID].participants.length(); index++) {
            participant = publicProjects[projectID].participants.at(index);
            if (isChange ? publicProjects[projectID].participant[participant].voted[changeCID].VotedToChangeProposal 
                         : publicProjects[projectID].participant[participant].voted[changeCID].VotedToChangeRemoval) {
                votes += token.balanceOf(participant, projectID);
            }
        }
        return votes;
    }


    function removeVote(
        string calldata changeCID,
        bool isChange,
        string memory projectName
    ) ProjectExist(projectName) external {
        uint projectID = NameToID[projectName];
        
        if (isChange) {
            require(publicProjects[projectID].participant[msg.sender].voted[changeCID].VotedToChangeProposal);
            publicProjects[projectID].participant[msg.sender].voted[changeCID].VotedToChangeProposal = false;
        } else {
            require(publicProjects[projectID].participant[msg.sender].voted[changeCID].VotedToChangeRemoval);
            publicProjects[projectID].participant[msg.sender].voted[changeCID].VotedToChangeRemoval = false;
        }
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


    function getParticipants(
        string calldata projectName
    ) ProjectExist(projectName) external view returns (address[] memory) {
        uint projectID = NameToID[projectName];
        return publicProjects[projectID].participants.values(); 
    }


    function getChangeMaker(
        string calldata projectName,
        string calldata changeCID
    ) ProjectExist(projectName) external view returns (address) {
        uint projectID = NameToID[projectName];
        return publicProjects[projectID].changes.getChangeMaker(changeCID);
    }

    function getLastProjects() external view returns (string[] memory) {
        uint arr_length = publicProjects.length;
        string[] memory projects = new string[](arr_length);
        for (uint i = 0; i < arr_length; i++) {
            projects[i] = publicProjects[i].name; 
        }
        return projects;
    }
}

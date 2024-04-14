// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

library ChangesLibrary {
    // data structures initiate on new linked list
    struct Change {
        address changeMaker;
        uint votes;

        // pointers
        string next;
        string before;
    }

    struct ChangesStorage {
        mapping(string => Change) changes;
        string headChanges;
        string headChangeProposals;
    }

    // create new linkedList
    function initialize(
        ChangesStorage storage self, 
        string memory baseChangeCID
    ) external {
        self.changes[baseChangeCID] = Change(msg.sender, 10, "Changes", "Changes");
        self.headChanges = baseChangeCID;
        self.headChangeProposals = "ChangeProposals";
    }

    // create a change proposal and add it to the list
    function createChangeProposal(
        ChangesStorage storage self, 
        string memory changeCID, 
        uint votes
    ) external {
        self.changes[changeCID] = Change({changeMaker: msg.sender, votes: votes, next: "ChangeProposals", before: self.headChangeProposals});
        self.changes[self.headChangeProposals].next = changeCID;
        self.headChangeProposals = changeCID;
    }

    // add voting power to the amount of votes in a change proposal
    function voteForChangeProposal(
        ChangesStorage storage self, 
        string memory changeCID, 
        uint votes
    ) external {
        self.changes[changeCID].votes += votes; 
    }

    // the function returns the amount of votes a change proposal recived
    function getChangeProposalVotes(
        ChangesStorage storage self, 
        string memory changeCID
    ) external view returns (uint) {
        return self.changes[changeCID].votes;
    }

    // the function create a new change by moving a change proposal from it's list to the changes list
    function acceptChangeProposal(
        ChangesStorage storage self, 
        string memory changeCID
    ) external {
        
        if (self.changes[self.changes[changeCID].next].changeMaker != address(0)) {
            self.changes[self.changes[changeCID].next].before = self.changes[changeCID].before;
        } else {
            self.headChangeProposals = self.changes[changeCID].before;
        }
        self.changes[self.changes[changeCID].before].next = self.changes[changeCID].next; 

        self.changes[self.headChanges].next = changeCID;
        self.changes[changeCID].before = self.headChanges;
        self.changes[changeCID].next = "Changes";
        self.headChanges = changeCID;
    }

    // the function returns the two lists
    function getChangesOrChangeProposals(
        ChangesStorage storage self, 
        bool ChangesOrChangeProposals
    ) external view returns (string[] memory) {
        uint proposalCount = getChangesOrChangeProposalsCount(self, ChangesOrChangeProposals);
        string[] memory returnedList = new string[](proposalCount);
        
        string memory current = ChangesOrChangeProposals ? self.headChanges : self.headChangeProposals;

        for (uint i = 0; i < proposalCount; i++) {
            returnedList[proposalCount - i - 1] = current;
            current = self.changes[current].before;
        }
        
        return returnedList;
    }

    // the function returns the number of changes/change proposals in a project
    function getChangesOrChangeProposalsCount(
        ChangesStorage storage self, 
        bool ChangesOrChangeProposals
    ) public view returns (uint) {
        uint count = 0;

        string memory currentProposal = ChangesOrChangeProposals ? self.headChanges : self.headChangeProposals;

        while (self.changes[currentProposal].changeMaker != address(0)) {
            count++;
            currentProposal = self.changes[currentProposal].before;
        }
        return count;
    }

    function getChangeMaker(
        ChangesStorage storage self, 
        string calldata patch
    ) external view returns (address) {
        return self.changes[patch].changeMaker;
    }

    // the function returns the number of changes/change proposals in a project
    function getAddresses(
        ChangesStorage storage self
    ) public view returns (address[] memory) {
        uint count = 0;
        uint proposalCount = getChangesOrChangeProposalsCount(self, true) + getChangesOrChangeProposalsCount(self, false);
        address[] memory returnedList = new address[](proposalCount);
        string memory currentProposal = self.headChanges;
        while (self.changes[currentProposal].changeMaker != address(0)) {
            returnedList[count] = self.changes[currentProposal].changeMaker;
            count++;
            currentProposal = self.changes[currentProposal].before;
        }

        currentProposal = self.headChangeProposals;
        while (self.changes[currentProposal].changeMaker != address(0)) {
            returnedList[count] = self.changes[currentProposal].changeMaker;
            count++;
            currentProposal = self.changes[currentProposal].before;
        }
        return returnedList;
    }

    // the function make a go back
    function goBack(ChangesStorage storage self, string memory changeCID) external {
        self.changes[self.changes[changeCID].before].next = "Changes";
        
        self.changes[changeCID].before = self.headChangeProposals;
        self.changes[changeCID].next = "ChangeProposals";
    }
}
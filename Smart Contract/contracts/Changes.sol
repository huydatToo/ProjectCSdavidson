// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

library ChangesLibrary {

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

    function initialize(ChangesStorage storage self, string memory baseChangeCID) external {
        self.changes[baseChangeCID] = Change(msg.sender, 10, "Changes", "Changes");
        self.headChanges = baseChangeCID;
        self.headChangeProposals = "ChangeProposals";
    }

    function createChangeProposal(ChangesStorage storage self, string memory changeCID, uint votes) external {
        self.changes[changeCID] = Change({changeMaker: msg.sender, votes: votes, next: "ChangeProposals", before: self.headChangeProposals});
        self.changes[self.headChangeProposals].next = changeCID;
        self.headChangeProposals = changeCID;
    }

    function voteForChangeProposal(ChangesStorage storage self, string memory changeCID, uint votes) external {
        self.changes[changeCID].votes += votes; 
    }

    function getChangeProposalVotes(ChangesStorage storage self, string memory changeCID) external view returns (uint) {
        return self.changes[changeCID].votes;
    }

    function acceptChangeProposal(ChangesStorage storage self, string memory changeCID) external {
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

    function getChangesOrChangeProposals(ChangesStorage storage self, bool ChangesOrChangeProposals) external view returns (string[] memory) {
        uint256 proposalCount = getChangesOrChangeProposalsCount(self, ChangesOrChangeProposals);
        string[] memory returnedList = new string[](proposalCount);
        
        string memory current = ChangesOrChangeProposals ? self.headChanges : self.headChangeProposals;

        for (uint256 i = 0; i < proposalCount; i++) {
            returnedList[i] = current;
            current = self.changes[current].before;
        }
        
        return returnedList;
    }

    function getChangesOrChangeProposalsCount(ChangesStorage storage self, bool ChangesOrChangeProposals) public view returns (uint) {
        uint count = 0;

        string memory currentProposal = ChangesOrChangeProposals ? self.headChanges : self.headChangeProposals;

        while (self.changes[currentProposal].changeMaker != address(0)) {
            count++;
            currentProposal = self.changes[currentProposal].before;
        }
        return count;
    }

    function goBack(ChangesStorage storage self, string memory changeCID) external {
        self.changes[self.changes[changeCID].before].next = "Changes";
        
        self.changes[changeCID].before = self.headChangeProposals;
        self.changes[changeCID].next = "ChangeProposals";
    }
}
// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

library ChangesLibrary {
    // data structures initiate on new linked list

    string public constant headChanges = "Changes";
    string public constant headChangeProposals = "ChangeProposals";


    struct Change {
        address changeMaker;

        // pointers
        string before;
    }

    struct changesMap {
        mapping(string => Change) changes;
    }



    // create new linkedList
    function initialize(
        changesMap storage self,
        string memory baseChangeCID
    ) external {
        self.changes[baseChangeCID] = Change(msg.sender, headChanges);
        self.changes[headChanges].before = baseChangeCID;
    }


    // create a change proposal and add it to the list
    function createChangeProposal(
        changesMap storage self,
        string memory changeCID
    ) external {
        self.changes[changeCID] = Change({changeMaker: msg.sender, before: self.changes[headChangeProposals].before});
        self.changes[changeCID].before = self.changes[headChangeProposals].before;
        self.changes[headChangeProposals].before = changeCID;
    }


    // the function create a new change by moving a change proposal from it's list to the changes list
    function acceptChangeProposal(
        changesMap storage self,
        string memory changeCID
    ) external {
        string memory changeCIDpointer = headChangeProposals;
        while (keccak256(abi.encodePacked(self.changes[changeCIDpointer].before)) != keccak256(abi.encodePacked(changeCID))) {
            changeCIDpointer = self.changes[changeCIDpointer].before;
        }

        self.changes[changeCIDpointer].before = self.changes[changeCID].before;
        self.changes[changeCID].before = self.changes[headChanges].before;
        self.changes[headChanges].before = changeCID;
    }


    // the function returns the two lists
    function getChangesOrChangeProposals(
        changesMap storage self,
        bool ChangesOrChangeProposals
    ) external view returns (string[] memory) {
        uint proposalCount = getChangesOrChangeProposalsCount(self, ChangesOrChangeProposals);
        string[] memory returnedList = new string[](proposalCount);
        
        string memory current = ChangesOrChangeProposals ? self.changes[headChanges].before : self.changes[headChangeProposals].before;

        for (uint i = 0; i < proposalCount; i++) {
            returnedList[proposalCount - i - 1] = current;
            current = self.changes[current].before;
        }
        
        return returnedList;
    }



    // the function returns the number of changes/change proposals in a project
    function getChangesOrChangeProposalsCount(
        changesMap storage self,
        bool ChangesOrChangeProposals
    ) public view returns (uint) {
        uint count = 0;

        string memory currentProposal = ChangesOrChangeProposals ? headChanges : headChangeProposals;

        while (self.changes[self.changes[currentProposal].before].changeMaker != address(0)) {
            count++;
            currentProposal = self.changes[currentProposal].before;
        }
        return count;
    }


    function getChangeMaker(
        changesMap storage self,
        string calldata patch
    ) external view returns (address) {
        return self.changes[patch].changeMaker;
    }


    // the function make a go back
    function removeChange(
        changesMap storage self,
        string memory changeCID) external 
    {
        string memory changeCIDpointer = headChanges;

        while (keccak256(abi.encodePacked(self.changes[changeCIDpointer].before)) != keccak256(abi.encodePacked(changeCID))) {
            changeCIDpointer = self.changes[changeCIDpointer].before;
        }

        if (keccak256(abi.encodePacked(self.changes[changeCID].before)) != keccak256(abi.encodePacked(headChanges))) {
            self.changes[changeCIDpointer].before = self.changes[changeCID].before;
        } else {
            self.changes[changeCIDpointer].before = headChanges;
        }
        self.changes[changeCID].before = self.changes[headChangeProposals].before;
        self.changes[headChangeProposals].before = changeCID;
    }
}

export const CONTRACT_ADDRESS = "0xB9727bF609b7608759b56220Ff546B79E4DBe0Da"
export const CONTRACT_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_tokenAddress",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "string",
        "name": "message",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "projectName",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "changeCID",
        "type": "string"
      }
    ],
    "name": "NewChangeIsMadeToProject",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "string",
        "name": "message",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "Name",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "CID",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "indexValue",
        "type": "uint256"
      }
    ],
    "name": "NewChangeProposalCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "string",
        "name": "message",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "NewProjectCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "string",
        "name": "message",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "projectName",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "changeProposalCID",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "voter",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "votes",
        "type": "uint256"
      }
    ],
    "name": "NewVoteForChangeProposal",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "string",
        "name": "message",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "changeCID",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "ProjectName",
        "type": "string"
      }
    ],
    "name": "ProjectWentBack",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "string",
        "name": "message",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "lastDistributionTime",
        "type": "uint256"
      }
    ],
    "name": "TokensDisributed",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_changeCID",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_projectName",
        "type": "string"
      }
    ],
    "name": "MakeChangeProposal",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_changeCID",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_projectName",
        "type": "string"
      }
    ],
    "name": "MakeGoBackProposal",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "name": "NameToID",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "TimeLockInterval",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_proposedChangeCID",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_projectName",
        "type": "string"
      }
    ],
    "name": "acceptChangeProposal",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_projectName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_changeCID",
        "type": "string"
      }
    ],
    "name": "acceptGoBack",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_CID",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "projectName",
        "type": "string"
      }
    ],
    "name": "createProject",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_UserAddress",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "_projectName",
        "type": "string"
      }
    ],
    "name": "getBalance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_projectName",
        "type": "string"
      },
      {
        "internalType": "bool",
        "name": "changesOrChangeProposals",
        "type": "bool"
      }
    ],
    "name": "getChangesOrProposals",
    "outputs": [
      {
        "internalType": "string[]",
        "name": "",
        "type": "string[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getLastProjects",
    "outputs": [
      {
        "internalType": "string[]",
        "name": "",
        "type": "string[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "token",
    "outputs": [
      {
        "internalType": "contract ProjectsToken",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_changeProposalCID",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_projectName",
        "type": "string"
      }
    ],
    "name": "voteForChangeProposal",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "usr",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "projectName",
        "type": "string"
      }
    ],
    "name": "getDistributionBalanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address[]",
        "name": "recipients",
        "type": "address[]"
      },
      {
        "internalType": "uint256[]",
        "name": "amounts",
        "type": "uint256[]"
      },
      {
        "internalType": "string",
        "name": "projectName",
        "type": "string"
      }
    ],
    "name": "distribute",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "projectName",
        "type": "string"
      }
    ],
    "name": "startDistribution",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "projectName",
        "type": "string"
      }
    ],
    "name": "claimPendingTokens",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]
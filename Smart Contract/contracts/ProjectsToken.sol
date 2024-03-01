// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "../node_modules/@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";
import "../node_modules/@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";

contract ProjectsToken is ERC1155, Ownable {
    constructor() ERC1155("uri") {

    }

    function mint(address account, uint256 id, uint256 amount) public {
        _mint(account, id, amount, "");
    }

}

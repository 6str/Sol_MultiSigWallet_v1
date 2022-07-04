/* istanbul ignore file */
// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.7;

/** @title A helper contract for MultiSigWallet testing
    @dev used to create a failed transaction unit test, and a reentrancy attack test
*/

interface IMultiSigWallet {
  function execute(uint) external;
}

contract TestsHelper {
    
    IMultiSigWallet private immutable mswContract;
    uint txId;

    /// @param _mswAddr receives the MultiSigWallet contract address
    constructor(address _mswAddr) {
        mswContract = IMultiSigWallet(_mswAddr);
    }


    /// @dev attempts reentrancy attack on the execute function
    fallback() external payable {
        if(address(mswContract).balance >= 1 ether){

            mswContract.execute(txId);
        }
    }


    /// @dev rejects payment to create transaction failure for test
    receive() external payable {
        revert("receiver rejected transfer");
    }


    /// @dev sets up the target transaction ID for reentrancy attack
    function txIdSetup(uint _txId) external {
        txId = _txId;
    }
}
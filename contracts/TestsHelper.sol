/* istanbul ignore file */
// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.7;

//import "hardhat/console.sol";

interface IMultiSigWallet {
  function execute(uint) external;
}

contract TestsHelper {
    
    IMultiSigWallet private immutable mswContract;
    uint txId;


    constructor(address _mswAddr) {
        mswContract = IMultiSigWallet(_mswAddr);
    }


    /*  attempts reentrancy attack */
    fallback() external payable {
        if(address(mswContract).balance >= 1 ether){
            //console.log("--->> TestHelper contract attempting reentrancy attack - re-execute txId:", txId);
            mswContract.execute(txId);
        }
    }


    /*  rejects payment to create transaction failure for test    */
    receive() external payable {
        // failed transaction test
        revert("receiver rejected transfer");
    }


    /*  the target transaction ID for reentrancy attack    */ 
    function txIdSetup(uint _txId) external {
        txId = _txId;
    }
}
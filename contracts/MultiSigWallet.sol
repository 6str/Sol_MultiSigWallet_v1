// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.7;

/** 
*   @title Multi Sig Wallet v1
*   @notice basic multi sig wallet
*/
contract MultiSigWallet {
    event Deposit(address indexed by, uint amount);
    event Submitted(address indexed by, uint indexed txId, address indexed to, uint amount);
    event Approved(address indexed by, uint indexed txId);
    event Revoked(address indexed by, uint indexed txId);
    event Executed(address indexed by, uint indexed txId);

    // transaction definition
    struct Transaction {
        address to;
        uint amount;
        bytes data;
        bool executed;
    }


    // Array of owner addresses
    address[] public owners;
    // Mapping quick lookup of owner addresses
    mapping (address => bool) public isOwner;
    // Number of signatures required to allow a transaction to be executed
    uint public sigsRequired;

    // Array of transactions
    Transaction[] public transactions;
    // Mapping of approvals. Transaction ID => approver's address => bool
    mapping(uint => mapping(address => bool)) public approved;

    
    /**
    *   @dev constructor ensures the contract is instantiated with a minimum of 
    *   2 owners and a 2 signature requirement. Owner addresses validation checks
    *   for 0 address and duplicate addresses
    */
    constructor(address[] memory _owners, uint _sigsRequired) payable {

        require(_owners.length >= 2, "min 2 owners required");
        require(_sigsRequired >= 2, "min 2 sigs required");
        require(_sigsRequired <= _owners.length, "sigs required > owners");

        for(uint i; i < _owners.length; ++i) {
            address _owner = _owners[i];

            require(_owner != address(0), "zero address not valid");
            require(!isOwner[_owner], "duplicate owner");
            
            owners.push(_owner);
            isOwner[_owner] = true;
        }
        
        sigsRequired = _sigsRequired;        
    }

    /// @dev reverts if msg.sender is not in the owners mapping
    modifier onlyOwner {
        require(isOwner[msg.sender], "only owners");
        _;
    }

    /// @dev sequential txn IDs correspond to position in transactions array, so last txID is always .length - 1
    modifier txExists(uint _txId) {
        require(_txId < transactions.length, "invalid transaction ID");
        _;
    }

    /// @dev reverts if txn has already been approved by msg.sender
    modifier notApproved(uint _txId) {
        require(!approved[_txId][msg.sender], "already approved");
        _;
    }

    /// @dev reverts if txn has already been executed
    modifier notExecuted(uint _txId) {
        require(!transactions[_txId].executed, "already executed");
        _;
    }


    fallback() external payable {
        emit Deposit(msg.sender, msg.value);
    }


    receive() external payable {
        emit Deposit(msg.sender, msg.value);
    }

    /// @dev Checks the to address not 0. Adds txn to transactions array and sets approved for submitter's address
    /// @dev submitter's approval implicit
    function submit(address _to, uint _amount, bytes calldata _data) external onlyOwner {
        require(_to != address(0), "address 0");
        
        Transaction memory _txn = Transaction({
            to: _to,
            amount: _amount,
            data: _data,
            executed: false
        });

        uint _txId = transactions.length;
        transactions.push(_txn);
        approved[_txId][msg.sender] = true;
        emit Submitted(msg.sender, _txId, _to, _amount);
        emit Approved(msg.sender, _txId);
    }

    /// @dev Sets txn approved by msg.sender
    function approve(uint _txId) external onlyOwner txExists(_txId) notApproved(_txId) notExecuted(_txId) {
        approved[_txId][msg.sender] = true;
        emit Approved(msg.sender, _txId);
    }

    /// @dev Unsets an existing approval for txn ID mapped to msg.sender's address
    function revoke(uint _txId) external onlyOwner txExists(_txId) notExecuted(_txId) {
        require(approved[_txId][msg.sender], "no approval to revoke");
        approved[_txId][msg.sender] = false;
 
        emit Revoked(msg.sender, _txId);
    }

    /// @dev Executes valid txns with the required number of approvals
    /// protected from reentrancy by txId notExecuted check/state
    function execute(uint _txId) external onlyOwner txExists(_txId) notExecuted(_txId) {
        uint _numApprovals;

        for(uint i; i < owners.length; ++i) {
            if(approved[_txId][owners[i]]) ++_numApprovals;
        }
   
        require(_numApprovals >= sigsRequired, "not enough approvals");

        transactions[_txId].executed = true;
        Transaction memory _txn = transactions[_txId];

        (bool ok, ) = _txn.to.call{value: _txn.amount}(_txn.data);
        require(ok, "execution failed");

        emit Executed(msg.sender, _txId);
    }
}

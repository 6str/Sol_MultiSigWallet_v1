// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.7;


contract MultiSigWallet {
    event Deposit(address indexed by, uint amount);
    event Submitted(address indexed by, uint indexed txId, address indexed to, uint amount);
    event Approved(address indexed by, uint indexed txId);
    event Revoked(address indexed by, uint indexed txId);
    event Executed(address indexed by, uint indexed txId);


    struct Transaction {
        address to;
        uint amount;
        bytes data;
        bool executed;
    }


    address[] public owners;
    uint public sigsRequired;
    mapping (address => bool) public isOwner;


    Transaction[] public transactions;
    mapping(uint => mapping(address => bool)) public approved; //txId => approver => bool


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


    modifier onlyOwner {
        require(isOwner[msg.sender], "only owners");
        _;
    }


    modifier txExists(uint _txId) {
        require(_txId < transactions.length, "invalid transaction ID");
        _;
    }


    modifier notApproved(uint _txId) {
        require(!approved[_txId][msg.sender], "already approved");
        _;
    }

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
    }


    function approve(uint _txId) external onlyOwner txExists(_txId) notApproved(_txId) notExecuted(_txId) {
        approved[_txId][msg.sender] = true;
        emit Approved(msg.sender, _txId);
    }


    function revoke(uint _txId) external onlyOwner txExists(_txId) notExecuted(_txId) {
        require(approved[_txId][msg.sender], "no approval to revoke");
        approved[_txId][msg.sender] = false;
 
        emit Revoked(msg.sender, _txId);
    }


    function execute(uint _txId) external onlyOwner txExists(_txId) notExecuted(_txId) {
        uint _numApprovals;

        for(uint i; i < owners.length; ++i) {
            if(approved[_txId][owners[i]]) ++_numApprovals;
        }
   
        require(_numApprovals >= sigsRequired, "not enough approvals");

        Transaction memory _txn = transactions[_txId];
        transactions[_txId].executed = true;

        (bool ok, ) = _txn.to.call{value: _txn.amount}(_txn.data);
        require(ok, "execution failed");

        emit Executed(msg.sender, _txId);
    }
}
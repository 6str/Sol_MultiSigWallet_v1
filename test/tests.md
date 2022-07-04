// todo
// i found it didn't work with using etherChangeBalance. the first condition always passed
// it could have something do with txn = await inside the expect as that is different
// check couple of .and using in deposit tests and several in execute
// had some closeTo examples that should try to write down as example

// expect(toBalAfter).to.be.closeTo(toBalBefore.add(txn.amt), gasAllowance) // this works but maybe not best solution

// keep and example of changeEtherBalance 
// couldn't use with another test and .and. seeems the first test before always passes if chain two //// dissimilar tests. have seen chains of tests in docs but they were kind of same type of test.
// and using .and apparently .and doesn't actually do anything
// .to.changeEtherBalance(multiSigWallet, params.value)
// .to.changeEtherBalance(multiSigWallet, txn.amt.mul(-1))

    // toBalBefore = await(provider.getBalance(txn.to))
    // await expect(tx = await multiSigWallet.connect(executor).execute(txn.txId))
    //   .to.emit(multiSigWallet, 'Executed')
    //   .withArgs(executor.address, txn.txId)

    //   .to.changeEtherBalance(multiSigWallet, -txn.amt)

    // receipt = await tx.wait()
    // gasCost = receipt.cumulativeGasUsed.mul(receipt.effectiveGasPrice)
    // toBalAfter = await(provider.getBalance(txn.to))
    // expect(toBalAfter).to.equal(toBalBefore.add(txn.amt).sub(gasCost))
  
    // //executor is not receiver
    // executor = srs[0]
    // txn = txn2
    
    // toBalBefore = await(provider.getBalance(txn.to))
    // await expect(multiSigWallet.connect(executor).execute(txn.txId))
    //   .to.emit(multiSigWallet, 'Executed')
    //   .withArgs(executor.address, txn.txId)
    //   .to.changeEtherBalance(multiSigWallet, -txn.amt)

    // toBalAfter = await(provider.getBalance(txn.to))
    // expect(toBalAfter).to.equal(toBalBefore.add(txn.amt))


normal deployment
expect succeeds
1 owners 1 sigaRequired
2 owners 2 sigsRequired
3 owners 1 sigsRequired
3 owners 2 sigsRequired
3 owners 3 sigsRequired

expect fails
0 owners 0 sigsRequired
0 owners 1 sigaRequired
0 owners 2 sigaRequired
1 owners 0 sigaRequired ???
2 owners 0 sigsRequired ???
1 owners 2 sigsRequired
2 owners 3 sigsRequired
4 owners 5 sigsRequired

2 owners 1 sig : owners duplicated
5 owners 2 sigs : owners 1 & 5 are dups

3 owners 1 sig : owner 1,2,3 is zero address


delete owners also check for enough remaining owners for sig requirements
what about admin owners. if onwer can add other owners the can game the wallet and add there own addresses as additional owners.
timelock txn?


approves
    function approve(uint _txId) external onlyOwner txExists(_txId) notApproved(_txId) notExecuted(_txId) {
        approved[_txId][msg.sender] = true;
        emit Approved(msg.sender, _txId);
    }

approves transaction
2nd of 3 1st of 3 3rd of three

doesnt
not owner
tx dont exist
already approved 
already executed



    revoke fail
    not owner
    txId no exist
    txId already executed
    txId not approved by user


    execute
    success : check balances etc.

    fails
    not owner
    already excuted
    not enough approvals
    txId no exists
    execution fails: trapped/revert with message e.g. no enough balance


    add owner
    rem owner
    set sigsRequired
    and to do any of these things you need to have sigsRequired approvals to do it
    how would that work?

removeTxn?

    function _addOwner(address _owner) private {

    }

    function _remOwner(address _owner) private {

    }

    function _setSigsRequired(uint _sigRequired) {

    }

    enum taskType {
        addOwner,
        remOwner,
        setSigsRequired
    }

    stuct adminTask {
        addOwner;

    }

    struct adminTxn {
        adminTask
    }

    
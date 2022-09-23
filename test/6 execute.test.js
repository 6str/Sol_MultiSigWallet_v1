const { expect } = require("chai");
const { providers, Contract } = require("ethers");
const { ethers } = require("hardhat");
const  provider = ethers.provider;


describe("Execute transactions", function () {
  let srs, MultiSigWallet, multiSigWallet
  let submitter, amount, approver

  assignSigners = async () => srs = await hre.ethers.getSigners()
  assignSigners()
  
  before('deploy contract', async function () {
    MultiSigWallet = await ethers.getContractFactory("MultiSigWallet")
    multiSigWallet = await MultiSigWallet.deploy([srs[0].address, srs[1].address, srs[2].address], 2)
    multiSigWallet.deployed()

    TestsHelper = await ethers.getContractFactory("TestsHelper")
    testsHelper = await TestsHelper.deploy(multiSigWallet.address)
    testsHelper.deployed()

    /// @dev contract needs eth for executions
    await srs[0].sendTransaction({
      to: multiSigWallet.address,
      value: ethers.utils.parseEther('10')
    })
 
    /// @dev set up transactions: contract state for tests
    amount = ethers.BigNumber.from('1000000000000000000')
    txn0 = {txId: 0, to: srs[0].address, amt: amount}
    txn1 = {txId: 1, to: srs[1].address, amt: amount}
    txn2 = {txId: 2, to: srs[2].address, amt: amount}
    txn3 = {txId: 3, to: srs[3].address, amt: amount}
    txn4 = {txId: 4, to: srs[3].address, amt: amount}
    txn5 = {txId: 5, to: srs[3].address, amt: amount}
    txn6 = {txId: 6, to: testsHelper.address, amt: amount} // for txn failed (externally) test
    txn9 = {txId: 9, to: srs[3].address, amt: amount}  // not submitted used for txn not exist tests
    txn10 = {txId: 10, to: srs[3].address, amt: amount} // ditto

    // valid txn tests
    txn = txn0
    submitter = srs[0]
    approver = srs[1]
    multiSigWallet.connect(submitter).submit(txn.to, txn.amt, [])
    multiSigWallet.connect(approver).approve(txn.txId)
    
    txn = txn1
    submitter = srs[0]
    approver = srs[1]
    multiSigWallet.connect(submitter).submit(txn.to, txn.amt, [0x12])
    multiSigWallet.connect(approver).approve(txn.txId)

    txn = txn2
    submitter = srs[1]
    approver = srs[2]
    multiSigWallet.connect(submitter).submit(txn.to, txn.amt, [])
    multiSigWallet.connect(approver).approve(txn.txId)

    txn = txn3
    submitter = srs[1]
    approver = srs[2]
    multiSigWallet.connect(submitter).submit(txn.to, txn.amt, [0x12])
    multiSigWallet.connect(approver).approve(txn.txId)

    // not enough approvers tests
    txn = txn4        
    submitter = srs[1]
    approver = srs[2]
    multiSigWallet.connect(submitter).submit(txn.to, txn.amt, [])
    
    txn = txn5
    submitter = srs[1]
    approver = srs[2]
    multiSigWallet.connect(submitter).submit(txn.to, txn.amt, [0x12])

    // failed txn test. TestHelper receive() will reject
    txn = txn6        
    submitter = srs[1]
    approver = srs[2]
    multiSigWallet.connect(submitter).submit(txn.to, txn.amt, [])
    multiSigWallet.connect(approver).approve(txn.txId)
  })


  it("executes valid executions", async function () {

    /// @dev where the executor is also the receiver need to account for txn gas when check to address balance
    txn = txn0
    executor = srs[0]
    
    toBalBefore = await(provider.getBalance(txn.to))
    fromBalBefore = await(provider.getBalance(multiSigWallet.address))
    
    await expect(tx = await multiSigWallet.connect(executor).execute(txn.txId))
      .to.emit(multiSigWallet, 'Executed')
      .withArgs(executor.address, txn.txId)
    
    receipt = await tx.wait()
    gasCost = receipt.cumulativeGasUsed.mul(receipt.effectiveGasPrice)
    toBalAfter = await(provider.getBalance(txn.to))
    expect(toBalAfter).to.equal(toBalBefore.add(txn.amt).sub(gasCost))
    
    fromBalAfter = await(provider.getBalance(multiSigWallet.address))
    expect(fromBalAfter).to.equal(fromBalBefore.sub(txn.amt))
  

    txn = txn1
    executor = srs[1]
    
    toBalBefore = await(provider.getBalance(txn.to))
    fromBalBefore = await(provider.getBalance(multiSigWallet.address))
    
    await expect(tx = await multiSigWallet.connect(executor).execute(txn.txId))
      .to.emit(multiSigWallet, 'Executed')
      .withArgs(executor.address, txn.txId)
    
    receipt = await tx.wait()
    gasCost = receipt.cumulativeGasUsed.mul(receipt.effectiveGasPrice)
    toBalAfter = await(provider.getBalance(txn.to))
    expect(toBalAfter).to.equal(toBalBefore.add(txn.amt).sub(gasCost))
    
    fromBalAfter = await(provider.getBalance(multiSigWallet.address))
    expect(fromBalAfter).to.equal(fromBalBefore.sub(txn.amt))

  
    //executor is not receiver
    txn = txn2
    executor = srs[0]
        
    toBalBefore = await(provider.getBalance(txn.to))
    fromBalBefore = await(provider.getBalance(multiSigWallet.address))

    await expect(multiSigWallet.connect(executor).execute(txn.txId))
      .to.emit(multiSigWallet, 'Executed')
      .withArgs(executor.address, txn.txId)
    
    toBalAfter = await(provider.getBalance(txn.to))
    expect(toBalAfter).to.equal(toBalBefore.add(txn.amt))

    fromBalAfter = await(provider.getBalance(multiSigWallet.address))
    expect(fromBalAfter).to.equal(fromBalBefore.sub(txn.amt))


    txn = txn3
    executor = srs[1]
        
    toBalBefore = await(provider.getBalance(txn.to))
    fromBalBefore = await(provider.getBalance(multiSigWallet.address))

    await expect(multiSigWallet.connect(executor).execute(txn.txId))
      .to.emit(multiSigWallet, 'Executed')
      .withArgs(executor.address, txn.txId)
    
    toBalAfter = await(provider.getBalance(txn.to))
    expect(toBalAfter).to.equal(toBalBefore.add(txn.amt))

    fromBalAfter = await(provider.getBalance(multiSigWallet.address))
    expect(fromBalAfter).to.equal(fromBalBefore.sub(txn.amt))
  })

  
  it("rejects when txId already executed", async function () {
    revertMessage = "already executed"

    txn = txn1
    executor = srs[0]
    await expect(multiSigWallet.connect(executor).execute(txn.txId))
      .to.revertedWith(revertMessage)
    
    txn = txn2
    executor = srs[1]
    await expect(multiSigWallet.connect(executor).execute(txn.txId))
      .to.revertedWith(revertMessage)
  })


  it("rejects execution by non owner", async function () {
    revertMessage = "only owners"

    txn = txn4
    executor = srs[4]
    await expect(multiSigWallet.connect(executor).execute(txn.txId))
      .to.be.revertedWith(revertMessage)
    
   
    txn = txn5
    executor = srs[6]
    await expect(multiSigWallet.connect(executor).execute(txn.txId))
      .to.be.revertedWith(revertMessage)
  })


  it("rejects execution for txId doesn't exist", async function () {
    revertMessage = "invalid transaction ID"

    txn = txn9
    executor = srs[0]
    await expect(multiSigWallet.connect(executor).execute(txn.txId))
      .to.be.revertedWith(revertMessage)

    txn = txn10
    executor = srs[1]
    await expect(multiSigWallet.connect(executor).execute(txn.txId))
      .to.be.revertedWith(revertMessage)
  })


  it("rejects execution for txId not enough approvals", async function () {
    revertMessage = "not enough approvals"

    txn = txn4
    executor = srs[0]
    
    await expect(multiSigWallet.connect(executor).execute(txn.txId))
      .to.be.revertedWith(revertMessage)
    
    txn = txn5
    executor = srs[1]
    
    await expect(multiSigWallet.connect(executor).execute(txn.txId))
      .to.be.revertedWith(revertMessage)
  })


  it("reverts as expected on failed transaction", async function () {
    txn = txn6
    executor = srs[1]
        
    /// @dev tests transaction fails for some external reason
    revertMessage = "execution failed"
    await expect(multiSigWallet.connect(executor).execute(txn.txId))
    .to.be.revertedWith(revertMessage)
  })
})
  


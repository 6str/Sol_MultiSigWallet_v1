const { expect } = require("chai");
const { providers, Contract } = require("ethers");
const { ethers } = require("hardhat");
const  provider = ethers.provider;


describe("Revoke approvals", function () {
  let srs, MultiSigWallet, multiSigWallet
  let submitter, toAddr, amount, txId, approver

  assignSigners = async () => srs = await hre.ethers.getSigners()
  assignSigners()
  
  beforeEach('deploy contract', async function () {
    MultiSigWallet = await ethers.getContractFactory("MultiSigWallet")
    multiSigWallet = await MultiSigWallet.deploy([srs[0].address, srs[1].address, srs[2].address], 2)
    multiSigWallet.deployed()

    /// @dev contract needs eth for executions
    await srs[0].sendTransaction({
      to: multiSigWallet.address,
      value: ethers.utils.parseEther('10')
    })
    
    amount = ethers.BigNumber.from('1000000000000000000')

    txId = 0
    submitter = srs[0]
    approver = srs[1]
    toAddr = srs[0].address
    multiSigWallet.connect(submitter).submit(toAddr, amount, [])
    multiSigWallet.connect(approver).approve(txId)
    
    txId = 1
    submitter = srs[0]
    approver = srs[1]
    toAddr = srs[0].address
    multiSigWallet.connect(submitter).submit(toAddr, amount, [])
    multiSigWallet.connect(approver).approve(txId)

    txId = 2
    submitter = srs[1]
    approver = srs[2]
    toAddr = srs[0].address
    multiSigWallet.connect(submitter).submit(toAddr, amount, [])
    multiSigWallet.connect(approver).approve(txId)

    txId = 3
    submitter = srs[1]
    approver = srs[2]
    toAddr = srs[0].address
    multiSigWallet.connect(submitter).submit(toAddr, amount, [])
    multiSigWallet.connect(approver).approve(txId)
  })

  it("revokes approval", async function () {
    revoker = srs[0]
    txId = 0
    await expect(multiSigWallet.connect(revoker).revoke(txId))
      .to.emit(multiSigWallet, 'Revoked')
      .withArgs(revoker.address, txId);

    revoker = srs[1]
    txId = 1
    await expect(multiSigWallet.connect(revoker).revoke(txId))
      .to.emit(multiSigWallet, 'Revoked')
      .withArgs(revoker.address, txId);
  
    revoker = srs[2]
    txId = 2
    await expect(multiSigWallet.connect(revoker).revoke(txId))
      .to.emit(multiSigWallet, 'Revoked')
      .withArgs(revoker.address, txId);
    //should be able to approve again after previous approval revoked
    await expect(multiSigWallet.connect(revoker).approve(txId))
      .to.emit(multiSigWallet, 'Approved')
      .withArgs(approver.address, txId)
    
    revoker = srs[1]
    txId = 3
    revertMessage = "not enough approvals";
    await expect(multiSigWallet.connect(revoker).revoke(txId))
      .to.emit(multiSigWallet, 'Revoked')
      .withArgs(revoker.address, txId);
    // should no longer be enough approvals to execute
    await expect(multiSigWallet.connect(revoker).execute(txId))
      .to.be.revertedWith(revertMessage)
  })


  it("rejects revoke from non owner", async function () {
    revertMessage = "only owners"
    
    revoker = srs[5]
    txId = 0
    await expect(multiSigWallet.connect(revoker).revoke(txId))
      .to.be.revertedWith(revertMessage)
    
    revoker = srs[9]
    txId = 3
    await expect(multiSigWallet.connect(revoker).revoke(txId))
      .to.be.revertedWith(revertMessage)
  })


  it("rejects revoke for txId doesn't exist", async function () {
    revertMessage = "invalid transaction ID"

    revoker = srs[0]
    txId = 4
    await expect(multiSigWallet.connect(revoker).revoke(txId))
      .to.be.revertedWith(revertMessage)
    
    txId = 11
    await expect(multiSigWallet.connect(revoker).revoke(txId))
      .to.be.revertedWith(revertMessage)
  })


  it("rejects revoke for txId not approved", async function () {
    revertMessage = "no approval to revoke"

    revoker = srs[2]
    txId = 0
    await expect(multiSigWallet.connect(revoker).revoke(txId))
      .to.be.revertedWith(revertMessage)
    
    revoker = srs[0]
    txId = 3
    await expect(multiSigWallet.connect(revoker).revoke(txId))
      .to.be.revertedWith(revertMessage)
  })

  
  it("rejects revoke for txId already executed", async function () {
    revertMessage = "already executed"
 
    revoker = srs[2]
    txId = 0
    await multiSigWallet.connect(revoker).execute(txId)
    await expect(multiSigWallet.connect(revoker).revoke(txId))
      .to.be.revertedWith(revertMessage)
    
    revoker = srs[1]
    txId = 3
    await multiSigWallet.connect(revoker).execute(txId)
    await expect(multiSigWallet.connect(revoker).revoke(txId))
      .to.be.revertedWith(revertMessage)
  })
})
  


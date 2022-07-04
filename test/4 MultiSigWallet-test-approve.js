const { expect } = require("chai");
const { providers, Contract } = require("ethers");
const { ethers } = require("hardhat");


describe("Approve transactions", function () {
  let srs, MultiSigWallet, multiSigWallet
  let submitter, toAddr, amount, txId, approver

  assignSigners = async () => srs = await hre.ethers.getSigners()
  assignSigners()
  
  before('deploy contract', async function () {
    MultiSigWallet = await ethers.getContractFactory("MultiSigWallet")
    multiSigWallet = await MultiSigWallet.deploy([srs[0].address, srs[1].address, srs[2].address], 2)
    multiSigWallet.deployed()

    submitter = srs[0]
    toAddr = srs[1].address
    amount = ethers.BigNumber.from('1000000000000000000')
    multiSigWallet.connect(submitter).submit(toAddr, amount, [])
    
    submitter = srs[1]
    multiSigWallet.connect(submitter).submit(toAddr, amount, [])

    toAddr = srs[2].address
    multiSigWallet.connect(submitter).submit(toAddr, amount, [])
    
    submitter = srs[2]
    toAddr = srs[3].address
    multiSigWallet.connect(submitter).submit(toAddr, amount, [])
  })

  it("accepts valid approvals", async function () {
    approver = srs[1]
    txId = 0
    await expect(multiSigWallet.connect(approver).approve(txId))
      .to.emit(multiSigWallet, 'Approved')
      .withArgs(approver.address, txId)
    
    approver = srs[0]
    txId = 1
    await expect(multiSigWallet.connect(approver).approve(txId))
      .to.emit(multiSigWallet, 'Approved')
      .withArgs(approver.address, txId)
    
    approver = srs[2]
    txId = 2
    await expect(multiSigWallet.connect(approver).approve(txId))
      .to.emit(multiSigWallet, 'Approved')
      .withArgs(approver.address, txId)
    
    approver = srs[0]
    txId = 3
    await expect(multiSigWallet.connect(approver).approve(txId))
      .to.emit(multiSigWallet, 'Approved')
      .withArgs(approver.address, txId)
  })

  it("rejects approval from non owner", async function () {
    revertMessage = "only owners"
    approver = srs[3]
    txId = 2
    await expect(multiSigWallet.connect(approver).approve(txId))
      .to.be.revertedWith(revertMessage)
    
    approver = srs[5]
    txId = 3
    await expect(multiSigWallet.connect(approver).approve(txId))
      .to.be.revertedWith(revertMessage)
  })

  it("rejects approval for txId doesn't exist", async function () {
    revertMessage = "invalid transaction ID"
    approver = srs[0]
    txId = 4
    await expect(multiSigWallet.connect(approver).approve(txId))
      .to.be.revertedWith(revertMessage)
    
    approver = srs[0]
    txId = 11
    await expect(multiSigWallet.connect(approver).approve(txId))
      .to.be.revertedWith(revertMessage)
  })

  it("rejects approval for txId already approved", async function () {
    revertMessage = "already approved"
    approver = srs[2]
    txId = 2
    await expect(multiSigWallet.connect(approver).approve(txId))
      .to.be.revertedWith(revertMessage)
    
    approver = srs[0]
    txId = 3
    await expect(multiSigWallet.connect(approver).approve(txId))
      .to.be.revertedWith(revertMessage)
  })

  it("rejects approval for txId already executed", async function () {
    //send eth to contract first so can do executions
    await srs[0].sendTransaction({
      to: multiSigWallet.address,
      value: ethers.utils.parseEther('2')
    })
    
    revertMessage = "already executed"
    approver = srs[2]
    txId = 0
    await multiSigWallet.connect(approver).execute(txId)
    await expect(multiSigWallet.connect(approver).approve(txId))
      .to.be.revertedWith(revertMessage)
    
    approver = srs[1]
    txId = 3
    await multiSigWallet.connect(approver).execute(txId)
    await expect(multiSigWallet.connect(approver).approve(txId))
      .to.be.revertedWith(revertMessage)
  })
})
  


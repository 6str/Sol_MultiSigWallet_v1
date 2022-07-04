const { expect } = require("chai");
const { providers, Contract } = require("ethers");
const { ethers } = require("hardhat");
const  provider = ethers.provider;


describe("Execute reentrancy", function () {
  let srs, MultiSigWallet, multiSigWallet
  let submitter, amount, txId, approver

  assignSigners = async () => srs = await hre.ethers.getSigners()
  assignSigners()
  
  before('deploy contract', async function () {
    MultiSigWallet = await ethers.getContractFactory("MultiSigWallet")
    multiSigWallet = await MultiSigWallet.deploy([srs[0].address, srs[1].address, srs[2].address], 2)
    multiSigWallet.deployed()

    /// @dev helper contract performs execution reentrancy attack
    TestsHelper = await ethers.getContractFactory("TestsHelper")
    testsHelper = await TestsHelper.deploy(multiSigWallet.address)
    testsHelper.deployed()
  
    /// @dev contract needs eth for executions
    await srs[0].sendTransaction({
      to: multiSigWallet.address,
      value: ethers.utils.parseEther('10')
    })

    amount = ethers.BigNumber.from('1000000000000000000')
    txn0 = {txId: 0, to: testsHelper.address, amt: amount}
    
    /// @dev reentrancy test. TestsHelper.sol fallback() reenters
    /// txn data required so execute invokes TestsHelper's fallback()
    txn = txn0         
    testsHelper.txIdSetup(txn.txId)
    submitter = srs[0]
    approver = srs[1]
    multiSigWallet.connect(submitter).submit(txn.to, txn.amt, [0x12]) 
    multiSigWallet.connect(approver).approve(txn.txId)
    testsHelper.txIdSetup(txn.txId)
  })


  // execute function protected from reentrancy by txn's notExecuted state & check
  it("reverts as expected on reentrancy", async function () {
    txn = txn0  
    executor = srs[1]
    revertMessage = "execution failed"
    await expect(multiSigWallet.connect(executor).execute(txn.txId))
      .to.be.revertedWith(revertMessage)
  })
})
  


const { expect } = require("chai");
const { providers, Contract } = require("ethers");
const { ethers } = require("hardhat");
const addrZero = ethers.constants.AddressZero;


describe("Submit transactions", function () {
    let srs, MultiSigWallet, multiSigWallet
    let submitter, toAddr, amount, txId

    assignSigners = async () => srs = await hre.ethers.getSigners()
    assignSigners()
    
    beforeEach('deploy contract', async function () {
      MultiSigWallet = await ethers.getContractFactory("MultiSigWallet")
      multiSigWallet = await MultiSigWallet.deploy([srs[0].address, srs[1].address, srs[2].address], 2)
      multiSigWallet.deployed()
    })


  it("accepts transactions without calldata", async function () {
    submitter = srs[0]
    toAddr = srs[1].address
    amount = ethers.BigNumber.from('1000000000000000000')
    txId = 0

    await expect(multiSigWallet.submit(toAddr, amount, []))
      .to.emit(multiSigWallet, 'Submitted')
      .withArgs(submitter.address, txId, toAddr, amount)

    submitter = srs[1]
    toAddr = srs[4].address
    amount = ethers.BigNumber.from('9999999999999999999')
    ++txId
    await expect(multiSigWallet.connect(submitter).submit(toAddr, amount, []))
      .to.emit(multiSigWallet, 'Submitted')
      .withArgs(submitter.address, txId, toAddr, amount)
  })

  it("accepts transactions with calldata", async function () {
    submitter = srs[0]
    toAddr = srs[1].address
    amount = ethers.BigNumber.from('1000000000000000000')
    txId = 0
    let bytesArray = [0x12, 0x34, 0x56]

    await expect(multiSigWallet.submit(toAddr, amount, bytesArray))
      .to.emit(multiSigWallet, 'Submitted')
      .withArgs(submitter.address, txId, toAddr, amount)

    submitter = srs[2]
    toAddr = srs[6].address
    amount = ethers.BigNumber.from('9999999999999999999')
    ++txId
    await expect(multiSigWallet.connect(submitter).submit(toAddr, amount, bytesArray))
      .to.emit(multiSigWallet, 'Submitted')
      .withArgs(submitter.address, txId, toAddr, amount)
  })

  it("rejects transactions from non owners", async function () {
    submitter = srs[3]
    toAddr = srs[1].address
    amount = ethers.BigNumber.from('1000000000000000000')
    txId = 0
    let bytesArray = [0x12, 0x34, 0x56]
    let revertMessage = "only owners"

    await expect(multiSigWallet.connect(submitter).submit(toAddr, amount, [])).to.be.revertedWith(revertMessage)

    submitter = srs[4]
    toAddr = srs[2].address
    amount = ethers.BigNumber.from('9999999999999999999')
    ++txId
    await expect(multiSigWallet.connect(submitter).submit(toAddr, amount, bytesArray)).to.be.revertedWith(revertMessage)
  })

  it("rejects transactions to zero address", async function () {
    toAddr = addrZero
    amount = ethers.BigNumber.from('1000000000000000000')
    let bytesArray = [0x12, 0x34, 0x56]
    let revertMessage = "address 0"

    await expect(multiSigWallet.submit(toAddr, amount, [])).to.be.revertedWith(revertMessage)
    await expect(multiSigWallet.submit(toAddr, amount, bytesArray)).to.be.revertedWith(revertMessage)
  })
});


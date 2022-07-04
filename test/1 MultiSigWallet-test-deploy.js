const { expect } = require("chai")
const { ethers } = require("hardhat")
const addrZero = ethers.constants.AddressZero

describe("Deploy contract", function () {
  let srs, MultiSigWallet, multiSigWallet

  assignSigners = async () => srs = await hre.ethers.getSigners()
  assignSigners()

  beforeEach('deploy contract', async function () {
    MultiSigWallet = await ethers.getContractFactory("MultiSigWallet")
  })



  it("Should deploy. Passing 2 Owners, 2 sigsRequired", async function () {
    multiSigWallet = await MultiSigWallet.deploy([srs[0].address, srs[1].address], 2)
    await expect(multiSigWallet.deployed()).not.to.be.reverted
    expect(multiSigWallet.address).to.be.properAddress
    expect(multiSigWallet.address).not.to.equal(addrZero)
  })

  it("Should deploy. Passing 3 Owners, 2 sigsRequired", async function () {
    multiSigWallet = await MultiSigWallet.deploy([srs[0].address, srs[1].address, srs[2].address], 2)
    await expect(multiSigWallet.deployed()).not.to.be.reverted
    expect(multiSigWallet.address).to.be.properAddress
    expect(multiSigWallet.address).not.to.equal(addrZero)
  })
  
  it("Should deploy. Passing 3 Owners, 3 sigsRequired", async function () {
    multiSigWallet = await MultiSigWallet.deploy([srs[0].address, srs[1].address, srs[2].address], 3)
    await expect(multiSigWallet.deployed()).not.to.be.reverted
    expect(multiSigWallet.address).to.be.properAddress
    expect(multiSigWallet.address).not.to.equal(addrZero)
  })

  
// fail tests
  //not enough owners
  it("Should fail to deploy. Passing 0 Owners, 0 sigsRequired", async function () {
    await expect(MultiSigWallet.deploy([], 0)).to.revertedWith("min 2 owners required")
  })
  
  it("Should fail to deploy. Passing 0 Owners, 1 sigsRequired", async function () {
    await expect(MultiSigWallet.deploy([], 1)).to.revertedWith("min 2 owners required")
  })
  
  it("Should fail to deploy. Passing 0 Owners, 2 sigsRequired", async function () {
    await expect(MultiSigWallet.deploy([], 2)).to.revertedWith("min 2 owners required")
  })

  it("Should fail to deploy. Passing 1 Owners, 0 sigsRequired", async function () {
    await expect(MultiSigWallet.deploy([srs[0].address], 0)).to.revertedWith("min 2 owners required")
  })

  it("Should fail to deploy. Passing 1 Owners, 1 sigsRequired", async function () {
    await expect(MultiSigWallet.deploy([srs[0].address], 1)).to.revertedWith("min 2 owners required")
  })

  it("Should fail to deploy. Passing 1 Owners, 2 sigsRequired", async function () {
    await expect(MultiSigWallet.deploy([srs[0].address], 2)).to.revertedWith("min 2 owners required")
  })
  
  //sigs required too low
  it("Should fail to deploy. Passing 2 Owners, 0 sigsRequired", async function () {
    await expect(MultiSigWallet.deploy([srs[0].address, srs[1].address], 0)).to.revertedWith("min 2 sigs required")
  })

  it("Should fail to deploy. Passing 2 Owners, 1 sigsRequired", async function () {
    await expect(MultiSigWallet.deploy([srs[0].address, srs[1].address], 1)).to.revertedWith("min 2 sigs required")
  })

  it("Should fail to deploy. Passing 3 Owners, 0 sigsRequired", async function () {
    await expect(MultiSigWallet.deploy([srs[0].address, srs[1].address], 0)).to.revertedWith("min 2 sigs required")
  })

  it("Should fail to deploy. Passing 3 Owners, 1 sigsRequired", async function () {
    await expect(MultiSigWallet.deploy([srs[0].address, srs[1].address, srs[2].address], 1)).to.revertedWith("min 2 sigs required")
  })

  // sigs required > owners count
  it("Should fail to deploy. Passing 2 Owners, 3 sigsRequired", async function () {
    await expect(MultiSigWallet.deploy([srs[0].address, srs[1].address], 3)).to.revertedWith("sigs required > owners")
  })

  it("Should fail to deploy. Passing 4 Owners, 5 sigsRequired", async function () {
    await expect(MultiSigWallet.deploy([srs[0].address, srs[1].address, srs[2].address, srs[3].address], 5)).to.revertedWith("sigs required > owners")
  })

  // passed duplicate owner address
  it("Should fail to deploy. Passing 2 Owners duplicates, 2 sigsRequired", async function () {
    await expect(MultiSigWallet.deploy([srs[0].address, srs[0].address], 2)).to.revertedWith("duplicate owner")
  })

  it("Should fail to deploy. Passing 4 Owners 1st and 4th duplicates, 2 sigsRequired", async function () {
    await expect(MultiSigWallet.deploy([srs[0].address, srs[1].address, srs[2].address, srs[0].address], 2)).to.revertedWith("duplicate owner")
  })

  // passed zero address
  it("Should fail to deploy. Passing 4 Owners 1st is address0, 2 sigsRequired", async function () {
    await expect(MultiSigWallet.deploy([addrZero, srs[0].address, srs[1].address, srs[2].address], 2)).to.revertedWith("zero address not valid")
  })

  it("Should fail to deploy. Passing 4 Owners 4th is address0, 2 sigsRequired", async function () {
    await expect(MultiSigWallet.deploy([srs[0].address, srs[1].address, srs[2].address, addrZero], 2)).to.revertedWith("zero address not valid")
  })
})



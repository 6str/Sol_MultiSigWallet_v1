const { expect } = require("chai");
const { providers, Contract } = require("ethers");
const { ethers } = require("hardhat");
const  provider = ethers.provider;


describe("Deposit", function () {
  let srs, MultiSigWallet, multiSigWallet;
  let accountFrom;
  let sendValue = '1000000000000000000', units = 'wei';

  assignSigners = async () => srs = await hre.ethers.getSigners();
  assignSigners();

  beforeEach('deploy contract', async function () {
    MultiSigWallet = await ethers.getContractFactory("MultiSigWallet");
    multiSigWallet = await MultiSigWallet.deploy([srs[0].address, srs[1].address, srs[2].address], 2);
    multiSigWallet.deployed();
    accountFrom = srs[0];
  })

  
  // deposit via receive function
  it("receives funds without calldata (receive func)", async function () {
    let params = { 
      to: multiSigWallet.address, 
      value: ethers.utils.parseUnits(sendValue, units).toHexString()
    };    
    
    await expect(await accountFrom.sendTransaction(params))
      .to.emit(multiSigWallet, 'Deposit')
      .withArgs(accountFrom.address, sendValue);

    expect(await provider.getBalance(multiSigWallet.address))
      .to.equal(sendValue);
  })

  // deposit via fallback function
  it("receives funds with calldata (fallback func)", async function () {
    let params = { 
      to: multiSigWallet.address, 
      value: ethers.utils.parseUnits(sendValue, units).toHexString(),
      data: [0x12, 0x34, 0x56]
    };

    await expect(await accountFrom.sendTransaction(params))
      .to.emit(multiSigWallet, 'Deposit')
      .withArgs(accountFrom.address, sendValue);
    
    expect(await provider.getBalance(multiSigWallet.address))
      .to.equal(sendValue);
  })
})


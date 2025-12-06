require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true, // Enable IR-based compiler to fix "Stack too deep" error
    },
  },
  networks: {
    dioneTestnet: {
      url: process.env.DIONE_RPC_URL,
      chainId: 131313,
      accounts: [process.env.PRIVATE_KEY],
    },
  },
};

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const Escrow = await hre.ethers.getContractFactory("FreelanceEscrow");
  const escrow = await Escrow.deploy();

  await escrow.waitForDeployment();
  const address = await escrow.getAddress();

  console.log(`FreelanceEscrow deployed to: ${address}`);

  const contractData = {
    address: address,
    abi: JSON.parse(Escrow.interface.formatJson()),
  };

  const dir = path.join(__dirname, "../src/lib");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(dir, "contractData.json"),
    JSON.stringify(contractData, null, 2)
  );

  console.log("Contract data written to src/lib/contractData.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

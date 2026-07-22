import fetch from "node-fetch";

async function main() {
  const address = "0xa740A72E452e138DCc4dB613f8dbbc6eb42A681B";
  // WorkSubmitted event signature: WorkSubmitted(uint256,uint256,string)
  // 0xb33878b4bd7024ceab2fa65b6f3a537f818cc7435f3089bb28669e4693a1c0b3 -> keccak256("WorkSubmitted(uint256,uint256,string)")
  // Or I can just fetch all logs for the contract and parse.
  
  const url = `https://api-sepolia.etherscan.io/api?module=logs&action=getLogs&address=${address}&startblock=0&endblock=99999999&page=1&offset=1000&sort=asc`;
  
  const res = await fetch(url);
  const data = await res.json();
  
  if (data.status === "1") {
    // 0xb33878b4bd7024ceab2fa65b6f3a537f818cc7435f3089bb28669e4693a1c0b3
    const logs = data.result.filter((l: any) => l.topics[0] === "0xb33878b4bd7024ceab2fa65b6f3a537f818cc7435f3089bb28669e4693a1c0b3");
    console.log(`Found ${logs.length} WorkSubmitted events!`);
    
    logs.forEach((log: any) => {
      const jobId = parseInt(log.topics[1], 16);
      console.log(`\nJobId: ${jobId}`);
      console.log(`Data: ${log.data}`);
    });
  } else {
    console.log("No logs found or error:", data.message);
  }
}

main().catch(console.error);

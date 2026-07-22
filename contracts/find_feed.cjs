const fs = require('fs');
const text = fs.readFileSync('temp_chains.ts', 'utf8');

// Find Base Sepolia network object
const baseSepoliaBlock = text.split('page: "base-sepolia"')[1];
if (baseSepoliaBlock) {
    const nextNetwork = baseSepoliaBlock.indexOf('page:');
    const block = baseSepoliaBlock.substring(0, nextNetwork !== -1 ? nextNetwork : undefined);
    
    // Find EUR / USD in this block
    const lines = block.split('\n');
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('EUR / USD')) {
            console.log('Found EUR / USD in Base Sepolia:');
            console.log(lines.slice(i, i+5).join('\n'));
        }
    }
}

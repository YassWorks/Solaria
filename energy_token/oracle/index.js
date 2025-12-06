const { ethers } = require('ethers');
require('dotenv').config({ path: '../.env' });

// Contract ABI - only the functions we need
const ENERGY_TOKEN_ABI = [
    "function recordProduction(uint256 projectId, uint256 kwhProduced, string memory dataSource) external",
    "function getProject(uint256 projectId) external view returns (tuple(string name, string location, uint256 installationSizeKw, uint256 estimatedAnnualKwh, uint256 totalShares, uint256 sharesSold, uint256 pricePerShare, uint256 kwhPerShare, uint256 projectStartDate, uint256 projectDuration, uint8 status, address projectWallet, bool transfersEnabled))",
    "function totalProductionByProject(uint256 projectId) external view returns (uint256)",
    "function getProjectStats(uint256 projectId) external view returns (uint256 totalProduction, uint256 recordCount, uint256 averageDaily, uint256 lastRecordedTimestamp)",
    "event ProductionRecorded(uint256 indexed projectId, uint256 kwhProduced, uint256 timestamp, string dataSource)"
];

class OracleSimulator {
    constructor() {
        const rpcUrl = process.env.DIONE_RPC_URL;
        const privateKey = process.env.ORACLE_PRIVATE_KEY || process.env.PRIVATE_KEY;
        const contractAddress = process.env.CONTRACT_ADDRESS;
        
        if (!rpcUrl || !privateKey || !contractAddress) {
            throw new Error('Missing required environment variables. Check your .env file.');
        }
        
        this.provider = new ethers.JsonRpcProvider(rpcUrl);
        this.wallet = new ethers.Wallet(privateKey, this.provider);
        this.contract = new ethers.Contract(contractAddress, ENERGY_TOKEN_ABI, this.wallet);
        
        console.log('Oracle initialized with wallet:', this.wallet.address);
        console.log('Contract address:', contractAddress);
    }
    
    /**
     * Calculate realistic solar production based on time of day
     * @param {number} hour - Hour of day (0-23)
     * @param {number} installationSizeKw - Size of installation in kW
     * @returns {number} Production in kWh for that hour
     */
    calculateHourlyProduction(hour, installationSizeKw = 500) {
        // No production at night
        if (hour < 6 || hour > 18) return 0;
        
        // Peak production at solar noon (12 PM)
        const peakHour = 12;
        const hoursFromPeak = Math.abs(hour - peakHour);
        
        // Bell curve with realistic solar production profile
        // Peak capacity factor ~80% (accounting for inefficiencies)
        const peakProduction = installationSizeKw * 0.8;
        
        // Gaussian distribution for realistic solar curve
        const production = peakProduction * Math.exp(-0.15 * hoursFromPeak * hoursFromPeak);
        
        // Add some randomness (weather variability ±15%)
        const variance = 0.85 + (Math.random() * 0.3);
        
        return Math.floor(production * variance);
    }
    
    /**
     * Calculate daily production summary
     * @param {number} installationSizeKw 
     * @returns {object} Daily production stats
     */
    calculateDailyProduction(installationSizeKw = 500) {
        let totalDaily = 0;
        const hourly = [];
        
        for (let hour = 0; hour < 24; hour++) {
            const kWh = this.calculateHourlyProduction(hour, installationSizeKw);
            totalDaily += kWh;
            hourly.push({ hour, kWh });
        }
        
        return { totalDaily, hourly };
    }
    
    /**
     * Get project details from contract
     * @param {number} projectId 
     */
    async getProjectInfo(projectId) {
        try {
            const project = await this.contract.getProject(projectId);
            const stats = await this.contract.getProjectStats(projectId);
            
            return {
                name: project.name,
                location: project.location,
                installationSizeKw: Number(project.installationSizeKw),
                estimatedAnnualKwh: Number(project.estimatedAnnualKwh),
                totalProduction: Number(stats.totalProduction),
                recordCount: Number(stats.recordCount),
                averageDaily: Number(stats.averageDaily),
                lastRecorded: new Date(Number(stats.lastRecordedTimestamp) * 1000)
            };
        } catch (error) {
            console.error('Error fetching project info:', error.message);
            return null;
        }
    }
    
    /**
     * Record production data to blockchain
     * @param {number} projectId 
     * @param {number} kwhProduced 
     * @param {string} dataSource 
     */
    async recordProduction(projectId, kwhProduced, dataSource = 'Oracle Simulator') {
        try {
            if (kwhProduced === 0) {
                console.log(`⏸️  No production to record (nighttime)`);
                return null;
            }
            
            console.log(`\n📊 Recording ${kwhProduced} kWh for project ${projectId}...`);
            
            const tx = await this.contract.recordProduction(
                projectId,
                kwhProduced,
                dataSource
            );
            
            console.log(`📤 Transaction sent: ${tx.hash}`);
            console.log(`⏳ Waiting for confirmation...`);
            
            const receipt = await tx.wait();
            
            console.log(`✅ Production recorded! Block: ${receipt.blockNumber}`);
            console.log(`   Gas used: ${receipt.gasUsed.toString()}`);
            
            return receipt;
        } catch (error) {
            console.error('❌ Error recording production:', error.message);
            if (error.reason) console.error('   Reason:', error.reason);
            return null;
        }
    }
    
    /**
     * Run oracle in automatic mode
     * @param {number} projectId 
     * @param {number} intervalMinutes 
     */
    async startAutoMode(projectId, intervalMinutes = 60) {
        console.log('\n' + '='.repeat(60));
        console.log('🌞 ENERGY TOKEN ORACLE - AUTO MODE');
        console.log('='.repeat(60));
        
        // Get project info
        const info = await this.getProjectInfo(projectId);
        if (!info) {
            console.error('Failed to get project info. Exiting.');
            return;
        }
        
        console.log(`\nProject: ${info.name}`);
        console.log(`Location: ${info.location}`);
        console.log(`Installation Size: ${info.installationSizeKw} kW`);
        console.log(`Total Production to Date: ${info.totalProduction.toLocaleString()} kWh`);
        console.log(`Recording every ${intervalMinutes} minutes`);
        console.log('='.repeat(60));
        
        // Record immediately
        await this.recordProductionCycle(projectId, info.installationSizeKw);
        
        // Then on interval
        setInterval(async () => {
            await this.recordProductionCycle(projectId, info.installationSizeKw);
        }, intervalMinutes * 60 * 1000);
    }
    
    /**
     * Single production recording cycle
     */
    async recordProductionCycle(projectId, installationSizeKw) {
        const now = new Date();
        const currentHour = now.getHours();
        
        console.log(`\n⏰ ${now.toLocaleString()} (Hour: ${currentHour})`);
        
        const production = this.calculateHourlyProduction(currentHour, installationSizeKw);
        
        if (production > 0) {
            await this.recordProduction(projectId, production, `Oracle Simulator - Hour ${currentHour}`);
        } else {
            console.log(`🌙 Nighttime - No production to record`);
        }
    }
    
    /**
     * Simulate a full day of production at once (for testing)
     */
    async simulateFullDay(projectId, installationSizeKw = 500) {
        console.log('\n' + '='.repeat(60));
        console.log('🌞 SIMULATING FULL DAY OF PRODUCTION');
        console.log('='.repeat(60));
        
        const { totalDaily, hourly } = this.calculateDailyProduction(installationSizeKw);
        
        console.log(`\nTotal Daily Production: ${totalDaily} kWh`);
        console.log('\nHourly Breakdown:');
        
        for (const { hour, kWh } of hourly) {
            if (kWh > 0) {
                console.log(`  ${hour.toString().padStart(2, '0')}:00 - ${kWh} kWh`);
            }
        }
        
        console.log('\n📤 Recording to blockchain...');
        const receipt = await this.recordProduction(projectId, totalDaily, 'Full Day Simulation');
        
        if (receipt) {
            const info = await this.getProjectInfo(projectId);
            console.log(`\n📈 Updated Total Production: ${info.totalProduction.toLocaleString()} kWh`);
        }
    }
    
    /**
     * Display current stats
     */
    async displayStats(projectId) {
        console.log('\n' + '='.repeat(60));
        console.log('📊 PROJECT STATISTICS');
        console.log('='.repeat(60));
        
        const info = await this.getProjectInfo(projectId);
        if (!info) return;
        
        console.log(`\nProject: ${info.name}`);
        console.log(`Location: ${info.location}`);
        console.log(`Installation Size: ${info.installationSizeKw} kW`);
        console.log(`Estimated Annual: ${info.estimatedAnnualKwh.toLocaleString()} kWh`);
        console.log(`\nTotal Production: ${info.totalProduction.toLocaleString()} kWh`);
        console.log(`Production Records: ${info.recordCount}`);
        console.log(`Average Daily: ${info.averageDaily.toLocaleString()} kWh`);
        console.log(`Last Recorded: ${info.lastRecorded.toLocaleString()}`);
        
        // Calculate progress
        const progress = (info.totalProduction / info.estimatedAnnualKwh * 100).toFixed(2);
        console.log(`\n📊 Annual Progress: ${progress}%`);
        console.log('='.repeat(60));
    }
}

// CLI Interface
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    const projectId = parseInt(process.env.TOKEN_ID || '1');
    
    try {
        const oracle = new OracleSimulator();
        
        switch (command) {
            case 'auto':
                const interval = parseInt(args[1]) || 60;
                await oracle.startAutoMode(projectId, interval);
                break;
                
            case 'once':
                const info = await oracle.getProjectInfo(projectId);
                if (info) {
                    await oracle.recordProductionCycle(projectId, info.installationSizeKw);
                }
                break;
                
            case 'day':
                const size = parseInt(args[1]) || 500;
                await oracle.simulateFullDay(projectId, size);
                break;
                
            case 'stats':
                await oracle.displayStats(projectId);
                break;
                
            case 'help':
            default:
                console.log(`
🌞 Energy Token Oracle Simulator

Usage: node index.js [command] [options]

Commands:
  auto [interval]     Run in automatic mode (default: 60 minutes)
  once                Record production once based on current time
  day [sizeKw]        Simulate full day of production (default: 500 kW)
  stats               Display project statistics
  help                Show this help message

Examples:
  node index.js auto 30      # Record every 30 minutes
  node index.js once         # Record current hour production
  node index.js day 500      # Simulate full day for 500kW installation
  node index.js stats        # View statistics

Environment Variables (from ../.env):
  CONTRACT_ADDRESS           Deployed EnergyToken contract
  ORACLE_PRIVATE_KEY        Private key for oracle wallet
  DIONE_RPC_URL             RPC endpoint
  TOKEN_ID                  Project ID to monitor (default: 1)
                `);
                break;
        }
    } catch (error) {
        console.error('\n❌ Fatal Error:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = OracleSimulator;

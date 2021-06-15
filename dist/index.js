var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as solanaWeb3 from '@solana/web3.js';
import * as database from './database.js';
function getValidatorAccounts(connection, stakeProgramAddress) {
    return __awaiter(this, void 0, void 0, function* () {
        return connection.getVoteAccounts("confirmed");
    });
}
function populateValidatorsTable(accountsInfo, currentEpoch, db, tableName = 'validators') {
    // INSERT IGNORE inserts if not exist
    const insert = db.prepare(`INSERT OR IGNORE INTO ${tableName} VALUES (
            @votePubkey,
            @epoch,
            @activatedStake,
            @credits,
            @epochVoteAccount
        )`);
    const items = accountsInfo.filter((account) => account.epochCredits.map((a) => a[0]).includes(currentEpoch)).map((account) => {
        console.log(account);
        return {
            votePubkey: account.votePubkey,
            epoch: currentEpoch,
            activatedStake: account.activatedStake,
            credits: account.epochCredits.filter(x => x[0] == currentEpoch)[0][1],
            epochVoteAccount: account.epochVoteAccount ? 1 : 0
        };
    });
    console.log(items);
    const insertMany = db.transaction((logs) => {
        for (const validatorLog of logs)
            insert.run(validatorLog);
    });
    console.log(items);
    insertMany(items);
}
function populateValidatorLogsTable(accountsInfo, currentEpoch, db, tableName = 'validatorlogs') {
    /* Populate validator logs table */
    /* For each entry in epochCredits,
       override the existing epochCredits
     */
    const insert = db.prepare(`INSERT INTO ${tableName} VALUES (
            @votePubkey,
            @epoch,
            @timestamp,
            @commission,
            @credits,
            @lastVote
            )`);
    const items = accountsInfo.filter((account) => account.epochCredits.map((a) => a[0]).includes(currentEpoch)).map((account) => {
        return {
            votePubkey: account.votePubkey,
            epoch: currentEpoch,
            timestamp: new Date().toLocaleString(),
            commission: account.commission,
            credits: account.epochCredits.filter(x => x[0] == currentEpoch)[0][1],
            lastVote: account.lastVote,
        };
    });
    const insertMany = db.transaction((logs) => {
        for (const validatorLog of logs)
            insert.run(validatorLog);
    });
    insertMany(items);
}
const connectionMainnet = new solanaWeb3.Connection('https://api.mainnet-beta.solana.com/', 'confirmed');
const connectionTestnet = new solanaWeb3.Connection('https://api.testnet.solana.com/', 'confirmed');
const STAKE_PROGRAM_ADDR = new solanaWeb3.PublicKey('Stake11111111111111111111111111111111111111');
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const db = database.openDb();
        const validatorTable = database.createValidatorTable(db);
        const validatorLogTable = database.createValidatorLogTable(db);
        const validatorTableTestnet = database.createValidatorTable(db, 'validatorsTestnet');
        const validatorLogTableTestnet = database.createValidatorLogTable(db, 'validatorlogsTestnet');
        yield updateData();
        const stmt = db.prepare('SELECT * from validators').all();
        console.log(stmt);
    });
}
function updateData() {
    return __awaiter(this, void 0, void 0, function* () {
        const db = database.openDb();
        // Update Mainnet
        const accounts = yield getValidatorAccounts(connectionMainnet, STAKE_PROGRAM_ADDR);
        const activeAccounts = accounts.current;
        const currentEpoch = (yield connectionMainnet.getEpochInfo("confirmed")).epoch;
        console.log(currentEpoch);
        populateValidatorsTable(activeAccounts, currentEpoch, db);
        populateValidatorLogsTable(activeAccounts, currentEpoch, db);
        // Update Testnet
        const accountsTestnet = yield getValidatorAccounts(connectionTestnet, STAKE_PROGRAM_ADDR);
        const activeAccountsTestnet = accountsTestnet.current;
        const currentEpochTestnet = (yield connectionTestnet.getEpochInfo("confirmed")).epoch;
        console.log(currentEpochTestnet);
        populateValidatorsTable(activeAccountsTestnet, currentEpochTestnet, db, 'validatorsTestnet');
        populateValidatorLogsTable(activeAccountsTestnet, currentEpochTestnet, db, 'validatorlogsTestnet');
    });
}
setInterval(updateData, 300000);

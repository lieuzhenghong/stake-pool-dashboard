import { DatabaseDriver, MikroORM } from '@mikro-orm/core';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';


import * as solanaWeb3 from '@solana/web3.js';
import Database from 'better-sqlite3'
import * as database from './database.js';

async function getValidatorAccounts(
    connection: solanaWeb3.Connection,
    stakeProgramAddress: solanaWeb3.PublicKey,
) {
    return connection.getVoteAccounts("confirmed")
}

function populateValidatorsTable(
    accountsInfo: Array<solanaWeb3.VoteAccountInfo>,
    currentEpoch: number,
    db: Database
) {

    // INSERT IGNORE inserts if not exist
    const insert = db.prepare(
        `INSERT OR IGNORE INTO validators VALUES (
            @votePubkey,
            @epoch,
            @activatedStake,
            @credits,
            @epochVoteAccount
        )`
    )

    const items = accountsInfo.filter((account) =>
        account.epochCredits.map((a) => a[0]).includes(currentEpoch)
    ).map((account) => {
        console.log(account);
        return {
            votePubkey: account.votePubkey,
            epoch: currentEpoch,
            activatedStake: account.activatedStake,
            credits: account.epochCredits.filter(x => x[0] == currentEpoch)[0][1],
            epochVoteAccount: account.epochVoteAccount ? 1 : 0
        }
    })

    console.log(items)

    const insertMany = db.transaction((logs) => {
        for (const validatorLog of logs) insert.run(validatorLog);
    })

    console.log(items)
    insertMany(items);

}

function populateValidatorLogsTable(
    accountsInfo: Array<solanaWeb3.VoteAccountInfo>,
    currentEpoch: number,
    db: Database
) {
    /* Populate validator logs table */

    /* For each entry in epochCredits,
       override the existing epochCredits
     */
    const insert = db.prepare(
        `INSERT INTO validatorlogs VALUES (
            @votePubkey,
            @epoch,
            @timestamp,
            @commission,
            @credits,
            @lastVote
            )`
    );

    const items = accountsInfo.filter((account) =>
        account.epochCredits.map((a) => a[0]).includes(currentEpoch)
    ).map((account) => {
        return {
            votePubkey: account.votePubkey,
            epoch: currentEpoch,
            timestamp: new Date().toLocaleString(),
            commission: account.commission,
            credits: account.epochCredits.filter(x => x[0] == currentEpoch)[0][1],
            lastVote: account.lastVote,
        }
    })


    const insertMany = db.transaction((logs) => {
        for (const validatorLog of logs) insert.run(validatorLog);
    })

    insertMany(items);
}

const connection = new solanaWeb3.Connection(
    'https://api.mainnet-beta.solana.com/',
    'confirmed',
);

const STAKE_PROGRAM_ADDR = new solanaWeb3.PublicKey(
    'Stake11111111111111111111111111111111111111',
);


async function main() {
    const db = database.openDb();
    const validatorTable = database.createValidatorTable(db);
    const validatorLogTable = database.createValidatorLogTable(db);

    await updateData();
    const stmt = db.prepare('SELECT * from validators').all();
    console.log(stmt);
}

async function updateData() {
    const db = database.openDb();
    const accounts = await getValidatorAccounts(connection, STAKE_PROGRAM_ADDR);
    const activeAccounts = accounts.current;
    const currentEpoch = (await connection.getEpochInfo("confirmed")).epoch;
    console.log(currentEpoch)
    populateValidatorsTable(activeAccounts, currentEpoch, db)
    populateValidatorLogsTable(activeAccounts, currentEpoch, db)
}

setInterval(updateData, 300000)
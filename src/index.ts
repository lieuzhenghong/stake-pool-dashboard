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


    /*
    .then((accounts) => {
        /*
        console.log("Current accounts: ")
        accounts.current.map(
            (account) => {
                console.log(account.votePubkey)
                console.log(account.lastVote)
                console.log(account.commission)
                console.log(account.epochCredits)

                // EkLA4nA5jtM2t2FkNWo6XWAyvQyaJJUZoX5p7LMawoaz
                //     79696696
                //     10
                //     [
                //     [ 180, 55291399, 54982517 ],
                //     [ 181, 55608535, 55291399 ],
                //     [ 182, 55907113, 55608535 ],
                //     [ 183, 56181346, 55907113 ],
                //     [ 184, 56285458, 56181346 ]
                //     ]
            }
        )

        console.log("Delinquent accounts: ")
        accounts.delinquent.map(
            (account) => {
                console.log(account.epochCredits)
            }
        )
});
        */
}

function populateValidatorTables(
    accountsInfo: Array<solanaWeb3.VoteAccountInfo>,
    epoch: number,
    db: Database
) {
    /* Populate validator and validatorlog tables */

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
        account.epochCredits.map((a) => a[0]).includes(epoch)
    ).map((account) => {
        console.log(account);
        return {
            votePubkey: account.votePubkey,
            epoch: epoch,
            timestamp: new Date().toLocaleString(),
            commission: account.commission,
            credits: account.epochCredits.filter(x => x[0] == epoch)[1],
            lastVote: account.lastVote,
        }
    })

    console.log(items)

    const insertMany = db.transaction((logs) => {
        for (const validatorLog of logs) insert.run(validatorLog);
    })

    console.log(items)
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
    const accounts = await getValidatorAccounts(connection, STAKE_PROGRAM_ADDR);
    const activeAccounts = accounts.current;
    const currentEpoch = (await connection.getEpochInfo("confirmed")).epoch;
    populateValidatorTables(activeAccounts, currentEpoch, db)
    const stmt = db.prepare('SELECT * from validatorlogs').all();
    console.log(stmt);
}

main()


/**
 * 1. Connect to API mainnet
 * 2. Poll for pubkey and epochCredits by calling `getVoteAccounts` and VoteAccountInfo
 * 3. We update our SQL database
 */
// async function main() {
//     const orm = await MikroORM.init({
//         metadataProvider: TsMorphMetadataProvider,
//         entities: ['./entities/**/*.js'],
//         entitiesTs: ['./entities/**/*.ts'],
//         dbName: 'stake-pool-dashboard-db',
//         type: 'sqlite',
//     });

//     console.log(orm.em)

// }


// getValidatorAccounts(connection, STAKE_PROGRAM_ADDR);


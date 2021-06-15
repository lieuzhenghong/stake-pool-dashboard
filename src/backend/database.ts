/**
 * Set up SQLite database
 */

import Database from 'better-sqlite3'

export function openDb(dbName = 'database.db') {
    return new Database(dbName, { verbose: console.log })
}

export function createSchema() {

}

/*

1. ValidatorEpoch Table
2. Validator Log Table
2. PoolEpoch Table
3. PoolValidator Table

validatorepoch: validator, epoch
validatorlog: (validator, epoch), timestamp
poolepoch: (pool, epoch)
poolvalidator: (pool, epoch), validator

Validatorepoch one to many relationship with ValidatorLog
PoolEpoch and ValidatorEpoch have many to many relationship
 -- using junction table PoolValidator

We also need a table to convert epoch credits to points

getEpochInfo
https://solana-labs.github.io/solana-web3.js/modules.html#epochinfo
*/


export function createValidatorTable(
    db: Database,
    tableName: string = 'validators',
) {
    console.log("Run command!")
    const createValidatorTableCommand = db.prepare(
        `CREATE TABLE IF NOT EXISTS ${tableName} (
        votePubkey STRING,
        epoch INTEGER, 
        activatedStake INTEGER,
        credits INTEGER,
        epochVoteAccount BOOLEAN,
        PRIMARY KEY (votePubkey, epoch)
    );`)
    db.transaction(() =>
        createValidatorTableCommand.run()
    )()
    console.log("Ran command!")
}

export function createValidatorLogTable(
    db: Database,
    tableName: string = 'validatorlogs',
) {
    const command = db.prepare(
        `CREATE TABLE IF NOT EXISTS ${tableName} (
        votePubkey STRING,
        epoch INTEGER, 
        timestamp TIMESTAMP,
        commission INTEGER,
        credits INTEGER,
        lastVoteSlot INTEGER,
        PRIMARY KEY (votePubkey, epoch, timestamp)
    );`)
    // db.transaction(() => { command.run() })
    command.run();
    console.log("Created validatorlogs table!")
}

export function createPoolTable(
    db: Database
) {
    console.log("Run command!")
    const createValidatorTableCommand = db.prepare(
        `CREATE TABLE IF NOT EXISTS pools (
        stakerPubkey STRING,
        epoch INTEGER, 
        managerPubkey STRING,
        depositAuthority,
        totalStakeLamports,
        poolTokenSupply,
        PRIMARY KEY (stakerPubkey, epoch)
    );`)
    db.transaction(() => {
        createValidatorTableCommand.run();
    })
    console.log("Ran command!")
}


export function createPoolValidatorTable(
    db: Database

) {
    const command = db.prepare(`CREATE TABLE IF NOT EXISTS pool_validator (
        stakerPubkey STRING,
        epoch INTEGER, 
        validatorPubkey STRING,
        stakeInValidator INTEGER,
        PRIMARY KEY (stakerPubkey, epoch, validatorPubkey)
    )`)
    db.transaction(() => command.run())
}

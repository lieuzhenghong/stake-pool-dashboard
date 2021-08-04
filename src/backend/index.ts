import * as solanaWeb3 from '@solana/web3.js';
import Database from 'better-sqlite3';
import * as database from './database.js';

async function getValidatorAccounts(
  connection: solanaWeb3.Connection,
  stakeProgramAddress: solanaWeb3.PublicKey,
) {
  return connection.getVoteAccounts('confirmed');
}

function populateValidatorsTable(
  accountsInfo: Array<solanaWeb3.VoteAccountInfo>,
  currentEpoch: number,
  db: Database,
  tableName: string = 'validators',
) {
  // INSERT IGNORE inserts if not exist
  const insert = db.prepare(
    `INSERT OR IGNORE INTO ${tableName} VALUES (
            @votePubkey,
            @epoch,
            @activatedStake,
            @credits,
            @epochVoteAccount
        )`,
  );

  const items = accountsInfo
    .filter(account =>
      account.epochCredits.map(a => a[0]).includes(currentEpoch),
    )
    .map(account => {
      console.log(account);
      return {
        votePubkey: account.votePubkey,
        epoch: currentEpoch,
        activatedStake: account.activatedStake,
        credits: account.epochCredits.filter(x => x[0] == currentEpoch)[0][1],
        epochVoteAccount: account.epochVoteAccount ? 1 : 0,
      };
    });

  console.log(items);

  const insertMany = db.transaction(logs => {
    for (const validatorLog of logs) insert.run(validatorLog);
  });

  console.log(items);
  insertMany(items);
}

function populateValidatorLogsTable(
  accountsInfo: Array<solanaWeb3.VoteAccountInfo>,
  currentEpoch: number,
  db: Database,
  tableName: string = 'validatorlogs',
) {
  /* Populate validator logs table */

  /* For each entry in epochCredits,
  override the existing epochCredits
  */
  const insert = db.prepare(
    `INSERT INTO ${tableName} VALUES (
            @votePubkey,
            @epoch,
            @timestamp,
            @commission,
            @credits,
            @lastVote
            )`,
  );

  const items = accountsInfo
    .filter(account =>
      account.epochCredits.map(a => a[0]).includes(currentEpoch),
    )
    .map(account => {
      return {
        votePubkey: account.votePubkey,
        epoch: currentEpoch,
        timestamp: new Date().toLocaleString(),
        commission: account.commission,
        credits: account.epochCredits.filter(x => x[0] == currentEpoch)[0][1],
        lastVote: account.lastVote,
      };
    });

  const insertMany = db.transaction(logs => {
    for (const validatorLog of logs) insert.run(validatorLog);
  });

  insertMany(items);
}

const connectionMainnet = new solanaWeb3.Connection(
  'https://api.mainnet-beta.solana.com/',
  'confirmed',
);

const connectionTestnet = new solanaWeb3.Connection(
  'https://api.testnet.solana.com/',
  'confirmed',
);

const STAKE_PROGRAM_ADDR = new solanaWeb3.PublicKey(
  'Stake11111111111111111111111111111111111111',
);

async function main() {
  const db = database.openDb();
  const validatorTable = database.createValidatorTable(db);
  const validatorLogTable = database.createValidatorLogTable(db);

  const validatorTableTestnet = database.createValidatorTable(
    db,
    'validatorsTestnet',
  );
  const validatorLogTableTestnet = database.createValidatorLogTable(
    db,
    'validatorlogsTestnet',
  );

  const poolTableTestnet = database.createPoolTable(db, 'poolsTestnet');
  const poolValidatorTableTestnet = database.createPoolValidatorTable(
    db,
    'pool_validatorTestnet',
  );
}

async function updateData() {
  const db = database.openDb();

  // Update Mainnet
  const accounts = await getValidatorAccounts(
    connectionMainnet,
    STAKE_PROGRAM_ADDR,
  );
  const activeAccounts = accounts.current;
  const currentEpoch = (await connectionMainnet.getEpochInfo('confirmed'))
    .epoch;
  console.log(currentEpoch);
  populateValidatorsTable(activeAccounts, currentEpoch, db);
  populateValidatorLogsTable(activeAccounts, currentEpoch, db);

  // Update Testnet
  const accountsTestnet = await getValidatorAccounts(
    connectionTestnet,
    STAKE_PROGRAM_ADDR,
  );
  const activeAccountsTestnet = accountsTestnet.current;
  const currentEpochTestnet = (
    await connectionTestnet.getEpochInfo('confirmed')
  ).epoch;
  console.log(currentEpochTestnet);
  populateValidatorsTable(
    activeAccountsTestnet,
    currentEpochTestnet,
    db,
    'validatorsTestnet',
  );
  populateValidatorLogsTable(
    activeAccountsTestnet,
    currentEpochTestnet,
    db,
    'validatorlogsTestnet',
  );
}

// setInterval(updateData, 300000);
main();

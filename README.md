# Stake Pool Dashboard

Code to build a real-time dashboard for stake pools

## Introduction

The idea is to make real-time RPC calls to inspect the state
of the stake pools and validators, 
and log this state as it changes in real time.

A validator is something that validates the blockchain.
It can receive stake delegated to it,
and earns rewards that are given to the owners of the stake
that are delegated to it.

A stake pool is a pool of stake. Each stake pool delegates
stake to many different validators. 
There is a one-to-many relationship between a stake pool
and a validator. 
`StakePoolValidators = Array<[Validator, number]>` where
`number` is the amount of stake delegated to that validator.

## Architecture

### ValidatorHistory Table

A validator history entry is a snapshot of the validator's state
at some point in time. This is used to calculate the performance
of the validator.

- Validator pubkey as foreign key (? <-- does this work)
- Epoch + Timestamp is the composite primary key
- Each validator-epoch-timestamp contains:
    - vote pubkey
    - epoch
    - timestamp
    - activatedStake
    - commission
    - epochVoteAccount
    - epochCredits
    - lastVote

### StakePool Table

A stake pool

A stake pool can change its validator set only every epoch
(not in real time). Hence we do not need to have StakePool
and StakePoolHistory. (is this good practice?)

- Each Stake Pool + Epoch is a composite primary key
- Each stake pool epoch contains:
    - stakerPubKey
    - epoch
    - managerPubkey
    - depositAuthority
    - poolMint
    - totalStakeLamports // only updated every epoch
    - poolTokenSupply
    - validators: `Array<[Validator, number]>`

### ValidatorPerformance Table 

"Composite" table computed from historical validator performance

Main thing is: at every epoch, how much did they start with, how much did they end with
Things like uptime, APY, etc etc should all be calculated.
This can be calculated from the ValidatorLog history 

So i'm thinking of running a cronjob and filling up the table


### PoolPerformance Table

- "Composite" table that is computed from the validators

For each valdiator, we calculate its performance, and from there we
can calculate the pool's performance.


## Obsolete stuff

The amount that is staked changes only on epoch boundaries [^0]:

> A delegation or deactivation takes several epochs to complete, with a fraction of the delegation becoming active or inactive at each epoch boundary after the transaction containing the instructions has been submitted to the cluster.

[^0]: https://docs.solana.com/staking/stake-accounts

This means that it's sufficient to calculate a validator's performance only every epoch -- we leave the slot-by-slot delinquency calculations 


So each stake pool should essentially have a data structure that goes like: in every epoch, how much did it delegate to each validator?

Given the stake delegated to each validator at the start of the epoch, and the eventual result stake,
we can find the stake a

How are stake rewards given out? Every epoch?

> During redemption, the stake program counts the points earned by the stake for each epoch, multiplies that by the epoch's point value, and transfers lamports in that amount from a rewards account into the stake and vote accounts according to the vote account's commission setting.

> https://docs.solana.com/terminology#point
> A weighted credit in a rewards regime. In the validator rewards regime, the number of points owed to a stake during redemption is the product of the vote credits earned and the number of lamports staked.

> https://docs.solana.com/terminology#vote-credit
> A reward tally for validators. A vote credit is awarded to a validator in its vote account when the validator reaches a root.


> https://docs.solana.com/cluster/stake-delegation-and-rewards#basics
> The network pays rewards from a portion of network inflation. The number of lamports available to pay rewards for an epoch is fixed and must be evenly divided among all staked nodes according to their relative stake weight and participation. The weighting unit is called a point.

Rewards for an epoch are not available until the end of that epoch.

At the end of each epoch, the total number of points earned during the epoch is summed and used to divide the rewards portion of epoch inflation to arrive at a point value. This value is recorded in the bank in a sysvar that maps epochs to point values.

During redemption, the stake program counts the points earned by the stake for each epoch, multiplies that by the epoch's point value, and transfers lamports in that amount from a rewards account into the stake and vote accounts according to the vote account's commission setting.
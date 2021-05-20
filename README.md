# Stake Pool Dashboard

Code to build a real-time dashboard for stake pools

## Architecture

Validators Table

- Each validator pubkey + epoch is a composite primary key
(maybe timestamp? since we don't know slot)
- Each validator epoch contains:
    - epochCredits

Stake Pool Table

- Each Stake Pool + Epoch is a composite primary key
- Each stake pool epoch contains:
    - 

Combined Table?

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
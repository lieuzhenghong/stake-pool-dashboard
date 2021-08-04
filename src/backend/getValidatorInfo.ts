import * as solanaWeb3 from '@solana/web3.js';

/**
 * getValidatorInfo
 * Get all validator info: pubkey, keybase username, name, website.
 * @returns Promise<ValidatorInfo[]>
 */
export async function getValidatorInfo(connection: solanaWeb3.Connection): Promise<solanaWeb3.ValidatorInfo[]> {
	const configAccounts = await connection.getProgramAccounts(new solanaWeb3.PublicKey('Config1111111111111111111111111111111111111'))
	const infos = configAccounts.map((configAccount) =>
		solanaWeb3.ValidatorInfo.fromConfigData(configAccount.account.data))

	return infos.filter(x => x !== null);
}
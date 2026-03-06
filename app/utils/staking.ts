type StakeVoteAccountInfo = Readonly<{
    activatedStake: bigint;
}>;

type StakeVoteAccounts = Readonly<{
    current: readonly StakeVoteAccountInfo[];
    delinquent: readonly StakeVoteAccountInfo[];
}>;

export function getStakeTotals(voteAccounts?: StakeVoteAccounts) {
    if (!voteAccounts) {
        return {
            activeStake: undefined,
            delinquentStake: undefined,
        };
    }

    const delinquentStake = voteAccounts.delinquent.reduce(
        (prev, current) => prev + current.activatedStake,
        BigInt(0)
    );
    const activeStake =
        voteAccounts.current.reduce((prev, current) => prev + current.activatedStake, BigInt(0)) + delinquentStake;

    return {
        activeStake,
        delinquentStake,
    };
}

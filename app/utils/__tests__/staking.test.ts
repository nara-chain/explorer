import { describe, expect, it } from 'vitest';

import { getStakeTotals } from '../staking';

describe('getStakeTotals', () => {
    it('returns undefined totals when vote accounts are unavailable', () => {
        expect(getStakeTotals()).toEqual({
            activeStake: undefined,
            delinquentStake: undefined,
        });
    });

    it('includes current stake even when delinquent stake is zero', () => {
        expect(
            getStakeTotals({
                current: [{ activatedStake: 100n }, { activatedStake: 25n }],
                delinquent: [],
            })
        ).toEqual({
            activeStake: 125n,
            delinquentStake: 0n,
        });
    });

    it('adds delinquent stake into the active stake total', () => {
        expect(
            getStakeTotals({
                current: [{ activatedStake: 100n }],
                delinquent: [{ activatedStake: 5n }, { activatedStake: 10n }],
            })
        ).toEqual({
            activeStake: 115n,
            delinquentStake: 15n,
        });
    });
});

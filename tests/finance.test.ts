import * as f from '../src/engine/finance';

const near = (actual: number, expected: number, dp = 2) => expect(actual).toBeCloseTo(expected, dp);

describe('Lecture 2 examples', () => {
  it('lighting system NPV at 4% is $19,758', () => near(f.npv(0.04, [-230000, 90000, 90000, 90000]), 19758, 0));
  it('lottery: $100k for 20 years at 10% is $851,356', () => near(f.annuity(100000, 0.1, 20), 851356, 0));
  it('lottery: 50 years is $991,481', () => near(f.annuity(100000, 0.1, 50), 991481, 0));
  it('car loan EAR at 6.75% daily is 6.982%', () => near(f.ear(0.0675, 365) * 100, 6.982, 2));
});

describe('BMA Ch2 assigned problems', () => {
  it('P2a discount factor 125/139', () => near(125 / 139, 0.899, 3));
  it('P2b rate implied by DF over 5 years ≈ 2.15%', () => near((Math.pow(139 / 125, 1 / 5) - 1) * 100, 2.15, 2));
  it('P8a perpetuity of $1 at 10% = 10', () => near(f.perpetuity(1, 0.1), 10));
  it('P8b perpetuity starting year 8 ≈ 5.13 (exact)', () => near(f.delayedPerpetuity(1, 0.1, 8), 5.13, 2));
  it('P8c 7-year annuity ≈ 4.87', () => near(f.annuity(1, 0.1, 7), 4.87, 2));
  it('P8d growing land income = $200,000', () => near(f.growingPerpetuity(10000, 0.1, 0.05), 200000));
  it('P12a car = $7,835.26', () => near(f.pvSingle(10000, 0.05, 5), 7835.26));
  it('P12b school fees = $55,474.56', () => near(f.annuity(12000, 0.08, 6), 55474.56));
  it('P12c remainder = $7,936.66', () => near(f.fvSingle(60476 - f.annuity(12000, 0.08, 6), 0.08, 6), 7936.66, 1));
  it('P22 Kangaroo PV ≈ $8,938 so Turtle ($9,000) is worse', () => {
    const kangaroo = 1000 + f.annuity(300, 0.0083, 30);
    near(kangaroo, 8938.2, 0);
    expect(kangaroo).toBeLessThan(9000);
  });
  it('P32 level spend = $233,659', () => near(f.loanPayment(2e6, 0.08, 15), 233659, 0));
  it('P32 inflation-linked first-year spend = $185,070.59', () => {
    const c = 2e6 / f.growingAnnuity(1, 0.08, 0.04, 15);
    near(c, 185070.59, 1);
  });
  it('P36 payment = $17,436.91', () => near(f.loanPayment(200000, 0.06, 20), 17436.91));
  it('P36 balance after 10 = $128,337.19', () => near(f.loanBalance(200000, 0.06, 20, 10), 128337.19, 1));
  it('P36 fraction repaid after 10 = 35.8%', () => near(f.fractionRepaid(200000, 0.06, 20, 10) * 100, 35.8, 1));
  it('P36 first payment interest share = 68.8%', () => near(f.interestShare(200000, 0.06, 20, 1) * 100, 68.82, 1));
  it('P36 last payment interest share = 5.66%', () => near(f.interestShare(200000, 0.06, 20, 20) * 100, 5.66, 1));
  it('amortisation table closes at zero', () => near(f.amortisationTable(200000, 0.06, 20).rows[19].closing, 0, 4));
});

describe('BMA Ch3 worked solutions', () => {
  it('P3 bund = €92.64', () => near(f.bondPrice(5, 0.06, 10, 100), 92.64));
  it('P5 semi-annual Treasury = $1,023.16', () => near(f.bondPrice(27.5, 0.026, 20, 1000), 1023.16));
  it('P6 real rate = 4.76%', () => near(f.realRate(0.1, 0.05) * 100, 4.76));
  it('P7 nominal 16.64%, real 7.85%', () => {
    near((Math.pow(1.08, 2) - 1) * 100, 16.64);
    near((Math.pow(1.08, 2) / (1.03 * 1.05) - 1) * 100, 7.85);
  });
});

describe('mock exam', () => {
  it('Q6 EAR on 12% monthly = 12.68%', () => near(f.ear(0.12, 12) * 100, 12.68));
});

describe('brief reference: studio lease', () => {
  it('annuity due of €24k × 5 at 6% ≈ €107,162', () => near(f.annuityDue(24000, 0.06, 5), 107162.53, 1));
});

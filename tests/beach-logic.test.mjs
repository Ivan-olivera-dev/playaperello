import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isSummerSeason,
  getDaysUntilSummer,
  getVotingPeriod,
  predictBeachFlag,
} from '../src/lib/beach-logic.js';

test('isSummerSeason detects June 1 to September 30 in Europe/Madrid', () => {
  assert.equal(isSummerSeason(new Date('2026-04-16T12:00:00Z')), false);
  assert.equal(isSummerSeason(new Date('2026-05-31T21:00:00Z')), false);
  assert.equal(isSummerSeason(new Date('2026-06-01T10:00:00Z')), true);
  assert.equal(isSummerSeason(new Date('2026-08-15T16:00:00Z')), true);
  assert.equal(isSummerSeason(new Date('2026-09-30T12:00:00Z')), true);
  assert.equal(isSummerSeason(new Date('2026-10-01T12:00:00Z')), false);
});

test('getDaysUntilSummer returns remaining days until June 1 when off-season', () => {
  assert.equal(getDaysUntilSummer(new Date('2026-05-22T10:00:00Z')), 10);
  assert.equal(getDaysUntilSummer(new Date('2026-07-10T10:00:00Z')), 0);
});

test('getVotingPeriod closes voting outside summer and outside active hours', () => {
  const springMorning = getVotingPeriod(new Date('2026-04-16T09:00:00Z'));
  assert.equal(springMorning.isSummer, false);
  assert.equal(springMorning.periodKey, null);

  const summerMorning = getVotingPeriod(new Date('2026-07-10T09:00:00Z'));
  assert.equal(summerMorning.isSummer, true);
  assert.equal(summerMorning.period, 'morning');
  assert.equal(summerMorning.periodKey, '2026-07-10_morning');

  const summerSiesta = getVotingPeriod(new Date('2026-07-10T13:30:00Z')); // 15:30 CEST
  assert.equal(summerSiesta.isSummer, true);
  assert.equal(summerSiesta.periodKey, null);
});

test('predictBeachFlag returns green on calm sea with light thermal breeze', () => {
  const result = predictBeachFlag({
    waveHeight: 0.2,
    wavePeriod: 4.0,
    waveDirection: 110,
    windSpeed: 14,
    windGusts: 20,
    windDirection: 135, // SE Garbí suave
  });
  assert.equal(result.flag, 'green');
  assert.equal(result.reasonKey, 'calm');
});

test('predictBeachFlag returns yellow when long-period swell hits the shore step', () => {
  const result = predictBeachFlag({
    waveHeight: 0.28,
    wavePeriod: 8.0, // mar de fondo
    waveDirection: 90,
    windSpeed: 10,
    windGusts: 15,
    windDirection: 90,
  });
  assert.equal(result.flag, 'yellow');
  assert.equal(result.reasonKey, 'shorebreak');
});

test('predictBeachFlag returns yellow on moderate waves or moderate onshore wind', () => {
  const moderateWaves = predictBeachFlag({
    waveHeight: 0.4,
    wavePeriod: 5.0,
    waveDirection: 90,
    windSpeed: 12,
    windGusts: 18,
    windDirection: 90,
  });
  assert.equal(moderateWaves.flag, 'yellow');

  const moderateOnshore = predictBeachFlag({
    waveHeight: 0.2,
    wavePeriod: 4.0,
    waveDirection: 90,
    windSpeed: 19,
    windGusts: 29,
    windDirection: 90,
  });
  assert.equal(moderateOnshore.flag, 'yellow');
});

test('predictBeachFlag returns red on rough waves, heavy swell, or strong Levante', () => {
  const highWaves = predictBeachFlag({
    waveHeight: 0.7,
    wavePeriod: 6.0,
    waveDirection: 90,
    windSpeed: 15,
    windGusts: 22,
    windDirection: 90,
  });
  assert.equal(highWaves.flag, 'red');

  const strongLevante = predictBeachFlag({
    waveHeight: 0.35,
    wavePeriod: 5.0,
    waveDirection: 90,
    windSpeed: 26,
    windGusts: 40,
    windDirection: 90,
  });
  assert.equal(strongLevante.flag, 'red');
});

#!/usr/bin/env node
/**
 * Automated Game Test Runner
 * Runs multiple complete games to test game logic robustness
 *
 * Usage:
 *   node src/test/runGameTests.js [numGames] [--verbose]
 *
 * Examples:
 *   node src/test/runGameTests.js          # Run 10 games
 *   node src/test/runGameTests.js 20       # Run 20 games
 *   node src/test/runGameTests.js 5 --verbose  # Run 5 games with detailed logging
 */

const GameTestHarness = require('./gameTestHarness.cjs');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const numGames = parseInt(args.find(a => !a.startsWith('--'))) || 10;
const verbose = args.includes('--verbose') || args.includes('-v');

// Output directory for error reports
const outputDir = path.join(__dirname, '../../test-output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function runTests() {
  console.log('\n🎲 Monopoly Bible Automated Game Tester');
  console.log('='.repeat(50));
  console.log(`Running ${numGames} automated game${numGames > 1 ? 's' : ''}...`);
  console.log(`Verbose mode: ${verbose ? 'ON' : 'OFF'}`);
  console.log(`Max turns per game: 500`);
  console.log('='.repeat(50) + '\n');

  const results = {
    passed: 0,
    failed: 0,
    naturalEndings: 0,
    turnLimitHits: 0,
    totalTurns: 0,
    minTurns: Infinity,
    maxTurns: 0,
    errors: [],
    gameReports: []
  };

  const startTime = Date.now();

  for (let i = 1; i <= numGames; i++) {
    if (verbose) {
      console.log(`\n--- Game ${i} ---`);
    }

    const harness = new GameTestHarness({
      maxTurns: 500,
      verbose: verbose,
      gameNumber: i,
      teamCount: 4
    });

    try {
      const report = harness.runGame();
      results.gameReports.push(report);

      const hasErrors = report.errors.length > 0;
      const status = hasErrors ? '❌ FAILED' :
        report.turnLimitReached ? '⚠️  LIMIT' : '✅ PASSED';

      if (hasErrors) {
        results.failed++;
        results.errors.push(...report.errors.map(e => ({ ...e, gameNumber: i })));

        // Save error report
        const filepath = harness.saveErrorReport(outputDir);
        console.log(`${status} Game ${i}: ${report.errors.length} error(s) at turn ${report.turns}`);
        if (filepath) {
          console.log(`   State dump: ${path.basename(filepath)}`);
        }
      } else if (report.turnLimitReached) {
        results.turnLimitHits++;
        results.passed++; // Still counts as passed, just didn't end naturally
        console.log(`${status} Game ${i}: Turn limit (${report.turns}) - no winner determined`);
      } else {
        results.passed++;
        results.naturalEndings++;
        const winner = report.winner;
        console.log(`${status} Game ${i}: Natural end in ${report.turns} turns (Winner: ${winner?.name} - $${winner?.finalScore?.toFixed(0)})`);
      }

      // Update stats
      results.totalTurns += report.turns;
      results.minTurns = Math.min(results.minTurns, report.turns);
      results.maxTurns = Math.max(results.maxTurns, report.turns);

    } catch (error) {
      results.failed++;
      results.errors.push({
        gameNumber: i,
        error: error.message,
        stack: error.stack
      });
      console.log(`❌ FAILED Game ${i}: Crashed - ${error.message}`);
    }
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Summary');
  console.log('='.repeat(50));
  console.log(`   Total games:      ${numGames}`);
  console.log(`   ✅ Passed:        ${results.passed}/${numGames}`);
  console.log(`   ❌ Failed:        ${results.failed}/${numGames}`);
  console.log(`   Natural endings:  ${results.naturalEndings}/${numGames}`);
  console.log(`   Turn limit hits:  ${results.turnLimitHits}/${numGames}`);
  console.log('');
  console.log(`   Avg turns/game:   ${(results.totalTurns / numGames).toFixed(1)}`);
  console.log(`   Min turns:        ${results.minTurns}`);
  console.log(`   Max turns:        ${results.maxTurns}`);
  console.log(`   Total time:       ${duration}s`);
  console.log(`   Avg time/game:    ${(parseFloat(duration) / numGames * 1000).toFixed(0)}ms`);

  // Error details
  if (results.errors.length > 0) {
    console.log('\n' + '='.repeat(50));
    console.log('❌ Errors Found');
    console.log('='.repeat(50));

    // Group by error message
    const errorGroups = {};
    results.errors.forEach(e => {
      const key = e.error || (e.issues ? e.issues.join(', ') : 'Unknown');
      if (!errorGroups[key]) {
        errorGroups[key] = [];
      }
      errorGroups[key].push(e);
    });

    Object.entries(errorGroups).forEach(([msg, errors], idx) => {
      console.log(`\n${idx + 1}. ${msg}`);
      console.log(`   Occurrences: ${errors.length}`);
      console.log(`   Games: ${errors.map(e => `#${e.gameNumber}`).join(', ')}`);
      if (errors[0].turn !== undefined) {
        console.log(`   Turns: ${errors.map(e => e.turn).join(', ')}`);
      }
    });

    console.log(`\n📁 Error reports saved to: ${outputDir}`);
  }

  // Winner statistics
  if (results.naturalEndings > 0) {
    console.log('\n' + '='.repeat(50));
    console.log('🏆 Winner Statistics');
    console.log('='.repeat(50));

    const winCounts = {};
    const winScores = {};

    results.gameReports.forEach(r => {
      if (r.winner && r.endedNaturally) {
        const name = r.winner.name;
        winCounts[name] = (winCounts[name] || 0) + 1;
        if (!winScores[name]) winScores[name] = [];
        winScores[name].push(r.winner.finalScore);
      }
    });

    Object.entries(winCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([name, count]) => {
        const avgScore = winScores[name].reduce((a, b) => a + b, 0) / winScores[name].length;
        console.log(`   ${name}: ${count} wins (${(count / results.naturalEndings * 100).toFixed(0)}%) - Avg score: $${avgScore.toFixed(0)}`);
      });
  }

  // Final status
  console.log('\n' + '='.repeat(50));
  if (results.failed === 0) {
    console.log('✅ All tests passed!');
  } else {
    console.log(`❌ ${results.failed} game(s) failed. Check error reports.`);
    process.exit(1);
  }

  return results;
}

// Run tests
runTests().catch(error => {
  console.error('Test runner crashed:', error);
  process.exit(1);
});

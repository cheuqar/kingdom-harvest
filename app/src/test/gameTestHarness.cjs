/**
 * Game Test Harness - Automated game simulation for testing
 * Runs complete games from setup to finish without UI
 */

const { gameReducer, createInitialState, calculateRent, landsData, shuffle, config } = require('./gameReducer.node.cjs');
const AI = require('./aiDecisionMaker.cjs');
const questionsData = require('../config/questions.json');
const fs = require('fs');
const path = require('path');

class GameTestHarness {
  constructor(options = {}) {
    this.state = null;
    this.actionLog = [];
    this.errorLog = [];
    this.turnCount = 0;
    this.maxTurns = options.maxTurns || 500;
    this.verbose = options.verbose || false;
    this.gameNumber = options.gameNumber || 1;
    this.teamCount = options.teamCount || 4;
  }

  // Log helper
  log(message) {
    if (this.verbose) {
      console.log(`  [Turn ${this.turnCount}] ${message}`);
    }
  }

  // Dispatch an action and update state
  dispatch(action) {
    try {
      const prevPhase = this.state?.phase;
      this.state = gameReducer(this.state, action);

      this.actionLog.push({
        turn: this.turnCount,
        action: action.type,
        payload: action.payload,
        resultPhase: this.state.phase
      });

      if (this.verbose && action.type !== 'ADD_LOG' && action.type !== 'SET_ANIMATION') {
        this.log(`${action.type} → phase: ${prevPhase} → ${this.state.phase}`);
      }
    } catch (error) {
      this.errorLog.push({
        turn: this.turnCount,
        phase: this.state?.phase,
        action: action.type,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  // Initialize a new game
  initGame() {
    const teamNames = [];
    for (let i = 0; i < this.teamCount; i++) {
      teamNames.push(`Team ${String.fromCharCode(65 + i)}`); // Team A, B, C, D
    }

    this.dispatch({
      type: 'INIT_GAME',
      payload: {
        teamNames,
        teamColors: null,
        gameDuration: 0,
        selectedEventDecks: ['default', 'money'],
        actionTimer: 0
      }
    });

    this.log(`Game initialized with ${this.teamCount} teams`);
  }

  // Get current team
  getCurrentTeam() {
    return this.state.teams[this.state.currentTeamIndex];
  }

  // Simulate rolling dice and handling the outcome
  simulateRoll() {
    const team = this.getCurrentTeam();

    // Skip bankrupt teams
    if (team.isBankrupt) {
      this.dispatch({ type: 'NEXT_TURN' });
      return;
    }

    // Roll dice
    const diceValue = Math.floor(Math.random() * 6) + 1;
    this.dispatch({ type: 'ROLL_DICE', payload: diceValue });
    this.log(`${team.name} rolled ${diceValue}`);

    // Check for 7th roll offering
    const newRollCount = this.state.teams[this.state.currentTeamIndex].rollCount;
    if (newRollCount % 7 === 0) {
      this.handleOffering();
    }

    // Handle dice outcome based on value
    if (diceValue <= 3) {
      // Draw land (or random land if dice is 3 or deck empty)
      if (this.state.deck.lands.length === 0 || diceValue === 3) {
        this.handleRandomLand();
      } else {
        this.handleDrawLand();
      }
    } else if (diceValue === 4) {
      // Build inn phase
      this.handleBuildInn();
    } else {
      // Draw event (5-6)
      this.handleDrawEvent();
    }
  }

  // Handle 7th roll offering
  handleOffering() {
    const team = this.getCurrentTeam();

    // Add replenishment bonus
    this.dispatch({
      type: 'ADD_CASH',
      payload: { teamId: team.id, amount: 1000 }
    });
    this.dispatch({ type: 'ADD_LOG', payload: '每7次擲骰獎勵：銀行發放 $1000！' });

    // Calculate offering amounts
    const updatedTeam = this.state.teams[this.state.currentTeamIndex];
    const totalIncome = updatedTeam.incomeSinceLastReplenish || 0;
    const oneTenthAmount = Math.floor(totalIncome / 10);
    const seeds = Math.floor(oneTenthAmount / 100);
    const doubleSeeds = seeds * 2;

    // Set offering state
    this.dispatch({
      type: 'START_OFFERING',
      payload: { totalIncome, oneTenthAmount, seeds, doubleSeeds }
    });

    // AI makes offering decision
    const choice = AI.chooseOffering(updatedTeam, { oneTenthAmount, seeds, doubleSeeds });

    if (choice === 'tithe' && oneTenthAmount > 0) {
      this.dispatch({
        type: 'ADD_CASH',
        payload: { teamId: team.id, amount: -oneTenthAmount, skipIncomeTracking: true }
      });
      this.dispatch({
        type: 'ADD_SEEDS',
        payload: { teamId: team.id, amount: seeds }
      });
      this.dispatch({ type: 'ADD_LOG', payload: `${team.name} 奉獻十分之一 $${oneTenthAmount}，獲得 ${seeds} 顆種子！` });
    } else if (choice === 'double' && oneTenthAmount > 0) {
      const doubleAmount = oneTenthAmount * 2;
      this.dispatch({
        type: 'ADD_CASH',
        payload: { teamId: team.id, amount: -doubleAmount, skipIncomeTracking: true }
      });
      this.dispatch({
        type: 'ADD_SEEDS',
        payload: { teamId: team.id, amount: doubleSeeds }
      });
      this.dispatch({ type: 'ADD_LOG', payload: `${team.name} 雙倍奉獻 $${doubleAmount}，獲得 ${doubleSeeds} 顆種子！` });
    } else {
      this.dispatch({ type: 'ADD_LOG', payload: `${team.name} 選擇不奉獻。` });
    }

    // Complete offering
    this.dispatch({ type: 'COMPLETE_OFFERING', payload: { teamId: team.id } });

    // Handle ranking summary if triggered
    if (this.state.rankingSummary?.triggered) {
      this.dispatch({
        type: 'SHOW_RANKING_SUMMARY',
        payload: { round: this.state.rankingSummary.round }
      });
      // Immediately dismiss for testing
      this.dispatch({ type: 'DISMISS_RANKING_SUMMARY' });
    }
  }

  // Handle drawing a land card
  handleDrawLand() {
    if (this.state.deck.lands.length === 0) {
      this.dispatch({ type: 'ADD_LOG', payload: '土地牌庫已空！' });
      this.dispatch({ type: 'NEXT_TURN' });
      return;
    }

    const card = this.state.deck.lands[0];
    this.dispatch({ type: 'DRAW_LAND_CARD' });
    this.dispatch({ type: 'SET_PHASE', payload: 'DRAW_LAND' });
    this.dispatch({ type: 'SET_CARD', payload: card });

    // Check for question
    const question = questionsData.find(q => q.landId === card.id);
    if (question) {
      const isCorrect = AI.answerQuestion(0.7);
      if (!isCorrect) {
        this.dispatch({ type: 'ADD_TO_AUCTION', payload: card });
        this.dispatch({ type: 'ADD_LOG', payload: '回答錯誤，無法購買土地，土地進入拍賣池。' });
        this.dispatch({ type: 'NEXT_TURN' });
        return;
      }
    }

    // AI decides to buy or skip
    const team = this.getCurrentTeam();
    if (AI.shouldBuyLand(team, card)) {
      this.buyLand(card);
    } else {
      this.skipLand(card);
    }
  }

  // Handle random land selection
  handleRandomLand() {
    const randomIndex = Math.floor(Math.random() * landsData.length);
    const land = landsData[randomIndex];
    const landState = this.state.lands[land.id];

    this.dispatch({ type: 'SET_CARD', payload: land });

    if (!landState.ownerId) {
      // Unowned - can buy
      this.dispatch({ type: 'SET_PHASE', payload: 'DRAW_LAND' });

      // Remove from deck if present
      const deckIndex = this.state.deck.lands.findIndex(l => l.id === land.id);
      if (deckIndex !== -1) {
        const newLands = [...this.state.deck.lands];
        newLands.splice(deckIndex, 1);
        this.dispatch({ type: 'UPDATE_LAND_DECK', payload: newLands });
      }

      const team = this.getCurrentTeam();
      if (AI.shouldBuyLand(team, land)) {
        this.buyLand(land);
      } else {
        this.skipLand(land);
      }
    } else if (landState.ownerId !== this.getCurrentTeam().id) {
      // Owned by other - pay rent
      this.handlePayRent(land, landState);
    } else {
      // Owned by self - can build inn
      this.dispatch({ type: 'SET_PHASE', payload: 'BUILD_INN' });
      this.handleBuildInn();
    }
  }

  // Buy a land card
  buyLand(card) {
    const team = this.getCurrentTeam();

    if (team.cash >= card.price) {
      this.dispatch({
        type: 'ADD_CASH',
        payload: { teamId: team.id, amount: -card.price }
      });
      this.dispatch({
        type: 'UPDATE_LAND',
        payload: { landId: card.id, updates: { ownerId: team.id } }
      });
      this.dispatch({ type: 'ADD_LOG', payload: `${team.name} 購買了 ${card.name}` });
      this.dispatch({ type: 'NEXT_TURN' });
    } else {
      // Trigger auction
      this.startAuction(card);
    }
  }

  // Skip buying a land card
  skipLand(card) {
    this.startAuction(card);
  }

  // Start an auction
  startAuction(card) {
    const team = this.getCurrentTeam();
    const eligibleTeams = this.state.teams.filter(t => t.id !== team.id && !t.isBankrupt);
    const bidderIds = eligibleTeams.map(t => t.id);
    const startBid = Math.floor(card.price * 0.5);

    if (bidderIds.length === 0) {
      this.dispatch({ type: 'ADD_LOG', payload: `${card.name} 無人可競拍，進入拍賣池。` });
      this.dispatch({ type: 'ADD_TO_AUCTION', payload: card });
      this.dispatch({ type: 'NEXT_TURN' });
      return;
    }

    this.dispatch({
      type: 'START_AUCTION',
      payload: {
        landId: card.id,
        startBid,
        bidders: bidderIds
      }
    });
    this.dispatch({ type: 'ADD_LOG', payload: `${card.name} 進入拍賣！起標價 $${startBid}` });

    this.runAuction(card);
  }

  // Run the auction process
  runAuction(card) {
    let rounds = 0;
    const maxRounds = 20; // Prevent infinite loops

    while (this.state.auction && this.state.auction.activeBidders.length > 0 && rounds < maxRounds) {
      rounds++;
      const activeBidders = [...this.state.auction.activeBidders];
      let anyBidThisRound = false;

      for (const bidderId of activeBidders) {
        if (!this.state.auction || !this.state.auction.activeBidders.includes(bidderId)) continue;

        const bidder = this.state.teams.find(t => t.id === bidderId);
        const decision = AI.shouldBid(bidder, this.state.auction.highestBid, card);

        if (decision.shouldBid) {
          this.dispatch({
            type: 'PLACE_BID',
            payload: { teamId: bidderId, amount: decision.amount }
          });
          anyBidThisRound = true;
        } else {
          this.dispatch({
            type: 'PASS_AUCTION',
            payload: { teamId: bidderId }
          });
        }
      }

      // If no one bid this round, end auction
      if (!anyBidThisRound) break;
    }

    // Resolve auction
    this.resolveAuction(card);
  }

  // Resolve the auction
  resolveAuction(card) {
    if (!this.state.auction) {
      this.dispatch({ type: 'NEXT_TURN' });
      return;
    }

    const { highestBidderId, highestBid, landId } = this.state.auction;
    const land = landsData.find(l => l.id === landId);

    if (highestBidderId) {
      const winner = this.state.teams.find(t => t.id === highestBidderId);
      this.dispatch({
        type: 'ADD_CASH',
        payload: { teamId: winner.id, amount: -highestBid }
      });
      this.dispatch({
        type: 'UPDATE_LAND',
        payload: { landId: land.id, updates: { ownerId: winner.id } }
      });
      this.dispatch({ type: 'ADD_LOG', payload: `拍賣結束！${winner.name} 以 $${highestBid} 購得 ${land.name}` });
    } else {
      this.dispatch({ type: 'ADD_LOG', payload: '無人出價，土地流拍。' });
      this.dispatch({ type: 'ADD_TO_AUCTION', payload: card });
    }

    this.dispatch({ type: 'END_AUCTION' });
    this.dispatch({ type: 'NEXT_TURN' });
  }

  // Handle paying rent
  handlePayRent(land, landState) {
    const team = this.getCurrentTeam();
    const ownerId = landState.ownerId;
    const owner = this.state.teams.find(t => t.id === ownerId);
    const rent = calculateRent(land, landState, ownerId, this.state.lands);

    this.dispatch({
      type: 'ADD_CASH',
      payload: { teamId: team.id, amount: -rent }
    });
    this.dispatch({
      type: 'ADD_CASH',
      payload: { teamId: ownerId, amount: rent }
    });
    this.dispatch({ type: 'ADD_LOG', payload: `${team.name} 支付租金 $${rent} 給 ${owner.name}` });
    this.dispatch({ type: 'NEXT_TURN' });
  }

  // Handle building an inn
  handleBuildInn() {
    const team = this.getCurrentTeam();
    const ownedLands = landsData.filter(l => this.state.lands[l.id].ownerId === team.id);

    if (ownedLands.length === 0) {
      // No lands - fall back to draw land
      this.dispatch({ type: 'ADD_LOG', payload: '無土地可建旅店，改為抽土地卡！' });
      if (this.state.deck.lands.length === 0) {
        this.handleRandomLand();
      } else {
        this.handleDrawLand();
      }
      return;
    }

    this.dispatch({ type: 'SET_PHASE', payload: 'BUILD_INN' });

    const chosenLand = AI.chooseLandForInn(team, ownedLands, this.state.lands);

    if (chosenLand && team.cash >= chosenLand.innCost) {
      this.dispatch({
        type: 'ADD_CASH',
        payload: { teamId: team.id, amount: -chosenLand.innCost }
      });
      this.dispatch({
        type: 'UPDATE_LAND',
        payload: {
          landId: chosenLand.id,
          updates: { innCount: this.state.lands[chosenLand.id].innCount + 1 }
        }
      });
      this.dispatch({ type: 'ADD_LOG', payload: `${team.name} 在 ${chosenLand.name} 建了一間旅店` });
    }

    this.dispatch({ type: 'NEXT_TURN' });
  }

  // Handle drawing an event card
  handleDrawEvent() {
    let deck = [...this.state.deck.events];

    if (deck.length === 0) {
      // Reshuffle discard
      if (this.state.deck.eventDiscard.length > 0) {
        deck = shuffle([...this.state.deck.eventDiscard]);
        this.dispatch({
          type: 'UPDATE_EVENT_DECK',
          payload: { events: deck, eventDiscard: [] }
        });
      } else {
        this.dispatch({ type: 'ADD_LOG', payload: '事件牌庫已空！' });
        this.dispatch({ type: 'NEXT_TURN' });
        return;
      }
    }

    const card = this.state.deck.events[0];
    this.dispatch({ type: 'DRAW_EVENT_CARD' });
    this.dispatch({ type: 'SET_PHASE', payload: 'DRAW_EVENT' });
    this.dispatch({ type: 'SET_CARD', payload: card });

    this.executeEvent(card);
  }

  // Execute an event card's effect
  executeEvent(card) {
    const team = this.getCurrentTeam();

    if (card.type === 'decision') {
      // AI makes decision
      const choice = AI.makeDecision(card.yEffect, card.nEffect, team);
      const effect = choice === 'Y' ? card.yEffect : card.nEffect;

      if (effect) {
        if (effect.cash) {
          this.dispatch({ type: 'ADD_CASH', payload: { teamId: team.id, amount: effect.cash } });
        }
        if (effect.seeds) {
          this.dispatch({ type: 'ADD_SEEDS', payload: { teamId: team.id, amount: effect.seeds } });
        }
      }
      this.dispatch({ type: 'ADD_LOG', payload: `${team.name} 選擇了 ${choice === 'Y' ? '是' : '否'}。` });
    } else if (card.type === 'miracle') {
      // Add to inventory
      this.dispatch({ type: 'ADD_MIRACLE', payload: { teamId: team.id, card } });
      this.dispatch({ type: 'ADD_LOG', payload: `${team.name} 獲得神蹟卡：${card.name}` });
    } else {
      // Execute immediate effect based on effectCode
      this.executeEffectCode(card, team);
    }

    this.dispatch({ type: 'NEXT_TURN' });
  }

  // Execute effect code
  executeEffectCode(card, team) {
    const params = card.params || {};

    switch (card.effectCode) {
      case 'E_PAY_CASH':
        this.dispatch({ type: 'ADD_CASH', payload: { teamId: team.id, amount: -(params.amount || 0) } });
        this.dispatch({ type: 'ADD_LOG', payload: `支付 $${params.amount}` });
        break;

      case 'E_GAIN_CASH_BY_SEED': {
        let amount = params.base || 0;
        if (team.seeds >= (params.threshold || 0)) {
          amount += params.bonus || 0;
        }
        this.dispatch({ type: 'ADD_CASH', payload: { teamId: team.id, amount } });
        this.dispatch({ type: 'ADD_LOG', payload: `獲得 $${amount}` });
        break;
      }

      case 'E_GAIN_CASH_PER_SEED': {
        let amount = (params.base || 0) + (team.seeds * (params.perSeed || 0));
        if (params.max && amount > params.max) amount = params.max;
        this.dispatch({ type: 'ADD_CASH', payload: { teamId: team.id, amount } });
        this.dispatch({ type: 'ADD_LOG', payload: `獲得 $${amount} (種子加成)` });
        break;
      }

      case 'E_PAY_AND_GAIN_SEED':
        this.dispatch({ type: 'ADD_CASH', payload: { teamId: team.id, amount: -(params.pay || 0) } });
        this.dispatch({ type: 'ADD_SEEDS', payload: { teamId: team.id, amount: params.seed || 0 } });
        this.dispatch({ type: 'ADD_LOG', payload: `付 $${params.pay}，獲得種子 +${params.seed}` });
        break;

      case 'E_PAY_CASH_OR_SEED':
        if (team.seeds > 0) {
          this.dispatch({ type: 'ADD_CASH', payload: { teamId: team.id, amount: -Math.floor((params.amount || 0) / 2) } });
          this.dispatch({ type: 'ADD_SEEDS', payload: { teamId: team.id, amount: -1 } });
          this.dispatch({ type: 'ADD_LOG', payload: `消耗種子減半支付 $${Math.floor((params.amount || 0) / 2)}` });
        } else {
          this.dispatch({ type: 'ADD_CASH', payload: { teamId: team.id, amount: -(params.amount || 0) } });
          this.dispatch({ type: 'ADD_LOG', payload: `支付 $${params.amount}` });
        }
        break;

      case 'E_MANIP_RICH_TO_POOR': {
        const sorted = [...this.state.teams].sort((a, b) => b.cash - a.cash);
        const rich = sorted[0];
        const poor = sorted[sorted.length - 1];
        if (rich.id !== poor.id) {
          this.dispatch({ type: 'ADD_CASH', payload: { teamId: rich.id, amount: -(params.amount || 0) } });
          this.dispatch({ type: 'ADD_CASH', payload: { teamId: poor.id, amount: params.amount || 0 } });
          this.dispatch({ type: 'ADD_LOG', payload: `${rich.name} 轉移 $${params.amount} 給 ${poor.name}` });
        }
        break;
      }

      case 'E_BUFF_NEXT_RENT':
        this.dispatch({ type: 'ADD_CASH', payload: { teamId: team.id, amount: 100 } });
        this.dispatch({ type: 'ADD_LOG', payload: `獲得租金加成獎勵 $100` });
        break;

      case 'E_PAY_MULTIPLIER_RENT_RANDOM': {
        const otherLands = landsData.filter(l => {
          const ownerId = this.state.lands[l.id].ownerId;
          return ownerId && ownerId !== team.id;
        });

        if (otherLands.length > 0) {
          const randomLand = otherLands[Math.floor(Math.random() * otherLands.length)];
          const ownerId = this.state.lands[randomLand.id].ownerId;
          const owner = this.state.teams.find(t => t.id === ownerId);
          const baseRent = calculateRent(randomLand, this.state.lands[randomLand.id], ownerId, this.state.lands);
          const finalRent = baseRent * (params.multiplier || 1);

          this.dispatch({ type: 'ADD_CASH', payload: { teamId: team.id, amount: -finalRent } });
          this.dispatch({ type: 'ADD_CASH', payload: { teamId: ownerId, amount: finalRent } });
          this.dispatch({ type: 'ADD_LOG', payload: `隨機選中 ${owner.name} 的 ${randomLand.name}，支付 ${params.multiplier} 倍租金 $${finalRent}` });
        }
        break;
      }

      case 'E_COLLECT_RENT_SERIES': {
        const teamLands = landsData.filter(l =>
          l.series === params.series && this.state.lands[l.id].ownerId === team.id
        );

        if (teamLands.length > 0) {
          let maxRent = 0;
          let bestLand = teamLands[0];

          teamLands.forEach(l => {
            const r = calculateRent(l, this.state.lands[l.id], team.id, this.state.lands);
            if (r > maxRent) {
              maxRent = r;
              bestLand = l;
            }
          });

          let gain = 0;
          this.state.teams.forEach(t => {
            if (t.id !== team.id && !t.isBankrupt) {
              this.dispatch({ type: 'ADD_CASH', payload: { teamId: t.id, amount: -maxRent } });
              gain += maxRent;
            }
          });
          this.dispatch({ type: 'ADD_CASH', payload: { teamId: team.id, amount: gain } });
          this.dispatch({ type: 'ADD_LOG', payload: `執行收租【${params.series}】：${bestLand.name}，金額 $${maxRent}` });
        } else {
          this.dispatch({ type: 'ADD_LOG', payload: `沒有「${params.series}」系列土地，無法收租。` });
        }
        break;
      }

      default:
        this.dispatch({ type: 'ADD_LOG', payload: `執行事件: ${card.name}` });
    }
  }

  // Simulate one complete turn
  simulateTurn() {
    if (this.state.phase === 'GAME_OVER') {
      return;
    }

    // Ensure we're in ROLL phase
    if (this.state.phase !== 'ROLL') {
      // Try to recover
      this.dispatch({ type: 'SET_PHASE', payload: 'ROLL' });
    }

    this.simulateRoll();
    this.turnCount++;
  }

  // Validate game state
  validateState() {
    const issues = [];

    // Check for negative cash without bankruptcy
    this.state.teams.forEach(t => {
      if (t.cash < 0 && !t.isBankrupt) {
        issues.push(`Team ${t.name} has negative cash ($${t.cash}) but not bankrupt`);
      }
    });

    // Check current team index bounds
    if (this.state.currentTeamIndex >= this.state.teams.length) {
      issues.push(`Invalid currentTeamIndex: ${this.state.currentTeamIndex}`);
    }

    // Check for valid phase
    const validPhases = ['SETUP', 'RULES', 'ROLL', 'ROLLING', 'DRAW_LAND', 'DRAW_EVENT',
      'PAY_RENT', 'BUILD_INN', 'AUCTION', 'DECISION_EVENT', 'OFFERING_EVENT',
      'RANKING_SUMMARY', 'GAME_OVER'];
    if (!validPhases.includes(this.state.phase)) {
      issues.push(`Invalid phase: ${this.state.phase}`);
    }

    // Check land ownership integrity
    Object.entries(this.state.lands).forEach(([landId, landState]) => {
      if (landState.ownerId) {
        const owner = this.state.teams.find(t => t.id === landState.ownerId);
        if (!owner) {
          issues.push(`Land ${landId} has invalid owner: ${landState.ownerId}`);
        }
      }
    });

    if (issues.length > 0) {
      this.errorLog.push({ turn: this.turnCount, issues });
    }

    return issues;
  }

  // Run a complete game
  runGame() {
    this.initGame();

    while (this.state.phase !== 'GAME_OVER' && this.turnCount < this.maxTurns) {
      try {
        this.simulateTurn();
        this.validateState();
      } catch (error) {
        this.errorLog.push({
          turn: this.turnCount,
          phase: this.state.phase,
          error: error.message,
          stack: error.stack
        });

        // Try to recover
        try {
          this.dispatch({ type: 'NEXT_TURN' });
        } catch (e) {
          // Can't recover, stop
          break;
        }
      }
    }

    return this.getReport();
  }

  // Get final report
  getReport() {
    const endedNaturally = this.state.phase === 'GAME_OVER';
    const winner = this.state.winner?.team;

    return {
      gameNumber: this.gameNumber,
      turns: this.turnCount,
      endedNaturally,
      turnLimitReached: this.turnCount >= this.maxTurns,
      winner: winner ? {
        name: winner.name,
        finalScore: winner.finalScore,
        cash: winner.cash,
        seeds: winner.seeds
      } : null,
      teams: this.state.teams.map(t => ({
        name: t.name,
        cash: t.cash,
        seeds: t.seeds,
        isBankrupt: t.isBankrupt,
        landCount: Object.values(this.state.lands).filter(l => l.ownerId === t.id).length
      })),
      errors: this.errorLog,
      actionCount: this.actionLog.length,
      state: this.state,
      actionLog: this.actionLog
    };
  }

  // Save error report to file
  saveErrorReport(outputDir) {
    if (this.errorLog.length === 0) return;

    const filename = `game_${this.gameNumber}_error_turn${this.turnCount}.json`;
    const filepath = path.join(outputDir, filename);

    const report = {
      gameNumber: this.gameNumber,
      turnNumber: this.turnCount,
      phase: this.state.phase,
      errors: this.errorLog,
      state: this.state,
      actionLog: this.actionLog.slice(-50) // Last 50 actions
    };

    fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
    return filepath;
  }
}

module.exports = GameTestHarness;

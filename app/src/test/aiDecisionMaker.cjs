/**
 * AI Decision Maker for automated game testing
 * Simulates player decisions with configurable strategies
 */

const AIDecisionMaker = {
  // Roll phase - always roll (no choice really)
  shouldRoll: () => true,

  // Land purchase - buy if affordable with some buffer
  shouldBuyLand: (team, land) => {
    // Buy if we can afford it and still have some cash left
    const cashAfterPurchase = team.cash - land.price;
    return cashAfterPurchase >= 200; // Keep at least $200 buffer
  },

  // Question answering - configurable correct rate (default 70%)
  answerQuestion: (correctRate = 0.7) => {
    return Math.random() < correctRate;
  },

  // Auction bidding - bid if affordable and strategically sound
  shouldBid: (team, currentBid, land) => {
    // Don't bid more than 70% of our cash
    const maxBid = Math.floor(team.cash * 0.7);
    // Don't bid more than 120% of land price
    const maxReasonableBid = Math.floor(land.price * 1.2);
    const bidLimit = Math.min(maxBid, maxReasonableBid);

    // Bid if current bid is below our limit
    if (currentBid >= bidLimit) return { shouldBid: false };

    // 60% chance to bid if we can afford it
    if (Math.random() > 0.4) {
      // Increment by 10-30% of current bid
      const increment = Math.floor(currentBid * (0.1 + Math.random() * 0.2));
      const newBid = currentBid + Math.max(increment, 50); // Minimum $50 increment
      if (newBid <= bidLimit) {
        return { shouldBid: true, amount: newBid };
      }
    }

    return { shouldBid: false };
  },

  // Offering choice - weighted random selection
  chooseOffering: (team, offeringInfo) => {
    const { oneTenthAmount } = offeringInfo;

    // Can't tithe if we don't have enough cash
    if (team.cash < oneTenthAmount) return 'none';

    // Can't double if we don't have enough cash
    const canDouble = team.cash >= oneTenthAmount * 2;

    const r = Math.random();
    if (r < 0.25) return 'none';  // 25% skip
    if (r < 0.75 || !canDouble) return 'tithe';  // 50% tithe (or tithe if can't double)
    return 'double';  // 25% double
  },

  // Decision event - weighted based on effects
  makeDecision: (yEffect, nEffect, team) => {
    // Calculate net effect for each choice
    const yNet = (yEffect?.cash || 0) + ((yEffect?.seeds || 0) * 100); // Value seeds at $100 each
    const nNet = (nEffect?.cash || 0) + ((nEffect?.seeds || 0) * 100);

    // Prefer the choice with better net effect, with some randomness
    if (yNet > nNet + 100) return 'Y';  // Y is clearly better
    if (nNet > yNet + 100) return 'N';  // N is clearly better

    // Close call - random with slight preference for positive effects
    return Math.random() > 0.5 ? 'Y' : 'N';
  },

  // Build inn - choose best value land to build on
  chooseLandForInn: (team, ownedLands, landsState) => {
    // Filter to affordable inns
    const affordable = ownedLands.filter(l => team.cash >= l.innCost);

    if (affordable.length === 0) return null;

    // Prefer lands with fewer inns (diminishing returns) and lower inn cost
    // Also consider series completion
    const scored = affordable.map(land => {
      const currentInns = landsState[land.id]?.innCount || 0;
      // Prefer building where we have fewer inns (max 3 per land is typical)
      const innScore = currentInns < 3 ? (3 - currentInns) * 100 : 0;
      // Prefer cheaper inns
      const costScore = 500 - land.innCost;
      // Random factor
      const randomScore = Math.random() * 100;

      return {
        land,
        score: innScore + costScore + randomScore
      };
    });

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    // 70% chance to build on best option, 30% skip
    if (Math.random() < 0.7 && scored.length > 0) {
      return scored[0].land;
    }

    return null;
  },

  // Use miracle card - decide if and which to use
  shouldUseMiracle: (team, miracles, gameState) => {
    if (!miracles || miracles.length === 0) return null;

    // 20% chance to use a miracle card each turn
    if (Math.random() > 0.2) return null;

    // Pick a random miracle to use
    return miracles[Math.floor(Math.random() * miracles.length)];
  },

  // Sell land - decide if we need to sell to avoid bankruptcy
  shouldSellLand: (team, ownedLands, deficit) => {
    if (team.cash >= 0) return null; // No need to sell

    // Find land to sell that covers the deficit
    // Prefer selling lowest value lands first
    const sorted = [...ownedLands].sort((a, b) => {
      const aValue = a.price / 2; // Sell value is half
      const bValue = b.price / 2;
      return aValue - bValue; // Ascending order
    });

    for (const land of sorted) {
      const sellValue = Math.floor(land.price / 2);
      if (sellValue >= Math.abs(team.cash)) {
        return land;
      }
    }

    // Return first available if none covers deficit
    return sorted[0] || null;
  }
};

module.exports = AIDecisionMaker;

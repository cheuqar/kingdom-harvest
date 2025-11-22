import config from '../config/config.json' with { type: "json" };

export const calculateRent = (land, landState, ownerId, landsData, allLandsState) => {
    let rent = land.baseRent + (landState.innCount * land.innRentIncrement);

    // Series Bonus
    const seriesLands = landsData.filter(l => l.series === land.series);
    const ownerSeriesCount = seriesLands.filter(l => allLandsState[l.id]?.ownerId === ownerId).length;

    let multiplier = 1.0;
    if (ownerSeriesCount === 2) multiplier = config.seriesBonus["2"];
    if (ownerSeriesCount === 3) multiplier = config.seriesBonus["3"];
    if (ownerSeriesCount === 4) multiplier = config.seriesBonus["4"];

    return Math.floor(rent * multiplier);
};

export const checkBankruptcy = (team) => {
    return team.cash < 0;
};

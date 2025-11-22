import React from 'react';
import './CardDisplay.css';

const CardDisplay = ({ card, type }) => {
    if (!card) return null;

    if (type === 'land') {
        return (
            <div className="card land-card">
                <div className="card-header" style={{ backgroundColor: getSeriesColor(card.series) }}>
                    <h3>{card.name}</h3>
                    <span className="series-name">{card.series}</span>
                </div>
                <div className="card-body">
                    <div className="price-tag">${card.price}</div>
                    <div className="stats">
                        <div className="stat"><span>基本租金</span> <span>${card.baseRent}</span></div>
                        <div className="stat"><span>旅店加租</span> <span>+${card.innRentIncrement}</span></div>
                        <div className="stat"><span>旅店費用</span> <span>${card.innCost}</span></div>
                    </div>
                    <div className="bible-ref">{card.bibleRef}</div>
                </div>
            </div>
        );
    }

    if (type === 'event') {
        return (
            <div className="card event-card">
                <div className="card-header event-header">
                    <h3>{card.name}</h3>
                    <span className="event-type">{getEventTypeLabel(card.type)}</span>
                </div>
                <div className="card-body">
                    <p className="description">{card.description}</p>
                    {card.effectCode && <div className="effect-code">{card.effectCode}</div>}
                </div>
            </div>
        );
    }

    return null;
};

export const getSeriesColor = (series) => {
    const map = {
        "祖先與應許": "#8d6e63",
        "出埃及與曠野": "#ef5350",
        "王國與敬拜": "#ffa726",
        "耶穌腳蹤": "#42a5f5",
        "宣教拓展": "#66bb6a",
        "普世與啟示": "#ab47bc"
    };
    return map[series] || "#78909c";
};

export const getEventTypeLabel = (type) => {
    const map = {
        rent: "收租",
        seed: "播種",
        harvest: "收成",
        trial: "試煉",
        miracle: "神蹟",
        manipulation: "操作"
    };
    return map[type] || type;
};

export default CardDisplay;

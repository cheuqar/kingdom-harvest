import React from 'react';
import { useGame } from '../state/GameContext';
import './RulesScreen.css';

const RulesScreen = () => {
    const { dispatch } = useGame();

    const handleStart = () => {
        dispatch({ type: 'START_GAME' });
    };

    return (
        <div className="rules-screen">
            <div className="rules-content">
                <h1>遊戲規則</h1>
                <div className="rules-list">
                    <section>
                        <h3>基本玩法</h3>
                        <p>1. 輪流擲骰子，根據點數觸發不同事件。</p>
                        <p>2. 1-3 點：抽取土地卡。若土地無主可購買，有主則需支付租金。</p>
                        <p>3. 4 點：旅店階段。若擁有土地，可在土地上建造旅店增加租金。</p>
                        <p>4. 5-6 點：抽取事件卡，觸發各種特殊效果。</p>
                    </section>
                    <section>
                        <h3>勝利條件</h3>
                        <p>1. 當只剩下一位玩家未破產時，該玩家獲勝。</p>
                        <p>2. 若設定了遊戲時間，時間結束時資產總值最高的玩家獲勝。</p>
                    </section>
                    <section>
                        <h3>特殊規則</h3>
                        <p>1. 每擲骰 7 次，銀行發放 $1000 獎勵。</p>
                        <p>2. 破產時可半價出售土地。</p>
                    </section>
                </div>
                <button className="btn-primary" onClick={handleStart}>開始遊戲</button>
            </div>
        </div>
    );
};

export default RulesScreen;

# 1. 專案概要

**名稱**：天國大富翁（Kingdom Harvest）
**類型**：多人同桌遊玩、以「隊伍為單位」的卡牌+擲骰桌遊，瀏覽器單頁應用程式 (SPA)。
**平台**：桌面瀏覽器 / 平板瀏覽器（手機可用橫向模式）。
**運行方式**：

* 可直接以 `index.html` + 靜態資源 本地打開。
* 所有遊戲邏輯執行於瀏覽器（無伺服器必要）。
* 可從外部載入：

  * `config.json`（遊戲設定）
  * `lands.json`（土地卡定義）
  * `events.json`（事件卡定義）
  * `questions.json`（聖經問答）
  * 圖片資源（卡面 / icon）

**核心信息主題**：

1. 「多種的多收，有的還要加給他」：忠心、給予、付代價 → 後期更多祝福 / 收成。
2. 遊戲機制上，以「播種標記」「系列土地加成」「神蹟 & 恩典保命卡」具體呈現。

---

# 2. 遊戲規則摘要（供實作）

### 2.1 玩家與隊伍

* 支援 **2–4 隊**。
* 每隊 1–7 人（App 只記隊伍，不記個人）。
* 每隊起始資金：**$5000**（可在 `config.json` 調整）。

### 2.2 卡組

1. **土地卡組**（24 張）

   * 已定義真實聖經地名，分 6 系列，每系列 4 張。
   * 每卡屬性：`id, name, series, price, baseRent, innRentIncrement, innCost, bibleRef`。
2. **事件卡組**（77 張）

   * 分類包含：收租、播種、收成、試煉、神蹟保命卡、操作 / 逆轉卡。
   * 每卡屬性：`id, name, type, description, effectCode`。
3. **棄牌堆**：

   * 土地棄牌堆（供部分技能檢索）
   * 事件棄牌堆。
4. **待拍賣池 / 特殊池**

   * 未被購入的土地可放入「待拍賣池」（後續可加入拍賣機制 or 特殊事件觸發）。

### 2.3 擲骰規則（每回合）

使用一粒骰（1–6），可用：

* 內建虛擬骰按鈕（建議）
* 或玩家使用外部手機 app 擲骰，再手動選擇點數（可在設定開關）。

擲出後依結果：

1. **1 或 2：抽土地卡**

   * 從土地牌庫頂抽 1 張未擁有土地。
   * 觸發「聖經問答」（由 App 出題或手動判定）。
   * 答對 → 可選擇以卡面價格向銀行購買，成為該隊土地。
   * 答錯 / 放棄 → 該土地進入「待拍賣池」。
2. **3 或 4：建旅店（Inn）**

   * 若隊伍擁有至少一塊土地：

     * 可選擇 1 塊己方土地，支付該卡「建旅店費用」建 1 間旅店。
     * 一塊地可有多間旅店（無上限）。
     * 該地每次收租時，租金 = `baseRent + innCount * innRentIncrement`。
   * 若無土地 → 本回合無事發生。
3. **5 或 6：抽事件卡**

   * 從事件卡組抽 1 張，立即按卡面效果執行：

     * 可能是收租、付款、獲得播種標記、觸發神蹟、操作卡等。
   * 用畢大多數事件卡進入棄牌堆（除非是長效狀態卡，見 4.4）。

### 2.4 播種（Seed）機制

* 部分事件卡會給玩家【播種+1】（以 token 表示）。
* 播種標記 **不自動失去**（除特定卡效果）。
* 某些祝福 / 收成卡會依播種數量增加收益。
* 實作上：每隊 `seedCount` 整數值。

### 2.5 系列土地加成（多種多收）

共 6 系列，每系列 4 張。規則建議寫死在 `config.json`：

* 擁有同一系列：

  * 2 張 → 該系列土地收租 +50%
  * 3 張 → 該系列土地收租 x2
  * 4 張 → 該系列土地收租 x3
* App 自動計算加成後的有效租金。

### 2.6 神蹟與恩典保命

* 特定事件卡標記為「Miracle / Grace」類型：

  * 在玩家即將破產 / 無力付款時，可按卡面效果減免、補貼或延遲付款。
  * 僅一次性使用，使用後丟入棄牌堆。
* 遊戲平衡原則：

  * 可救命，但不會讓玩家無限回血或碾壓全場。

### 2.7 破產 & 勝利條件

* 玩家隊伍在遇上「必須付款」事件：

  * 若手上現金 + 可立即出售旅店 / 土地仍不足 → 立即破產，淘汰。
  * （是否強制賣產業再判定，可在 `config` 設：`forceLiquidateBeforeBankrupt: true/false`）
* 當只剩 **1 隊未破產** → 該隊獲勝（可顯示總資產作紀錄）。

---

# 3. 系統架構

## 3.1 技術棧（建議）

* **HTML5 + CSS3 + 原生 JavaScript (ES6+)**
* 可支援使用任一前端框架（React/Vue/Svelte）但 Spec 不強制。
* 檔案結構示例：

```text
/ index.html
/ css/
    styles.css
/ js/
    main.js
    gameEngine.js
    ui.js
    state.js
    configLoader.js
    cards.js
    effects.js
/ config/
    config.json
    lands.json
    events.json
    questions.json
/ assets/
    images/cards/*.png
    images/ui/*.png
```

## 3.2 模組職責

### 3.2.1 `configLoader.js`

* 載入 `config.json`, `lands.json`, `events.json`, `questions.json`。
* 提供 Promise-based API，例如：

  * `loadConfig()`
  * `getLands()`
  * `getEvents()`
  * `getQuestions()`

### 3.2.2 `state.js`

負責遊戲狀態儲存：

* 遊戲靜態設定：起始金額 / 骰子模式。
* 動態狀態：

  * `teams[]`: 每隊 { id, name, cash, lands[], seeds, miracleTokens[], isBankrupt, effects[] }
  * `landsDeck`, `landsDiscard`, `eventDeck`, `eventDiscard`, `auctionPool`
  * `currentTurnTeamId`
  * `phase`（如：等待擲骰 → 處理結果 → 等待確認 → 回合結束）
  * `log[]`（簡單文字戰報）
* 提供：

  * `initGame(teams, config, cards)`
  * `nextTurn()`
  * `applyCashChange(teamId, delta)`
  * `assignLand(teamId, landId)`
  * `addSeed(teamId, count)`
  * `addEffect(teamId, effectObj)`
  * `checkBankrupt(teamId)` 等。

> 可選：支援 localStorage，自動儲存 / 載入遊戲進度。

### 3.2.3 `gameEngine.js`

執行遊戲邏輯：

* `rollDice()` 或 `setDiceValue(manualValue)`
* 處理擲骰結果 → 呼叫對應 handler：

  * `handleLandDraw()`
  * `handleBuildInn()`
  * `handleEventDraw()`
* 計算實際租金（含旅店 + 系列加成）。
* 呼叫 `effects.js` 執行事件卡效果。

### 3.2.4 `effects.js`

* 保存事件卡 `effectCode` 與實際邏輯實作的 mapping。
* Ex:

  * `E_COLLECT_RENT_SERIES`
  * `E_SEED_PLUS_ONE`
  * `E_BLESSING_SCALING_BY_SEED`
  * `E_MIRACLE_SAVE_FROM_BANKRUPT`
  * `E_SWAP_CASH_TOP_BOTTOM`
* 每個 effect 接收 `(state, currentTeam, card)`，內部更新 state 和 log。
* 支援有條件觸發（例如「當即將破產時可用」→ 用 UI 讓玩家選擇使用）。

### 3.2.5 `ui.js`

* UI 更新與事件綁定：

  * 顯示目前隊伍、現金、種子數、土地、旅店數。
  * 顯示牌堆剩餘、棄牌、待拍賣池數量（簡略即可）。
  * 顯示當前回合指示。
  * 操作按鈕：
    -「開始遊戲」「下一隊」「擲骰」「抽事件」「建旅店」「使用卡牌 / 神蹟」等。
  * 顯示彈出層：

    * 抽到的卡牌內容
    * 聖經問答（問題 + 輸入 / 判定按鈕）
    * 確認付款 / 收款視窗
    * 使用神蹟卡選擇

---

# 4. 資料結構 Spec

## 4.1 `config.json`（示例）

```json
{
  "initialCash": 5000,
  "minTeams": 2,
  "maxTeams": 4,
  "forceLiquidateBeforeBankrupt": true,
  "diceMode": "internal", 
  "seriesBonus": {
    "2": 1.5,
    "3": 2.0,
    "4": 3.0
  },
  "enableSeeds": true,
  "logMaxEntries": 100
}
```

## 4.2 `lands.json`（示例一筆）

```json
[
  {
    "id": "land_shechem",
    "name": "示劍",
    "series": "祖先與應許",
    "price": 200,
    "baseRent": 40,
    "innRentIncrement": 30,
    "innCost": 80,
    "bibleRef": "創世記 12:6-7"
  }
]
```

## 4.3 `events.json`（結構示例）

```json
[
  {
    "id": "ev_collect_series_promise",
    "name": "按地收租：祖先與應許系列",
    "type": "rent",
    "effectCode": "E_COLLECT_RENT_SERIES",
    "params": {
      "series": "祖先與應許"
    }
  },
  {
    "id": "ev_seed_secret_blessing",
    "name": "暗中祝福有需要的肢體",
    "type": "seed",
    "effectCode": "E_PAY_AND_GAIN_SEED",
    "params": {
      "pay": 100,
      "seed": 1
    }
  },
  {
    "id": "ev_miracle_five_loaves",
    "name": "五餅二魚",
    "type": "miracle",
    "effectCode": "E_MIRACLE_HALF_PAYMENT_AND_GRANT",
    "params": {
      "grant": 150
    }
  }
]
```

## 4.4 `questions.json`（聖經問答）

```json
[
  {
    "id": "q_bethlehem_birth",
    "landId": "land_bethlehem",
    "question": "耶穌出生在哪一個城？",
    "answer": "伯利恆"
  },
  {
    "id": "q_red_sea",
    "landId": "land_red_sea",
    "question": "以色列人出埃及後是在哪裡經歷海分開？",
    "answer": "紅海"
  }
]
```

**行為要求：**

* 若該土地有綁定問題 → 出題 → 主持人或系統判定正確與否：

  * 簡易版：顯示答案給帶領者人工判定（避免字串嚴格比對）。
  * 進階版：提供簡單文字比對（忽略空白 / 全形 / 簡繁）。

---

# 5. UI / UX Spec

## 5.1 版面配置（單頁）

**上方列 / Header：**

* 遊戲名稱「天國大富翁」
* 設定 / 重置按鈕
* 當前回合隊伍名稱
* 擲骰結果顯示區

**左側：隊伍狀態面板**

* 每隊一個卡片：

  * 隊伍名
  * 現金
  * 播種數（Seed）
  * 特殊標記（保護 / Miracle）
  * 是否破產（標示）

**中央：主要操作區**

* 大按鈕：「擲骰」 / 「手動輸入骰子」依設定顯示。
* 顯示當前抽到的：

  * 土地卡（名稱、系列、價格、經文）
  * 事件卡（名稱、描述、效果）
* 對應操作按鈕：

  * 買 / 不買土地
  * 建旅店（選地 + 確認支付）
  * 執行事件（收租 / 付錢 / 加種子 / 使用神蹟）

**右側：資訊 & Log**

* 動態戰報列表：

  * 「隊伍A 擲出 5，抽到事件卡：暗中祝福，付100，獲得播種+1」
  * 「隊伍B 使用 五餅二魚，應付 300 → 減半並獲得150補給」
* 牌堆概要（僅顯示數量）：

  * 土地牌庫剩餘、事件牌庫剩餘、棄牌堆等。

**底部：土地概覽（可選）**

* 小型列表顯示各土地歸屬 & 旅店數，方便玩家決策。

## 5.2 操作設計原則

* 所有關鍵動作需「確認」對話框，避免誤按。
* 盡量自動計算金額，並在 UI 顯示計算過程（透明）。
* 文字與按鈕用語淺白、適合非慣用遊戲玩家。

---

# 6. 非功能需求

1. **離線可用**：

   * 所有 JS / JSON / 圖片可打包在同一資料夾中運行。
2. **可配置性**：

   * 起始金額、系列加成、是否啟用種子機制等由 `config.json` 決定。
   * lands/events/questions 可被替換版本（不同年齡層 / 不同主題）。
3. **易擴充**：

   * 新事件卡只要在 `events.json` 新增同類 `effectCode` 即可。
4. **低門檻部署**：

   * 可直接放在教會網站 / 本地 USB / 雲端硬碟中打開。
5. **安全性**：

   * 無登入、無個資上傳。
   * 所有狀態只存於瀏覽器（可選 localStorage 作暫存）。

---

# 7. 實作提醒（給工程師）

* **effectCode 是關鍵抽象層**：
  所有事件邏輯用少量標準化 effect handler 實作，避免每張卡寫一次 if/else。

* 建議建立一個 `EFFECTS_MAP`：

```js
const EFFECTS_MAP = {
  "E_COLLECT_RENT_SERIES": (state, teamId, card) => { /* ... */ },
  "E_PAY_AND_GAIN_SEED": (state, teamId, card) => { /* ... */ },
  "E_MIRACLE_SAVE_FROM_BANKRUPT": (state, teamId, card) => { /* ... */ },
  // ...
};
```

* **Bankrupt 檢查**：在每次付款後檢查 `team.cash < 0` 或（依 config）盤點所有可變現資產。
* **Miracle 卡觸發**：

  * 當偵測「將導致破產」時，若該隊有可用神蹟卡，UI 彈出選項讓他選擇是否使用。
* **聖經問答模式**：

  * 簡易模式（預設）：顯示問題 & 答案文字，由帶領人實體裁決。
  * 進階模式：使用者輸入答案，系統用寬鬆比對（可在 config 切換）。

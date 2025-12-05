import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { db } from '../config/firebase';
import { ref, set, serverTimestamp } from 'firebase/database';
import './ScheduleGameScreen.css';

// Import event data for preview
import defaultEvents from '../config/events.json';
import moneyEvents from '../config/events_money.json';

const TEAM_COLORS = ['#e94560', '#4ecca3', '#3282b8', '#f1c40f'];

const TTL_OPTIONS = [
    { value: 1 * 60 * 60 * 1000, label: '1 小時' },
    { value: 6 * 60 * 60 * 1000, label: '6 小時' },
    { value: 24 * 60 * 60 * 1000, label: '24 小時' },
    { value: 7 * 24 * 60 * 60 * 1000, label: '7 天' },
    { value: 'custom', label: '自訂' }
];

const eventDeckInfo = {
    default: {
        name: '預設事件',
        description: '基本遊戲事件，包含各種日常生活中會遇到的選擇和挑戰。',
        events: defaultEvents
    },
    money: {
        name: '天國金錢管理',
        description: '以聖經教導為基礎的金錢管理事件，幫助玩家學習智慧理財和天國價值觀。',
        events: moneyEvents
    }
};

// Generate a random 6-character Room ID
const generateRoomId = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

const ScheduleGameScreen = ({ onBack, onRoomCreated }) => {
    const [phase, setPhase] = useState('config'); // 'config' | 'created'
    const [teamCount, setTeamCount] = useState(2);
    const [teamNames, setTeamNames] = useState(['隊伍 A', '隊伍 B', '隊伍 C', '隊伍 D']);
    const [selectedTTL, setSelectedTTL] = useState(24 * 60 * 60 * 1000);
    const [customTTLHours, setCustomTTLHours] = useState(24);
    const [isCreating, setIsCreating] = useState(false);
    const [createdRoom, setCreatedRoom] = useState(null);
    const [copiedUrl, setCopiedUrl] = useState(null);
    const [currentTeamView, setCurrentTeamView] = useState(0);

    // Game settings
    const [gameDuration, setGameDuration] = useState(0); // 0 means no limit
    const [actionTimer, setActionTimer] = useState(10); // seconds
    const [selectedDecks, setSelectedDecks] = useState(['default', 'money']);
    const [previewDeck, setPreviewDeck] = useState(null);

    const handleCreateRoom = async () => {
        setIsCreating(true);

        try {
            const roomId = generateRoomId();
            const ttlMs = selectedTTL === 'custom' ? customTTLHours * 60 * 60 * 1000 : selectedTTL;
            const expiresAt = Date.now() + ttlMs;
            const baseUrl = window.location.origin;
            const hostUrl = `${baseUrl}/host?room=${roomId}`;

            // Create room in Firebase
            await set(ref(db, `games/${roomId}/meta`), {
                createdAt: serverTimestamp(),
                expiresAt,
                status: 'scheduled',
                teamCount,
                hostUrl
            });

            // Save team config and game settings
            await set(ref(db, `games/${roomId}/config`), {
                teamNames: teamNames.slice(0, teamCount),
                teamColors: TEAM_COLORS.slice(0, teamCount),
                gameDuration: Number(gameDuration),
                actionTimer: Number(actionTimer),
                selectedEventDecks: selectedDecks
            });

            // Save to localStorage for later resume
            const scheduledGames = JSON.parse(localStorage.getItem('scheduled-games') || '[]');
            scheduledGames.push({
                roomId,
                hostUrl,
                expiresAt,
                teamCount,
                createdAt: Date.now()
            });
            localStorage.setItem('scheduled-games', JSON.stringify(scheduledGames));

            setCreatedRoom({
                roomId,
                hostUrl,
                expiresAt,
                teamCount,
                teamNames: teamNames.slice(0, teamCount)
            });
            setPhase('created');

            if (onRoomCreated) {
                onRoomCreated({ roomId, hostUrl });
            }
        } catch (error) {
            console.error('Failed to create room:', error);
            alert('Failed to create room. Please try again.');
        } finally {
            setIsCreating(false);
        }
    };

    const getPlayerUrl = (teamIndex) => {
        const baseUrl = window.location.origin;
        return `${baseUrl}/join?host=${createdRoom.roomId}&team=${teamIndex}`;
    };

    const handleCopyUrl = async (url, type) => {
        try {
            // Try modern clipboard API first
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(url);
            } else {
                // Fallback for non-secure contexts
                const textArea = document.createElement('textarea');
                textArea.value = url;
                textArea.style.position = 'fixed';
                textArea.style.left = '-9999px';
                textArea.style.top = '-9999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
            }
            setCopiedUrl(type);
            setTimeout(() => setCopiedUrl(null), 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    };

    const formatExpiry = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = timestamp - now.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays > 0) {
            return `${diffDays} 天 ${diffHours % 24} 小時後到期`;
        }
        return `${diffHours} 小時後到期`;
    };

    if (phase === 'created' && createdRoom) {
        return (
            <div className="schedule-screen created">
                <div className="schedule-content">
                    <div className="success-header">
                        <span className="success-icon">✅</span>
                        <h1>遊戲房間已建立</h1>
                        <p className="room-expiry">{formatExpiry(createdRoom.expiresAt)}</p>
                    </div>

                    {/* Host URL Section */}
                    <div className="url-section host-section">
                        <div className="section-header">
                            <span className="section-icon">👑</span>
                            <span className="section-title">主持人連結</span>
                        </div>
                        <p className="section-desc">使用此連結從任何裝置開始/恢復遊戲</p>
                        <div className="url-display">
                            <div className="qr-wrapper">
                                <QRCodeSVG
                                    value={createdRoom.hostUrl}
                                    size={150}
                                    level="M"
                                    includeMargin={true}
                                />
                            </div>
                            <div className="url-info">
                                <div className="room-code-display">
                                    <span className="room-label">房間代碼</span>
                                    <span className="room-code">{createdRoom.roomId}</span>
                                </div>
                                <button
                                    className={`btn-copy ${copiedUrl === 'host' ? 'copied' : ''}`}
                                    onClick={() => handleCopyUrl(createdRoom.hostUrl, 'host')}
                                >
                                    {copiedUrl === 'host' ? '✓ 已複製' : '📋 複製主持人連結'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Player URLs Section */}
                    <div className="url-section player-section">
                        <div className="section-header">
                            <span className="section-icon">👥</span>
                            <span className="section-title">玩家連結</span>
                        </div>
                        <p className="section-desc">分享給各隊伍的玩家</p>

                        {/* Team Selector */}
                        <div className="team-selector">
                            {createdRoom.teamNames.map((name, index) => (
                                <button
                                    key={index}
                                    className={`team-tab ${currentTeamView === index ? 'active' : ''}`}
                                    style={{
                                        '--team-color': TEAM_COLORS[index],
                                        borderColor: currentTeamView === index ? TEAM_COLORS[index] : 'transparent'
                                    }}
                                    onClick={() => setCurrentTeamView(index)}
                                >
                                    {name}
                                </button>
                            ))}
                        </div>

                        {/* Current Team QR */}
                        <div className="team-qr-display" style={{ '--team-color': TEAM_COLORS[currentTeamView] }}>
                            <div className="team-qr-header">
                                <span className="team-name">{createdRoom.teamNames[currentTeamView]}</span>
                            </div>
                            <div className="qr-wrapper large">
                                <QRCodeSVG
                                    value={getPlayerUrl(currentTeamView)}
                                    size={200}
                                    level="M"
                                    includeMargin={true}
                                />
                            </div>
                            <button
                                className={`btn-copy ${copiedUrl === `team-${currentTeamView}` ? 'copied' : ''}`}
                                onClick={() => handleCopyUrl(getPlayerUrl(currentTeamView), `team-${currentTeamView}`)}
                            >
                                {copiedUrl === `team-${currentTeamView}` ? '✓ 已複製' : '📋 複製玩家連結'}
                            </button>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="action-buttons">
                        <button className="btn-primary" onClick={() => window.location.href = createdRoom.hostUrl}>
                            <span className="btn-icon">🎮</span>
                            前往遊戲大廳
                        </button>
                        <button className="btn-secondary" onClick={onBack}>
                            返回主頁
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="schedule-screen">
            <div className="schedule-content">
                <div className="schedule-header">
                    <h1>預約遊戲</h1>
                    <p>建立遊戲房間，取得可分享的連結</p>
                </div>

                <div className="schedule-form">
                    {/* Team Settings */}
                    <div className="form-section">
                        <div className="section-header">
                            <span className="section-icon">👥</span>
                            <span className="section-title">隊伍設定</span>
                        </div>
                        <label>
                            隊伍數量:
                            <select value={teamCount} onChange={(e) => setTeamCount(Number(e.target.value))}>
                                <option value={2}>2 隊</option>
                                <option value={3}>3 隊</option>
                                <option value={4}>4 隊</option>
                            </select>
                        </label>

                        <div className="names-inputs">
                            {Array.from({ length: teamCount }).map((_, i) => (
                                <div key={i} className="team-name-input">
                                    <span
                                        className="team-color-dot"
                                        style={{ backgroundColor: TEAM_COLORS[i] }}
                                    ></span>
                                    <input
                                        value={teamNames[i]}
                                        onChange={(e) => {
                                            const newNames = [...teamNames];
                                            newNames[i] = e.target.value;
                                            setTeamNames(newNames);
                                        }}
                                        placeholder={`輸入隊伍 ${i + 1} 名稱`}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Game Settings */}
                    <div className="form-section">
                        <div className="section-header">
                            <span className="section-icon">⚙️</span>
                            <span className="section-title">遊戲設定</span>
                        </div>

                        <label>
                            <div className="label-with-icon">
                                <span className="label-icon">⏱️</span>
                                <span>遊戲時間 (分鐘)</span>
                            </div>
                            <input
                                type="number"
                                min="0"
                                value={gameDuration}
                                onChange={(e) => setGameDuration(e.target.value)}
                                placeholder="0 = 無限制"
                            />
                            <span className="hint">設定 0 表示無時間限制</span>
                        </label>

                        <label>
                            <div className="label-with-icon">
                                <span className="label-icon">⏲️</span>
                                <span>行動計時器 (秒)</span>
                            </div>
                            <input
                                type="number"
                                min="0"
                                max="60"
                                value={actionTimer}
                                onChange={(e) => setActionTimer(e.target.value)}
                                placeholder="10"
                            />
                            <span className="hint">建議 5-10 秒，設定 0 為無計時</span>
                        </label>
                    </div>

                    {/* Event Deck Selection */}
                    <div className="form-section">
                        <div className="section-header">
                            <span className="section-icon">🎴</span>
                            <span className="section-title">事件卡牌庫</span>
                        </div>
                        <div className="deck-options">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={selectedDecks.includes('default')}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setSelectedDecks([...selectedDecks, 'default']);
                                        } else {
                                            setSelectedDecks(selectedDecks.filter(d => d !== 'default'));
                                        }
                                    }}
                                />
                                <span className="checkbox-text">
                                    <span className="checkbox-name">預設事件</span>
                                    <span className="checkbox-desc">基本遊戲事件</span>
                                </span>
                                <button
                                    type="button"
                                    className="btn-preview-deck"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setPreviewDeck('default');
                                    }}
                                >
                                    ℹ️
                                </button>
                            </label>
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={selectedDecks.includes('money')}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setSelectedDecks([...selectedDecks, 'money']);
                                        } else {
                                            setSelectedDecks(selectedDecks.filter(d => d !== 'money'));
                                        }
                                    }}
                                />
                                <span className="checkbox-text">
                                    <span className="checkbox-name">天國金錢管理</span>
                                    <span className="checkbox-desc">聖經金錢教導</span>
                                </span>
                                <button
                                    type="button"
                                    className="btn-preview-deck"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setPreviewDeck('money');
                                    }}
                                >
                                    ℹ️
                                </button>
                            </label>
                        </div>
                        {selectedDecks.length === 0 && (
                            <span className="hint warning">請至少選擇一個卡牌庫</span>
                        )}
                    </div>

                    {/* Expiry Settings */}
                    <div className="form-section">
                        <div className="section-header">
                            <span className="section-icon">⏰</span>
                            <span className="section-title">有效期限</span>
                        </div>
                        <p className="section-desc">房間將在設定時間後自動過期</p>

                        <div className="ttl-options">
                            {TTL_OPTIONS.map((option) => (
                                <label
                                    key={option.value}
                                    className={`ttl-option ${selectedTTL === option.value ? 'selected' : ''}`}
                                >
                                    <input
                                        type="radio"
                                        name="ttl"
                                        value={option.value}
                                        checked={selectedTTL === option.value}
                                        onChange={() => setSelectedTTL(option.value)}
                                    />
                                    <span>{option.label}</span>
                                </label>
                            ))}
                        </div>

                        {selectedTTL === 'custom' && (
                            <div className="custom-ttl">
                                <label>
                                    <span>自訂時間 (小時):</span>
                                    <input
                                        type="number"
                                        min="1"
                                        max="168"
                                        value={customTTLHours}
                                        onChange={(e) => setCustomTTLHours(Number(e.target.value))}
                                    />
                                </label>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="action-buttons">
                        <button
                            className="btn-primary"
                            onClick={handleCreateRoom}
                            disabled={isCreating || selectedDecks.length === 0}
                        >
                            {isCreating ? (
                                <>
                                    <span className="loading-spinner-small"></span>
                                    建立中...
                                </>
                            ) : (
                                <>
                                    <span className="btn-icon">🔗</span>
                                    建立遊戲房間
                                </>
                            )}
                        </button>
                        <button className="btn-secondary" onClick={onBack}>
                            返回
                        </button>
                    </div>
                </div>
            </div>

            {/* Event Deck Preview Modal */}
            {previewDeck && eventDeckInfo[previewDeck] && (
                <div className="modal-overlay" onClick={() => setPreviewDeck(null)}>
                    <div className="deck-preview-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="btn-close-modal" onClick={() => setPreviewDeck(null)}>✕</button>

                        <h2 className="preview-title">
                            <span className="preview-icon">🎴</span>
                            {eventDeckInfo[previewDeck].name}
                        </h2>

                        <p className="preview-description">
                            {eventDeckInfo[previewDeck].description}
                        </p>

                        <div className="preview-events-section">
                            <h3>事件列表 ({eventDeckInfo[previewDeck].events.length} 張)</h3>
                            <div className="preview-events-list">
                                {eventDeckInfo[previewDeck].events.map((event, index) => (
                                    <div key={index} className="preview-event-card">
                                        <div className="preview-event-header">
                                            <span className="preview-event-name">{event.name}</span>
                                            <span className={`preview-event-type ${event.type}`}>
                                                {event.type === 'decision' ? '🤔 選擇' : '💰 金錢'}
                                            </span>
                                        </div>
                                        <p className="preview-event-desc">{event.description}</p>
                                        {event.type === 'decision' && event.yEffect && (
                                            <div className="preview-effects">
                                                <div className="preview-effect">
                                                    <span className="effect-label">✅ 是:</span>
                                                    <span className="effect-value">
                                                        {event.yEffect.cash !== 0 && ` $${event.yEffect.cash > 0 ? '+' + event.yEffect.cash : event.yEffect.cash}`}
                                                        {event.yEffect.seeds !== 0 && ` 🌰${event.yEffect.seeds > 0 ? '+' + event.yEffect.seeds : event.yEffect.seeds}`}
                                                    </span>
                                                </div>
                                                <div className="preview-effect">
                                                    <span className="effect-label">❌ 否:</span>
                                                    <span className="effect-value">
                                                        {event.nEffect?.cash !== 0 && ` $${event.nEffect.cash > 0 ? '+' + event.nEffect.cash : event.nEffect.cash}`}
                                                        {event.nEffect?.seeds !== 0 && ` 🌰${event.nEffect.seeds > 0 ? '+' + event.nEffect.seeds : event.nEffect.seeds}`}
                                                        {event.nEffect?.cash === 0 && event.nEffect?.seeds === 0 && ' 無效果'}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScheduleGameScreen;

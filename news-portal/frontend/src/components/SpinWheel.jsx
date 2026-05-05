
import React, { useState, useEffect } from 'react';
import './SpinWheel.css';

// Component để hiển thị số tung ngẫu nhiên
const DiceAnimatingNumber = () => {
  const [displayNumber, setDisplayNumber] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayNumber(Math.floor(Math.random() * 4) + 1);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return <span>{displayNumber}</span>;
};


// Hàm lấy userId/email hiện tại từ authUser prop
function getCurrentUserKey(authUser) {
  if (!authUser) return 'guest';
  return authUser.id ? String(authUser.id) : (authUser.email || 'guest');
}

const SpinWheel = ({ authUser, onSpinRequest }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [diceShake, setDiceShake] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasSpun, setHasSpun] = useState(false);
  const [resultDice, setResultDice] = useState(null);
  const [prizeMessage, setPrizeMessage] = useState('');
  const [showResult, setShowResult] = useState(false);
  // Không cần state cho thời gian chờ nữa

  const prizes = [
    { label: 'Giảm giá 15%', icon: '💰', color: '#ff6b6b' },
    { label: 'Tiền thưởng', icon: '💵', color: '#4ecdc4' },
    { label: 'Quay lại sau', icon: '🍀', color: '#ffd93d' },
    { label: 'Giảm giá 5%', icon: '🎁', color: '#a8e6cf' }
  ];

  const prizeCodeToIndex = {
    vip_discount_50: 0,
    free_vip_silver: 1,
    lucky_next_time: 2,
    vip_discount_5: 3
  };

  useEffect(() => {
    setHasSpun(Boolean(authUser?.spinWheel?.used));
  }, [authUser]);

  useEffect(() => {
    // Khi modal mở, nếu đã tung rồi thì hiển thị kết quả
    if (isModalOpen && hasSpun && resultDice) {
      setShowResult(true);
    }
  }, [isModalOpen]);



  const spin = async () => {
    if (isSpinning || hasSpun) return;
    if (!authUser) {
      alert('Vui lòng đăng nhập để tung xúc sắc.');
      return;
    }

    let prize = prizes[2].label; // Mặc định là "Quay lại sau"
    let rewardMessage = '';
    let targetIndex = Math.floor(Math.random() * prizes.length);

    setIsSpinning(true);
    setDiceShake(true);
    // Tạo phản hồi thị giác ngay khi nhấn nút tung
    setResultDice(null);

    try {
      if (onSpinRequest) {
        const rewardResult = await onSpinRequest();
        prize = rewardResult?.prize?.label || rewardResult?.prizeLabel || prize;
        rewardMessage = rewardResult?.message || '';
        const prizeCode = rewardResult?.prize?.code;
        if (typeof prizeCode === 'string' && Object.prototype.hasOwnProperty.call(prizeCodeToIndex, prizeCode)) {
          targetIndex = prizeCodeToIndex[prizeCode];
        }
      } else {
        throw new Error('Không tìm thấy xử lý quay thưởng từ máy chủ.');
      }
    } catch (error) {
      setIsSpinning(false);
      alert(error?.message || 'Không thể quay thưởng lúc này. Vui lòng thử lại.');
      return;
    }

    setTimeout(() => {
      setDiceShake(false);
      setResultDice(targetIndex + 1);
    }, 2500);

    setTimeout(() => {
      setIsSpinning(false);
      setHasSpun(true);
      setPrizeMessage(`Chúc mừng! Bạn nhận được: ${prize}${rewardMessage ? `\n${rewardMessage}` : ''}\n\nBạn đã hết lượt tung.`);
      setShowResult(true);
    }, 3000);
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    // Reset result states khi đóng modal nhưng giữ hasSpun
    setResultDice(null);
    setDiceShake(false);
    setPrizeMessage('');
    setShowResult(false);
  };

  return (
    <>
      {/* Icon nhỏ ở góc trái */}
      <div className="spin-wheel-icon" onClick={openModal}>
        <div className={`spin-wheel-mini ${hasSpun ? 'used' : ''}`}>
          <div className="spin-wheel-mini-sections">
            {prizes.map((prize, index) => (
              <div
                key={index}
                className="spin-wheel-mini-section"
                style={{
                  transform: `rotate(${index * 90}deg)`,
                  backgroundColor: hasSpun ? '#ccc' : prize.color
                }}
              />
            ))}
          </div>
          <div className="spin-wheel-mini-center">{hasSpun ? '✅' : '🎰'}</div>
        </div>
        <div className="spin-wheel-tooltip">
          {hasSpun ? 'Hết lượt tung' : 'Tung xúc sắc'}
        </div>
      </div>

      {/* Modal lớn */}
      {isModalOpen && (
        <div className="spin-modal-backdrop" onClick={closeModal}>
          <div className="spin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="spin-modal-header">
              <h2>Tung Xúc Sắc</h2>
              <button className="spin-modal-close" onClick={closeModal}>×</button>
            </div>
            <div className="spin-modal-body">
              {hasSpun ? (
                <div className="spin-result-message">
                  <div className="result-celebration">🎉</div>
                  <h3>Kết quả tung xúc sắc</h3>
                  <div className="dice-result-display">
                    <div className="result-number">{resultDice}</div>
                    <div className="result-icon">{prizes[resultDice - 1]?.icon}</div>
                    <div className="result-label">{prizes[resultDice - 1]?.label}</div>
                  </div>
                  <p className="prize-detail">{prizeMessage}</p>
                  <button className="close-result-btn" onClick={closeModal}>Đóng</button>
                </div>
              ) : (
                <>
                  <div className={`dice-container ${diceShake ? 'shaking' : ''}`} onClick={(e) => e.stopPropagation()}>
                    <div className="dice">
                      {resultDice ? (
                        <div className="dice-result">
                          <div className="result-number">{resultDice}</div>
                          <div className="result-label">{prizes[resultDice - 1]?.label}</div>
                          <div className="result-icon">{prizes[resultDice - 1]?.icon}</div>
                        </div>
                      ) : diceShake ? (
                        <div className="dice-rolling"><DiceAnimatingNumber /></div>
                      ) : (
                        <div className="dice-rolling">🎲</div>
                      )}
                    </div>
                  </div>
                  <div className="spin-pointer-large">🎲</div>
                  <button className="spin-button-large" onClick={(e) => { e.stopPropagation(); spin(); }} disabled={isSpinning}>
                    {isSpinning ? 'Đang tung...' : 'Tung ngay!'}
                  </button>
                  <p className="spin-instruction">Nhấn nút để tung xúc sắc may mắn!</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SpinWheel;
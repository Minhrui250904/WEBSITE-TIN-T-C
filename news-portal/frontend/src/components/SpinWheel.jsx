
import React, { useState, useEffect } from 'react';
import './SpinWheel.css';


// Hàm lấy userId/email hiện tại từ authUser prop
function getCurrentUserKey(authUser) {
  if (!authUser) return 'guest';
  return authUser.id ? String(authUser.id) : (authUser.email || 'guest');
}

const SpinWheel = ({ authUser, onSpinRequest }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasSpun, setHasSpun] = useState(false);
  // Không cần state cho thời gian chờ nữa

  const prizes = [
    'Giảm giá nửa giá VIP cho tất cả các gói',
    'Free VIP Bạc',
    'Chúc bạn may mắn lần sau',
    'Giảm giá 5%'
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



  const spin = async () => {
    if (isSpinning || hasSpun) return;
    if (!authUser) {
      alert('Vui lòng đăng nhập để quay thưởng.');
      return;
    }

    let prize = 'Chúc bạn may mắn lần sau';
    let rewardMessage = '';
    let targetIndex = Math.floor(Math.random() * prizes.length);

    setIsSpinning(true);
    // Tạo phản hồi thị giác ngay khi nhấn nút quay
    setRotation((prev) => prev + 720);

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

    const sectionAngle = 360 / prizes.length;
    const targetCenterAngle = targetIndex * sectionAngle + sectionAngle / 2;
    const landingAngle = 360 - targetCenterAngle;
    setRotation((prev) => {
      const base = prev + 1440;
      const normalizedBase = ((base % 360) + 360) % 360;
      const adjust = (landingAngle - normalizedBase + 360) % 360;
      return base + adjust;
    });

    setTimeout(() => {
      setIsSpinning(false);

      setHasSpun(true);

      alert(`Chúc mừng! Bạn nhận được: ${prize}${rewardMessage ? `\n\n${rewardMessage}` : ''}\n\nBạn đã hết lượt quay.`);
    }, 3000);
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      {/* Icon nhỏ ở góc trái */}
      <div className="spin-wheel-icon" onClick={openModal}>
        <div className={`spin-wheel-mini ${hasSpun ? 'used' : ''}`}>
          <div className="spin-wheel-mini-sections">
            {prizes.slice(0, 4).map((_, index) => (
              <div
                key={index}
                className="spin-wheel-mini-section"
                style={{
                  transform: `rotate(${index * 90}deg)`,
                  backgroundColor: hasSpun ? '#ccc' : [
                    '#ff6b6b', // đỏ cho giảm giá VIP
                    '#4ecdc4', // xanh cho Free VIP
                    '#ffd93d', // vàng cho chúc may mắn
                    '#a8e6cf'  // xanh nhạt cho giảm giá 5%
                  ][index]
                }}
              />
            ))}
          </div>
          <div className="spin-wheel-mini-center">{hasSpun ? '✅' : '🎰'}</div>
        </div>
        <div className="spin-wheel-tooltip">
          {hasSpun ? 'Hết lượt quay' : 'Quay thưởng'}
        </div>
      </div>

      {/* Modal lớn */}
      {isModalOpen && (
        <div className="spin-modal-backdrop" onClick={closeModal}>
          <div className="spin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="spin-modal-header">
              <h2>Vòng Quay May Mắn</h2>
              <button className="spin-modal-close" onClick={closeModal}>×</button>
            </div>
            <div className="spin-modal-body">
              {hasSpun ? (
                <div className="spin-used-message">
                  <div className="spin-used-icon">🎉</div>
                  <h3>Hết lượt quay</h3>
                  <p>Bạn chỉ được quay 1 lần duy nhất.</p>
                </div>
              ) : (
                <>
                  <div className="spin-wheel-large" style={{ transform: `rotate(${rotation}deg)` }}>
                    {prizes.map((prize, index) => (
                      <div
                        key={index}
                        className="spin-wheel-large-section"
                        style={{
                          transform: `rotate(${index * 90}deg)`,
                          backgroundColor: [
                            '#ff6b6b', // đỏ cho giảm giá VIP
                            '#4ecdc4', // xanh cho Free VIP
                            '#ffd93d', // vàng cho chúc may mắn
                            '#a8e6cf'  // xanh nhạt cho giảm giá 5%
                          ][index]
                        }}
                      >
                        <span className="prize-text-large">{prize}</span>
                      </div>
                    ))}
                  </div>
                  <div className="spin-pointer-large">▼</div>
                  <button className="spin-button-large" onClick={spin} disabled={isSpinning}>
                    {isSpinning ? 'Đang quay...' : 'Quay ngay!'}
                  </button>
                  <p className="spin-instruction">Nhấn nút để quay bánh xe may mắn!</p>
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
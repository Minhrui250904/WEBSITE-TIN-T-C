import React, { useState, useEffect, useCallback } from 'react';
import PrizeManagement from './PrizeManagement';
import UserManagement from './UserManagement';

const AdminSpinWheelTab = ({ authUser, adminLoading, setAdminLoading, adminError, setAdminError, adminSuccess, setAdminSuccess, onUserRoleUpdated }) => {
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [config, setConfig] = useState(null);
  const [selectedSubTab, setSelectedSubTab] = useState('stats');
  const [resettingUserId, setResettingUserId] = useState(null);

  const fetchSpinWheelStats = useCallback(async () => {
    const token = localStorage.getItem('news_portal_token');
    if (!token) return;

    try {
      setAdminLoading(true);
      const response = await fetch('/api/admin/spin-wheel/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Không thể tải thống kê xúc sắc');
      }

      const data = await response.json();
      setStats(data.stats);
      setAdminError('');
    } catch (err) {
      setAdminError(err.message);
    } finally {
      setAdminLoading(false);
    }
  }, [setAdminLoading, setAdminError]);

  const fetchSpinWheelHistory = useCallback(async (page = 1) => {
    const token = localStorage.getItem('news_portal_token');
    if (!token) return;

    try {
      setAdminLoading(true);
      const response = await fetch(`/api/admin/spin-wheel/history?page=${page}&limit=20`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Không thể tải lịch sử xúc sắc');
      }

      const data = await response.json();
      setHistory(data.history || []);
      setHistoryPage(data.pagination?.page || 1);
      setHistoryTotal(data.pagination?.total || 0);
      setAdminError('');
    } catch (err) {
      setAdminError(err.message);
    } finally {
      setAdminLoading(false);
    }
  }, [setAdminLoading, setAdminError]);

  const fetchSpinWheelConfig = useCallback(async () => {
    const token = localStorage.getItem('news_portal_token');
    if (!token) return;

    try {
      const response = await fetch('/api/admin/spin-wheel/config', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Không thể tải cấu hình xúc sắc');
      }

      const data = await response.json();
      setConfig(data.config);
    } catch (err) {
      console.error('Error fetching config:', err);
    }
  }, []);

  const handleResetUserSpins = useCallback(async (userId) => {
    const confirmed = window.confirm('Bạn chắc chắn muốn reset lượt chơi cho user này?');
    if (!confirmed) return;

    const token = localStorage.getItem('news_portal_token');
    if (!token) return;

    try {
      setResettingUserId(userId);
      const response = await fetch(`/api/admin/spin-wheel/reset/${userId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Không thể reset lượt chơi');
      }

      setAdminSuccess('Đã reset lượt chơi thành công');
      await Promise.all([
        fetchSpinWheelStats(),
        fetchSpinWheelHistory(historyPage)
      ]);
    } catch (err) {
      setAdminError(err.message);
    } finally {
      setResettingUserId(null);
    }
  }, [fetchSpinWheelStats, fetchSpinWheelHistory, historyPage, setAdminSuccess, setAdminError]);

  useEffect(() => {
    if (selectedSubTab === 'stats') {
      fetchSpinWheelStats();
      fetchSpinWheelConfig();
    } else if (selectedSubTab === 'history') {
      fetchSpinWheelHistory(1);
    }
  }, [selectedSubTab, fetchSpinWheelStats, fetchSpinWheelConfig, fetchSpinWheelHistory]);

  return (
    <div className="admin-tab-content">
      <div className="admin-sub-tabs">
        <button 
          className={`admin-sub-tab-btn ${selectedSubTab === 'stats' ? 'active' : ''}`}
          onClick={() => setSelectedSubTab('stats')}
        >
          📊 Thống kê chung
        </button>
        <button 
          className={`admin-sub-tab-btn ${selectedSubTab === 'history' ? 'active' : ''}`}
          onClick={() => setSelectedSubTab('history')}
        >
          📜 Lịch sử chơi
        </button>
        <button 
          className={`admin-sub-tab-btn ${selectedSubTab === 'prizes' ? 'active' : ''}`}
          onClick={() => setSelectedSubTab('prizes')}
        >
          🎁 Quản lý giải thưởng
        </button>
        <button 
          className={`admin-sub-tab-btn ${selectedSubTab === 'config' ? 'active' : ''}`}
          onClick={() => setSelectedSubTab('config')}
        >
          ⚙️ Cấu hình
        </button>
        <button 
          className={`admin-sub-tab-btn ${selectedSubTab === 'users' ? 'active' : ''}`}
          onClick={() => setSelectedSubTab('users')}
        >
          👥 Quản lý người dùng
        </button>
      </div>

      {adminError && (
        <div className="admin-alert admin-alert-error">
          {adminError}
        </div>
      )}

      {adminSuccess && (
        <div className="admin-alert admin-alert-success">
          {adminSuccess}
        </div>
      )}

      {selectedSubTab === 'stats' && (
        <div className="admin-section">
          <h3>Thống kê Mini Game Xúc Sắc</h3>
          
          {stats ? (
            <div className="admin-stats-grid">
              <div className="admin-stat-card">
                <div className="stat-icon">🎲</div>
                <div className="stat-content">
                  <div className="stat-label">Tổng lượt chơi</div>
                  <div className="stat-value">{stats.totalSpins}</div>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-content">
                  <div className="stat-label">Người chơi</div>
                  <div className="stat-value">{stats.totalPlayers}</div>
                  <div className="stat-note">{stats.spinRate}% đã chơi</div>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="stat-icon">🎁</div>
                <div className="stat-content">
                  <div className="stat-label">Tổng giá trị thưởng</div>
                  <div className="stat-value">{stats.totalRewardValue}%</div>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="stat-icon">📈</div>
                <div className="stat-content">
                  <div className="stat-label">Tỷ lệ chơi</div>
                  <div className="stat-value">{stats.spinRate}%</div>
                </div>
              </div>
            </div>
          ) : null}

          {stats && stats.prizeStats && (
            <div className="admin-prizes-breakdown">
              <h4>Chi tiết phân phối giải thưởng</h4>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Giải thưởng</th>
                    <th>Số lượt</th>
                    <th>Tỷ lệ</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(stats.prizeStats).map(([code, prize]) => (
                    <tr key={code}>
                      <td>{prize.label}</td>
                      <td>{prize.count}</td>
                      <td>{stats.totalSpins > 0 ? Math.round((prize.count / stats.totalSpins) * 100) : 0}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {selectedSubTab === 'history' && (
        <div className="admin-section">
          <h3>Lịch sử chơi xúc sắc</h3>
          
          {history.length > 0 ? (
            <>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Giải thưởng</th>
                    <th>Voucher</th>
                    <th>Thời gian</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => (
                    <tr key={`${item.userId}-${item.spunAt}`}>
                      <td>{item.userName}</td>
                      <td className="email-cell">{item.userEmail}</td>
                      <td>
                        <small>{item.prizeLabel}</small>
                      </td>
                      <td>
                        {item.hasDiscount ? (
                          <span className="discount-badge">
                            {item.discountPercent}%
                          </span>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td className="date-cell">
                        {new Date(item.spunAt).toLocaleString('vi-VN')}
                      </td>
                      <td>
                        <button 
                          className="admin-btn admin-btn-sm admin-btn-danger"
                          onClick={() => handleResetUserSpins(item.userId)}
                          disabled={resettingUserId === item.userId}
                        >
                          {resettingUserId === item.userId ? 'Đang xử lý...' : 'Reset'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {historyTotal > 20 && (
                <div className="admin-pagination">
                  <button 
                    onClick={() => fetchSpinWheelHistory(historyPage - 1)}
                    disabled={historyPage <= 1}
                  >
                    ← Trước
                  </button>
                  <span>Trang {historyPage} / {Math.ceil(historyTotal / 20)}</span>
                  <button 
                    onClick={() => fetchSpinWheelHistory(historyPage + 1)}
                    disabled={historyPage >= Math.ceil(historyTotal / 20)}
                  >
                    Sau →
                  </button>
                </div>
              )}
            </>
          ) : (
            <p className="text-muted">Chưa có lịch sử chơi nào</p>
          )}
        </div>
      )}

      {selectedSubTab === 'prizes' && (
        <PrizeManagement 
          authUser={authUser}
          onLoading={setAdminLoading}
          onError={setAdminError}
          onSuccess={setAdminSuccess}
        />
      )}

      {selectedSubTab === 'config' && (
        <div className="admin-section">
          <h3>Cấu hình Mini Game Xúc Sắc</h3>
          
          {config ? (
            <>
              <div className="admin-config-box">
                <h4>Giải thưởng có sẵn</h4>
                <div className="prizes-list">
                  {config.prizes.map((prize) => (
                    <div key={prize.code} className="prize-item">
                      <div className="prize-code">{prize.code}</div>
                      <div className="prize-label">{prize.label}</div>
                      {prize.discountPercent && (
                        <div className="prize-discount">Giảm {prize.discountPercent}%</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="admin-config-info">
                <p><strong>Số lượt chơi tối đa:</strong> {config.maxSpinsPerUser} lượt/người</p>
                <p><strong>Trạng thái:</strong> {config.enabled ? '✅ Đang bật' : '❌ Đang tắt'}</p>
              </div>

              <div className="admin-note">
                <p>⚠️ <strong>Lưu ý:</strong> Cấu hình mini game hiện chỉ có thể thay đổi trong code backend. Liên hệ tech team để cập nhật.</p>
              </div>
            </>
          ) : null}
        </div>
      )}

      {selectedSubTab === 'users' && (
        <UserManagement 
          authUser={authUser}
          adminLoading={adminLoading}
          setAdminLoading={setAdminLoading}
          adminError={adminError}
          setAdminError={setAdminError}
          adminSuccess={adminSuccess}
          setAdminSuccess={setAdminSuccess}
          onUserRoleUpdated={onUserRoleUpdated}
        />
      )}
    </div>
  );
};

export default AdminSpinWheelTab;

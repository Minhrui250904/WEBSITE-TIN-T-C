import React, { useState, useEffect, useCallback } from 'react';

const PrizeManagement = ({ authUser, onLoading, onError, onSuccess }) => {
  const [prizes, setPrizes] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    label: '',
    discountPercent: '',
    vipStatus: ''
  });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchPrizes = useCallback(async () => {
    const token = localStorage.getItem('news_portal_token');
    if (!token) return;

    try {
      onLoading(true);
      const response = await fetch('/api/admin/spin-wheel/prizes', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Không thể tải danh sách giải thưởng');
      }

      const data = await response.json();
      setPrizes(data.prizes || []);
      onError('');
    } catch (err) {
      onError(err.message);
    } finally {
      onLoading(false);
    }
  }, [onLoading, onError]);

  useEffect(() => {
    fetchPrizes();
  }, [fetchPrizes]);

  const resetForm = () => {
    setFormData({
      code: '',
      label: '',
      discountPercent: '',
      vipStatus: ''
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    const token = localStorage.getItem('news_portal_token');
    if (!token) return;

    // Validation
    if (!formData.code || !formData.label) {
      onError('Vui lòng nhập mã giải thưởng và tên giải thưởng');
      return;
    }

    try {
      onLoading(true);
      const url = editingId 
        ? `/api/admin/spin-wheel/prizes/${editingId}` 
        : '/api/admin/spin-wheel/prizes';
      
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          code: formData.code,
          label: formData.label,
          discountPercent: formData.discountPercent ? parseInt(formData.discountPercent) : null,
          vipStatus: formData.vipStatus || null
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || `Lỗi ${response.status}`);
      }

      await fetchPrizes();
      onSuccess(editingId ? 'Cập nhật giải thưởng thành công' : 'Thêm giải thưởng thành công');
      resetForm();
    } catch (err) {
      onError(err.message);
    } finally {
      onLoading(false);
    }
  };

  const handleEdit = (prize) => {
    setFormData({
      code: prize.code,
      label: prize.label,
      discountPercent: prize.discountPercent || '',
      vipStatus: prize.vipStatus || ''
    });
    setEditingId(prize.id);
    setIsAdding(true);
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem('news_portal_token');
    if (!token) return;

    try {
      onLoading(true);
      const response = await fetch(`/api/admin/spin-wheel/prizes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Không thể xóa giải thưởng');
      }

      await fetchPrizes();
      onSuccess('Xóa giải thưởng thành công');
      setDeleteConfirm(null);
    } catch (err) {
      onError(err.message);
    } finally {
      onLoading(false);
    }
  };

  return (
    <div className="admin-section">
      <h3>Quản lý Giải Thưởng Mini Game</h3>

      {!isAdding ? (
        <>
          <button 
            className="admin-btn admin-btn-primary"
            onClick={() => setIsAdding(true)}
          >
            ➕ Thêm Giải Thưởng Mới
          </button>

          <div className="prizes-management-table">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mã Giải</th>
                  <th>Tên Giải Thưởng</th>
                  <th>Giảm Giá (%)</th>
                  <th>VIP Status</th>
                  <th>Hành Động</th>
                </tr>
              </thead>
              <tbody>
                {prizes.length > 0 ? (
                  prizes.map((prize) => (
                    <tr key={prize.id}>
                      <td className="prize-code">
                        <code>{prize.code}</code>
                      </td>
                      <td>{prize.label}</td>
                      <td>{prize.discountPercent || '-'}</td>
                      <td>{prize.vipStatus || '-'}</td>
                      <td className="action-buttons">
                        <button 
                          className="admin-btn admin-btn-sm admin-btn-info"
                          onClick={() => handleEdit(prize)}
                        >
                          ✏️ Sửa
                        </button>
                        <button 
                          className="admin-btn admin-btn-sm admin-btn-danger"
                          onClick={() => setDeleteConfirm(prize.id)}
                        >
                          🗑️ Xóa
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center text-muted">
                      Chưa có giải thưởng nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          <div className="admin-form">
            <h4>{editingId ? 'Cập nhật Giải Thưởng' : 'Thêm Giải Thưởng Mới'}</h4>
            
            <div className="form-group">
              <label>Mã Giải Thưởng *</label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                placeholder="vd: free_vip_silver"
                disabled={editingId !== null}
              />
            </div>

            <div className="form-group">
              <label>Tên Giải Thưởng *</label>
              <textarea
                name="label"
                value={formData.label}
                onChange={handleInputChange}
                placeholder="Mô tả giải thưởng"
                rows="3"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Phần Trăm Giảm Giá</label>
                <input
                  type="number"
                  name="discountPercent"
                  value={formData.discountPercent}
                  onChange={handleInputChange}
                  placeholder="vd: 50"
                  min="0"
                  max="100"
                />
              </div>

              <div className="form-group">
                <label>VIP Status</label>
                <select
                  name="vipStatus"
                  value={formData.vipStatus}
                  onChange={handleInputChange}
                >
                  <option value="">-- Không --</option>
                  <option value="silver">Silver</option>
                  <option value="gold">Gold</option>
                  <option value="platinum">Platinum</option>
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button 
                className="admin-btn admin-btn-primary"
                onClick={handleSave}
              >
                💾 Lưu
              </button>
              <button 
                className="admin-btn admin-btn-secondary"
                onClick={resetForm}
              >
                ❌ Hủy
              </button>
            </div>
          </div>
        </>
      )}

      {deleteConfirm && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <h4>Xác nhận xóa giải thưởng?</h4>
            <p>Hành động này không thể hoàn tác.</p>
            <div className="modal-actions">
              <button 
                className="admin-btn admin-btn-danger"
                onClick={() => handleDelete(deleteConfirm)}
              >
                Xóa
              </button>
              <button 
                className="admin-btn admin-btn-secondary"
                onClick={() => setDeleteConfirm(null)}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrizeManagement;

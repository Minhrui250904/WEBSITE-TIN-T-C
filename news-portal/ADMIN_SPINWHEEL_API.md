# Admin Spin Wheel API Endpoints

Thêm các endpoint sau vào backend/server.js (sau endpoint `/api/admin/invoices`):

```javascript
// ========== ADMIN SPIN WHEEL MANAGEMENT ==========

// GET /api/admin/spin-wheel/stats - Thống kê chung xúc sắc
app.get("/api/admin/spin-wheel/stats", authMiddleware, adminOnlyMiddleware, async (req, res) => {
  try {
    const users = await getAllUsers();
    const usersWithSpinWheel = users.filter(u => u.spinWheel);
    const totalSpins = usersWithSpinWheel.filter(u => u.spinWheel?.used).length;
    
    const prizeStats = {};
    SPIN_WHEEL_PRIZE_POOL.forEach(prize => {
      const count = usersWithSpinWheel.filter(u => u.spinWheel?.prizeCode === prize.code).length;
      prizeStats[prize.code] = {
        label: prize.label,
        count
      };
    });

    const totalPlayers = usersWithSpinWheel.length;
    const totalRewardValue = usersWithSpinWheel.reduce((sum, u) => {
      if (!u.spinWheel) return sum;
      const discount = u.vipDiscount?.percent || 0;
      return sum + (discount > 0 ? discount : 0);
    }, 0);

    res.json({
      stats: {
        totalSpins,
        totalPlayers,
        totalRewardValue,
        prizeStats,
        spinRate: totalPlayers > 0 ? Math.round((totalSpins / totalPlayers) * 100) : 0
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Không thể lấy thống kê xúc sắc" });
  }
});

// GET /api/admin/spin-wheel/history - Lịch sử chơi
app.get("/api/admin/spin-wheel/history", authMiddleware, adminOnlyMiddleware, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const users = await getAllUsers();
    const history = users
      .filter(u => u.spinWheel?.used)
      .map(u => ({
        userId: u.id,
        userName: u.name,
        userEmail: u.email,
        prizeCode: u.spinWheel.prizeCode,
        prizeLabel: u.spinWheel.prizeLabel,
        spunAt: u.spinWheel.spunAt,
        hasDiscount: Boolean(u.vipDiscount),
        discountPercent: u.vipDiscount?.percent || 0
      }))
      .sort((a, b) => new Date(b.spunAt || 0) - new Date(a.spunAt || 0));

    const total = history.length;
    const items = history.slice(offset, offset + limit);

    res.json({
      history: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Không thể lấy lịch sử xúc sắc" });
  }
});

// GET /api/admin/spin-wheel/config - Lấy cấu hình
app.get("/api/admin/spin-wheel/config", authMiddleware, adminOnlyMiddleware, async (req, res) => {
  res.json({
    config: {
      prizes: SPIN_WHEEL_PRIZE_POOL,
      maxSpinsPerUser: 1,
      enabled: true
    }
  });
});

// PUT /api/admin/spin-wheel/reset/:userId - Reset lượt chơi của user
app.put("/api/admin/spin-wheel/reset/:userId", authMiddleware, adminOnlyMiddleware, async (req, res) => {
  const userId = parseInt(req.params.userId);
  if (!Number.isFinite(userId)) {
    return res.status(400).json({ message: "User ID không hợp lệ" });
  }

  try {
    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy user" });
    }

    const updated = await updateUserSpinWheelReward(userId, {
      spinWheel: {
        used: false,
        prizeCode: null,
        prizeLabel: null,
        spunAt: null
      }
    });

    if (!updated) {
      return res.status(500).json({ message: "Không thể reset lượt chơi" });
    }

    res.json({
      message: "Đã reset lượt chơi cho user",
      user: toPublicUser(updated)
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi reset lượt chơi" });
  }
});
```

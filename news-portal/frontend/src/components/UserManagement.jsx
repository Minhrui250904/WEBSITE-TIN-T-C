import React, { useState, useEffect, useCallback } from 'react';

const UserManagement = ({ authUser, adminLoading, setAdminLoading, adminError, setAdminError, adminSuccess, setAdminSuccess, onUserRoleUpdated }) => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [newRole, setNewRole] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const roles = [
    { value: 'user', label: 'Người dùng', description: 'Người dùng thông thường' },
    { value: 'editor', label: 'Biên tập viên', description: 'Có thể tạo và chỉnh sửa bài viết' },
    { value: 'moderator', label: 'Điều hành viên', description: 'Có thể kiểm duyệt và quản lý nội dung' },
    { value: 'admin', label: 'Quản trị viên', description: 'Quyền truy cập đầy đủ' }
  ];

  const fetchUsers = useCallback(async () => {
    const token = localStorage.getItem('news_portal_token');
    if (!token) return;

    try {
      setAdminLoading(true);
      const response = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Không thể tải danh sách người dùng');
      }

      const data = await response.json();
      setUsers(data);
      setAdminError('');
    } catch (err) {
      setAdminError(err.message);
    } finally {
      setAdminLoading(false);
    }
  }, [setAdminLoading, setAdminError]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async () => {
    if (!selectedUser || !newRole) return;

    const token = localStorage.getItem('news_portal_token');
    if (!token) return;

    try {
      setAdminLoading(true);
      const response = await fetch(`/api/admin/users/${selectedUser.id}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Không thể cập nhật quyền');
      }

      setAdminSuccess('Cập nhật quyền thành công');
      setShowRoleModal(false);
      setSelectedUser(null);
      setNewRole('');
      fetchUsers(); // Refresh the list

      // Notify parent to refresh current user
      if (onUserRoleUpdated && selectedUser.id === authUser?.id) {
        onUserRoleUpdated();
      }
    } catch (err) {
      setAdminError(err.message);
    } finally {
      setAdminLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    const token = localStorage.getItem('news_portal_token');
    if (!token) return;

    try {
      setAdminLoading(true);
      const response = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Không thể xóa người dùng');
      }

      setAdminSuccess('Xóa người dùng thành công');
      setShowDeleteModal(false);
      setUserToDelete(null);
      fetchUsers(); // Refresh the list
    } catch (err) {
      setAdminError(err.message);
    } finally {
      setAdminLoading(false);
    }
  };

  const openRoleModal = (user) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setShowRoleModal(true);
  };

  const openDeleteModal = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const getRoleLabel = (role) => {
    const roleObj = roles.find(r => r.value === role);
    return roleObj ? roleObj.label : role;
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'moderator': return 'bg-orange-100 text-orange-800';
      case 'editor': return 'bg-blue-100 text-blue-800';
      case 'user': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Quản lý người dùng</h2>
        <button
          onClick={fetchUsers}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          disabled={adminLoading}
        >
          {adminLoading ? 'Đang tải...' : 'Làm mới'}
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Người dùng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quyền
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày tạo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => openRoleModal(user)}
                      className="text-blue-600 hover:text-blue-900"
                      disabled={user.id === authUser?.id}
                    >
                      Đổi quyền
                    </button>
                    {user.id !== authUser?.id && (
                      <button
                        onClick={() => openDeleteModal(user)}
                        className="text-red-600 hover:text-red-900 ml-4"
                      >
                        Xóa
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Change Modal */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Đổi quyền cho {selectedUser.name}
              </h3>
              <div className="space-y-3">
                {roles.map((role) => (
                  <label key={role.value} className="flex items-center">
                    <input
                      type="radio"
                      name="role"
                      value={role.value}
                      checked={newRole === role.value}
                      onChange={(e) => setNewRole(e.target.value)}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-medium">{role.label}</div>
                      <div className="text-sm text-gray-500">{role.description}</div>
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowRoleModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
                >
                  Hủy
                </button>
                <button
                  onClick={handleRoleChange}
                  disabled={adminLoading || newRole === selectedUser.role}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {adminLoading ? 'Đang cập nhật...' : 'Cập nhật'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Xác nhận xóa người dùng
              </h3>
              <p className="text-gray-600 mb-4">
                Bạn có chắc chắn muốn xóa người dùng <strong>{userToDelete.name}</strong>?
                Hành động này không thể hoàn tác.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
                >
                  Hủy
                </button>
                <button
                  onClick={handleDeleteUser}
                  disabled={adminLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
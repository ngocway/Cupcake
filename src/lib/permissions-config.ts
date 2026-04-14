export interface PermissionNode {
  id: string;
  label: string;
  category: string;
}

export const ADMIN_PERMISSIONS: PermissionNode[] = [
  { id: 'dashboard.view', label: 'Xem Dashboard & Thống kê', category: 'Tổng quan' },
  { id: 'users.view', label: 'Xem danh sách Người dùng', category: 'Người dùng' },
  { id: 'users.manage', label: 'Quản lý/Khóa tài khoản', category: 'Người dùng' },
  { id: 'users.verify', label: 'Xác minh Giáo viên', category: 'Người dùng' },
  { id: 'materials.view', label: 'Xem Bài học/Bài tập', category: 'Nội dung' },
  { id: 'materials.manage', label: 'Kiểm duyệt/Ẩn nội dung', category: 'Nội dung' },
  { id: 'classes.view', label: 'Xem danh sách Lớp học', category: 'Lớp học' },
  { id: 'classes.manage', label: 'Quản lý Lớp học', category: 'Lớp học' },
  { id: 'operations.announcements', label: 'Gửi thông báo Global', category: 'Vận hành' },
  { id: 'operations.support', label: 'Hỗ trợ Ticket', category: 'Vận hành' },
  { id: 'operations.settings', label: 'Cấu hình hệ thống', category: 'Vận hành' },
  { id: 'roles.manage', label: 'Quản lý Phân quyền Admin', category: 'Vận hành' },
];

export function hasPermission(userPermissions: string[], permissionId: string): boolean {
  // Super Admins (no specific role, or all permissions) get everything
  if (userPermissions.includes('all')) return true;
  return userPermissions.includes(permissionId);
}

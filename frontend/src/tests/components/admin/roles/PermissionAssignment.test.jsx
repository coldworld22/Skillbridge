import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import PermissionAssignment from "@/components/admin/roles/PermissionAssignment";
import { toast } from "react-toastify";
import {
  fetchAllPermissions,
  fetchRoleById,
  createPermission,
} from "@/services/admin/roleService";
import useAuthStore from "@/store/auth/authStore";

jest.mock("react-toastify", () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

jest.mock("@/store/auth/authStore", () => jest.fn());

jest.mock("@/services/admin/roleService", () => ({
  fetchAllPermissions: jest.fn(),
  updateRolePermissions: jest.fn(),
  fetchRoleById: jest.fn(),
  createPermission: jest.fn(),
}));

describe("PermissionAssignment - Add Permission", () => {
  const role = { id: 1, name: "Admin" };

  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.mockReturnValue({
      user: { permissions: ["manage_permissions"] },
    });
    fetchAllPermissions.mockResolvedValue([]);
    fetchRoleById.mockResolvedValue({ permissions: [] });
    createPermission.mockResolvedValue({ id: 10, code: "manage_users" });
  });

  const openAddModal = async () => {
    render(<PermissionAssignment role={role} canManage />);

    await waitFor(() => expect(fetchAllPermissions).toHaveBeenCalled());
    await waitFor(() => expect(fetchRoleById).toHaveBeenCalledWith(role.id));

    fireEvent.click(screen.getByText("Add Permission"));
  };

  it("trims whitespace before creating a permission", async () => {
    await openAddModal();

    const input = screen.getByPlaceholderText("e.g. manage_users");
    fireEvent.change(input, { target: { value: "  Manage_Users  " } });

    fireEvent.click(screen.getByText("Add"));

    await waitFor(() =>
      expect(createPermission).toHaveBeenCalledWith({ code: "Manage_Users" })
    );
    expect(toast.success).toHaveBeenCalledWith("Permission created");
  });

  it("prevents creating permissions that are empty after trimming", async () => {
    await openAddModal();

    const input = screen.getByPlaceholderText("e.g. manage_users");
    fireEvent.change(input, { target: { value: "   " } });

    fireEvent.click(screen.getByText("Add"));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Permission code cannot be empty")
    );
    expect(createPermission).not.toHaveBeenCalled();
  });

  it("prevents duplicates when codes only differ by spacing or case", async () => {
    fetchAllPermissions.mockResolvedValue([{ id: 2, code: "manage_users" }]);

    await openAddModal();

    const input = screen.getByPlaceholderText("e.g. manage_users");
    fireEvent.change(input, { target: { value: "  MANAGE_USERS  " } });

    fireEvent.click(screen.getByText("Add"));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Permission already exists")
    );
    expect(createPermission).not.toHaveBeenCalled();
  });
});

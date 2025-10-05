import React from "react";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import RoleManagement from "../RoleManagement";
import useAuthStore from "@/store/auth/authStore";
import {
  fetchAllRoles,
  fetchRoleById,
} from "@/services/admin/roleService";
import { toast } from "react-toastify";

jest.mock("@/utils/logger", () => ({
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

jest.mock("@/services/admin/roleService", () => ({
  fetchAllRoles: jest.fn(),
  fetchRoleById: jest.fn(),
  createRole: jest.fn(),
  updateRole: jest.fn(),
  deleteRole: jest.fn(),
}));

jest.mock("react-toastify", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("../PermissionAssignment", () => ({ role }) => (
  <div data-testid="permission-assignment">{role ? role.name : "no-role"}</div>
));

jest.mock("../AddRoleModal", () => () => null);
jest.mock("../EditRoleModal", () => () => null);

describe("RoleManagement", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    act(() => {
      useAuthStore.setState({ user: { permissions: ["manage_roles"] } });
    });
  });

  afterEach(() => {
    act(() => {
      useAuthStore.setState({ user: null });
    });
  });

  it("shows a toast and keeps the previous selection when fetching a role fails", async () => {
    const roles = [
      { id: "1", name: "Admin" },
      { id: "2", name: "Editor" },
    ];

    fetchAllRoles.mockResolvedValue(roles);
    fetchRoleById
      .mockResolvedValueOnce({ id: "1", name: "Admin" })
      .mockRejectedValueOnce(new Error("network error"));

    render(<RoleManagement />);

    await waitFor(() =>
      expect(screen.getByTestId("permission-assignment")).toHaveTextContent("Admin")
    );

    const editorRole = await screen.findByText("Editor");
    fireEvent.click(editorRole);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to load role");
    });

    expect(screen.getByTestId("permission-assignment")).toHaveTextContent("Admin");
    expect(fetchRoleById).toHaveBeenCalledTimes(2);
  });
});

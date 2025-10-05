import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import PermissionAssignment from "@/components/admin/roles/PermissionAssignment";
import {
  fetchAllPermissions,
  fetchRoleById,
  updateRolePermissions,
} from "@/services/admin/roleService";
import useAuthStore from "@/store/auth/authStore";
import { toast } from "react-toastify";

jest.mock("@/services/admin/roleService", () => ({
  __esModule: true,
  fetchAllPermissions: jest.fn(),
  updateRolePermissions: jest.fn(),
  fetchRoleById: jest.fn(),
  createPermission: jest.fn(),
}));

jest.mock("@/store/auth/authStore", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("react-toastify", () => {
  const toastFn = jest.fn();
  const proxy = new Proxy(toastFn, {
    get(target, prop) {
      if (!(prop in target)) {
        target[prop] = jest.fn();
      }
      return target[prop];
    },
  });

  return { toast: proxy };
});

describe("PermissionAssignment when the permissions catalogue is unavailable", () => {
  const role = { id: 99, name: "Moderator" };

  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.mockReturnValue({ user: { permissions: [] } });
    fetchRoleById.mockResolvedValue({ permissions: ["view_users", "edit_users"] });
  });

  it("renders assigned permissions as read-only and prevents saving without the catalogue", async () => {
    fetchAllPermissions.mockResolvedValue([]);

    render(<PermissionAssignment role={role} canManage />);

    await waitFor(() => expect(fetchAllPermissions).toHaveBeenCalled());
    await waitFor(() => expect(fetchRoleById).toHaveBeenCalledWith(role.id));

    const assignedList = await screen.findByTestId("assigned-permissions-readonly");
    expect(assignedList).toHaveTextContent("view users");
    expect(assignedList).toHaveTextContent("edit users");

    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /check all/i })).not.toBeInTheDocument();

    const saveButton = screen.getByRole("button", { name: /save changes/i });
    expect(saveButton).toHaveAttribute("aria-disabled", "true");

    fireEvent.click(saveButton);

    expect(updateRolePermissions).not.toHaveBeenCalled();
    expect(toast.warn).toHaveBeenCalledWith("Cannot save permissions without a catalogue");
  });
});

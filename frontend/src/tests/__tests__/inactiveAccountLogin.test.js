import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Login from "@/pages/auth/login";
import useAuthStore from "@/store/auth/authStore";
import useNotificationStore from "@/store/notifications/notificationStore";
import useAppConfigStore from "@/store/appConfigStore";

jest.mock("next-i18next", () => ({ useTranslation: () => ({ t: (key) => key }) }));
jest.mock("next/router", () => ({ useRouter: () => ({ replace: jest.fn(), push: jest.fn() }) }));
jest.mock("react-toastify", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock("../../services/socialLoginService", () => ({ fetchSocialLoginConfig: jest.fn().mockResolvedValue({ recaptcha: { active: false } }) }));
jest.mock("../../shared/components/auth/BackgroundAnimation", () => () => <div />);

describe("inactive account login", () => {
  it("shows toast when account is not active", async () => {
    const loginMock = jest.fn().mockRejectedValue({ response: { data: { message: "Account is not active" } } });
    useAuthStore.setState({ login: loginMock, user: null, accessToken: null, hasHydrated: true, logout: jest.fn() });
    useNotificationStore.setState({ fetch: jest.fn() });
    useAppConfigStore.setState({ settings: { appName: "SkillBridge", logo_url: null }, fetch: jest.fn() });

    render(<Login />);

    fireEvent.change(screen.getByPlaceholderText("email"), { target: { value: "test@example.com" } });
    fireEvent.change(screen.getByPlaceholderText("password"), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: "login" }));

    const { toast } = require("react-toastify");
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("account_not_active"));
  });
});

import { getCookie } from "@/utils/cookies";

export const getCsrfToken = () => getCookie("csrfToken");

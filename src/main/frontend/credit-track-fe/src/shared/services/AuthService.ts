import { UserFormData } from "../interface/UserFormData";
import http from "./http";

class AuthService {

      login(username: string, password: string) {
    return http.post("/auth/login", {
      username,
      password,
    });
  }
    register(user: UserFormData){
    return http.post("/auth/register", user);
  }

  logout() {
    return http.post("/auth/logout");
  }

  getUserInfo() {
    return http.get("/auth/me");
  }

  checkTempPassword(email: string,
    tempPassword: string
  ) {
    return http.get("/auth/check-temp-password", { params: { email, tempPassword } });
  }

updateTemporaryPassword(data: { email: string;
  currentPassword: string;
  newPassword: string }) {
    return http.post("/auth/update-temp-password", data);
}

  forgotPassword(email: string) {
    return http.post("/auth/forgot-password", { email });
  }


}

export default new AuthService();
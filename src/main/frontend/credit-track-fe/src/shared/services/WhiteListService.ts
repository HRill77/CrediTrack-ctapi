import { IFilterRequest } from "../interface/IFilterRequest";
import { UserInterface } from "../interface/UserInterface";
import http from "./http";

class WhiteListService {
  getEmailWhiteList(filters: IFilterRequest) {
    return http.post(
      "/email-whitelisting/search",
      {
        searchText: filters.searchText,
        sortField: filters.sortField,
        sortDirection: filters.sortDirection,
      },
      {
        params: {
          pageSize: filters.pageSize,
          page: filters.page,
        },
      },
    );
  }

  checkEmailExists(email: string) {
    return http.get("/email-whitelisting/check-email", {
      params: { email },
    });
  }

  updateUserStatus(userId: number, isActive: boolean) {
    return http.put(`/email-whitelisting/${userId}/status`, {
      isActive: isActive,
    });
  }

  updateWhitelistStatus(emailId: number) {
    return http.put(`/email-whitelisting/status/${emailId}`);
  }

  addEmail(email: string) {
    return http.post("/email-whitelisting/save", {
      email: email,
    });
  }

  getAllActiveWhitelisting() {
    return http.get("/email-whitelisting/list");
  }
}

export default new WhiteListService();

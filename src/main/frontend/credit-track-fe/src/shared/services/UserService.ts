import { IFilterRequest } from "../interface/IFilterRequest";
import { UserInterface } from "../interface/UserInterface";
import http from "./http";

class UserService {
  getUsers(filters: IFilterRequest) {
    return http.post(
      "/users/search",
      {
        searchText: filters.searchText,
        roleId: filters.roleId,
        programId: filters.programId,
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

  getAllRoles() {
    return http.get("/users/role-list");
  }

  getAllPrograms() {
    return http.get("/users/program-list");
  }

  checkEmailExists(email: string) {
    return http.get("/users/check-email", {
      params: { email },
    });
  }

  updateUserStatus(userId: number, isActive: boolean) {
    return http.put(`/users/${userId}/status`, {
      isActive: isActive,
    });
  }

  updateProfile(formData: FormData) {
    return http.post("/users/update-profile", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  }

  updatePassword(email: string, currentPassword: string, newPassword: string) {
    return http.post("/users/update-password", {
      email,
      currentPassword,
      newPassword,
    });
  }
}

export default new UserService();

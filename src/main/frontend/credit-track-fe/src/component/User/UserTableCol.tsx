import React, { useState } from "react";
import { UserInterface } from "../../shared/interface/UserInterface";
import { GridColDef } from "@mui/x-data-grid-pro";
import { userRoleOtions } from "../../shared/Constant/UsersOptions";
import { IOSSwitch } from "../../shared/utils/SwitchToggle";
import { Tooltip, IconButton, Menu, MenuItem, colors } from "@mui/material";
import LockResetIcon from "@mui/icons-material/LockReset";
import SettingsIcon from "@mui/icons-material/Settings";
import UserService from "../../shared/services/UserService";
import { useQueryClient } from "@tanstack/react-query";
import AuthService from "../../shared/services/AuthService";

interface ColumnProps {
  user?: UserInterface[];
  onStatusChange?: (userId: number, isActive: boolean) => void;
  onResetPassword?: (email: string, fullname: string) => void;
}

const UserTableCol = (props: ColumnProps): GridColDef[] => {
  const queryClient = useQueryClient();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const queriesToInvalidate = [
    ["getUsers"],
    ["getAllRoles"],
    ["getAllPrograms"],
  ];

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    userId: number,
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedUserId(userId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUserId(null);
  };

  const handleStatusChange = async (userId: number, isActive: boolean) => {
    try {
      const response = await UserService.updateUserStatus(userId, isActive);
      if (response.status === 200) {
        // Notify parent component of the change
        props.onStatusChange?.(userId, isActive);
        queriesToInvalidate.forEach((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        );
      }
    } catch (error) {
      console.error("Failed to update user status:", error);
    }
  };

  return [
    {
      field: "id",
      headerAlign: "center",
      align: "center",
      headerName: "ID",
      minWidth: 80,
      filterable: false,
      pinnable: false,
    },
    {
      field: "fullName",
      headerName: "Full Name",
      minWidth: 150,
      renderCell: ({ row }: { row: UserInterface }) => {
        return <span>{row.fullName}</span>;
      },
    },
    {
      field: "email",
      headerName: "Email",
      minWidth: 200,
      flex: 1,
    },
    {
      field: "role",
      headerName: "Role",
      minWidth: 120,
      flex: 1,
      renderCell: ({ row }: { row: UserInterface }) => {
        const getRoleLabel = (value: string | null | undefined) => {
          if (!value) return "N/A";
          const option = userRoleOtions.find(
            (option) => option.value === value,
          );
          return option ? option.label : "N/A";
        };
        const roleLabel = getRoleLabel(row.role);
        return <span>{roleLabel}</span>;
      },
    },
    {
      field: "program",
      headerName: "Program",
      minWidth: 150,
      flex: 1.5,
    },
    {
      field: "isActive",
      headerAlign: "center",
      align: "center",
      headerName: "Status",
      resizable: false,
      sortable: false,
      renderCell: ({ row }: { row: UserInterface }) => {
        return (
          <Tooltip title={row.isActive ? "Active" : "Inactive"}>
            <IOSSwitch
              checked={Boolean(row.isActive)}
              onChange={(e) => {
                const checked = e.target.checked;
                handleStatusChange(Number(row.id), checked);
              }}
            />
          </Tooltip>
        );
      },
      minWidth: 150,
    },
    {
      field: "actions",
      headerName: "Actions",
      headerAlign: "center",
      align: "center",
      resizable: false,
      sortable: false,
      renderCell: ({ row }: { row: UserInterface }) => {
        return (
          <>
            <Tooltip title="Actions">
              <IconButton
                size="small"
                sx={{ color: "#064f1e" }}
                onClick={(e) => handleMenuOpen(e, Number(row.id))}
              >
                <SettingsIcon />
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl) && selectedUserId === Number(row.id)}
              onClose={handleMenuClose}
            >
              <MenuItem>
                <Tooltip title="Send Reset Password" placement="right">
                  <IconButton
                    size="small"
                    sx={{
                      color: "#064f1e",
                    }}
                    // onClick={() => handleSendResetPassword(row.email)}
                    onClick={() => {
                      props.onResetPassword?.(row.email, row.fullName);
                    }}
                  >
                    <LockResetIcon />
                  </IconButton>
                </Tooltip>
              </MenuItem>
            </Menu>
          </>
        );
      },
      minWidth: 150,
    },
  ];
};
export default UserTableCol;

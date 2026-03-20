import React from "react";
import { GridColDef } from "@mui/x-data-grid-pro";
import { IOSSwitch } from "../../shared/utils/SwitchToggle";
import { Tooltip } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import WhiteListService from "../../shared/services/WhiteListService";
import { EmailWhiteListInterface } from "../../shared/interface/EmialWhiteListInterface";

interface ColumnProps {
  onWhitelistChange?: (emailId: number, status: boolean) => void;
}

const WhitelistingTable = (props: ColumnProps): GridColDef[] => {
  const queryClient = useQueryClient();

  const queriesToInvalidate = [["getEmailWhitelist"]];

  const handleWhitelistChange = async (emailId: number, status: boolean) => {
    try {
      const response = await WhiteListService.updateWhitelistStatus(
        emailId,
        // status
      );
      if (response.status === 200) {
        props.onWhitelistChange?.(emailId, status);
        queriesToInvalidate.forEach((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        );
      }
    } catch (error) {
      console.error("Failed to update whitelist status:", error);
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
      field: "email",
      headerName: "Email",
      minWidth: 300,
      flex: 1,
    },
    {
      field: "status",
      headerAlign: "center",
      align: "center",
      headerName: "Status",
      resizable: false,
      sortable: false,
      renderCell: ({ row }: { row: EmailWhiteListInterface }) => (
        <Tooltip title={row.status ? "Whitelisted" : "Blocked"}>
          <span>
            <IOSSwitch
              checked={Boolean(row.status)}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleWhitelistChange(Number(row.id), e.target.checked)
              }
            />
          </span>
        </Tooltip>
      ),
      minWidth: 150,
    },
  ];
};

export default WhitelistingTable;

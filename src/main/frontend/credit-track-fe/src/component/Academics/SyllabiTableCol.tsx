import React, { useContext } from "react";
import { GridColDef } from "@mui/x-data-grid-pro";
import { Tooltip } from "@mui/material";
import { SyllabiInterface } from "../../shared/interface/SyllabiInterface";
import { UserInterface } from "../../shared/interface/UserInterface";
import { AuthContext } from "../../shared/context/AuthContext";

interface ColumnProps {
  onViewOutline?: (course: SyllabiInterface) => void;
  actionTemplate: (row: SyllabiInterface) => React.ReactNode;
}

const SyllabiTableCol = (props: ColumnProps): GridColDef[] => {
  const { currentUser } = useContext(AuthContext);
  const isSystemAdmin = currentUser?.authorities?.includes("ROLE_HIDDEN");

  const columns: GridColDef[] = [
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
      field: "courseName",
      headerName: "Course Name",
      minWidth: 200,
      flex: 1,
      renderCell: ({ row }: { row: SyllabiInterface }) => {
        return (
          <Tooltip title={row.courseName}>
            <span>{row.courseName}</span>
          </Tooltip>
        );
      },
    },
    {
      field: "units",
      headerName: "Units",
      minWidth: 100,
      align: "center",
      headerAlign: "center",
      renderCell: ({ row }: { row: SyllabiInterface }) => {
        return <span>{row.units}</span>;
      },
    },
    {
      field: "prerequisite",
      headerName: "Pre-requisite",
      minWidth: 150,
      flex: 1.5,
      renderCell: ({ row }: { row: SyllabiInterface }) => {
        return (
          <Tooltip title={row.prerequisite || "None"}>
            <span>{row.prerequisite || "N/A"}</span>
          </Tooltip>
        );
      },
    },
    {
      field: "description",
      headerName: "Description",
      minWidth: 350,
      flex: 1.5,
      renderCell: ({ row }: { row: SyllabiInterface }) => {
        return (
          <Tooltip title={row.description}>
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                display: "block",
              }}
            >
              {row.description}
            </span>
          </Tooltip>
        );
      },
    },
    {
      field: "courseOutline",
      headerName: "Course Outline",
      minWidth: 100,
      flex: 1,
      headerAlign: "center",
      align: "center",
      renderCell: ({ row }: { row: SyllabiInterface }) => (
        <span
          style={{
            cursor: "pointer",
            color: "#064F1E",
            textDecoration: "underline",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            display: "block",
          }}
          onClick={() => props.onViewOutline?.(row)}
        >
          View Outline
        </span>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      minWidth: 80,
      align: "center",
      headerAlign: "center",
      filterable: false,
      hideable: false,
      pinnable: false,
      sortable: false,
      disableColumnMenu: true,
      renderCell: ({ row }: { row: SyllabiInterface }) =>
        props.actionTemplate(row),
    },
  ];

  return isSystemAdmin ? columns : [];
};

export default SyllabiTableCol;

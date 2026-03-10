import React from 'react'
import { UserInterface } from '../../shared/interface/UserInterface'
import { GridColDef } from "@mui/x-data-grid-pro";
import { userRoleOtions } from '../../shared/Constant/UsersOptions';
import { IOSSwitch } from '../../shared/utils/SwitchToggle';
import { Tooltip } from '@mui/material';
interface ColumnProps {
    user?: UserInterface[];
}

const UserTableCol = (props: ColumnProps): GridColDef[] => {
    return [
        {
            field: 'id',
            headerAlign: 'center',
            align: 'center',
            headerName: 'ID',
            minWidth: 80,
            filterable: false,
            pinnable: false,
            
        },
        {
            field: 'fullName',
            headerName: 'Full Name',
            minWidth: 150,
            renderCell: ({ row }: { row: UserInterface }) => {
                return (
                    <span>{row.fullName}</span>
                );
            }
        },
        {
            field: 'email',
            headerName: 'Email',
            minWidth: 200,
            flex: 1,
        },
        {
            field: 'role',
            headerName: 'Role',
            minWidth: 120,
            flex: 1,
            renderCell: ({ row }: { row: UserInterface }) => {
                const getRoleLabel = (value: string | null | undefined) => {
                    if (!value) return 'N/A';
                    const option = userRoleOtions.find(option => option.value === value);
                    return option ? option.label : 'N/A';
                };
                const roleLabel = getRoleLabel(row.role);
                return (
                    <span>{roleLabel}</span>
                );
            }
        },
        {
            field: 'program',
            headerName: 'Program',
            minWidth: 150,
            flex: 1.5
        },
        {
            field: 'isActive',
            headerAlign: 'center',
            align: 'center',
            headerName: 'Status',
            resizable: false,
            sortable: false,
            renderCell: ({ row }: { row: UserInterface }) => {
                return (
                    <Tooltip title={row.isActive ? "Active" : "Inactive"}>
                        <IOSSwitch
                        checked={Boolean(row.isActive)}
                        onChange={(e) => {
                            const checked = e.target.checked;
                            // call API or update state here
                        }}
                    />
                    </Tooltip>
                );
            },
            minWidth: 150,
        }
    ]
}

export default UserTableCol
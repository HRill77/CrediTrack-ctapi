import React from 'react'
import { GridColDef } from "@mui/x-data-grid-pro";
import { CurriculaInterface } from '../../shared/interface/CurriculaInterface';

interface ColumnProps {
    curricula?: CurriculaInterface;
    actionTemplate: (row: CurriculaInterface) => React.ReactNode;
}

const CurriculaTableCol = (props: ColumnProps): GridColDef[] => {
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
            field: 'programTitle',
            headerName: 'Program Title',
            minWidth: 200,
            filterable: false,
            flex: 1.5,
        },
        {
            field: 'programCode',
            headerName: 'Program Code',
            headerAlign: 'center',
            align: 'center',
            minWidth: 150,
            filterable: false,
            flex: 1,
        },
        {
            field: 'year',
            headerName: 'Year',
            minWidth: 150,
            align: 'center',
            headerAlign: 'center',
            filterable: false,
        },
        {
            field: 'semester',
            headerName: 'Semester',
            minWidth: 120,
            align: 'center',
            headerAlign: 'center',
            filterable: false,
        },
        {
            field: 'courseCode',
            headerName: 'Course Code',
            minWidth: 150,
            filterable: false,
            flex: 1,
        },
        {
            field: 'courseTitle',
            headerName: 'Course Title',
            minWidth: 200,
            filterable: false,
            flex: 1.5,
        },
        {
            field: 'preRequisite',
            headerName: 'Pre-req',
            headerAlign: 'center',
            minWidth: 150,
            align: 'center',
            filterable: false,
            renderCell: ({ row }: { row: CurriculaInterface }) => {
                return (
                    <span>{row.preRequisite === "None" ? "-" : row.preRequisite}</span>
                );
            },
            flex: 1,
        },
        {
            field: 'lec',
            headerName: 'LEC',
            minWidth: 80,
            align: 'center',
            headerAlign: 'center',
            filterable: false,
            flex: 1,
        },
        {
            field: 'lab',
            headerName: 'LAB',
            minWidth: 80,
            align: 'center',
            headerAlign: 'center',
            filterable: false,
            flex: 1,
        },
        {
            field: 'units',
            headerName: 'Units',
            minWidth: 100,
            align: 'center',
            resizable: false,
            filterable: false,
            headerAlign: 'center',
            flex: 1,
        },
        {
            field: 'action',
            headerName: 'Action',
            minWidth: 80,
            align: 'center',
            headerAlign: 'center',
            filterable: false,
            hideable: false,
            pinnable: false,
            sortable: false,
            disableColumnMenu: true,
            renderCell: ({ row }: { row: CurriculaInterface }) => props.actionTemplate(row),
        }
    ]
}

export default CurriculaTableCol

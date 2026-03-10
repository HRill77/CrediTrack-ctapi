import styled from "@emotion/styled";
import { Button, ButtonProps } from "@mui/material";

  export const MainButton = styled(Button)<ButtonProps>(() => ({
    color: '#FFF',
    backgroundColor: '#064F1E',

    '&:hover': {
      color: '#FFF',
      backgroundColor: 'rgba(3, 99, 59, 1)'
    },
  }));

 export const SecondaryButton = styled(Button)<ButtonProps>(() => ({
    color: '#242323ff',
    backgroundColor: '#fff',
    marginLeft: "0 !important",
    borderColor: '#242323ff',
    '&:hover': {
      borderColor: 'rgba(3, 99, 59, 1)',
      color: '#FFF',
      backgroundColor: 'rgba(3, 99, 59, 1)'
    },
  }));

  export const GhostButton = styled(Button)<ButtonProps>(() => ({
    color: '#242323ff',
    backgroundColor: '#fff',
  
    borderColor: '#242323ff',
    '&:hover': {
      // borderColor: 'rgba(3, 99, 59, 1)',
      // color: '#FFF',
      backgroundColor: 'transparent'
    },
  }));


 export const CancelButton = styled(Button)<ButtonProps>(() => ({
    color: '#B40000',
    borderColor: '#B40000',
    margin: "0 !important",
    // borderColor: '#242323ff',
    '&:hover': {
      color: '#FFF',
      backgroundColor: 'rgba(185, 37, 37, 1)'
    },
  }));
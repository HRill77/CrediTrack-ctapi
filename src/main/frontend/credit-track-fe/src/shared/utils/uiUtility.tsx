import React, { forwardRef } from 'react';
import { Dialog, Slide } from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import { styled } from '@mui/material/styles';

export const SlideDownTransition = forwardRef(function SlideDownTransition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="down" ref={ref} {...props} unmountOnExit />;
});

export const scrollToSection = (
  ref: React.RefObject<HTMLDivElement>
) => {
  ref.current?.scrollIntoView({ behavior: 'smooth' });
};


export const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialogContent-root': {
    padding: theme.spacing(2),
  },
  '& .MuiDialogActions-root': {
    padding: theme.spacing(1),
  },
  
 
}));

export const phPhoneNumberFormat = (digits: string) =>{
  if(!digits) return '+63';
  let formatted = '+63 ' + digits.slice(0,3);
  if(digits.length >3){
    formatted += '-' + digits.slice(3,6);
  }
  if(digits.length >6){
    formatted += '-' + digits.slice(6,10);
  }
  return formatted; 
}

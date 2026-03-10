import React, { createContext, useState, ReactNode } from 'react';

interface MenuContextType {
  selectedMenuItem: string;
  setSelectedMenuItem: (menu: string) => void;
}

export const MenuContext = createContext<MenuContextType>({
  selectedMenuItem: 'dashboard',
  setSelectedMenuItem: () => {},
});

export const MenuProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedMenuItem, setSelectedMenuItem] = useState('dashboard');

  return (
    <MenuContext.Provider value={{ selectedMenuItem, setSelectedMenuItem }}>
      {children}
    </MenuContext.Provider>
  );
};

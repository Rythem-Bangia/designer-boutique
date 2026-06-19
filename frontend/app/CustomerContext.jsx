"use client";
import { createContext, useContext, useState, useEffect } from 'react';

const CustomerContext = createContext();

export function CustomerProvider({ children }) {
  const [customer, setCustomer] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('boutique_customer');
    if (saved) setCustomer(JSON.parse(saved));
  }, []);

  const loginCustomer = (data) => {
    setCustomer(data);
    localStorage.setItem('boutique_customer', JSON.stringify(data));
  };

  const logoutCustomer = () => {
    setCustomer(null);
    localStorage.removeItem('boutique_customer');
  };

  return (
    <CustomerContext.Provider value={{ customer, loginCustomer, logoutCustomer }}>
      {children}
    </CustomerContext.Provider>
  );
}

export const useCustomer = () => useContext(CustomerContext);
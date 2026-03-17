"use client";

import { createContext, useContext, useState, useCallback } from "react";
import ReservationModal from "./ReservationModal";

/**
 * 예약 모달 Context
 *
 * 사이트 어디서든 useReservation() 훅으로 모달을 열 수 있음.
 * HeroSection, CTASection 등에서 사용.
 */

interface ReservationContextValue {
  openReservation: () => void;
}

const ReservationContext = createContext<ReservationContextValue>({
  openReservation: () => {},
});

export function useReservation() {
  return useContext(ReservationContext);
}

export default function ReservationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const openReservation = useCallback(() => setIsOpen(true), []);
  const closeReservation = useCallback(() => setIsOpen(false), []);

  return (
    <ReservationContext.Provider value={{ openReservation }}>
      {children}
      <ReservationModal isOpen={isOpen} onClose={closeReservation} />
    </ReservationContext.Provider>
  );
}

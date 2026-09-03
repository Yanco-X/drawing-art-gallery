import { useContext } from 'react';
import { SocialsContext } from '../contexts/socials-context';
import type { SocialsContextValue } from '../contexts/socials-context';

export const useSocials = (): SocialsContextValue => {
  const context = useContext(SocialsContext);
  if (!context) {
    throw new Error('useSocials must be used within a SocialsProvider');
  }
  return context;
};

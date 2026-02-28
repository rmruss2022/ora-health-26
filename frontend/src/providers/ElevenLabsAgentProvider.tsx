import React, { ReactNode } from 'react';
import { ElevenLabsProvider } from '@elevenlabs/react-native';

export function ElevenLabsAgentProvider({ children }: { children: ReactNode }) {
  return <ElevenLabsProvider>{children}</ElevenLabsProvider>;
}

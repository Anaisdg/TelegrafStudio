import { ReactNode } from 'react';
import { TelegrafConfig, Node, Connection } from '@shared/schema';

export interface TelegrafConfigContextType {
  telegrafConfig: TelegrafConfig;
  setTelegrafConfig: (config: TelegrafConfig) => void;
  selectedNode: Node | null;
  setSelectedNode: (node: Node | null) => void;
  selectedConnection: Connection | null;
  setSelectedConnection: (connection: Connection | null) => void;
}

export function TelegrafConfigProvider({ children }: { children: ReactNode }): JSX.Element;
export function useTelegrafConfig(): TelegrafConfigContextType;
export default function useTelegrafConfig(): TelegrafConfigContextType;
import { GameState } from '@/lib/types';
import styles from './GameControls.module.css';

interface GameControlsProps {
  state: GameState;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
}

export default function GameControls({ state, onPause, onResume, onReset }: GameControlsProps) {
  return (
    <div className={styles.controls}>
      {state === GameState.PLAYING && (
        <button onClick={onPause}>Pause</button>
      )}
      {state === GameState.PAUSED && (
        <button onClick={onResume}>Resume</button>
      )}
      {state !== GameState.IDLE && (
        <button onClick={onReset}>Reset</button>
      )}
    </div>
  );
}

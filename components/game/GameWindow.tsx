import styles from './GameWindow.module.css';

interface GameWindowProps {
  children: React.ReactNode;
}

export default function GameWindow({ children }: GameWindowProps) {
  return (
    <div className={styles.window}>
      {children}
    </div>
  );
}

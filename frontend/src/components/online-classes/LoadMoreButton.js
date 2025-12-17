import React from 'react';
import styles from './onlineClasses.module.scss';

function LoadMoreButton({ onClick, isLoading, hasMore }) {
  return (
    <div className={styles.loadMore}>
      {hasMore ? (
        <button
          onClick={onClick}
          disabled={isLoading}
          className={styles.primaryButton}
        >
          {isLoading ? 'Loading...' : 'Load More'}
        </button>
      ) : (
        <p className={styles.muted}>No more classes to load.</p>
      )}
    </div>
  );
}

export default LoadMoreButton;

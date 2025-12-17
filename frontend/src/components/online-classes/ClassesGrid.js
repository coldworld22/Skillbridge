import React from 'react';
import ClassCard from './ClassCard';
import styles from './onlineClasses.module.scss';

function ClassesGrid({ classes }) {
  if (!classes || classes.length === 0) {
    return (
      <div className={styles.emptyState}>
        No classes found.
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {classes.map((item, index) => (
        <ClassCard key={index} classData={item} index={index} />
      ))}
    </div>
  );
}

export default ClassesGrid;

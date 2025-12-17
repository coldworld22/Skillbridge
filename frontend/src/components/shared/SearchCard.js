import styles from "./SearchCard.module.scss";

const SearchCard = ({ item }) => {
  return (
    <div className={styles.card}>
      <img src={item.image} alt={item.title} className={styles.image} />
      <h2 className={styles.title}>{item.title}</h2>
      <p className={styles.description}>{item.description}</p>
    </div>
  );
};

export default SearchCard;

export default function Home() {
  return null;
}

export const getServerSideProps = () => ({
  redirect: {
    destination: "/website",
    permanent: false,
  },
});

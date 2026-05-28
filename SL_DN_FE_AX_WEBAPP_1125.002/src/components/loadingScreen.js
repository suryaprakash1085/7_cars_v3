export default function LoadingScreen({ Dialogue }) {
  return (
    <div style={styles.loaderContainer}>
      <div style={styles.loader}></div>
      <h3 style={styles.title}>{Dialogue}</h3>
      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

const styles = {
  loaderContainer: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    background: "transparent",
    overflow: "hidden",
  },
  loader: {
    marginTop: "10px",
    border: "6px solid rgba(255, 255, 255, 0.2)",
    borderTop: "6px solid #fff",
    borderRadius: "50%",
    width: "50px",
    height: "50px",
    animation: "spin 1.5s linear infinite",
  },
  title: {
    fontSize: "1.5rem",
    color: "#fff",
    // fontWeight: "bold",
  },
};

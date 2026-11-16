export function Spinner({ light = false, size = 18 }) {
  return (
    <span
      className={light ? "spinner spinner--light" : "spinner"}
      style={{ width: size, height: size }}
      role="status"
      aria-label="Loading"
    />
  );
}

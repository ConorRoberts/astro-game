export const Button = () => {
  return (
    <button
      onClick={() => {
        const searchParams = new URLSearchParams();

        searchParams.set("id", "stinky");
        fetch(`/something?${searchParams.toString()}`);
      }}
    >
      Something
    </button>
  );
};

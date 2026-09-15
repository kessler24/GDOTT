export default function HighlightedWords({
  text,
  start,
  end,
}: {
  text: string;
  start: number;
  end: number;
}) {
  const words = text.split(" ");
  return (
    <>
      {words.map((word, i) => (
        <span key={i}>
          <span className={i >= start && i <= end ? "rounded bg-yellow-200" : undefined}>
            {word}
          </span>
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </>
  );
}

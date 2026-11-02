export const starsFor = (score: number, max: number) => (max === 0 ? 3 : score / max >= 0.9 ? 3 : score / max >= 0.7 ? 2 : 1);

export function Stars({ n, of = 3 }: { n: number; of?: number }) {
  return (
    <span className="stars" aria-label={`${n} of ${of} stars`}>
      {Array.from({ length: of }, (_, i) => (
        <span key={i} className={i < n ? 'on' : ''}>
          ★
        </span>
      ))}
    </span>
  );
}

export default function Stub({ name, stage }: { name: string; stage: string }) {
  return (
    <div className="mx-auto max-w-md px-4 pt-10 text-center">
      <h1 className="text-[26px] text-rr-hi">{name}</h1>
      <p className="mt-2 text-rr-dim">Jald aa raha hai ({stage}).</p>
    </div>
  );
}


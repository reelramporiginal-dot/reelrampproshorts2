import { useNavigate, useParams } from 'react-router-dom';

// DRAFT text for the app. Final wording needs advocate sign-off before public launch (Bible section 13, stage S9).
const PAGES: Record<string, { title: string; body: string[] }> = {
  privacy: {
    title: 'Privacy Policy',
    body: [
      'Hum sirf wahi data lete hain jo app chalane ke liye zaroori hai: login email/naam, aapka watch progress, My List, coins aur payment status.',
      'Payment details (card/UPI) hum save nahi karte; wo payment partner (Cashfree) ke paas rehti hain.',
      'Aap apna data delete ya export karne ki request Profile > Madad se bhej sakte hain.',
    ],
  },
  terms: {
    title: 'Terms of Use',
    body: [
      'App ka content sirf aapke niji, non-commercial dekhne ke liye hai. Copy, download ya re-upload allowed nahi.',
      'Coins aur plans is app ke andar hi use hote hain aur cash me badle nahi ja sakte.',
      'Galat tareeke se coins ya access lene par account band kiya ja sakta hai.',
    ],
  },
  refund: {
    title: 'Refund aur Cancellation',
    body: [
      'Abhi plans one-time hain, auto-debit nahi hota. Plan ki date khatam hote hi wo apne aap band ho jata hai.',
      'Payment hone ke baad bhi access na mile to Profile > Madad se hamein batayein; hum check karke refund ya access dete hain.',
      'Use kiye ja chuke coins/unlock wapas nahi hote.',
    ],
  },
};

export default function Policy() {
  const { slug = '' } = useParams();
  const nav = useNavigate();
  const p = PAGES[slug];
  return (
    <div className="mx-auto max-w-md px-[18px] pt-6">
      <button onClick={() => nav(-1)} className="mb-3 min-h-11 text-rr-hi">← Wapas</button>
      <h1 className="text-[28px]">{p ? p.title : 'Nahi mila'}</h1>
      {p?.body.map((t, i) => <p key={i} className="mt-3 text-[16px] text-rr-tx">{t}</p>)}
      {p && <p className="mt-6 text-[13px] text-rr-dim">Ye abhi draft hai; launch se pehle final kiya jayega.</p>}
    </div>
  );
}

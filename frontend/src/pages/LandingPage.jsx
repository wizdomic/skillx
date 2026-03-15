import { useNavigate } from 'react-router-dom'

const SKILLS = ['Python', 'Guitar', 'Spanish', 'React', 'Piano', 'Figma', 'Yoga', 'Chess', 'French', 'Photography', 'Drawing', 'Machine Learning']

export default function LandingPage() {
  const nav = useNavigate()
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <nav className="border-b border-gray-100 px-6 h-14 flex items-center justify-between max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center">
            <span className="text-white font-bold text-xs">S</span>
          </div>
          <span className="font-bold text-gray-500">SkillX</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => nav('/login')} className="btn btn-ghost btn-md">Sign in</button>
          <button onClick={() => nav('/signup')} className="btn btn-primary btn-md">Get started</button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 border border-orange-100 text-orange-600 text-xs font-semibold px-3 py-1.5 rounded-full mb-6" style={{ background: 'var(--bg)' }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-gray-500" />
          100% credit-based · no money needed
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold text-gray-500 leading-tight tracking-tight mb-5">
          Teach what you know.<br />
          <span className="text-orange-500">Learn what you love.</span>
        </h1>
        <p className="text-gray-500 text-lg max-w-lg mx-auto mb-8">
          A peer-to-peer skill exchange. Every session you teach earns credits. Spend them to learn anything from anyone.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <button onClick={() => nav('/signup')} className="btn btn-primary btn-lg">Start for free →</button>
          <button onClick={() => nav('/login')} className="btn btn-white btn-lg">Sign in</button>
        </div>
      </div>

      <div className="border-y border-gray-100 py-4 overflow-hidden mb-20">
        <div className="flex gap-3 animate-[marquee_25s_linear_infinite] whitespace-nowrap">
          {[...SKILLS, ...SKILLS].map((s, i) => (
            <span key={i} className="px-4 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-black text-sm flex-shrink-0">{s}</span>
          ))}
        </div>
        <style>{`@keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}`}</style>
      </div>

      <div className="max-w-4xl mx-auto px-6 pb-20">
        <h2 className="text-center text-2xl font-bold text-gray-500 mb-10">How it works</h2>
        <div className="grid sm:grid-cols-3 gap-5">
          {[
            { n: '1', title: 'Set up your profile', desc: 'Tell us what you can teach and want to learn. Takes 2 minutes.' },
            { n: '2', title: 'Get matched', desc: 'Our algorithm finds people whose skills complement yours.' },
            { n: '3', title: 'Exchange & grow', desc: 'Book live sessions, earn credits teaching, spend them learning.' },
          ].map(s => (
            <div key={s.n} className="card p-6">
              <div className="w-8 h-8 rounded-full bg-orange-500 text-white text-sm font-bold flex items-center justify-center mb-4">{s.n}</div>
              <h3 className="font-semibold text-gray-500 mb-1.5">{s.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-xl mx-auto px-6 pb-20 text-center">
        <div className="card p-10">
          <h2 className="text-2xl font-bold text-gray-500 mb-2">Ready to start?</h2>
          <p className="text-gray-500 text-sm mb-6">Free forever. No credit card needed.</p>
          <button onClick={() => nav('/signup')} className="btn btn-primary btn-lg w-full sm:w-auto">
            Create free account →
          </button>
        </div>
      </div>

      <footer className="border-t border-gray-100 py-6 text-center text-gray-400 text-xs">
        © {new Date().getFullYear()} SkillX
      </footer>
    </div>
  )
}
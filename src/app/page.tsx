import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍽️</span>
            <span className="font-black text-xl text-gray-900">Res<span className="text-blue-600">Vysion</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#features" className="hover:text-gray-900">Functies</a>
            <a href="#pricing" className="hover:text-gray-900">Prijzen</a>
            <a href="#demo" className="hover:text-gray-900">Demo</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">Inloggen</Link>
            <Link href="/register" className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700">
              Gratis proberen
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
            🚀 Het slimste reserveringssysteem voor horeca
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-gray-900 leading-tight mb-6">
            Meer gasten.<br />
            <span className="text-blue-600">Geen no-shows.</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
            ResVysion is het complete reserveringsplatform voor restaurants, cafés en horecazaken.
            Tafelplan, online boeking, gasten CRM en no-show bescherming — alles in één.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="px-8 py-4 bg-blue-600 text-white rounded-2xl text-lg font-black hover:bg-blue-700 shadow-xl shadow-blue-200">
              30 dagen gratis proberen →
            </Link>
            <a href="#demo" className="px-8 py-4 bg-white text-gray-900 rounded-2xl text-lg font-bold border-2 border-gray-200 hover:border-gray-300">
              Bekijk demo
            </a>
          </div>
          <p className="mt-4 text-sm text-gray-400">Geen creditcard nodig • Directe toegang • Cancel wanneer je wil</p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6 bg-gray-900">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { num: '40%', label: 'minder no-shows' },
            { num: '2x', label: 'meer online boekingen' },
            { num: '100%', label: 'jouw data' },
            { num: '0%', label: 'commissie' },
          ].map(s => (
            <div key={s.label}>
              <p className="text-4xl font-black text-white">{s.num}</p>
              <p className="text-gray-400 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">Alles wat je nodig hebt</h2>
            <p className="text-xl text-gray-500">Vier krachtige modules, één platform</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                icon: '🗺️',
                title: 'Digitaal Tafelplan',
                desc: 'Sleep en klik je tafels op de juiste plek. Zie in één oogopslag welke tafels bezet, gereserveerd of vrij zijn. Voeg secties toe per zaal.',
                color: 'bg-blue-50 border-blue-200',
                items: ['Drag & drop tafelindeling', 'Meerdere secties/zalen', 'Realtime bezetting', 'Walk-in direct inplannen'],
              },
              {
                icon: '📱',
                title: 'Online Boeking',
                desc: 'Klanten reserveren 24/7 via jouw website. Jij bepaalt de capaciteit per tijdslot, welke dagen en hoeveel mensen per tafel.',
                color: 'bg-green-50 border-green-200',
                items: ['Eigen reservatiepagina', 'Max. per tijdslot instellen', 'Auto-bevestiging', 'Email & WhatsApp confirmatie'],
              },
              {
                icon: '👤',
                title: 'Gasten CRM',
                desc: 'Ken je gasten. Zie wie je vaste klanten zijn, hoeveel keer ze al kwamen, hun voorkeuren en hun reservatiehistoriek.',
                color: 'bg-purple-50 border-purple-200',
                items: ['Volledig gastenprofiel', 'Reservatiehistoriek', 'Vaste gasten badge', 'Zoek op naam/telefoon'],
              },
              {
                icon: '🛡️',
                title: 'No-show Bescherming',
                desc: 'Stop met geld verliezen aan gasten die niet opdagen. Automatische waarschuwing en blokkering na herhaalde no-shows.',
                color: 'bg-red-50 border-red-200',
                items: ['No-show teller per gast', 'Automatische waarschuwing', 'Blokkering na X no-shows', 'Volledige no-show historiek'],
              },
            ].map(f => (
              <div key={f.title} className={`rounded-3xl border-2 p-8 ${f.color}`}>
                <div className="text-5xl mb-4">{f.icon}</div>
                <h3 className="text-2xl font-black text-gray-900 mb-3">{f.title}</h3>
                <p className="text-gray-600 mb-5">{f.desc}</p>
                <ul className="space-y-2">
                  {f.items.map(item => (
                    <li key={item} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="text-green-500 font-bold">✓</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vergelijking met Zenchef */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-black text-gray-900 mb-4">Waarom ResVysion?</h2>
          <p className="text-gray-500 text-lg mb-12">Dezelfde features als grote spelers — voor een eerlijke prijs</p>

          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="grid grid-cols-3 text-center">
              <div className="p-5 bg-gray-50 text-sm font-semibold text-gray-500 uppercase tracking-wide">Feature</div>
              <div className="p-5 bg-blue-600 text-white font-black text-lg">ResVysion</div>
              <div className="p-5 bg-gray-50 text-sm font-semibold text-gray-500">Anderen</div>
            </div>
            {[
              ['Digitaal tafelplan', '✅', '✅'],
              ['Online reservaties', '✅', '✅'],
              ['Gasten CRM', '✅', '✅'],
              ['No-show bescherming', '✅', '✅'],
              ['WhatsApp bevestiging', '✅', '❌'],
              ['Geen commissie', '✅', '❌'],
              ['Jouw eigen data', '✅', '❌'],
              ['Prijs per maand', '€149', '€249+'],
            ].map(([feature, ours, theirs]) => (
              <div key={feature} className="grid grid-cols-3 text-center border-t border-gray-100">
                <div className="p-4 text-left text-sm text-gray-700 font-medium">{feature}</div>
                <div className="p-4 bg-blue-50 text-blue-700 font-bold">{ours}</div>
                <div className="p-4 text-gray-400">{theirs}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-black text-gray-900 mb-4">Eerlijke prijzen</h2>
          <p className="text-gray-500 text-lg mb-12">Geen verborgen kosten. Geen commissie. Nooit.</p>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Starter */}
            <div className="bg-white rounded-3xl border-2 border-gray-200 p-8 text-left">
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">Starter</p>
              <p className="text-5xl font-black text-gray-900 mb-1">€99<span className="text-2xl text-gray-400 font-normal">/maand</span></p>
              <p className="text-gray-500 text-sm mb-6">Voor kleinere zaken</p>
              <ul className="space-y-3 mb-8">
                {['Online reservaties', 'Tafelplan (tot 20 tafels)', 'Gasten CRM', 'No-show bescherming', 'Email bevestigingen'].map(f => (
                  <li key={f} className="flex items-center gap-3 text-sm text-gray-700">
                    <span className="text-green-500 font-bold text-base">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link href="/register?plan=starter" className="block text-center py-3 border-2 border-gray-900 rounded-xl font-bold hover:bg-gray-900 hover:text-white transition-colors">
                Probeer 30 dagen gratis
              </Link>
            </div>

            {/* Pro */}
            <div className="bg-blue-600 rounded-3xl p-8 text-left text-white relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-yellow-400 text-gray-900 text-xs font-black px-3 py-1 rounded-full">POPULAIRSTE</div>
              <p className="text-sm font-bold text-blue-200 uppercase tracking-wide mb-2">Pro</p>
              <p className="text-5xl font-black mb-1">€149<span className="text-2xl text-blue-300 font-normal">/maand</span></p>
              <p className="text-blue-200 text-sm mb-6">Voor professionele restaurants</p>
              <ul className="space-y-3 mb-8">
                {[
                  'Alles van Starter',
                  'Onbeperkte tafels',
                  'WhatsApp bevestigingen',
                  'Meerdere zalen/secties',
                  'Geavanceerde statistieken',
                  'Prioriteit support',
                ].map(f => (
                  <li key={f} className="flex items-center gap-3 text-sm text-white">
                    <span className="text-yellow-400 font-bold text-base">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link href="/register?plan=pro" className="block text-center py-3 bg-white text-blue-600 rounded-xl font-black hover:bg-blue-50 transition-colors">
                Probeer 30 dagen gratis →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-blue-600">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-black text-white mb-4">Klaar om te starten?</h2>
          <p className="text-blue-200 text-lg mb-8">30 dagen gratis proberen. Geen creditcard nodig.</p>
          <Link href="/register" className="inline-block px-10 py-5 bg-white text-blue-600 rounded-2xl text-xl font-black hover:bg-blue-50 shadow-2xl">
            Start nu gratis →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-gray-900 text-center">
        <p className="text-gray-500 text-sm">© 2026 ResVysion — Een product van Vysion Horeca</p>
      </footer>

    </main>
  )
}

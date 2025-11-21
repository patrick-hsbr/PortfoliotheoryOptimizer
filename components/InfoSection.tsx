import React from 'react';

export const InfoSection: React.FC = () => {
  return (
    <div className="space-y-8 max-w-4xl mx-auto text-slate-700 mt-12 mb-24">
      
      <section className="bg-white p-8 rounded-xl shadow-md border-l-4 border-blue-500">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Grundlagen der Portfoliotheorie und -analyse</h2>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-blue-600 mb-2">Erwartete Rendite (μ)</h3>
            <p className="mb-4 text-sm leading-relaxed">
              Die erwartete Rendite beschreibt, welchen Ertrag ein Wertpapier im Durchschnitt liefern soll. 
              Sie wird häufig aus historischen Daten abgeleitet. Wichtig: Die Vergangenheit ist kein Garant für die Zukunft.
            </p>

            <h3 className="text-lg font-semibold text-blue-600 mb-2">Risiko / Volatilität (σ)</h3>
            <p className="mb-4 text-sm leading-relaxed">
              Das Risiko wird über die Volatilität beschrieben. Sie misst die Schwankungsbreite der Renditen.
              Hohe Volatilität = Hohe Unsicherheit.
            </p>
          </div>
          
          <div>
             <h3 className="text-lg font-semibold text-blue-600 mb-2">Korrelation (ρ)</h3>
             <p className="mb-4 text-sm leading-relaxed">
               Zeigt, wie ähnlich sich zwei Wertpapiere bewegen.
             </p>
             <ul className="list-disc list-inside text-sm mb-4 pl-2">
               <li><span className="font-semibold text-red-500">+1</span>: Identische Bewegung (Keine Diversifikation)</li>
               <li><span className="font-semibold text-slate-500">0</span>: Unabhängige Entwicklung</li>
               <li><span className="font-semibold text-green-500">-1</span>: Gegenläufige Bewegung (Stabilisierung)</li>
             </ul>

            <h3 className="text-lg font-semibold text-blue-600 mb-2">Sharpe Ratio</h3>
            <p className="mb-4 text-sm leading-relaxed">
              Setzt Rendite ins Verhältnis zum Risiko. Eine hohe Sharpe Ratio bedeutet viel Ertrag pro Risikoeinheit.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-slate-100 p-8 rounded-xl border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Interpretation der Ergebnisse</h2>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-bold text-slate-800">Efficient Frontier (Effizienzlinie)</h4>
            <p className="text-sm">
              Die gekrümmte Linie (Simulierte Portfolios) zeigt alle theoretisch möglichen Kombinationen. Portfolios auf der oberen Kante sind "effizient", da sie für ein gegebenes Risiko die maximale Rendite bieten.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold text-slate-800">w_MV (Min Varianz)</h4>
            <p className="text-sm">
              Das Portfolio ganz links auf der Kurve. Es minimiert das absolute Schwankungsrisiko, unabhängig von der Rendite. Ideal für sehr sicherheitsbewusste Anleger.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-800">w_mu (Max Sharpe)</h4>
            <p className="text-sm">
              Das Tangentialportfolio. Hier ist das Verhältnis von Ertrag zu Risiko am besten. Es liegt dort, wo die Capital Market Line (CML) die Effizienzlinie berührt.
            </p>
          </div>
        </div>
      </section>

      <div className="text-center text-sm text-slate-500 italic">
        "Die Theorie kann deine Gewichtung optimieren – aber sie sucht dir keine optimalen Aktien. Ein optimiertes Portfolio aus Drecksaktien bleibt am Ende trotzdem ein Haufen Drecksaktien."
      </div>
    </div>
  );
};